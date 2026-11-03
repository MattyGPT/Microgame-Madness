"""Death presentation freezes gameplay and never awards a false victory."""
import unittest

from arcade_effects import DEATH_DURATION, TURTLE_PIXELS, death_pixels
from singularity_core import (ATTACKS, LASER_DURATION, LASER_IMPLODE, LASER_SHATTER,
                              SingularityCore)
from web.bridge import BrowserGame


class EndingsTests(unittest.TestCase):
    def test_turtle_pixels_disperse_and_finish_at_exactly_one_point_six_seconds(self):
        self.assertGreater(len(TURTLE_PIXELS), 15)
        initial = death_pixels(0, 0, 0)
        scattered = death_pixels(0, 0, .7)
        self.assertEqual(len(initial), len(scattered))
        self.assertGreater(max(abs(x) for x,y,s in scattered), 20)
        self.assertEqual(death_pixels(0, 0, DEATH_DURATION), [])

    def test_each_turtle_mode_freezes_combat_and_plays_one_death_event(self):
        for mode, difficulty in [('dodge','easy'), ('boss','mean'), ('pumpkin','baby'),
                                 ('wrath','royal_slams'), ('singularity','gravitron'),
                                 ('core_practice','railgun_array')]:
            with self.subTest(mode=mode):
                session = BrowserGame()
                session.start(mode, difficulty, 0)
                session.game.alive = False
                first = session.snapshot()
                self.assertTrue(first['dying'])
                self.assertTrue(first['over'])
                self.assertFalse(first['won'])
                self.assertEqual(first['sounds'].count('turtle_death'), 1)
                self.assertNotIn('turtle_death', session.snapshot()['sounds'])
                before = session.game.elapsed, session.game.x, session.game.y, session.game.score
                for i in range(31):
                    state = session.dispatch(dict(action='tick', dt=.05, keys=['Right','f']))
                    self.assertTrue(state['dying'])
                state = session.dispatch(dict(action='tick', dt=.05))
                self.assertFalse(state['dying'])
                self.assertAlmostEqual(state['death_age'], DEATH_DURATION)
                self.assertEqual(before, (session.game.elapsed, session.game.x, session.game.y, session.game.score))
                session.start(mode, difficulty, 0)
                self.assertIsNone(session.death_age)
                self.assertFalse(session.snapshot()['dying'])

    def test_core_finisher_locks_aim_and_only_wins_after_shattering(self):
        game = SingularityCore()
        game.attacks_completed = len(ATTACKS)
        game.stage = 'exposed'
        self.assertTrue(game.fire_laser())
        start = game.x, game.y
        phases = []
        for i in range(round(LASER_DURATION/.05)-1):
            game.update(.05, {'Left','Up','f'})
            phases.append(game.laser_phase)
            self.assertFalse(game.won)
            self.assertEqual((game.x, game.y), start)
        self.assertEqual(set(phases), {'beam','whitening','implosion','shatter'})
        self.assertEqual(game.sound_events.count('core_implode'), 1)
        self.assertEqual(game.sound_events.count('core_destroyed'), 1)
        game.update(.05, set())
        self.assertTrue(game.won)
        self.assertEqual(game.laser_phase, 'complete')
        self.assertEqual(game.hp, 0)
