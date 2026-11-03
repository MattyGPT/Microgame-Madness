"""Procedural machinery, accretion disk, teleport grid, and shared hazard artwork."""

import math

from singularity_core import ATTACKS, BOX_CENTER, BOX_HALF, INTRO_DURATION, NODES, NODE_KEYS


CYAN = "#65f5ff"
VIOLET = "#a488ff"
HOT = "#ff527e"
AMBER = "#ffcf74"


def draw_core(game):
    commands = []

    def rect(x, y, w, h, fill, outline="", width=1):
        commands.append(dict(kind="rectangle", coords=[x-w/2, -y-h/2, x+w/2, -y+h/2],
                             fill=fill, outline=outline, width=width))

    def oval(x, y, rx, ry=None, fill="", outline="", width=1):
        ry = rx if ry is None else ry
        commands.append(dict(kind="oval", coords=[x-rx, -y-ry, x+rx, -y+ry],
                             fill=fill, outline=outline, width=width))

    def poly(points, fill, outline="", width=1):
        commands.append(dict(kind="polygon", coords=[v for x, y in points for v in (x, -y)],
                             fill=fill, outline=outline, width=width))

    def text(x, y, label, fill=CYAN, size=11):
        commands.append(dict(kind="text", coords=[x, -y], text=label, fill=fill,
                             font=["monospace", size]))

    def line(ax, ay, bx, by, thickness, color):
        length = math.hypot(bx-ax, by-ay) or 1
        dx, dy = -(by-ay)*thickness/length/2, (bx-ax)*thickness/length/2
        poly([(ax+dx, ay+dy), (bx+dx, by+dy), (bx-dx, by-dy), (ax-dx, ay-dy)], color)

    t = game.elapsed
    cx, cy = BOX_CENTER
    practice = hasattr(game, "practice_attack")
    rect(0, 0, 600, 480, "#050712")
    for index in range(45):
        x = (index * 137.51) % 590 - 295
        y = (index * 83.7 - t * (2 + index % 3)) % 470 - 235
        size = 1 if index % 3 else 2
        rect(x, y, size, size, "#445378" if index % 3 else "#8092bb")
    # A square containment field leaves room for the hovering Core above it.
    rect(cx, cy, 312, 312, "#10152b", "#1c2850", 1)
    rect(cx, cy, 300, 300, "#080d1e", "#64efff", 2)
    for offset in (-75, 0, 75):
        line(-149, cy+offset, 149, cy+offset, .6, "#14213a")
        line(offset, cy-149, offset, cy+149, .6, "#14213a")
    for node, (x, y) in enumerate(NODES):
        selected = (x, y) == (game.x, game.y)
        color = CYAN if selected else "#344766"
        oval(x, y, 20 if selected else 17, outline=color, width=1)
        if selected:
            oval(x, y, 25 + math.sin(t * 8) * 2, outline="#1c5b74")
        else:
            rect(x, y, 3, 3, "#536c88")
    for x in (-BOX_HALF, BOX_HALF):
        for y in (cy-BOX_HALF, cy+BOX_HALF):
            rect(x, y, 11, 11, CYAN)
    # Hazards are clipped to the same box used by the survival rules.
    commands.append(dict(kind="clip_start", coords=[-150, -cy-150, 150, -cy+150]))
    for hazard in game.hazards:
        x, y = hazard.position
        active = hazard.active
        blink = int(hazard.age * 16) % 2
        color = HOT if active else AMBER if blink else "#a68047"
        if not active and (hazard.vx or hazard.vy):
            # Incoming walls and rain announce their entry at the box border.
            x = max(-142, min(142, x))
            y = max(cy-142, min(cy+142, y))
        if hazard.kind in ("circle", "orbit"):
            if active:
                oval(x, y, hazard.size+5, fill="#ff527e24")
                oval(x, y, hazard.size, fill="#ff527e", outline="#ffe4ef", width=1.5)
                if hazard.size > 14:
                    oval(x, y, hazard.size*.6, fill="#9b264b")
            else:
                oval(x, y, hazard.size, fill="#ffcf7412", outline=color, width=1.5)
                line(x-8, y, x+8, y, 1, color)
                line(x, y-8, x, y+8, 1, color)
        elif hazard.kind == "ring":
            oval(x, y, hazard.size, outline="#ff527e24" if active else "#ffcf7422",
                 width=hazard.height+9)
            oval(x, y, hazard.size, outline=color, width=hazard.height if active else 2)
            if active:
                oval(x, y, hazard.size, outline="#ffe4ef", width=2)
        elif hazard.kind == "rect":
            rect(x, y, hazard.size, hazard.height, "#ff527e" if active else "#ffcf7422", color, 2)
        elif hazard.kind == "beam":
            dx, dy = math.cos(hazard.angle)*hazard.size/2, math.sin(hazard.angle)*hazard.size/2
            if active:
                line(x-dx, y-dy, x+dx, y+dy, hazard.height+8, "#ff527e30")
                line(x-dx, y-dy, x+dx, y+dy, hazard.height, HOT)
                line(x-dx, y-dy, x+dx, y+dy, 5, "#fff3f7")
            else:
                line(x-dx, y-dy, x+dx, y+dy, hazard.height, "#ffcf7417")
                line(x-dx, y-dy, x+dx, y+dy, 2, color)
    commands.append(dict(kind="clip_end", coords=[]))

    # Galactic med packs: a nebula halo, orbiting stars, and a luminous cross.
    for pickup in game.healing_pickups:
        x, y = pickup.x, pickup.y
        pulse = 1 + .12 * math.sin(t*6)
        oval(x, y, 24*pulse, fill="#a488ff20", outline="#a488ff66")
        oval(x, y, 18*pulse, fill="#65f5ff18")
        poly([(x-12, y+7), (x-5, y+12), (x+8, y+12), (x+12, y+6),
              (x+12, y-8), (x+5, y-12), (x-8, y-12), (x-12, y-5)],
             "#161436", CYAN, 1.5)
        line(x-9, y+8, x+7, y+10, 2, VIOLET)
        rect(x, y, 5, 16, "#a0ffdf")
        rect(x, y, 16, 5, "#a0ffdf")
        rect(x, y, 3, 10, "#ffffff")
        for index in range(4):
            angle = t*1.8 + index*math.tau/4
            sx, sy = x+math.cos(angle)*21, y+math.sin(angle)*16
            poly([(sx, sy+3), (sx+1, sy+1), (sx+3, sy), (sx+1, sy-1),
                  (sx, sy-3), (sx-1, sy-1), (sx-3, sy), (sx-1, sy+1)],
                 CYAN if index % 2 else "#e3d1ff")
        text(x, y-25 if y > cy else y+25, "+1 HP", "#a0ffdf", 8)

    # Mechanical black hole: tilted plasma disk, segmented armor, rotating photon ring.
    bx, by = game.boss_x, game.boss_y + math.sin(t * 1.8) * 3
    destroying = game.stage == "laser"
    if destroying:
        bx += math.sin(t * 91) * game.stage_age * 4
    oval(bx, by, 80, 66, fill="#8b63ff0b")
    oval(bx, by, 69, 58, fill="#8b63ff12")
    for radius, color, width in ((88, "#a488ff1c", 9), (81, "#a488ff65", 3), (74, VIOLET, 2)):
        oval(bx, by, radius, radius * .25, outline=color, width=width)
    for index in range(8):
        a = index * math.tau / 8 + .12 * math.sin(t*.5)
        points = [(bx + math.cos(a+da)*radius, by + math.sin(a+da)*radius*.86)
                  for da, radius in ((-.21, 49), (-.17, 65), (.17, 65), (.21, 49))]
        poly(points, "#202a44", "#65738e", 1)
        led = CYAN if game.shielded else HOT
        line(bx+math.cos(a-.09)*59, by+math.sin(a-.09)*51,
             bx+math.cos(a+.09)*59, by+math.sin(a+.09)*51, 3, led)
    oval(bx, by, 49, fill="#03040c", outline="#59647d", width=4)
    oval(bx, by, 43, outline="#9a6aff50", width=7)
    oval(bx, by, 39, fill="#000107", outline="#c3a5ff", width=2)
    oval(bx, by, 33, outline="#2a194f", width=1)
    for index in range(25):
        angle = t*1.9 + index*math.tau/25
        radius = 41 + (index%3)*1.4
        oval(bx+math.cos(angle)*radius, by+math.sin(angle)*radius, 1.2,
             fill=CYAN if index%4 == 0 else "#cfadff")
    # Foreground arc crosses the otherwise completely dark event horizon.
    for index in range(28):
        angle = index*math.pi/27
        x, y = bx+math.cos(angle)*78, by-2-math.sin(angle)*16
        oval(x, y, 2.1, 1.3, fill=CYAN if (index+int(t*16))%6 < 2 else VIOLET)
    if game.shielded:
        oval(bx, by, 70, 61, outline="#65f5ff48", width=1)
    text(0, 230, "S I N G U L A R I T Y   C O R E", "#d9d7fa", 12)
    subtitle = (f"TEMPORARY PRACTICE · {game.attacks_completed} REPEATS SURVIVED" if practice else
                "SHIELD LOCKED · 15 SURVIVAL PROTOCOLS" if game.shielded else "EVENT HORIZON EXPOSED")
    text(0, 216, subtitle, "#8198bd" if game.shielded else HOT, 9)
    # Protocol progress is separate from boss HP; early shots cannot chip away at it.
    for index in range(15):
        color = CYAN if index < game.attacks_completed else VIOLET if index == game.attack_index else "#243047"
        if practice:
            color = CYAN if index == game.practice_attack else "#243047"
        rect(-126+index*18, 97, 13, 3,
             color)
    if game.stage == "attack":
        remaining = 1-game.stage_age/ATTACKS[game.attack_index].duration
        rect(0, cy-157, 300, 2, "#1e2a44")
        rect(-150+150*remaining, cy-157, 300*remaining, 2, VIOLET)
    text(-223, 39, "HOLD", "#8095b3", 10)
    text(-223, 19, "↑", CYAN, 20)
    text(-223, -8, "←  →", CYAN, 20)
    text(-223, -35, "↓", CYAN, 20)
    text(-223, -66, "TELEPORT", "#8095b3", 9)
    text(223, 30, "RELEASE", "#8095b3", 10)
    text(223, 4, "◎", CYAN, 24)
    text(223, -24, "CENTER", "#8095b3", 9)
    text(223, -74, "10 HP", "#c6c6e6", 12)
    text(223, -92, "PACK / 3 ATTACKS", CYAN, 8)
    if game.stage == "practice_ready":
        text(0, cy+90, "GET READY", CYAN, 15)
        text(0, cy+68, ATTACKS[game.attack_index].name, "#d4d8ef", 11)
        text(0, cy+41, str(max(1, math.ceil(game.ready_time-game.stage_age))), VIOLET, 23)
    elif game.stage == "intro":
        text(0, cy+26, "CONTAINMENT ONLINE", CYAN, 15)
        text(0, cy+5, "HOLD ARROWS · RELEASE TO CENTER", "#d4d8ef", 10)
        text(0, cy-19, str(max(1, math.ceil(INTRO_DURATION-game.stage_age))), VIOLET, 23)
    elif game.stage == "break":
        text(0, cy+10, "PROTOCOL SURVIVED", CYAN, 14)
        text(0, cy-12, f"{game.attacks_completed} / 15", "#d4d8ef", 12)
    elif game.stage == "attack" and game.attack_index == 12 and game.stage_age < 2.1:
        text(0, cy+28, "MEMORIZE", AMBER, 13)
        text(0, cy, "  ".join(NODE_KEYS[n] for n in game.memory), "#f2e7c6", 20)
    elif game.laser_ready:
        text(0, cy+30, "SHIELD OFFLINE", HOT, 16)
        text(0, cy+7, "PRESS F TO FIRE", CYAN, 17)
        text(0, cy-17, "ANNIHILATION LASER READY", "#d9d7fa", 10)
    if destroying:
        width = 22 + 9*math.sin(t*38)
        line(game.x, game.y+14, bx, by, width+30, "#a488ff44")
        line(game.x, game.y+14, bx, by, width+12, VIOLET)
        line(game.x, game.y+14, bx, by, width, CYAN)
        line(game.x, game.y+14, bx, by, width*.5, "#ffffff")
        for index in range(12):
            angle = index*math.tau/12+t*3
            radius = 15+game.stage_age*82
            line(bx+math.cos(angle)*40, by+math.sin(angle)*40,
                 bx+math.cos(angle)*radius, by+math.sin(angle)*radius, 3, CYAN)
        oval(bx, by, 15+game.stage_age*25, fill="#ffffff", outline=VIOLET, width=5)
    if game.won:
        oval(bx, by, 52, fill="#050712")
        text(0, by, "CORE ERASED", CYAN, 14)
    return commands
