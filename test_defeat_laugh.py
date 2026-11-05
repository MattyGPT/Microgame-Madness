"""Defeat expressions animate without advancing combat or changing rewards."""
import unittest
from web.bridge import BrowserGame
from arcade_effects import DEATH_DURATION


class DefeatLaughTests(unittest.TestCase):
    def test_all_boss_mouths_animate_without_advancing_combat(self):
        for mode, difficulty in [('boss', 'mean'), ('boss', 'impossible'),
                                 ('pumpkin', 'baby'), ('wrath', 'color_memory'),
                                 ('singularity', 'gravitron'), ('core_practice', 'railgun_array')]:
            with self.subTest(mode=mode, difficulty=difficulty):
                session = BrowserGame()
                session.start(mode, difficulty, 0)
                if mode in ('pumpkin', 'wrath'):
                    session.game.begin_attack(0)
                session.game.alive = False
                session.death_age = DEATH_DURATION
                before = session.snapshot()
                elapsed = session.game.elapsed
                after = session.dispatch({'action': 'defeat_frame', 'dt': .05})
                self.assertNotEqual(before['commands'], after['commands'])
                self.assertEqual(before['score'], after['score'])
                self.assertEqual(before['hp'], after['hp'])
                self.assertEqual(session.game.elapsed, elapsed)
                self.assertFalse(session.game.alive)
                self.assertFalse(session.game.won)

    def test_live_and_victorious_bosses_never_start_defeat_animation(self):
        session = BrowserGame()
        session.start('boss', 'mean', 0)
        for won in (False, True):
            session.game.won = won
            session.dispatch({'action': 'defeat_frame', 'dt': .05})
            self.assertFalse(hasattr(session.game, 'defeat_laugh_age'))
