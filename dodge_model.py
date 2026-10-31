"""Display-independent movement, falling pieces, collision detection, and scoring."""

from dataclasses import dataclass
import math
import random

CELL = 28
BLOCK_SIZE = CELL * 0.94
NEAR_MISS_MARGIN = 6
LEFT, RIGHT, BOTTOM, TOP = -300, 300, -240, 240
# The same north-facing outline is used for drawing and collision detection.
PLAYER_POLYGON = (
    (0, 16), (-2, 14), (-1, 10), (-4, 7), (-7, 9), (-9, 8),
    (-6, 5), (-7, 1), (-5, -3), (-8, -6), (-6, -8), (-4, -5),
    (0, -7), (4, -5), (6, -8), (8, -6), (5, -3), (7, 1),
    (6, 5), (9, 8), (7, 9), (4, 7), (1, 10), (2, 14),
)
PLAYER_LEFT = min(x for x, y in PLAYER_POLYGON)
PLAYER_RIGHT = max(x for x, y in PLAYER_POLYGON)
PLAYER_BOTTOM = min(y for x, y in PLAYER_POLYGON)
PLAYER_TOP = max(y for x, y in PLAYER_POLYGON)
SHAPES = (
    ((0, 0), (1, 0), (2, 0), (3, 0)),  # I
    ((0, 0), (1, 0), (0, 1), (1, 1)),  # O
    ((0, 0), (1, 0), (2, 0), (1, 1)),  # T
    ((0, 0), (1, 0), (1, 1), (2, 1)),  # S
    ((1, 0), (2, 0), (0, 1), (1, 1)),  # Z
    ((0, 0), (1, 0), (2, 0), (0, 1)),  # J
    ((0, 0), (1, 0), (2, 0), (2, 1)),  # L
)
COLORS = ("#48d9ef", "#ffd166", "#bb86fc", "#69db7c", "#ff6b8a", "#659bff", "#ffa552")


@dataclass(frozen=True)
class Difficulty:
    speed_scale: float = 1.0
    speed_variation: tuple = (1.0, 1.0)
    spawn_scale: float = 1.0
    color: str | None = None
    sway: float = 0.0
    bounds: tuple = (LEFT, RIGHT, BOTTOM, TOP)
    can_pause: bool = True
    deadly_edges: bool = False


DIFFICULTIES = {
    "easy": Difficulty(),
    "normal": Difficulty(speed_scale=1.3, speed_variation=(0.9, 1.2)),
    "hard": Difficulty(speed_scale=2.1, speed_variation=(0.9, 1.2),
                       color="#ffdf00", sway=18),
    "merciless": Difficulty(speed_scale=3.0, speed_variation=(0.9, 1.25),
                            spawn_scale=0.55, color="#ff3030", sway=18,
                            bounds=(-220, 220, -180, 180),
                            can_pause=False, deadly_edges=True),
}


@dataclass
class Block:
    x: float
    y: float
    cells: tuple
    color: str
    speed_multiplier: float = 1.0
    sway_phase: float = 0.0
    sway_amplitude: float = 0.0
    near_player: bool = False
    near_miss_awarded: bool = False

    def centers(self):
        return [(self.x + x * CELL, self.y + y * CELL) for x, y in self.cells]


def polygon_touches_rectangle(polygon, left, right, bottom, top):
    """Clip the turtle outline to a square; a nonempty result means contact."""
    for axis, boundary, direction in ((0, left, 1), (0, right, -1),
                                      (1, bottom, 1), (1, top, -1)):
        if not polygon:
            return False
        clipped = []
        previous = polygon[-1]
        previous_inside = (previous[axis] - boundary) * direction >= 0
        for current in polygon:
            inside = (current[axis] - boundary) * direction >= 0
            if inside != previous_inside:
                fraction = (boundary - previous[axis]) / (current[axis] - previous[axis])
                clipped.append(tuple(previous[i] + fraction * (current[i] - previous[i]) for i in (0, 1)))
            if inside:
                clipped.append(current)
            previous, previous_inside = current, inside
        polygon = clipped
    return bool(polygon)


