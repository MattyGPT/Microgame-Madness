"""Progression, combat, evolution and browser-contract tests for the prototype."""
import json
import math
import random
import unittest

from geomayhem import Enemy, Geomayhem, LEVELS, MAX_GEMS, MAX_SHOTS, Shot, catalog
from geomayhem_weapons import ARMORY, ITEM_WEAPONS, TRAITS, WEAPONS
from web.bridge import BrowserGame


def enemy(x=80, y=0, hp=1000, identity=1):
    return Enemy(identity, x, y, hp, 0, 12, "chaser", hp)


class GeomayhemTests(unittest.TestCase):
    def test_later_weapons_hit_targets_at_extended_range(self):
        for weapon, distance in [('bomb', 280), ('blade_bot', 280), ('heart', 220)]:
            with self.subTest(weapon=weapon):
                game = Geomayhem(1, weapon, random.Random(42))
                game.stars = 5
                target = enemy(x=distance)
                game.enemies = [target]
                game.fire()
                for _ in range(50):
                    game._update_shots(.025)
                self.assertLess(target.hp, target.max_hp)

    def game(self, level=1, weapon="needle"):
        game = Geomayhem(level, weapon, random.Random(42))
        game.break_left = 100
        return game

    def test_opening_drafts_offer_varied_companions_and_handheld_paths(self):
        companions = set()
        for seed in range(80):
            game = Geomayhem(rng=random.Random(seed))
            game.xp = game.xp_needed
            game.update(0, set())
            options = [ARMORY[o["id"].split(":")[1]] for o in game.offers if o["id"].startswith("acquire:")]
            self.assertEqual(len(game.offers), 4)
            self.assertEqual(len(options), 2)
            self.assertEqual(sum(w.automatic for w in options), 1)
            companions.update(w.id for w in options if w.automatic)
        self.assertEqual(companions, set(ITEM_WEAPONS))

    def test_pending_upgrade_counter_counts_current_and_banked_choices(self):
        game = self.game()
        game.xp = 12 + 20 + 27
        game.update(0, set())
        for pending in (3, 2, 1):
            self.assertEqual(game.snapshot()["pending_levelups"], pending)
            self.assertTrue(game.choose("weapon"))
        self.assertEqual(game.pending_levelups, 0)

    def test_browser_streams_background_once_and_keeps_compact_combat_geometry(self):
        session = BrowserGame()
        start = session.dispatch({"action":"start", "mode":"geomayhem", "difficulty":"level_14",
                                  "campaign":{"cleared":13,"unlocked_level":14}})
        self.assertTrue(start["background"])
        self.assertTrue(any(c["kind"] == "geomayhem_weapon" for c in start["commands"]))
        tick = session.dispatch({"action":"tick", "dt":.02, "keys":["Right","f"]})
        self.assertNotIn("background", tick)
        self.assertGreater(tick["player"]["x"], start["player"]["x"])
        self.assertLess(len(json.dumps(tick)), len(json.dumps(session.game.snapshot()))*.6)
        restarted = session.dispatch({"action":"start", "mode":"geomayhem", "difficulty":"level_1"})
        self.assertNotEqual(start["background"], restarted["background"])
        self.assertEqual(restarted["player"]["x"], 0)

    def test_all_arena_backgrounds_and_boss_patterns_are_distinct(self):
        from geomayhem_arenas import queue_pattern
        art, patterns, names = set(), set(), set()
        for level in range(1, 21):
            game = self.game(level)
            art.add(json.dumps(game.snapshot()["commands"]))
            queue_pattern(game, boss=True, phase=2)
            patterns.add(json.dumps(game.zones, sort_keys=True))
            names.add(game.snapshot()["arena"]["boss"])
            self.assertTrue(all(z["warning"] >= .9 for z in game.zones))
        self.assertEqual((len(art),len(patterns),len(names)), (20,20,20))

    def test_new_arena_patterns_leave_reachable_safe_ground_and_limit_frequency(self):
        from geomayhem_arenas import contains, queue_pattern
        for level in range(11, 21):
            for phase in ((1, 2, 3) if level == 20 else (1, 2)):
                for position in ((0, 0), (-440, -325), (440, 325)):
                    game = self.game(level)
                    game.x, game.y = position
                    queue_pattern(game, boss=True, phase=phase)
                    distance = game.speed * min(z["warning"] for z in game.zones) * .9
                    candidates = [(game.x, game.y)] + [
                        (game.x + math.cos(i*math.tau/32)*distance*f,
                         game.y + math.sin(i*math.tau/32)*distance*f)
                        for i in range(32) for f in (.2, .4, .6, .8, 1)]
                    self.assertTrue(any(
                        game.left+13 <= x <= game.right-13 and game.bottom+13 <= y <= game.top-13
                        and not any(contains(z,x,y,13) for z in game.zones)
                        for x,y in candidates), (level,phase,position))
            game.wave, game.break_left, game.zone_in = 3, 0, 0
            game._update_zones(.01)
            self.assertGreaterEqual(game.zone_in, 4.5)

    def test_zone_warnings_are_safe_freeze_during_choices_and_damage_afterward(self):
        from geomayhem_arenas import queue_pattern
        game = self.game()
        queue_pattern(game)
        for _ in range(20): game.update(.05, set())
        self.assertEqual(game.lives, 100)
        game.xp = game.xp_needed
        game.update(0, set())
        warning = game.zones[0]["warning"]
        for _ in range(30): game.update(.05, set())
        self.assertEqual(game.zones[0]["warning"], warning)
        game.choose("weapon")
        for _ in range(5): game.update(.05, set())
        self.assertEqual(game.lives, 88)
        game.spawned = game.quota
        game.update(.01,set())
        self.assertEqual(game.zones, [])

    def test_charge_has_a_locked_warning_and_bosses_resist_repeated_freezes(self):
        game = self.game()
        game.wave = 4
        runner = enemy(160, 0)
        runner.kind = "runner"
        runner.skill_in = 0
        self.assertTrue(game._enemy_skill(runner,.01))
        target = runner.dash_target
        game.x,game.y = -200,150
        for _ in range(10): game._enemy_skill(runner,.05)
        self.assertEqual((runner.x,runner.y),(160,0))
        self.assertEqual(runner.dash_target,target)
        for _ in range(6): game._enemy_skill(runner,.05)
        self.assertLess(runner.x,160)
        self.assertEqual(runner.y,0)
        boss=enemy();boss.kind="boss"
        game._hurt(boss,1,{"freeze"})
        self.assertEqual(boss.frozen,.2)
        boss.frozen=.1
        game._hurt(boss,1,{"freeze"})
        self.assertEqual(boss.frozen,.1)

    def test_all_400_waves_end_in_exactly_twenty_level_victories(self):
        self.assertEqual(len(LEVELS), 20)
        for level in range(1, 21):
            game = self.game(level)
            for wave in range(1, 21):
                self.assertEqual(game.wave, wave)
                self.assertFalse(game.won)
                game.spawned = 0
                game._spawn()
                if wave % 5 == 0:
                    self.assertEqual(game.enemies[0].kind, "boss" if wave == 20 else "elite")
                game.boss_intro_left = 0  # This test fast-forwards the entire encounter.
                game.enemies.clear()
                game.spawned = game.quota
                game.update(.01, set())
                self.assertEqual(game.cleared, wave)
            self.assertTrue(game.won)
            self.assertEqual(game.wave, 20)
            frozen = game.snapshot()
            game.update(1, {"Right", "f"})
            self.assertEqual(game.snapshot(), frozen)

    def test_wave_waits_for_last_enemy_and_final_spawn(self):
        game = self.game()
        game.spawned = game.quota - 1
        game.update(.05, set())
        self.assertEqual(game.wave, 1)
        game.spawned = game.quota
        game.enemies = [enemy()]
        game.update(.05, set())
        self.assertEqual(game.wave, 1)
        game.enemies.clear()
        game.update(.05, set())
        self.assertEqual(game.wave, 2)
        self.assertGreater(game.break_left, 0)

    def test_wave_clear_collects_all_xp_and_offers_earned_upgrades(self):
        game = self.game()
        game.gems = [[200, 150, game.xp_needed], [-400, -300, 3]]
        game.spawned = game.quota
        game.update(.01, set())
        self.assertEqual(game.wave, 2)
        self.assertEqual(game.xp, 3)
        self.assertEqual(game.gems, [])
        self.assertEqual(game.rank, 2)
        self.assertTrue(game.offers)

    def test_defeated_enemies_leave_only_xp_and_do_not_equip_weapons(self):
        game = self.game()
        game.enemies = [enemy(250, 200, hp=0, identity=i) for i in range(24)]
        game.update(.01, set())
        self.assertEqual(game.kills, 24)
        self.assertEqual(len(game.gems), 24)
        self.assertEqual(sum(g[2] for g in game.gems), 72)
        self.assertEqual(game.loadout, {"needle": 1})
        self.assertFalse(any(c.get("text") == "Walk over to equip" for c in game.snapshot()["commands"]))
        game.x, game.y = 250, 200
        game.update(.01, set())
        self.assertEqual(game.loadout, {"needle": 1})
        choice = next(o["id"] for o in game.offers if o["id"].startswith("acquire:"))
        self.assertTrue(game.choose(choice))
        self.assertEqual(game.loadout, {"needle": 1, choice.split(":")[1]: 1})

    def test_larger_map_keeps_combat_and_rendering_beyond_old_edges(self):
        game = self.game()
        self.assertEqual(game.right - game.left, 620 * 1.5)
        self.assertEqual(game.top - game.bottom, 470 * 1.5)
        game.x, game.y = 400, 300
        game.enemies = [enemy(420, 300)]
        game.shots = [Shot(405, 300, 0, 0, 10, "needle", 1, {"pierce"})]
        game.hazards = [[430, 300, 0, 0, 5]]
        game.update(.01, {"Right"})
        self.assertGreater(game.x, 400)
        self.assertEqual(game.enemies[0].hp, 990)
        self.assertEqual(len(game.shots), 1)
        self.assertEqual(len(game.hazards), 1)
        self.assertEqual(game.snapshot()["commands"][0]["coords"], [-465, -352.5, 465, 352.5])

    def test_move_normalizes_diagonals_clamps_edges_and_keeps_facing(self):
        straight, diagonal = self.game(), self.game()
        straight.update(.05, {"Right"})
        diagonal.update(.05, {"Right", "Up"})
        self.assertAlmostEqual(straight.x, math.hypot(diagonal.x, diagonal.y))
        facing = diagonal.face
        diagonal.update(.05, set(), (-200, -200))
        self.assertEqual(diagonal.face, facing)
        for _ in range(100):
            diagonal.update(.05, {"Right", "Up"})
        self.assertLessEqual(diagonal.x + 15, diagonal.right)
        self.assertLessEqual(diagonal.y + 15, diagonal.top)

    def test_fire_is_manual_and_aim_is_independent_of_cubie_face(self):
        game = self.game()
        for _ in range(10):
            game.update(.05, {"Left"}, (200, 0))
        self.assertEqual(game.shots_fired, 0)
        game.update(.05, {"f"}, (200, 0))
        self.assertEqual(game.shots_fired, 1)
        self.assertGreater(game.shots[0].vx, 0)
        self.assertEqual(game.face, (-1, 0))
        game.update(.05, {"f"}, (200, 0))
        self.assertEqual(game.shots_fired, 1)

    def test_45_weapons_all_damage_enemies_at_each_evolution_and_change_art(self):
        self.assertEqual(len(ARMORY), 45)
        signatures = {(w.kind, w.trait, w.third, w.fifth) for w in WEAPONS}
        self.assertEqual(len(signatures), 45)
        for weapon in WEAPONS:
            art = []
            self.assertEqual(len({weapon.trait, weapon.third, weapon.fifth}), 3)
            for stars in (1, 3, 5):
                with self.subTest(weapon=weapon.id, stars=stars):
                    game = self.game(weapon=weapon.id)
                    game.stars = stars
                    game.enemies = [enemy(75, 0), enemy(110, 20, identity=2)]
                    game.update(.05, {"f"}, (75, 0))
                    for _ in range(25):
                        game.update(.05, set(), (75, 0))
                    self.assertTrue(any(e.hp < e.max_hp for e in game.enemies))
                    self.assertEqual(len(weapon.traits(stars)), (1, 2, 3)[(1, 3, 5).index(stars)])
                    appearance = self.game(weapon=weapon.id)
                    appearance.stars = stars
                    art.append(json.dumps(appearance.snapshot()["commands"]))
            self.assertEqual(len(set(art)), 3)

    def test_hit_effects_chain_blast_status_split_pull_and_heal(self):
        for trait in ("chain", "blast", "slow", "freeze", "burn", "pull", "split", "lifesteal"):
            with self.subTest(trait=trait):
                game = self.game()
                game.lives = 50
                first, second = enemy(), enemy(100, identity=2)
                game.enemies = [first, second]
                game._hit(first, Shot(80, 0, 0, 0, 10, "needle", 5, {trait}))
                self.assertEqual(first.hp, 990)
                if trait in ("chain", "blast"):
                    self.assertLess(second.hp, 1000)
                elif trait == "slow":
                    self.assertGreater(first.slow, 0)
                elif trait == "freeze":
                    self.assertGreater(first.frozen, 0)
                elif trait == "burn":
                    game.update(.05, set())
                    self.assertLess(first.hp, 990)
                elif trait == "pull":
                    self.assertLess(second.x, 100)
                elif trait == "split":
                    self.assertEqual(len(game.shots), 3)
                    self.assertTrue(all("split" not in s.traits for s in game.shots))
                elif trait == "lifesteal":
                    self.assertGreater(game.lives, 50)

    def test_projectile_traits_pierce_home_bounce_and_return(self):
        game = self.game()
        game.enemies = [enemy(20, identity=1), enemy(30, identity=2)]
        game.shots = [Shot(20, 0, 0, 0, 10, "needle", 1, {"pierce"})]
        game._update_shots(.01)
        self.assertTrue(all(e.hp == 990 for e in game.enemies))
        self.assertEqual(len(game.shots), 1)
        for trait in ("homing", "return", "ricochet"):
            shot = Shot(game.right - 5, 0, 310, 0, 10, "needle", 3, {trait}, age=.6)
            game.shots = [shot]
            game._update_shots(.05)
            self.assertLess(shot.vx, 0, trait)

    def test_higher_xp_costs_require_the_full_amount_at_each_rank(self):
        game = self.game()
        for cost in (12, 20, 27, 35):
            game.xp = cost - 1
            game.update(.01, set())
            self.assertEqual(game.offers, [])
            self.assertEqual(game.snapshot()["xp_needed"], cost)
            game.xp += 1
            game.update(.01, set())
            self.assertTrue(game.offers)
            self.assertEqual(game.xp, 0)
            self.assertTrue(game.choose("weapon"))

    def test_xp_pauses_world_offers_weapon_until_five_and_rejects_stale_choices(self):
        game = self.game()
        for star in range(2, 6):
            game.xp = game.xp_needed
            game.update(.01, set())
            before = game.snapshot()
            game.update(.05, {"Right", "f"})
            self.assertEqual(game.snapshot(), before)
            self.assertFalse(game.choose("invented"))
            self.assertTrue(game.choose("weapon"))
            self.assertEqual(game.stars, star)
            self.assertFalse(game.choose("weapon"))
        game.xp = game.xp_needed
        game.update(.01, set())
        self.assertNotIn("weapon", [o["id"] for o in game.offers])
        self.assertFalse(game.choose("weapon"))
        self.assertEqual(game.stars, 5)

    def test_contact_invulnerability_death_and_restart(self):
        game = self.game()
        game.enemies = [enemy(0, 0)]
        game.update(.05, set())
        self.assertEqual(game.lives, 85)
        game.update(.05, set())
        self.assertEqual(game.lives, 85)
        game.invulnerable, game.lives = 0, 1
        game.update(.05, set())
        self.assertFalse(game.alive)
        self.assertEqual(game.lives, 0)
        before = game.snapshot()
        game.update(.05, {"f"})
        self.assertEqual(game.snapshot(), before)
        self.assertEqual(self.game().stars, 1)
        self.assertEqual(self.game().lives, 100)

    def test_stronger_elite_boss_and_projectile_damage(self):
        for kind in ("elite", "boss"):
            with self.subTest(kind=kind):
                game = self.game()
                target = enemy(0, 0)
                target.kind = kind
                game.enemies = [target]
                game.update(.01, set())
                self.assertEqual(game.lives, 70 if kind == "boss" else 76)
                self.assertEqual(game.damage_taken, 30 if kind == "boss" else 24)
        game = self.game()
        game.hazards = [[0, 0, 0, 0, 5]]
        game.update(.01, set())
        self.assertEqual(game.lives, 88)
        self.assertEqual(game.damage_taken, 12)

    def test_levelups_add_companions_and_other_weapons_without_replacing_the_starter(self):
        game = self.game()
        for _ in range(2):
            game.xp = game.xp_needed
            game.update(.01, set())
            choice = next(o["id"] for o in game.offers if o["id"].startswith("acquire:"))
            expected = choice.split(":")[1]
            self.assertTrue(ARMORY[expected].automatic)
            self.assertTrue(game.choose(choice))
            self.assertEqual(game.loadout[expected], 1)
            self.assertEqual(game.loadout["needle"], 1)
            self.assertFalse(game.choose(f"acquire:{expected}"))
        game.xp = game.xp_needed
        game.update(.01, set())
        self.assertTrue(game.choose(next(o["id"] for o in game.offers if o["id"].startswith("acquire:"))))
        game.xp = game.xp_needed
        game.update(.01, set())
        self.assertEqual(len(game.loadout), 4)
        self.assertTrue(all(not o["id"].startswith("acquire:") for o in game.offers))
        self.assertFalse(game.choose("acquire:comet"))
        self.assertEqual(game.weapon, "needle")
        self.assertEqual(len(game.snapshot()["loadout"]), 4)
        self.assertEqual(self.game().loadout, {"needle": 1})

    def test_all_equipped_weapons_fire_on_their_own_cooldown(self):
        game = self.game()
        game.loadout["comet"] = 3
        game.cooldowns["comet"] = 0
        game.update(.01, {"f"}, (200, 0))
        self.assertEqual({s.weapon for s in game.shots}, {"needle", "comet"})
        self.assertEqual({s.weapon: s.stars for s in game.shots}, {"needle": 1, "comet": 3})
        self.assertNotEqual(game.cooldowns["comet"], game.cooldowns["needle"])
        fired = game.shots_fired
        for _ in range(20):
            game.update(.05, set())
        self.assertEqual(game.shots_fired, fired)
        game.update(.01, {"f"}, (200, 0))
        self.assertEqual(game.shots_fired, fired + 2)

    def test_drones_follow_cubie_attack_without_fire_and_freeze_during_choices(self):
        game = self.game()
        for key in ("drone_a", "drone_b"):
            game.loadout[key] = 1
            game.cooldowns[key] = 0
        game.enemies = [enemy(160)]
        position = game.companion_position("drone_a")
        game.update(.05, {"Right"})
        self.assertNotEqual(game.companion_position("drone_a"), position)
        self.assertNotEqual(game.companion_position("drone_a"), game.companion_position("drone_b"))
        self.assertEqual({s.weapon for s in game.shots}, {"drone_a", "drone_b"})
        self.assertEqual(game.stars, 1)
        game.xp = game.xp_needed
        game.update(.01, set())
        before = game.snapshot()
        game.update(.05, {"Right", "f"})
        self.assertEqual(game.snapshot(), before)

    def test_companion_stars_evolve_independently_and_stop_at_five(self):
        game = self.game()
        game.stars = 5
        game.loadout["drone_a"] = 1
        game.cooldowns["drone_a"] = 0
        for star in range(2, 6):
            game.xp = game.xp_needed
            game.update(.01, set())
            self.assertTrue(game.choose("upgrade:drone_a"))
            self.assertEqual(game.loadout["drone_a"], star)
            self.assertEqual(game.stars, 5)
        game.xp = game.xp_needed
        game.update(.01, set())
        self.assertFalse(game.choose("upgrade:drone_a"))
        self.assertFalse(any(o["id"].startswith("upgrade:") for o in game.offers))
        game.fire("drone_a")
        self.assertEqual(game.shots[-1].traits, {"homing", "split", "blast"})

    def test_all_twelve_item_weapons_attack_automatically_and_evolve_to_five(self):
        self.assertEqual(len(ITEM_WEAPONS), 12)
        self.assertEqual(sum(w.companion for w in WEAPONS), 10)
        for key in ITEM_WEAPONS:
            with self.subTest(item=key):
                game = self.game()
                game.stars = 5
                self.assertTrue(game._equip(key))
                art = [json.dumps(game.snapshot()["commands"])]
                for star in range(2, 6):
                    game.xp = game.xp_needed
                    game.update(0, set())
                    self.assertTrue(game.choose(f"upgrade:{key}"))
                    self.assertEqual(game.loadout[key], star)
                    self.assertEqual(game.stars, 5)
                    if star in (3, 5):
                        art.append(json.dumps(game.snapshot()["commands"]))
                        self.assertIn(ARMORY[key].third if star == 3 else ARMORY[key].fifth,
                                      ARMORY[key].traits(star))
                self.assertEqual(len(set(art)), 3)
                game.xp = game.xp_needed
                game.update(0, set())
                self.assertFalse(game.choose(f"upgrade:{key}"))
                self.assertFalse(any(o["id"].startswith("upgrade:") for o in game.offers))
                game.choose(game.offers[-1]["id"])
                game.enemies = [enemy(75, 0), enemy(110, 20, identity=2)]
                for _ in range(30):
                    game.update(.05, set())
                self.assertGreater(game.shots_fired, 0)
                self.assertTrue(any(e.hp < e.max_hp for e in game.enemies))
                self.assertTrue(all(s.weapon != "needle" for s in game.shots))

    def test_new_items_are_available_in_levelups_and_four_companions_have_distinct_positions(self):
        seen = set()
        for seed in range(300):
            game = self.game()
            game.rng = random.Random(seed)
            game._equip("drone_a")
            game._equip("drone_b")
            game.rank = 4
            game.xp = game.xp_needed
            game.update(0, set())
            seen.update(o["id"].split(":", 1)[1] for o in game.offers if o["id"].startswith("acquire:"))
        self.assertTrue((set(ITEM_WEAPONS) - {"drone_a", "drone_b"}) <= seen)
        game = self.game(weapon="drone_a")
        for key in ("drone_b", "frost_orb", "tesla_coil"):
            self.assertTrue(game._equip(key))
        self.assertEqual(len({game.companion_position(key) for key in game.loadout}), 4)
        self.assertFalse(game._equip("solar_shield"))

    def test_starting_with_a_drone_offers_a_different_companion(self):
        game = self.game(weapon="drone_b")
        game.xp = game.xp_needed
        game.update(.01, set())
        choice = next(o["id"] for o in game.offers if o["id"].startswith("acquire:"))
        self.assertTrue(game.choose(choice))
        self.assertEqual(len(game.loadout), 2)
        self.assertTrue(ARMORY[choice.split(":")[1]].automatic)

    def test_pickup_and_entity_caps_preserve_xp(self):
        game = self.game()
        game.gems = [[300, 200, 3] for _ in range(MAX_GEMS)]
        game.enemies = [enemy(0, 0, hp=0)]
        game.update(.01, set())
        self.assertEqual(len(game.gems), MAX_GEMS)
        self.assertEqual(sum(g[2] for g in game.gems), 3 * (MAX_GEMS + 1))
        for _ in range(MAX_SHOTS + 10):
            game._add_shot(Shot(0, 0, 0, 0, 1, "needle", 1, set()))
        self.assertEqual(len(game.shots), MAX_SHOTS)

    def test_bridge_catalog_pause_upgrade_and_input_validation(self):
        session = BrowserGame()
        self.assertEqual(session.dispatch({"action": "geomayhem_options"}), catalog())
        result = session.dispatch({"action": "start", "mode": "geomayhem", "difficulty": "level_20", "weapon": "sun", "campaign": {"cleared": 19, "unlocked_level": 20}})
        self.assertEqual(result["level"], 20)
        session.dispatch({"action": "pause"})
        result = session.dispatch({"action": "tick", "dt": 100, "keys": ["Right", "f"]})
        self.assertEqual(result["fight_elapsed"], 0)
        session.dispatch({"action": "pause"})
        result = session.dispatch({"action": "tick", "dt": 100, "keys": ["Right"], "aim": ["bad", 0]})
        self.assertEqual(result["fight_elapsed"], .05)
        session.game.xp = session.game.xp_needed
        session.dispatch({"action": "tick", "dt": .01})
        result = session.dispatch({"action": "upgrade", "choice": "weapon"})
        self.assertEqual(result["weapon"]["stars"], 2)
        with self.assertRaises(ValueError):
            session.dispatch({"action": "start", "mode": "geomayhem", "difficulty": "level_21"})
        with self.assertRaises(ValueError):
            Geomayhem(1, "missing")

    def test_campaign_locks_starters_and_levels_and_applies_permanent_workshop(self):
        session = BrowserGame()
        for difficulty, weapon in (("level_2", "needle"), ("level_1", "drone_a")):
            with self.assertRaises(ValueError):
                session.dispatch({"action": "start", "mode": "geomayhem", "difficulty": difficulty, "weapon": weapon})
        state = session.dispatch({"action": "start", "mode": "geomayhem", "difficulty": "level_2",
                                  "campaign": {"cleared": 1, "unlocked_level": 2,
                                               "workshop": {"vitality": 2, "power": 1, "magnet": 3}}})
        self.assertEqual(state["lives"], 120)
        self.assertEqual(session.game.magnet, 88)
        self.assertEqual(session.game.damage_multiplier, 1.05)
        self.assertEqual(session.game.loadout, {"needle": 1})
        self.assertEqual(session.game.relics, set())
        with self.assertRaises(ValueError):
            Geomayhem(campaign={"workshop": {"power": 100}})

    def test_relics_change_combat_and_rerolls_never_spend_xp_or_advance_rank(self):
        from geomayhem import RELICS
        game = self.game()
        game.xp = game.xp_needed
        game.update(0, set())
        rank, xp = game.rank, game.xp
        self.assertTrue(game.reroll())
        self.assertTrue(game.reroll())
        self.assertFalse(game.reroll())
        self.assertEqual((game.rank, game.xp, game.rerolls), (rank, xp, 0))
        game.choose("weapon")
        game.xp = game.xp_needed
        game.update(0, set())
        self.assertTrue(any(o["id"].startswith("relic:") for o in game.offers))
        for key in RELICS:
            game = self.game()
            game.offers = [{"id": f"relic:{key}"}]
            self.assertTrue(game.choose(f"relic:{key}"))
            game.fire()
            if key == "glass":
                self.assertEqual(game.max_lives, 80)
                self.assertAlmostEqual(game.shots[0].damage, 6.75)
            elif key == "siphon":
                self.assertIn("lifesteal", game.shots[0].traits)
            elif key == "winter":
                self.assertIn("slow", game.shots[0].traits)
            elif key == "echo":
                self.assertEqual(len(game.shots), 2)
                self.assertEqual(game.shots[0].damage, 4.25)
            elif key == "fleet":
                self.assertEqual(game.speed, 205)
            elif key == "reach":
                self.assertEqual(game.magnet, 122)
            self.assertFalse(game.choose(f"relic:{key}"))
        self.assertEqual(self.game().relics, set())
        self.assertEqual(self.game().rerolls, 2)


if __name__ == "__main__":
    unittest.main()
