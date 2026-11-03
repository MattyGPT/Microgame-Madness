"""Shared, deterministic turtle death artwork; combat stops before this plays."""

import math

from dodge_model import PLAYER_POLYGON

DEATH_DURATION = 1.6


def _inside(x, y):
    inside = False
    for (ax, ay), (bx, by) in zip(PLAYER_POLYGON, PLAYER_POLYGON[1:]+PLAYER_POLYGON[:1]):
        if (ay > y) != (by > y) and x < (bx-ax)*(y-ay)/(by-ay)+ax:
            inside = not inside
    return inside


TURTLE_PIXELS = tuple((x, y) for x in range(-9, 10, 2) for y in range(-8, 17, 2) if _inside(x, y))


def death_pixels(x, y, age):
    """White squares burst from the actual turtle silhouette for 1.6 seconds."""
    if not 0 <= age < DEATH_DURATION:
        return []
    pixels = []
    for index, (dx, dy) in enumerate(TURTLE_PIXELS):
        angle = index*2.399963 + math.atan2(dy, dx)*.35
        speed = 40+(index*37)%100
        fade = max(0, (age-1.05)/.55)
        if fade > ((index*17)%31)/31:
            continue
        px = x+dx+math.cos(angle)*speed*age
        py = y+dy+(math.sin(angle)*speed+35)*age-35*age*age
        pixels.append((px, py, max(.8, 3*(1-age/DEATH_DURATION*.65))))
    return pixels
