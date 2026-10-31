from collections import deque
import io
import math
import random
import unittest
from contextlib import redirect_stdout
from unittest.mock import patch

from boss_crush import Projectile, HealingPickup
from pumpkin_king import (MODE, COWARD_MODE, BABY_MODE, COME_ON_MODE, COME_ON_NAME,
                          PUMPKIN_DIFFICULTIES, PumpkinKing, Stage, Finger, Ring, SLAM_ORDER,
                          ATTACK_BREAK, COLOR_BREAK, COUNTER_WINDOW, slam_stages,
                          EYE_FLASH_PERIOD, EYE_FLASH_ON, EYE_FLASH_GAP,
                          RING_SEGMENTS, RING_THICKNESS)
from turtle_dodge import create_game, dodge_score_file, start_turtle_dodge


class KingTests(unittest.TestCase):
    def game(self, stage="break", side=""):
        game = PumpkinKing(random.Random(42))
        game.intro_done = True
        game.stage = Stage(stage, 100, side)
        game.stage_age = 0
        game.spawn_in = 100
        return game

    def test_health_mode_and_separate_scores(self):
        game = create_game(MODE)
        self.assertEqual((game.lives, game.max_lives, game.hp), (5, 5, 1400))
        self.assertNotEqual(dodge_score_file(MODE), dodge_score_file("impossible"))
        coward = create_game(COWARD_MODE)
        self.assertEqual((coward.lives, coward.max_lives, coward.hp), (10, 10, 1400))
        self.assertEqual(coward.config.player_hp, 10)
        self.assertNotEqual(dodge_score_file(COWARD_MODE), dodge_score_file(MODE))

    def test_coward_mode_survives_nine_hits_and_restarts_with_ten_hp(self):
        game = create_game(COWARD_MODE)
        for remaining in range(9, -1, -1):
            game.invulnerable = 0
            game.hurt()
            self.assertEqual(game.lives, remaining)
            self.assertEqual(game.alive, remaining > 0)
        restarted = create_game(game.difficulty)
        self.assertEqual((restarted.lives, restarted.max_lives, restarted.stage.name), (10, 10, "shell"))

    def test_coward_mode_heals_above_five_and_caps_at_ten(self):
        game = create_game(COWARD_MODE)
        for hp, expected in ((5, 6), (8, 9), (9, 10), (10, 10)):
            game.lives = hp
            game.healing_pickups = [HealingPickup(game.x, game.y, 9)]
            game.update_healing(0.01)
            self.assertEqual(game.lives, expected)
            self.assertEqual(game.healing_pickups, [])

    def test_baby_mode_health_healing_damage_and_restart(self):
        game = create_game(BABY_MODE)
        self.assertEqual((game.lives, game.max_lives, game.config.player_hp, game.hp), (15, 15, 15, 1400))
        self.assertEqual(len({dodge_score_file(mode) for mode in (MODE, COWARD_MODE, BABY_MODE)}), 3)
        for hp, expected in ((5, 6), (10, 11), (14, 15), (15, 15)):
            game.lives = hp
            game.healing_pickups = [HealingPickup(game.x, game.y, 9)]
            game.update_healing(0.01)
            self.assertEqual(game.lives, expected)
        for remaining in range(14, -1, -1):
            game.invulnerable = 0
            game.hurt()
            self.assertEqual(game.lives, remaining)
            self.assertEqual(game.alive, remaining > 0)
        restarted = create_game(game.difficulty)
        self.assertEqual((restarted.lives, restarted.max_lives, restarted.stage.name), (15, 15, "shell"))

    def test_menu_launch(self):
        with patch("builtins.input", side_effect=["impossible phase 2", "Ada"]), patch("turtle_dodge.subprocess.run") as run, redirect_stdout(io.StringIO()):
            run.return_value.returncode = 0
            start_turtle_dodge()
        self.assertEqual(run.call_args.args[0][-2:], ["Ada", MODE])

    def test_23_hp_mode_healing_damage_restart_and_separate_scores(self):
        game = create_game(COME_ON_MODE)
        self.assertEqual((game.lives, game.max_lives, game.config.player_hp), (23, 23, 23))
        self.assertEqual(len({dodge_score_file(mode) for mode in PUMPKIN_DIFFICULTIES}), 4)
        for hp, expected in ((15, 16), (22, 23), (23, 23)):
            game.lives = hp
            game.healing_pickups = [HealingPickup(game.x, game.y, 9)]
            game.update_healing(0.01)
            self.assertEqual(game.lives, expected)
        for remaining in range(22, -1, -1):
            game.invulnerable = 0
            game.hurt()
            self.assertEqual(game.lives, remaining)
            self.assertEqual(game.alive, remaining > 0)
        restarted = create_game(game.difficulty)
        self.assertEqual((restarted.lives, restarted.max_lives, restarted.stage.name), (23, 23, "shell"))

    def test_body_arms_and_hands_kill_instantly_in_every_mode(self):
        for mode in PUMPKIN_DIFFICULTIES:
            for part in ("body", "left_arm", "right_arm", "left_hand", "right_hand"):
                with self.subTest(mode=mode, part=part):
                    game = create_game(mode)
                    game.intro_done = True
                    game.stage = Stage("break", 100)
                    if part == "body":
                        game.x, game.y = game.boss_x, game.boss_y
                    else:
                        side, kind = part.split("_")
                        pieces = list(game.arm_segments(side) if kind == "arm" else game.hand_rectangles(side))
                        game.x, game.y = pieces[len(pieces)//2][:2]
                    game.invulnerable = 99
                    game.hp = 5
                    game.shots = [Projectile(game.boss_x, game.boss_y, 0, 520)]
                    game.healing_pickups = [HealingPickup(game.x, game.y)]
                    game.update(0.01, {"e", "f"})
                    self.assertEqual(game.lives, 0)
                    self.assertFalse(game.alive)
                    self.assertFalse(game.won)
                    self.assertEqual(game.hp, 5)  # Contact wins over a killing shot or heal.
                    self.assertIn("kill instantly", game.death_message)

    def test_only_visible_intro_arms_are_lethal_and_shell_is_lethal(self):
        game = PumpkinKing()
        game.x, game.y = 0, 219
        game.update(0.01, set())
        self.assertFalse(game.alive)
        game = PumpkinKing()
        game.stage = Stage("left_burst", 1)
        game.stage_age = 0.5
        self.assertEqual(len(list(game.arm_segments("left"))), 12)
        self.assertEqual(list(game.arm_segments("right")), [])
        self.assertEqual(list(game.hand_rectangles("left")), [])
        game.x, game.y = 200, 190
        game.update(0.01, set())
        self.assertTrue(game.alive)  # No invisible right arm.
        game.x, game.y = list(game.arm_segments("left"))[5][:2]
        game.update(0.01, set())
        self.assertFalse(game.alive)

    def test_raised_arm_and_near_misses_use_actual_shapes(self):
        for x, y in ((0, 60), (-150, 65), (150, 65)):
            game = self.game()
            game.x, game.y = x, y
            game.update(0.01, set())
            self.assertTrue(game.alive)
        game = self.game("raise", "left")
        game.stage_age = 0.5
        game.x, game.y = list(game.arm_segments("left"))[15][:2]
        game.update(0.01, set())
        self.assertFalse(game.alive)

    def test_moving_into_a_hand_kills_even_on_a_slow_frame(self):
        game = self.game()
        game.x, game.y = 245, -30
        self.assertFalse(game.touches_king())
        game.update(0.25, {"Up"})
        self.assertEqual(game.lives, 0)
        self.assertFalse(game.alive)

    def test_easier_modes_menu_launch(self):
        for choice, mode in (("coward", COWARD_MODE), ("Coward Mode", COWARD_MODE),
                             ("baby", BABY_MODE), ("Baby Mode", BABY_MODE),
                             ("come_on", COME_ON_MODE), (COME_ON_NAME, COME_ON_MODE)):
            with patch("builtins.input", side_effect=[choice, "Ada"]), patch("turtle_dodge.subprocess.run") as run, redirect_stdout(io.StringIO()):
                run.return_value.returncode = 0
                start_turtle_dodge()
            self.assertEqual(run.call_args.args[0][-2:], ["Ada", mode])

    def test_intro_transformation_and_exact_slam_order(self):
        game = PumpkinKing()
        stages = [game.stage, *game.queue]
        self.assertEqual([s.name for s in stages[:7]], ["shell", "glow", "left_burst", "right_burst", "shatter", "roar", "fire"])
        self.assertEqual(tuple(s.side for s in stages if s.name == "slam"), SLAM_ORDER)
        self.assertEqual([s.name for s in stages[-5:]], ["roar", "fire", "title", "laugh", "break"])
        impact_times, now = [], 0
        for stage in slam_stages():
            if stage.name == "slam":
                impact_times.append(now)
            if stage.name == "raise":
                self.assertEqual(stage.duration, 0.5)
            now += stage.duration
        for a, b in zip(impact_times, impact_times[1:]):
            self.assertAlmostEqual(b-a, 0.8)

    def test_cutscene_cannot_be_skipped_by_shooting(self):
        game = PumpkinKing()
        game.update(1.0, {"f"})
        self.assertEqual(game.hp, 1400)
        self.assertFalse(game.shots)

    def test_slam_damage_and_center_safe_for_both(self):
        for side, x, expected in (("left", -150, 0), ("right", 150, 0),
                                   ("left", 150, 5), ("right", -150, 5),
                                   ("left", 0, 0), ("right", 0, 0),
                                   ("both", 0, 5), ("both", -150, 0), ("both", 150, 0)):
            game = self.game("slam", side)
            game.x = x
            game.update(0.05, set())
            self.assertEqual(game.lives, expected, (side, x))

    def test_raised_arm_is_warning_and_fire_hurts_center(self):
        game = self.game("raise", "left")
        game.x = -150
        game.update(0.1, set())
        self.assertEqual(game.lives, 5)
        game.stage = Stage("fire", 1)
        game.x = 0
        game.update(0.01, set())
        self.assertEqual(game.lives, 4)

    def test_memory_flashes_six_colors_then_replays_same_order(self):
        game = PumpkinKing(random.Random(7))
        game.begin_attack(0)
        self.assertEqual(len(game.sequence), 6)
        self.assertEqual(set(game.sequence), {"blue", "orange"})
        self.assertAlmostEqual(game.stage.duration, 6.0)
        self.assertIn("6 colors", game.pattern_label)
        for i, color in enumerate(game.sequence):
            game.stage_age = i*EYE_FLASH_PERIOD+EYE_FLASH_ON/2
            self.assertEqual(game.eye_rule, color)
            game.stage_age = i*EYE_FLASH_PERIOD+EYE_FLASH_ON+EYE_FLASH_GAP/2
            self.assertIsNone(game.eye_rule)
        stages = list(game.queue)
        self.assertEqual([s.side for s in stages if s.name == "color"], game.sequence)
        gaps = [s.duration for s in stages if s.name == "color_gap"]
        self.assertEqual(gaps, [COLOR_BREAK]*5)

    def test_color_laws_work_on_slow_frames(self):
        for rule, keys, expected in (("blue", set(), 5), ("blue", {"Right"}, 4),
                                     ("orange", set(), 4), ("orange", {"Right"}, 5)):
            game = self.game("color", rule)
            game.update(0.05, keys)
            self.assertEqual(game.lives, expected)

    def test_bones_have_gaps_and_move_fast(self):
        game = self.game("bones")
        game._spawn()
        self.assertTrue(all(b.bone and abs(b.vx) == 340 for b in game.bullets))
        heights = sorted(b.y for b in game.bullets)
        self.assertTrue(any(b-a > 80 for a, b in zip(heights, heights[1:])))

    def test_rings_rotate_fall_and_have_opposite_colored_sides(self):
        game = self.game("rings")
        ring = Ring(150, 100, 0, "blue")
        game.rings = [ring]
        pieces = list(ring.pieces())
        self.assertEqual(sum(p[4] == "blue" for p in pieces), RING_SEGMENTS//4)
        self.assertEqual(sum(p[4] == "orange" for p in pieces), RING_SEGMENTS//4)
        self.assertEqual(sum(p[4] == "normal" for p in pieces), RING_SEGMENTS//2)
        for i, piece in enumerate(pieces):
            opposite = pieces[(i+RING_SEGMENTS//2) % RING_SEGMENTS]
            self.assertAlmostEqual(piece[0]+opposite[0], 2*ring.x)
            self.assertAlmostEqual(piece[1]+opposite[1], 2*ring.y)
            self.assertEqual(opposite[4], {"blue": "orange", "orange": "blue", "normal": "normal"}[piece[4]])
        game.update(0.1, set())
        self.assertLess(ring.y, 100)
        self.assertGreater(ring.angle, 0)

    def test_rings_nearly_fill_arena_without_gaps_in_the_outline(self):
        game = self.game("rings")
        for _ in range(10):
            game._spawn()
            ring = game.rings[-1]
            self.assertEqual(ring.x, (game.left+game.right)/2)
            pieces = list(ring.pieces())
            width = max(p[0]+p[2]/2 for p in pieces)-min(p[0]-p[2]/2 for p in pieces)
            height = max(p[1]+p[3]/2 for p in pieces)-min(p[1]-p[3]/2 for p in pieces)
            self.assertGreater(width, 0.9*(game.right-game.left))
            self.assertLess(width, game.right-game.left)
            self.assertGreater(height, 0.9*(game.top-game.bottom))
            self.assertLess(height, game.top-game.bottom)
            self.assertGreaterEqual(min(p[1]-p[3]/2 for p in pieces), game.top)
            for a, b in zip(pieces, pieces[1:]+pieces[:1]):
                self.assertLess(abs(a[0]-b[0]), RING_THICKNESS)
                self.assertLess(abs(a[1]-b[1]), RING_THICKNESS)

    def test_both_ring_colors_apply_their_movement_rules(self):
        for first_rule in ("blue", "orange"):
            for side in (-1, 1):
                rule = first_rule if side == 1 else {"blue": "orange", "orange": "blue"}[first_rule]
                for moving in (False, True):
                    with self.subTest(first_rule=first_rule, side=side, moving=moving):
                        game = self.game("rings")
                        ring = Ring(0, -130, 0, first_rule)
                        game.rings = [ring]
                        game.x, game.y = side*ring.radius, ring.y
                        game.update(0.01, {"Up"} if moving else set())
                        dangerous = (rule == "blue" and moving) or (rule == "orange" and not moving)
                        self.assertEqual(game.lives, 4 if dangerous else 5)

    def test_falling_rings_stay_separated_at_different_frame_rates(self):
        for seed in (7, 42):
            for dt in (1/60, 0.05, 0.25):
                with self.subTest(seed=seed, dt=dt):
                    game = PumpkinKing(random.Random(seed))
                    game.begin_attack(2)
                    game.invulnerable = 100
                    peak_rings = 0
                    for _ in range(round(8/dt)):
                        game.update(dt, set())
                        rings = sorted(game.rings, key=lambda ring: ring.y)
                        peak_rings = max(peak_rings, len(rings))
                        for lower, upper in zip(rings, rings[1:]):
                            lower_top = max(y+height/2 for x, y, width, height, rule in lower.pieces())
                            upper_bottom = min(y-height/2 for x, y, width, height, rule in upper.pieces())
                            self.assertGreaterEqual(upper_bottom-lower_top, 40)
                    self.assertGreaterEqual(peak_rings, 2)

    def test_rings_remain_until_the_last_visible_edge_leaves(self):
        game = self.game("rings")
        ring = Ring(0, game.bottom-220-RING_THICKNESS/2+2, 0, "blue")
        game.rings = [ring]
        game.update(0.005, set())
        self.assertEqual(game.rings, [ring])
        game.update(0.02, set())
        self.assertEqual(game.rings, [])

    def test_counter_destroys_fingers_only_with_timed_press(self):
        game = self.game("fingers")
        game.update(0.01, {"c"})
        self.assertEqual(game.counter_time, 0)  # C no longer activates the counter.
        game.bullets = [Finger(game.x, game.y, 0, 0, rule="magenta")]
        game.update(0.01, {"e"})
        self.assertEqual(game.lives, 5)
        self.assertEqual(game.counter_hits, 1)
        self.assertEqual(game.bullets, [])
        game.update(0.8, {"e"})
        game.bullets = [Finger(game.x, game.y, 0, 0, rule="magenta")]
        game.update(0.01, {"e"})
        self.assertEqual(game.lives, 4)  # Holding E never automatically counters.

    def test_early_counter_expires_and_does_not_block_white_bullets(self):
        game = self.game("fingers")
        game.update(COUNTER_WINDOW+0.02, {"e"})
        game.bullets = [Finger(game.x, game.y, 0, 0, rule="magenta")]
        game.update(0.01, set())
        self.assertEqual(game.lives, 4)
        other = self.game()
        other.bullets = [Projectile(other.x, other.y, 0, 0)]
        other.update(0.01, {"e"})
        self.assertEqual(other.lives, 4)

    def test_fingers_home_toward_player(self):
        game = self.game("fingers")
        finger = Finger(200, 0, 0, 0, rule="magenta")
        game.bullets = [finger]
        game.update(0.1, set())
        self.assertLess(finger.x, 200)
        self.assertLess(finger.y, 0)

    def test_chaos_has_mostly_white_with_both_colors(self):
        game = self.game("chaos")
        for _ in range(30):
            game._spawn()
        rules = [b.rule for b in game.bullets]
        self.assertGreater(rules.count("normal"), len(rules)/2)
        self.assertIn("orange", rules)
        self.assertIn("blue", rules)

    def test_all_six_attacks_cycle_and_have_one_second_breaks(self):
        game = PumpkinKing(random.Random(4))
        for index in range(6):
            game.begin_attack(index)
            self.assertEqual(game.queue[-1], Stage("break", ATTACK_BREAK))
        game.begin_attack(0)
        game.invulnerable = 1000
        # Isolate attack scheduling from the now-lethal physical slam contact.
        game.touches_king = lambda: False
        seen = set()
        max_objects = 0
        for _ in range(6000):
            game.update(1/60, set())
            seen.add(game.attack_index)
            max_objects = max(max_objects, len(game.bullets)+len(game.rings)*RING_SEGMENTS)
        self.assertEqual(seen, set(range(6)))
        self.assertLess(max_objects, 900)

    def test_healing_every_16_seconds_lasts_nine_and_caps_at_five(self):
        game = self.game()
        game.update(15.99, set())
        self.assertEqual(game.healing_pickups, [])
        game.update(0.02, set())
        self.assertEqual(len(game.healing_pickups), 1)
        self.assertAlmostEqual(game.healing_pickups[0].remaining, 9, delta=0.02)
        game.update(9.01, set())
        self.assertEqual(game.healing_pickups, [])
        for hp, expected in ((3, 4), (4, 5), (5, 5)):
            game.lives = hp
            game.healing_pickups = [HealingPickup(game.x, game.y, 9)]
            game.update(0.01, set())
            self.assertEqual(game.lives, expected)

    def test_shoot_damage_victory_and_restart(self):
        game = self.game()
        game.shots = [Projectile(game.boss_x, game.boss_y, 0, 520)]
        game.update(0.01, set())
        self.assertEqual(game.hp, 1395)
        game.hp = 5
        game.shots = [Projectile(game.boss_x, game.boss_y, 0, 520)]
        game.update(0.01, set())
        self.assertTrue(game.won)
        self.assertEqual(game.hp, 0)
        score = game.score
        game.update(1, {"f"})
        self.assertEqual(game.score, score)
        new = create_game(MODE)
        self.assertEqual((new.hp, new.lives, new.stage.name), (1400, 5, "shell"))


if __name__ == "__main__":
    unittest.main()
