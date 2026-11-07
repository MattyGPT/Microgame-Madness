"""Regression coverage for shared rules, the browser bridge, and safe packaging."""
import json
from pathlib import Path
import random
import re
import shutil
import tempfile
import unittest
from unittest.mock import patch

from hangman_model import HangmanGame
from keyboard_model import KeyboardRound
from dodge_model import DodgeGame, DIFFICULTIES
from boss_crush import BossCrush, BOSS_DIFFICULTIES
from pumpkin_king import PumpkinKing, PUMPKIN_DIFFICULTIES
from kings_wrath import KingsWrath, RANDOM_ORDER, WRATH_ATTACKS
from web.bridge import BrowserGame
from scripts.build_web import build, leaderboard_config, PYTHON_SOURCES


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

    def test_impossible_uses_shell_face_and_only_eyes_flash_on_real_hit(self):
        from boss_crush import Projectile
        shell = self.start("pumpkin", "baby")
        shell_features = [c for c in shell["commands"] if c["kind"] == "polygon"][:4]
        original = self.start("boss", "impossible")
        features = [c for c in original["commands"] if c["kind"] == "polygon" and c["fill"] in ("#000000", "#fff351")][:4]
        self.assertEqual([list(c["coords"]) for c in features], [list(c["coords"]) for c in shell_features])
        self.assertEqual([c["fill"] for c in features], ["#000000"] * 4)
        game = self.session.game
        game.shots = [Projectile(game.boss_x, game.boss_y, 0, 520)]
        struck = self.session.dispatch({"action": "tick", "dt": .01})
        features = [c for c in struck["commands"] if c["kind"] == "polygon" and c["fill"] in ("#000000", "#fff351")][:4]
        self.assertLess(struck["hp"], original["hp"])
        self.assertEqual([c["fill"] for c in features], ["#fff351"] * 2 + ["#000000"] * 2)
        self.assertTrue(any(c["fill"] == "#ffffff" and c["kind"] in ("rectangle", "oval")
                            for c in struck["commands"]))
        self.assertNotEqual([c["coords"] for c in features[:2]],
                            [c["coords"] for c in original["commands"] if c["kind"] == "polygon" and c["fill"] in ("#000000", "#fff351")][:2])
        for _ in range(20):
            recovered = self.session.dispatch({"action": "tick", "dt": .05})
        features = [c for c in recovered["commands"] if c["kind"] == "polygon" and c["fill"] in ("#000000", "#fff351")][:4]
        self.assertEqual([c["fill"] for c in features], ["#000000"] * 4)

    def test_color_memory_eyes_stay_open_in_gaps_and_when_shot(self):
        from pumpkin_king import Stage
        for mode, difficulty in (("pumpkin", "baby"), ("wrath", "color_memory")):
            self.start(mode, difficulty)
            game = self.session.game
            game.begin_attack(0)
            game.sequence = ["blue", "orange"] * 3
            open_eyes = None
            for name, side, age, color in (("memory", "", .25, "#42c9ff"),
                                           ("memory", "", .9, "#38201c"),
                                           ("recall_ready", "", .1, "#38201c"),
                                           ("color", "orange", .25, "#ff9d32"),
                                           ("color_gap", "", .25, "#38201c")):
                for hit in (0, .12):
                    with self.subTest(mode=mode, stage=name, hit=hit):
                        game.stage, game.stage_age = Stage(name, 6, side), age
                        game.elapsed, game.hit_flash = 4.65, hit  # Idle blink window.
                        commands = self.session.snapshot()["commands"]
                        eyes = [c["coords"] for c in commands
                                if c["kind"] == "polygon" and c["fill"] == color][:2]
                        self.assertEqual(len(eyes), 2)
                        if open_eyes is None:
                            open_eyes = eyes
                        self.assertEqual(eyes, open_eyes)

    def test_every_arcade_difficulty_matches_desktop_model_replay(self):
        cases = [("dodge", key, DodgeGame(difficulty=key, rng=random.Random(12))) for key in DIFFICULTIES]
        cases += [("boss", key, BossCrush(key, rng=random.Random(12))) for key in BOSS_DIFFICULTIES]
        cases += [("pumpkin", key, PumpkinKing(rng=random.Random(12), difficulty=key)) for key in PUMPKIN_DIFFICULTIES]
        cases += [("wrath", key, KingsWrath(key, rng=random.Random(12))) for key in WRATH_ATTACKS]
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
                    if mode in ("pumpkin", "wrath"):
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

    def test_wrath_is_distinct_from_pumpkin_and_pauses_the_loaded_attack(self):
        for attack, index in WRATH_ATTACKS.items():
            result = self.start("wrath", attack)
            self.assertEqual((result["mode"], result["difficulty"]), ("wrath", attack))
            self.assertEqual(self.session.game.attack_index, index)
            self.assertTrue(self.session.game.intro_done)
            self.assertTrue(result["commands"])
            self.assertEqual((result["lives"], result["max_lives"]), (15, 15))
            paused = self.session.dispatch({"action": "pause"})
            self.assertTrue(paused["paused"])
            self.assertEqual(self.session.dispatch({"action": "tick", "dt": .05, "keys": ["Up", "f", "e"]}), paused)
            self.assertEqual(self.session.game.stage_age, 0)
            self.session.dispatch({"action": "pause"})
            self.session.dispatch({"action": "tick", "dt": .05})
            self.assertGreater(self.session.game.stage_age, 0)
        self.start("pumpkin", "baby")
        self.assertEqual(self.session.game.stage.name, "shell")
        self.assertFalse(self.session.game.intro_done)

    def test_random_wrath_has_its_own_mode_and_pauses_the_countdown(self):
        result = self.start("wrath", RANDOM_ORDER)
        self.assertEqual(result["difficulty"], RANDOM_ORDER)
        self.assertEqual((result["lives"], result["max_lives"]), (15, 15))
        self.assertIn(self.session.game.attack_index, WRATH_ATTACKS.values())
        self.assertIn("NEXT:", result["label"])
        paused = self.session.dispatch({"action": "pause"})
        self.assertEqual(self.session.dispatch({"action": "tick", "dt": .05}), paused)
        self.session.dispatch({"action": "pause"})
        result = self.session.dispatch({"action": "tick", "dt": .05})
        self.assertFalse(result["paused"])
        self.assertAlmostEqual(self.session.game.stage_age, .05)
        self.session.game.attacks_completed = 7
        self.session.game.counter_hits = 3
        result = self.session.snapshot()
        self.assertEqual(result["attacks_completed"], 7)
        self.assertEqual(result["counter_hits"], 3)

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
        from collections import Counter
        self.start("pumpkin", "phase2")
        self.session.game.rng.seed(42)
        self.session.game.candy_rng.seed(42)
        peak_counts = Counter(item["kind"] for item in self.session.canvas.items.values())
        for attack in range(7):
            self.session.game.begin_attack(attack)
            self.session.game.invulnerable = 100
            for frame in range(160):
                result = self.session.dispatch({"action": "tick", "dt": .05, "keys": ["f", "e"]})
                self.assertTrue(result["commands"])
                self.assertTrue(all(c["kind"] in ("rectangle", "polygon", "text", "oval") for c in result["commands"]))
                peak_counts |= Counter(c["kind"] for c in self.session.canvas.commands())
        # Richer attack artwork needs more shapes, but allocation must still
        # equal each shape kind's peak demand, never accumulate across frames.
        self.assertEqual(len(self.session.canvas.items), sum(peak_counts.values()))
        self.assertLess(len(self.session.canvas.items), 1500)

    def test_healing_and_counter_shapes_are_serializable(self):
        from boss_crush import HealingPickup
        self.start("pumpkin", "phase2")
        self.session.game.healing_pickups = [HealingPickup(20, 30)]
        self.session.game.counter_time = .1
        result = self.session.snapshot()
        self.assertTrue(any(c["kind"] == "oval" for c in result["commands"]))
        json.dumps(result)


