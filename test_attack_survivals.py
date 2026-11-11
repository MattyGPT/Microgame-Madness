"""Attack completion evidence shared by full fights and repeat loaders."""
import random
import unittest

from pumpkin_king import PumpkinKing, ATTACK_BREAK
from kings_wrath import KingsWrath, WRATH_ATTACKS, WRATH_BREAK_TIME
from singularity_core import SingularityCore, ATTACKS
from singularity_practice import SingularityPractice, SingularityCutscene, PRACTICE_ATTACKS
from web.bridge import BrowserGame


class AttackSurvivalTests(unittest.TestCase):
    def protect(self, game):
        game.invulnerable = 1000000
        # Test completion timing independently of the already-tested collisions.
        if isinstance(game, PumpkinKing):
            game.touches_king = lambda: False
        return game

    def test_every_pumpkin_attack_counts_at_its_end_in_both_modes(self):
        for key, index in WRATH_ATTACKS.items():
            for mode in ('pumpkin', 'wrath'):
                with self.subTest(mode=mode, attack=key):
                    game = self.protect(KingsWrath(key, random.Random(4)) if mode == 'wrath'
                                        else PumpkinKing(random.Random(4)))
                    if mode == 'pumpkin':
                        game.begin_attack(index)
                    duration = game.stage.duration + sum(stage.duration for stage in game.queue)
                    duration -= ATTACK_BREAK if mode == 'pumpkin' else WRATH_BREAK_TIME
                    game.update(duration - .01, set())
                    self.assertEqual(game.attack_survivals, [0] * 7)
                    game.update(.01, set())
                    self.assertEqual(game.attack_survivals, [int(i == index) for i in range(7)])
                    game.update(.2, set())
                    self.assertEqual(sum(game.attack_survivals), 1)

    def test_every_core_attack_counts_at_its_end_in_fight_and_loader(self):
        for key, index in PRACTICE_ATTACKS.items():
            for practice in (False, True):
                with self.subTest(attack=key, practice=practice):
                    game = self.protect(SingularityPractice(key, random.Random(4)) if practice
                                        else SingularityCore(random.Random(4)))
                    if practice:
                        game.update(game.ready_time, set())
                    else:
                        game.begin_attack(index)
                    game.update(ATTACKS[index].duration - .01, set())
                    self.assertEqual(game.attack_survivals, [0] * 15)
                    game.update(.01, set())
                    self.assertEqual(game.attack_survivals, [int(i == index) for i in range(15)])
                    if practice:
                        game.update(game.ready_time + ATTACKS[index].duration, set())
                        self.assertEqual(game.attack_survivals[index], 2)

    def test_random_wrath_records_the_finished_attack_before_selecting_the_next(self):
        game = self.protect(KingsWrath('random_order', random.Random(4)))
        for _ in range(7):
            index = game.attack_index
            duration = game.stage.duration + sum(stage.duration for stage in game.queue)
            game.update(duration, set())
            self.assertEqual(game.attack_survivals[index], 1)
        self.assertEqual(game.attack_survivals, [1] * 7)

    def test_intro_death_early_victory_and_finale_do_not_count(self):
        pumpkin = self.protect(PumpkinKing(random.Random(4)))
        duration = pumpkin.stage.duration + sum(stage.duration for stage in pumpkin.queue)
        pumpkin.update(duration, set())
        self.assertEqual(pumpkin.attack_survivals, [0] * 7)
        for game in (pumpkin, KingsWrath('bone_gauntlet'), SingularityCore(), SingularityPractice('echo_protocol')):
            game.alive = False
            game.update(100, set())
            self.assertEqual(sum(game.attack_survivals), 0)
        for game in (PumpkinKing(), KingsWrath('bone_gauntlet')):
            game.won = True
            game.update(100, set())
            self.assertEqual(sum(game.attack_survivals), 0)
        cutscene = SingularityCutscene()
        cutscene.update(100, set())
        self.assertEqual(cutscene.attack_survivals, [0] * 15)

    def test_bridge_exposes_a_copy_of_completion_evidence(self):
        bridge = BrowserGame()
        for mode, difficulty in [('pumpkin', 'baby'), ('wrath', 'chaos'), ('singularity', 'gravitron'), ('core_practice', 'photon_rain')]:
            snapshot = bridge.dispatch({'action': 'start', 'mode': mode, 'difficulty': difficulty, 'now': 0})
            self.assertEqual(sum(snapshot['attack_survivals']), 0)
            bridge.game.attack_survivals[0] = 1
            snapshot = bridge.snapshot()
            snapshot['attack_survivals'][0] = 99
            self.assertEqual(bridge.game.attack_survivals[0], 1)


if __name__ == '__main__':
    unittest.main()
