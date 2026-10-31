"""Typing progression and deadline rules shared by both interfaces."""

import random
import string

def make_round(level):
    """Increase length, add new key types, and gradually reduce the time limit."""
    if level < 1:
        raise ValueError("Level must be positive.")
    alphabet = "asdfjkl"
    if level >= 3:
        alphabet = string.ascii_lowercase
    if level >= 5:
        alphabet += string.digits
    if level >= 7:
        alphabet += string.ascii_uppercase
    if level >= 9:
        alphabet += "!@#$%&*?+-="
    length = min(level + 2, 24)
    seconds = max(4.0, 8.0 - (level - 1) * 0.25)
    return "".join(random.choice(alphabet) for _ in range(length)), seconds



class KeyboardRound:
    def __init__(self, sequence, seconds, now):
        self.sequence = sequence
        self.deadline = now + seconds
        self.matched = self.mistakes = 0
        self.result = None

    def remaining(self, now):
        return max(0.0, self.deadline - now)

    def feed(self, key, now):
        if self.result:
            return self.result
        if now >= self.deadline:
            self.result = "timeout"
        elif key == "\x1b":
            self.result = "quit"
        elif key is not None:
            if key == self.sequence[self.matched]:
                self.matched += 1
                if self.matched == len(self.sequence):
                    self.result = "completed"
            else:
                self.mistakes += 1
                self.deadline -= 0.5
                if now >= self.deadline:
                    self.result = "timeout"
        return self.result
