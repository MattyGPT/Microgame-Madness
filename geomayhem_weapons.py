"""Geomayhem's data-driven armory. Every evolution enables a real combat trait."""
from dataclasses import dataclass


TRAITS = {
    "pierce": "Pierces three extra enemies",
    "homing": "Steers shots toward nearby enemies",
    "ricochet": "Shots bounce off arena walls",
    "blast": "Hits explode in a small area",
    "chain": "Hits arc to three nearby enemies",
    "slow": "Hits slow enemies for two seconds",
    "split": "Hits release three piercing shards",
    "return": "Shots return toward Cubie",
    "burn": "Hits ignite enemies for damage over time",
    "pull": "Hits pull surrounding enemies inward",
    "lifesteal": "Each hit restores a little health",
    "freeze": "Hits briefly freeze enemies",
}


@dataclass(frozen=True)
class Weapon:
    id: str
    name: str
    kind: str
    color: str
    damage: float
    interval: float
    count: int
    trait: str
    third: str
    fifth: str
    evolved: str
    ultimate: str

    def traits(self, stars):
        return {self.trait} | ({self.third} if stars >= 3 else set()) | ({self.fifth} if stars >= 5 else set())

    def info(self, stars=1):
        return {"id": self.id, "name": self.name, "kind": self.kind, "color": self.color,
                "stars": stars, "form": self.ultimate if stars == 5 else self.evolved if stars >= 3 else self.name,
                "description": f"{self.kind.title()} · {TRAITS[self.trait]}",
                "third": f"{self.evolved}: {TRAITS[self.third]}. Faceted art.",
                "fifth": f"{self.ultimate}: {TRAITS[self.fifth]}. Crowned nova art."}


# Four distinct builds per firing pattern; each has its own three-trait evolution.
WEAPONS = tuple(Weapon(*row) for row in (
    ("needle", "Prism Needle", "bolt", "#71f5d2", 5, .34, 1, "pierce", "split", "homing", "Prism Fork", "Prism Constellation"),
    ("comet", "Comet Wand", "bolt", "#ffae72", 7, .65, 1, "burn", "blast", "return", "Comet Flare", "Comet Apocalypse"),
    ("seeker", "Seeker Pearl", "bolt", "#b5a0ff", 4, .48, 2, "homing", "chain", "lifesteal", "Seeker Cluster", "Seeker Galaxy"),
    ("icepin", "Glacier Pin", "bolt", "#a9edff", 6, .55, 1, "slow", "freeze", "ricochet", "Glacier Fang", "Glacier Crown"),
    ("buckshot", "Hex Buckshot", "fan", "#ffd679", 3, .78, 5, "pierce", "ricochet", "blast", "Hex Scatter", "Hex Supernova"),
    ("cinders", "Cinder Cards", "fan", "#ff7968", 3, .6, 3, "burn", "split", "pull", "Cinder Deck", "Cinder Vortex"),
    ("frostfan", "Frost Fan", "fan", "#7dcfff", 4, .9, 7, "freeze", "pierce", "homing", "Frost Feathers", "Frost Flock"),
    ("thorn", "Thorn Harp", "fan", "#b4f779", 4, .7, 4, "lifesteal", "slow", "chain", "Thorn Bloom", "Thorn Cathedral"),
    ("halo", "Halo Disc", "ring", "#ffe9a3", 3, 1.25, 10, "pierce", "return", "blast", "Halo Echo", "Halo Eclipse"),
    ("snow", "Snowflake Engine", "ring", "#d3f9ff", 2, 1.05, 8, "slow", "split", "freeze", "Snowflake Fractal", "Absolute Zero"),
    ("spark", "Spark Wheel", "ring", "#f9ff72", 3, 1.4, 12, "chain", "ricochet", "homing", "Spark Dynamo", "Spark Storm"),
    ("petal", "Petal Reactor", "ring", "#ff9ed9", 3, 1.2, 6, "lifesteal", "pull", "burn", "Petal Spiral", "Petal Sun"),
    ("rail", "Rail Ruler", "beam", "#82e7ff", 8, .9, 1, "pierce", "chain", "blast", "Rail Lattice", "Rail Horizon"),
    ("lance", "Ember Lance", "beam", "#ff9d44", 6, .8, 1, "burn", "pull", "lifesteal", "Ember Spear", "Ember Monarch"),
    ("laser", "Polar Laser", "beam", "#8fafff", 7, 1.0, 2, "slow", "freeze", "split", "Polar Refraction", "Polar Aurora"),
    ("lightning", "Lightning Stapler", "beam", "#d9b0ff", 5, .7, 1, "chain", "split", "burn", "Lightning Stitch", "Lightning Tapestry"),
    ("saw", "Orbit Saw", "orbit", "#d7ff85", 4, 1.8, 2, "pierce", "burn", "blast", "Orbit Teeth", "Orbit Shredder"),
    ("moon", "Moon Marbles", "orbit", "#becaff", 3, 1.7, 3, "slow", "pull", "freeze", "Moon Tides", "Moon Singularity"),
    ("satellite", "Volt Satellites", "orbit", "#fff17e", 4, 1.9, 2, "chain", "lifesteal", "split", "Volt Array", "Volt Cosmos"),
    ("rose", "Rose Guard", "orbit", "#ff8fa5", 3, 1.6, 4, "lifesteal", "freeze", "chain", "Rose Halo", "Rose Sovereign"),
    ("bomb", "Polygon Bomb", "mine", "#ffba69", 12, 1.4, 1, "blast", "split", "burn", "Polygon Cluster", "Polygon Inferno"),
    ("well", "Gravity Seed", "mine", "#b695ff", 8, 1.6, 2, "pull", "slow", "chain", "Gravity Well", "Gravity Collapse"),
    ("trap", "Cryo Trap", "mine", "#91fff1", 7, 1.2, 1, "freeze", "blast", "split", "Cryo Crystal", "Cryo Garden"),
    ("spore", "Vampire Spore", "mine", "#f3a4ed", 8, 1.5, 3, "lifesteal", "burn", "pull", "Vampire Bloom", "Vampire Nebula"),
    ("boomer", "Angle Boomerang", "boomerang", "#ffda83", 5, .85, 1, "pierce", "split", "chain", "Angle Trident", "Angle Infinity"),
    ("crescent", "Frost Crescent", "boomerang", "#b8f3ff", 5, 1.0, 2, "slow", "freeze", "blast", "Frost Eclipse", "Frost Requiem"),
    ("chakram", "Flame Chakram", "boomerang", "#ff897c", 6, 1.1, 2, "burn", "ricochet", "lifesteal", "Flame Twins", "Flame Phoenix"),
    ("yo_yo", "Magnet Yo-Yo", "boomerang", "#c9b4ff", 4, .75, 1, "pull", "homing", "split", "Magnet Pendulum", "Magnet Web"),
    ("drum", "Thunder Drum", "nova", "#faf08b", 7, 1.8, 1, "chain", "pull", "blast", "Thunder Gong", "Thunder Cathedral"),
    ("heart", "Pulse Heart", "nova", "#ff8cb1", 6, 1.6, 1, "lifesteal", "slow", "burn", "Pulse Bloom", "Pulse Superheart"),
    ("zero", "Zero Bell", "nova", "#a6e9ff", 5, 1.5, 1, "freeze", "split", "pull", "Zero Chime", "Zero Resonance"),
    ("sun", "Sun Dial", "nova", "#ffbd68", 8, 2.0, 1, "burn", "blast", "chain", "Sun Corona", "Sun Genesis"),
))
ARMORY = {weapon.id: weapon for weapon in WEAPONS}
