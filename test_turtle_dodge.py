import io
import math
import random
import unittest
from contextlib import redirect_stdout
from unittest.mock import Mock, patch

from dodge_model import (BLOCK_SIZE, Block, CELL, DIFFICULTIES, DodgeGame,
                         PLAYER_LEFT, PLAYER_RIGHT, PLAYER_BOTTOM, PLAYER_TOP,
                         RIGHT, SHAPES, touches_block)
from hangman import main_menu
from turtle_dodge import DODGE_SCORE_FILE, TurtleDodge, dodge_score_file, start_turtle_dodge


class DodgeTests(unittest.TestCase):
    def test_close_call_requires_safe_escape_and_counts_each_block_once(self):
        for dt in (1 / 60, .05, .25):
            game = self.game()
            game.x, game.y = 0, 0
            block = Block(25, 65, ((0, 0),), "red")
            game.blocks = [block]
            game.update(.25, set())
            self.assertEqual(game.near_misses, 0)  # Approaching is not escaping.
            for _ in range(round(1 / dt)):
                game.update(dt, set())
            self.assertTrue(game.alive)
            self.assertEqual(game.near_misses, 1)
            block.y = 65  # Re-encountering the same object cannot farm rewards.
            game.update(1, set())
            self.assertEqual(game.near_misses, 1)
            self.assertEqual(DodgeGame().near_misses, 0)

    def test_distant_blocks_and_collisions_are_not_close_calls(self):
        for x, survives in ((0, False), (20, False), (40, True)):
            game = self.game()
            game.x, game.y = 0, 0
            game.blocks = [Block(x, 65, ((0, 0),), "red")]
            game.update(1, set())
            self.assertEqual(game.alive, survives)
            self.assertEqual(game.near_misses, 0)

    def test_close_approach_followed_by_collision_has_no_reward(self):
        game = self.game()
        game.x, game.y = 0, 0
        block = Block(25, 0, ((0, 0),), "red", speed_multiplier=0)
        game.blocks = [block]
        game.update(.01, set())
        self.assertTrue(block.near_player)
        game.update(.05, {"Right"})
        self.assertFalse(game.alive)
        self.assertEqual(game.near_misses, 0)

    def game(self):
        game = DodgeGame(random.Random(42))
        game.spawn_in = 1000
        return game

    def test_arrow_movement_and_bounds(self):
        game = self.game()
        game.update(0.1, {"Right", "Up"})
        self.assertAlmostEqual(math.hypot(game.x, game.y + 190), 26)
        game.update(5, {"Right"})
        self.assertEqual(game.x, RIGHT - PLAYER_RIGHT)

    def test_opposite_arrows_cancel(self):
        game = self.game()
        game.update(0.2, {"Right", "Left", "Up", "Down"})
        self.assertEqual((game.x, game.y), (0, -190))

    def test_collision_checks_cells_not_entire_piece_rectangle(self):
        block = Block(0, 0, SHAPES[2], "red")
        self.assertTrue(touches_block(0, 0, block))
        self.assertFalse(touches_block(0, CELL, block))

    def test_visible_gap_beside_turtle_does_not_collide(self):
        # The old 12-pixel circle reported a collision at this visible gap.
        self.assertFalse(touches_block(0, 0, Block(24, 0, ((0, 0),), "red")))

    def test_block_padding_is_not_part_of_hitbox(self):
        half = BLOCK_SIZE / 2
        for side in (-1, 1):
            separated = Block(side * (PLAYER_RIGHT + half + 0.1), 8, ((0, 0),), "red")
            touching = Block(side * (PLAYER_RIGHT + half - 0.1), 8, ((0, 0),), "red")
            self.assertFalse(touches_block(0, 0, separated))
            self.assertTrue(touches_block(0, 0, touching))

    def test_head_contact_and_gap_match_visible_shape(self):
        half = BLOCK_SIZE / 2
        self.assertTrue(touches_block(0, 0, Block(0, PLAYER_TOP + half - 0.1, ((0, 0),), "red")))
        self.assertFalse(touches_block(0, 0, Block(0, PLAYER_TOP + half + 0.1, ((0, 0),), "red")))

    def test_empty_area_next_to_neck_is_safe(self):
        half = BLOCK_SIZE / 2
        block = Block(3 + half, 9.2 + half, ((0, 0),), "red")
        self.assertFalse(touches_block(0, 0, block))

    def test_fast_block_cannot_skip_player(self):
        game = self.game()
        game.elapsed = 100
        game.blocks = [Block(0, -100, ((0, 0),), "red")]
        game.update(1, set())
        self.assertFalse(game.alive)
        score = game.score
        game.update(10, {"Right"})
        self.assertEqual(game.score, score)

    def test_survival_and_dodge_score(self):
        game = self.game()
        game.blocks = [Block(100, -260, ((0, 0),), "red")]
        game.update(0.11, set())
        self.assertEqual(game.score, 26)
        self.assertEqual(game.dodged, 1)
        self.assertEqual(game.blocks, [])

    def test_difficulty_increases_and_is_capped(self):
        game = self.game()
        speed, interval = game.speed, game.spawn_interval
        game.elapsed = 50
        self.assertGreater(game.speed, speed)
        self.assertLess(game.spawn_interval, interval)
        game.elapsed = 10000
        self.assertLessEqual(game.speed, 340)
        self.assertGreaterEqual(game.spawn_interval, 0.35)

    def test_spawned_shapes_have_four_cells_and_stay_within_sides(self):
        game = self.game()
        for _ in range(100):
            game.spawn()
        for block in game.blocks:
            self.assertEqual(len(set(block.cells)), 4)
            for x, y in block.centers():
                self.assertGreaterEqual(x - CELL / 2, -300)
                self.assertLessEqual(x + CELL / 2, 300)

    def test_menu_routes_turtle_mode(self):
        with patch("builtins.input", side_effect=["6", "3"]), patch("hangman.start_turtle_dodge") as start, redirect_stdout(io.StringIO()):
            main_menu()
        start.assert_called_once_with()


