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
        self.assertEqual(game.stage.name, "wrath_ready")
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
                self.assertEqual(game.stage.name, "wrath_ready")
                self.assertIn(ATTACK_NAMES[game.attack_index], game.pattern_label)
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
        self.assertEqual(game.stage.name, "wrath_ready")
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
                saw_countdown = False
                for _ in range(500):
                    game.update(.05, set())
                    self.assertTrue(game.alive)
                    self.assertEqual(game.attack_index, index)
                    if game.stage.name == "wrath_ready":
                        saw_countdown = True
                        self.assertIn("GET READY", game.pattern_label)
                    elif saw_countdown:
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
        self.assertEqual(game.stage.name, "wrath_ready")
        damage = game.damage_taken
        game.update(3, set())
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
