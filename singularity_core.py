"""Singularity Core: fifteen deterministic teleport survival protocols."""

from dataclasses import dataclass
import math
import random

from boss_crush import HealingPickup, hits_player
from dodge_model import Difficulty, PLAYER_POLYGON, polygon_touches_rectangle


BOX_CENTER = (0, -70)
BOX_HALF = 150
TELEPORT_DISTANCE = 126
NODES = tuple((x * TELEPORT_DISTANCE, BOX_CENTER[1] + y * TELEPORT_DISTANCE)
              for y in (-1, 0, 1) for x in (-1, 0, 1))
INTRO_DURATION = 2.6
ATTACK_BREAK = .65
HIT_IMMUNITY = .42
LASER_CONTACT = .25
LASER_WHITEN = .65
LASER_IMPLODE = 2.4
LASER_SHATTER = 3.7
LASER_DURATION = 5.4
RAILGUN_WARNING = .72  # An extra 0.4 seconds to read the first protocol's lanes.
HEAL_EVERY_ATTACKS = 3
HEAL_LASTS = 5.0
HEAL_SIZE = 24
POLARITY_SPEED = 1.1 * 1.1
ECHO_STEPS = 4
ECHO_INTERVAL = .86
ECHO_PREVIEW_DURATION = ECHO_STEPS * ECHO_INTERVAL


@dataclass(frozen=True)
class Attack:
    name: str
    duration: float
    interval: float
    hint: str


ATTACKS = (
    Attack("RAILGUN ARRAY", 6, .58, "Read the rail warnings. Jump clear of the firing lanes."),
    Attack("ACCRETION SWEEP", 7, 1.12, "Rotating laser blades. The center is dangerous."),
    Attack("COLLAPSING HORIZONS", 7, 1.28, "Jump across the contracting photon rings."),
    Attack("TARGET LOCK", 7, .44, "Missiles remember your position. Leave each target."),
    Attack("EVENT LATTICE", 7, .68, "The marked nodes will burn. Read the changing grid."),
    Attack("BINARY STARS", 8, 1.02, "Two stars sweep the corners. Jump behind them; watch the center pulses."),
    Attack("GRAVITY GUILLOTINE", 7, .89, "Teleport through the sweeping walls."),
    Attack("PHOTON RAIN", 8, .19 / .9, "Dense falling photons. Keep switching lanes."),
    Attack("CROSSFIRE ENGINE", 7, .65, "Crossed beams erase rows and columns."),
    Attack("DARK MATTER MINES", 7, 1.08, "Three nodes are mined at a time. Find open ground."),
    Attack("POLARITY INVERSION", 7, .76 / POLARITY_SPEED, "Alternate between the center and the edges."),
    Attack("ORBITAL SAWS", 8, 1.03, "Blades sweep edges and corners. Jump into a gap; the center pulses."),
    Attack("ECHO PROTOCOL", ECHO_PREVIEW_DURATION + ECHO_STEPS * ECHO_INTERVAL, ECHO_INTERVAL,
           f"Watch the safe preview on the box, then repeat its {ECHO_STEPS} positions."),
    Attack("LENS FRACTURE", 8, .82, "Three slanted lasers split the box."),
    Attack("TOTAL COLLAPSE", 10, .64, "Rings, tracking blasts, and one safe node. Survive."),
)


