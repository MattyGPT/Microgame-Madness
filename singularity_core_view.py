"""Procedural machinery, accretion disk, teleport grid, and shared hazard artwork."""

import math

from singularity_core import (ATTACKS, BOX_CENTER, BOX_HALF, ECHO_STEPS, INTRO_DURATION, NODES,
                              LASER_CONTACT, LASER_WHITEN, LASER_IMPLODE, LASER_SHATTER)
from pumpkin_king_view import mix, happy_laugh_mouth


CYAN = "#65f5ff"
VIOLET = "#a488ff"
HOT = "#ff527e"
AMBER = "#ffcf74"
SAFE = "#8affba"


def draw_core(game):
    if game.won or game.stage == "laser" and game.stage_age >= LASER_SHATTER:
        return _shattered_arena(game)
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

    protocol = game.attack_index
    protocol_color = ("#ff718c", "#d47dff", "#b897ff", "#ff8669", "#e374ff",
                      "#ffbe68", "#a8b7ef", "#ffa7cf", "#ff9760", "#bb78f5",
                      "#ff79be", "#ffc291", "#f080db", "#d3a2ff", "#f06ea6")[protocol]
    t = game.elapsed
    total_collapse = game.stage == "attack" and protocol == 14
    intensity = min(1, game.stage_age/ATTACKS[14].duration) if total_collapse else 0
    finale = game.stage == "laser"
    age = game.stage_age if finale else 0
    collapse = max(0, min(1, (age-LASER_IMPLODE)/(LASER_SHATTER-LASER_IMPLODE))) if finale else 0
    cx, cy = BOX_CENTER
    practice = hasattr(game, "practice_attack")
    rect(0, 0, 600, 480, "#050712")
    for index in range(45):
        x = (index * 137.51) % 590 - 295
        y = (index * 83.7 - t * (2 + index % 3)) % 470 - 235
        size = 1 if index % 3 else 2
        if collapse:
            dx, dy = x-game.boss_x, y-game.boss_y
            angle = math.atan2(dy, dx)+collapse*collapse*3
            radius = math.hypot(dx, dy)*(1-collapse)**2
            x = game.boss_x+math.cos(angle)*radius
            y = game.boss_y+math.sin(angle)*radius
            line(x, y, x+math.cos(angle+.2)*min(19, radius*.2),
                 y+math.sin(angle+.2)*min(19, radius*.2), 1, "#c0dfff")
        rect(x, y, size, size, "#445378" if index % 3 else "#8092bb")
    if total_collapse:
        # A galaxy winds around the arena, gathering speed toward the finale.
        for band in range(5):
            oval(cx, cy, 215+band*15, 160+band*12,
                 outline=("#6736ae18", "#b34d9c18", "#477cbb18")[band%3], width=14)
        for index in range(90):
            phase = (index/90-t*(.035+intensity*.025))%1
            radius = 165+phase*160
            angle = index*2.399+t*(.12+intensity*.15)+phase*3
            x, y = cx+math.cos(angle)*radius, cy+math.sin(angle)*radius*.75
            if abs(x) > 162 or abs(y-cy) > 162:
                tail = .02+intensity*.035
                line(x,y,cx+math.cos(angle-tail)*(radius+5),
                     cy+math.sin(angle-tail)*(radius+5)*.75, 1,
                     ("#8c77b3", "#88b5d7", "#d795ba")[index%3])
    # A square containment field leaves room for the hovering Core above it.
    rect(cx, cy, 312, 312, "#10152b", "#1c2850", 1)
    rect(cx, cy, 300, 300, "#080d1e", "#64efff", 2)
    if total_collapse:
        commands.append(dict(kind="clip_start", coords=[-150, -cy-150, 150, -cy+150]))
        # Dim spiral arms stay behind the grid, nodes, and actual hazards.
        for arm in range(3):
            for k in range(36):
                p = k/35
                angle = arm*math.tau/3+p*5-t*(.35+intensity*.3)
                radius = 12+p*190
                x, y = cx+math.cos(angle)*radius, cy+math.sin(angle)*radius*.8
                oval(x,y,5+p*8,3+p*5,fill=("#7443bf12", "#c64c9b10", "#488cca12")[arm])
        commands.append(dict(kind="clip_end", coords=[]))
        rect(cx, cy, 306, 306, "", mix(VIOLET, "#ffd9f3", intensity*.6), 2)
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
    orbit = next((h for h in game.hazards if h.kind == "orbit" and h.orbit_power > 2), None)
    if orbit:
        # Use the collision path itself so the guide previews the real sweep.
        poly([orbit.orbit_position(step * math.tau / 96) for step in range(96)],
             "", "#ffcf7466" if not orbit.active else "#76536c", 1)
    for hazard in game.hazards:
        x, y = hazard.position
        active = hazard.active
        blink = int(hazard.age * 16) % 2
        color = protocol_color if active else AMBER if blink else "#a68047"
        if hazard.harmless:
            color = CYAN if active else VIOLET
        if not active and (hazard.vx or hazard.vy):
            # Incoming walls and rain announce their entry at the box border.
            x = max(-142, min(142, x))
            y = max(cy-142, min(cy+142, y))
        if hazard.kind in ("circle", "orbit"):
            if active:
                oval(x, y, hazard.size+5, fill="#65f5ff24" if hazard.harmless else "#ff527e24")
                oval(x, y, hazard.size, fill="#65f5ff30" if hazard.harmless else protocol_color,
                     outline=CYAN if hazard.harmless else "#ffe4ef", width=1.5)
                if hazard.size > 14:
                    oval(x, y, hazard.size*.6, fill="#163f54" if hazard.harmless else "#9b264b")
            else:
                oval(x, y, hazard.size, fill="#65f5ff12" if hazard.harmless else "#ffcf7412",
                     outline=color, width=1.5)
                line(x-8, y, x+8, y, 1, color)
                line(x, y-8, x, y+8, 1, color)
        elif hazard.kind == "ring":
            if total_collapse and active:
                oval(x, y, hazard.size, outline="#aa71ff38", width=hazard.height+18)
                oval(x, y, hazard.size+hazard.height*.3, outline="#aadfff", width=1.5)
                oval(x, y, max(1, hazard.size-hazard.height*.3), outline="#ffd0ee", width=1.5)
            oval(x, y, hazard.size, outline="#ff527e24" if active else "#ffcf7422",
                 width=hazard.height+9)
            oval(x, y, hazard.size, outline=color, width=hazard.height if active else 2)
            if active:
                oval(x, y, hazard.size, outline="#ffe4ef", width=2)
        elif hazard.kind == "rect":
            rect(x, y, hazard.size, hazard.height, protocol_color if active else "#ffcf7422", color, 2)
        elif hazard.kind == "beam":
            dx, dy = math.cos(hazard.angle)*hazard.size/2, math.sin(hazard.angle)*hazard.size/2
            if active:
                line(x-dx, y-dy, x+dx, y+dy, hazard.height+8, "#ff527e30")
                line(x-dx, y-dy, x+dx, y+dy, hazard.height, protocol_color)
                line(x-dx, y-dy, x+dx, y+dy, 5, "#fff3f7")
            else:
                line(x-dx, y-dy, x+dx, y+dy, hazard.height, "#ffcf7417")
                line(x-dx, y-dy, x+dx, y+dy, 2, color)
        # Protocol-specific details stay within the collision silhouette. Amber
        # warnings and cyan harmless previews keep their shared meaning.
        ink = "#fff3e5" if active else color
        accent = color if not active or hazard.harmless else protocol_color
        radius = max(1, hazard.size)
        if hazard.kind == "beam":
            ux, uy = math.cos(hazard.angle), math.sin(hazard.angle)
            nx, ny = -uy, ux
            half = hazard.height/2
            if protocol in (0, 8):
                # Parallel accelerator rails; engine pistons advance along them.
                for side in (-1, 1):
                    line(x-dx+nx*half*side, y-dy+ny*half*side,
                         x+dx+nx*half*side, y+dy+ny*half*side, 1.5, accent)
                for k in range(13):
                    distance = ((k/13+t*(.7 if protocol == 0 else -.4))%1-.5)*hazard.size
                    px, py = x+ux*distance, y+uy*distance
                    line(px-nx*half*.65, py-ny*half*.65,
                         px+nx*half*.65, py+ny*half*.65, 2, ink)
            elif protocol == 1:
                # Curving filaments evoke an accretion disk feeding the blade.
                for side in (-1, 1):
                    points = []
                    for k in range(25):
                        d = (k/24-.5)*hazard.size
                        bend = math.sin(k*.4-t*5)*half*.55*side
                        points.append((x+ux*d+nx*bend, y+uy*d+ny*bend))
                    for a, b in zip(points, points[1:]):
                        line(*a, *b, 1.5, ink)
            elif protocol == 13:
                # Angular prisms split the light into offset colored facets.
                for k in range(10):
                    d = (k/9-.5)*hazard.size
                    px, py = x+ux*d, y+uy*d
                    poly([(px-ux*12, py-uy*12), (px+nx*half*.8, py+ny*half*.8),
                          (px+ux*12, py+uy*12), (px-nx*half*.8, py-ny*half*.8)],
                         "", ink if k%2 else accent, 1.5)
        elif hazard.kind == "rect" and protocol == 6:
            # Beveled metal blade with a sharp luminous cutting edge.
            w, h = hazard.size, hazard.height
            rect(x, y, max(1, w-8), max(1, h-8), "#222c46", accent, 2)
            if hazard.vx:
                edge = x+math.copysign(w/2-2, hazard.vx)
                line(edge, y-h/2, edge, y+h/2, 3, ink)
                for k in range(12):
                    py = y-h/2+(k+.5)*h/12
                    line(x-w*.3, py-6, x+w*.3, py+6, 2, accent)
            else:
                edge = y+math.copysign(h/2-2, hazard.vy)
                line(x-w/2, edge, x+w/2, edge, 3, ink)
                for k in range(12):
                    px = x-w/2+(k+.5)*w/12
                    line(px-6, y-h*.3, px+6, y+h*.3, 2, accent)
        elif hazard.kind == "ring":
            # Photon horizon segments stream inward; collapse breaks into shards.
            for k in range(24):
                a = k*math.tau/24+t*(.35 if protocol == 2 else -1)
                r = radius
                spread = hazard.height*.35
                points = [(x+math.cos(a+da)*rr, y+math.sin(a+da)*rr)
                          for da, rr in ((-.035,r-spread),(0,r+spread),(.035,r-spread))]
                poly(points, ink if k%3 == 0 else accent)
        elif hazard.kind in ("circle", "orbit"):
            if protocol == 3:
                # Target brackets tighten before the missile detonates.
                r = radius*(.9 if active else 1-.15*min(1, hazard.age/hazard.warning))
                for sx in (-1, 1):
                    for sy in (-1, 1):
                        px, py = x+sx*r*.67, y+sy*r*.67
                        line(px, py, px-sx*8, py, 2, ink)
                        line(px, py, px, py-sy*8, 2, ink)
                oval(x, y, radius*.32, outline=ink, width=2)
            elif protocol == 4:
                # Interlocking circuit diamonds and a hot junction.
                for scale in (.85, .55):
                    poly([(x,y+radius*scale),(x+radius*scale,y),
                          (x,y-radius*scale),(x-radius*scale,y)], "", ink, 1.5)
                rect(x, y, 5, 5, ink)
            elif protocol == 5:
                # Stellar plasma, rotating flare petals, and a white-hot core.
                for k in range(8):
                    a = k*math.tau/8+t*1.8
                    poly([(x+math.cos(a-.18)*radius*.5,y+math.sin(a-.18)*radius*.5),
                          (x+math.cos(a)*radius*.95,y+math.sin(a)*radius*.95),
                          (x+math.cos(a+.18)*radius*.5,y+math.sin(a+.18)*radius*.5)], ink)
                oval(x, y, radius*.4, fill=ink)
            elif protocol == 7:
                # A compact photon with a luminous falling streak inside its disk.
                line(x-2, y+radius*.65, x+1, y-radius*.6, 3, ink)
                oval(x, y-radius*.25, radius*.3, fill="#ffffff" if active else accent)
            elif protocol == 9:
                # A dark nucleus held inside a spiked containment mine.
                points = [(x+math.cos(k*math.pi/8+t*.5)*radius*(.92 if k%2 == 0 else .65),
                           y+math.sin(k*math.pi/8+t*.5)*radius*(.92 if k%2 == 0 else .65)) for k in range(16)]
                poly(points, "#100b24", accent, 2)
                oval(x, y, radius*.32, outline=ink, width=2)
                oval(x, y, 3, fill=ink)
            elif protocol == 10:
                # Magnetic poles visibly alternate between positive and negative.
                oval(x, y, radius*.75, outline=ink, width=2)
                line(x-10,y,x+10,y,3,ink)
                if abs(x-cx)+abs(y-cy) < 1:
                    line(x,y-10,x,y+10,3,ink)
            elif protocol == 11:
                points = [(x+math.cos(k*math.pi/12-t*6)*radius*(.96 if k%2 == 0 else .68),
                           y+math.sin(k*math.pi/12-t*6)*radius*(.96 if k%2 == 0 else .68)) for k in range(24)]
                poly(points, "#34425a", ink, 1)
                oval(x, y, radius*.35, fill="#111827", outline=accent, width=2)
            elif protocol == 12:
                # Repeated wavefronts make the memory sequence look like echoes.
                for k in range(3):
                    r = radius*(.2+.7*((t*.8+k/3)%1))
                    oval(x, y, r, outline=ink if k == 0 else accent, width=1.5)
            elif protocol == 14:
                # Each blast becomes a miniature galaxy with a dark horizon.
                if active:
                    oval(x, y, radius*.78, radius*.38, outline="#ffdaef", width=2)
                    oval(x, y, radius*.6, radius*.28, outline="#a6cfff", width=1.5)
                for k in range(15):
                    a = k*2.399+t*3
                    r = radius*(.2+.7*((k/15-t*(.7+intensity*.4))%1))
                    px, py = x+math.cos(a)*r, y+math.sin(a)*r
                    line(px, py, px-math.sin(a)*5, py+math.cos(a)*5, 2, ink)
                oval(x, y, radius*.22, fill="#050712", outline=accent)
    if game.echo_preview:
        x, y = NODES[game.memory[game.echo_step]]
        oval(x, y, 36, fill="#8affba18")
        oval(x, y, 29, outline=SAFE, width=3)
        oval(x, y, 24, outline="#e1ffec", width=1)
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
    bx, by = game.boss_x, game.boss_y if finale else game.boss_y + math.sin(t * 1.8) * 3
    destroying = game.stage == "laser"
    if destroying:
        bx += math.sin(t * 91)*min(3, age*2)*(1-collapse)
    if total_collapse:
        # Energized coronal arcs make the boss visibly strain at containment.
        for band in range(3):
            radius = 74+band*9+math.sin(t*3+band)*2
            for k in range(16):
                angle = k*math.tau/16+t*(.3+band*.15)
                end = angle+.12+intensity*.1
                line(bx+math.cos(angle)*radius,by+math.sin(angle)*radius*.63,
                     bx+math.cos(end)*radius,by+math.sin(end)*radius*.63,
                     1.5, ("#f5b2ec", "#ad94ff", "#8edcff")[band])
    machinery_start = len(commands)
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
    if not game.alive and not game.won:
        # A luminous grin emerges inside the dark event horizon after defeat.
        laugh_age = getattr(game, "defeat_laugh_age", 0)
        poly(happy_laugh_mouth(bx, by-7, 35, 18, laugh_age), "#d9b8ff", VIOLET, 1)
        for side in (-1, 1):
            for i in range(8):
                ax = bx+side*13-6+i*1.5
                ay = by+9+4*math.sin(i*math.pi/7)
                line(ax, ay, ax+1.5, by+9+4*math.sin((i+1)*math.pi/7), 2, CYAN)
    if game.shielded:
        oval(bx, by, 70, 61, outline="#65f5ff48", width=1)
    if finale:
        white = max(0, min(1, (age-LASER_WHITEN)/(LASER_IMPLODE-LASER_WHITEN)))
        oval(bx, by, 38, fill=mix("#000107", "#ffffff", white),
             outline=mix("#c3a5ff", "#ffffff", white), width=2)
        if white:
            oval(bx, by, 43+white*6, outline=f"#ffffff{round(white*110):02x}", width=5)
        if collapse:
            # Machinery and the newly white horizon crush inward together.
            scale = max(.008, (1-collapse)**1.6)
            for command in commands[machinery_start:]:
                command["coords"] = [bx+(v-bx)*scale if i%2 == 0 else -by+(v+by)*scale
                                     for i, v in enumerate(command["coords"])]
                if "width" in command:
                    command["width"] *= max(.15, scale)
            for index in range(24):
                angle = index*2.399+collapse*6
                radius = (75+index%6*25)*(1-collapse)**1.7
                oval(bx+math.cos(angle)*radius, by+math.sin(angle)*radius*.75,
                     1.2, fill="#ffffff")
    text(0, 230, "S I N G U L A R I T Y   C O R E", "#d9d7fa", 12)
    subtitle = ("FINAL CUTSCENE · PRACTICE PREVIEW" if game.difficulty == "final_cutscene" else
                f"TEMPORARY PRACTICE · {game.attacks_completed} REPEATS SURVIVED" if practice else
                "SHIELD LOCKED · 15 SURVIVAL PROTOCOLS" if game.shielded else "EVENT HORIZON EXPOSED")
    if total_collapse:
        subtitle = "FINAL PROTOCOL · TOTAL COLLAPSE"
    text(0, 216, subtitle, "#8198bd" if game.shielded else protocol_color, 9)
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
    elif game.laser_ready:
        text(0, cy+30, "SHIELD OFFLINE", HOT, 16)
        text(0, cy+7, "PRESS F TO FIRE", CYAN, 17)
        text(0, cy-17, "ANNIHILATION LASER READY", "#d9d7fa", 10)
    if game.echo_step is not None:
        text(223, -125, "SAFE PREVIEW" if game.echo_preview else "YOUR TURN",
             SAFE if game.echo_preview else protocol_color, 9)
        text(223, -145, f"{game.echo_step + 1} / {ECHO_STEPS}", "#d4d8ef", 12)
    if destroying:
        width = 22 + 9*math.sin(t*38)
        reach = min(1, age/LASER_CONTACT)
        target_x = game.x+(bx-game.x)*reach
        target_y = game.y+14+(by-game.y-14)*reach
        for thickness, color in ((width+30, "#a488ff44"), (width+12, VIOLET),
                                 (width, CYAN), (width*.5, "#ffffff")):
            line(game.x, game.y+14, target_x, target_y, thickness*(1-collapse*.7), color)
        # The beam remains continuous right into the white, contracting core.
        if age >= LASER_CONTACT:
            oval(bx, by, max(2, 9*(1-collapse)), fill="#ffffff")
    return commands


