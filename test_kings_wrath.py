"""Attack practice skips the awakening and uses the full fight's real rules."""
import random
import unittest

from boss_crush import Projectile
from kings_wrath import KingsWrath, RANDOM_ORDER, WRATH_ATTACKS, WRATH_READY_TIME
from pumpkin_king import ATTACK_NAMES, BABY_MODE, PumpkinKing


class KingsWrathTests(unittest.TestCase):
    def test_achievement_attack_count_advances_only_after_a_complete_pattern(self):
        game = KingsWrath("bone_gauntlet")
        game.invulnerable = 1000
        self.assertEqual(game.attacks_completed, 0)
        game.update(WRATH_READY_TIME, set())
        self.assertEqual(game.attacks_completed, 0)
        game.update(5.99, set())
        self.assertEqual(game.attacks_completed, 0)
        game.update(.01, set())
        self.assertEqual(game.attacks_completed, 1)
        self.assertEqual(game.stage.name, "wrath_break")
        game.update(WRATH_READY_TIME, set())
        self.assertEqual(game.attacks_completed, 1)
        game.hp = 5
        game.shots = [Projectile(game.boss_x, game.boss_y, 0, 520)]
        game.update(.01, set())
        self.assertTrue(game.won)
        self.assertEqual(game.attacks_completed, 1)

    def test_random_order_plays_all_seven_before_reshuffling_without_adjacent_repeats(self):
        game = KingsWrath(RANDOM_ORDER, rng=random.Random(12))
        order = [game.attack_index]
        self.assertEqual((game.lives, game.max_lives, game.hp), (15, 15, 1400))
        self.assertEqual(game.difficulty, RANDOM_ORDER)
        for _ in range(6000):
            game.invulnerable = 1000
            game.update(.05, set())
            self.assertTrue(game.alive)
            if game.attack_index != order[-1]:
                self.assertNotEqual(game.stage.name, "wrath_ready")
                order.append(game.attack_index)
            if len(order) == 21:
                break
        else:
            self.fail("Random Order did not reach three shuffled sets")
        for offset in range(0, len(order), 7):
            self.assertEqual(sorted(order[offset:offset+7]), list(range(7)))
        self.assertNotEqual(order[:7], list(range(7)))
        self.assertNotEqual(order[:7], order[7:14])
        self.assertTrue(all(a != b for a, b in zip(order, order[1:])))

    def test_random_order_preserves_health_and_freezes_during_its_countdown(self):
        game = KingsWrath(RANDOM_ORDER, rng=random.Random(12))
        self.assertIn("GET READY — 3", game.pattern_label)
        self.assertIn(ATTACK_NAMES[game.attack_index], game.pattern_label)
        game.lives, game.hp = 9, 700
        original = game.x, game.y, game.lives, game.hp, game.heal_in
        game.update(WRATH_READY_TIME-.001, {"Right", "f", "e"})
        self.assertEqual((game.x, game.y, game.lives, game.hp, game.heal_in), original)
        self.assertEqual(game.elapsed, 0)
        first = game.attack_index
        game.update(.001, set())
        duration = game.stage.duration + sum(stage.duration for stage in game.queue)
        game.invulnerable = 1000
        game.update(duration, set())
        self.assertNotEqual(game.attack_index, first)
        self.assertNotEqual(game.stage.name, "wrath_ready")
        self.assertEqual((game.lives, game.hp), (9, 700))

    def test_random_order_depends_on_the_supplied_random_seed(self):
        def order(seed):
            game = KingsWrath(RANDOM_ORDER, rng=random.Random(seed))
            result = [game.attack_index]
            for _ in range(20):
                game.queue.clear()
                game._next_stage()
                result.append(game.attack_index)
            return result
        self.assertEqual(order(12), order(12))
        self.assertNotEqual(order(12), order(42))

    def test_each_attack_starts_transformed_with_fifteen_hp(self):
        stages = ("memory", "bones", "rings", "fingers", "chaos", "raise", "scare_ready")
        for attack, index in WRATH_ATTACKS.items():
            with self.subTest(attack=attack):
                game = KingsWrath(attack, rng=random.Random(12))
                self.assertEqual(game.stage.name, "wrath_ready")
                self.assertIn("GET READY — 3", game.pattern_label)
                game.update(WRATH_READY_TIME, set())
                self.assertEqual(game.stage.name, stages[index])
                self.assertEqual(game.attack_index, index)
                self.assertEqual(game.difficulty, attack)
                self.assertTrue(game.intro_done and game.transformed)
                self.assertEqual((game.lives, game.max_lives), (15, 15))
                self.assertEqual(game.stage_age, 0)
                self.assertNotIn("AWAKENING", game.pattern_label)

    def test_each_selected_attack_repeats_instead_of_advancing(self):
        for attack, index in WRATH_ATTACKS.items():
            with self.subTest(attack=attack):
                game = KingsWrath(attack, rng=random.Random(12))
                game.update(WRATH_READY_TIME, set())
                first_stage = game.stage.name
                game.invulnerable = 1000
                for _ in range(500):
                    game.update(.05, set())
                    self.assertTrue(game.alive)
                    self.assertEqual(game.attack_index, index)
                    self.assertNotEqual(game.stage.name, "wrath_ready")
                    if game.attacks_completed:
                        self.assertEqual(game.stage.name, "wrath_break")
                        game.update(.5, set())
                        self.assertEqual(game.stage.name, first_stage)
                        break
                else:
                    self.fail(f"{attack} did not repeat")

    def test_practice_matches_the_original_attack_movement_damage_and_projectiles(self):
        for attack, index in WRATH_ATTACKS.items():
            with self.subTest(attack=attack):
                practice = KingsWrath(attack, rng=random.Random(12))
                practice.update(WRATH_READY_TIME, set())
                original = PumpkinKing(difficulty=BABY_MODE, rng=random.Random(12))
                original.begin_attack(index)
                for frame in range(150):
                    keys = {"Right" if frame % 60 < 30 else "Left", "f", "e"}
                    practice.update(1 / 60, keys)
                    original.update(1 / 60, keys)
                    self.assertEqual(practice.stage, original.stage)
                    self.assertEqual(practice.lives, original.lives)
                    self.assertEqual(practice.damage_taken, original.damage_taken)
                    self.assertEqual(practice.hp, original.hp)
                    self.assertEqual((practice.x, practice.y), (original.x, original.y))
                    self.assertEqual(practice.bullets, original.bullets)
                    self.assertEqual(practice.rings, original.rings)

    def test_normal_victory_contact_damage_and_restart_work(self):
        game = KingsWrath("haunted_quadrants")
        game.update(WRATH_READY_TIME, set())
        game.hp = 5
        game.shots = [Projectile(game.boss_x, game.boss_y, 0, 520)]
        game.update(.01, set())
        self.assertTrue(game.won)
        fresh = KingsWrath("haunted_quadrants")
        self.assertFalse(fresh.won)
        self.assertEqual((fresh.lives, fresh.hp, fresh.elapsed), (15, 1400, 0))
        fresh.x, fresh.y = fresh.boss_x, fresh.boss_y
        fresh.invulnerable = 100
        fresh.update(WRATH_READY_TIME, set())
        fresh.update(.01, set())
        self.assertFalse(fresh.alive)
        self.assertEqual(fresh.lives, 0)
        self.assertIn("Pumpkin King", fresh.death_message)

    def test_countdown_freezes_combat_and_shows_three_two_one_for_every_attack(self):
        for attack in WRATH_ATTACKS:
            with self.subTest(attack=attack):
                game = KingsWrath(attack, rng=random.Random(12))
                original = (game.x, game.y, game.hp, game.lives, game.heal_in)
                for second in (3, 2, 1):
                    self.assertIn(f"GET READY — {second}", game.pattern_label)
                    game.update(.999, {"Right", "f", "e"})
                    self.assertEqual(game.stage.name, "wrath_ready")
                    self.assertEqual((game.x, game.y, game.hp, game.lives, game.heal_in), original)
                    self.assertEqual(game.elapsed, 0)
                    self.assertEqual(game.damage_taken, 0)
                    self.assertFalse(game.bullets or game.rings or game.shots or game.sound_events)
                    game.update(.001, set())
                self.assertNotEqual(game.stage.name, "wrath_ready")
                self.assertEqual(game.stage_age, 0)

    def test_haunted_positioning_stacks_after_countdown_and_repeats_with_five_seconds(self):
        game = KingsWrath("haunted_quadrants", rng=random.Random(12))
        game.x, game.y = -150, 30
        game.update(2.999, set())
        self.assertEqual(game.stage.name, "wrath_ready")
        game.update(.001, set())
        self.assertEqual(game.stage.name, "scare_ready")
        self.assertEqual(game.sound_events, ["laugh"])
        game.update(1.999, set())
        self.assertEqual(game.stage.name, "scare_ready")
        self.assertEqual(game.damage_taken, 0)
        game.update(.001, set())
        self.assertEqual(game.stage.name, "scares")
        game.update(5, set())
        self.assertEqual(game.stage.name, "wrath_break")
        game.update(.5, set())
        damage = game.damage_taken
        self.assertEqual(game.stage.name, "scare_ready")
        game.update(1.999, set())
        self.assertEqual(game.stage.name, "scare_ready")
        self.assertEqual(game.damage_taken, damage)
        game.update(.001, set())
        self.assertEqual(game.stage.name, "scares")

    def test_countdown_transition_preserves_extra_frame_time(self):
        for fps in (30, 60, 144):
            with self.subTest(fps=fps):
                game = KingsWrath("bone_gauntlet", rng=random.Random(12))
                for _ in range(fps*3):
                    game.update(1/fps, set())
                self.assertEqual(game.stage.name, "bones")
                self.assertAlmostEqual(game.stage_age, 0)
                self.assertAlmostEqual(game.elapsed, 0)
        game = KingsWrath("bone_gauntlet")
        game.update(3.125, {"Right"})
        self.assertAlmostEqual(game.stage_age, .125)
        self.assertAlmostEqual(game.elapsed, .125)
        self.assertAlmostEqual(game.x, 32.5)

    def test_unknown_attack_is_rejected(self):
        with self.assertRaisesRegex(ValueError, "Unknown King's Wrath attack"):
            KingsWrath("unknown")


