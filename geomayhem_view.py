"""Canvas command renderer; original geometric art, with three weapon forms."""
import math

from geomayhem_weapons import ARMORY
from geomayhem_arenas import draw_background


def draw_geomayhem(game, *, compact=False, include_background=True, background_only=False):
    # Full geometry remains available for standalone consumers and visual comparisons.
    commands = []

    def polygon(x, y, radius, sides, color, outline="", angle=0, star=False, width=2):
        if compact:
            commands.append({"kind": "geomayhem_polygon", "coords": [x, -y], "radius": radius,
                             "sides": sides, "fill": color, "outline": outline, "angle": angle,
                             "star": star, "width": width})
            return
        points = []
        count = sides * 2 if star else sides
        for i in range(count):
            a = angle + math.tau * i / count
            r = radius * (.52 if star and i % 2 else 1)
            points.extend((x + math.cos(a) * r, -y - math.sin(a) * r))
        commands.append({"kind": "polygon", "coords": points, "fill": color, "outline": outline, "width": width})

    def rect(x, y, w, h, color, outline=""):
        commands.append({"kind": "rectangle", "coords": [x-w/2, -y-h/2, x+w/2, -y+h/2], "fill": color, "outline": outline})

    def circle(x, y, r, color="", outline="", width=2):
        commands.append({"kind": "oval", "coords": [x-r, -y-r, x+r, -y+r], "fill": color, "outline": outline, "width": width})

    def line(x, y, ex, ey, width, color):
        a = math.atan2(ey-y, ex-x)
        dx, dy = -math.sin(a)*width/2, math.cos(a)*width/2
        commands.append({"kind": "polygon", "coords": [x+dx, -y-dy, ex+dx, -ey-dy, ex-dx, -ey+dy, x-dx, -y+dy], "fill": color})

    def weapon_art(x, y, weapon, stars, angle=0, size=8):
        if compact:
            commands.append({"kind": "geomayhem_weapon", "coords": [x, -y], "weapon_kind": weapon.kind,
                             "fill": weapon.color, "stars": stars, "angle": angle, "size": size})
            return
        sides = {"bolt": 3, "fan": 4, "ring": 8, "beam": 4, "orbit": 6, "mine": 5, "boomerang": 3, "nova": 10, "drone": 6}[weapon.kind]
        if stars >= 5:
            polygon(x, y, size + 8, 8, "", weapon.color, angle, star=True)
            circle(x, y, size + 3, outline="#ffffff", width=1)
        elif stars >= 3:
            polygon(x, y, size + 4, 6, "", weapon.color, -angle)
        polygon(x, y, size, sides, weapon.color, "#efffff" if stars >= 3 else "#183042", angle,
                star=weapon.kind in ("ring", "orbit", "nova"))
        if stars >= 3:
            polygon(x, y, size * .42, 4, "#ffffff", angle=angle)

    if include_background:
        draw_background(game, rect, circle, line, polygon)
        for x in (game.left + 12, game.right - 12):
            for y in (game.bottom + 12, game.top - 12):
                rect(x, y, 20, 2, game.accent)
                rect(x, y, 2, 20, game.accent)
    if background_only:
        return commands
    for zone in game.zones:
        start = len(commands)
        color = "#ffce65" if zone["warning"] > 0 else "#ff526a"
        x, y = zone["x"], zone["y"]
        if zone["shape"] == "rect":
            rect(x,y,zone["w"],zone["h"],color,color)
        elif zone["shape"] == "beam":
            line(x,y,zone["ex"],zone["ey"],zone["width"],color)
            commands[-1].update(outline=color,width=2)
            x,y=(x+zone["ex"])/2,(y+zone["ey"])/2
        elif zone["shape"] == "ring":
            circle(x,y,zone["r"],outline=color,width=zone["width"])
        else:
            circle(x,y,zone["r"],color,color)
        for command in commands[start:]:
            command["opacity"] = .25 if zone["warning"] > 0 else .48
            if zone["warning"] > 0: command["dash"] = [8,5]
        if zone["shape"] != "ring":
            commands.append({"kind":"text","coords":[x,-y],"fill":color,"font":["Arial",17],"text":"!"})
    for x, y, value in game.gems:
        polygon(x, y, 5 if value < 10 else 8, 4, "#70f6d4", "#e0fff5")
    enemy_start = len(commands)
    for enemy in game.enemies:
        color = {"chaser": "#fa7e93", "runner": "#ffbc66", "tank": "#b29afa", "shooter": "#ffdf79",
                 "flanker": "#ff9258", "elite": "#fb85e0", "boss": "#ff575f"}[enemy.kind]
        sides = {"chaser": 4, "runner": 3, "tank": 6, "shooter": 5, "flanker": 3, "elite": 8, "boss": 10}[enemy.kind]
        if enemy.windup > 0 and enemy.dash_target:
            line(enemy.x,enemy.y,*enemy.dash_target,enemy.radius*2+20,"#ffd36d")
            commands[-1]["opacity"] = .22
            line(enemy.x,enemy.y,*enemy.dash_target,2,"#ffe6a3")
            circle(enemy.x,enemy.y,enemy.radius+7,outline="#ffd36d",width=3)
        elif enemy.dash_left > 0:
            line(enemy.x-enemy.dash_vector[0]*32,enemy.y-enemy.dash_vector[1]*32,enemy.x,enemy.y,8,"#ff795c")
        if enemy.kind in ("shooter","elite","boss") and enemy.attack_in < .45:
            circle(enemy.x,enemy.y,enemy.radius+5,outline="#fff4af",width=2)
        if enemy.frozen:
            color = "#a6f7ff"
        if compact:
            commands.append({"kind":"geomayhem_enemy", "coords":[enemy.x,-enemy.y],
                             "radius":enemy.radius,"sides":sides,"fill":color,
                             "angle":game.elapsed*.3,"star":enemy.kind=="boss","burn":bool(enemy.burn),
                             "health":max(0,enemy.hp)/enemy.max_hp if enemy.hp<enemy.max_hp or enemy.kind in ("boss","elite") else None})
        else:
            polygon(enemy.x, enemy.y, enemy.radius, sides, color, "#fff0dc", angle=game.elapsed*.3, star=enemy.kind == "boss")
            if enemy.burn:
                circle(enemy.x, enemy.y, enemy.radius+3, outline="#ff8a42")
            rect(enemy.x-4, enemy.y+2, 3, 4, "#152033")
            rect(enemy.x+4, enemy.y+2, 3, 4, "#152033")
            if enemy.hp < enemy.max_hp or enemy.kind in ("boss", "elite"):
                rect(enemy.x, enemy.y+enemy.radius+6, enemy.radius*2, 3, "#44283d")
                width = enemy.radius*2*max(0, enemy.hp)/enemy.max_hp
                rect(enemy.x-enemy.radius+width/2, enemy.y+enemy.radius+6, width, 3, color)
    for x, y, *_ in game.hazards:
        circle(x, y, 8, "#32101b", "#ffffff", 2)
        circle(x, y, 5, "#ff3557")
    friendly_start = len(commands)
    for shot in game.shots:
        start = len(commands)
        weapon_art(shot.x, shot.y, ARMORY[shot.weapon], shot.stars, shot.angle+shot.age*5,
                   10 if shot.kind in ("mine", "orbit", "boomerang") else 6)
        for command in commands[start:]:
            command["opacity"] = .38 if math.hypot(shot.x-game.x,shot.y-game.y)<85 else .68
    for effect in game.effects:
        if compact:
            commands.append({"kind":"geomayhem_effect", "coords":[effect["x"],-effect["y"]],
                             "effect":effect["kind"], "radius":effect["radius"], "fill":effect["color"],
                             "end":effect["end"],"stars":effect["stars"],"life":effect["life"],"opacity":.32})
            continue
        start = len(commands)
        if effect["kind"] == "line":
            line(effect["x"], effect["y"], *effect["end"], effect["radius"], effect["color"])
            if effect["stars"] >= 3:
                line(effect["x"], effect["y"], *effect["end"], 2, "#ffffff")
            if effect["stars"] >= 5:
                for t in (.15, .4, .7):
                    x = effect["x"] + (effect["end"][0]-effect["x"])*t
                    y = effect["y"] + (effect["end"][1]-effect["y"])*t
                    polygon(x, y, 14, 4, "", effect["color"], star=True)
        else:
            r = effect["radius"] * (1.3 - effect["life"])
            circle(effect["x"], effect["y"], r, outline=effect["color"])
            if effect["stars"] >= 3:
                polygon(effect["x"], effect["y"], r*.8, 6, "", "#ffffff")
            if effect["stars"] >= 5:
                polygon(effect["x"], effect["y"], r*1.1, 10, "", effect["color"], star=True)
        for command in commands[start:]: command["opacity"] = .32
    # Hostiles render above friendly effects so danger stays readable.
    friendly = commands[friendly_start:]
    del commands[friendly_start:]
    commands[enemy_start:enemy_start] = friendly
    if game.alive:
        for weapon_id, stars in game.loadout.items():
            if not ARMORY[weapon_id].automatic:
                continue
            dx, dy = game.companion_position(weapon_id)
            weapon = ARMORY[weapon_id]
            color = weapon.color
            if weapon.kind == "drone":
                for ox, oy in ((-10, -8), (10, -8), (-10, 8), (10, 8)):
                    line(dx, dy, dx+ox, dy+oy, 2, color)
                    circle(dx+ox, dy+oy, 4, "#102638", color, 1)
            else:
                circle(dx, dy, 15, "#102638", color, 1)
            weapon_art(dx, dy, weapon, stars, game.elapsed*2, 7)
            commands.append({"kind": "text", "coords": [dx, -dy-20], "fill": color,
                             "font": ["Arial", 10], "text": weapon.name[0] if weapon.kind == "drone"
                             else "".join(word[0] for word in weapon.name.split())})
        # Cubie's face shifts toward movement, independently of weapon aim.
        x, y = game.x, game.y
        circle(x, y, 23, "#081712", "#d8ffb4", 2)
        rect(x, y, 28, 28, "#ffffff" if game.invulnerable else "#b6ef7f", "#eaffca")
        rect(x, y-10, 26, 5, "#78b75a")
        fx, fy = game.face[0]*4, game.face[1]*4
        rect(x+fx-5, y+fy+2, 4, 5, "#183a31")
        rect(x+fx+5, y+fy+2, 4, 5, "#183a31")
        rect(x+fx, y+fy-5, 5, 2, "#183a31")
        if not ARMORY[game.weapon].automatic:
            weapon_art(x+22, y-8, ARMORY[game.weapon], game.stars, game.elapsed, 6)
        commands[-1]["role"] = "geomayhem-player"
    return commands
