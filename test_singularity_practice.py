"""Temporary practice repeats the real protocols without unlocking the finisher."""

import random
import unittest

from singularity_core import ATTACKS, BOX_CENTER, HEAL_LASTS, SingularityCore
from singularity_practice import PRACTICE_ATTACKS, SingularityPractice
from web.bridge import BrowserGame


class SingularityPracticeTests(unittest.TestCase):
    def test_each_protocol_matches_the_full_fight_after_countdown(self):
        self.assertEqual(len(PRACTICE_ATTACKS), 15)
        for attack, index in PRACTICE_ATTACKS.items():
            with self.subTest(attack=attack):
                practice = SingularityPractice(attack, random.Random(42))
                full = SingularityCore(random.Random(42))
                full.begin_attack(index)
                self.assertEqual((practice.stage, practice.attack_index, practice.lives),
                                 ("practice_ready", index, 10))
                practice.update(3, {"Left", "f"})
                self.assertEqual(practice.stage, "attack")
                self.assertEqual(practice.stage_age, 0)
                self.assertEqual((practice.x, practice.y), BOX_CENTER)
                for game in (practice, full):
                    game.update(2.5, {"Left", "Up"})
                self.assertEqual(practice.hazards, full.hazards)
                self.assertEqual(practice.memory, full.memory)
                self.assertEqual(practice.sound_events, full.sound_events)
                self.assertEqual((practice.lives, practice.damage_taken, practice.beat,
                                  practice.x, practice.y, practice.elapsed, practice.spawn_in),
                                 (full.lives, full.damage_taken, full.beat,
                                  full.x, full.y, full.elapsed, full.spawn_in))

    def test_countdown_freezes_movement_combat_healing_and_score(self):
        game = SingularityPractice("railgun_array", random.Random(42))
        game.hurt()
        game.spawn_healing()
        game.sound_events.clear()
        before = game.score, game.invulnerable, game.healing_pickups[0].remaining
        for seconds in (3, 2, 1):
            self.assertIn(f"GET READY — {seconds}", game.pattern_label)
            game.update(1, {"Left", "f"})
            self.assertEqual((game.x, game.y), BOX_CENTER)
            self.assertEqual(game.elapsed, 0)
            self.assertEqual(game.hazards, [])
            self.assertEqual((game.score, game.invulnerable, game.healing_pickups[0].remaining), before)
        self.assertEqual(game.sound_events, ["core_protocol"])
        game.update(.01, {"Left"})
        self.assertEqual(game.x, -126)
        self.assertTrue(game.hazards)
        self.assertLess(game.healing_pickups[0].remaining, HEAL_LASTS)

    def test_every_attack_repeats_instead_of_advancing(self):
        for attack, index in PRACTICE_ATTACKS.items():
            with self.subTest(attack=attack):
                game = SingularityPractice(attack)
                game.invulnerable = 1000
                for repeat in range(2):
                    game.update(3, set())
                    game.update(ATTACKS[index].duration, set())
                    self.assertEqual((game.stage, game.attack_index), ("practice_ready", index))
                    self.assertAlmostEqual(game.stage_age, 0)
                    self.assertEqual(game.attacks_completed, repeat + 1)
                    self.assertEqual(game.hazards, [])

    def test_three_repeat_healing_and_no_finisher_even_after_fifteen(self):
        game = SingularityPractice("target_lock", random.Random(42))
        game.invulnerable = 1000
        for repeat in range(18):
            game.update(3 + ATTACKS[3].duration, {"f"})
            self.assertEqual((game.stage, game.attack_index), ("practice_ready", 3))
            self.assertEqual(game.attacks_completed, repeat + 1)
            if (repeat + 1) % 3 == 0:
                self.assertEqual(len(game.healing_pickups), 1)
                self.assertGreater(game.healing_pickups[0].remaining, HEAL_LASTS - .01)
            elif repeat < 2:
                self.assertEqual(game.healing_pickups, [])
            self.assertTrue(game.shielded)
            self.assertFalse(game.laser_ready)
            self.assertFalse(game.fire_laser())
            self.assertFalse(game.won)
            self.assertEqual(game.hp, 1)

    def test_large_update_carries_remainder_into_next_countdown(self):
        game = SingularityPractice("railgun_array")
        game.invulnerable = 1000
        game.update(3 + ATTACKS[0].duration + 1, set())
        self.assertEqual(game.attacks_completed, 1)
        self.assertEqual(game.stage, "practice_ready")
        self.assertAlmostEqual(game.stage_age, 1)
        self.assertAlmostEqual(game.elapsed, ATTACKS[0].duration)

    def test_death_ends_practice_and_restart_restores_ten_hp(self):
        game = SingularityPractice("echo_protocol")
        game.update(3, set())
        for _ in range(10):
            game.invulnerable = 0
            game.hurt()
        game.update(100, {"f"})
        self.assertFalse(game.alive)
        self.assertEqual(game.lives, 0)
        self.assertEqual(game.attacks_completed, 0)
        self.assertFalse(game.won)
        self.assertEqual(SingularityPractice("echo_protocol").lives, 10)
        with self.assertRaises(ValueError):
            SingularityPractice("not_an_attack")

    def test_bridge_lists_canonical_choices_and_pauses_practice(self):
        session = BrowserGame()
        options = session.dispatch({"action": "core_practice_options"})["attacks"]
        self.assertIsNone(session.game)
        self.assertEqual([option["name"] for option in options], [attack.name for attack in ATTACKS])
        self.assertEqual([option["hint"] for option in options], [attack.hint for attack in ATTACKS])
        self.assertEqual([option["number"] for option in options], list(range(1, 16)))
        state = session.dispatch(dict(action="start", mode="core_practice", difficulty=options[2]["id"]))
        self.assertEqual((state["mode"], state["lives"]), ("core_practice", 10))
        self.assertTrue(state["commands"])
        self.assertIn("GET READY — 3", state["label"])
        self.assertTrue(session.dispatch(dict(action="pause"))["paused"])
        session.dispatch(dict(action="tick", dt=.05, keys=["Left"]))
        self.assertEqual(session.game.stage_age, 0)
        session.dispatch(dict(action="pause"))
        session.dispatch(dict(action="tick", dt=.05, keys=["Left"]))
        self.assertEqual(session.game.stage_age, .05)
        state = session.dispatch(dict(action="laser"))
        self.assertFalse(state["laser_firing"])
        state = session.dispatch(dict(action="start", mode="singularity", difficulty="gravitron"))
        self.assertEqual(session.game.stage, "intro")
        self.assertEqual(state["lives"], 10)


if __name__ == "__main__":
    unittest.main()
