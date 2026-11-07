"""Progression, combat, evolution and browser-contract tests for the prototype."""
import json
import math
import random
import unittest

from geomayhem import Enemy, Geomayhem, LEVELS, MAX_GEMS, MAX_SHOTS, Shot, catalog
from geomayhem_weapons import ARMORY, TRAITS, WEAPONS
from web.bridge import BrowserGame


def enemy(x=80, y=0, hp=1000, identity=1):
    return Enemy(identity, x, y, hp, 0, 12, "chaser", hp)


class GeomayhemTests(unittest.TestCase):
    def game(self, level=1, weapon="needle"):
        game = Geomayhem(level, weapon, random.Random(42))
        game.break_left = 100
        return game

    def test_all_200_waves_end_in_exactly_ten_level_victories(self):
        self.assertEqual(len(LEVELS), 10)
        for level in range(1, 11):
            game = self.game(level)
            for wave in range(1, 21):
                self.assertEqual(game.wave, wave)
                self.assertFalse(game.won)
                game.spawned = 0
                game._spawn()
                if wave % 5 == 0:
                    self.assertEqual(game.enemies[0].kind, "boss" if wave == 20 else "elite")
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

    def test_32_weapons_all_damage_enemies_at_each_evolution_and_change_art(self):
        self.assertEqual(len(ARMORY), 32)
        signatures = {(w.kind, w.trait, w.third, w.fifth) for w in WEAPONS}
        self.assertEqual(len(signatures), 32)
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
                    art.append(json.dumps(game.snapshot()["commands"][-5:]))
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
            shot = Shot(305, 0, 310, 0, 10, "needle", 3, {trait}, age=.6)
            game.shots = [shot]
            game._update_shots(.05)
            self.assertLess(shot.vx, 0, trait)

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
        self.assertEqual(game.lives, 90)
        game.update(.05, set())
        self.assertEqual(game.lives, 90)
        game.invulnerable, game.lives = 0, 1
        game.update(.05, set())
        self.assertFalse(game.alive)
        self.assertEqual(game.lives, 0)
        before = game.snapshot()
        game.update(.05, {"f"})
        self.assertEqual(game.snapshot(), before)
        self.assertEqual(self.game().stars, 1)
        self.assertEqual(self.game().lives, 100)

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
        result = session.dispatch({"action": "start", "mode": "geomayhem", "difficulty": "level_10", "weapon": "sun"})
        self.assertEqual(result["level"], 10)
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
            session.dispatch({"action": "start", "mode": "geomayhem", "difficulty": "level_11"})
        with self.assertRaises(ValueError):
            Geomayhem(1, "missing")


if __name__ == "__main__":
    unittest.main()
