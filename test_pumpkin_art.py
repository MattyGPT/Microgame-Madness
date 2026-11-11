"""Candy spawning and combat-independent attack rendering."""

import pickle
import random
import unittest

from pumpkin_king import CANDY_VARIANTS, CandyPickup, PumpkinKing, HEAL_LASTS
from pumpkin_king_view import KingView
from web.bridge import DrawCanvas


class PumpkinArtTests(unittest.TestCase):
    def test_candy_rolls_at_spawn_without_consuming_combat_randomness(self):
        game = PumpkinKing(random.Random(42))
        expected = random.Random(42)
        variants = set()
        for _ in range(40):
            game.healing_pickups.clear()
            game.heal_in = 0
            game.update_healing(.01)
            candy = game.healing_pickups[0]
            self.assertIsInstance(candy, CandyPickup)
            self.assertEqual((candy.x, candy.y), (expected.uniform(-250, 250), expected.uniform(-200, 30)))
            self.assertEqual(candy.remaining, HEAL_LASTS)
            self.assertIn(candy.variant, CANDY_VARIANTS)
            variants.add(candy.variant)
        self.assertEqual(variants, set(CANDY_VARIANTS))
        self.assertEqual(game.rng.getstate(), expected.getstate())

    def test_all_candies_have_distinct_stable_sprites_and_heal_normally(self):
        sprites = set()
        for variant in CANDY_VARIANTS:
            game = PumpkinKing(random.Random(42))
            game.healing_pickups = [CandyPickup(game.x, game.y, 9, variant)]
            view = KingView(DrawCanvas(), audio=False)
            view.counts, view.used = {}, set()
            view._candy(game.healing_pickups[0], 1)
            first = view.canvas.commands()
            sprites.add(repr(first))
            view.counts, view.used = {}, set()
            view._candy(game.healing_pickups[0], 2)
            # Ignore pooled-item bookkeeping; geometry/colors remain stable.
            self.assertEqual([{k: v for k, v in c.items() if k != 'state'}
                              for c in view.canvas.commands()], first)
            self.assertEqual(game.healing_pickups[0].variant, variant)
            game.hurt()
            game.update_healing(.01)
            self.assertEqual(game.lives, game.max_lives)
            self.assertEqual(game.healing_collected, 1)
            self.assertEqual(game.healing_pickups, [])
        self.assertEqual(len(sprites), 5)

    def test_every_attack_draws_without_mutating_combat_or_random_state(self):
        for attack in range(7):
            game = PumpkinKing(random.Random(42))
            game.begin_attack(attack)
            game.invulnerable = 1000
            game.update(2.5, set())
            game.sound_events.clear()
            before = pickle.dumps(game)
            view = KingView(DrawCanvas(), audio=False)
            view.draw(game)
            self.assertEqual(pickle.dumps(game), before)
            self.assertTrue(view.canvas.commands())
            self.assertLess(len(view.canvas.commands()), 3500)


if __name__ == '__main__':
    unittest.main()


class WrathRedMemoryTests(unittest.TestCase):
    def test_red_arena_keeps_eye_rules_and_hides_other_color_cues(self):
        from kings_wrath import KingsWrath
        from pumpkin_king import Stage
        for level in ("easy", "normal", "hard"):
            for rule, eye_color in (("blue", "#42c9ff"), ("orange", "#ff9d32")):
                game = KingsWrath("color_memory__" + level)
                game.stage = Stage("color", .65, rule)
                view = KingView(DrawCanvas(), audio=False)
                view.draw(game)
                commands = view.canvas.commands()
                expected_bg = "#681f2b" if level == "hard" else {"blue":"#123e69", "orange":"#713b17"}[rule]
                self.assertEqual(commands[0]["fill"], expected_bg)
                self.assertEqual(game.screen_rule, rule)
                self.assertEqual(game.eye_rule, rule)
                self.assertTrue(any(c["kind"] in ("polygon", "oval") and c.get("fill") == eye_color for c in commands))
                if level == "hard":
                    self.assertIn("WATCH HIS EYES", game.pattern_label)
                    text = " ".join(c.get("text", "") for c in commands)
                    self.assertNotIn("HOLD STILL", text)
                    self.assertNotIn("KEEP MOVING", text)
                    game.update(.25, {"Right"} if rule == "blue" else set())
                    self.assertEqual(game.damage_taken, 1)
        for phase in ("memory", "recall_ready", "color_gap"):
            game = KingsWrath("color_memory__hard")
            game.stage = Stage(phase, 1)
            self.assertFalse(game.eyes_only_color)

class WrathThemeArtTests(unittest.TestCase):
    def test_every_pattern_has_distinct_pure_difficulty_art(self):
        from kings_wrath import KingsWrath, WRATH_ATTACKS
        for attack in WRATH_ATTACKS:
            drawings = []
            for suffix in ("__easy", "", "__hard"):
                game = KingsWrath(attack+suffix, rng=random.Random(4))
                game.update(3.2, set())
                game.sound_events.clear()
                before = pickle.dumps(game)
                view = KingView(DrawCanvas(), audio=False)
                view.draw(game)
                drawings.append(repr(view.canvas.commands()))
                self.assertEqual(pickle.dumps(game), before)
            self.assertEqual(len(set(drawings)), 3, attack)

    def test_laughing_preparation_shows_first_quadrant_exclamation_marks(self):
        from kings_wrath import KingsWrath
        from pumpkin_king import Stage
        games = [PumpkinKing()]+[KingsWrath('haunted_quadrants'+suffix) for suffix in ('__easy','','__hard')]
        for game in games:
            game.begin_attack(6)
            game.stage = Stage('scare_ready', 2)
            game.stage_age = 1.5
            view = KingView(DrawCanvas(), audio=False)
            view.draw(game)
            marks = [c for c in view.canvas.commands() if c.get('text') == '!']
            self.assertEqual(len(marks), 8 if getattr(game, 'variant', None) == 'hard' else 4)
