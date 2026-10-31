"""Impossible Phase 2: deterministic combat timing, independent of graphics."""

from collections import deque
from dataclasses import dataclass
import math

from boss_crush import (BossCrush, BossDifficulty, Projectile, HealingPickup,
                        hits_player, SHOT_WIDTH, SHOT_HEIGHT)
from dodge_model import PLAYER_LEFT, PLAYER_RIGHT, PLAYER_BOTTOM, PLAYER_TOP

MODE = "phase2"
KING_WIDTH, KING_HEIGHT = 100, 80
SLAM_ORDER = ("left", "right", "left", "right", "right", "both")
RAISE_TIME, SLAM_TIME, SLAM_REST = 0.5, 0.15, 0.15  # 0.8s between impacts.
ATTACK_BREAK = 1.0
COLOR_BREAK = 0.75
EYE_FLASH_COUNT = 6
EYE_FLASH_ON = 0.8
EYE_FLASH_GAP = 0.2
EYE_FLASH_PERIOD = EYE_FLASH_ON + EYE_FLASH_GAP
COUNTER_WINDOW, COUNTER_COOLDOWN, COUNTER_RANGE = 0.16, 0.65, 38
HEAL_EVERY, HEAL_LASTS = 16, 9
RING_SEGMENTS, RING_THICKNESS = 160, 12
RING_FALL_SPEED, RING_GAP = 145, 48
ATTACK_NAMES = ("COLOR MEMORY", "BONE GAUNTLET", "ROTATING RINGS",
                "MAGENTA FINGERS — tap E at impact", "CHAOS", "ROYAL SLAMS")


@dataclass(frozen=True)
class Stage:
    name: str
    duration: float
    side: str = ""


@dataclass
class Finger(Projectile):
    age: float = 0


