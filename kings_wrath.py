"""Count down into a repeated or shuffled set of Pumpkin King patterns."""

import math

from pumpkin_king import ATTACK_NAMES, BABY_MODE, PumpkinKing, Stage


WRATH_READY_TIME = 3.0
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
        if attack not in WRATH_ATTACKS and attack != RANDOM_ORDER:
            raise ValueError("Unknown King's Wrath attack")
        self.practice_attack = WRATH_ATTACKS.get(attack)
        self.attack_order = []
        self.attacks_completed = 0
        super().__init__(rng=rng, difficulty=BABY_MODE)
        self.difficulty = attack
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
        # Replace the normal one-second inter-attack break with this countdown.
        if self.queue and self.queue[-1].name == "break":
            self.queue.pop()
        self.queue.appendleft(self.stage)
        self.stage = Stage("wrath_ready", WRATH_READY_TIME)
        self.stage_age = 0.0
        del self.sound_events[pending_sounds:]

    def _next_stage(self):
        if not self.queue:
            self.attacks_completed += 1
            self.begin_attack(self._choose_attack())
        else:
            super()._next_stage()

    def update(self, dt, keys):
        remaining = dt
        while remaining > 1e-9 and self.alive and not self.won:
            until_next = self.stage.duration-self.stage_age
            if self.stage.name != "wrath_ready":
                until_next += sum(stage.duration for stage in self.queue)
            if until_next <= 1e-9:
                self._next_stage()
                continue
            step = min(remaining, until_next)
            if self.stage.name == "wrath_ready":
                # The countdown pauses combat, movement, healing and scoring.
                self.stage_age += step
                if self.stage_age + 1e-9 >= self.stage.duration:
                    self._next_stage()
            else:
                super().update(step, keys)
            remaining -= step

    @property
    def pattern_label(self):
        if self.stage.name == "wrath_ready" and not self.won:
            seconds = math.ceil(max(0, self.stage.duration-self.stage_age)-1e-9)
            if self.difficulty == RANDOM_ORDER:
                return f"GET READY — {seconds} · NEXT: {ATTACK_NAMES[self.attack_index]}"
            return f"GET READY — {seconds} · POSITION YOUR FINGERS"
        return super().pattern_label