class DifficultyTests(unittest.TestCase):
    def test_easy_keeps_original_rules_and_scores(self):
        game = DodgeGame()
        self.assertEqual(game.speed, 100)
        self.assertEqual(game.spawn_interval, 1.2)
        self.assertEqual(game.rules.bounds, (-300, 300, -240, 240))
        self.assertTrue(game.rules.can_pause)
        self.assertFalse(game.rules.deadly_edges)
        self.assertEqual(dodge_score_file("easy"), DODGE_SCORE_FILE)
        self.assertEqual(len({dodge_score_file(mode) for mode in DIFFICULTIES}), 4)

    def test_speed_increases_and_merciless_spawns_more_often(self):
        games = [DodgeGame(difficulty=mode) for mode in DIFFICULTIES]
        for elapsed in (0, 30, 200):
            for game in games:
                game.elapsed = elapsed
            speeds = [game.speed for game in games]
            self.assertEqual(speeds, sorted(set(speeds)))
            self.assertLess(games[-1].spawn_interval, games[-2].spawn_interval)

    def test_piece_colors_variation_and_sway(self):
        for mode in DIFFICULTIES:
            game = DodgeGame(random.Random(42), difficulty=mode)
            for _ in range(20):
                game.spawn()
            speeds = {block.speed_multiplier for block in game.blocks}
            if mode == "easy":
                self.assertEqual(speeds, {1.0})
            else:
                self.assertGreater(len(speeds), 1)
            for block in game.blocks:
                if mode in ("hard", "merciless"):
                    self.assertEqual(block.color, "#ffdf00" if mode == "hard" else "#ff3030")
                    self.assertGreater(block.sway_amplitude, 0)
                else:
                    self.assertEqual(block.sway_amplitude, 0)
            positions = [block.x for block in game.blocks]
            game.update(0.1, set())
            moved = any(block.x != x for block, x in zip(game.blocks, positions))
            self.assertEqual(moved, mode in ("hard", "merciless"))
            for block in game.blocks:
                for x, y in block.centers():
                    self.assertGreaterEqual(x - CELL / 2, game.left)
                    self.assertLessEqual(x + CELL / 2, game.right)

    def test_individual_speed_changes_actual_fall_distance(self):
        game = DodgeGame(difficulty="normal")
        game.spawn_in = 100
        game.blocks = [Block(100, 100, ((0, 0),), "red", speed_multiplier=s) for s in (0.9, 1.2)]
        game.update(0.1, set())
        self.assertGreater(game.blocks[0].y, game.blocks[1].y)

    def test_all_four_merciless_edges_kill_on_contact(self):
        for edge in ("left", "right", "bottom", "top"):
            game = DodgeGame(difficulty="merciless")
            game.spawn_in = 100
            if edge == "left":
                game.x = game.left - PLAYER_LEFT
            elif edge == "right":
                game.x = game.right - PLAYER_RIGHT
            elif edge == "bottom":
                game.y = game.bottom - PLAYER_BOTTOM
            else:
                game.y = game.top - PLAYER_TOP
            game.update(0.01, set())
            self.assertFalse(game.alive, edge)
        game = DodgeGame(difficulty="merciless")
        self.assertGreater(game.left, -300)
        self.assertLess(game.top, 240)
        game.update(0.1, set())
        self.assertTrue(game.alive)

    def test_other_modes_keep_safe_edges(self):
        for mode in ("easy", "normal", "hard"):
            game = DodgeGame(difficulty=mode)
            game.spawn_in = 100
            game.update(3, {"Right", "Down"})
            self.assertTrue(game.alive)
            self.assertEqual(game.x, game.right - PLAYER_RIGHT)

    def test_difficulty_is_passed_to_window_launcher(self):
        with patch("builtins.input", side_effect=["oops", " HARD ", "Ada"]), patch("turtle_dodge.subprocess.run") as run, redirect_stdout(io.StringIO()):
            run.return_value.returncode = 0
            start_turtle_dodge()
        self.assertEqual(run.call_args.args[0][-2:], ["Ada", "hard"])


