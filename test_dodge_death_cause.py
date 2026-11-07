import unittest
from dodge_model import DodgeGame, Block, SHAPES, DIFFICULTIES, COLORS
from web.bridge import BrowserGame

class DodgeDeathCauseTests(unittest.TestCase):
    def test_square_identity_survives_difficulty_colors_and_repeated_ticks(self):
        for difficulty in DIFFICULTIES:
            with self.subTest(difficulty=difficulty):
                g=DodgeGame(difficulty=difficulty)
                g.blocks=[Block(g.x,g.y,SHAPES[1],g.rules.color or COLORS[1])]
                g.update(.001,set())
                self.assertFalse(g.alive)
                self.assertEqual(g.death_cause,'o_block')
                g.update(1,set())
                self.assertEqual(g.death_cause,'o_block')
                self.assertIsNone(DodgeGame(difficulty=difficulty).death_cause)

    def test_yellow_non_square_and_edges_do_not_count(self):
        g=DodgeGame(difficulty='hard')
        g.blocks=[Block(g.x,g.y,SHAPES[0],'#ffdf00'),Block(g.x,g.y,SHAPES[1],'#ffdf00')]
        g.update(.001,set())
        self.assertEqual(g.death_cause,'block')  # First fatal collision wins.
        g=DodgeGame(difficulty='merciless');g.x=g.right-9
        g.update(.01,{'Right'})
        self.assertEqual(g.death_cause,'edge')

    def test_browser_exports_fatal_piece(self):
        s=BrowserGame();s.start('dodge','merciless',0)
        s.game.blocks=[Block(s.game.x,s.game.y,SHAPES[1],'#ff3030')]
        r=s.dispatch({'action':'tick','dt':.001})
        self.assertEqual(r['death_cause'],'o_block')
        self.assertTrue(r['over'])