class WrathVariantTests(unittest.TestCase):
    def test_bone_openings_and_barrage_spawn_rate(self):
        from dodge_model import PLAYER_TOP, PLAYER_BOTTOM
        narrower_barrages = 0
        for seed in range(30):
            openings = []
            for suffix, speed in (("__easy", .7), ("", 1), ("__hard", 1.5)):
                game = KingsWrath("bone_gauntlet" + suffix, rng=random.Random(seed))
                game.update(3, set())
                interval = game._spawn()
                self.assertAlmostEqual(interval, 1.05 / speed)
                movement = 1.25 * .9 if suffix == "__hard" else speed
                self.assertTrue(all(abs(abs(b.vx) - 340 * movement) < 1e-8 for b in game.bullets))
                bones = sorted(game.bullets, key=lambda b: b.y)
                opening = max(top.y-top.height/2-(bottom.y+bottom.height/2)
                              for bottom, top in zip(bones, bones[1:]))
                self.assertGreater(opening, PLAYER_TOP-PLAYER_BOTTOM)
                openings.append(opening)
            self.assertGreater(openings[0], openings[1])
            # Whole bones snap to 28px rows, so some rolls share a gap size.
            self.assertGreaterEqual(openings[1], openings[2])
            narrower_barrages += openings[1] > openings[2]
        self.assertGreater(narrower_barrages, 15)


    def test_hard_memory_flashes_thirty_percent_faster_than_normal(self):
        normal = KingsWrath("color_memory", rng=random.Random(4))
        hard = KingsWrath("color_memory__hard", rng=random.Random(4))
        for game in (normal, hard):
            game.update(3, set())
        self.assertEqual(hard.sequence, normal.sequence)
        self.assertAlmostEqual(hard.stage.duration * 1.3, normal.stage.duration)
        period = hard.stage.duration / len(hard.sequence)
        for index, rule in enumerate(hard.sequence):
            hard.stage_age = (index + .1) * period
            self.assertEqual(hard.eye_rule, rule)
            hard.stage_age = (index + .9) * period
            self.assertIsNone(hard.eye_rule)


    def test_easy_memory_three_flashes_no_bullets(self):
        game = KingsWrath("color_memory__easy", rng=random.Random(4))
        game.update(3, set())
        self.assertEqual(len(game.sequence), 3)
        self.assertIn("all 3 colors", game.pattern_label)
        period = game.stage.duration / 3
        for i, color in enumerate(game.sequence):
            game.stage_age = i * period + .01
            self.assertEqual(game.eye_rule, color)
            game.stage_age = (i + .9) * period
            self.assertIsNone(game.eye_rule)
        game.hurt = lambda *a, **kw: None
        for _ in range(1000):
            game.update(.02, set())
            self.assertFalse(game.bullets)

    def test_terror_rings_has_complete_rings_and_six_damaging_ghosts(self):
        game = KingsWrath("rotating_rings__hard", rng=random.Random(4))
        game.update(3, set())
        self.assertAlmostEqual(game.stage.duration, 11.2)
        self.assertEqual(game.ring_speed, 1.38)
        from pumpkin_king import RING_SEGMENTS
        game.invulnerable = 1000
        game.update(.15, {"Up"})
        for _ in range(1400):
            game.update(.01, set())
            self.assertEqual(len(game.ghosts), 0 if game.stage.name == "wrath_break" else 6)
            self.assertTrue(all(-290 <= g.x <= 290 for g in game.ghosts))
            for ring in game.rings:
                self.assertEqual(len(list(ring.pieces())), RING_SEGMENTS)
        game.invulnerable = 0
        game.rings.clear()
        ghost = game.ghosts[0]
        game.x, game.y = ghost.x, ghost.y
        game.update(.01, set())
        self.assertGreater(game.damage_taken, 0)

    def test_spook_speeds_and_opposite_pair(self):
        for level, speed in (("easy", .5), ("hard", 1.35 * .95)):
            game = KingsWrath("haunted_quadrants__" + level)
            self.assertEqual(game.scare_speed, speed)
            game.update(5, set())
            if level == "hard":
                a, b = game.scare_rectangles
                self.assertEqual(a[:2], (-b[0], -b[1]))
                game.x, game.y = 0, -160
                game.update(.15, set())
                self.assertGreater(game.damage_taken, 0)

    def test_blind_rage_deck_and_timing(self):
        orders = []
        for seed in range(4):
            game = KingsWrath("royal_slams__hard", rng=random.Random(seed))
            stages = list(game.queue)
            slams = [s.side for s in stages if s.name == "slam"]
            self.assertEqual(len(slams), 11)
            self.assertTrue({"center", "split", "sweep"}.issubset(slams))
            self.assertEqual(sum(s.name == "roar" for s in stages), 3)
            self.assertTrue(all(abs(s.duration-.5/1.2) < 1e-8 for s in stages if s.name == "raise"))
            orders.append(slams)
        self.assertNotEqual(orders[0], orders[1])

    def test_easy_slams_warnings_smaller_areas_and_unchanged_damage(self):
        game = KingsWrath("royal_slams__easy")
        game.update(3, set())
        self.assertAlmostEqual(game.stage.duration, .5/.75)
        self.assertEqual(game.slam_warnings, [(-150, 0, 240, 480)])
        game.x, game.y = -150, -170
        game.update(game.stage.duration+.01, set())
        self.assertEqual(game.damage_taken, 1)

    def test_easy_fingers_counter_and_movement(self):
        from pumpkin_king import COUNTER_RANGE, COUNTER_WINDOW, COUNTER_COOLDOWN, Finger
        game = KingsWrath("magenta_fingers__easy")
        game.update(3, set())
        self.assertAlmostEqual(game.counter_radius, COUNTER_RANGE*1.15)
        self.assertAlmostEqual(game.counter_window, COUNTER_WINDOW*1.15)
        self.assertAlmostEqual(game.counter_delay, COUNTER_COOLDOWN*.85)
        self.assertEqual(game.projectile_speed, .85)
        game.bullets = [Finger(game.x+COUNTER_RANGE*1.1, game.y, 0, 0)]
        game.spawn_in = 5
        game.update(.001, {"e"})
        self.assertEqual(game.counter_hits, 1)
        self.assertFalse(game.bullets)


