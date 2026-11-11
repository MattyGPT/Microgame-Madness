"""Count down into a repeated or shuffled set of Pumpkin King patterns."""

import math
from collections import deque
from boss_crush import Projectile, hits_player

from pumpkin_king import (ATTACK_NAMES, BABY_MODE, PumpkinKing, Stage,
                          SCARE_PERIOD, SCARE_WARNING, SCARE_QUADRANTS,
                          EYE_FLASH_PERIOD, EYE_FLASH_ON, COUNTER_WINDOW, COUNTER_COOLDOWN, COUNTER_RANGE)


WRATH_READY_TIME = 3.0
WRATH_BREAK_TIME = 0.5
RANDOM_ORDER = "random_order"


WRATH_ATTACKS = {
    "color_memory": 0,
    "bone_gauntlet": 1,
    "rotating_rings": 2,
    "magenta_fingers": 3,
    "chaos": 4,
    "royal_slams": 5,
    "haunted_quadrants": 6,
}


class KingsWrath(PumpkinKing):
    def __init__(self, attack, rng=None):
        original_attack = attack
        attack, separator, variant = attack.partition("__")
        self.variant = variant if separator else "normal"
        if self.variant not in ("easy", "normal", "hard"):
            raise ValueError("Unknown King's Wrath difficulty")
        self.countdown_started = False
        self.ghosts = []
        self.projectile_speed = {"easy": .7, "normal": 1, "hard": 1.25}[self.variant]
        self.ring_speed = {"easy": .7, "normal": 1, "hard": 1.38}[self.variant]
        self.scare_speed = {"easy": .5, "normal": 1, "hard": 1.35 * .95}[self.variant]
        if attack not in WRATH_ATTACKS and attack != RANDOM_ORDER:
            raise ValueError("Unknown King's Wrath attack")
        self.practice_attack = WRATH_ATTACKS.get(attack)
        self.attack_order = []
        self.attacks_completed = 0
        super().__init__(rng=rng, difficulty=BABY_MODE)
        self.spawn_position = self.x, self.y
        self.difficulty = original_attack
        self.begin_attack(self._choose_attack())

    def _choose_attack(self):
        if self.practice_attack is not None:
            return self.practice_attack
        if not self.attack_order:
            self.attack_order = list(WRATH_ATTACKS.values())
            self.rng.shuffle(self.attack_order)
            # Play all seven before reshuffling, without repeating at the join.
            if self.attack_order[-1] == self.attack_index:
                self.attack_order[0], self.attack_order[-1] = self.attack_order[-1], self.attack_order[0]
        return self.attack_order.pop()

    def begin_attack(self, index):
        pending_sounds = len(self.sound_events)
        super().begin_attack(index)
        self.x, self.y = self.spawn_position
        # Replace the full fight's break with a fixed, safe half-second reset.
        if self.queue and self.queue[-1].name == "break":
            self.queue.pop()
        self.projectile_speed = {"easy": .7, "normal": 1, "hard": 1.25}[self.variant]
        if index == 1 and self.variant == "hard":
            self.projectile_speed *= .9
        self.bone_gap_radius = {"easy": 80, "normal": 52, "hard": 38}[self.variant]
        self.chaos_volley_size = 7 if self.variant == "hard" else 5
        self.movement_speed = 312 if index == 5 and self.variant == "hard" else 260
        easy_fingers = index == 3 and self.variant == "easy"
        if easy_fingers:
            self.projectile_speed = .85
        self.counter_radius = COUNTER_RANGE * (1.15 if easy_fingers else 1)
        self.counter_window = COUNTER_WINDOW * (1.15 if easy_fingers else 1)
        self.counter_delay = COUNTER_COOLDOWN * (.85 if easy_fingers else 1)
        stages = [self.stage, *self.queue]
        if index == 0 and self.variant == "easy":
            self.sequence = self.sequence[:3]
            stages = [Stage("memory", 3 * EYE_FLASH_PERIOD), Stage("recall_ready", .6)]
            for i, rule in enumerate(self.sequence):
                stages.append(Stage("color", .65, rule))
                if i < 2:
                    stages.append(Stage("color_gap", .75))
        if index == 5 and self.variant == "hard":
            stages = []
            # Shuffle a deck so all three new shapes appear in every cycle.
            sides = ["left", "right", "both", "center", "split", "sweep"]
            sides += [self.rng.choice(sides) for _ in range(5)]
            self.rng.shuffle(sides)
            fire_after = set(self.rng.sample(range(11), 3))
            for i, side in enumerate(sides):
                stages.extend((Stage("raise", .5, side), Stage("slam", .15, side), Stage("slam_rest", .15)))
                if i in fire_after:
                    stages.extend((Stage("roar", .3), Stage("fire", .65)))
        if self.variant != "normal":
            adjusted = []
            for stage in stages:
                duration = stage.duration
                if index == 5:
                    duration /= .75 if self.variant == "easy" else 1.2
                    if self.variant == "easy" and stage.name == "slam_rest":
                        duration += .15
                elif stage.name == "rings":
                    duration *= .8 if self.variant == "easy" else 1.4
                elif stage.name == "memory" and self.variant == "hard":
                    duration /= 1.3
                elif stage.name in ("memory", "recall_ready", "color_gap", "raise", "slam_rest"):
                    duration *= 1.3 if self.variant == "easy" else .85
                elif stage.name in ("bones", "chaos") or stage.name == "fingers" and self.variant == "hard":
                    duration *= .8 if self.variant == "easy" else 1.2
                adjusted.append(Stage(stage.name, duration, stage.side))
            stages = adjusted
        stages.append(Stage("wrath_break", WRATH_BREAK_TIME))
        self.stage, self.queue = stages[0], deque(stages[1:])
        self.ghosts = []
        if index == 2 and self.variant == "hard":
            # Separate flight lanes leave a generous lower escape lane.
            self.ghosts = [Projectile(-280+i*110, y, 105 if i % 2 == 0 else -105, 0,
                                     width=20, height=24)
                           for i, y in enumerate((-225, -95, -65, -35, -5, 25))]
        if not self.countdown_started:
            self.countdown_started = True
            self.queue.appendleft(self.stage)
            self.stage = Stage("wrath_ready", WRATH_READY_TIME)
            self.stage_age = 0.0
            del self.sound_events[pending_sounds:]

    def _spawn(self):
        if self.attack_index == 0 and self.variant == "easy":
            return 1.0
        before = len(self.bullets)
        interval = super()._spawn()
        for bullet in self.bullets[before:]:
            bullet.vx *= self.projectile_speed
            bullet.vy *= self.projectile_speed
        if self.stage.name == "rings":
            return interval / self.ring_speed
        if self.stage.name == "bones" and self.variant == "hard":
            return interval / 1.5
        return interval / self.projectile_speed

    @property
    def eyes_only_color(self):
        return self.variant == "hard" and self.attack_index == 0 and self.stage.name == "color"

    @property
    def eye_rule(self):
        if self.stage.name == "memory":
            period = self.stage.duration / len(self.sequence)
            index = min(len(self.sequence)-1, int(self.stage_age / period))
            return self.sequence[index] if self.stage_age % period < period * EYE_FLASH_ON / EYE_FLASH_PERIOD else None
        return self.screen_rule

    def slam_rectangles(self, side):
        shapes = {
            "left": [(-150, 0, 300, 480)],
            "right": [(150, 0, 300, 480)],
            "both": [(-170, 0, 260, 480), (170, 0, 260, 480)],
            "center": [(0, 0, 190, 480)],
            "split": [(-150, 0, 110, 480), (150, 0, 110, 480)],
            "sweep": [(0, -65, 600, 80)],
        }
        rectangles = shapes[side]
        if self.variant == "easy":
            return [(x, y, width * .8, height) for x, y, width, height in rectangles]
        return rectangles

    @property
    def slam_warnings(self):
        return self.slam_rectangles(self.stage.side) if self.stage.name == "raise" and self.variant == "easy" else []

    def arm_pose(self, side):
        extent, shoulder_y, lift = super().arm_pose(side)
        if self.variant == "hard" and self.stage.name == "raise":
            progress = min(1, self.stage_age / self.stage.duration)
            if self.stage.side in (side, "both"):
                lift = 45 * progress
            elif self.stage.side in ("center", "split", "sweep"):
                lift = {"center": 20, "split": 35, "sweep": 80}[self.stage.side] * progress
        return extent, shoulder_y, lift

    def arm_gesture_x(self, x):
        if self.variant != "hard" or self.stage.name != "raise":
            return x
        target = {"center": .32, "split": .58}.get(self.stage.side, 1)
        scale = 1 + (target-1) * min(1, self.stage_age / self.stage.duration)
        return self.boss_x + (x-self.boss_x) * scale

    def arm_segments(self, side):
        for x, y, width, height, progress in super().arm_segments(side):
            yield self.arm_gesture_x(x), y, width, height, progress

    def hand_rectangles(self, side):
        for x, y, width, height in super().hand_rectangles(side):
            yield self.arm_gesture_x(x), y, width, height

    def hazard_rectangles(self):
        if self.stage.name == "slam":
            return self.slam_rectangles(self.stage.side)
        if self.stage.name == "fire" and self.variant == "easy":
            return [(0, -74, 72, 332)]
        return super().hazard_rectangles()

    @property
    def scare_beat(self):
        return int((self.stage_age + 1e-9) * self.scare_speed / SCARE_PERIOD)

    @property
    def scare_warning(self):
        age = self.stage_age - self.scare_beat * SCARE_PERIOD / self.scare_speed
        warning = .12 if self.variant == "hard" else SCARE_WARNING / self.scare_speed
        return age < warning - 1e-9

    @property
    def scare_rectangles(self):
        offsets = (0, 2) if self.variant == "hard" else (0,)
        # Opposite full quadrants meet at the center; sitting on the seam is unsafe.
        size = (300, 240)
        beat = 0 if self.stage.name == "scare_ready" else self.scare_beat
        return [(*SCARE_QUADRANTS[(beat+offset) % 4], *size) for offset in offsets]

    @property
    def scare_rectangle(self):
        return self.scare_rectangles[0]

    def update_scares(self):
        if self.stage.name != "scares" or self.scare_warning:
            return
        beat = self.scare_beat
        if self.scare_sounded != beat:
            self.sound_events.append("scare")
            self.scare_sounded = beat
        if self.scare_hit != beat and any(hits_player(self.x, self.y, *r) for r in self.scare_rectangles):
            self.hurt(.5, force=True)
            self.scare_hit = beat

    def update_healing(self, step):
        super().update_healing(step)
        for ghost in self.ghosts:
            ghost.x += ghost.vx * step
            if ghost.x > 290:
                ghost.x = -290
            elif ghost.x < -290:
                ghost.x = 290
            if hits_player(self.x, self.y, ghost.x, ghost.y, ghost.width, ghost.height):
                self.hurt()

    def _next_stage(self):
        if not self.queue:
            self.begin_attack(self._choose_attack())
        elif self.queue[0].name == "wrath_break":
            self.stage = self.queue.popleft()
            self.stage_age = 0.0
            self.attacks_completed += 1
            if self.alive:
                self.attack_survivals[self.attack_index] += 1
            self.x, self.y = self.spawn_position
            self.bullets.clear()
            self.rings.clear()
            self.ghosts.clear()
            self.shots.clear()
            self.counter_time = 0.0
        else:
            super()._next_stage()

    def update(self, dt, keys):
        remaining = dt
        while remaining > 1e-9 and self.alive and not self.won:
            until_next = self.stage.duration-self.stage_age
            if self.stage.name not in ("wrath_ready", "wrath_break"):
                until_next += sum(stage.duration for stage in self.queue if stage.name != "wrath_break")
            if until_next <= 1e-9:
                self._next_stage()
                continue
            step = min(remaining, until_next)
            if self.stage.name in ("wrath_ready", "wrath_break"):
                # Preparation and cycle breaks pause combat, movement and scoring.
                self.stage_age += step
                if self.stage_age + 1e-9 >= self.stage.duration:
                    self._next_stage()
            else:
                super().update(step, keys)
            remaining -= step

    @property
    def pattern_label(self):
        if self.stage.name == "wrath_break" and not self.won:
            return "BREATHE — next attack in 0.5 seconds"
        if self.stage.name == "wrath_ready" and not self.won:
            seconds = math.ceil(max(0, self.stage.duration-self.stage_age)-1e-9)
            if self.practice_attack is None:
                return f"GET READY — {seconds} · NEXT: {ATTACK_NAMES[self.attack_index]}"
            return f"GET READY — {seconds} · POSITION YOUR FINGERS"
        if self.eyes_only_color:
            return "WATCH HIS EYES — FOLLOW THE COLOR"
        if self.stage.name == "memory":
            return f"WATCH THE EYES — remember all {len(self.sequence)} colors"
        if self.stage.name == "raise" and self.stage.side in ("center", "split", "sweep"):
            return {"center": "CENTER CRUSH — MOVE TO A SIDE!", "split": "SPLIT STRIKE — FIND A CLEAR LANE!",
                    "sweep": "LOW SWEEP — MOVE BELOW THE BAND!"}[self.stage.side]
        if self.stage.name == "scares" and self.variant == "hard":
            names = ("TOP LEFT + BOTTOM RIGHT", "TOP RIGHT + BOTTOM LEFT")
            return f"{names[self.scare_beat % 2]} — {'WARNING! MOVE CLEAR' if self.scare_warning else 'TWIN TERRORS!'}"
        return super().pattern_label
