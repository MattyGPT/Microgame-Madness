"""Defeat expressions animate without advancing combat or changing rewards."""
import unittest
from web.bridge import BrowserGame
from arcade_effects import DEATH_DURATION


class DefeatLaughTests(unittest.TestCase):
    def test_all_boss_mouths_animate_without_advancing_combat(self):
        for mode, difficulty in [('boss', 'mean'), ('boss', 'cruel'), ('boss', 'nightmare'), ('boss', 'impossible'),
                                 ('pumpkin', 'baby'), ('wrath', 'color_memory')]:
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

    def test_each_boss_has_a_distinct_smooth_laugh(self):
        from pumpkin_king_view import LAUGH_STYLES, defeat_laugh_mouth
        poses = []
        for style, (period, *_rest) in LAUGH_STYLES.items():
            closed = defeat_laugh_mouth(0, 0, style, 0)
            opened = defeat_laugh_mouth(0, 0, style, period/2)
            self.assertNotEqual(closed, opened)
            poses.append(tuple(opened))
            # No jaw snap at the end of a laugh cycle.
            before = defeat_laugh_mouth(0, 0, style, period-.0001)
            after = defeat_laugh_mouth(0, 0, style, period+.0001)
            for a, b in zip(before, after):
                self.assertAlmostEqual(a[1], b[1], places=5)
        self.assertEqual(len(set(poses)), len(LAUGH_STYLES))

    def test_live_and_victorious_bosses_never_start_defeat_animation(self):
        session = BrowserGame()
        session.start('boss', 'mean', 0)
        for won in (False, True):
            session.game.won = won
            session.dispatch({'action': 'defeat_frame', 'dt': .05})
            self.assertFalse(hasattr(session.game, 'defeat_laugh_age'))

    def test_core_defeat_stays_faceless_and_does_not_animate_a_laugh(self):
        for mode, difficulty in [('singularity', 'gravitron'), ('core_practice', 'railgun_array')]:
            with self.subTest(mode=mode):
                session = BrowserGame()
                session.start(mode, difficulty, 0)
                session.game.alive = False
                session.death_age = DEATH_DURATION
                before = session.snapshot()
                after = session.dispatch({'action': 'defeat_frame', 'dt': .05})
                self.assertEqual(before['commands'], after['commands'])
                self.assertFalse(hasattr(session.game, 'defeat_laugh_age'))
                self.assertNotIn('#d9b8ff', str(after['commands']))