class PackagingTests(unittest.TestCase):
    def test_changed_client_uses_a_new_url_instead_of_a_cached_old_script(self):
        source = Path(__file__).parent
        with tempfile.TemporaryDirectory() as directory:
            root = Path(directory)
            shutil.copytree(source / "web", root / "web")
            shutil.copytree(source / "shared", root / "shared")
            for name in PYTHON_SOURCES:
                shutil.copy2(source / name, root / name)
            output = root / "dist"
            with patch("scripts.build_web.ROOT", root), patch("scripts.build_web.OUTPUT", output):
                build()
                first = (output / "index.html").read_text()
                client = root / "web" / "app.js"
                client.write_text(client.read_text() + "\n// Next client release.\n")
                build()
                second = (output / "index.html").read_text()
            for name in ("app.js", "style.css", "achievements.js", "customs.js", "shop.js", "music.js", "leaderboards.js", "account-rules.js", "accounts/store.js", "accounts/session.js", "accounts/sync.js", "accounts/app.js", "accounts/profile.css"):
                with self.subTest(asset=name):
                    pattern = rf'"(\./{re.escape(name)}\?v=[a-f0-9]+)"'
                    before = re.search(pattern, first)
                    after = re.search(pattern, second)
                    self.assertIsNotNone(before)
                    self.assertIsNotNone(after)
                    if name == "app.js":
                        self.assertNotEqual(before[1], after[1])
                    else:
                        self.assertEqual(before[1], after[1])

    def test_leaderboard_configuration_never_publishes_private_keys(self):
        with tempfile.TemporaryDirectory() as directory:
            with patch("scripts.build_web.ROOT", Path(directory)), patch.dict("os.environ", {}, clear=True):
                self.assertEqual(leaderboard_config(), {"url": "", "key": ""})
        with patch.dict("os.environ", {"SUPABASE_URL": "https://example.supabase.co", "SUPABASE_PUBLISHABLE_KEY": "sb_publishable_example"}, clear=True):
            self.assertEqual(leaderboard_config()["key"], "sb_publishable_example")
        for key in ("sb_secret_private", "not-a-public-key", "e30.eyJyb2xlIjoic2VydmljZV9yb2xlIn0.sig"):
            with patch.dict("os.environ", {"SUPABASE_URL": "https://example.supabase.co", "SUPABASE_PUBLISHABLE_KEY": key}, clear=True):
                with self.assertRaises(ValueError):
                    leaderboard_config()
        with patch.dict("os.environ", {"SUPABASE_URL": "https://example.supabase.co", "SUPABASE_PUBLISHABLE_KEY": "e30.eyJyb2xlIjoiYW5vbiJ9.sig"}, clear=True):
            self.assertEqual(leaderboard_config()["key"], "e30.eyJyb2xlIjoiYW5vbiJ9.sig")
        with patch.dict("os.environ", {"SUPABASE_URL": "https://user:password@example.supabase.co", "SUPABASE_PUBLISHABLE_KEY": "sb_publishable_example"}, clear=True):
            with self.assertRaises(ValueError):
                leaderboard_config()

    def test_shared_leaderboard_config_works_locally_and_with_empty_actions_variables(self):
        config = {"url": "https://example.supabase.co", "key": "sb_publishable_example"}
        with tempfile.TemporaryDirectory() as directory:
            root = Path(directory)
            (root / "leaderboard-config.json").write_text(json.dumps(config))
            with patch("scripts.build_web.ROOT", root):
                for env in ({}, {"SUPABASE_URL": "", "SUPABASE_PUBLISHABLE_KEY": ""}):
                    with patch.dict("os.environ", env, clear=True):
                        self.assertEqual(leaderboard_config(), config)
                with patch.dict("os.environ", {"SUPABASE_URL": "https://override.supabase.co",
                                               "SUPABASE_PUBLISHABLE_KEY": "sb_publishable_override"}, clear=True):
                    self.assertEqual(leaderboard_config()["url"], "https://override.supabase.co")
                # Never combine credentials belonging to different projects.
                for env in ({"SUPABASE_URL": "https://override.supabase.co"},
                            {"SUPABASE_PUBLISHABLE_KEY": "sb_publishable_override"}):
                    with patch.dict("os.environ", env, clear=True), self.assertRaises(ValueError):
                        leaderboard_config()

    def test_invalid_shared_config_preserves_the_previous_build(self):
        with tempfile.TemporaryDirectory() as directory:
            root = Path(directory)
            output = root / "dist"
            output.mkdir()
            previous = output / "index.html"
            previous.write_text("Last good build")
            invalid = ["{", "[]", '{"url": 42, "key": null}',
                       json.dumps({"url": "https://example.supabase.co", "key": "sb_secret_private"}),
                       json.dumps({"url": "https://example.supabase.co", "key": "e30.eyJyb2xlIjoic2VydmljZV9yb2xlIn0.sig"})]
            with patch("scripts.build_web.ROOT", root), patch("scripts.build_web.OUTPUT", output), patch.dict("os.environ", {}, clear=True):
                for content in invalid:
                    (root / "leaderboard-config.json").write_text(content)
                    with self.subTest(content=content), self.assertRaises(ValueError):
                        build()
                    self.assertEqual(previous.read_text(), "Last good build")

    def test_package_contains_only_allowlisted_browser_files(self):
        with tempfile.TemporaryDirectory() as directory:
            output = Path(directory) / "dist"
            with patch("scripts.build_web.OUTPUT", output):
                build()
                files = {str(p.relative_to(output)) for p in output.rglob("*") if p.is_file()}
                expected = {"index.html", "style.css", "app.js", "achievements.js", "customs.js", "shop.js", "music.js", "effects.js", "core-origin.js", "core-origin.css", "trails.js", "trails.css", "leaderboards.js", "leaderboard-config.json", "favicon.svg", ".nojekyll", "python-files.json"}
                expected |= {f"python/{name}" for name in (*PYTHON_SOURCES, "bridge.py")}
                expected |= {"account-rules.js", "accounts/profile.css"}
                expected |= {f"accounts/{name}.js" for name in ("store", "session", "sync", "app")}
                self.assertEqual(files, expected)
                for name in PYTHON_SOURCES:
                    self.assertEqual((output / "python" / name).read_bytes(), (Path(__file__).parent / name).read_bytes())


if __name__ == "__main__":
    unittest.main()
