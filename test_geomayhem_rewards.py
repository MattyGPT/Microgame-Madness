"""The shared model exports compact achievement evidence for browser and accounts."""
import unittest
from geomayhem import Geomayhem, ARMORY, RELICS

class GeomayhemRewardEvidenceTests(unittest.TestCase):
    def test_live_evidence_matches_model_and_weapon_stars(self):
        game = Geomayhem()
        game.kills, game.cleared, game.rank = 123, 7, 9
        game.loadout = dict(zip(list(ARMORY)[:4], [1, 3, 5, 5]))
        game.relics = set(list(RELICS)[:3])
        result = game.snapshot()
        self.assertEqual({key:result[key] for key in result if key.startswith('geo_')}, {
            'geo_level':1, 'geo_kills':123, 'geo_waves':7, 'geo_rank':9,
            'geo_weapon_count':4, 'geo_max_stars':5, 'geo_five_star_count':2, 'geo_relic_count':3})
