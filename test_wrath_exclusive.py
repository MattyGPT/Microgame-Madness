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
                    g.update(.5,set())
                    self.assertEqual(g.wrath_pattern.age,0)
                    self.assertEqual(g.stage.name,'wrath_exclusive')
        self.assertEqual(len(designs),24)


if __name__=='__main__': unittest.main()