def _shattered_arena(game):
    """The Core detonates through the containment box and its surrounding HUD."""
    age = game.stage_age-LASER_SHATTER if not game.won else 1.7
    commands = [dict(kind="rectangle", coords=[-300, -240, 300, 240], fill="#050712")]
    bx, by = game.boss_x, game.boss_y
    def polygon(points, color):
        commands.append(dict(kind="polygon", coords=[v for x, y in points for v in (x, -y)], fill=color))
    def ring(radius, width, color):
        commands.append(dict(kind="oval", coords=[bx-radius, -by-radius, bx+radius, -by+radius],
                             fill="", outline=color, width=width))
    flash = max(0, 1-age/.22)
    if flash:
        commands.append(dict(kind="rectangle", coords=[-300, -240, 300, 240],
                             fill=f"#d9faff{round(flash*255):02x}"))
    ring(20+age*520, max(1, 12-age*6), "#a9f5ff")
    ring(10+age*350, max(1, 6-age*3), "#a488ff")
    # These shards start at the actual containment edges, grid, progress bar,
    # and outer arena rim, rather than at unrelated random screen positions.
    sources = []
    for index in range(17):
        p = index/16
        for edge in (-1, 1):
            sources.extend(((edge*150, BOX_CENTER[1]-150+p*300, CYAN),
                            (-150+p*300, BOX_CENTER[1]+edge*150, CYAN),
                            (edge*299, -235+p*470, "#45534b")))
    sources += [(-126+i*18, 97, CYAN) for i in range(15)]
    sources += [(x, y, VIOLET) for y in (-145, -70, 5, 216, 230) for x in range(-135, 136, 30)]
    for index, (x, y, color) in enumerate(sources):
        angle = math.atan2(y-by, x-bx)+math.sin(index*7)*.25
        speed = 75+index%9*23
        sx = x+math.cos(angle)*speed*age
        sy = y+math.sin(angle)*speed*age-55*age*age
        spin = index*1.7+age*(2+index%7)
        size = (4+index%4)*max(.1, 1-age/2)
        polygon([(sx+math.cos(spin+a)*size, sy+math.sin(spin+a)*size)
                 for a in (0, 2.2, 4)], color)
    for index in range(38):
        angle = index*2.399
        radius = age*(90+index%8*42)
        x, y = bx+math.cos(angle)*radius, by+math.sin(angle)*radius-age*age*45
        size = max(.5, 3-age)
        polygon(((x-size,y-size), (x+size,y-size), (x+size,y+size), (x-size,y+size)), "#ffffff")
    return commands
