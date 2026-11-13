"""Collision, lifecycle, fairness, and renderer checks for the Wrath-only deck."""
import math
import random
import unittest
from kings_wrath import KingsWrath, WRATH_ATTACKS
from pumpkin_king import ATTACK_NAMES, PumpkinKing
from wrath_attacks import NEW_ATTACKS, Hazard, WrathPattern
from web.bridge import BrowserGame


class ExclusiveWrathTests(unittest.TestCase):
    def test_exclusives_do_not_expand_the_pumpkin_fight(self):
        self.assertEqual(len(NEW_ATTACKS), 8)
        self.assertEqual(len(WRATH_ATTACKS), 15)
        self.assertEqual(len(ATTACK_NAMES), 7)
        self.assertEqual(len(PumpkinKing().attack_survivals), 7)
        self.assertEqual(len(KingsWrath('starfall_verdict').attack_survivals), 15)

    def test_starfall_speed_and_four_meteor_sentence_impacts(self):
        for variant, warning, interval, duration, count in (
                ('easy', 1.4, 2.2, 10, 1), ('normal', 1.05, 1.8, 12, 1),
                ('hard', .8, 1.45, 14, 4)):
            with self.subTest(variant=variant):
                p = WrathPattern('starfall_verdict', variant, random.Random(4))
                self.assertAlmostEqual(p.warning, warning / 1.3)
                self.assertAlmostEqual(p.interval, interval / 1.3)
                self.assertAlmostEqual(p.duration, duration / 1.3)
                p.update(p.warning - .01, 0, -150)
                self.assertEqual(len(p.hazards), count)
                self.assertEqual(len({h.coords for h in p.hazards}), count)
                self.assertFalse(any(h.active for h in p.hazards))
                p.update(.02, 0, -150)
                self.assertTrue(all(h.active for h in p.hazards))
                for h in p.hazards:
                    self.assertTrue(h.hits(*h.coords[:2]))
                p.update(.5 / 1.3, 0, -150)
                self.assertFalse(p.hazards)
                p.update(p.interval + .01 - p.age, 0, -150)
                self.assertEqual(len(p.hazards), count)
                self.assertTrue(all(h.token == 1 for h in p.hazards))

    def test_crown_chess_all_variants_run_fifty_percent_faster(self):
        for variant, warning, interval, duration in (
                ('easy', 1.4, 2.8, 10), ('normal', 1.05, 2.4, 12),
                ('hard', .8, 2, 14)):
            with self.subTest(variant=variant):
                p = WrathPattern('crown_chess', variant, random.Random(4))
                self.assertAlmostEqual(p.warning, warning / 1.5)
                self.assertAlmostEqual(p.interval, interval / 1.5)
                self.assertAlmostEqual(p.duration, duration / 1.5)
                p.update(p.warning - .01, 0, -150)
                self.assertTrue(p.hazards)
                self.assertFalse(any(h.active for h in p.hazards))
                p.update(.02, 0, -150)
                self.assertTrue(all(h.active for h in p.hazards))
                p.update(.65 / 1.5, 0, -150)
                self.assertFalse(p.hazards)
                p.update(p.interval + .01 - p.age, 0, -150)
                self.assertTrue(p.hazards)
                self.assertTrue(all(h.token == 1 and not h.active for h in p.hazards))

    def test_eclipse_orbit_speed_and_hard_safe_circle_size(self):
        for variant, rate, speed, width, radius in (
                ('easy', 1, .35, 75, 122), ('normal', 1.25, .48, 135, 96),
                ('hard', 1.25, .62, 175, 78)):
            with self.subTest(variant=variant):
                p = WrathPattern('eclipse_waltz', variant, random.Random(4))
                p.update(1.5, 0, -150)
                self.assertFalse(p.hazards[0].active)
                for age in (2, 3, 5):
                    p.update(age - p.age, 0, -150)
                    h = p.hazards[0]
                    x, y, r = h.coords
                    t = (age - 1.6) * rate
                    self.assertAlmostEqual(x, width * math.sin(t * speed))
                    self.assertAlmostEqual(y, -120 - 45 * math.cos(t * speed))
                    expected = (radius + 6 * math.sin(t * 2)) * .9 if variant == 'hard' else radius
                    self.assertAlmostEqual(r, expected)
                    self.assertTrue(h.active)
                    self.assertFalse(h.hits(x, y))
                    self.assertTrue(h.hits(x + r, y))

    def test_royal_loom_speed_and_solid_square_danger(self):
        for variant, warning, interval, duration, count in (
                ('easy', 1.4, 2.7, 10, 1), ('normal', 1.05, 2.2, 12, 2),
                ('hard', .8, 1.9, 14, 3)):
            with self.subTest(variant=variant):
                p = WrathPattern('royal_loom', variant, random.Random(4))
                self.assertAlmostEqual(p.warning, warning / 1.6)
                self.assertAlmostEqual(p.interval, interval / 1.6)
                self.assertAlmostEqual(p.duration, duration / 1.6)
                p.update(p.warning - .01, 0, -150)
                squares = [h for h in p.hazards if h.shape == 'rect']
                self.assertEqual(len(squares), count)
                self.assertFalse(any(h.hits(*h.coords[:2]) for h in squares))
                p.update(.02, 0, -150)
                for h in (h for h in p.hazards if h.shape == 'rect'):
                    x, y, w, height = h.coords
                    self.assertEqual(w, height)
                    self.assertTrue(h.hits(x, y))
                    self.assertTrue(h.hits(x + w / 3, y + height / 3))
                    self.assertFalse(h.hits(x + w, y))
                p.update(.75 / 1.6, 0, -150)
                self.assertFalse(p.hazards)
                p.update(p.interval + .01 - p.age, 0, -150)
                self.assertEqual(len([h for h in p.hazards if h.shape == 'rect']), count)

    def test_warning_shapes_never_damage_and_geometry_has_escape_space(self):
        for key in NEW_ATTACKS:
            for variant in ('easy','normal','hard'):
                with self.subTest(key=key,variant=variant):
                    p=WrathPattern(key,variant,random.Random(4))
                    seen=False
                    for tick in range(75):
                        # A walking turtle leaves a real trail rather than stacked stationary seeds.
                        p.update(.2, 140*math.sin(tick*.18), -150+40*math.cos(tick*.18))
                        self.assertLess(len(p.events), 20)
                        self.assertLess(len(p.hazards), 100)
                        for h in p.hazards:
                            self.assertTrue(all(math.isfinite(v) for v in h.coords))
                            if not h.active:
                                self.assertFalse(h.hits(*h.coords[:2]))
                            seen |= h.active
                        self.assertTrue(any(not any(h.hits(x,y) for h in p.hazards)
                                            for x in range(-270,271,30) for y in range(-210,31,30)),
                                        f'No safe floor at {p.age:.2f}s')
                    self.assertTrue(seen)

    def test_shape_collisions_match_the_visible_boundaries(self):
        fixtures=[(Hazard('disc',(0,-100,30),True),(0,-100),(80,-100)),
                  (Hazard('rect',(0,-100,60,30),True),(0,-100),(80,-100)),
                  (Hazard('line',(-50,-100,50,-100,10),True),(0,-100),(0,-160)),
                  (Hazard('ring',(0,-100,60,10),True),(60,-100),(0,-100)),
                  (Hazard('safe',(0,-100,60),True),(80,-100),(0,-100))]
        for shape,hit,safe in fixtures:
            self.assertTrue(shape.hits(*hit));self.assertFalse(shape.hits(*safe))

    def test_midnight_guillotines_trade_high_and_low_each_wave(self):
        for variant in ('easy', 'normal', 'hard'):
            p = WrathPattern('pendulum_court', variant, random.Random(4))
            for wave in range(3):
                for offset in (p.warning / 2, p.warning + .3):
                    p.update(wave * p.interval + offset - p.age, 0, -180)
                    blades = [h for h in p.hazards if h.token == wave]
                    self.assertEqual(len(blades), 3 if variant == 'hard' else 1)
                    reaches = []
                    for blade in blades:
                        ax, ay, bx, by, _ = blade.coords
                        reaches.append(round(math.hypot(bx - ax, by - ay)))
                        self.assertEqual(blade.active, offset > p.warning)
                    self.assertEqual(reaches, ([210, 270, 240] if wave % 2 == 0 else [270, 210, 240])
                                     if variant == 'hard' else [300])

    def test_pendulum_heights_and_midnight_swing_speed(self):
        for variant, anchor_y, speed, period in (('easy', 35, 1, 2.8),
                                                ('normal', -5, 1.15, 2.2),
                                                ('hard', -5, 1.3 * 1.25, 1.8)):
            with self.subTest(variant=variant):
                p = WrathPattern('pendulum_court', variant, random.Random(4))
                p.update(.4, 0, -180)
                self.assertEqual([h.coords[1] for h in p.hazards],
                                 [anchor_y, anchor_y, anchor_y + 55] if variant == 'hard' else [anchor_y])
                p.update(p.warning + .5 - p.age, 0, -180)
                ax, ay, bx, by, _ = p.hazards[0].coords
                self.assertEqual(ay, anchor_y)
                angle = -math.pi / 2 + .95 - math.pi * .5 * speed / period
                reach = math.hypot(bx - ax, by - ay)
                self.assertAlmostEqual(bx, ax + reach * math.cos(angle))
                self.assertAlmostEqual(by, ay + reach * math.sin(angle))
                p.update(p.warning + 1.7 / speed + .01 - p.age, 0, -180)
                self.assertFalse(any(h.token == 0 for h in p.hazards))

    def test_midnight_warning_and_round_break_are_shorter(self):
        for attack, warning, rest in (('pendulum_court__hard', .8 / 1.5 / 1.25 / 1.25, .2),
                                      ('pendulum_court', 1.05, .5),
                                      ('pendulum_court__easy', 1.4, .5),
                                      ('mirror_lances__hard', .8, .5)):
            with self.subTest(attack=attack):
                game = KingsWrath(attack, random.Random(4))
                self.assertAlmostEqual(game.wrath_pattern.warning, warning)
                self.assertEqual(game.queue[-1].name, 'wrath_break')
                self.assertEqual(game.queue[-1].duration, rest)
                pattern = game.wrath_pattern
                pattern.update(warning - .01, 0, -180)
                self.assertTrue(pattern.hazards)
                self.assertFalse(any(h.active for h in pattern.hazards))
                pattern.update(.02, 0, -180)
                self.assertTrue(all(h.active for h in pattern.hazards))

    def test_midnight_spawns_faster_and_has_closer_blades(self):
        p = WrathPattern('pendulum_court', 'hard', random.Random(4))
        self.assertEqual(p.interval, .75)
        self.assertAlmostEqual(p.duration, 14 / 1.25)
        p.update(.1, 0, -180)
        self.assertEqual([h.coords[0] for h in p.hazards], [-189, 189, -90])
        p.update(p.interval - .01 - p.age, 0, -180)
        self.assertEqual(p.serial, 1)
        p.update(.02, 0, -180)
        self.assertEqual(p.serial, 2)
        new_blades = [h for h in p.hazards if h.token == 1]
        self.assertEqual(len(new_blades), 3)
        self.assertTrue(all(not h.active for h in new_blades))
        for variant, interval in (('easy', 3.4), ('normal', 3)):
            p = WrathPattern('pendulum_court', variant, random.Random(4))
            self.assertEqual(p.interval, interval)
            p.update(.1, 0, -180)
            self.assertEqual(p.hazards[0].coords[0], -210)

    def test_midnight_center_blade_travels_in_both_directions(self):
        for wave in (0, 1):
            p = WrathPattern('pendulum_court', 'hard', random.Random(4))
            positions = []
            for offset in (p.warning / 2, p.warning + .01, p.warning + .5, p.warning + 1):
                p.update(wave * p.interval + offset - p.age, 0, -180)
                center = [h for h in p.hazards if h.token == wave][2]
                positions.append(center.coords[0])
                self.assertEqual(center.coords[1], 50)
                if center.active:
                    ax, ay, bx, by, _ = center.coords
                    self.assertTrue(center.hits((ax + bx) / 2, (ay + by) / 2))
            self.assertEqual(positions, sorted(positions, reverse=bool(wave)))
            self.assertGreater(abs(positions[-1] - positions[0]), 175)

    def test_bell_counter_silences_both_echoes_once(self):
        game=KingsWrath('resonant_bells__hard',random.Random(3))
        p=game.wrath_pattern
        p.update(1.5,game.x,game.y)
        ring=next(h for h in p.hazards if h.active)
        game.x,game.y=ring.coords[0]+ring.coords[2],ring.coords[1]
        game.counter_time=.1
        p.collide(game)
        self.assertEqual(game.counter_hits,1)
        self.assertEqual(game.damage_taken,0)
        self.assertFalse(any(h.token==ring.token for h in p.hazards))
        p.collide(game)
        self.assertEqual(game.counter_hits,1)

    def test_mirror_wall_speeds_and_damage_by_variant(self):
        for suffix, speed, damage in (('__easy', 170, 1), ('', 200 * 1.15, 1),
                                      ('__hard', 225 * 1.15, 2)):
            with self.subTest(suffix=suffix):
                game = KingsWrath('mirror_lances' + suffix, random.Random(4))
                pattern = game.wrath_pattern
                pattern.update(pattern.warning + .5, 0, -180)
                blade = pattern.hazards[0]
                self.assertAlmostEqual(blade.coords[0], -310 + .5 * speed)
                game.x, game.y = blade.coords[:2]
                game.invulnerable = 0
                lives = game.lives
                pattern.collide(game)
                self.assertEqual(game.lives, lives - damage)
                self.assertEqual(game.damage_taken, damage)
                pattern.collide(game)
                self.assertEqual(game.lives, lives - damage)

    def test_all_variants_reset_cleanly_and_render_in_the_browser_bridge(self):
        designs=set()
        for key in NEW_ATTACKS:
            for suffix in ('__easy','','__hard'):
                with self.subTest(key=key,suffix=suffix):
                    b=BrowserGame()
                    b.dispatch({'action':'start','mode':'wrath','difficulty':key+suffix,'now':0})
                    g=b.game
                    g.hurt=lambda *args,**kwargs: None
                    g.touches_king=lambda: False
                    g.update(3,set())
                    self.assertEqual(g.wrath_pattern.age,0)
                    g.update(1.5,set())
                    snapshot=b.snapshot()
                    self.assertIn(NEW_ATTACKS[key][0],snapshot['label'])
                    self.assertTrue(snapshot['commands'])
                    designs.add(str(snapshot['commands']))
                    self.assertLess(len(b.canvas.items),2500)
                    g.update(g.stage.duration-g.stage_age,set())
                    self.assertEqual(g.stage.name,'wrath_break')
                    self.assertFalse(g.wrath_pattern.hazards)
                    self.assertEqual(g.attack_survivals[WRATH_ATTACKS[key]],1)
                    g.update(g.stage.duration,set())
                    self.assertEqual(g.wrath_pattern.age,0)
                    self.assertEqual(g.stage.name,'wrath_exclusive')
        self.assertEqual(len(designs),24)


if __name__=='__main__': unittest.main()