class CountdownTests(unittest.TestCase):
    def setUp(self):
        self.app = TurtleDodge.__new__(TurtleDodge)
        self.app.game = DodgeGame(random.Random(42))
        self.app.game.elapsed = 10
        self.app.game.blocks = [Block(100, 100, SHAPES[0], "red")]
        self.app.state = "paused"
        self.app.keys = set()
        self.app.closed = False
        self.app.best = 0
        self.app.notice = ""
        self.app.last_hud = None
        self.app.last_time = 10
        for name in ("screen", "player", "blocks", "hud", "message", "set_message"):
            setattr(self.app, name, Mock())

    def test_countdown_freezes_game_then_resumes(self):
        app = self.app
        with patch("turtle_dodge.time.monotonic", return_value=10):
            app.toggle_pause()
        app.set_message.assert_called_with("GET READY\n\n3")
        app.keys.add("Right")
        for now, number in ((11, 2), (12, 1), (12.99, 1), (13, 0)):
            with patch("turtle_dodge.time.monotonic", return_value=now):
                app.tick()
            self.assertEqual(app.game.elapsed, 10)
            self.assertEqual(app.game.blocks[0].y, 100)
            self.assertEqual(app.game.x, 0)
            self.assertEqual(app.game.score, 100)
            if number:
                self.assertEqual(app.state, "countdown")
                app.set_message.assert_called_with(f"GET READY\n\n{number}")
        self.assertEqual(app.state, "playing")
        with patch("turtle_dodge.time.monotonic", return_value=13.016):
            app.tick()
        self.assertGreater(app.game.x, 0)
        self.assertLess(app.game.blocks[0].y, 100)

    def test_space_cannot_skip_countdown(self):
        with patch("turtle_dodge.time.monotonic", return_value=10):
            self.app.space()
            self.app.space()
        self.assertEqual(self.app.state, "countdown")
        self.assertEqual(self.app.countdown_end, 13)

    def test_focus_loss_cancels_countdown_and_resume_restarts_it(self):
        with patch("turtle_dodge.time.monotonic", return_value=10):
            self.app.space()
        self.app.pause()
        self.assertEqual(self.app.state, "paused")
        with patch("turtle_dodge.time.monotonic", return_value=12):
            self.app.toggle_pause()
        self.assertEqual(self.app.countdown_end, 15)

    def test_merciless_cannot_pause_even_on_focus_loss(self):
        app = self.app
        app.game = DodgeGame(difficulty="merciless")
        app.state = "playing"
        app.keys.add("Right")
        app.toggle_pause()
        self.assertEqual(app.keys, {"Right"})
        app.space()
        self.assertEqual(app.state, "playing")
        app.pause()  # Same path as the FocusOut callback.
        self.assertEqual(app.state, "playing")
        self.assertEqual(app.keys, set())
        with patch("turtle_dodge.time.monotonic", return_value=10.01):
            app.tick()
        self.assertGreater(app.game.elapsed, 0)

    def test_restart_preserves_difficulty(self):
        for mode in DIFFICULTIES:
            self.app.game = DodgeGame(difficulty=mode)
            self.app.state = "over"
            self.app.space()
            self.assertEqual(self.app.game.difficulty, mode)
            self.assertTrue(self.app.game.alive)
            self.assertEqual(self.app.game.score, 0)


if __name__ == "__main__":
    unittest.main()
