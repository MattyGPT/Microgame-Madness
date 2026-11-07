"""Fight telemetry and input-only speedrun benchmark regression checks."""
import random
import unittest
from pumpkin_king import PumpkinKing
from scripts.benchmark_pumpkin_speedrun import run
from web.bridge import BrowserGame


class PumpkinCustomRewardsTests(unittest.TestCase):
    def test_shots_count_actual_projectiles_and_survive_projectile_cleanup(self):
        game = PumpkinKing(random.Random(0), 'come_on')
        game.update(.2, {'f'})
        self.assertEqual(game.shots_fired, 0)  # Locked during the introduction.
        game.begin_attack(0)
        game.update(.01, {'f'})
        self.assertEqual(game.shots_fired, 1)
        game.shots.clear()
        game.update(.01, set())
        self.assertEqual(game.shots_fired, 1)
        game.update(.2, {'f'})
        self.assertEqual(game.shots_fired, 2)
        self.assertEqual(PumpkinKing().shots_fired, 0)

    def test_continuous_fire_dodge_wins_near_lower_bound_at_mobile_and_desktop_rates(self):
        for fps in (30, 60, 120):
            with self.subTest(fps=fps):
                game = run(0, fps)
                self.assertTrue(game.won)
                self.assertTrue(game.alive)
                self.assertGreaterEqual(game.shots_fired, 280)  # 1400 HP / 5 damage.
                self.assertGreater(game.elapsed, 66)
                self.assertLessEqual(game.elapsed, 70)
                self.assertGreater(game.lives, 0)
                self.assertLessEqual(game.lives, game.max_lives)

    def test_browser_exports_unrounded_fight_time_and_persistent_shot_count(self):
        session = BrowserGame()
        session.start('pumpkin', 'come_on', 0)
        session.game = PumpkinKing(random.Random(0), 'come_on')
        session.game.elapsed = 70.001
        session.game.shots_fired = 4
        result = session.snapshot()
        self.assertEqual(result['fight_elapsed'], 70.001)
        self.assertEqual(result['shots_fired'], 4)
        session.paused = True
        session.dispatch({'action':'tick', 'dt':1, 'keys':['f']})
        self.assertEqual(session.game.elapsed, 70.001)
        self.assertEqual(session.game.shots_fired, 4)
