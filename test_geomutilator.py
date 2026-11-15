import unittest
from geomayhem import Geomayhem, Shot

class GeomutilatorTests(unittest.TestCase):
    def test_campaign_requires_forge_not_arena_clears(self):
        with self.assertRaises(ValueError):
            Geomayhem(1, 'geomutilator', campaign={'cleared': 0, 'unlocked_level': 1})
        game = Geomayhem(1, 'geomutilator', campaign={'cleared': 0, 'unlocked_level': 1, 'geomutilator': True})
        self.assertEqual(game.stars, 1)
        locked = Geomayhem(1, campaign={'cleared': 0, 'unlocked_level': 1})
        self.assertFalse(locked._equip('geomutilator'))
        for _ in range(100):
            locked._roll_offers()
            self.assertNotIn('acquire:geomutilator', [o['id'] for o in locked.offers])

    def test_saws_and_four_extra_beams(self):
        game = Geomayhem(1, 'geomutilator')
        game.fire()
        self.assertEqual([s.kind for s in game.shots], ['saw'])
        game.stars = 5
        game.fire()
        self.assertEqual(len([s for s in game.shots if s.kind == 'saw']), 2)
        self.assertEqual(len([e for e in game.effects if e['kind'] == 'forge_beam']), 4)

    def test_blade_kills_refresh_shield_beams_do_not(self):
        game = Geomayhem(1, 'geomutilator')
        game.stars = 3
        game.fire()
        game._spawn()
        enemy = game.enemies[0]
        enemy.hp = 1
        game._hit(enemy, game.shots[0])
        self.assertEqual(game.forge_shield, 1.5)
        lives = game.lives
        game._damage(8)
        self.assertEqual(game.lives, lives-6)
        game.forge_shield = .1
        game._hit(enemy, game.shots[0])
        self.assertEqual(game.forge_shield, .1)
        enemy.hp = 1
        beam = Shot(0, 0, 0, 0, 10, 'geomutilator', 5, set(), 'beam')
        game._hit(enemy, beam)
        self.assertEqual(game.forge_shield, .1)
        game.offers = []
        game.boss_intro_left = 0
        for _ in range(3):
            game.update(.05, set())
        self.assertEqual(game.forge_shield, 0)
        game.invulnerable = 0
        lives = game.lives
        game._damage(8)
        self.assertEqual(game.lives, lives-8)

class WeaponUnlockTests(unittest.TestCase):
    def test_drafts_and_acquisitions_respect_campaign_unlocks(self):
        from geomayhem_weapons import ARMORY
        for cleared in range(11):
            game = Geomayhem(1, campaign={'cleared': cleared, 'unlocked_level': cleared+1})
            for _ in range(100):
                game._roll_offers()
                for offer in game.offers:
                    if offer['id'].startswith('acquire:'):
                        key=offer['id'].split(':')[1]
                        self.assertNotEqual(key, 'geomutilator')
                        self.assertLessEqual(list(ARMORY).index(key)//5, cleared)
            locked = next((key for i,key in enumerate(ARMORY) if key!='geomutilator' and i//5>cleared),None)
            if locked:
                self.assertFalse(game._equip(locked))
        # Theater remains unrestricted and the special Forge unlock stays separate.
        self.assertTrue(Geomayhem(1)._equip('sun'))
        self.assertTrue(Geomayhem(1, campaign={'cleared':0,'unlocked_level':1,'geomutilator':True})._equip('geomutilator'))

    def test_cataclysm_beams_have_visible_compact_and_full_art(self):
        game=Geomayhem(1,'geomutilator');game.stars=5;game.fire()
        effects=[c for c in game.snapshot(compact=True)['commands'] if c['kind']=='geomayhem_effect' and c['effect']=='forge_beam']
        self.assertEqual(len(effects),4)
        self.assertTrue(all(c['opacity']>=.8 and c['radius']>=10 and c['end'] for c in effects))
        self.assertTrue(any(c.get('opacity',0)>=.8 for c in game.snapshot()['commands']))