@dataclass
class Hazard:
    kind: str
    x: float
    y: float
    size: float
    warning: float = .32
    duration: float = .24
    height: float = 0
    vx: float = 0
    vy: float = 0
    angle: float = 0
    spin: float = 0
    radial_speed: float = 0
    orbit_x: float = 0
    orbit_y: float = 0
    age: float = 0
    harmless: bool = False
    orbit_power: float = 2

    @property
    def active(self):
        return self.warning <= self.age < self.warning + self.duration

    @property
    def position(self):
        if self.kind == "orbit":
            return self.orbit_position(self.angle)
        return self.x, self.y

    def orbit_position(self, angle):
        cosine, sine = math.cos(angle), math.sin(angle)
        # A superellipse keeps the continuous orbit but lets it follow the
        # containment box into its corners. Power 2 is the original ellipse.
        scale = ((abs(cosine) ** self.orbit_power + abs(sine) ** self.orbit_power)
                 ** (1 / self.orbit_power)) if self.orbit_power != 2 else 1
        return (self.x + cosine / scale * self.orbit_x,
                self.y + sine / scale * self.orbit_y)

    def update(self, dt):
        previous = self.age
        self.age += dt
        motion = max(0, min(self.duration, self.age - self.warning)) - max(
            0, min(self.duration, previous - self.warning))
        self.x += self.vx * motion
        self.y += self.vy * motion
        self.angle += self.spin * motion
        self.size = max(0, self.size + self.radial_speed * motion)

    def touches(self, x, y):
        hx, hy = self.position
        if self.kind == "rect":
            return hits_player(x, y, hx, hy, self.size, self.height)
        if self.kind == "beam":
            cosine, sine = math.cos(self.angle), math.sin(self.angle)
            polygon = tuple(((x + px - hx) * cosine + (y + py - hy) * sine,
                             -(x + px - hx) * sine + (y + py - hy) * cosine)
                            for px, py in PLAYER_POLYGON)
            return polygon_touches_rectangle(polygon, -self.size / 2, self.size / 2,
                                              -self.height / 2, self.height / 2)
        # Distance from the center to every edge of the visible turtle polygon.
        polygon = tuple((x + px - hx, y + py - hy) for px, py in PLAYER_POLYGON)
        nearest = float("inf")
        for (ax, ay), (bx, by) in zip(polygon, polygon[1:] + polygon[:1]):
            dx, dy = bx - ax, by - ay
            t = max(0, min(1, -(ax * dx + ay * dy) / (dx * dx + dy * dy)))
            nearest = min(nearest, math.hypot(ax + dx * t, ay + dy * t))
        if polygon_touches_rectangle(polygon, 0, 0, 0, 0):
            nearest = 0
        if self.kind == "ring":
            farthest = max(math.hypot(px, py) for px, py in polygon)
            return nearest <= self.size + self.height / 2 and farthest >= self.size - self.height / 2
        return nearest <= self.size