class WrathCycleBreakTests(unittest.TestCase):
    def test_all_modes_reset_and_pause_exactly_half_a_second_each_cycle(self):
        for attack in (*WRATH_ATTACKS, RANDOM_ORDER):
            for suffix in ("", "__easy", "__hard"):
                with self.subTest(attack=attack, suffix=suffix):
                    game = KingsWrath(attack + suffix, rng=random.Random(42))
                    game.update(3, set())
                    game.hurt = lambda *args, **kwargs: None
                    for cycle in range(2):
                        # Finish all combat stages but leave the cycle break untouched.
                        duration = game.stage.duration-game.stage_age + sum(s.duration for s in game.queue if s.name != "wrath_break")
                        game.x, game.y = 80, -160
                        game.update(duration, set())
                        self.assertEqual(game.stage.name, "wrath_break")
                        self.assertEqual(game.attacks_completed, cycle+1)
                        self.assertEqual(sum(game.attack_survivals), cycle+1)
                        self.assertEqual((game.x, game.y), game.spawn_position)
                        self.assertFalse(game.bullets or game.rings or game.shots or game.ghosts)
                        state = game.x, game.y, game.hp, game.lives, game.elapsed, game.heal_in
                        game.update(.499, {"Right", "f", "e"})
                        self.assertEqual(game.stage.name, "wrath_break")
                        self.assertEqual((game.x, game.y, game.hp, game.lives, game.elapsed, game.heal_in), state)
                        game.update(.001, set())
                        self.assertNotIn(game.stage.name, ("wrath_ready", "wrath_break"))
                        self.assertEqual((game.x, game.y), game.spawn_position)
                        self.assertAlmostEqual(game.stage_age, 0)

    def test_break_preserves_overflow_into_next_cycle(self):
        game = KingsWrath("bone_gauntlet")
        game.hurt = lambda *args, **kwargs: None
        game.update(3+6+.5+.125, set())
        self.assertEqual(game.stage.name, "bones")
        self.assertAlmostEqual(game.stage_age, .125)
        self.assertEqual(game.attacks_completed, 1)
        self.assertAlmostEqual(game.elapsed, 6.125)

