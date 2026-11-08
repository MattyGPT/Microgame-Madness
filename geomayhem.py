"""Display-independent Geomayhem: 20 arenas, 20 waves and four-slot builds."""
from dataclasses import dataclass, field
import math
import random

from geomayhem_weapons import ARMORY, ITEM_WEAPONS, WEAPONS
from geomayhem_arenas import ARENAS, contains, queue_pattern

LEVELS = (
    ("Mint Circuit", "#71f5d2"), ("Amber Foundry", "#ffba69"),
    ("Violet Array", "#b695ff"), ("Glacier Grid", "#a9edff"),
    ("Rose Reactor", "#ff8fa5"), ("Volt Vault", "#f9ff72"),
    ("Cinder City", "#ff7968"), ("Lunar Labyrinth", "#becaff"),
    ("Prism Rift", "#ff9ed9"), ("Mayhem Core", "#ffffff"),
    ("Coral Cascade", "#7ee4e1"), ("Clockwork Keep", "#f3ce83"),
    ("Emerald Canopy", "#94e68d"), ("Obsidian Forge", "#ec9166"),
    ("Aurora Observatory", "#9ef2dc"), ("Neon Speedway", "#fc91da"),
    ("Sunken Archive", "#93c5ee"), ("Mirage Palace", "#e8cc9b"),
    ("Void Cathedral", "#c0a7f5"), ("Infinity Crown", "#ffe5a6"),
)
WAVES = 20
MAX_ENEMIES, MAX_SHOTS, MAX_GEMS = 60, 100, 100
MAX_WEAPONS = 4
ANOMALIES = {
    "swarm": ("Swarming shapes", "+2 enemies per wave; enemies have 15% less health."),
    "armored": ("Armored shapes", "Enemies have 20% more health but move 10% slower."),
    "frenzy": ("Frenzied shapes", "Enemies move 15% faster but have 10% less health."),
}
RELICS = {
    "glass": ("Glass Prism", "+35% damage; lose 20% maximum health."),
    "siphon": ("Siphon Core", "Every weapon gains life-stealing hits."),
    "winter": ("Winter Engine", "Every weapon slows enemies on hit."),
    "echo": ("Echo Chamber", "Each attack fires an extra projectile or pulse; -15% damage."),
    "fleet": ("Fleet Core", "+30 movement speed."),
    "reach": ("Long Reach", "+70 XP pickup range."),
}


@dataclass
class Enemy:
    id: int
    x: float
    y: float
    hp: float
    speed: float
    radius: float
    kind: str
    max_hp: float
    slow: float = 0
    frozen: float = 0
    burn: float = 0
    attack_in: float = 2
    skill_in: float = 3
    windup: float = 0
    dash_left: float = 0
    dash_target: tuple | None = None
    dash_vector: tuple = (0, 0)
    control_guard: float = 0


@dataclass
class Shot:
    x: float
    y: float
    vx: float
    vy: float
    damage: float
    weapon: str
    stars: int
    traits: set
    kind: str = "bolt"
    age: float = 0
    ttl: float = 2
    angle: float = 0
    hits: set = field(default_factory=set)
    bounces: int = 0


