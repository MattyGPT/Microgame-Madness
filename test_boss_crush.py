import io
import unittest
from contextlib import redirect_stdout
from unittest.mock import patch

from boss_crush import (BOSS_DIFFICULTIES, BOSS_HEIGHT, PAIR_DELAY, PATTERNS, PATTERN_DURATION, PATTERN_WARNING,
                        HEAL_INTERVAL, HEAL_LIFETIME, HealingPickup,
                        LUNGE_WARNING, LUNGE_RECOVERY, BossCrush, Projectile, hits_player)
from turtle_dodge import create_game, dodge_score_file, start_turtle_dodge


class BossTests(unittest.TestCase):
    def game(self, difficulty="mean"):
        game = BossCrush(difficulty)
        game.attack_in = 1000
        return game

    def test_shooting_requires_f_and_has_cooldown(self):
        game = self.game()
        game.update(0.1, set())
        self.assertEqual(game.shots, [])
        game.update(0.5, {"f"})
        self.assertEqual(len(game.shots), 3)
        self.assertEqual(game.hp, game.config.hp)

    def test_shot_hits_once_and_reduces_hp(self):
        game = self.game()
        game.shots = [Projectile(0, game.boss_y - 25, 0, 520)]
        game.update(0.05, set())
        self.assertEqual(game.hp, game.config.hp - 5)
        self.assertEqual(game.shots, [])
        self.assertEqual(game.score, 50)

    def test_winning_stops_combat_and_awards_bonus(self):
        game = self.game()
        game.hp = 5
        game.shots = [Projectile(0, game.boss_y, 0, 520)]
        game.update(0.01, set())
        self.assertTrue(game.won)
        self.assertEqual(game.hp, 0)
        score, elapsed = game.score, game.elapsed
        self.assertGreater(score, game.config.hp * 10)
        game.update(10, {"f", "Right"})
        self.assertEqual((game.score, game.elapsed), (score, elapsed))

    def test_hit_protection_and_three_lives(self):
        game = self.game()
        for lives in (2, 1, 0):
            game.invulnerable = 0
            game.bullets = [Projectile(game.x, game.y, 0, 0) for _ in range(5)]
            game.update(0.01, set())
            self.assertEqual(game.lives, lives)
            self.assertEqual(game.alive, lives > 0)
        elapsed = game.elapsed
        game.update(10, set())
        self.assertEqual(game.elapsed, elapsed)

    def test_bullet_near_miss_uses_turtle_outline(self):
        self.assertFalse(hits_player(0, 0, 13, 0, 7, 7))
        self.assertTrue(hits_player(0, 0, 0, 0, 7, 7))

    def test_boss_contact_kills_instantly_even_during_hit_protection(self):
        for mode in BOSS_DIFFICULTIES:
            for protection in (0, 1):
                with self.subTest(mode=mode, protection=protection):
                    game = self.game(mode)
                    game.x, game.y = game.boss_x, game.boss_y
                    game.invulnerable = protection
                    game.update(0.01, set())
                    self.assertFalse(game.alive)
                    self.assertEqual(game.lives, 0)
                    self.assertIn("CRUSHED BY THE BOSS!", game.death_message)
                    elapsed = game.elapsed
                    game.update(1, {"f"})
                    self.assertEqual(game.elapsed, elapsed)
        self.assertIsNone(self.game().death_message)

    def test_boss_contact_takes_priority_over_final_shot(self):
        game = self.game()
        game.x, game.y = game.boss_x, game.boss_y
        game.hp = 5
        game.shots = [Projectile(game.boss_x, game.boss_y, 0, 520)]
        game.update(0.01, {"f"})
        self.assertFalse(game.alive)
        self.assertFalse(game.won)

    def test_boss_near_miss_does_not_kill(self):
        game = self.game()
        game.y = game.boss_y - 21 - 16 - 0.1
        game.update(0.01, set())
        self.assertTrue(game.alive)
        self.assertEqual(game.lives, 3)
        self.assertIsNone(game.death_message)

    def test_all_bosses_touch_ceiling_during_normal_movement(self):
        for mode in BOSS_DIFFICULTIES:
            game = self.game(mode)
            self.assertEqual(game.boss_y + BOSS_HEIGHT / 2, game.top)
            game.update(0.2, set())
            self.assertEqual(game.boss_y + BOSS_HEIGHT / 2, game.top)

    def test_player_cannot_hide_above_boss(self):
        for mode in BOSS_DIFFICULTIES:
            game = self.game(mode)
            game.x = game.boss_x
            game.y = game.top - 16
            game.update(0.001, set())
            self.assertFalse(game.alive)
            self.assertIn("CRUSHED BY THE BOSS", game.death_message)

    def test_fast_bullet_does_not_skip_player(self):
        game = self.game()
        game.bullets = [Projectile(0, -100, 0, -1000)]
        game.update(0.2, set())
        self.assertEqual(game.lives, 2)

    def test_patterns_change_and_difficulties_increase(self):
        settings = list(BOSS_DIFFICULTIES.values())
        for earlier, later in zip(settings, settings[1:]):
            self.assertGreater(later.hp, earlier.hp)
            self.assertGreater(later.bullet_speed, earlier.bullet_speed)
            self.assertGreater(later.count, earlier.count)
            self.assertLess(later.interval, earlier.interval)
        game = self.game("nightmare")
        patterns = []
        for _ in range(3):
            game.bullets.clear()
            game.attack()
            patterns.append([(b.vx, b.vy) for b in game.bullets])
        self.assertNotEqual(patterns[0], patterns[1])
        self.assertGreater(len(patterns[2]), len(patterns[0]))

    def test_offscreen_projectiles_are_removed(self):
        game = self.game()
        game.shots = [Projectile(200, 500, 0, 520)]
        game.bullets = [Projectile(500, 500, 100, 100)]
        game.update(0.01, set())
        self.assertEqual(game.shots, [])
        self.assertEqual(game.bullets, [])

    def test_menu_and_separate_score_files(self):
        with patch("builtins.input", side_effect=["boss", "bad", " Cruel ", "Ada"]), patch("turtle_dodge.subprocess.run") as run, redirect_stdout(io.StringIO()):
            run.return_value.returncode = 0
            start_turtle_dodge()
        self.assertEqual(run.call_args.args[0][-2:], ["Ada", "cruel"])
        paths = [dodge_score_file(mode) for mode in (*BOSS_DIFFICULTIES, "easy", "normal", "hard", "merciless")]
        self.assertEqual(len(set(paths)), 8)
        for mode in BOSS_DIFFICULTIES:
            self.assertIsInstance(create_game(mode), BossCrush)

    def test_impossible_menu_launch(self):
        with patch("builtins.input", side_effect=["boss", "impossible", "Ada"]), patch("turtle_dodge.subprocess.run") as run, redirect_stdout(io.StringIO()):
            run.return_value.returncode = 0
            start_turtle_dodge()
        self.assertEqual(run.call_args.args[0][-2:], ["Ada", "impossible"])

    def test_blue_requires_stillness_and_orange_requires_movement(self):
        for rule, keys, expected in (("blue", set(), 5), ("blue", {"Right"}, 4),
                                     ("orange", set(), 4), ("orange", {"Right"}, 5),
                                     ("blue", {"f"}, 5), ("orange", {"f"}, 4)):
            with self.subTest(rule=rule, keys=keys):
                game = self.game("impossible")
                game.bullets = [Projectile(game.x, game.y, 0, 0, rule=rule)]
                game.update(0.001, keys)
                self.assertEqual(game.lives, expected)

    def test_orange_does_not_hurt_moving_player_on_slow_frames(self):
        for dt in (1 / 144, 1 / 60, 1 / 30, 0.05, 0.1, 0.2):
            for keys in ({"Right"}, {"Left"}, {"Up"}, {"Down"}, {"Up", "Right"}):
                with self.subTest(dt=dt, keys=keys):
                    game = self.game("impossible")
                    game.y = 0
                    game.bullets = [Projectile(0, 0, 0, 0, width=200, height=200, rule="orange")]
                    game.update(dt, keys)
                    self.assertEqual(game.lives, game.max_lives)
                    self.assertEqual(game.invulnerable, 0)

    def test_stopping_in_orange_still_hurts_after_slow_frame(self):
        game = self.game("impossible")
        game.y = 0
        game.bullets = [Projectile(0, 0, 0, 0, width=200, height=200, rule="orange")]
        game.update(0.05, {"Right"})
        self.assertEqual(game.lives, game.max_lives)
        game.update(0.05, set())
        self.assertEqual(game.lives, game.max_lives - 1)

    def test_zero_length_frame_does_not_apply_damage(self):
        game = self.game("impossible")
        game.bullets = [Projectile(game.x, game.y, 0, 0, rule="orange")]
        game.update(1e-17, {"Right"})
        self.assertEqual(game.lives, game.max_lives)

    def test_safe_blue_bullet_can_hurt_if_you_start_moving(self):
        game = self.game("impossible")
        game.bullets = [Projectile(game.x, game.y, 0, 0, rule="blue")]
        game.update(0.001, set())
        self.assertEqual(len(game.bullets), 1)
        game.update(0.001, {"Right"})
        self.assertEqual(game.lives, game.max_lives - 1)

    def test_pushing_against_wall_is_not_movement(self):
        game = self.game("impossible")
        game.x = game.right - 9
        game.bullets = [Projectile(game.x, game.y, 0, 0, rule="orange")]
        game.update(0.001, {"Right"})
        self.assertEqual(game.lives, game.max_lives - 1)

    def test_pattern_warnings_and_transitions_clear_old_bullets(self):
        game = BossCrush("impossible")
        game.update(PATTERN_WARNING - 0.01, set())
        self.assertEqual(game.bullets, [])
        self.assertIn("GET READY", game.pattern_label)
        game.update(0.02, set())
        self.assertGreater(len(game.bullets), 0)
        game.phase_age = PATTERN_DURATION - 0.001
        game.update(0.002, set())
        self.assertEqual(game.pattern_index, 1)
        self.assertEqual(game.bullets, [])
        self.assertIn("GET READY", game.pattern_label)

    def test_each_impossible_pattern_has_expected_shapes(self):
        game = BossCrush("impossible")
        for pattern in range(len(PATTERNS)):
            game.pattern_index = pattern
            game.bullets.clear()
            game.attack()
            self.assertTrue(game.bullets)
            if pattern in (0, 4):
                self.assertTrue(all(b.bone for b in game.bullets))
                self.assertTrue(all(len(b.rectangles()) == 3 for b in game.bullets))
            elif pattern in (2, 3):
                self.assertEqual({b.rule for b in game.bullets}, {"blue" if pattern == 2 else "orange"})
            elif pattern == 5:
                self.assertEqual({b.rule for b in game.bullets}, {"blue", "orange"})
            else:
                self.assertTrue(any(b.vx > 0 for b in game.bullets))
                self.assertTrue(any(b.vx < 0 for b in game.bullets))

    def test_bone_cutouts_do_not_have_invisible_hitboxes(self):
        bone = Projectile(0, 0, 0, 0, width=24, height=48, bone=True)
        # Beside the narrow stem, beneath the wide end cap.
        self.assertFalse(any(hits_player(16, 0, *rect) for rect in bone.rectangles()))
        self.assertTrue(any(hits_player(0, 0, *rect) for rect in bone.rectangles()))

    def test_impossible_patterns_remain_bounded_over_time(self):
        game = BossCrush("impossible")
        game.invulnerable = 1000
        seen = set()
        maximum = 0
        for _ in range(3600):
            game.update(1 / 60, set())
            seen.add(game.pattern_index)
            maximum = max(maximum, len(game.bullets))
        self.assertEqual(seen, set(range(len(PATTERNS))))
        self.assertLess(maximum, 400)
        self.assertTrue(game.alive)

    def test_impossible_health_and_other_modes_unchanged(self):
        for mode in BOSS_DIFFICULTIES:
            game = BossCrush(mode)
            self.assertEqual(game.lives, 5 if mode == "impossible" else 3)
            self.assertEqual(game.max_lives, game.lives)
        game = BossCrush("impossible")
        self.assertEqual(game.hp, 900)
        for remaining in range(4, -1, -1):
            game.invulnerable = 0
            game.hurt()
            self.assertEqual(game.lives, remaining)
            self.assertEqual(game.alive, remaining > 0)

    def test_pair_has_delayed_orange_and_safe_timing_window(self):
        game = self.game("impossible")
        game.pattern_index = 5
        game.y = 0
        game.attack()
        blue = [b for b in game.bullets if b.rule == "blue"]
        orange = [b for b in game.bullets if b.rule == "orange"]
        self.assertEqual(len(blue), len(orange))
        self.assertTrue(all(b.delay == 0 for b in blue))
        self.assertTrue(all(b.delay == PAIR_DELAY for b in orange))
        game.update(1.1, set())  # Let blue pass while standing still.
        game.update(0.5, {"Right"})  # Move for the closely following orange.
        self.assertEqual(game.lives, game.max_lives)

    def test_standing_still_for_both_rows_costs_hp(self):
        game = self.game("impossible")
        game.pattern_index = 5
        game.y = 0
        game.attack()
        game.update(1.6, set())
        self.assertEqual(game.lives, game.max_lives - 1)

    def test_delayed_bullet_is_not_harmful_until_active(self):
        game = self.game("impossible")
        game.bullets = [Projectile(game.x, game.y, 0, 0, rule="orange", delay=PAIR_DELAY)]
        game.update(PAIR_DELAY - 0.01, set())
        self.assertEqual(game.lives, game.max_lives)
        game.update(0.03, set())
        self.assertEqual(game.lives, game.max_lives - 1)

    def test_impossible_speed_is_between_old_and_fast_versions(self):
        self.assertGreater(BOSS_DIFFICULTIES["impossible"].movement, 1.3)
        self.assertLess(BOSS_DIFFICULTIES["impossible"].movement, 3.0)

    def test_final_phase_starts_at_200_hp_and_clears_all_bullets(self):
        game = self.game("impossible")
        game.hp = 205
        game.bullets = [Projectile(game.x, game.y, 0, 0, delay=2)]
        game.update(0.01, set())
        self.assertIsNone(game.lunge_state)
        game.shots = [Projectile(game.boss_x, game.boss_y, 0, 520)]
        game.update(0.01, set())
        self.assertEqual(game.hp, 200)
        self.assertEqual(game.lunge_state, "warning")
        self.assertEqual(game.bullets, [])
        game.attack()
        self.assertEqual(game.bullets, [])

    def test_warning_holds_boss_and_locks_target_before_fast_charge(self):
        game = self.game("impossible")
        game.hp = 200
        game.update(0.01, set())
        position = game.boss_x, game.boss_y
        target = game.lunge_target
        game.update(LUNGE_WARNING - 0.03, {"Right"})
        self.assertEqual(game.lunge_state, "warning")
        self.assertEqual((game.boss_x, game.boss_y), position)
        self.assertEqual(game.lunge_target, target)
        game.update(0.05, set())
        self.assertEqual(game.lunge_state, "lunging")
        self.assertLess(game.boss_y, position[1])
        game.update(0.5, set())
        self.assertTrue(game.alive)
        self.assertEqual(game.lunge_state, "recovery")
        self.assertEqual(game.bullets, [])
        game.update(LUNGE_RECOVERY, set())
        self.assertEqual(game.lunge_state, "warning")
        self.assertAlmostEqual(game.lunge_target[0], game.x)

    def test_lunge_contact_kills_even_during_hit_protection(self):
        game = self.game("impossible")
        game.hp = 200
        game.invulnerable = 100
        game.update(1.3, set())
        self.assertFalse(game.alive)
        self.assertEqual(game.lives, 0)
        self.assertIn("CRUSHED BY THE BOSS", game.death_message)

    def test_final_phase_can_still_be_defeated(self):
        game = self.game("impossible")
        game.hp = 5
        game.shots = [Projectile(game.boss_x, game.boss_y, 0, 520)]
        game.update(0.01, {"f"})
        self.assertTrue(game.won)
        self.assertEqual(game.hp, 0)

    def test_other_difficulties_do_not_lunge_at_low_hp(self):
        for mode in ("mean", "cruel", "nightmare"):
            game = self.game(mode)
            game.hp = 100
            game.update(0.01, set())
            self.assertIsNone(game.lunge_state)

    def test_healing_spawns_every_15_seconds_only_on_impossible(self):
        for mode in BOSS_DIFFICULTIES:
            game = self.game(mode)
            game.invulnerable = 1000
            game.update(HEAL_INTERVAL - 0.01, set())
            self.assertEqual(game.healing_pickups, [])
            game.update(0.02, set())
            self.assertEqual(len(game.healing_pickups), 1 if mode == "impossible" else 0)
            if mode == "impossible":
                pickup = game.healing_pickups[0]
                self.assertTrue(game.left < pickup.x < game.right)
                self.assertTrue(game.bottom < pickup.y < game.top)
                game.update(HEAL_INTERVAL, set())
                self.assertEqual(len(game.healing_pickups), 1)
                self.assertIsNot(game.healing_pickups[0], pickup)

    def test_healing_restores_one_hp_once_and_never_exceeds_max(self):
        for hp, expected in ((3, 4), (4, 5), (5, 5)):
            game = self.game("impossible")
            game.lives = hp
            game.healing_pickups = [HealingPickup(game.x, game.y)]
            game.update(0.01, set())
            self.assertEqual(game.lives, expected)
            self.assertEqual(game.healing_pickups, [])
            game.update(0.01, set())
            self.assertEqual(game.lives, expected)

    def test_healing_pickup_expires(self):
        game = self.game("impossible")
        game.invulnerable = 100
        game.healing_pickups = [HealingPickup(200, 0)]
        game.update(HEAL_LIFETIME, set())
        self.assertEqual(game.healing_pickups, [])

    def test_healing_cannot_revive_after_fatal_bullet(self):
        game = self.game("impossible")
        game.lives = 1
        game.healing_pickups = [HealingPickup(game.x, game.y)]
        game.bullets = [Projectile(game.x, game.y, 0, 0)]
        game.update(0.01, set())
        self.assertFalse(game.alive)
        self.assertEqual(game.lives, 0)

    def test_healing_still_spawns_during_final_phase_and_resets_on_restart(self):
        game = self.game("impossible")
        game.hp = 200
        game.heal_in = 0.01
        game.update(0.02, set())
        self.assertEqual(game.lunge_state, "warning")
        self.assertEqual(len(game.healing_pickups), 1)
        fresh = BossCrush("impossible")
        self.assertEqual(fresh.heal_in, HEAL_INTERVAL)
        self.assertEqual(fresh.healing_pickups, [])


if __name__ == "__main__":
    unittest.main()
