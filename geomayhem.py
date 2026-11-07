"""Display-independent Geomayhem prototype: 10 arenas, 20 waves, 32 weapons."""
from dataclasses import dataclass, field
import math
import random

from geomayhem_weapons import ARMORY, WEAPONS

LEVELS = (
    ("Mint Circuit", "#71f5d2"), ("Amber Foundry", "#ffba69"),
    ("Violet Array", "#b695ff"), ("Glacier Grid", "#a9edff"),
    ("Rose Reactor", "#ff8fa5"), ("Volt Vault", "#f9ff72"),
    ("Cinder City", "#ff7968"), ("Lunar Labyrinth", "#becaff"),
    ("Prism Rift", "#ff9ed9"), ("Mayhem Core", "#ffffff"),
)
WAVES = 20
MAX_ENEMIES, MAX_SHOTS, MAX_GEMS = 60, 100, 100


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
    left, right, bottom, top = -310, 310, -235, 235

    def __init__(self, level=1, weapon="needle", rng=None):
        if not isinstance(level, int) or not 1 <= level <= len(LEVELS):
            raise ValueError("Choose a level from 1 to 10")
        if weapon not in ARMORY:
            raise ValueError("Unknown Geomayhem weapon")
        self.rng = rng or random.Random()
        self.level, self.wave, self.cleared = level, 1, 0
        self.accent = LEVELS[level - 1][1]
        self.x = self.y = 0.0
        self.face = (0.0, -1.0)
        self.lives = self.max_lives = 100.0
        self.alive, self.won = True, False
        self.elapsed, self.invulnerable, self.damage_taken = 0.0, 0.0, 0.0
        self.rank, self.xp, self.kills, self.score = 1, 0, 0, 0
        self.speed, self.magnet = 175, 52
        self.weapon, self.stars = weapon, 1
        self.upgrades = {"boots": 0, "magnet": 0, "heart": 0}
        self.offers = []
        self.enemies, self.shots, self.gems, self.effects, self.hazards = [], [], [], [], []
        self.serial, self.shots_fired = 0, 0
        self.fire_in, self.spawn_in, self.break_left = 0, .6, 2.0
        self.spawned = 0
        self.aim = None
        self.death_message = ""

    @property
    def xp_needed(self):
        return 8 + (self.rank - 1) * 5

    @property
    def quota(self):
        return 6 + self.wave * 2 + self.level

    def choose(self, choice):
        if not self.alive or self.won or choice not in {offer["id"] for offer in self.offers}:
            return False
        if choice == "weapon":
            self.stars = min(5, self.stars + 1)
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

    def _offer_upgrade(self):
        if self.offers or self.xp < self.xp_needed or self.won or not self.alive:
            return
        self.xp -= self.xp_needed
        self.rank += 1
        choices = []
        if self.stars < 5:
            weapon = ARMORY[self.weapon]
            next_star = self.stars + 1
            detail = weapon.info(next_star)["third" if next_star == 3 else "fifth"] if next_star in (3, 5) else "More damage and faster firing."
            choices.append({"id": "weapon", "name": f"{weapon.name} · {next_star} stars", "description": detail})
        pool = [{"id": key, "name": name, "description": text} for key, name, text in (
            ("boots", "Quick Steps", "+16 movement speed. Keep moving."),
            ("magnet", "Gem Magnet", "+24 XP pickup range."),
            ("heart", "Cubie Armor", "+20 maximum health; restore 30 health."),
        ) if self.upgrades[key] < 5]
        pool.append({"id": "repair", "name": "Patch Up", "description": "Restore 35 health."})
        choices.extend(self.rng.sample(pool, min(3 - len(choices), len(pool))))
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
        # Avoid spawning on Cubie if he is hugging an edge.
        if math.hypot(x - self.x, y - self.y) < 110:
            x, y = (-260 if self.x >= 0 else 260), (-190 if self.y >= 0 else 190)
        kind = ("boss" if self.wave == 20 else "elite") if self.spawned == 0 and self.wave % 5 == 0 else self.rng.choice(
            ["chaser", "chaser", "runner"] + (["tank"] if self.wave >= 4 else []) + (["shooter"] if self.wave >= 7 else []))
        hp, speed, radius = {"chaser": (9, 42, 11), "runner": (6, 75, 8), "tank": (25, 28, 17),
                             "shooter": (12, 30, 12), "elite": (80, 36, 24), "boss": (250, 26, 34)}[kind]
        hp *= 1 + (self.level - 1) * .18 + (self.wave - 1) * .035
        speed *= 1 + (self.level - 1) * .025
        self.enemies.append(Enemy(self.serial, x, y, hp, speed, radius, kind, hp))
        self.spawned += 1

    def _effect(self, kind, x, y, radius, color, end=None, stars=1):
        self.effects.append({"kind": kind, "x": x, "y": y, "radius": radius,
                             "color": color, "life": .22, "end": end, "stars": stars})
        self.effects = self.effects[-70:]

    def _hurt(self, enemy, amount, traits):
        if enemy.hp <= 0:
            return
        enemy.hp -= amount
        if "slow" in traits:
            enemy.slow = 2
        if "freeze" in traits:
            enemy.frozen = .55
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

    def fire(self):
        weapon = ARMORY[self.weapon]
        target = self.aim
        if target is None:
            nearest = min(self.enemies, key=lambda e: math.hypot(e.x - self.x, e.y - self.y), default=None)
            target = (nearest.x, nearest.y) if nearest else (self.x + self.face[0] * 200, self.y + self.face[1] * 200)
        angle = math.atan2(target[1] - self.y, target[0] - self.x)
        damage = weapon.damage * (1 + (self.stars - 1) * .38)
        traits = weapon.traits(self.stars)
        self.shots_fired += 1
        self.fire_in = weapon.interval / (1 + (self.stars - 1) * .12)
        for i in range(weapon.count):
            a = angle + (i - (weapon.count - 1) / 2) * .17
            if weapon.kind in ("ring", "orbit"):
                a = angle + i * math.tau / weapon.count
            shot = Shot(self.x, self.y, math.cos(a) * 310, math.sin(a) * 310,
                        damage, weapon.id, self.stars, traits.copy(), weapon.kind, angle=a)
            if weapon.kind == "beam":
                end = self.x + math.cos(a) * 750, self.y + math.sin(a) * 750
                self._effect("line", self.x, self.y, 3 + self.stars, weapon.color, end, self.stars)
                for enemy in self.enemies[:]:
                    dx, dy = enemy.x - self.x, enemy.y - self.y
                    along = dx * math.cos(a) + dy * math.sin(a)
                    cross = abs(dx * math.sin(a) - dy * math.cos(a))
                    if 0 <= along <= 750 and cross < enemy.radius + 5:
                        self._hit(enemy, shot)
            elif weapon.kind == "nova":
                radius = 95 + self.stars * 12
                self._effect("ring", self.x, self.y, radius, weapon.color, stars=self.stars)
                for enemy in self.enemies[:]:
                    if math.hypot(enemy.x - self.x, enemy.y - self.y) <= radius + enemy.radius:
                        self._hit(enemy, shot)
            else:
                if weapon.kind == "mine":
                    distance = min(170, math.hypot(target[0] - self.x, target[1] - self.y))
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
        self.shots = [s for s in self.shots if s.age < s.ttl and abs(s.x) < 380 and abs(s.y) < 300]

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
        self.fire_in = max(0, self.fire_in - dt)
        for effect in self.effects:
            effect["life"] -= dt
        self.effects = [e for e in self.effects if e["life"] > 0]
        dx, dy = int("Right" in keys) - int("Left" in keys), int("Up" in keys) - int("Down" in keys)
        length = math.hypot(dx, dy)
        if length:
            self.face = dx / length, dy / length
            self.x = max(self.left + 15, min(self.right - 15, self.x + self.face[0] * self.speed * dt))
            self.y = max(self.bottom + 15, min(self.top - 15, self.y + self.face[1] * self.speed * dt))
        if "f" in keys and self.fire_in <= 0:
            self.fire()
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
            if enemy.hp <= 0:
                continue
            distance = math.hypot(self.x - enemy.x, self.y - enemy.y)
            speed = 0 if enemy.frozen else enemy.speed * (.45 if enemy.slow else 1)
            if distance and (enemy.kind != "shooter" or distance > 150):
                enemy.x += (self.x - enemy.x) / distance * speed * dt
                enemy.y += (self.y - enemy.y) / distance * speed * dt
            if distance < enemy.radius + 13:
                self._damage(16 if enemy.kind in ("elite", "boss") else 10)
            if enemy.kind in ("shooter", "elite", "boss") and not enemy.frozen:
                enemy.attack_in -= dt
                if enemy.attack_in <= 0:
                    enemy.attack_in = 2.5 if enemy.kind != "boss" else 1.4
                    a = math.atan2(self.y - enemy.y, self.x - enemy.x)
                    for offset in ((-.3, 0, .3) if enemy.kind == "boss" else (0,)):
                        if len(self.hazards) < 70:
                            self.hazards.append([enemy.x, enemy.y, math.cos(a + offset) * 125, math.sin(a + offset) * 125, 5.0])
        if not self.alive:
            return
        self._update_shots(dt)
        for hazard in self.hazards:
            hazard[0] += hazard[2] * dt
            hazard[1] += hazard[3] * dt
            hazard[4] -= dt
            if math.hypot(hazard[0] - self.x, hazard[1] - self.y) < 18:
                self._damage(8)
                hazard[4] = 0
        self.hazards = [h for h in self.hazards if h[4] > 0 and abs(h[0]) < 340 and abs(h[1]) < 260]
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
            self.lives = min(self.max_lives, self.lives + 8)
            if self.wave == WAVES:
                self.won = True
            else:
                self.wave += 1
                self.spawned, self.spawn_in, self.break_left = 0, 0, 2.5
        self._offer_upgrade()

    def snapshot(self, paused=False):
        from geomayhem_view import draw_geomayhem
        weapon = ARMORY[self.weapon].info(self.stars)
        return {"mode": "geomayhem", "difficulty": f"level_{self.level}", "paused": paused,
                "over": not self.alive or self.won, "won": self.won, "dying": False,
                "score": self.score, "lives": round(self.lives, 1), "max_lives": self.max_lives,
                "hp": None, "max_hp": None, "elapsed": int(self.elapsed), "fight_elapsed": self.elapsed,
                "can_pause": self.alive and not self.won and not self.offers,
                "bounds": [self.left, self.right, self.bottom, self.top], "sounds": [],
                "commands": draw_geomayhem(self), "player": {"x": self.x, "y": self.y, "visible": self.alive},
                "level": self.level, "level_name": LEVELS[self.level - 1][0], "wave": self.wave,
                "cleared": self.cleared, "rank": self.rank, "xp": self.xp, "xp_needed": self.xp_needed,
                "kills": self.kills, "weapon": weapon, "offers": self.offers,
                "face": self.face, "shots_fired": self.shots_fired, "damage_taken": self.damage_taken,
                "death_message": self.death_message,
                "label": f"Level {self.level}/10 · Wave {self.wave}/20 · " +
                         (f"Next wave in {self.break_left:.1f}s" if self.break_left > 0 else "Arrows move · Hold left click to fire · D pauses")}


def catalog():
    return {"levels": [{"id": f"level_{i}", "name": name, "color": color} for i, (name, color) in enumerate(LEVELS, 1)],
            "weapons": [weapon.info() for weapon in WEAPONS]}
