"""Canvas command renderer; original geometric art, with three weapon forms."""
import math

from geomayhem_weapons import ARMORY


def draw_geomayhem(game):
    commands = []

    def polygon(x, y, radius, sides, color, outline="", angle=0, star=False, width=2):
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

    rect(0, 0, 620, 470, "#101d2b")
    for x in range(-300, 311, 40):
        rect(x, 0, 1, 470, "#1a2b3c")
    for y in range(-220, 236, 40):
        rect(0, y, 620, 1, "#1a2b3c")
    for x in (-298, 298):
        for y in (-223, 223):
            rect(x, y, 20, 2, game.accent)
            rect(x, y, 2, 20, game.accent)
    for x, y, value in game.gems:
        polygon(x, y, 5 if value < 10 else 8, 4, "#70f6d4", "#e0fff5")
    for enemy in game.enemies:
        color = {"chaser": "#fa7e93", "runner": "#ffbc66", "tank": "#b29afa", "shooter": "#ffdf79",
                 "elite": "#fb85e0", "boss": "#ff575f"}[enemy.kind]
        sides = {"chaser": 4, "runner": 3, "tank": 6, "shooter": 5, "elite": 8, "boss": 10}[enemy.kind]
        if enemy.frozen:
            color = "#a6f7ff"
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
        circle(x, y, 5, "#ff667e", "#fff0dc")
    for shot in game.shots:
        weapon_art(shot.x, shot.y, ARMORY[shot.weapon], shot.stars, shot.angle+shot.age*5,
                   10 if shot.kind in ("mine", "orbit", "boomerang") else 6)
    for effect in game.effects:
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
    if game.alive:
        for weapon_id, stars in game.loadout.items():
            if ARMORY[weapon_id].kind != "drone":
                continue
            dx, dy = game.drone_position(weapon_id)
            color = ARMORY[weapon_id].color
            for ox, oy in ((-10, -8), (10, -8), (-10, 8), (10, 8)):
                line(dx, dy, dx+ox, dy+oy, 2, color)
                circle(dx+ox, dy+oy, 4, "#102638", color, 1)
            weapon_art(dx, dy, ARMORY[weapon_id], stars, game.elapsed*2, 7)
            commands.append({"kind": "text", "coords": [dx, -dy-20], "fill": color,
                             "font": ["Arial", 10], "text": "A" if weapon_id == "drone_a" else "B"})
        # Cubie's face shifts toward movement, independently of weapon aim.
        x, y = game.x, game.y
        circle(x, y-12, 16, "#091320")
        rect(x, y, 28, 28, "#ffffff" if game.invulnerable else "#b6ef7f", "#eaffca")
        rect(x, y-10, 26, 5, "#78b75a")
        fx, fy = game.face[0]*4, game.face[1]*4
        rect(x+fx-5, y+fy+2, 4, 5, "#183a31")
        rect(x+fx+5, y+fy+2, 4, 5, "#183a31")
        rect(x+fx, y+fy-5, 5, 2, "#183a31")
        if ARMORY[game.weapon].kind != "drone":
            weapon_art(x+22, y-8, ARMORY[game.weapon], game.stars, game.elapsed, 6)
        commands[-1]["role"] = "geomayhem-player"
    return commands