class Geomayhem:
    left, right, bottom, top = -465, 465, -352.5, 352.5

    def __init__(self, level=1, weapon="needle", rng=None, campaign=None):
        if not isinstance(level, int) or not 1 <= level <= len(LEVELS):
            raise ValueError(f"Choose a level from 1 to {len(LEVELS)}")
        if weapon not in ARMORY:
            raise ValueError("Unknown Geomayhem weapon")
        workshop = {}
        if campaign is not None:
            if not isinstance(campaign, dict):
                raise ValueError("Invalid campaign progress")
            unlocked = campaign.get("unlocked_level", 1)
            if type(unlocked) is not int or not 1 <= unlocked <= len(LEVELS) or level > unlocked:
                raise ValueError("Clear the previous arena to unlock this level")
            cleared = campaign.get("cleared", 0)
            if type(cleared) is not int or not 0 <= cleared <= len(LEVELS) or unlocked != min(len(LEVELS), cleared + 1):
                raise ValueError("Invalid campaign progress")
            if list(ARMORY).index(weapon) // 5 > cleared:
                raise ValueError("Clear more arenas to unlock this starting weapon")
            workshop = campaign.get("workshop", {})
            if not isinstance(workshop, dict) or any(type(v) is not int or not 0 <= v <= 3 for v in workshop.values()):
                raise ValueError("Invalid workshop upgrades")
        self.rng = rng or random.Random()
        self.level, self.wave, self.cleared = level, 1, 0
        self.accent = LEVELS[level - 1][1]
        self.x = self.y = 0.0
        self.face = (0.0, -1.0)
        self.velocity = (0.0, 0.0)
        self.lives = self.max_lives = 100.0 + workshop.get("vitality", 0) * 10
        self.alive, self.won = True, False
        self.elapsed, self.invulnerable, self.damage_taken = 0.0, 0.0, 0.0
        self.rank, self.xp, self.kills, self.score = 1, 0, 0, 0
        self.speed, self.magnet = 175, 52 + workshop.get("magnet", 0) * 12
        self.damage_multiplier = 1 + workshop.get("power", 0) * .05
        self.relics = set()
        self.rerolls = 2
        self.anomaly = self.rng.choice(list(ANOMALIES))
        self.weapon = weapon
        self.loadout = {weapon: 1}
        self.cooldowns = {weapon: 0.0}
        self.upgrades = {"boots": 0, "magnet": 0, "heart": 0}
        self.offers = []
        self.enemies, self.shots, self.gems, self.effects, self.hazards = [], [], [], [], []
        self.zones = []
        self.zone_in = 8.0
        self.pattern_step = 0
        self.serial, self.shots_fired = 0, 0
        self.fire_in, self.spawn_in, self.break_left = 0, .6, 2.0
        self.spawned = 0
        self.aim = None
        self.death_message = ""

    @property
    def stars(self):
        """The starting weapon's stars, also used by the original HUD contract."""
        return self.loadout[self.weapon]

    @stars.setter
    def stars(self, value):
        self.loadout[self.weapon] = max(1, min(5, int(value)))

    @property
    def fire_in(self):
        return self.cooldowns[self.weapon]

    @fire_in.setter
    def fire_in(self, value):
        self.cooldowns[self.weapon] = value

    @property
    def xp_needed(self):
        return math.ceil((8 + (self.rank - 1) * 5) * 1.5)

    @property
    def quota(self):
        return 6 + self.wave * 2 + self.level + (2 if self.anomaly == "swarm" else 0)

    @property
    def pending_levelups(self):
        count, xp, rank = int(bool(self.offers)), self.xp, self.rank
        while xp >= math.ceil((8 + (rank-1)*5)*1.5):
            xp -= math.ceil((8 + (rank-1)*5)*1.5)
            count += 1
            rank += 1
        return count

    def choose(self, choice):
        if not self.alive or self.won or choice not in {offer["id"] for offer in self.offers}:
            return False
        if choice == "weapon" or choice.startswith("upgrade:"):
            weapon_id = self.weapon if choice == "weapon" else choice.split(":", 1)[1]
            if weapon_id not in self.loadout or self.loadout[weapon_id] >= 5:
                return False
            self.loadout[weapon_id] += 1
        elif choice.startswith("acquire:"):
            weapon_id = choice.split(":", 1)[1]
            if not self._equip(weapon_id):
                return False
        elif choice.startswith("relic:"):
            key = choice.split(":", 1)[1]
            if key not in RELICS or key in self.relics or len(self.relics) >= 3:
                return False
            self.relics.add(key)
            if key == "glass":
                self.damage_multiplier *= 1.35
                self.max_lives *= .8
                self.lives = min(self.lives, self.max_lives)
            elif key == "echo":
                self.damage_multiplier *= .85
            elif key == "fleet":
                self.speed += 30
            elif key == "reach":
                self.magnet += 70
        elif choice == "repair":
            self.lives = min(self.max_lives, self.lives + 35)
        else:
            self.upgrades[choice] += 1
            if choice == "boots":
                self.speed += 16
            elif choice == "magnet":
                self.magnet += 24
            elif choice == "heart":
                self.max_lives += 20
                self.lives = min(self.max_lives, self.lives + 30)
        self.offers = []
        self._offer_upgrade()
        return True

    def _equip(self, weapon_id):
        if weapon_id not in ARMORY or weapon_id in self.loadout or len(self.loadout) >= MAX_WEAPONS:
            return False
        self.loadout[weapon_id] = 1
        self.cooldowns[weapon_id] = 0.0
        return True

    def _offer_upgrade(self):
        if self.offers or self.xp < self.xp_needed or self.won or not self.alive:
            return
        self.xp -= self.xp_needed
        self.rank += 1
        self._roll_offers()

    def reroll(self):
        if not self.offers or self.rerolls <= 0 or not self.alive or self.won:
            return False
        previous = [o["id"] for o in self.offers]
        self.rerolls -= 1
        for _ in range(5):
            self._roll_offers()
            if [o["id"] for o in self.offers] != previous:
                break
        return True

    def _roll_offers(self):
        choices = []
        upgradable = [key for key, stars in self.loadout.items() if stars < 5]
        if upgradable:
            weapon_id = self.rng.choice(upgradable)
            weapon = ARMORY[weapon_id]
            next_star = self.loadout[weapon_id] + 1
            detail = weapon.info(next_star)["third" if next_star == 3 else "fifth"] if next_star in (3, 5) else "More damage and faster firing."
            choices.append({"id": "weapon" if weapon_id == self.weapon else f"upgrade:{weapon_id}",
                            "name": f"{weapon.name} · {next_star} stars", "description": detail})
        if len(self.loadout) < MAX_WEAPONS:
            available = [key for key in ARMORY if key not in self.loadout]
            # Every open-slot draft offers two paths: a random companion and a handheld.
            for group in ([key for key in available if key in ITEM_WEAPONS],
                          [key for key in available if key not in ITEM_WEAPONS]):
                if not group:
                    continue
                weapon_id = self.rng.choice(group)
                weapon = ARMORY[weapon_id]
                controls = "Follows Cubie and attacks automatically." if weapon.automatic else "Fires alongside your other weapons when you hold Fire."
                choices.append({"id": f"acquire:{weapon_id}", "name": f"NEW · {weapon.name} · 1 star",
                                "description": f"{weapon.info()['description']}. {controls} Uses slot {len(self.loadout)+1}/{MAX_WEAPONS}."})
        pool = [{"id": key, "name": name, "description": text} for key, name, text in (
            ("boots", "Quick Steps", "+16 movement speed. Keep moving."),
            ("magnet", "Gem Magnet", "+24 XP pickup range."),
            ("heart", "Cubie Armor", "+20 maximum health; restore 30 health."),
        ) if self.upgrades[key] < 5]
        pool.append({"id": "repair", "name": "Patch Up", "description": "Restore 35 health."})
        if self.rank % 3 == 0 and len(self.relics) < 3:
            relic = self.rng.choice([key for key in RELICS if key not in self.relics])
            name, description = RELICS[relic]
            choices.append({"id": f"relic:{relic}", "name": f"RELIC · {name}",
                            "description": description + " Lasts for this run; uses no weapon slot."})
        choice_count = 4 if len(self.loadout) < MAX_WEAPONS else 3
        choices.extend(self.rng.sample(pool, min(choice_count - len(choices), len(pool))))
        self.offers = choices

    def _spawn(self):
        self.serial += 1
        side = self.rng.randrange(4)
        x = self.rng.uniform(self.left + 25, self.right - 25)
        y = self.rng.uniform(self.bottom + 25, self.top - 25)
        if side < 2:
            x = (self.left + 18, self.right - 18)[side]
        else:
            y = (self.bottom + 18, self.top - 18)[side - 2]
        # Avoid spawning on Cubie if they are hugging an edge.
        if math.hypot(x - self.x, y - self.y) < 110:
            x = self.left + 50 if self.x >= 0 else self.right - 50
            y = self.bottom + 45 if self.y >= 0 else self.top - 45
        kind = ("boss" if self.wave == 20 else "elite") if self.spawned == 0 and self.wave % 5 == 0 else self.rng.choice(
            ["chaser", "chaser", "runner"] + (["tank"] if self.wave >= 4 else []) + (["shooter"] if self.wave >= 7 else [])
            + (["flanker"] if self.wave >= 6 else []) + (["flanker", "shooter"] if self.level >= 6 and self.wave >= 4 else []))
        hp, speed, radius = {"chaser": (9, 42, 11), "runner": (6, 75, 8), "tank": (25, 28, 17),
                             "shooter": (12, 30, 12), "flanker": (14, 95, 10),
                             "elite": (80, 36, 24), "boss": (350, 32, 34)}[kind]
        hp *= 1 + (self.level - 1) * .18 + (self.wave - 1) * .035
        speed *= 1 + (self.level - 1) * .025
        hp *= {"swarm": .85, "armored": 1.2, "frenzy": .9}[self.anomaly]
        speed *= {"swarm": 1, "armored": .9, "frenzy": 1.15}[self.anomaly]
        self.enemies.append(Enemy(self.serial, x, y, hp, speed, radius, kind, hp))
        self.spawned += 1

    def _update_zones(self, dt):
        if self.break_left <= 0 and self.wave >= 3:
            self.zone_in -= dt
            if self.zone_in <= 0:
                queue_pattern(self)
                self.zone_in = max(4.5, 13 - self.level*.6)
        for zone in self.zones:
            if zone["warning"] > 0:
                zone["warning"] = max(0, zone["warning"]-dt)
            else:
                zone["active"] -= dt
                if contains(zone, self.x, self.y, 10):
                    self._damage(zone["damage"])
        self.zones = [z for z in self.zones if z["active"] > 0]

    def _enemy_skill(self, enemy, dt):
        """Visible windups lock in a charge direction; enemies cannot turn mid-charge."""
        if enemy.frozen or enemy.hp <= 0:
            return False
        if enemy.windup > 0:
            enemy.windup = max(0, enemy.windup-dt)
            if enemy.windup == 0:
                dx, dy = enemy.dash_target[0]-enemy.x, enemy.dash_target[1]-enemy.y
                distance = max(1, math.hypot(dx,dy))
                enemy.dash_vector = dx/distance, dy/distance
                enemy.dash_left = min(.85, distance/340)
            return True
        if enemy.dash_left > 0:
            enemy.dash_left = max(0, enemy.dash_left-dt)
            enemy.x = max(self.left+enemy.radius, min(self.right-enemy.radius, enemy.x+enemy.dash_vector[0]*340*dt))
            enemy.y = max(self.bottom+enemy.radius, min(self.top-enemy.radius, enemy.y+enemy.dash_vector[1]*340*dt))
            return True
        enemy.skill_in -= dt
        boss_cast = enemy.kind == "boss" and enemy.skill_in <= 0
        if boss_cast:
            phase = 3 if self.level in (10,20) and enemy.hp < enemy.max_hp*.25 else 2 if enemy.hp < enemy.max_hp*.5 else 1
            queue_pattern(self, boss=True, phase=phase)
            enemy.skill_in = 5.0 - phase*.6
        charge = (enemy.kind in ("runner", "flanker") and self.wave >= 4) or (enemy.kind=="boss" and self.level in (7,16))
        if charge and (boss_cast if enemy.kind=="boss" else enemy.skill_in <= 0):
            enemy.dash_target = (max(self.left+20,min(self.right-20,self.x+self.velocity[0]*.4)),
                                 max(self.bottom+20,min(self.top-20,self.y+self.velocity[1]*.4)))
            enemy.windup = .8 if enemy.kind=="boss" else .7
            enemy.skill_in = 5.2 if enemy.kind=="boss" else 4.2 + (enemy.id%3)*.4
            return True
        return False

    def _effect(self, kind, x, y, radius, color, end=None, stars=1):
        self.effects.append({"kind": kind, "x": x, "y": y, "radius": radius,
                             "color": color, "life": .22, "end": end, "stars": stars})
        self.effects = self.effects[-70:]

    def _hurt(self, enemy, amount, traits):
        if enemy.hp <= 0:
            return
        enemy.hp -= amount
        if "slow" in traits:
            enemy.slow = .8 if enemy.kind=="boss" else 2
        if "freeze" in traits and enemy.control_guard <= 0:
            enemy.frozen = .2 if enemy.kind=="boss" else .55
            if enemy.kind=="boss": enemy.control_guard = 1.4
        if "burn" in traits:
            enemy.burn = 2.5
        if "lifesteal" in traits:
            self.lives = min(self.max_lives, self.lives + .35)

    def _hit(self, enemy, shot):
        self._hurt(enemy, shot.damage, shot.traits)
        color = ARMORY[shot.weapon].color
        self._effect("hit", enemy.x, enemy.y, 14, color, stars=shot.stars)
        if "blast" in shot.traits:
            self._effect("ring", enemy.x, enemy.y, 55, color, stars=shot.stars)
            for other in self.enemies:
                if other is not enemy and math.hypot(other.x - enemy.x, other.y - enemy.y) < 55 + other.radius:
                    self._hurt(other, shot.damage * .55, set())
        if "chain" in shot.traits:
            nearby = sorted((e for e in self.enemies if e is not enemy and e.hp > 0), key=lambda e: math.hypot(e.x - enemy.x, e.y - enemy.y))[:3]
            for other in nearby:
                if math.hypot(other.x - enemy.x, other.y - enemy.y) < 125:
                    self._hurt(other, shot.damage * .6, set())
                    self._effect("line", enemy.x, enemy.y, 3, color, (other.x, other.y), shot.stars)
        if "pull" in shot.traits:
            for other in self.enemies:
                if other is not enemy and math.hypot(other.x - enemy.x, other.y - enemy.y) < 120:
                    other.x += (enemy.x - other.x) * .2
                    other.y += (enemy.y - other.y) * .2
        if "split" in shot.traits:
            for angle in (shot.angle - .7, shot.angle, shot.angle + .7):
                self._add_shot(Shot(enemy.x, enemy.y, math.cos(angle) * 280, math.sin(angle) * 280,
                                    shot.damage * .45, shot.weapon, shot.stars, {"pierce"}, ttl=.65, angle=angle))

    def _add_shot(self, shot):
        if len(self.shots) < MAX_SHOTS:
            self.shots.append(shot)

    def companion_position(self, weapon_id):
        companions = [key for key in self.loadout if ARMORY[key].automatic]
        angle = self.elapsed * 1.8 + math.tau * companions.index(weapon_id) / len(companions)
        return self.x + math.cos(angle) * 44, self.y + math.sin(angle) * 36

    def fire(self, weapon_id=None):
        weapon_id = weapon_id or self.weapon
        weapon = ARMORY[weapon_id]
        stars = self.loadout[weapon_id]
        origin_x, origin_y = self.companion_position(weapon_id) if weapon.automatic else (self.x, self.y)
        target = None if weapon.automatic else self.aim
        if target is None:
            nearest = min((e for e in self.enemies if e.hp > 0), key=lambda e: math.hypot(e.x - origin_x, e.y - origin_y), default=None)
            target = (nearest.x, nearest.y) if nearest else (self.x + self.face[0] * 200, self.y + self.face[1] * 200)
        angle = math.atan2(target[1] - origin_y, target[0] - origin_x)
        damage = weapon.damage * (1 + (stars - 1) * .38) * self.damage_multiplier
        traits = weapon.traits(stars)
        if "siphon" in self.relics:
            traits.add("lifesteal")
        if "winter" in self.relics:
            traits.add("slow")
        self.shots_fired += 1
        self.cooldowns[weapon_id] = weapon.interval / (1 + (stars - 1) * .12)
        count = weapon.count + (1 if "echo" in self.relics else 0)
        for i in range(count):
            a = angle + (i - (count - 1) / 2) * .17
            if weapon.kind in ("ring", "orbit"):
                a = angle + i * math.tau / count
            shot = Shot(origin_x, origin_y, math.cos(a) * 310, math.sin(a) * 310,
                        damage, weapon.id, stars, traits.copy(), "bolt" if weapon.kind == "drone" else weapon.kind, angle=a)
            if weapon.kind == "beam":
                end = origin_x + math.cos(a) * 750, origin_y + math.sin(a) * 750
                self._effect("line", origin_x, origin_y, 3 + stars, weapon.color, end, stars)
                for enemy in self.enemies[:]:
                    dx, dy = enemy.x - origin_x, enemy.y - origin_y
                    along = dx * math.cos(a) + dy * math.sin(a)
                    cross = abs(dx * math.sin(a) - dy * math.cos(a))
                    if 0 <= along <= 750 and cross < enemy.radius + 5:
                        self._hit(enemy, shot)
            elif weapon.kind == "nova":
                radius = 95 + stars * 12
                self._effect("ring", origin_x, origin_y, radius, weapon.color, stars=stars)
                for enemy in self.enemies[:]:
                    if math.hypot(enemy.x - origin_x, enemy.y - origin_y) <= radius + enemy.radius:
                        self._hit(enemy, shot)
            else:
                if weapon.kind == "mine":
                    distance = min(170, math.hypot(target[0] - origin_x, target[1] - origin_y))
                    shot.x += math.cos(a) * distance
                    shot.y += math.sin(a) * distance
                    shot.vx = shot.vy = 0
                    shot.ttl = 3
                elif weapon.kind == "boomerang":
                    shot.traits.add("return")
                    shot.traits.add("pierce")
                elif weapon.kind == "orbit":
                    shot.ttl = 1.6
                self._add_shot(shot)

    def _update_shots(self, dt):
        for shot in self.shots[:]:
            shot.age += dt
            if shot.kind == "orbit":
                a = shot.angle + shot.age * 4
                radius = 65 + shot.stars * 8
                shot.x, shot.y = self.x + math.cos(a) * radius, self.y + math.sin(a) * radius
            elif shot.kind != "mine":
                target = None
                if "return" in shot.traits and shot.age > .55:
                    target = (self.x, self.y)
                elif "homing" in shot.traits:
                    enemy = min((e for e in self.enemies if e.hp > 0 and e.id not in shot.hits),
                                key=lambda e: math.hypot(e.x - shot.x, e.y - shot.y), default=None)
                    if enemy:
                        target = enemy.x, enemy.y
                if target:
                    a = math.atan2(target[1] - shot.y, target[0] - shot.x)
                    shot.vx, shot.vy = math.cos(a) * 310, math.sin(a) * 310
                shot.x += shot.vx * dt
                shot.y += shot.vy * dt
                if "ricochet" in shot.traits and shot.bounces < 4:
                    if not self.left < shot.x < self.right:
                        shot.vx *= -1
                        shot.x = max(self.left, min(self.right, shot.x))
                        shot.bounces += 1
                    if not self.bottom < shot.y < self.top:
                        shot.vy *= -1
                        shot.y = max(self.bottom, min(self.top, shot.y))
                        shot.bounces += 1
            for enemy in self.enemies[:]:
                if enemy.hp <= 0 or enemy.id in shot.hits:
                    continue
                reach = 45 if shot.kind == "mine" else 7
                if math.hypot(enemy.x - shot.x, enemy.y - shot.y) < enemy.radius + reach:
                    self._hit(enemy, shot)
                    shot.hits.add(enemy.id)
                    if shot.kind != "orbit" and ("pierce" not in shot.traits or len(shot.hits) >= 4):
                        shot.age = shot.ttl
                        break
        self.shots = [s for s in self.shots if s.age < s.ttl
                      and self.left - 70 < s.x < self.right + 70
                      and self.bottom - 65 < s.y < self.top + 65]

    def _damage(self, amount):
        if self.invulnerable or not self.alive:
            return
        self.lives = max(0, self.lives - amount)
        self.damage_taken += amount
        self.invulnerable = .8
        if self.lives == 0:
            self.alive = False
            self.death_message = f"Wave {self.wave}/20 · {self.kills} shapes defeated. Pick a new build and try again."

    def update(self, dt, keys, aim=None):
        if self.offers or not self.alive or self.won:
            return
        dt = max(0, min(dt, .05))
        self.elapsed += dt
        self.aim = aim
        self.invulnerable = max(0, self.invulnerable - dt)
        for weapon_id in self.cooldowns:
            self.cooldowns[weapon_id] = max(0, self.cooldowns[weapon_id] - dt)
        for effect in self.effects:
            effect["life"] -= dt
        self.effects = [e for e in self.effects if e["life"] > 0]
        dx, dy = int("Right" in keys) - int("Left" in keys), int("Up" in keys) - int("Down" in keys)
        length = math.hypot(dx, dy)
        old_x, old_y = self.x, self.y
        slowed = any(z["slow"] and z["warning"] <= 0 and contains(z,self.x,self.y) for z in self.zones)
        movement_speed = self.speed * (.65 if slowed else 1)
        if length:
            self.face = dx / length, dy / length
            self.x = max(self.left + 15, min(self.right - 15, self.x + self.face[0] * movement_speed * dt))
            self.y = max(self.bottom + 15, min(self.top - 15, self.y + self.face[1] * movement_speed * dt))
        self.velocity = ((self.x-old_x)/dt, (self.y-old_y)/dt) if dt else (0,0)
        self._update_zones(dt)
        if not self.alive:
            return
        for weapon_id in self.loadout:
            automatic = ARMORY[weapon_id].automatic
            trigger = bool(self.enemies) if automatic else "f" in keys
            if trigger and self.cooldowns[weapon_id] <= 0:
                self.fire(weapon_id)
        if self.break_left > 0:
            self.break_left = max(0, self.break_left - dt)
        else:
            self.spawn_in -= dt
            if self.spawned < self.quota and len(self.enemies) < MAX_ENEMIES and self.spawn_in <= 0:
                self._spawn()
                self.spawn_in = max(.18, .75 - self.wave * .018 - self.level * .02)
        for enemy in self.enemies:
            if enemy.burn > 0:
                enemy.hp -= dt * 3
            enemy.burn = max(0, enemy.burn - dt)
            enemy.slow = max(0, enemy.slow - dt)
            enemy.frozen = max(0, enemy.frozen - dt)
            enemy.control_guard = max(0, enemy.control_guard - dt)
            if enemy.hp <= 0:
                continue
            distance = math.hypot(self.x - enemy.x, self.y - enemy.y)
            speed = 0 if enemy.frozen else enemy.speed * (.45 if enemy.slow else 1)
            using_skill = self._enemy_skill(enemy, dt)
            if not using_skill and distance and (enemy.kind != "shooter" or distance > 200):
                target_x, target_y = self.x, self.y
                if enemy.kind == "flanker":
                    target_x += self.velocity[0]*.65
                    target_y += self.velocity[1]*.65
                heading = math.atan2(target_y-enemy.y, target_x-enemy.x)
                enemy.x += math.cos(heading) * speed * dt
                enemy.y += math.sin(heading) * speed * dt
                enemy.x = max(self.left+enemy.radius,min(self.right-enemy.radius,enemy.x))
                enemy.y = max(self.bottom+enemy.radius,min(self.top-enemy.radius,enemy.y))
            distance = math.hypot(self.x-enemy.x,self.y-enemy.y)
            if distance < enemy.radius + 13:
                self._damage(24 if enemy.kind in ("elite", "boss") else 15)
            if enemy.kind in ("shooter", "elite", "boss") and not enemy.frozen:
                enemy.attack_in -= dt
                if enemy.attack_in <= 0:
                    enemy.attack_in = 2.6 if enemy.kind != "boss" else 2.0
                    a = math.atan2(self.y + self.velocity[1]*.5 - enemy.y, self.x + self.velocity[0]*.5 - enemy.x)
                    phase2 = enemy.kind=="boss" and enemy.hp < enemy.max_hp*.5
                    offsets = (-.3, 0, .3) if enemy.kind == "boss" or self.level >= 6 else (0,)
                    if enemy.kind=="boss" and self.level in (4,5,9,10,11,15,18,20):
                        count = 14 if phase2 else 10
                        offsets = tuple(i*math.tau/count+self.elapsed*.2-a for i in range(count))
                    elif phase2:
                        offsets = (-.5,-.25,0,.25,.5)
                    for offset in offsets:
                        if len(self.hazards) < 70:
                            velocity = 155+self.level*4
                            self.hazards.append([enemy.x, enemy.y, math.cos(a + offset) * velocity, math.sin(a + offset) * velocity, 5.0])
        if not self.alive:
            return
        self._update_shots(dt)
        for hazard in self.hazards:
            hazard[0] += hazard[2] * dt
            hazard[1] += hazard[3] * dt
            hazard[4] -= dt
            if math.hypot(hazard[0] - self.x, hazard[1] - self.y) < 18:
                self._damage(12)
                hazard[4] = 0
        self.hazards = [h for h in self.hazards if h[4] > 0
                        and self.left - 30 < h[0] < self.right + 30
                        and self.bottom - 25 < h[1] < self.top + 25]
        if not self.alive:
            return
        for enemy in self.enemies:
            if enemy.hp <= 0:
                self.kills += 1
                self.score += 10 + (50 if enemy.kind in ("elite", "boss") else 0)
                value = 16 if enemy.kind in ("elite", "boss") else 3
                if len(self.gems) < MAX_GEMS:
                    self.gems.append([enemy.x, enemy.y, value])
                else:
                    self.gems[-1][2] += value
        self.enemies = [e for e in self.enemies if e.hp > 0]
        for gem in self.gems:
            distance = math.hypot(gem[0] - self.x, gem[1] - self.y)
            if distance < self.magnet:
                if distance < 20:
                    self.xp += gem[2]
                    gem[2] = 0
                else:
                    gem[0] += (self.x - gem[0]) / distance * min(distance, dt * 290)
                    gem[1] += (self.y - gem[1]) / distance * min(distance, dt * 290)
        self.gems = [g for g in self.gems if g[2]]
        if self.spawned >= self.quota and not self.enemies:
            self.cleared += 1
            self.score += 100 * self.level
            self.xp += sum(g[2] for g in self.gems)
            self.gems.clear()
            self.shots.clear()
            self.hazards.clear()
            self.zones.clear()
            self.zone_in = 5.0
            self.lives = min(self.max_lives, self.lives + 8)
            if self.wave == WAVES:
                self.won = True
            else:
                self.wave += 1
                self.spawned, self.spawn_in, self.break_left = 0, 0, 2.5
        self._offer_upgrade()

    def snapshot(self, paused=False, *, compact=False, include_background=True):
        """Browser snapshots send shape instances and a separately cached backdrop."""
        from geomayhem_view import draw_geomayhem
        weapon = ARMORY[self.weapon].info(self.stars)
        boss = next((e for e in self.enemies if e.kind=="boss" and e.hp>0), None)
        result = {"mode": "geomayhem", "difficulty": f"level_{self.level}", "paused": paused,
                "over": not self.alive or self.won, "won": self.won, "dying": False,
                "score": self.score, "lives": round(self.lives, 1), "max_lives": self.max_lives,
                "hp": None, "max_hp": None, "elapsed": int(self.elapsed), "fight_elapsed": self.elapsed,
                "can_pause": self.alive and not self.won and not self.offers,
                "bounds": [self.left, self.right, self.bottom, self.top], "sounds": [],
                "commands": draw_geomayhem(self, compact=compact, include_background=include_background and not compact), "player": {"x": self.x, "y": self.y, "visible": self.alive},
                "level": self.level, "total_levels": len(LEVELS), "level_name": LEVELS[self.level - 1][0], "wave": self.wave,
                "cleared": self.cleared, "rank": self.rank, "xp": self.xp, "xp_needed": self.xp_needed,
                "kills": self.kills, "weapon": weapon, "offers": self.offers,
                "geo_level": self.level, "geo_kills": self.kills, "geo_waves": self.cleared,
                "geo_rank": self.rank, "geo_weapon_count": len(self.loadout),
                "geo_max_stars": max(self.loadout.values()),
                "geo_five_star_count": sum(stars == 5 for stars in self.loadout.values()),
                "geo_relic_count": len(self.relics),
                "pending_levelups": self.pending_levelups,
                "arena": {"hazard": ARENAS[self.level-1][3], "boss": ARENAS[self.level-1][4]},
                "boss": {"name": ARENAS[self.level-1][4], "hp": round(boss.hp), "max_hp": round(boss.max_hp),
                         "phase": 3 if self.level in (10,20) and boss.hp<boss.max_hp*.25 else 2 if boss.hp<boss.max_hp*.5 else 1} if boss else None,
                "threats": [{"x": e.x, "y": e.y} for e in self.enemies if e.hp>0],
                "loadout": [ARMORY[key].info(stars) for key, stars in self.loadout.items()],
                "weapon_slots": MAX_WEAPONS,
                "anomaly": {"name": ANOMALIES[self.anomaly][0], "description": ANOMALIES[self.anomaly][1]},
                "relics": [{"name": RELICS[key][0], "description": RELICS[key][1]} for key in sorted(self.relics)],
                "rerolls": self.rerolls,
                "face": self.face, "shots_fired": self.shots_fired, "damage_taken": self.damage_taken,
                "death_message": self.death_message,
                "label": f"Level {self.level}/{len(LEVELS)} · Wave {self.wave}/20 · " +
                         (f"Next wave in {self.break_left:.1f}s" if self.break_left > 0 else "WASD / arrows move · Hold left click to fire · R pauses")}

        if compact and include_background:
            result["background"] = draw_geomayhem(self, compact=True, background_only=True)
        return result


def catalog():
    return {"levels": [{"id": f"level_{i}", "name": name, "color": color,
                        "hazard": ARENAS[i-1][3], "boss": ARENAS[i-1][4]} for i, (name, color) in enumerate(LEVELS, 1)],
            "weapons": [weapon.info() for weapon in WEAPONS]}