class SingularityCore:
    def __init__(self, rng=None):
        self.rng = rng or random.Random()
        self.difficulty = "gravitron"
        self.rules = Difficulty()
        self.left, self.right, self.bottom, self.top = self.rules.bounds
        self.x, self.y = BOX_CENTER
        self.boss_x, self.boss_y = 0, 160
        self.max_lives = self.lives = 10
        self.hp = 1
        self.alive = True
        self.won = False
        self.damage_taken = self.healing_collected = 0
        self.invulnerable = self.elapsed = 0.0
        self.stage = "intro"
        self.stage_age = 0.0
        self.attack_index = -1
        self.attacks_completed = 0
        self.hazards = []
        self.healing_pickups = []
        self.sound_events = []
        self.death_message = None
        self.spawn_in = 0.0
        self.beat = 0
        self.memory = []
        self.laser_held = False

    @property
    def shielded(self):
        return self.attacks_completed < len(ATTACKS)

    @property
    def laser_ready(self):
        return self.stage == "exposed" and not self.shielded and self.alive and not self.won

    @property
    def laser_phase(self):
        if self.won:
            return "complete"
        if self.stage != "laser":
            return None
        return ("beam" if self.stage_age < LASER_WHITEN else
                "whitening" if self.stage_age < LASER_IMPLODE else
                "implosion" if self.stage_age < LASER_SHATTER else "shatter")

    @property
    def echo_preview(self):
        return (self.stage == "attack" and self.attack_index == 12
                and self.stage_age < ECHO_PREVIEW_DURATION - 1e-9)

    @property
    def echo_step(self):
        if self.stage != "attack" or self.attack_index != 12:
            return None
        age = self.stage_age if self.echo_preview else self.stage_age - ECHO_PREVIEW_DURATION
        return min(ECHO_STEPS - 1, int((max(0, age) + 1e-9) / ECHO_INTERVAL))

    @property
    def score(self):
        progress = self.attacks_completed
        if self.stage == "attack":
            progress += min(1, self.stage_age / ATTACKS[self.attack_index].duration)
        return int(progress * 1000) + self.lives * 100 + (5000 if self.won else 0)

    @property
    def pattern_label(self):
        if self.won:
            return "SINGULARITY CORE DESTROYED — the event horizon is gone."
        if self.stage == "intro":
            return "Hold arrows to teleport. Release to center. 10 HP. Galactic healing every 3 attacks."
        if self.stage == "exposed":
            return "ALL 15 PROTOCOLS SURVIVED — release F, then press F to fire the annihilation laser!"
        if self.stage == "laser":
            return {"beam": "ANNIHILATION LASER — CONTINUOUS FIRE",
                    "whitening": "EVENT HORIZON OVERLOADING",
                    "implosion": "GRAVITATIONAL IMPLOSION",
                    "shatter": "CONTAINMENT SHATTERED"}[self.laser_phase]
        if self.stage == "break":
            return f"{self.attacks_completed} / 15 COMPLETE · NEXT: {ATTACKS[self.attack_index + 1].name}"
        attack = ATTACKS[self.attack_index]
        if self.attack_index == 12:
            hint = ("SAFE PREVIEW — watch the glowing safe positions on the box."
                    if self.echo_preview else f"YOUR TURN — repeat the {ECHO_STEPS} positions.")
        else:
            hint = attack.hint
        return f"{self.attack_index + 1:02d} / 15 · {attack.name} — {hint}"

    def begin_attack(self, index):
        self.attack_index = index
        self.stage = "attack"
        self.stage_age = self.spawn_in = 0.0
        self.beat = 0
        self.hazards.clear()
        self.sound_events.append("core_protocol")
        if index == 12:
            self.memory = self.rng.sample(range(9), ECHO_STEPS)

    def hurt(self):
        if self.invulnerable > 1e-9 or not self.alive:
            return
        self.lives = max(0, self.lives - 1)
        self.damage_taken += 1
        self.invulnerable = HIT_IMMUNITY
        self.sound_events.append("core_hit")
        self.alive = self.lives > 0
        if not self.alive:
            self.death_message = (f"The Core erased you during protocol {self.attack_index + 1}: "
                                  f"{ATTACKS[self.attack_index].name}. Try a different jump.")

    def spawn_healing(self):
        # A reachable destination away from the turtle makes this a real pickup.
        choices = [node for node in NODES if node != (self.x, self.y)]
        self.healing_pickups.append(HealingPickup(*self.rng.choice(choices), HEAL_LASTS))

    def update_healing(self, dt):
        if not self.alive or self.won:
            return
        remaining = []
        for pickup in self.healing_pickups:
            pickup.remaining -= dt
            if pickup.remaining <= 1e-9:
                continue
            if hits_player(self.x, self.y, pickup.x, pickup.y, HEAL_SIZE, HEAL_SIZE):
                self.lives = min(self.max_lives, self.lives + 1)
                self.healing_collected += 1
                self.sound_events.append("core_heal")
            else:
                remaining.append(pickup)
        self.healing_pickups = remaining

    def _node_blast(self, node, warning=.32, duration=.24, radius=33, harmless=False):
        self.hazards.append(Hazard("circle", *NODES[node], radius, warning, duration,
                                   harmless=harmless))

    def _beam(self, angle, x=0, y=BOX_CENTER[1], warning=.32, duration=.25, spin=0):
        self.hazards.append(Hazard("beam", x, y, 460, warning, duration,
                                   height=27, angle=angle, spin=spin))

    def _ring(self, warning=.32, speed=-178):
        self.hazards.append(Hazard("ring", *BOX_CENTER, 235, warning, 1.34,
                                   height=12, radial_speed=speed))

    def _emit(self):
        i, beat = self.attack_index, self.beat
        cx, cy = BOX_CENTER
        if i == 0:
            offset = (-126, 0, 126)[beat % 3]
            if beat % 2:
                self._beam(0, y=cy + offset, warning=RAILGUN_WARNING)
            else:
                self._beam(math.pi / 2, x=offset, warning=RAILGUN_WARNING)
        elif i == 1:
            self._beam(beat * .77, warning=.36, duration=.86, spin=1.65)
        elif i == 2:
            self._ring()
        elif i == 3:
            self.hazards.append(Hazard("circle", self.x, self.y, 36, .38, .26))
        elif i == 4:
            for node in range(9):
                if (node // 3 + node % 3) % 2 == beat % 2:
                    self._node_blast(node, .34, .25)
        elif i == 5:
            if beat == 0:
                for angle in (0, math.pi):
                    self.hazards.append(Hazard("orbit", cx, cy, 22, .4, 7.4,
                                               angle=angle, spin=2.5, orbit_x=142, orbit_y=124,
                                               orbit_power=8))
            self._node_blast(4, .4, .35, 45)
        elif i == 6:
            horizontal = beat % 2 == 0
            sign = 1 if beat % 4 < 2 else -1
            self.hazards.append(Hazard("rect", -sign * 185 if horizontal else cx,
                                       cy if horizontal else cy - sign * 185,
                                       32 if horizontal else 340, .36, .86,
                                       height=340 if horizontal else 32,
                                       vx=sign * 440 if horizontal else 0,
                                       vy=0 if horizontal else sign * 440))
        elif i == 7:
            for lane in range(3):
                x = -147 + (beat * 41 + lane * 103) % 294
                self.hazards.append(Hazard("circle", x, 114, 7, .25, 1.35,
                                           vx=38 * math.sin(beat), vy=-280))
        elif i == 8:
            offset = (-126, 0, 126)[beat % 3]
            self._beam(0, y=cy + offset, warning=.34)
            self._beam(math.pi / 2, x=-offset, warning=.34)
        elif i == 9:
            for node in self.rng.sample(range(9), 3):
                self._node_blast(node, .46, .72, 37)
        elif i == 10:
            nodes = range(9) if beat % 2 == 0 else (4,)
            for node in nodes:
                if beat % 2 or node != 4:
                    self._node_blast(node, .35 / POLARITY_SPEED, .31 / POLARITY_SPEED, 36)
        elif i == 11:
            if beat == 0:
                for angle in (0, math.pi / 2, math.pi, math.pi * 1.5):
                    self.hazards.append(Hazard("orbit", cx, cy, 19, .4, 7.5,
                                               # The wider route needs more time between blades.
                                               angle=angle, spin=-1.6, orbit_x=128, orbit_y=128,
                                               orbit_power=8))
            self._node_blast(4, .35, .42, 42)
        elif i == 12:
            if beat < 2 * len(self.memory):
                # Demonstrate the exact pattern safely, then replay it at the same tempo.
                preview = beat < len(self.memory)
                safe = self.memory[beat % len(self.memory)]
                for node in range(9):
                    if node != safe:
                        self._node_blast(node, .32, .39, harmless=preview)
        elif i == 13:
            angle = .35 + beat * .43
            for offset in (-90, 0, 90):
                self._beam(angle, x=math.cos(angle + math.pi / 2) * offset,
                           y=cy + math.sin(angle + math.pi / 2) * offset,
                           warning=.38, duration=.34)
        elif i == 14:
            if beat % 3 == 0:
                self._ring(.28, -210)
            elif beat % 3 == 1:
                self.hazards.append(Hazard("circle", self.x, self.y, 43, .34, .30))
            else:
                safe = (beat * 5) % 9
                for node in range(9):
                    if node != safe:
                        self._node_blast(node, .38, .25)
        self.beat += 1

    def _advance(self):
        self.stage_age = 0.0
        self.hazards.clear()
        if self.stage == "intro":
            self.begin_attack(0)
        elif self.stage == "attack":
            self.attacks_completed += 1
            if self.attacks_completed % HEAL_EVERY_ATTACKS == 0:
                self.spawn_healing()
            self.stage = "exposed" if not self.shielded else "break"
            if self.stage == "exposed":
                self.sound_events.append("core_exposed")
        elif self.stage == "break":
            self.begin_attack(self.attack_index + 1)
        elif self.stage == "laser":
            self.hp = 0
            self.won = True
            self.stage = "victory"

    def fire_laser(self):
        if not self.laser_ready:
            return False
        self.stage = "laser"
        self.stage_age = 0
        self.healing_pickups.clear()
        self.sound_events.append("core_laser")
        return True

    def update(self, dt, keys):
        if dt <= 1e-9 or not self.alive or self.won:
            return
        old = self.x, self.y
        if self.stage != "laser":
            self.x = (int("Right" in keys) - int("Left" in keys)) * TELEPORT_DISTANCE
            self.y = BOX_CENTER[1] + (int("Up" in keys) - int("Down" in keys)) * TELEPORT_DISTANCE
        if old != (self.x, self.y):
            self.sound_events.append("core_teleport")
        fire = "f" in keys
        if self.laser_ready and fire and not self.laser_held:
            self.fire_laser()
        self.laser_held = fire
        steps = math.ceil(dt * 120)
        step = dt / steps
        for _ in range(steps):
            if not self.alive or self.won:
                break
            self.elapsed += step
            self.invulnerable = max(0, self.invulnerable - step)
            previous_age = self.stage_age
            self.stage_age += step
            if self.stage == "laser":
                for boundary, sound in ((LASER_IMPLODE, "core_implode"), (LASER_SHATTER, "core_destroyed")):
                    if previous_age < boundary <= self.stage_age:
                        self.sound_events.append(sound)
            duration = (ATTACKS[self.attack_index].duration if self.stage == "attack" else
                        INTRO_DURATION if self.stage == "intro" else
                        ATTACK_BREAK if self.stage == "break" else
                        LASER_DURATION if self.stage == "laser" else math.inf)
            if self.stage_age + 1e-9 >= duration:
                extra = max(0, self.stage_age - duration)
                self._advance()
                self.stage_age = extra
            if self.stage != "attack":
                if self.stage != "laser":
                    self.update_healing(step)
                continue
            self.spawn_in -= step
            if self.spawn_in <= 1e-9:
                self._emit()
                self.spawn_in += ATTACKS[self.attack_index].interval
            kept = []
            for hazard in self.hazards:
                hazard.update(step)
                if hazard.active and not hazard.harmless and hazard.touches(self.x, self.y):
                    self.hurt()
                if hazard.age < hazard.warning + hazard.duration:
                    kept.append(hazard)
            self.hazards = kept
            self.update_healing(step)