def touches_block(x, y, block, margin=0):
    half = BLOCK_SIZE / 2 + margin
    for bx, by in block.centers():
        left, right = bx - x - half, bx - x + half
        bottom, top = by - y - half, by - y + half
        if right < PLAYER_LEFT or left > PLAYER_RIGHT or top < PLAYER_BOTTOM or bottom > PLAYER_TOP:
            continue
        if polygon_touches_rectangle(PLAYER_POLYGON, left, right, bottom, top):
            return True
    return False


class DodgeGame:
    def __init__(self, rng=None, difficulty="easy"):
        self.difficulty = difficulty
        self.rules = DIFFICULTIES[difficulty]
        self.left, self.right, self.bottom, self.top = self.rules.bounds
        self.rng = rng or random.Random()
        self.x, self.y = 0.0, self.bottom + 50.0
        self.elapsed = 0.0
        self.dodged = 0
        self.near_misses = 0
        self.blocks = []
        self.alive = True
        self.spawn_in = 0.7 * self.rules.spawn_scale

    @property
    def score(self):
        return int(self.elapsed * 10) + self.dodged * 25

    @property
    def speed(self):
        return min(340, 100 + self.elapsed * 2.5) * self.rules.speed_scale

    @property
    def spawn_interval(self):
        return max(0.35, 1.2 - self.elapsed * 0.012) * self.rules.spawn_scale

    def spawn(self):
        index = self.rng.randrange(len(SHAPES))
        cells = SHAPES[index]
        for _ in range(self.rng.randrange(4)):
            cells = tuple((-y, x) for x, y in cells)
        min_x = min(x for x, y in cells)
        min_y = min(y for x, y in cells)
        cells = tuple((x - min_x, y - min_y) for x, y in cells)
        width = max(x for x, y in cells) * CELL
        x = self.rng.uniform(self.left + CELL / 2, self.right - CELL / 2 - width)
        variation = self.rules.speed_variation
        multiplier = self.rng.uniform(*variation) if variation[0] != variation[1] else variation[0]
        phase = self.rng.uniform(0, math.tau) if self.rules.sway else 0
        self.blocks.append(Block(x, self.top + CELL, cells,
                                 self.rules.color or COLORS[index], multiplier,
                                 phase, self.rules.sway))

    def update(self, dt, keys):
        """Substeps keep fast pieces from jumping through the player."""
        while dt > 0 and self.alive:
            step = min(dt, 1 / 120)
            dt -= step
            dx = int("Right" in keys) - int("Left" in keys)
            dy = int("Up" in keys) - int("Down" in keys)
            length = math.hypot(dx, dy) or 1
            x = self.x + dx / length * 260 * step
            y = self.y + dy / length * 260 * step
            self.x = max(self.left - PLAYER_LEFT, min(self.right - PLAYER_RIGHT, x))
            self.y = max(self.bottom - PLAYER_BOTTOM, min(self.top - PLAYER_TOP, y))
            if self.rules.deadly_edges and (
                x + PLAYER_LEFT <= self.left or x + PLAYER_RIGHT >= self.right
                or y + PLAYER_BOTTOM <= self.bottom or y + PLAYER_TOP >= self.top
            ):
                self.alive = False
                return
            self.elapsed += step
            self.spawn_in -= step
            if self.spawn_in <= 0:
                self.spawn()
                self.spawn_in += self.spawn_interval
            escaped = []
            for block in self.blocks:
                block.y -= self.speed * block.speed_multiplier * step
                if block.sway_amplitude:
                    phase = block.sway_phase + step * 2
                    block.x += block.sway_amplitude * (math.sin(phase) - math.sin(block.sway_phase))
                    block.sway_phase = phase
                    width = max(x for x, y in block.cells) * CELL
                    block.x = max(self.left + CELL / 2, min(self.right - CELL / 2 - width, block.x))
                if touches_block(self.x, self.y, block):
                    self.alive = False
                elif not block.near_miss_awarded:
                    if touches_block(self.x, self.y, block, NEAR_MISS_MARGIN):
                        block.near_player = True
                    elif block.near_player:
                        escaped.append(block)
            # An approach alone is not a near miss. Reward a safe escape, once
            # per block, only after every collision in this substep is checked.
            if not self.alive:
                return
            for block in escaped:
                block.near_miss_awarded = True
                self.near_misses += 1
            remaining = []
            for block in self.blocks:
                if max(y for x, y in block.centers()) + CELL / 2 < self.bottom:
                    self.dodged += 1
                else:
                    remaining.append(block)
            self.blocks = remaining
