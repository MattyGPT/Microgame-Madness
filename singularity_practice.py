"""Temporary attack picker for tuning Core patterns; remove on user request."""

import math

from singularity_core import ATTACKS, HEAL_EVERY_ATTACKS, SingularityCore


PRACTICE_ATTACKS = {attack.name.lower().replace(" ", "_"): index
                    for index, attack in enumerate(ATTACKS)}


class SingularityCutscene(SingularityCore):
    """Replay the shared finale without completing any survival protocols."""

    practice_attack = None

    def __init__(self, rng=None):
        super().__init__(rng=rng)
        self.difficulty = "final_cutscene"
        self.stage = "exposed"
        self.fire_laser()

    @property
    def shielded(self):
        return False


class SingularityPractice(SingularityCore):
    ready_time = 3.0

    def __init__(self, attack, rng=None):
        if attack not in PRACTICE_ATTACKS:
            raise ValueError("Unknown Singularity Core practice attack")
        self.practice_attack = PRACTICE_ATTACKS[attack]
        super().__init__(rng=rng)
        self.difficulty = attack
        self._prepare()

    @property
    def shielded(self):
        return True

    @property
    def laser_ready(self):
        return False

    @property
    def pattern_label(self):
        if self.stage == "practice_ready":
            seconds = math.ceil(max(0, self.ready_time - self.stage_age) - 1e-9)
            return f"GET READY — {seconds} · {self.attack_index + 1:02d}: {ATTACKS[self.attack_index].name}"
        return "PRACTICE · " + super().pattern_label

    def _prepare(self):
        pending_sounds = len(self.sound_events)
        super().begin_attack(self.practice_attack)
        self.stage = "practice_ready"
        self.stage_age = 0.0
        del self.sound_events[pending_sounds:]

    def _advance(self):
        self.stage_age = 0.0
        if self.stage == "practice_ready":
            self.stage = "attack"
            self.sound_events.append("core_protocol")
        elif self.stage == "attack":
            self.attacks_completed += 1
            if self.attacks_completed % HEAL_EVERY_ATTACKS == 0:
                self.spawn_healing()
            self._prepare()

    def update(self, dt, keys):
        remaining = dt
        while remaining > 1e-9 and self.alive and not self.won:
            if self.stage == "practice_ready":
                step = min(remaining, max(0, self.ready_time - self.stage_age))
                self.stage_age += step
                if self.stage_age + 1e-9 >= self.ready_time:
                    self._advance()
            else:
                until_end = max(0, ATTACKS[self.attack_index].duration - self.stage_age)
                if until_end <= 1e-9:
                    self._advance()
                    continue
                step = min(remaining, until_end)
                super().update(step, keys)
            remaining -= step
