"""Boss Crush combat rules, independent of the Turtle window."""

from dataclasses import dataclass
import math
import random

from dodge_model import (Difficulty, PLAYER_POLYGON, PLAYER_LEFT, PLAYER_RIGHT,
                         PLAYER_BOTTOM, PLAYER_TOP, polygon_touches_rectangle)

BOSS_WIDTH, BOSS_HEIGHT = 72, 42
BULLET_SIZE = 7
SHOT_WIDTH, SHOT_HEIGHT = 4, 12
PATTERNS = ("BONE RAIN — find the gap", "SPIRAL — weave between bullets",
            "BLUE — stand still", "ORANGE — keep moving", "BONE SWEEP — find the gap",
            "BLUE THEN ORANGE — stop, then move!")
PATTERN_WARNING = 0.9
PATTERN_DURATION = 5.4
PAIR_DELAY = 0.3
LUNGE_HP = 200
LUNGE_WARNING = 0.7
LUNGE_SPEED = 900
LUNGE_RECOVERY = 0.25
HEAL_INTERVAL = 15.0
HEAL_LIFETIME = 10.0
HEAL_SIZE = 16
BOSS_HIT_FLASH = 0.12


@dataclass(frozen=True)
class BossDifficulty:
    hp: int
    bullet_speed: float
    interval: float
    count: int
    movement: float
    color: str
    player_hp: int = 3


BOSS_DIFFICULTIES = {
    "mean": BossDifficulty(180, 125, 1.15, 7, 0.6, "#ffb347"),
    "cruel": BossDifficulty(260, 165, 0.85, 9, 0.85, "#c084fc"),
    "nightmare": BossDifficulty(360, 205, 0.6, 11, 1.1, "#ff4565"),
    "impossible": BossDifficulty(900, 250, 0.42, 14, 2.3, "#ffffff", player_hp=5),
}


@dataclass
class HealingPickup:
    x: float
    y: float
    remaining: float = HEAL_LIFETIME


@dataclass
class Projectile:
    x: float
    y: float
    vx: float
    vy: float
    width: float = BULLET_SIZE
    height: float = BULLET_SIZE
    rule: str = "normal"
    bone: bool = False
    delay: float = 0.0

    def rectangles(self):
        """Visible pieces of a bone; collision and rendering share these shapes."""
        if not self.bone:
            return [(self.x, self.y, self.width, self.height)]
        cap = min(8, self.height / 3)
        return [(self.x, self.y, self.width * 0.4, self.height - cap),
                (self.x, self.y - self.height / 2 + cap / 2, self.width, cap),
                (self.x, self.y + self.height / 2 - cap / 2, self.width, cap)]

    def dangerous(self, moving):
        return self.rule == "normal" or (self.rule == "blue" and moving) or (self.rule == "orange" and not moving)


def hits_player(x, y, cx, cy, width, height):
    left, right = cx - x - width / 2, cx - x + width / 2
    bottom, top = cy - y - height / 2, cy - y + height / 2
    if right < PLAYER_LEFT or left > PLAYER_RIGHT or top < PLAYER_BOTTOM or bottom > PLAYER_TOP:
        return False
    return polygon_touches_rectangle(PLAYER_POLYGON, left, right, bottom, top)


