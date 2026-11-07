"""Reproducible input-only speedrun probe; never changes combat state or HP."""
import math
from pathlib import Path
import random
import sys
sys.path.insert(0, str(Path(__file__).resolve().parents[1]))
from pumpkin_king import PumpkinKing, Finger


def controls(game):
    keys = {"f"}
    target_x, target_y = 0, -65
    if game.stage.name in ("raise", "slam", "slam_rest"):
        target_x = 30 if game.stage.side == "left" else -30 if game.stage.side == "right" else 0
    if game.stage.name in ("roar", "fire"):
        target_x = 75
    if game.stage.name == "scares":
        target_x = -35 if game.scare_beat % 4 == 2 else 35 if game.scare_beat % 4 == 3 else 0
    if game.stage.name == "bones":
        approaching = [b for b in game.bullets if 0 < (game.x-b.x)/b.vx < .55]
        if approaching:
            # Find the visible gap in the nearest incoming column of bones.
            nearest = min(approaching, key=lambda b: (game.x-b.x)/b.vx)
            column = sorted(b.y for b in approaching if abs(b.x-nearest.x)<2)
            gaps = [(b-a, (a+b)/2) for a,b in zip(column,column[1:])]
            if gaps: target_y = max(gaps)[1]
    if game.screen_rule != "blue":
        if abs(target_x-game.x)>2: keys.add("Right" if target_x>game.x else "Left")
        if abs(target_y-game.y)>2: keys.add("Up" if target_y>game.y else "Down")
        if game.screen_rule == "orange" and len(keys)==1:
            keys.add("Up" if int(game.elapsed*5)%2 else "Down")
    if not game.counter_held and game.counter_cooldown <= 0 and any(
            isinstance(b, Finger) and math.hypot(b.x-game.x,b.y-game.y)<60 for b in game.bullets):
        keys.add("e")
    return keys


def run(seed, fps=60):
    game = PumpkinKing(random.Random(seed), "come_on")
    while game.alive and not game.won and game.elapsed < 90:
        game.update(1/fps, controls(game))
    return game


if __name__ == "__main__":
    for fps in (30, 60, 120):
        for seed in range(3):
            g = run(seed, fps)
            print(f"fps={fps} seed={seed} won={g.won} seconds={g.elapsed:.4f} shots={g.shots_fired} damage={g.damage_taken} hp_left={g.lives}", flush=True)
