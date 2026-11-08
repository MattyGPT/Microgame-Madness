"""Chaos balance, abilities, browser catalog, and classic-mode isolation."""
import random
import unittest
from chaos_dodge import CATALOG, NEW_SHAPES, catalog
from dodge_model import Block, DodgeGame, DIFFICULTIES
from web.bridge import BrowserGame


class ChaosTests(unittest.TestCase):
    def game(self):
        game = DodgeGame(random.Random(42), 'chaos')
        game.spawn_in = 999
        return game

    def block(self, game, kind, **extra):
        return Block(game.x, game.y, ((0, 0),), CATALOG[kind]['color'], kind=kind, **extra)

    def test_spawn_tickets_match_guide_exactly_and_total_one_hundred(self):
        from fractions import Fraction
        from unittest.mock import patch
        from chaos_dodge import exact_spawn_percentages, allocate_spawn_tickets, BLOCK_TYPES
        rates = exact_spawn_percentages()
        self.assertEqual(sum(rates.values()), 100)
        self.assertEqual(sum(row['weight'] for row in CATALOG.values()), 1000)
        self.assertEqual(rates['blaster'], 5)
        self.assertEqual(rates['wild_seven'], Fraction(4,5))
        rows = catalog()
        self.assertEqual(sum(Fraction(str(row['chance'])) for row in rows), 100)
        for row in rows:
            self.assertEqual(Fraction(str(row['chance'])), rates[row['id']])
            self.assertEqual((rates[row['id']]*10).denominator, 1)
            self.assertGreater(row['weight'], 0)
        game = self.game()
        lower = 0
        for kind, info in CATALOG.items():
            for ticket in (lower, lower+info['weight']-1):
                game.blocks = []
                with patch.object(game.rng, 'randrange', return_value=ticket), patch.object(game, 'make_chaos_block', return_value=kind):
                    game.spawn_chaos()
                self.assertEqual(game.blocks, [kind])
            lower += info['weight']
        grown = allocate_spawn_tickets(BLOCK_TYPES+(('future', 'Future', '#fff', '?', 2),))
        self.assertEqual(sum(grown.values()), 1000)
        self.assertGreater(grown['future'], 0)

    def test_thirty_block_expansion_catalog_and_spawn_configuration(self):
        from chaos_dodge import EXPANSION_TYPES, PICKUP_EFFECTS, CONTACT_EFFECTS, MOTION_BLOCKS, TURRET_BLOCKS
        self.assertEqual(len(EXPANSION_TYPES), 30)
        names = {row[0] for row in EXPANSION_TYPES}
        self.assertEqual(len(names), 30)
        self.assertEqual(names, set(PICKUP_EFFECTS)|set(CONTACT_EFFECTS)|set(MOTION_BLOCKS)|set(TURRET_BLOCKS))
        for kind in names:
            game = self.game()
            game.spawn_chaos(kind)
            block = game.blocks[0]
            self.assertEqual(block.kind, kind)
            self.assertEqual(block.cells, ((0, 0),))
            self.assertGreater(CATALOG[kind]['weight'], 0)
            block.x, block.y = 150, 100
            game.update(.1, set())
            self.assertLess(block.y, 100)
        total = sum(row['weight'] for row in CATALOG.values())
        self.assertAlmostEqual(CATALOG['blaster']['weight']/total, .05)
        self.assertAlmostEqual(CATALOG['wild_seven']['weight']/total, .008)

    def test_new_pickups_heal_cleanse_and_clear_nearby_pellets(self):
        game = self.game()
        game.lives = 3
        game.poison_ticks = 4
        game.chaos_contact(self.block(game, 'detox'))
        self.assertEqual((game.lives, game.poison_ticks), (3.5, 0))
        game.frost_left = 4
        game.chaos_contact(self.block(game, 'medkit'))
        self.assertEqual((game.lives, game.frost_left), (5.5, 0))
        game.burn_ticks = 3
        game.chaos_contact(self.block(game, 'coolant'))
        self.assertEqual((game.burn_ticks, game.slowfall_left), (0, 2))
        game.chaos_contact(self.block(game, 'battery'))
        self.assertTrue(game.shield)
        self.assertEqual(game.haste_left, 3)
        game.chaos_contact(self.block(game, 'snowglobe'))
        self.assertEqual((game.stasis_left, game.slowfall_left), (.75, 3))
        near = Block(game.x+179, game.y, ((0, 0),), '#fff')
        far = Block(game.x+181, game.y, ((0, 0),), '#fff')
        game.pellets = [near, far]
        game.chaos_contact(self.block(game, 'sweeper'))
        self.assertEqual(game.pellets, [far])
        self.assertEqual(game.lives, 6.5)
        game.burn_ticks = game.poison_ticks = 2
        game.vertigo_left = game.curse_left = game.frost_left = 2
        game.chaos_contact(self.block(game, 'clean_slate'))
        self.assertEqual((game.burn_ticks, game.poison_ticks, game.vertigo_left, game.curse_left, game.frost_left), (0,0,0,0,0))
        self.assertEqual(game.invulnerable, .75)
        game.spawn_in = .1
        game.chaos_contact(self.block(game, 'oasis'))
        self.assertEqual((game.lives, game.spawn_in), (7.5, 2))
        game.chaos_contact(self.block(game, 'bandage'))
        self.assertEqual(game.lives, 8)
        game.vertigo_left = 5
        game.chaos_contact(self.block(game, 'compass'))
        self.assertEqual((game.vertigo_left, game.repellent_left), (0, 2))

    def test_new_hazards_damage_effects_and_shields(self):
        for kind, damage in [('cinder',.5), ('spore',.5), ('sleet',1), ('dizzy',.5), ('leech',2), ('overload',1), ('glass',4)]:
            with self.subTest(kind=kind):
                game = self.game()
                block = self.block(game, kind)
                game.shield = True
                game.chaos_contact(block)
                self.assertEqual(game.lives, 8)
                self.assertEqual((game.burn_ticks, game.poison_ticks, game.frost_left, game.curse_left, game.vertigo_left), (0,0,0,0,0))
                game.invulnerable = 0
                game.chaos_contact(block)
                self.assertEqual(game.lives, 8-damage)
                if kind == 'cinder': self.assertEqual(game.burn_ticks, 3)
                if kind == 'spore': self.assertEqual(game.poison_ticks, 4)
                if kind == 'sleet': self.assertEqual((game.frost_left,game.curse_left), (3,2))
                if kind == 'dizzy': self.assertEqual(game.vertigo_left, 5)
                if kind == 'leech': self.assertEqual(game.regen_in, 16)
                if kind == 'overload': self.assertEqual((game.haste_left,game.curse_left), (2,3))
        game = self.game()
        game.shield = True
        game.haste_left = game.slowfall_left = game.stasis_left = 4
        game.chaos_contact(self.block(game, 'nullifier'))
        self.assertEqual((game.lives,game.shield,game.haste_left,game.slowfall_left,game.stasis_left), (7,False,0,0,0))

    def test_new_motion_timing_blink_and_two_hopper_bounces(self):
        from chaos_dodge import block_is_solid
        game = self.game()
        anvil = game.make_chaos_block('anvil')
        self.assertAlmostEqual(game.chaos_fall_speed(anvil), game.speed*.4)
        anvil.age = 1.2
        self.assertAlmostEqual(game.chaos_fall_speed(anvil), game.speed*2.4)
        blink = game.make_chaos_block('blink')
        for age, solid in ((0,True),(.399,True),(.4,False),(1.19,False),(1.2,True)):
            blink.age = age
            self.assertEqual(block_is_solid(blink), solid)
        boomerang = game.make_chaos_block('boomerang')
        boomerang.x, boomerang.y, boomerang.age = 150, 0, 1
        game.blocks = [boomerang]
        game.update(.01, set())
        self.assertGreater(boomerang.y, 0)
        self.assertGreater(boomerang.rise_left, 1)
        hopper = game.make_chaos_block('hopper')
        hopper.x = 150
        game.blocks = [hopper]
        for bounce in (1,2):
            hopper.y, hopper.rise_left = game.bottom+hopper.size/2, 0
            game.update(.01, set())
            self.assertEqual(hopper.bounce_count, bounce)
        hopper.y, hopper.rise_left = game.bottom+hopper.size/2, 0
        game.update(.01, set())
        self.assertEqual(hopper.bounce_count, 2)
        self.assertEqual(hopper.rise_left, 0)

    def test_four_new_turrets_fire_correct_volley_sizes_at_intervals(self):
        import math
        for kind, count, interval in [('crossbow',4,1.2),('diagonal',4,1.5),('spinner',1,.5),('scatter',3,.9)]:
            game = self.game()
            block = game.make_chaos_block(kind)
            game.update_blaster(block, interval-.001)
            self.assertEqual(game.pellets, [])
            game.update_blaster(block, .001)
            self.assertEqual(len(game.pellets), count)
            self.assertAlmostEqual(block.shot_in, interval)
            self.assertEqual(len(set(block.cannons)), count)
            if kind == 'spinner':
                first = game.cannon_angles(block)[0]
                block.age = 1
                self.assertAlmostEqual(game.cannon_angles(block)[0]-first, math.pi/2)

    def test_speed_blocks_use_wild_shapes_and_all_elite_tiles_affect_blocks(self):
        for kind in ('leafy', 'turbo', 'elite_leafy', 'elite_turbo'):
            for seed in range(30):
                wild = DodgeGame(random.Random(seed), 'chaos').make_chaos_block('normal')
                special = DodgeGame(random.Random(seed), 'chaos').make_chaos_block(kind)
                self.assertEqual(special.cells, wild.cells)
        game = self.game()
        source = Block(0, 0, ((0, 0), (1, 0), (2, 0)), '#fff', kind='elite_leafy')
        target = Block(60, 0, ((0, 0),), '#fff')
        game.blocks = [source, target]
        self.assertEqual(game.overlap_speed(target), .5)
        target.x = 150
        self.assertEqual(game.overlap_speed(target), 1)

    def test_elite_inside_color_changes_every_tenth_second(self):
        from chaos_dodge import elite_fill_color
        for kind in ('elite_leafy', 'elite_turbo'):
            game = self.game()
            block = self.block(game, kind)
            first = elite_fill_color(block)
            block.age = .099
            self.assertEqual(elite_fill_color(block), first)
            block.age = .1
            second = elite_fill_color(block)
            self.assertNotEqual(first, second)
            block.age = .199
            self.assertEqual(elite_fill_color(block), second)
            block.age = .2
            self.assertNotEqual(elite_fill_color(block), second)
            self.assertEqual(block.color, CATALOG[kind]['color'])

    def test_ricochet_shield_reflects_only_nearby_pellets_and_is_safe(self):
        game = self.game()
        game.x = game.y = 0
        nearby = Block(100, 0, ((0, 0),), '#fff', kind='blaster_pellet', cell_size=7, velocity_x=-240)
        distant = Block(141, 0, ((0, 0),), '#fff', kind='blaster_pellet', cell_size=7, velocity_x=-240)
        centered = Block(0, 0, ((0, 0),), '#fff', kind='blaster_pellet', cell_size=7, velocity_y=-240)
        game.pellets = [nearby, distant, centered]
        pickup = self.block(game, 'ricochet_shield', speed_multiplier=0)
        game.blocks = [pickup]
        game.update(.001, set())
        self.assertEqual(game.lives, 8)
        self.assertTrue(game.shield)
        self.assertNotIn(pickup, game.blocks)
        self.assertEqual(nearby.velocity_x, 240)
        self.assertEqual(centered.velocity_y, 240)
        self.assertEqual(nearby.kind, 'reflected_pellet')
        self.assertEqual(distant.kind, 'blaster_pellet')
        game.x, game.y = nearby.x, nearby.y
        game.update_pellets(.001)
        self.assertEqual(game.lives, 8)
        self.assertTrue(game.shield)

    def test_blaster_spawn_probabilities_speed_and_cannons(self):
        from unittest.mock import patch
        import math
        game = self.game()
        total = sum(info['weight'] for info in CATALOG.values())
        self.assertAlmostEqual(CATALOG['blaster']['weight']/total, .05)
        self.assertAlmostEqual(CATALOG['wild_seven']['weight']/total, .008)
        with patch.object(game.rng, 'random', return_value=0):
            block = game.make_chaos_block('blaster')
        self.assertEqual(len(set(block.cannons)), 8)
        self.assertAlmostEqual(abs(block.rotation_speed), math.tau/12)
        self.assertTrue(.3 <= block.shot_in <= .9)
        for elapsed in (0, 100, 500):
            game.elapsed = elapsed
            self.assertAlmostEqual(game.chaos_fall_speed(block), min(340, 100+elapsed*2.5)*1.3*.75)
        with patch.object(game.rng, 'random', return_value=.99):
            block = game.make_chaos_block('blaster')
        self.assertEqual(len(block.cannons), 1)
        self.assertEqual(block.rotation_speed, 0)
        self.assertAlmostEqual(block.cannons[0]/(math.pi/4), round(block.cannons[0]/(math.pi/4)))

    def test_blaster_pellet_timing_damage_and_cleanup(self):
        import math
        game = self.game()
        block = game.make_chaos_block('blaster')
        block.x = block.y = 0
        block.cannons = (0, math.pi/2)
        block.rotation_speed = 0
        block.shot_in = .3
        game.update_blaster(block, .299)
        self.assertEqual(game.pellets, [])
        game.update_blaster(block, .001)
        self.assertEqual(len(game.pellets), 2)
        self.assertTrue(.3 <= block.shot_in <= .9)
        pellet = game.pellets[0]
        game.x, game.y = pellet.x, pellet.y
        game.update_pellets(.001)
        self.assertEqual(game.lives, 7.5)
        self.assertEqual(game.damage_taken, .5)
        self.assertNotIn(pellet, game.pellets)
        game.update_pellets(10)
        self.assertEqual(game.pellets, [])

    def test_overlap_blocks_are_harmless_and_only_active_during_overlap(self):
        for kind, scale in (('leafy', .5), ('turbo', 1.5), ('elite_leafy', .5), ('elite_turbo', 1.5)):
            game = self.game()
            block = self.block(game, kind, speed_multiplier=0, cell_size=64)
            game.blocks = [block]
            before = game.x
            game.update(.01, {'Right'})
            self.assertAlmostEqual(game.x-before, 260*.01*scale)
            self.assertEqual(game.lives, 8)
            self.assertIn(block, game.blocks)
            target = self.block(game, 'normal')
            game.blocks.append(target)
            self.assertEqual(game.overlap_speed(target), scale if kind.startswith('elite_') else 1)
            target.x += 150
            game.x += 150
            self.assertEqual(game.overlap_speed(target), 1)
            self.assertEqual(game.overlap_speed(game), 1)
            self.assertEqual((game.haste_left, game.frost_left), (0, 0))

    def test_fan_long_blades_collide_and_stay_until_they_leave_arena(self):
        from dodge_model import fan_blades, touches_block
        game = self.game()
        block = Block(0, 0, ((0, 0),), '#aaa', kind='fan', cell_size=32, speed_multiplier=0)
        blade = fan_blades(block)[0]
        self.assertAlmostEqual(blade[1][0]-blade[0][0], block.size*3)
        self.assertTrue(touches_block(70, 0, block))
        self.assertFalse(touches_block(115, 0, block))
        block.y = game.bottom-30
        game.blocks = [block]
        game.update(.001, set())
        self.assertIn(block, game.blocks)
        block.y = game.bottom-100
        game.update(.001, set())
        self.assertNotIn(block, game.blocks)

    def test_fan_blades_rotate_and_deal_one_damage_without_disappearing(self):
        from dodge_model import fan_blades, touches_block
        game = self.game()
        block = self.block(game, 'fan', cell_size=32, speed_multiplier=0)
        block.x = block.y = 0
        initial = fan_blades(block)
        self.assertEqual(len(initial), 3)
        game.x, game.y = 32, 0
        self.assertTrue(touches_block(game.x, game.y, block))
        game.blocks = [block]
        game.update(.001, set())
        self.assertEqual(game.lives, 7)
        self.assertIn(block, game.blocks)
        block.age = 2.4/.9
        for before, after in zip(initial, fan_blades(block)):
            for a, b in zip(before, after):
                self.assertAlmostEqual(a[0], b[0])
                self.assertAlmostEqual(a[1], b[1])

    def test_spike_triangle_has_safe_upper_corners(self):
        from dodge_model import touches_block
        block = Block(0, 0, ((0, 0),), '#aaa', cell_size=100, kind='spike')
        self.assertFalse(touches_block(40, 35, block))
        self.assertFalse(touches_block(-40, 35, block))
        self.assertTrue(touches_block(0, 40, block))
        self.assertTrue(touches_block(0, 0, block))
        self.assertTrue(touches_block(38, -35, block))

    def test_spike_top_side_and_crush_damage(self):
        from dodge_model import PLAYER_BOTTOM, PLAYER_RIGHT, PLAYER_TOP
        game = self.game()
        game.x = game.y = 0
        block = self.block(game, 'spike')
        block.y = game.y+PLAYER_BOTTOM-block.size/2+1
        game.push_player(block, (0, 0))
        self.assertEqual(game.lives, 7)
        game = self.game()
        block = self.block(game, 'spike')
        block.x = game.x+PLAYER_RIGHT+block.size/2-1
        game.push_player(block, (-1, 0))
        self.assertEqual(game.lives, 8)
        game.y = game.bottom-PLAYER_BOTTOM
        block.x = game.x
        block.y = game.y+PLAYER_TOP+block.size/2-1
        game.push_player(block, (0, -1))
        self.assertEqual(game.lives, 7)
        game.blocks = []
        game.spawn_chaos('spike')
        self.assertAlmostEqual(game.chaos_fall_speed(game.blocks[0]), game.speed*.8)

    def test_thunder_pass_through_warning_timing_and_lightning(self):
        game = self.game()
        block = self.block(game, 'thunder', speed_multiplier=0)
        game.blocks = [block]
        game.update(.1, set())
        self.assertEqual(game.lives, 8)
        self.assertIn(block, game.blocks)
        for age, phase in ((.999, 'idle'), (1, 'warning'), (1.249, 'warning'),
                           (1.25, 'strike'), (1.499, 'strike'), (1.5, 'idle'), (2, 'warning')):
            block.age = age
            self.assertEqual(game.thunder_phase(block), phase)
        game.y = block.y-block.size*1.5
        block.age = 1.24
        game.update(.005, set())
        self.assertEqual(game.lives, 8)
        game.update(.01, set())
        self.assertEqual(game.lives, 6)
        self.assertEqual(game.haste_left, 1)
        self.assertIn(block, game.blocks)
        game.update(.1, set())
        self.assertEqual(game.lives, 6)
        game.blocks = []
        game.update(1.01, set())
        self.assertEqual(game.haste_left, 0)

    def test_thunder_lightning_bounds_and_rendering(self):
        from dodge_model import PLAYER_TOP
        session = BrowserGame()
        session.start('dodge', 'chaos', 0)
        game = session.game
        game.spawn_chaos('thunder')
        block = game.blocks[0]
        block.x = block.y = 0
        left, right, bottom, top = game.thunder_bounds(block)
        self.assertAlmostEqual(right-left, block.size)
        self.assertAlmostEqual(top-bottom, 2*block.size)
        block.age = 2
        commands = session.snapshot()['commands']
        self.assertTrue(any(c.get('role') == 'thunder_warning' and c['text'] == '!!!' for c in commands))
        block.age = 2.25
        commands = session.snapshot()['commands']
        self.assertTrue(any(c.get('role') == 'thunder_strike' and c['coords'] == [left, -top, right, -bottom] for c in commands))
        game.x, game.y = 0, bottom-PLAYER_TOP-1
        game.update_thunder(block)
        self.assertEqual(game.lives, 8)
        game.y = (top+bottom)/2
        game.shield = True
        game.update_thunder(block)
        self.assertEqual(game.lives, 8)
        self.assertFalse(game.shield)
        self.assertEqual(game.haste_left, 1)

    def test_small_auras_range_effects_and_contact_damage(self):
        from chaos_dodge import AURA_EFFECTS, AURA_RADIUS
        for kind, effect in AURA_EFFECTS.items():
            with self.subTest(kind=kind):
                game = self.game()
                block = self.block(game, kind)
                block.x += AURA_RADIUS+.01
                game.apply_chaos_aura(block)
                self.assertEqual((game.poison_ticks, game.haste_left, game.frost_left), (0, 0, 0))
                block.x -= .01
                game.apply_chaos_aura(block)
                self.assertEqual(game.lives, 8)
                if effect == 'poison':
                    self.assertEqual((game.poison_ticks, game.poison_in), (3, 3))
                else:
                    self.assertEqual(getattr(game, effect+'_left'), 4 if effect == 'haste' else 2.5)
                game.chaos_contact(block)
                self.assertEqual(game.lives, 7)

    def test_poison_aura_ticks_without_resetting_damage_timer(self):
        for kind in ('steaming', 'stinky'):
            game = self.game()
            game.regen_in = 999
            block = self.block(game, kind, speed_multiplier=0)
            block.x += 50
            game.blocks = [block]
            game.update(3.1, set())
            self.assertEqual(game.lives, 7)
            self.assertEqual(game.poison_ticks, 3)
            game.blocks = []
            game.update(9, set())
            self.assertEqual(game.lives, 4)
            self.assertEqual(game.poison_ticks, 0)

    def test_aura_rings_and_icons_match_gameplay_radius(self):
        from chaos_dodge import AURA_EFFECTS, AURA_RADIUS
        for kind in AURA_EFFECTS:
            session = BrowserGame()
            session.start('dodge', 'chaos', 0)
            session.game.spawn_chaos(kind)
            block = session.game.blocks[0]
            block.x, block.y = 100, 100
            commands = session.snapshot()['commands']
            self.assertTrue(any(c['kind'] == 'block_icon' and c['block'] == kind for c in commands))
            self.assertTrue(any(c['kind'] == 'oval' and c['coords'] ==
                                [100-AURA_RADIUS, -100-AURA_RADIUS, 100+AURA_RADIUS, -100+AURA_RADIUS]
                                for c in commands))

    def test_mystery_disguise_proximity_and_reveal(self):
        game = self.game()
        game.spawn_chaos('mystery')
        block = game.blocks[0]
        self.assertEqual((block.color, block.cells, block.cell_size),
                         ('#a6a6ad', ((0, 0),), 32))
        self.assertEqual(CATALOG['mystery']['symbol'], '?')
        block.x, block.y = game.x, game.y+130
        game.update(.01, set())
        self.assertEqual(block.kind, 'mystery')
        block.y = game.y+119
        game.update(.001, set())
        self.assertNotEqual(block.kind, 'mystery')
        self.assertIn(block.kind, CATALOG)
        self.assertEqual(len(game.blocks), 1)
        self.assertIs(game.blocks[0], block)
        self.assertFalse(game.reveal_mystery(block))

    def test_mystery_can_reveal_every_other_type_at_block_limit(self):
        from unittest.mock import patch
        candidates = tuple(kind for kind in CATALOG if kind != 'mystery')
        for kind in candidates:
            with self.subTest(kind=kind):
                game = self.game()
                block = self.block(game, 'mystery')
                block.age = 20
                game.blocks = [block]+[self.block(game, 'weak') for _ in range(79)]
                original_choice = game.rng.choice
                def choose(options):
                    return kind if tuple(options) == candidates else original_choice(options)
                with patch.object(game.rng, 'choice', side_effect=choose):
                    self.assertTrue(game.reveal_mystery(block))
                self.assertEqual(block.kind, kind)
                self.assertEqual(block.age, 0)
                self.assertEqual(block.warning_left, 0)
                self.assertEqual(block.flame_stage, 0)
                self.assertEqual(len(game.blocks), 80)
                self.assertGreaterEqual(min(x for x, y in block.centers())-block.size/2, game.left)
                self.assertLessEqual(max(x for x, y in block.centers())+block.size/2, game.right)

    def test_mystery_automatically_includes_future_catalog_entries(self):
        from unittest.mock import patch
        game = self.game()
        block = self.block(game, 'mystery')
        original_choice = game.rng.choice
        def choose(options):
            return 'future_block' if 'future_block' in options else original_choice(options)
        with patch.dict(CATALOG, future_block=dict(CATALOG['normal'], id='future_block')):
            with patch.object(game.rng, 'choice', side_effect=choose):
                self.assertTrue(game.reveal_mystery(block))
        self.assertEqual(block.kind, 'future_block')

    def test_pusher_speed_and_harmless_persistent_collision(self):
        from dodge_model import touches_block
        game = self.game()
        game.spawn_chaos('pusher')
        block = game.blocks[0]
        self.assertAlmostEqual(game.chaos_fall_speed(block), game.speed*.8)
        game.slowfall_left = game.curse_left = 4
        self.assertAlmostEqual(game.chaos_fall_speed(block), game.speed*.8*.6*1.4)
        game.slowfall_left = game.curse_left = 0
        block.x, block.y, block.sway_amplitude = game.x, game.y+block.size/2+16, 0
        before = game.y
        game.shield = True
        game.update(.1, set())
        self.assertLess(game.y, before)
        self.assertEqual(game.lives, 8)
        self.assertTrue(game.shield)
        self.assertEqual(game.invulnerable, 0)
        self.assertIn(block, game.blocks)
        self.assertFalse(touches_block(game.x, game.y, block))

    def test_pusher_crushes_at_each_wall_only_when_moving_into_it(self):
        from dodge_model import PLAYER_LEFT, PLAYER_RIGHT, PLAYER_BOTTOM, PLAYER_TOP
        for direction in ('left', 'right', 'bottom', 'top'):
            with self.subTest(direction=direction):
                game = self.game()
                game.x = game.y = 0
                block = self.block(game, 'pusher')
                half = block.size/2
                if direction == 'left':
                    game.x = game.left-PLAYER_LEFT
                    block.x = game.x+PLAYER_RIGHT+half-1
                    movement = (-1, 0)
                elif direction == 'right':
                    game.x = game.right-PLAYER_RIGHT
                    block.x = game.x+PLAYER_LEFT-half+1
                    movement = (1, 0)
                elif direction == 'bottom':
                    game.y = game.bottom-PLAYER_BOTTOM
                    block.y = game.y+PLAYER_TOP+half-1
                    movement = (0, -1)
                else:
                    game.y = game.top-PLAYER_TOP
                    block.y = game.y+PLAYER_BOTTOM-half+1
                    movement = (0, 1)
                game.push_player(block, (0, 0))
                self.assertEqual(game.lives, 8)
                game.push_player(block, movement)
                self.assertEqual(game.lives, 5)
                game.push_player(block, movement)
                self.assertEqual(game.lives, 5)
                game.invulnerable = 0
                game.shield = True
                game.push_player(block, movement)
                self.assertEqual(game.lives, 5)
                self.assertFalse(game.shield)

    def test_falling_pusher_pins_player_at_floor(self):
        from dodge_model import PLAYER_BOTTOM, PLAYER_TOP
        game = self.game()
        game.y = game.bottom-PLAYER_BOTTOM
        block = self.block(game, 'pusher', speed_multiplier=.8)
        block.y = game.y+PLAYER_TOP+block.size/2
        game.blocks = [block]
        game.update(.05, set())
        self.assertEqual(game.lives, 5)
        self.assertEqual(game.y, game.bottom-PLAYER_BOTTOM)
        self.assertIn(block, game.blocks)

    def test_vertigo_reversal_protection_expiry_and_sanctuary(self):
        game = self.game()
        game.chaos_contact(self.block(game, 'vertigo'))
        self.assertEqual((game.lives, game.vertigo_left), (7, 3))
        before = game.x
        game.update(.1, {'Right'})
        self.assertLess(game.x, before)
        game.update(3, set())
        before = game.x
        game.update(.1, {'Right'})
        self.assertGreater(game.x, before)
        game.invulnerable = 0; game.shield = True
        game.chaos_contact(self.block(game, 'vertigo'))
        self.assertEqual(game.vertigo_left, 0)
        game.lives = 3
        game.burn_ticks = game.poison_ticks = 2
        game.frost_left = game.curse_left = game.vertigo_left = 3
        game.regen_in = 12
        game.chaos_contact(self.block(game, 'sanctuary'))
        self.assertEqual(game.lives, 5)
        self.assertTrue(game.shield)
        self.assertEqual((game.burn_ticks, game.poison_ticks, game.frost_left, game.curse_left, game.vertigo_left), (0,0,0,0,0))
        self.assertEqual(game.regen_in, 8)
        game.vertigo_left = 3
        game.chaos_contact(self.block(game, 'mender'))
        self.assertEqual(game.vertigo_left, 0)

    def test_elemental_splitters_create_three_matching_shards(self):
        for kind, shard_kind in [('iceburst','frost'), ('firecracker','fire')]:
            game = self.game()
            block = Block(150, 100, ((0,0),), CATALOG[kind]['color'], speed_multiplier=0, kind=kind)
            game.blocks = [block]
            game.update(1.39, set())
            self.assertEqual(len(game.blocks), 1)
            game.update(.02, set())
            self.assertEqual(len(game.blocks), 3)
            self.assertTrue(all(b.kind == shard_kind and b.cell_size == 15 for b in game.blocks))
            game.chaos_contact(game.blocks[0])
            self.assertEqual(game.lives, 7)
            if shard_kind == 'frost': self.assertEqual(game.frost_left, 2.5)
            else: self.assertEqual(game.burn_ticks, 2)

    def test_vortex_swirl_and_three_pinball_bounces(self):
        game = self.game()
        game.x, game.y = 100, 100
        vortex = Block(0,100,((0,0),),'#fff',kind='vortex')
        target = Block(100,100,((0,0),),'#fff')
        game.blocks = [vortex, target]
        forces = game.chaos_fields(.1)
        self.assertLess(game.x,100); self.assertLess(game.y,100)
        self.assertLess(forces[id(target)][0],0); self.assertLess(forces[id(target)][1],0)
        game.repellent_left = 4
        before = (game.x, game.y)
        self.assertIn(id(target), game.chaos_fields(.1))
        self.assertEqual((game.x,game.y),before)
        game.spawn_chaos('pinball'); ball=game.blocks[-1]; game.blocks=[ball]
        ball.x=game.right-ball.cell_size/2-.01; ball.y=100; ball.velocity_x=140
        game.update(.02,set())
        self.assertLess(ball.velocity_x,0)
        for count in (1,2,3):
            ball.x=150; ball.y=game.bottom+ball.size/2; ball.rise_left=0
            game.update(.01,set())
            self.assertEqual(ball.bounce_count,count)
            self.assertGreater(ball.rise_left,0)
        ball.y=game.bottom-ball.size-1; ball.rise_left=0
        game.update(.01,set())
        self.assertNotIn(ball,game.blocks)

    def test_fire_patterns_warn_beep_then_fire_once_to_edges(self):
        from chaos_dodge import FIRE_PATTERNS
        for kind, count in [('fire_x',4), ('fire_plus',4), ('fire_star',8)]:
            game = self.game()
            game.x, game.y = 90, 45
            game.spawn_chaos(kind)
            block = game.blocks[0]
            self.assertFalse(game.update_fire_pattern(block, .1))
            block.y = 0
            self.assertTrue(game.update_fire_pattern(block, 0))
            self.assertEqual((block.x, block.y), (0, 0))
            rays = game.fire_rays(block)
            self.assertEqual(len(rays), count)
            for ax, ay, bx, by in rays:
                self.assertTrue(abs(bx) == 300 or abs(by) == 240)
            # Warning lines never deal flame damage, even standing on a ray.
            game.x, game.y = rays[0][2]*.5, rays[0][3]*.5
            self.assertFalse(game.touches_fire_pattern(block))
            game.update(1.49, set())
            self.assertEqual(block.flame_stage, 1)
            self.assertEqual(game.lives, 8)
            self.assertEqual(game.chaos_sound_events.count('chaos_fire_warning'), 3)
            game.update(.02, set())
            self.assertEqual(block.flame_stage, 2)
            self.assertEqual(game.lives, 6)
            self.assertEqual(game.burn_ticks, 1)
            self.assertEqual(game.chaos_sound_events.count('chaos_fire_burst'), 1)
            game.update(.66, set())
            self.assertNotIn(block, game.blocks)

    def test_fire_warning_bridge_pause_and_sound_consumption(self):
        session = BrowserGame(); session.start('dodge', 'chaos', 0)
        game = session.game
        game.spawn_in = 999
        game.x, game.y = 90, 45
        game.spawn_chaos('fire_star')
        block = game.blocks[0]; block.y = 0
        game.update(.01, set())
        state = session.snapshot()
        self.assertEqual(state['sounds'], ['chaos_fire_warning'])
        self.assertEqual(sum(c.get('role') == 'fire_warning' for c in state['commands']), 8)
        self.assertEqual(session.snapshot()['sounds'], [])
        session.dispatch({'action':'pause'})
        before = block.flame_left
        session.dispatch({'action':'tick', 'dt':.05})
        self.assertEqual(block.flame_left, before)
        session.dispatch({'action':'pause'})
        game.update(1.51, set())
        state = session.snapshot()
        self.assertEqual(sum(c.get('role') == 'fire_beam' for c in state['commands']), 8)
        self.assertEqual(game.lives, 8)  # Safe gap between all eight rays.

    def test_combined_fields_affect_both_targets_and_respect_repellent(self):
        for kind, sign in [('gravity_well', -1), ('force_wave', 1)]:
            game = self.game()
            game.x, game.y = 200, 100
            source = Block(0, 100, ((0, 0),), '#fff', kind=kind)
            target = Block(250, 100, ((0, 0),), '#fff')
            outside = Block(301, 100, ((0, 0),), '#fff')
            game.blocks = [source, target, outside]
            forces = game.chaos_fields(.1)
            self.assertGreater((game.x-200)*sign, 0)
            self.assertGreater(forces[id(target)][0]*sign, 0)
            self.assertNotIn(id(outside), forces)
            self.assertNotIn(id(source), forces)
            game.repellent_left = 4
            before = game.x
            forces = game.chaos_fields(.1)
            self.assertEqual(game.x, before)
            self.assertGreater(forces[id(target)][0]*sign, 0)

    def test_wild_seven_matches_wild_spawn_and_deals_seven_damage(self):
        for seed in range(30):
            normal = DodgeGame(random.Random(seed), 'chaos')
            seven = DodgeGame(random.Random(seed), 'chaos')
            normal.spawn_chaos('normal')
            seven.spawn_chaos('wild_seven')
            a, b = normal.blocks[0], seven.blocks[0]
            for attr in ('x', 'y', 'cells', 'color', 'cell_size', 'speed_multiplier', 'sway_phase', 'sway_amplitude'):
                self.assertEqual(getattr(a, attr), getattr(b, attr), attr)
        total = sum(entry['weight'] for entry in CATALOG.values())
        self.assertAlmostEqual(CATALOG['wild_seven']['weight']/total, .008)
        self.assertEqual(next(entry['chance'] for entry in catalog() if entry['id'] == 'wild_seven'), .8)
        game = self.game()
        block = self.block(game, 'wild_seven')
        game.chaos_contact(block)
        self.assertEqual(game.lives, 1)
        game.chaos_contact(block)
        self.assertEqual(game.lives, 1)  # Ordinary hit protection still applies.
        game.invulnerable = 0
        game.shield = True
        game.chaos_contact(block)
        self.assertEqual(game.lives, 1)
        self.assertFalse(game.shield)

    def test_six_new_pickups_and_repellent_expiry(self):
        game = self.game()
        game.lives, game.burn_ticks = 2, 2
        game.chaos_contact(self.block(game, 'phoenix'))
        self.assertEqual((game.lives, game.burn_ticks), (6, 0))
        game.chaos_contact(self.block(game, 'aegis'))
        self.assertTrue(game.shield)
        self.assertEqual(game.invulnerable, 1.5)
        game.frost_left = 4
        game.chaos_contact(self.block(game, 'mint'))
        self.assertEqual((game.frost_left, game.haste_left), (0, 2))
        game.regen_in = 7
        game.chaos_contact(self.block(game, 'clockwork'))
        self.assertEqual(game.regen_in, 1)
        game.spawn_in = .1
        game.chaos_contact(self.block(game, 'lullaby'))
        game.update(2.9, set())
        self.assertEqual(game.blocks, [])
        game.update(.2, set())
        self.assertEqual(len(game.blocks), 1)
        game.blocks = [Block(game.x+80, game.y, ((0, 0),), '#fff', kind='black_hole')]
        game.chaos_contact(self.block(game, 'repellent'))
        before = game.x
        game.chaos_fields(.1)
        self.assertEqual(game.x, before)
        game.blocks = []
        game.spawn_in = 999
        game.update(4.01, set())
        self.assertEqual(game.repellent_left, 0)
        game.blocks = [Block(game.x+80, game.y, ((0, 0),), '#fff', kind='black_hole')]
        game.chaos_fields(.1)
        self.assertGreater(game.x, before)

    def test_six_new_hazards_and_shielded_effects(self):
        expected = {'tar': (1, 4), 'ember': (2, 0), 'rust': (1, 0),
                    'drain': (1, 0), 'frostbite': (2, 1.5), 'crossfire': (2, 0)}
        for kind, (damage, frost) in expected.items():
            with self.subTest(kind=kind):
                game = self.game()
                game.haste_left = game.slowfall_left = game.stasis_left = 3
                game.chaos_contact(self.block(game, kind))
                self.assertEqual(game.lives, 8-damage)
                self.assertEqual(game.frost_left, frost)
                self.assertEqual(game.burn_ticks, int(kind in ('ember', 'crossfire')))
                self.assertEqual(game.poison_ticks, int(kind == 'crossfire'))
                self.assertEqual(game.regen_in, 12 if kind == 'drain' else 8)
                self.assertEqual(game.haste_left, 0 if kind == 'rust' else 3)
                game = self.game()
                game.shield = True
                game.haste_left = game.slowfall_left = game.stasis_left = 3
                game.chaos_contact(self.block(game, kind))
                self.assertEqual((game.lives, game.burn_ticks, game.poison_ticks, game.frost_left), (8, 0, 0, 0))
                self.assertEqual((game.haste_left, game.slowfall_left, game.stasis_left, game.regen_in), (3, 3, 3, 8))

    def test_six_new_movement_blocks(self):
        game = self.game()
        for kind, cells in [('drill', tuple((0, i) for i in range(4))),
                            ('ribbon', tuple((i, 0) for i in range(5)))]:
            game.spawn_chaos(kind)
            block = game.blocks.pop()
            self.assertEqual(block.cells, cells)
            if kind == 'drill': self.assertEqual(block.sway_amplitude, 0)
            else: self.assertEqual(block.sway_amplitude, 55)
        parachute = self.block(game, 'parachute')
        self.assertEqual(game.chaos_fall_speed(parachute), 200)
        parachute.age = .6
        self.assertEqual(game.chaos_fall_speed(parachute), 25)
        rocket = self.block(game, 'rocket')
        self.assertEqual(game.chaos_fall_speed(rocket), 50)
        rocket.age = 1
        self.assertEqual(game.chaos_fall_speed(rocket), 640)
        game.slowfall_left = game.curse_left = 3
        self.assertAlmostEqual(game.chaos_fall_speed(rocket), 640*.6*1.4)
        game.slowfall_left = game.curse_left = 0
        cork = Block(200, 100, ((0, 0),), '#fff', kind='corkscrew')
        game.blocks = [cork]
        game.update(.1, set())
        self.assertLess(cork.y, 100)
        cork.age = .5
        before = cork.y
        game.update(.1, set())
        self.assertGreater(cork.y, before)
        skater = Block(100, 100, ((0, 0),), '#fff', kind='skater')
        game.blocks = [skater]
        game.x = 0
        game.update(.1, set())
        self.assertGreater(skater.x, 100)
        game.x = 250
        before = skater.x
        game.update(.1, set())
        self.assertLess(skater.x, before)

    def test_mender_stasis_and_venom_fang(self):
        game = self.game()
        game.lives = 4
        game.burn_ticks = game.poison_ticks = 2
        game.frost_left = game.curse_left = 3
        game.chaos_contact(self.block(game, 'mender'))
        self.assertEqual(game.lives, 5)
        self.assertEqual((game.burn_ticks, game.poison_ticks, game.frost_left, game.curse_left), (0, 0, 0, 0))
        game.chaos_contact(self.block(game, 'stasis'))
        block = Block(200, 120, ((0, 0),), '#fff', velocity_x=10)
        game.blocks = [block]
        game.update(1, set())
        self.assertEqual(block.y, 120)
        self.assertGreater(block.x, 200)
        self.assertIn('STASIS', game.pattern_label)
        game.update(.6, set())
        self.assertLess(block.y, 120)
        game.blocks = []
        game.chaos_contact(self.block(game, 'venom_fang'))
        self.assertEqual(game.lives, 3)
        self.assertEqual(game.poison_ticks, 2)
        game.update(3.01, set())
        self.assertEqual(game.lives, 2)
        protected = self.game()
        protected.shield = True
        protected.chaos_contact(self.block(protected, 'venom_fang'))
        self.assertEqual((protected.lives, protected.poison_ticks), (8, 0))

    def test_phase_collision_and_shared_visibility(self):
        from chaos_dodge import block_is_solid
        game = self.game()
        block = self.block(game, 'phase', age=1.1, speed_multiplier=0)
        game.blocks = [block]
        game.update(.1, set())
        self.assertFalse(block_is_solid(block))
        self.assertEqual(game.lives, 8)
        self.assertIn(block, game.blocks)
        block.age = 2.99
        game.update(.02, set())
        self.assertTrue(block_is_solid(block))
        self.assertEqual(game.lives, 7)

    def test_new_motion_patterns_and_boulder_damage(self):
        game = self.game()
        game.spawn_chaos('boulder')
        boulder = game.blocks.pop()
        self.assertEqual(boulder.cell_size, 64)
        self.assertEqual(len(boulder.cells), 1)
        game.chaos_contact(boulder)
        self.assertEqual(game.lives, 5)
        feather = self.block(game, 'feather')
        self.assertEqual(game.chaos_fall_speed(feather), 50)
        surge = self.block(game, 'surge')
        low = game.chaos_fall_speed(surge)
        surge.age = 1
        self.assertGreater(game.chaos_fall_speed(surge), low*4)
        surge.age = 2
        self.assertAlmostEqual(game.chaos_fall_speed(surge), low)
        zigzag = Block(100, 150, ((0, 0),), '#fff', kind='zigzag', velocity_x=130, speed_multiplier=0)
        game.blocks = [zigzag]
        game.update(.25, set())
        self.assertGreater(zigzag.x, 100)
        zigzag.age = .5
        before = zigzag.x
        game.update(.25, set())
        self.assertLess(zigzag.x, before)
        rewind = Block(200, 100, ((0, 0),), '#fff', kind='rewind', age=1.19)
        game.blocks = [rewind]
        game.update(.1, set())
        self.assertGreater(rewind.y, 100)
        self.assertTrue(rewind.bounced)
        game.update(.8, set())
        self.assertEqual(rewind.rise_left, 0)
        before = rewind.y
        game.update(.1, set())
        self.assertLess(rewind.y, before)

    def test_block_fields_range_direction_and_player_isolation(self):
        for kind, direction in [('block_attractor', -1), ('block_repulsor', 1)]:
            game = self.game()
            source = Block(0, 150, ((0, 0),), CATALOG[kind]['color'], kind=kind)
            target = Block(180, 150, ((0, 0),), '#fff')
            distant = Block(250, 150, ((0, 0),), '#fff')
            game.blocks = [source, target, distant]
            before = (game.x, game.y)
            forces = game.chaos_fields(.1)
            self.assertGreater(forces[id(target)][0]*direction, 0)
            self.assertNotIn(id(source), forces)
            self.assertNotIn(id(distant), forces)
            self.assertEqual((game.x, game.y), before)
            game.update(.1, set())
            self.assertGreater((target.x-180)*direction, 0)

    def test_nexus_shuffle_speed_rarity_and_all_four_effects(self):
        from chaos_dodge import FIELD_MODES, FIELD_RADII, field_mode
        game = self.game()
        game.spawn_chaos('chaos_nexus')
        nexus = game.blocks[0]
        nexus.x, nexus.y = 0, 100
        target = Block(200, 100, ((0, 0),), '#fff')
        game.blocks.append(target)
        cycles = []
        for cycle in range(12):
            modes = []
            for second in range(4):
                nexus.age = cycle*4+second
                game.prepare_field(nexus)
                mode = field_mode(nexus)
                modes.append(mode)
                for fraction in (.01, .5, .99):
                    nexus.age = cycle*4+second+fraction
                    game.prepare_field(nexus)
                    self.assertEqual(field_mode(nexus), mode)
                game.x, game.y = 180, 100
                forces = game.chaos_fields(.1)
                sign = -1 if mode.startswith('pull') else 1
                if mode.endswith('player'):
                    self.assertGreater((game.x-180)*sign, 0)
                    self.assertEqual(forces, {})
                else:
                    self.assertEqual(game.x, 180)
                    self.assertGreater(forces[id(target)][0]*sign, 0)
            self.assertEqual(set(modes), set(FIELD_MODES))
            cycles.append(tuple(modes))
        self.assertGreater(len(set(cycles)), 1)
        self.assertGreater(FIELD_RADII['chaos_nexus'], FIELD_RADII['block_attractor']*2)
        self.assertGreater(CATALOG['chaos_nexus']['weight'], CATALOG['doom']['weight'])
        self.assertLess(CATALOG['chaos_nexus']['weight'], CATALOG['block_attractor']['weight'])
        self.assertAlmostEqual(game.chaos_fall_speed(nexus), 100/6)
        game.curse_left = game.slowfall_left = 4
        self.assertAlmostEqual(game.chaos_fall_speed(nexus), 100/6*.6*1.4)

    def test_sonic_snail_bases_and_multiplicative_speed_effects(self):
        game = self.game()
        for elapsed in (0, 40, 200):
            game.elapsed = elapsed
            easy = min(340, 100+elapsed*2.5)
            sonic = self.block(game, 'sonic')
            snail = self.block(game, 'snail')
            self.assertAlmostEqual(game.chaos_fall_speed(sonic), easy*3.3*1.5)
            self.assertAlmostEqual(game.chaos_fall_speed(snail), easy/3)
            game.slowfall_left = game.curse_left = 4
            self.assertAlmostEqual(game.chaos_fall_speed(sonic), easy*3.3*1.5*.6*1.4)
            self.assertAlmostEqual(game.chaos_fall_speed(snail), easy/3*.6*1.4)
            game.slowfall_left = game.curse_left = 0
        game.chaos_contact(self.block(game, 'curse'))
        self.assertEqual(game.lives, 8)
        self.assertEqual(game.curse_left, 4)
        game.update(1, set())
        game.chaos_contact(self.block(game, 'curse'))
        self.assertEqual(game.curse_left, 4)
        game.update(4.01, set())
        self.assertEqual(game.curse_left, 0)

    def test_glitch_only_warns_near_bottom_for_each_of_three_teleports(self):
        game = self.game()
        game.x, game.y = -250, 200
        block = self.block(game, 'glitch', speed_multiplier=0)
        block.x, block.y = 100, 100
        game.blocks = [block]
        game.update(3, set())
        self.assertEqual(block.warning_left, 0)
        self.assertEqual(block.teleports, 0)
        threshold = game.bottom+(game.top-game.bottom)*.25
        for expected in (1, 2, 3):
            # Each warning must wait until the block reaches the lower quarter.
            block.warning_left = 0
            block.y = threshold+1
            game.update(.02, set())
            self.assertEqual(block.warning_left, 0)
            block.y = threshold-10
            game.update(.01, set())
            self.assertGreater(block.warning_left, 1.18)
            target, position = block.teleport_target, (block.x, block.y)
            left = block.warning_left
            game.update(left/2, set())
            self.assertEqual((block.x, block.y), position)
            self.assertEqual(block.teleport_target, target)
            game.update(left/2+.00001, set())
            self.assertEqual(block.teleports, expected)
            self.assertAlmostEqual(block.x, target[0])
            self.assertAlmostEqual(block.y, target[1])
            self.assertIn(block, game.blocks)
        block.speed_multiplier = 1
        before = block.y
        game.update(.1, set())
        self.assertLess(block.y, before)
        self.assertEqual(block.warning_left, 0)
        self.assertEqual(block.teleports, 3)

    def test_elite_waits_on_screen_then_locks_three_dodgeable_targets(self):
        game = self.game()
        block = self.block(game, 'elite_glitch', speed_multiplier=0)
        block.x, block.y = 100, game.top+100
        game.blocks = [block]
        game.update(2, set())
        self.assertEqual(block.screen_age, -1)
        self.assertEqual(block.warning_left, 0)
        block.y = 100
        game.update(.99, set())
        self.assertEqual(block.warning_left, 0)
        game.update(.02, set())
        self.assertGreater(block.warning_left, .98)
        for expected, position in enumerate(((43,-70),(-40,0),(80,40)), 1):
            if not block.warning_left:
                game.update(.01, set())
            target = block.teleport_target
            self.assertIsNotNone(target)
            game.x, game.y = position
            time_left = block.warning_left
            game.update(time_left/2, set())
            self.assertEqual(block.teleport_target, target)
            game.update(time_left/2+.00001, set())
            self.assertEqual(block.teleports, expected)
            self.assertAlmostEqual(block.x, target[0])
            self.assertAlmostEqual(block.y, target[1])
            self.assertIn(block, game.blocks)
            self.assertEqual(game.lives, 8)
        self.assertEqual(block.warning_left, 0)
        game.x = -200
        block.speed_multiplier = 1
        old_y = block.y
        game.update(.5, set())
        self.assertLess(block.y, old_y)
        self.assertEqual(block.teleports, 3)
        self.assertEqual(block.warning_left, 0)

    def test_teleport_warning_is_visible_and_pause_freezes_countdown(self):
        session = BrowserGame(); session.start('dodge', 'chaos', 0)
        game = session.game
        block = self.block(game, 'elite_glitch', speed_multiplier=0)
        block.x, block.y = 100, 100
        game.blocks = [block]; game.spawn_in = 999
        game.update(1.1, set())
        state = session.snapshot()
        self.assertTrue(any(c.get('role') == 'teleport_warning' and c['text'] == '!!!' for c in state['commands']))
        self.assertTrue(any(c.get('role') == 'teleport_target' for c in state['commands']))
        session.dispatch({'action':'pause'})
        before = block.warning_left
        session.dispatch({'action':'tick', 'dt':.05})
        self.assertEqual(block.warning_left, before)

    def test_nine_new_types_and_slowed_speed_limit(self):
        self.assertEqual(len(CATALOG), 120)
        game = self.game()
        for elapsed in (0, 30, 200):
            game.elapsed = elapsed
            self.assertAlmostEqual(game.speed, min(340, 100+elapsed*2.5)*.9)
            for kind in CATALOG:
                game.blocks = []
                game.spawn_chaos(kind)
                if kind != "sonic":
                    self.assertLessEqual(game.chaos_fall_speed(game.blocks[0]), 640)
        hard = DodgeGame(difficulty='hard'); hard.elapsed = 200
        self.assertLess(640, hard.speed)
        comet = self.block(game, 'comet', speed_multiplier=4.45)
        self.assertEqual(game.chaos_fall_speed(comet), 640)
        game.slowfall_left = 4
        self.assertEqual(game.chaos_fall_speed(comet), 384)

    def test_new_contact_abilities(self):
        game = self.game()
        game.chaos_contact(self.block(game, 'sonic'))
        self.assertEqual(game.lives, 7)
        game.update(.1, {'Right'})
        self.assertAlmostEqual(game.x, 26)
        game = self.game()
        game.chaos_contact(self.block(game, 'snail'))
        self.assertEqual(game.lives, 7)
        game.update(.1, {'Right'})
        self.assertAlmostEqual(game.x, 26)
        game = self.game(); game.lives = 3
        game.chaos_contact(self.block(game, 'heartburst'))
        self.assertEqual(game.lives, 6)
        game.chaos_contact(self.block(game, 'hourglass'))
        self.assertEqual(game.slowfall_left, 4)
        game.chaos_contact(self.block(game, 'bubble'))
        self.assertEqual(game.invulnerable, 2)
        game.chaos_contact(self.block(game, 'meteor'))
        self.assertEqual(game.lives, 6)
        game.invulnerable = 0
        game.chaos_contact(self.block(game, 'meteor'))
        self.assertEqual(game.lives, 3)
        game.invulnerable = 0; game.shield = True
        game.chaos_contact(self.block(game, 'shatter'))
        self.assertFalse(game.shield)
        self.assertEqual(game.lives, 2)

    def test_new_motion_and_effect_snapshot(self):
        game = self.game()
        game.spawn_chaos('pendulum')
        self.assertEqual(game.blocks[-1].sway_amplitude, 110)
        game.blocks = []
        game.spawn_chaos('ricochet')
        block = game.blocks[0]
        block.cells = ((0, 0),); block.y = 100
        block.x = game.right-block.cell_size/2-.1; block.velocity_x = 140
        game.update(.02, set())
        self.assertLess(block.velocity_x, 0)
        session = BrowserGame(); session.start('dodge', 'chaos', 0)
        session.game.haste_left = 4; session.game.frost_left = 2.5
        state = session.snapshot()
        self.assertEqual(state['haste_left'], 4)
        self.assertEqual(state['frost_left'], 2.5)

    def test_arena_health_regen_and_ramp(self):
        game = self.game()
        self.assertEqual(game.rules.bounds, DIFFICULTIES['easy'].bounds)
        self.assertEqual((game.lives, game.max_lives), (8, 8))
        self.assertGreater(game.spawn_interval, DodgeGame().spawn_interval)
        game.lives = 4
        game.update(7.99, set())
        self.assertEqual(game.lives, 4)
        game.update(.02, set())
        self.assertEqual(game.lives, 5)
        game.update(24, set())
        self.assertEqual(game.lives, 8)
        game.update(8, set())
        self.assertEqual(game.lives, 8)
        old = game.spawn_interval
        game.elapsed = 150
        self.assertLess(game.spawn_interval, old)
        game.elapsed = 10000
        self.assertEqual(game.spawn_interval, .16)

    def test_catalog_weight_geometry_and_speed_range(self):
        self.assertGreaterEqual(len(CATALOG), 17)
        self.assertGreaterEqual(len(NEW_SHAPES), 5)
        self.assertLess(CATALOG['doom']['weight'], CATALOG['black_hole']['weight'])
        game = self.game()
        speeds, sizes, sways, kinds = [], set(), set(), []
        for _ in range(1500):
            game.blocks = []
            game.spawn()
            b = game.blocks[0]
            speeds.append(b.speed_multiplier); sizes.add(round(b.cell_size, 1)); sways.add(round(b.sway_amplitude)); kinds.append(b.kind)
            for x, y in b.centers():
                self.assertGreaterEqual(x-b.cell_size/2, game.left-1e-9)
                self.assertLessEqual(x+b.cell_size/2, game.right+1e-9)
        self.assertLess(min(speeds), 1)
        self.assertGreater(max(speeds), 3.3*1.25)
        self.assertGreater(len(sizes), 20)
        self.assertGreater(len(sways), 20)
        self.assertGreater(kinds.count('normal'), kinds.count('doom')*10)
        self.assertTrue(set(kinds).issubset(CATALOG))
        # Rare entries need deterministic coverage, not a lucky random sample.
        for kind in CATALOG:
            game.blocks = []
            game.spawn_chaos(kind)
            self.assertEqual(game.blocks[0].kind, kind)
        game.blocks = []
        game.spawn_chaos('long')
        self.assertEqual(len(game.blocks[0].cells), 6)

    def test_contact_damage_grace_pickups_and_instakill(self):
        game = self.game()
        game.blocks = [self.block(game, 'normal')]
        game.update(.001, set())
        self.assertEqual(game.lives, 7)
        self.assertFalse(game.blocks)
        game.chaos_contact(self.block(game, 'heavy'))
        self.assertEqual(game.lives, 7)
        game.invulnerable = 0
        game.chaos_contact(self.block(game, 'heavy'))
        self.assertEqual(game.lives, 5)
        game.chaos_contact(self.block(game, 'weak'))
        self.assertEqual(game.lives, 5)
        game.chaos_contact(self.block(game, 'heal'))
        self.assertEqual(game.lives, 7)
        game.invulnerable = 0
        game.chaos_contact(self.block(game, 'shield'))
        game.chaos_contact(self.block(game, 'fire'))
        self.assertEqual(game.lives, 7)
        self.assertEqual(game.burn_ticks, 0)
        self.assertFalse(game.shield)
        game.shield = True
        game.chaos_contact(self.block(game, 'doom'))
        self.assertFalse(game.alive)
        self.assertEqual(game.lives, 0)

    def test_fire_poison_refresh_and_frost_haste(self):
        for kind, duration, ticks in [('fire', 4, 2), ('poison', 9, 3)]:
            game = self.game(); game.regen_in = 999
            game.chaos_contact(self.block(game, kind))
            game.invulnerable = 0
            game.chaos_contact(self.block(game, kind))
            game.update(duration+.01, set())
            self.assertEqual(game.lives, 8-2-ticks)
        game = self.game()
        game.chaos_contact(self.block(game, 'frost'))
        x = game.x; game.update(.1, {'Right'})
        self.assertAlmostEqual(game.x-x, 13, places=3)
        game.frost_left = 0
        game.chaos_contact(self.block(game, 'haste'))
        x = game.x; game.update(.1, {'Right'})
        self.assertAlmostEqual(game.x-x, 37.7, places=3)

    def test_fields_seeker_comet_and_ghost(self):
        for kind, sign in [('black_hole', 1), ('repulsor', -1)]:
            game = self.game()
            block = self.block(game, kind, speed_multiplier=0)
            block.x = 80
            game.blocks = [block]
            game.update(.1, set())
            self.assertGreater(game.x*sign, 0)
        game = self.game()
        ghost = self.block(game, 'ghost', age=2.1, speed_multiplier=0)
        game.blocks = [ghost]; game.update(.1, set())
        self.assertEqual(game.lives, 8)
        ghost.age = 3; game.update(.01, set())
        self.assertEqual(game.lives, 7)
        for kind in ('seeker', 'comet'):
            game = self.game(); b = self.block(game, kind, speed_multiplier=1)
            b.x, b.y = 100, 150; game.blocks = [b]; game.update(.2, set())
            if kind == 'seeker': self.assertLess(b.x, 100)
            else: self.assertGreater(b.speed_multiplier, 1)

    def test_split_bomb_bounce_and_entity_cap(self):
        game = self.game()
        b = self.block(game, 'splitter', age=1.39)
        b.y = 100; game.blocks = [b]; game.update(.02, set())
        self.assertEqual(len(game.blocks), 3)
        self.assertTrue(all(len(b.cells) == 1 for b in game.blocks))
        game = self.game(); b = self.block(game, 'bomb', age=1.99, speed_multiplier=0)
        b.x += 50; game.blocks = [b]; game.update(.02, set())
        self.assertEqual(game.lives, 6)
        game = self.game(); game.y = 100
        b = self.block(game, 'spring'); b.x = 100; b.y = game.bottom+1
        game.blocks = [b]; game.update(.01, set())
        self.assertTrue(b.bounced); y = b.y
        game.update(.1, set()); self.assertGreater(b.y, y)
        game.blocks = [self.block(game, 'normal') for _ in range(80)]
        game.spawn(); self.assertEqual(len(game.blocks), 80)

    def test_haste_damages_but_still_boosts(self):
        game = self.game()
        game.chaos_contact(self.block(game, 'haste'))
        self.assertEqual(game.lives, 7)
        self.assertEqual(game.haste_left, 4)
        game.chaos_contact(self.block(game, 'haste'))
        self.assertEqual(game.lives, 7)  # Contact grace prevents repeated damage.
        game.invulnerable = 0
        game.shield = True
        game.chaos_contact(self.block(game, 'haste'))
        self.assertEqual(game.lives, 7)
        self.assertFalse(game.shield)
        self.assertEqual(game.haste_left, 4)
        game.invulnerable = 0
        game.lives = 1
        game.chaos_contact(self.block(game, 'haste'))
        self.assertFalse(game.alive)
        self.assertEqual(game.death_cause, 'haste')

    def test_wild_colors_vary_but_other_types_keep_their_colors(self):
        from dodge_model import COLORS
        game = self.game()
        colors = set()
        for _ in range(40):
            game.blocks = []
            game.spawn_chaos('normal')
            colors.add(game.blocks[0].color)
        self.assertGreater(len(colors), 4)
        self.assertTrue(colors.issubset(set(COLORS)))
        for kind in CATALOG:
            if kind not in ('normal', 'wild_seven'):
                game.blocks = []
                game.spawn_chaos(kind)
                self.assertEqual(game.blocks[0].color, CATALOG[kind]['color'])

    def test_guide_samples_real_spawn_shapes(self):
        entries = {entry['id']: entry for entry in catalog()}
        self.assertEqual(len(entries['long']['preview_cells']), 6)
        self.assertEqual(len(entries['black_hole']['preview_cells']), 1)
        self.assertEqual(entries['heavy']['preview_size'], 42)
        self.assertTrue(all(entry['preview_cells'] for entry in entries.values()))

    def test_antidote_and_thorn(self):
        game = self.game()
        game.lives = 4
        game.burn_ticks = 2
        game.poison_ticks = 3
        game.chaos_contact(self.block(game, 'antidote'))
        self.assertEqual((game.lives, game.burn_ticks, game.poison_ticks), (5, 0, 0))
        game.regen_in = .1
        game.chaos_contact(self.block(game, 'thorn'))
        self.assertEqual(game.lives, 4)
        self.assertEqual(game.regen_in, 8)
        game.invulnerable = 0
        game.shield = True
        game.regen_in = 2
        game.chaos_contact(self.block(game, 'thorn'))
        self.assertEqual(game.lives, 4)
        self.assertEqual(game.regen_in, 2)

    def test_pause_bridge_rendering_and_classic_isolation(self):
        session = BrowserGame()
        self.assertEqual(len(session.dispatch({'action': 'chaos_options'})), len(CATALOG))
        session.start('dodge', 'chaos', 0)
        game = session.game; game.lives = 5
        for kind in CATALOG: game.spawn_chaos(kind)
        state = session.snapshot()
        self.assertEqual((state['lives'], state['max_lives']), (5, 8))
        self.assertTrue(any(c['kind'] == 'block_icon' and c['block'] == 'black_hole' for c in state['commands']))
        self.assertTrue(any(c['kind'] == 'oval' for c in state['commands']))
        session.dispatch({'action': 'pause'})
        timer = game.regen_in
        session.dispatch({'action': 'tick', 'dt': 8})
        self.assertEqual(game.regen_in, timer)
        for difficulty in ('easy', 'normal', 'hard', 'merciless', 'impossible'):
            classic = DodgeGame(difficulty=difficulty)
            classic.blocks = [Block(classic.x, classic.y, ((0, 0),), '#fff')]
            classic.update(.001, set())
            self.assertFalse(classic.alive)
            self.assertFalse(hasattr(classic, 'lives'))

if __name__ == '__main__': unittest.main()
