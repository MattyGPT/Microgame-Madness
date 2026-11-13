import math
import random
import unittest
from geomayhem import Geomayhem
from geomayhem_bosses import INTRO_DURATION, MOVES, boss_attack, boss_pressure

class BossUpgradeTests(unittest.TestCase):
    def test_regent_attacks_twenty_five_percent_more_often_in_every_phase(self):
        for phase, cast, volley in [(1, 1.65, .65), (2, 1.43, .58), (3, 1.21, .51)]:
            pressure = boss_pressure(20, phase)
            self.assertAlmostEqual(pressure['cast_interval'], cast / 1.25)
            self.assertAlmostEqual(pressure['volley_interval'], volley / 1.25)
        for level in range(1, 20):
            progress = (level-1)/19
            late = max(0, (level-10)/10)**1.4
            self.assertAlmostEqual(boss_pressure(level)['cast_interval'], 4.4-1.7*progress-1.05*late)
            self.assertAlmostEqual(boss_pressure(level)['volley_interval'], 2-.85*progress-.5*late)

    def boss(self, level, anomaly='armored'):
        game=Geomayhem(level,rng=random.Random(1))
        game.anomaly=anomaly;game.wave=20;game.break_left=0;game._spawn()
        return game,game.enemies[0]

    def test_all_twenty_have_tripled_progressive_health(self):
        for anomaly,multiplier in [('swarm',.85),('armored',1.2),('frenzy',.9)]:
            previous=0
            for level in range(1,21):
                game,boss=self.boss(level,anomaly)
                old=350*(1+(level-1)*.18+19*.035)*multiplier
                self.assertAlmostEqual(boss.max_hp,3*old)
                self.assertGreater(boss.max_hp,previous)
                previous=boss.max_hp
                self.assertEqual(game.snapshot()['boss']['name'],game.snapshot()['arena']['boss'])

    def test_introductions_freeze_combat_and_only_run_once(self):
        game,boss=self.boss(1)
        game.hazards=[[0,0,100,0,5]]
        before=(game.elapsed,game.x,game.y,game.lives,boss.x,boss.y,game.hazards[0][:])
        game.update(.05,{'Right','f'})
        self.assertEqual(before,(game.elapsed,game.x,game.y,game.lives,boss.x,boss.y,game.hazards[0][:]))
        self.assertLess(game.boss_intro_left,INTRO_DURATION)
        for _ in range(math.ceil(INTRO_DURATION/.05)+1):game.update(.05,set())
        self.assertIsNone(game.snapshot()['boss_intro'])
        game._spawn()
        self.assertEqual(game.boss_intro_left,0)

    def test_every_boss_has_three_distinct_finite_warned_attacks(self):
        self.assertEqual(len(MOVES),20)
        signatures=[]
        for level in range(1,21):
            game,boss=self.boss(level)
            local=[]
            for cast in range(3):
                game.zones=[];game.boss_cast=cast
                boss_attack(game,boss,2)
                self.assertEqual(game.boss_move,MOVES[level-1][cast])
                self.assertTrue(game.zones)
                for zone in game.zones:
                    self.assertGreaterEqual(zone['warning'],.55)
                    for value in zone.values():
                        if isinstance(value,(int,float)):self.assertTrue(math.isfinite(value))
                local.append(repr(game.zones))
            self.assertEqual(len(set(local)),3)
            signatures.append(tuple(local))
        self.assertEqual(len(set(signatures)),20)

    def test_pressure_increases_every_level_and_phase(self):
        for phase in (1,2,3):
            for level in range(2,21):
                previous, current = boss_pressure(level-1,phase), boss_pressure(level,phase)
                for key in ('cast_interval','volley_interval','warning','stagger'):
                    self.assertLessEqual(current[key],previous[key])
                self.assertGreater(current['projectile_speed'],previous['projectile_speed'])
        first,last=boss_pressure(1),boss_pressure(20,3)
        self.assertLess(last['volley_interval'], first['volley_interval']/3)
        self.assertGreater(last['projectile_speed'],first['projectile_speed']*2)
        for level in (7,16,20):
            game,boss=self.boss(level)
            boss.skill_in=0
            game._enemy_skill(boss,.01)
            self.assertAlmostEqual(boss.skill_in,boss_pressure(level)['cast_interval'])
        game,boss=self.boss(20)
        for i in range(100):boss_attack(game,boss,3)
        self.assertLessEqual(len(game.zones),28)

    def test_live_boss_volleys_use_level_and_phase_pressure(self):
        for level in range(1,21):
            for phase in (1,2):
                game,boss=self.boss(level)
                game.boss_intro_left=0
                game.spawned=game.quota
                boss.x,boss.y=300,200
                boss.skill_in=999
                boss.attack_in=0
                boss.hp=boss.max_hp*(1 if phase==1 else .4)
                game.update(.01,set())
                pressure=boss_pressure(level,phase)
                self.assertTrue(game.hazards)
                self.assertAlmostEqual(boss.attack_in,pressure['volley_interval'])
                for hazard in game.hazards:
                    self.assertAlmostEqual(math.hypot(hazard[2],hazard[3]),pressure['projectile_speed'])

    def test_boss_contact_deals_thirty_once_per_invulnerability_window(self):
        for level in (1,10,20):
            game,boss=self.boss(level)
            game.boss_intro_left=0
            game.spawned=game.quota
            boss.x,boss.y=game.x,game.y
            boss.skill_in=boss.attack_in=999
            health=game.lives
            game.update(.01,set())
            self.assertEqual(game.lives,health-30)
            game.update(.01,set())
            self.assertEqual(game.lives,health-30)

    def test_every_boss_calls_bounded_reinforcements_beyond_wave_quota(self):
        for level in range(1,21):
            game,boss=self.boss(level)
            game.spawned=game.quota
            game.invulnerable=100
            game.boss_reinforcement_in=0
            serial=game.serial
            game.update(.01,set())
            self.assertEqual(game.serial,serial)  # Intro freezes summons too.
            game.boss_intro_left=0
            for _ in range(30):
                game.boss_reinforcement_in=0
                game.update(.01,set())
            self.assertGreater(game.spawned,game.quota)
            self.assertEqual(sum(e.kind=='boss' for e in game.enemies),1)
            self.assertLessEqual(len(game.enemies)-1,5+level//2)
            for escort in game.enemies[1:]:
                self.assertGreater(math.hypot(escort.x-game.x,escort.y-game.y),100)
            boss.hp=0
            serial=game.serial
            game.boss_reinforcement_in=0
            game.update(.01,set())
            self.assertEqual(game.serial,serial)
            self.assertFalse(game.won)
            for escort in game.enemies: escort.hp=0
            game.update(.01,set())
            self.assertEqual(game.serial,serial)
            self.assertTrue(game.won)

    def test_boss_arena_matches_judgment_radius_and_confines_combatants(self):
        for level in range(1,21):
            game,boss=self.boss(level)
            self.assertEqual(game.boss_arena_radius,280)
            self.assertEqual(game.snapshot()['bounds'],[-280,280,-280,280])
            game.boss_intro_left=0
            game.invulnerable=100
            game.x,game.y=260,260
            for _ in range(12):game.update(.05,{'Right','Up'})
            self.assertLessEqual(math.hypot(game.x,game.y),265.00001)
            for enemy in game.enemies:self.assertLessEqual(math.hypot(enemy.x,enemy.y)+enemy.radius,280.00001)

    def test_compact_boss_art_has_identity_and_phase(self):
        for level in range(1,21):
            game,boss=self.boss(level)
            boss.hp=boss.max_hp*.2
            command=next(c for c in game.snapshot(compact=True)['commands'] if c['kind']=='geomayhem_boss')
            self.assertEqual(command['level'],level)
            self.assertEqual(command['phase'],3 if level in (10,20) else 2)

if __name__=='__main__':unittest.main()