class WrathThemeBalanceTests(unittest.TestCase):
    def test_total_havoc_adds_exactly_two_projectiles_per_volley(self):
        for suffix, count in (("__easy", 5), ("", 5), ("__hard", 7)):
            game = KingsWrath("chaos"+suffix, rng=random.Random(12))
            game.update(3, set())
            game._spawn()
            self.assertEqual(len(game.bullets), count)

    def test_blind_rage_speed_and_physical_hints(self):
        from pumpkin_king import Stage
        game = KingsWrath("royal_slams__hard")
        game.update(3, set())
        game.update(.1, {"Right"})
        self.assertAlmostEqual(game.x, 31.2)
        poses = []
        for side in ("left", "right", "both", "center", "split", "sweep"):
            game.stage = Stage("raise", .5/1.2, side)
            game.stage_age = game.stage.duration*.95
            self.assertFalse(game.slam_warnings)
            poses.append(tuple(tuple(game.hand_rectangles(hand)) for hand in ("left", "right")))
        self.assertEqual(len(set(poses)), 6)
        game.begin_attack(4)
        self.assertEqual(game.movement_speed, 260)

    def test_twin_terrors_center_hurts_but_warning_allows_dodging(self):
        game = KingsWrath("haunted_quadrants__hard")
        game.update(5, set())
        game.x, game.y = -12, -160
        for _ in range(4999):
            target = 12 if game.scare_beat % 2 else -12
            keys = {"Right"} if game.x < target-.3 else {"Left"} if game.x > target+.3 else set()
            game.update(.001, keys)
        self.assertEqual(game.damage_taken, 0)