class BossCrush:
    def __init__(self, difficulty="mean", rng=None):
        self.difficulty = difficulty
        self.config = BOSS_DIFFICULTIES[difficulty]
        self.rules = Difficulty()
        self.left, self.right, self.bottom, self.top = self.rules.bounds
        self.x, self.y = 0.0, -190.0
        self.boss_x, self.boss_y = 0.0, self.top - BOSS_HEIGHT / 2
        self.hp = self.config.hp
        self.hit_flash = 0.0
        self.max_lives = self.config.player_hp
        self.lives = self.max_lives
        self.alive, self.won = True, False
        self.death_message = None
        self.elapsed = 0.0
        self.invulnerable = 0.0
        self.fire_in = 0.0
        self.attack_in = 0.0 if difficulty == "impossible" else 1.5
        self.volley = 0
        self.bullets, self.shots = [], []
        self.pattern_index = 0
        self.phase_age = 0.0
        self.lunge_state = None
        self.lunge_timer = 0.0
        self.lunge_target = None
        self.rng = rng or random.Random()
        self.healing_pickups = []
        self.heal_in = HEAL_INTERVAL

    @property
    def pattern_label(self):
        if self.difficulty != "impossible":
            return ""
        if self.lunge_state:
            return "!! DODGE THE LUNGE !!" if self.lunge_state == "warning" else "FINAL PHASE — keep shooting and dodge!"
        prefix = "GET READY: " if self.phase_age < PATTERN_WARNING else ""
        return prefix + PATTERNS[self.pattern_index]

    @property
    def score(self):
        damage_points = (self.config.hp - self.hp) * 10
        return damage_points + (2000 + max(0, 3000 - int(self.elapsed * 20)) if self.won else 0)

    def attack(self):
        """Alternate readable fans, aimed bursts, and rotating rings."""
        if self.lunge_state or self.won or not self.alive:
            return
        if self.difficulty == "impossible":
            self.impossible_attack()
            self.volley += 1
            return
        count = self.config.count
        origin_y = self.boss_y - BOSS_HEIGHT / 2 - 8
        pattern = self.volley % (2 if self.difficulty == "mean" else 3)
        if pattern == 0:
            angles = [-math.pi / 2 + (i / (count - 1) - 0.5) * 2.0 for i in range(count)]
        elif pattern == 1:
            aim = math.atan2(self.y - origin_y, self.x - self.boss_x)
            count -= 4
            angles = [aim + (i - (count - 1) / 2) * 0.18 for i in range(count)]
        else:
            count *= 2
            angles = [math.tau * i / count + self.volley * 0.23 for i in range(count)]
        for angle in angles:
            self.bullets.append(Projectile(self.boss_x, origin_y,
                                          math.cos(angle) * self.config.bullet_speed,
                                          math.sin(angle) * self.config.bullet_speed))
        self.volley += 1

    def impossible_attack(self):
        """Six phases, including tightly spaced blue/orange pairs."""
        speed = self.config.bullet_speed
        if self.pattern_index == 0:
            gap = 180 * math.sin(self.volley * 0.65)
            for x in range(-280, 281, 28):
                if abs(x - gap) > 65:
                    self.bullets.append(Projectile(x, self.top + 23, 0, -speed,
                                                  width=24, height=48, bone=True))
        elif self.pattern_index == 1:
            for i in range(self.config.count):
                angle = math.tau * i / self.config.count + self.volley * 0.22
                self.bullets.append(Projectile(self.boss_x, self.boss_y - 30,
                                              math.cos(angle) * speed, math.sin(angle) * speed))
        elif self.pattern_index in (2, 3):
            rule = "blue" if self.pattern_index == 2 else "orange"
            # Full-width moving rows make the movement rule matter everywhere.
            for x in range(-294, 295, 14):
                self.bullets.append(Projectile(x, self.top + 3, 0, -speed,
                                              width=10, height=10, rule=rule))
        elif self.pattern_index == 4:
            gap = -70 + 90 * math.sin(self.volley * 0.6)
            from_left = self.volley % 2 == 0
            x = self.left - 11 if from_left else self.right + 11
            for y in range(-220, 221, 28):
                if abs(y - gap) > 65:
                    self.bullets.append(Projectile(x, y, speed if from_left else -speed, 0,
                                                  width=24, height=26, bone=True))
        else:
            for rule, delay in (("blue", 0.0), ("orange", PAIR_DELAY)):
                for x in range(-294, 295, 14):
                    self.bullets.append(Projectile(x, self.top + 3, 0, -speed,
                                                  width=10, height=10, rule=rule, delay=delay))

    def advance_pattern(self, step):
        self.phase_age += step
        if self.phase_age >= PATTERN_DURATION:
            self.phase_age -= PATTERN_DURATION
            self.pattern_index = (self.pattern_index + 1) % len(PATTERNS)
            self.bullets.clear()
            self.attack_in = 0
        if self.phase_age < PATTERN_WARNING:
            return
        self.attack_in -= step
        if self.attack_in <= 0:
            self.attack()
            # Bone walls leave more travel time than the bullet volleys.
            if self.pattern_index == 5:
                self.attack_in += 1.0
            else:
                self.attack_in += 0.95 if self.pattern_index in (0, 4) else self.config.interval

    def hurt(self):
        if self.invulnerable <= 0:
            self.lives -= 1
            self.invulnerable = 1.25
            self.alive = self.lives > 0

    def update_healing(self, step):
        if self.difficulty != "impossible" or not self.alive or self.won:
            return
        remaining = []
        for pickup in self.healing_pickups:
            pickup.remaining -= step
            if pickup.remaining <= 1e-9:
                continue
            if hits_player(self.x, self.y, pickup.x, pickup.y, HEAL_SIZE, HEAL_SIZE):
                self.lives = min(self.max_lives, self.lives + 1)
            else:
                remaining.append(pickup)
        self.healing_pickups = remaining
        self.heal_in -= step
        if self.heal_in <= 1e-9:
            self.heal_in += HEAL_INTERVAL
            # Keep pickups away from the boss and avoid instant collection.
            for _ in range(30):
                x = self.rng.uniform(self.left + 40, self.right - 40)
                y = self.rng.uniform(self.bottom + 40, 70)
                if math.hypot(x - self.x, y - self.y) < 50:
                    continue
                if abs(x - self.boss_x) < BOSS_WIDTH / 2 + 40 and abs(y - self.boss_y) < BOSS_HEIGHT / 2 + 40:
                    continue
                self.healing_pickups.append(HealingPickup(x, y))
                break

    def start_lunge_warning(self):
        self.lunge_state = "warning"
        self.lunge_timer = LUNGE_WARNING
        # Lock the target during the warning so the player can dodge the charge.
        self.lunge_target = (
            max(self.left + BOSS_WIDTH / 2, min(self.right - BOSS_WIDTH / 2, self.x)),
            max(self.bottom + BOSS_HEIGHT / 2, min(self.top - BOSS_HEIGHT / 2, self.y)),
        )

    def enter_final_phase(self):
        if self.difficulty == "impossible" and 0 < self.hp <= LUNGE_HP and self.lunge_state is None:
            self.bullets.clear()  # Includes queued blue/orange attacks.
            self.start_lunge_warning()

    def move_boss(self, step):
        self.enter_final_phase()
        if self.lunge_state is None:
            self.boss_x = 165 * math.sin(self.elapsed * self.config.movement)
            self.boss_y = self.top - BOSS_HEIGHT / 2
        elif self.lunge_state in ("warning", "recovery"):
            self.lunge_timer = max(0.0, self.lunge_timer - step)
            if self.lunge_timer <= 1e-9:
                if self.lunge_state == "warning":
                    self.lunge_state = "lunging"
                else:
                    self.start_lunge_warning()
        else:
            dx = self.lunge_target[0] - self.boss_x
            dy = self.lunge_target[1] - self.boss_y
            distance = math.hypot(dx, dy)
            travel = min(distance, LUNGE_SPEED * step)
            if distance:
                self.boss_x += dx / distance * travel
                self.boss_y += dy / distance * travel
            if distance <= LUNGE_SPEED * step:
                self.lunge_state = "recovery"
                self.lunge_timer = LUNGE_RECOVERY

    def update(self, dt, keys):
        if dt <= 1e-9:
            return
        # Equal substeps avoid a floating-point remainder that moves the player
        # by zero pixels but still checks orange-bullet damage as "standing still".
        steps = math.ceil(dt * 120)
        step = dt / steps
        for _ in range(steps):
            if not self.alive or self.won:
                break
            self.elapsed += step
            self.hit_flash = max(0.0, self.hit_flash - step)
            self.invulnerable = max(0, self.invulnerable - step)
            dx = int("Right" in keys) - int("Left" in keys)
            dy = int("Up" in keys) - int("Down" in keys)
            length = math.hypot(dx, dy) or 1
            old_x, old_y = self.x, self.y
            self.x = max(self.left - PLAYER_LEFT, min(self.right - PLAYER_RIGHT, self.x + dx / length * 260 * step))
            self.y = max(self.bottom - PLAYER_BOTTOM, min(self.top - PLAYER_TOP, self.y + dy / length * 260 * step))
            moving = abs(self.x - old_x) > 1e-9 or abs(self.y - old_y) > 1e-9
            self.move_boss(step)
            if hits_player(self.x, self.y, self.boss_x, self.boss_y, BOSS_WIDTH, BOSS_HEIGHT):
                self.lives = 0
                self.alive = False
                self.death_message = "CRUSHED BY THE BOSS!\nToo close for comfort."
                return
            self.fire_in = max(0, self.fire_in - step)
            if "f" in keys and self.fire_in <= 0:
                self.shots.append(Projectile(self.x, self.y + PLAYER_TOP + SHOT_HEIGHT / 2, 0, 520))
                self.fire_in = 0.18
            if self.lunge_state is None:
                if self.difficulty == "impossible":
                    self.advance_pattern(step)
                else:
                    self.attack_in -= step
                    if self.attack_in <= 0:
                        self.attack()
                        self.attack_in += self.config.interval

            shots = []
            for shot in self.shots:
                shot.y += shot.vy * step
                if (abs(shot.x - self.boss_x) <= (BOSS_WIDTH + SHOT_WIDTH) / 2
                        and abs(shot.y - self.boss_y) <= (BOSS_HEIGHT + SHOT_HEIGHT) / 2):
                    self.hp = max(0, self.hp - 5)
                    if self.difficulty == "impossible":
                        self.hit_flash = BOSS_HIT_FLASH
                elif shot.y - SHOT_HEIGHT / 2 <= self.top:
                    shots.append(shot)
            self.shots = shots
            if self.hp == 0:
                self.won = True
                self.bullets.clear()
                return
            self.enter_final_phase()

            bullets = []
            for bullet in self.bullets:
                if bullet.delay > 0:
                    bullet.delay = max(0.0, bullet.delay - step)
                    bullets.append(bullet)
                    continue
                bullet.x += bullet.vx * step
                bullet.y += bullet.vy * step
                collision = bullet.dangerous(moving) and any(
                    hits_player(self.x, self.y, x, y, width, height)
                    for x, y, width, height in bullet.rectangles())
                if collision:
                    self.hurt()
                elif (self.left - bullet.width / 2 <= bullet.x <= self.right + bullet.width / 2
                      and self.bottom - bullet.height / 2 <= bullet.y <= self.top + bullet.height / 2):
                    bullets.append(bullet)
            self.bullets = bullets
            self.update_healing(step)
