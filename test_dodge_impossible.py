"""Impossible physics, scaled hitboxes, rendering, and mode isolation."""
import random
import unittest
from dodge_model import Block, DodgeGame, CELL, BLOCK_SIZE, PLAYER_RIGHT, touches_block
from turtle_dodge import create_game, dodge_score_file
from boss_crush import BossCrush
from web.bridge import BrowserGame


class ImpossibleDodgeTests(unittest.TestCase):
    def test_rules_and_spawned_geometry(self):
        game = DodgeGame(random.Random(17), 'impossible')
        previous = DodgeGame(difficulty='merciless')
        self.assertEqual(game.rules.bounds, (-210, 210, -170, 170))
        self.assertGreater(game.speed, previous.speed)
        self.assertGreater(game.rules.sway, previous.rules.sway)
        self.assertFalse(game.rules.can_pause)
        self.assertTrue(game.rules.deadly_edges)
        for _ in range(50):
            game.spawn()
        for block in game.blocks:
            self.assertEqual(block.color, '#ffffff')
            self.assertAlmostEqual(block.size, BLOCK_SIZE * .82)
            for x, y in block.centers():
                self.assertGreaterEqual(x - block.cell_size / 2, game.left)
                self.assertLessEqual(x + block.cell_size / 2, game.right)
        block = game.blocks[0]
        if len(block.cells) > 1:
            self.assertAlmostEqual(block.cell_size, CELL * .82)

    def test_collision_uses_smaller_visible_tile(self):
        block = Block(0, 0, ((0, 0),), '#ffffff', cell_size=CELL*.82)
        self.assertTrue(touches_block(0, 0, block))
        # The turtle's rightmost point is y=8. Place a tile just beyond it.
        block.x, block.y = PLAYER_RIGHT + block.size / 2 + .5, 8
        self.assertFalse(touches_block(0, 0, block))
        block.cell_size = CELL
        self.assertTrue(touches_block(0, 0, block))

    def test_white_blocks_and_pause_in_browser_bridge(self):
        session = BrowserGame()
        session.start('dodge', 'impossible', 0)
        session.game.spawn()
        state = session.snapshot()
        self.assertEqual(state['bounds'], [-210, 210, -170, 170])
        self.assertFalse(state['can_pause'])
        session.dispatch({'action':'pause'})
        self.assertFalse(session.paused)
        self.assertTrue(any(c.get('fill') == '#ffffff' for c in state['commands']))
        session.game.x = session.game.right - PLAYER_RIGHT - .01
        session.game.update(.01, {'Right'})
        self.assertFalse(session.game.alive)
        self.assertEqual(session.game.death_cause, 'edge')

    def test_desktop_impossible_does_not_replace_boss_crush(self):
        self.assertIsInstance(create_game('dodge_impossible'), DodgeGame)
        self.assertIsInstance(create_game('impossible'), BossCrush)
        self.assertNotEqual(dodge_score_file('dodge_impossible'), dodge_score_file('impossible'))