@dataclass
class Ring:
    x: float
    y: float
    angle: float
    rule: str
    radius: float = 280
    vertical_radius: float = 220

    def pieces(self):
        # Opposite colored quarters rotate around a nearly arena-sized ellipse.
        opposite = "orange" if self.rule == "blue" else "blue"
        quarter = RING_SEGMENTS // 4
        for i in range(RING_SEGMENTS):
            angle = self.angle + math.tau * i / RING_SEGMENTS
            side = ((i + quarter // 2) // quarter) % 4
            rule = self.rule if side == 0 else opposite if side == 2 else "normal"
            yield (self.x + math.cos(angle) * self.radius,
                   self.y + math.sin(angle) * self.vertical_radius,
                   RING_THICKNESS, RING_THICKNESS, rule)


def slam_stages():
    stages = []
    for side in SLAM_ORDER:
        stages.extend((Stage("raise", RAISE_TIME, side), Stage("slam", SLAM_TIME, side),
                       Stage("slam_rest", SLAM_REST, side)))
    return stages + [Stage("roar", 0.3), Stage("fire", 0.65)]


class PumpkinKing(BossCrush):
    def __init__(self, rng=None):
        super().__init__("impossible", rng)
        self.difficulty = MODE
        self.config = BossDifficulty(1400, 220, 0.3, 14, 0, "#fff2bd", player_hp=5)
        self.hp = 1400
        self.max_lives = self.lives = 5
        self.boss_x, self.boss_y = 0.0, 130.0
        self.heal_in = HEAL_EVERY
        self.rings = []
        self.counter_time = self.counter_cooldown = 0.0
        self.counter_held = False
        self.counter_hits = 0
        self.sound_events = []
        self.intro_done = False
        self.attack_index = -1
        self.sequence = []
        self.spawn_in = 0.0
        self.queue = deque([
            Stage("shell", 0.8), Stage("glow", 1.0), Stage("left_burst", 0.9),
            Stage("right_burst", 0.9), Stage("shatter", 1.1), Stage("roar", 0.6),
            Stage("fire", 0.65), Stage("slam_rest", 0.2), *slam_stages(),
            Stage("title", 2.0), Stage("laugh", 0.8), Stage("break", ATTACK_BREAK),
        ])
        self.stage = self.queue.popleft()
        self.stage_age = 0.0

    @property
    def transformed(self):
        return self.intro_done or self.stage.name not in ("shell", "glow", "left_burst", "right_burst")

    @property
    def screen_rule(self):
        return self.stage.side if self.stage.name == "color" else None

    @property
    def eye_rule(self):
        if self.stage.name == "memory":
            index = min(len(self.sequence) - 1, int(self.stage_age / EYE_FLASH_PERIOD))
            return self.sequence[index] if self.stage_age % EYE_FLASH_PERIOD < EYE_FLASH_ON else None
        return self.screen_rule

    @property
    def pattern_label(self):
        name = self.stage.name
        if self.won:
            return "THE KING HAS FALLEN"
        if name == "memory":
            return f"WATCH THE EYES — remember all {EYE_FLASH_COUNT} colors"
        if name == "color":
            return "BLUE: STAND STILL" if self.stage.side == "blue" else "ORANGE: KEEP MOVING"
        if name == "color_gap":
            return "COLOR BREAK — get ready"
        if name == "raise":
            return "BOTH HANDS — MOVE TO CENTER!" if self.stage.side == "both" else f"{self.stage.side.upper()} HAND RISING!"
        if name == "fire":
            return "MOUTH FIRE — GET OUT OF THE CENTER!"
        if name == "break":
            return "BREATHE — next attack in 1 second"
        if name == "fingers":
            close = any(isinstance(b, Finger) and math.hypot(b.x-self.x, b.y-self.y) < 65 for b in self.bullets)
            return "E NOW!" if close else "MAGENTA FINGERS — tap E just before impact"
        if not self.intro_done:
            return "THE AWAKENING" if name in ("shell", "glow", "left_burst", "right_burst", "shatter") else "SURVIVE THE KING'S ARRIVAL"
        return ATTACK_NAMES[self.attack_index]

    def begin_attack(self, index):
        self.intro_done = True
        self.attack_index = index
        self.bullets.clear()
        self.rings.clear()
        if index == 0:
            self.sequence = [self.rng.choice(("blue", "orange")) for _ in range(EYE_FLASH_COUNT)]
            stages = [Stage("memory", EYE_FLASH_COUNT * EYE_FLASH_PERIOD), Stage("recall_ready", 0.6)]
            for i, rule in enumerate(self.sequence):
                stages.append(Stage("color", 0.65, rule))
                if i < len(self.sequence) - 1:
                    stages.append(Stage("color_gap", COLOR_BREAK))
        elif index == 5:
            stages = slam_stages()
        else:
            stages = [Stage(("", "bones", "rings", "fingers", "chaos")[index], (0, 6, 8, 7, 7)[index])]
        self.queue = deque(stages + [Stage("break", ATTACK_BREAK)])
        self._next_stage()

    def _next_stage(self):
        if not self.queue:
            self.begin_attack((self.attack_index + 1) % 6)
            return
        self.stage = self.queue.popleft()
        self.stage_age = 0.0
        if self.stage.name in ("roar", "laugh"):
            self.sound_events.append(self.stage.name)
        if self.stage.name == "slam":
            self.sound_events.append("slam")
        if self.stage.name in ("break", "title"):
            self.bullets.clear()
            self.rings.clear()
        if self.stage.name in ("bones", "rings", "fingers", "chaos", "color"):
            self.spawn_in = 0.0

    def hazard_rectangles(self):
        if self.stage.name == "fire":
            return [(0, -74, 90, 332)]  # Mouth to floor; center is dangerous.
        if self.stage.name == "slam":
            if self.stage.side == "both":
                return [(-170, 0, 260, 480), (170, 0, 260, 480)]
            return [(-150 if self.stage.side == "left" else 150, 0, 300, 480)]
        return []

    def _spawn(self):
        name = self.stage.name
        if name in ("color", "color_gap"):
            from_left = self.rng.choice((True, False))
            self.bullets.append(Projectile(-297 if from_left else 297, self.rng.uniform(-210, 70),
                                          170 if from_left else -170, self.rng.uniform(-25, 25)))
            return 0.45
        if name == "bones":
            gap = self.rng.uniform(-140, 25)
            left = self.volley % 2 == 0
            for y in range(-220, 221, 28):
                if abs(y-gap) > 52:
                    self.bullets.append(Projectile(-309 if left else 309, y, 340 if left else -340, 0,
                                                  width=22, height=26, bone=True))
            self.volley += 1
            return 1.05
        if name == "rings":
            ring = Ring((self.left+self.right)/2, 0, self.rng.uniform(0, math.tau),
                        self.rng.choice(("blue", "orange")))
            ring.y = self.top + ring.vertical_radius + RING_THICKNESS/2
            self.rings.append(ring)
            # Let the full outline pass, plus a clear gap, before the next ring.
            return (2*ring.vertical_radius + RING_THICKNESS + RING_GAP)/RING_FALL_SPEED
        if name == "fingers":
            side = -1 if self.volley % 2 == 0 else 1
            self.bullets.append(Finger(side * 265, 95, -side * 140, -90,
                                       width=12, height=26, rule="magenta"))
            self.volley += 1
            return 0.8
        if name == "chaos":
            for _ in range(5):
                angle = self.rng.uniform(-math.pi, 0)
                speed = self.rng.uniform(130, 260)
                self.bullets.append(Projectile(self.rng.uniform(-260, 260), 225,
                                              math.cos(angle)*speed, math.sin(angle)*speed,
                                              rule=self.rng.choice(("normal",)*6 + ("blue", "orange"))))
            return 0.24
        return 1.0

    def hurt(self):
        if self.invulnerable <= 0:
            self.lives = max(0, self.lives - 1)
            self.invulnerable = 0.65
            self.alive = self.lives > 0

    def update_healing(self, step):
        if not self.alive or self.won:
            return
        kept = []
        for pickup in self.healing_pickups:
            pickup.remaining -= step
            if pickup.remaining <= 1e-9:
                continue
            if hits_player(self.x, self.y, pickup.x, pickup.y, 16, 16):
                self.lives = min(5, self.lives + 1)
            else:
                kept.append(pickup)
        self.healing_pickups = kept
        self.heal_in -= step
        if self.heal_in <= 1e-9:
            self.heal_in += HEAL_EVERY
            self.healing_pickups.append(HealingPickup(self.rng.uniform(-250, 250),
                                                      self.rng.uniform(-200, 30), HEAL_LASTS))

    def update(self, dt, keys):
        if dt <= 1e-9 or not self.alive or self.won:
            return
        # Counter is an edge-triggered input, never an automatic shield when held.
        counter_down = "e" in keys
        if counter_down and not self.counter_held and self.counter_cooldown <= 0:
            self.counter_time = COUNTER_WINDOW
            self.counter_cooldown = COUNTER_COOLDOWN
        self.counter_held = counter_down
        steps = math.ceil(dt * 120)
        step = dt / steps
        for _ in range(steps):
            if not self.alive or self.won:
                break
            self.elapsed += step
            self.hit_flash = max(0, self.hit_flash-step)
            self.invulnerable = max(0, self.invulnerable-step)
            self.counter_time = max(0, self.counter_time-step)
            self.counter_cooldown = max(0, self.counter_cooldown-step)
            dx = int("Right" in keys)-int("Left" in keys)
            dy = int("Up" in keys)-int("Down" in keys)
            length = math.hypot(dx, dy) or 1
            old = self.x, self.y
            self.x = max(self.left-PLAYER_LEFT, min(self.right-PLAYER_RIGHT, self.x+dx/length*260*step))
            self.y = max(self.bottom-PLAYER_BOTTOM, min(self.top-PLAYER_TOP, self.y+dy/length*260*step))
            moving = abs(self.x-old[0]) > 1e-9 or abs(self.y-old[1]) > 1e-9
            self.stage_age += step
            while self.stage_age >= self.stage.duration:
                extra = self.stage_age-self.stage.duration
                self._next_stage()
                self.stage_age = extra

            if self.stage.name in ("bones", "rings", "fingers", "chaos", "color", "color_gap"):
                self.spawn_in -= step
                if self.spawn_in <= 0:
                    self.spawn_in += self._spawn()
            if self.screen_rule == "blue" and moving or self.screen_rule == "orange" and not moving:
                self.hurt()
            for rectangle in self.hazard_rectangles():
                if hits_player(self.x, self.y, *rectangle):
                    self.hurt()
            if self.transformed and hits_player(self.x, self.y, self.boss_x, self.boss_y, KING_WIDTH, KING_HEIGHT):
                self.hurt()

            self.fire_in = max(0, self.fire_in-step)
            if self.intro_done and "f" in keys and self.fire_in <= 0:
                self.shots.append(Projectile(self.x, self.y+PLAYER_TOP+6, 0, 520))
                self.fire_in = 0.18
            shots = []
            for shot in self.shots:
                shot.y += shot.vy*step
                if abs(shot.x-self.boss_x) <= (KING_WIDTH+SHOT_WIDTH)/2 and abs(shot.y-self.boss_y) <= (KING_HEIGHT+SHOT_HEIGHT)/2:
                    self.hp = max(0, self.hp-5)
                    self.hit_flash = 0.12
                elif shot.y < self.top+10:
                    shots.append(shot)
            self.shots = shots
            if self.hp == 0 and self.alive:
                self.won = True
                self.bullets.clear()
                self.rings.clear()
                return

            bullets = []
            for bullet in self.bullets:
                if isinstance(bullet, Finger):
                    bullet.age += step
                    vx, vy = self.x-bullet.x, self.y-bullet.y
                    distance = math.hypot(vx, vy) or 1
                    if self.counter_time > 0 and distance <= COUNTER_RANGE:
                        self.counter_hits += 1
                        continue
                    blend = min(1, step*3.5)
                    bullet.vx += (vx/distance*220-bullet.vx)*blend
                    bullet.vy += (vy/distance*220-bullet.vy)*blend
                    if bullet.age > 5:
                        continue
                bullet.x += bullet.vx*step
                bullet.y += bullet.vy*step
                danger = isinstance(bullet, Finger) or bullet.dangerous(moving)
                if danger and any(hits_player(self.x, self.y, *rect) for rect in bullet.rectangles()):
                    self.hurt()
                    continue
                if self.left-bullet.width/2 <= bullet.x <= self.right+bullet.width/2 and self.bottom-bullet.height/2 <= bullet.y <= self.top+bullet.height/2:
                    bullets.append(bullet)
            self.bullets = bullets
            rings = []
            for ring in self.rings:
                ring.y -= RING_FALL_SPEED*step
                ring.angle += 0.55*step
                for x, y, width, height, rule in ring.pieces():
                    danger = rule == "normal" or rule == "blue" and moving or rule == "orange" and not moving
                    if danger and hits_player(self.x, self.y, x, y, width, height):
                        self.hurt()
                if ring.y+ring.vertical_radius+RING_THICKNESS/2 > self.bottom:
                    rings.append(ring)
            self.rings = rings
            self.update_healing(step)
