"""Regression coverage for shared rules, the browser bridge, and safe packaging."""
import json
from pathlib import Path
import random
import unittest

from hangman_model import HangmanGame
from keyboard_model import KeyboardRound
from dodge_model import DodgeGame, DIFFICULTIES
from boss_crush import BossCrush, BOSS_DIFFICULTIES
from pumpkin_king import PumpkinKing, PUMPKIN_DIFFICULTIES
from web.bridge import BrowserGame
from scripts.build_web import build, OUTPUT, PYTHON_SOURCES


class SharedRulesTests(unittest.TestCase):
    def test_hangman_win_and_finished_round_are_immutable(self):
        game = HangmanGame("cat", 5)
        for key in "cat":
            game.guess(key)
        self.assertTrue(game.won)
        self.assertEqual(game.score, 5)
        self.assertEqual(game.guess("z"), "over")
        self.assertEqual(game.mistakes, 0)

    def test_invalid_and_repeated_guesses_do_not_spend_attempts(self):
        game = HangmanGame("cat", 5)
        self.assertEqual(game.guess("abc"), "invalid")
        self.assertEqual(game.guess("Z"), "wrong")
        self.assertEqual(game.guess("z"), "repeated")
        self.assertEqual(game.mistakes, 1)

    def test_deadline_precedes_correct_final_key(self):
        game = KeyboardRound("ab", 2, 10)
        game.feed("a", 10.2)
        self.assertEqual(game.feed("b", 12), "timeout")
        self.assertEqual(game.matched, 1)

    def test_penalty_can_end_round_immediately(self):
        game = KeyboardRound("a", 2, 10)
        self.assertEqual(game.feed("z", 11.6), "timeout")
        self.assertEqual(game.remaining(11.6), 0)


class BrowserAdapterTests(unittest.TestCase):
    def setUp(self):
        self.session = BrowserGame()

    def start(self, mode, difficulty="easy"):
        return self.session.dispatch({"action": "start", "mode": mode, "difficulty": difficulty, "now": 0})

    def test_achievement_evidence_reports_real_damage_and_close_calls(self):
        from dodge_model import Block
        from boss_crush import HealingPickup, Projectile
        self.start("dodge")
        game = self.session.game
        game.x, game.y = 0, 0
        game.spawn_in = 1000
        game.blocks = [Block(25, 65, ((0, 0),), "red")]
        for _ in range(30):
            result = self.session.dispatch({"action": "tick", "dt": .05})
        self.assertEqual(result["near_misses"], 1)
        for wounded in (True, False):
            self.start("pumpkin", "baby")
            game = self.session.game
            game.begin_attack(0)
            if wounded:
                game.hurt()
                game.healing_pickups = [HealingPickup(game.x, game.y)]
                game.update_healing(.01)
            game.hp = 5
            game.shots = [Projectile(game.boss_x, game.boss_y, 0, 520)]
            result = self.session.dispatch({"action": "tick", "dt": .01})
            self.assertTrue(result["won"])
            self.assertEqual(result["lives"], result["max_lives"])
            self.assertEqual(result["healing_collected"], int(wounded))
            self.assertEqual(result["damage_taken"], int(wounded))

    def test_every_arcade_difficulty_matches_desktop_model_replay(self):
        cases = [("dodge", key, DodgeGame(difficulty=key, rng=random.Random(12))) for key in DIFFICULTIES]
        cases += [("boss", key, BossCrush(key, rng=random.Random(12))) for key in BOSS_DIFFICULTIES]
        cases += [("pumpkin", key, PumpkinKing(rng=random.Random(12), difficulty=key)) for key in PUMPKIN_DIFFICULTIES]
        for mode, difficulty, desktop in cases:
            with self.subTest(mode=mode, difficulty=difficulty):
                self.start(mode, difficulty)
                self.session.game.rng = random.Random(12)
                for frame in range(150):
                    keys = ["Right" if frame % 60 < 30 else "Left", "f"]
                    desktop.update(1/60, set(keys))
                    result = self.session.dispatch({"action": "tick", "dt": 1/60, "keys": keys, "now": frame/60})
                    self.assertAlmostEqual(self.session.game.x, desktop.x)
                    self.assertEqual(result["score"], desktop.score)
                    if mode == "pumpkin":
                        self.assertEqual(result["difficulty"], desktop.difficulty)
                        self.assertEqual(result["lives"], desktop.lives)
                        self.assertEqual(result["max_lives"], desktop.max_lives)
                    self.assertEqual(result["over"], not desktop.alive or getattr(desktop, "won", False))
                    json.dumps(result)

    def test_pause_and_merciless_rule(self):
        self.start("dodge")
        self.session.dispatch({"action": "pause"})
        result = self.session.dispatch({"action": "tick", "dt": .05, "keys": ["Up"]})
        self.assertEqual(result["elapsed"], 0)
        self.assertEqual(self.session.game.y, -190)
        self.start("dodge", "merciless")
        self.assertFalse(self.session.dispatch({"action": "pause"})["paused"])

    def test_pumpkin_arm_contact_reports_death_and_correct_max_hp(self):
        for mode, hp in PUMPKIN_DIFFICULTIES.items():
            self.start("pumpkin", mode)
            game = self.session.game
            game.begin_attack(0)
            game.x, game.y = list(game.hand_rectangles("left"))[0][:2]
            game.invulnerable = 20
            result = self.session.dispatch({"action": "tick", "dt": .01, "keys": ["e"]})
            self.assertTrue(result["over"])
            self.assertFalse(result["won"])
            self.assertEqual((result["lives"], result["max_lives"]), (0, hp))
            self.assertIn("arms kill instantly", result["death_message"])
            restarted = self.start("pumpkin", mode)
            self.assertEqual((restarted["lives"], restarted["max_lives"]), (hp, hp))
            self.assertIsNone(restarted["death_message"])

    def test_keyboard_progress_and_late_input(self):
        self.start("keyboard", "progressive")
        word = self.session.game.sequence
        for key in word:
            result = self.session.dispatch({"action": "key", "key": key, "now": .1})
        self.assertEqual(result["score"], 1)
        self.assertEqual(result["level"], 2)
        result = self.session.dispatch({"action": "key", "key": self.session.game.sequence[0], "now": 100})
        self.assertTrue(result["over"])
        self.assertEqual(result["score"], 1)

    def test_hangman_hidden_until_guessed_or_over(self):
        result = self.start("hangman")
        self.assertTrue(all(c in "_ " for c in result["word"]))
        word = self.session.game.word
        for key in set(word):
            result = self.session.dispatch({"action": "guess", "key": key})
        self.assertTrue(result["won"])
        self.assertEqual(result["word"].replace(" ", ""), word)

    def test_pumpkin_all_attacks_render_and_canvas_pool_is_bounded(self):
        self.start("pumpkin", "phase2")
        for attack in range(6):
            self.session.game.begin_attack(attack)
            self.session.game.invulnerable = 100
            for frame in range(160):
                result = self.session.dispatch({"action": "tick", "dt": .05, "keys": ["f", "e"]})
                self.assertTrue(result["commands"])
                self.assertTrue(all(c["kind"] in ("rectangle", "polygon", "text", "oval") for c in result["commands"]))
        self.assertLess(len(self.session.canvas.items), 1000)

    def test_healing_and_counter_shapes_are_serializable(self):
        from boss_crush import HealingPickup
        self.start("pumpkin", "phase2")
        self.session.game.healing_pickups = [HealingPickup(20, 30)]
        self.session.game.counter_time = .1
        result = self.session.snapshot()
        self.assertTrue(any(c["kind"] == "oval" for c in result["commands"]))
        json.dumps(result)


class PackagingTests(unittest.TestCase):
    def test_package_contains_only_allowlisted_browser_files(self):
        build()
        files = {str(p.relative_to(OUTPUT)) for p in OUTPUT.rglob("*") if p.is_file()}
        expected = {"index.html", "style.css", "app.js", "achievements.js", "music.js", "favicon.svg", ".nojekyll", "python-files.json"}
        expected |= {f"python/{name}" for name in (*PYTHON_SOURCES, "bridge.py")}
        self.assertEqual(files, expected)
        for name in PYTHON_SOURCES:
            self.assertEqual((OUTPUT / "python" / name).read_bytes(), (Path(__file__).parent / name).read_bytes())


if __name__ == "__main__":
    unittest.main()
