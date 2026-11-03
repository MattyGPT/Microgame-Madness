"""Procedural Pumpkin King animation, pooled canvas graphics, and synthesized audio."""

import colorsys
import math
import random
import shutil
import struct
import subprocess
import tempfile
import wave
from pathlib import Path

from pumpkin_king import Finger, COUNTER_RANGE, SCARE_WARNING, SCARE_PREP_TIME

COLORS = {"normal": "#fff5e5", "blue": "#42c9ff", "orange": "#ff9d32", "magenta": "#ff42de"}
BACKGROUND = "#111827"
HAUNT_FACE_COLORS = ("#9e8cff", "#7cdae6", "#b8a3f4")
STAR_RIMS = ("#61eaff", "#ba7cff", "#ff83d7")

# Shared by the original shell face and the Impossible Boss Crush face.
PUMPKIN_FACE_FEATURES = (
    ((-25, 3), (-10, 5), (-17, 15)), ((10, 5), (25, 3), (17, 15)),
    ((-4, 0), (4, 0), (0, 6)),
    ((-25, -5), (-18, -8), (-14, -4), (-8, -8), (0, -5), (8, -8),
     (14, -4), (18, -8), (25, -5), (22, -15), (14, -12), (8, -16),
     (0, -12), (-8, -16), (-14, -12), (-22, -15)),
)


def mix(a, b, amount):
    amount = max(0, min(1, amount))
    return "#" + "".join(f"{round(int(a[i:i+2],16)*(1-amount)+int(b[i:i+2],16)*amount):02x}" for i in (1, 3, 5))


class KingAudio:
    """Short original growls and impacts, generated locally without extra packages."""
    def __init__(self):
        self.player = shutil.which("paplay")
        self.directory = tempfile.TemporaryDirectory(prefix="pumpkin-king-audio-")
        self.processes = []
        self.paths = {}
        if self.player:
            for name, duration in (("roar", 0.6), ("laugh", 0.75), ("slam", 0.12), ("scare", 0.38)):
                rng = random.Random(12)
                rate = 22050
                samples = bytearray()
                for i in range(int(rate*duration)):
                    t = i/rate
                    envelope = min(1, t*30) * (1-t/duration)
                    if name in ("laugh", "scare"):
                        envelope *= max(0, math.sin(t*math.tau*6))
                    frequency = (75 if name != "slam" else 45) - 25*t/duration
                    tone = math.sin(math.tau*frequency*t) + 0.35*math.sin(math.tau*frequency*2.03*t)
                    sound = (tone*0.55 + rng.uniform(-1, 1)*0.35)*envelope*0.28
                    samples.extend(struct.pack('<h', int(max(-1, min(1, sound))*32767)))
                path = Path(self.directory.name) / f"{name}.wav"
                with wave.open(str(path), 'wb') as output:
                    output.setnchannels(1)
                    output.setsampwidth(2)
                    output.setframerate(rate)
                    output.writeframes(samples)
                self.paths[name] = path

    def play(self, name):
        self.processes = [p for p in self.processes if p.poll() is None]
        if self.player and name in self.paths and len(self.processes) < 3:
            self.processes.append(subprocess.Popen([self.player, str(self.paths[name])],
                                                  stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL))

    def close(self):
        for process in self.processes:
            if process.poll() is None:
                process.terminate()
                process.wait()
        self.directory.cleanup()


class KingView:
    def __init__(self, canvas, audio=True):
        self.canvas = canvas
        self.items = {}
        self.previous = set()
        self.audio = KingAudio() if audio else None

    def item(self, kind, coords, **options):
        index = self.counts.get(kind, 0)
        self.counts[kind] = index+1
        key = kind, index
        if key not in self.items:
            self.items[key] = getattr(self.canvas, "create_"+kind)(*coords, **options)
        else:
            self.canvas.coords(self.items[key], *coords)
            self.canvas.itemconfigure(self.items[key], state="normal", **options)
        self.used.add(key)
        self.canvas.tag_raise(self.items[key])
        return self.items[key]

    def rect(self, x, y, width, height, color, clip=True):
        l, r, b, t = x-width/2, x+width/2, y-height/2, y+height/2
        if clip:
            l, r, b, t = max(-300, l), min(300, r), max(-240, b), min(240, t)
        if r > l and t > b:
            return self.item("rectangle", (l, -t, r, -b), fill=color, outline="", width=0)

    def poly(self, points, color):
        return self.item("polygon", tuple(v for x, y in points for v in (x, -y)), fill=color, outline="", width=0)

    def oval(self, x, y, width, height, color):
        return self.item("oval", (x-width/2, -y-height/2, x+width/2, -y+height/2),
                         fill=color, outline="", width=0)

    def text(self, x, y, text, color, size=18):
        return self.item("text", (x, -y), text=text, fill=color, font=("Arial", size, "bold"), anchor="center")

    def rounded_rect(self, x, y, width, height, radius, color):
        radius = min(radius, width/2, height/2)
        self.rect(x, y, width-2*radius, height, color)
        self.rect(x, y, width, height-2*radius, color)
        for dx in (-1, 1):
            for dy in (-1, 1):
                self.oval(x+dx*(width/2-radius), y+dy*(height/2-radius),
                          radius*2, radius*2, color)

    def soft_poly(self, points, color):
        softened = []
        for i, (x, y) in enumerate(points):
            before, after = points[i-1], points[(i+1)%len(points)]
            start = (x*.84+before[0]*.16, y*.84+before[1]*.16)
            end = (x*.84+after[0]*.16, y*.84+after[1]*.16)
            for step in range(5):
                t = step/4
                softened.append(((1-t)**2*start[0]+2*(1-t)*t*x+t*t*end[0],
                                 (1-t)**2*start[1]+2*(1-t)*t*y+t*t*end[1]))
        self.poly(softened, color)

    def ribbon(self, points, width, color):
        """A smooth strip, using the same primitives in Tk and the browser."""
        edge_a, edge_b = [], []
        for i, (x, y) in enumerate(points):
            before, after = points[max(0, i-1)], points[min(len(points)-1, i+1)]
            dx, dy = after[0]-before[0], after[1]-before[1]
            length = max(.001, math.hypot(dx, dy))
            nx, ny = -dy/length*width/2, dx/length*width/2
            edge_a.append((x+nx, y+ny))
            edge_b.append((x-nx, y-ny))
        self.poly(edge_a+edge_b[::-1], color)

    def _star(self, x, y, radius, rim, t):
        radius *= .75+.25*math.sin(t)
        for size, color in ((radius+1, rim), (radius*.68, "#ffffff")):
            self.poly([(x+math.cos(i*math.pi/4)*size*(1 if i%2 == 0 else .25),
                        y+math.sin(i*math.pi/4)*size*(1 if i%2 == 0 else .25)) for i in range(8)], color)

    def _spectral_flames(self, game, side, segments):
        sign = -1 if side == "left" else 1
        t = game.elapsed
        # These decorative wisps follow the shoulder and raised-arm pose.
        for index, (x, y, _, _, progress) in enumerate(segments[::3]):
            if progress > .85:
                continue
            phase = index*1.9+sign*.7
            height = 25+8*math.sin(t*3+phase)+12*(1-progress)
            base = y+(40+progress*20)/2-3
            if base >= 238:
                continue
            for layer in range(3):
                hue = (.36, .76, .89)[(index+layer)%3]+.025*math.sin(t*2+phase)
                rgb = colorsys.hsv_to_rgb(hue, .78+.13*math.sin(t*3+phase+layer), 1)
                color = "#"+"".join(f"{round(channel*255):02x}" for channel in rgb)
                if layer == 0:
                    color = mix("#173b3a", color, .45)
                left, right = [], []
                for step in range(15):
                    p = step/14
                    sway = math.sin(p*5-t*4+phase)*p*8+sign*p*p*9
                    width = (11-layer*3)*(1-p)**.8*(.8+.2*math.sin(p*8-t*4+phase))
                    py = min(238, base+p*height*(1-layer*.12))
                    left.append((x+sway-width, py))
                    right.append((x+sway+width, py))
                self.poly(left+right[::-1], color)
            self.oval(x+math.sin(t*3+phase)*3, min(233, base+8), 2, 9, "#d1fff2")

    def _folded_ribs(self, game, side, segments):
        if not segments or not game.transformed:
            return
        sign = -1 if side == "left" else 1
        extent, shoulder_y, lift = game.arm_pose(side)
        # Three ribs fan sideways, tucked against the underside of each arm.
        # During awakening they unfold from the sides of the head.
        fold = min(1, game.stage_age/.9) if game.stage.name == "shatter" and not game.intro_done else 1
        for rib in range(3):
            end = (.47+rib*.17)*extent*fold
            points = []
            for i in range(17):
                p = end*i/16
                x = game.boss_x+sign*(27+p*262)
                y = shoulder_y+10-p*65+math.sin(p*math.pi)*18+lift*p
                y -= (40+p*20)/2+3+rib*3+math.sin(i/16*math.pi)*4
                y += (16+rib*3)*math.exp(-i/2.5)
                points.append((x, y))
            self.ribbon(points, 6.5, "#352f4b")
            self.ribbon(points, 3.7, "#c9c1ba")
            self.ribbon([(x, y+.8) for x, y in points], 1.2, "#efffe2")

    def _claws(self, game, side):
        sign = -1 if side == "left" else 1
        for x, y, _, height in game.hand_rectangles(side):
            top, bottom = y+height/2, y-height/2
            # A clean knuckle rim and small dark slit suggest a claw emerging
            # through the hand, without blood or spray.
            self.oval(x, top-1, 12, 10, "#a987aa")
            self.oval(x, top-2, 9, 5, "#382037")
            shape = ((x-4, top+1), (x+4, top), (x+5, y+7),
                     (x+sign*4, y-5), (x-sign*3, bottom+5),
                     (x-sign*5, bottom), (x-sign, y-7), (x-4, y+4))
            wobble = 1.15+.035*math.sin(game.elapsed*3+x)
            self.soft_poly([(x+(px-x)*wobble, y+(py-y)*1.04) for px, py in shape], "#285d46")
            self.soft_poly(shape, "#690f35")
            inner = [(x+(px-x)*.69, py+1) for px, py in shape]
            self.soft_poly(inner, "#ed294b")
            self.ribbon(((x-1, top-3), (x+1, y+9), (x+sign*1.8, y)), 1.4, "#ff9d9a")
            self.oval(x-sign*3, top+1, 4, 2, "#e4b7c5")

    def _arm(self, game, side):
        segments = list(game.arm_segments(side))
        t = game.elapsed
        def color_at(progress):
            hue = (t*.15+progress*.8)%1
            rgb = colorsys.hsv_to_rgb(hue, .9, 1)
            return '#'+''.join(f'{int(channel*255):02x}' for channel in rgb)
        if not segments:
            return
        self._spectral_flames(game, side, segments)
        # The rainbow outer ribbon keeps its original dimensions and colors.
        # Only the inner ribbon becomes a drifting miniature galaxy.
        for width, color in ((6, "#174b3b"), (2.8, "#4bc878")):
            for edge in (-1, 1):
                points = [(x, y+edge*(height/2+2)+math.sin(t*3+p*13)*1.6)
                          for x, y, _, height, p in segments]
                self.ribbon(points, width, color)
        for outer in (True, False):
            for first, second in zip(segments, segments[1:]):
                x1, y1, _, h1, p1 = first
                x2, y2, _, h2, p2 = second
                if not outer:
                    h1, h2 = 29+p1*14, 29+p2*14
                overlap = .6 if x2 > x1 else -.6
                self.poly(((x1-overlap, y1+h1/2), (x2+overlap, y2+h2/2),
                           (x2+overlap, y2-h2/2), (x1-overlap, y1-h1/2)),
                          color_at((p1+p2)/2) if outer else "#10132f")
            caps = segments[:1] if len(segments) == 1 else segments[:1]+segments[-1:]
            for x, y, width, height, progress in caps:
                self.oval(x, y, width, height if outer else 29+progress*14,
                          color_at(progress) if outer else "#10132f")
        for band, color in enumerate(("#312151", "#44316b", "#254461")):
            points = [(x, y+math.sin(p*11-t*.65+band)*6+(band-1)*5)
                      for x, y, _, _, p in segments]
            self.ribbon(points, 6-band, color)
        for index in range(14):
            segment = segments[(index*7+2)%len(segments)]
            x, y, _, _, p = segment
            y += math.sin(index*8.31)*((29+p*14)/2-4)
            self._star(x+math.sin(index*2.1)*3, y, 1.4+index%3*.5,
                       STAR_RIMS[index%3], t*3+index*2)
        for index in range(3):
            p = (t*.075+index*.29)%.87+.07
            extent, shoulder_y, lift = game.arm_pose(side)
            if p > extent:
                continue
            sign = -1 if side == "left" else 1
            x = game.boss_x+sign*(45+p*242)
            y = shoulder_y+10-p*65+math.sin(p*math.pi)*18+lift*p
            rim = STAR_RIMS[index]
            self.poly(((x-sign*16, y+4), (x+sign*2, y+1), (x+sign*3, y-2), (x-sign*13, y-3)), rim)
            self.poly(((x-sign*12, y+1), (x+sign*2, y), (x-sign*5, y-1)), "#ffffff")
            self.oval(x, y, 3, 3, "#ffffff")
        self._folded_ribs(game, side, segments)
        self._claws(game, side)

    def _outlined_feature(self, points, fill, outline="#ef284b", thickness=1.2):
        cx = sum(x for x, _ in points)/len(points)
        cy = sum(y for _, y in points)/len(points)
        expanded = []
        for x, y in points:
            length = max(.01, math.hypot(x-cx, y-cy))
            expanded.append((x+(x-cx)/length*thickness, y+(y-cy)/length*thickness))
        self.soft_poly(expanded, outline)
        self.soft_poly(points, fill)

    def _fire_crown(self, x, y, t):
        """Living flames form the crown itself, with tall outer points."""
        base = y+34
        for index, offset in enumerate((-39, -26, -13, 0, 13, 26, 39)):
            phase = index*1.73
            height = 18+29*(abs(offset)/39)**1.5+3*math.sin(t*5+phase)
            for layer, color in enumerate(("#783525", "#ec3f1d", "#ff8c22", "#ffe17a")):
                left, right = [], []
                for step in range(19):
                    p = step/18
                    curl = (math.sin(t*4-p*5+phase)*6+offset/39*p*5)*p
                    width = (13-layer*2.7)*(1-p)**.8*(.9+.1*math.sin(p*9-t*6+phase))
                    px = x+offset+curl
                    py = min(238, base+p*height*(1-layer*.11))
                    left.append((px-width, py))
                    right.append((px+width, py))
                self.poly(left+right[::-1], color)
        for index in range(5):
            rise = (t*.55+index*.213)%1
            px = x-33+index*16+math.sin(t*2+index)*3
            py = min(236, base+12+rise*45)
            color = mix(BACKGROUND, "#ffd57b", (1-rise)*.85)
            self.oval(px, py, 1.5, 2.5, color)

    def _face(self, x, y, scale, shell, glow, t, game=None):
        if shell:
            self.rounded_rect(x, y, 72, 42, 6, "#ffffff")
            for polygon in PUMPKIN_FACE_FEATURES:
                self.poly([(x+px*scale, y+py*scale) for px, py in polygon], glow)
            return
        name = game.stage.name
        hit = game.hit_flash > 0
        roar = name in ("roar", "fire")
        laughing = name in ("laugh", "scare_ready", "scares") or not game.alive
        # An inverted, nearly equilateral carved pumpkin, with a living green
        # contour. All detail is procedural and follows the combat animation.
        silhouette = ((-50, 40), (50, 40), (0, -43))
        for spread, color in ((7, "#183d37"), (4, "#2c8154"), (1.8, "#8eff9c")):
            points = []
            for index, (px, py) in enumerate(silhouette):
                wobble = spread+math.sin(t*3.3+index*2.1)*1.5
                points.append((x+px*(1+wobble/50), y+py*(1+wobble/43)))
            self.soft_poly(points, color)
        self.soft_poly([(x+px, y+py) for px, py in silhouette], "#8b301e")
        self.soft_poly(((x-46, y+37), (x+46, y+37), (x, y-38)), "#ff8a21")
        self.soft_poly(((x-39, y+33), (x+36, y+33), (x, y-31)), "#ffab31")
        for offset in (-28, -14, 0, 14, 28):
            end_y = y-32+abs(offset)*1.3
            self.ribbon(((x+offset, y+33), (x+offset*.75, y+11), (x+offset*.28, end_y)),
                        1.5, "#e87920")
        self._fire_crown(x, y, t)
        # Keep the whole Color Memory sequence readable, including its gaps:
        # neither idle blinking nor hit reactions may close the eyes.
        gaze = max(-2, min(2, (game.x-x)/100))
        color_memory = game.attack_index == 0
        blink = .12 if t%4.7 > 4.56 and not color_memory and not game.eye_rule and not roar else 1
        for side in (-1, 1):
            eye = ((side*37, 23), (side*7, 17), (side*11, 7), (side*30, 12))
            if hit and not color_memory:
                eye = ((side*35, 17), (side*9, 13), (side*13, 10), (side*30, 13))
            points = [(x+px+gaze, y+16+(py-16)*blink) for px, py in eye]
            self._outlined_feature(points, glow, thickness=1.6)
            if glow == "#38201c" and blink > .2:
                self.oval(x+side*20+gaze, y+15, 2, 4, "#ff5c48")
        self._outlined_feature(((x-4, y+7), (x+4, y+7), (x, y-1)), "#38201c")
        if roar:
            jaw = 3*math.sin(t*22)
            mouth = [(x+math.cos(i*math.tau/20)*12,
                      y-9+math.sin(i*math.tau/20)*(14+jaw)) for i in range(20)]
        else:
            opening = 3+3*math.sin(t*18) if laughing else 0
            mouth = [(x-28, y+4), (x-18, y-7), (x, y-12), (x+18, y-7), (x+28, y+4)]
            mouth += [(x+19, y-10-opening), (x+8, y-23-opening*.5),
                      (x, y-27), (x-8, y-23-opening*.5), (x-19, y-10-opening)]
            if hit:
                mouth = [(x-18, y-6), (x, y-3), (x+18, y-6), (x+9, y-13), (x-9, y-13)]
        self._outlined_feature(mouth, "#251727", thickness=1.5)
        if not hit:
            for side in (-1, 1):
                self.soft_poly(((x+side*15, y-6), (x+side*10, y-9), (x+side*11, y-15)), "#ffe9a6")
        if game.hp < game.config.hp*.25:
            for side in (-1, 1):
                self.ribbon(((x+side*33, y+29), (x+side*11, y+23)), 2.5, "#9e2433")

    def draw_boss(self, game):
        """Rounded Boss Crush bodies and faces, shared by both front ends."""
        self.counts, self.used = {}, set()
        if not game.won:
            x, y, t = game.boss_x, game.boss_y, game.elapsed
            hit = game.hit_flash > 0
            danger = game.lunge_state in ("warning", "lunging")
            defeated_player = not game.alive
            attacking = game.volley > 0 and game.attack_in > game.config.interval-.17
            color = game.config.color
            if hit and game.difficulty != "impossible":
                color = mix(color, "#fff5ac", .7)
            self.rounded_rect(x, y, 72, 42, 10, mix(game.config.color, "#101323", .76))
            self.rounded_rect(x, y+1, 66, 36, 8, color)
            self.rounded_rect(x-6, y+13, 43, 2, 1, mix(color, "#ffffff", .4))
            gaze = max(-2, min(2, (game.x-x)/110))
            blink = .13 if t%4.1 > 3.97 and not danger and not hit else 1
            if game.difficulty == "impossible":
                for index, polygon in enumerate(PUMPKIN_FACE_FEATURES):
                    points = []
                    for px, py in polygon:
                        if index < 2:
                            py = 9+(py-9)*(.5 if hit else blink)
                            px += gaze
                        elif index == 3:
                            py += math.sin(t*12)*(2 if defeated_player else .6)
                            if hit:
                                py = -10+(py+10)*.35
                            elif danger:
                                py = -9+(py+9)*1.3
                        points.append((x+px, y+py))
                    self.poly(points, "#fff351" if index < 2 and hit else "#000000")
            else:
                for side in (-1, 1):
                    ex = x+side*17+gaze
                    if hit:
                        self.ribbon(((ex-5, y+9), (ex+4, y+4), (ex-5, y+1)), 2.6, "#261b32")
                    else:
                        self.oval(ex, y+5, 9, 12*blink, "#261b32")
                        if blink > .5:
                            self.oval(ex+gaze*.4, y+7, 2.5, 3, "#fff4dd")
                    self.ribbon(((x+side*26, y+15), (x+side*10, y+(10 if danger else 13))), 2.3, "#342039")
                if hit or danger or attacking:
                    self.oval(x, y-10, 13 if hit else 20, 11 if hit else 15, "#261b32")
                else:
                    curve = 1.8 if defeated_player else 1
                    self.ribbon([(x-13+i*26/12, y-10+curve*(abs(i-6)/6)**2*5+
                                  math.sin(t*3)*.6) for i in range(13)], 3, "#261b32")
            if game.hp < game.config.hp*.25:
                self.oval(x+27, y+9+math.sin(t*5)*1.5, 3, 6, "#c7f8ff")
        for key in self.previous-self.used:
            self.canvas.itemconfigure(self.items[key], state="hidden")
        self.previous = self.used

    def _laughing_face(self, x, y, scale, color, t, phase):
        tilt = .12 * math.sin(t * 1.8 + phase)
        def points(shape):
            return [(x + (px*math.cos(tilt)-py*math.sin(tilt))*scale,
                     y + (px*math.sin(tilt)+py*math.cos(tilt))*scale) for px, py in shape]
        skull = ((-33, 17), (-25, 37), (-5, 45), (19, 39), (34, 19),
                 (33, -16), (23, -34), (11, -31), (0, -44), (-14, -36), (-30, -25))
        self.poly(points([(px*1.18, py*1.12) for px, py in skull]), "#292640")
        self.poly(points(skull), color)
        for eye in (((-26, 18), (-6, 12), (-10, 0), (-25, 6)),
                    ((7, 13), (25, 23), (27, 5), (11, -1))):
            self.poly(points(eye), "#070b19")
        for px, py in ((-17, 8), (18, 10)):
            self.poly(points(((px-1, py+5), (px+1, py+4), (px+1, py-2), (px-1, py-3))), "#d5ffff")
        jaw = 3 + 6 * (.5 + .5*math.sin(t*math.tau*3.5+phase))
        self.poly(points(((-25, -3), (-13, -9), (0, -11), (13, -7), (26, 0),
                          (19, -22-jaw), (3, -29-jaw), (-16, -23-jaw))), "#070b19")
        for i in range(7):
            px = -20+i*6
            top = -7-4*math.sin((i+1)*math.pi/8)
            self.poly(points(((px-2.5, top), (px+2.5, top+1), (px+.7, top-7-i%3))), "#d5ffff")
        for i in range(5):
            px, bottom = -13+i*6, -23-jaw+abs(i-2)*1.7
            self.poly(points(((px-2, bottom), (px+2, bottom), (px-.6, bottom+6))), color)
        for crack in (((-8, 40), (-4, 26), (-9, 29), (-6, 19), (-11, 30), (-7, 28)),
                      ((30, -10), (21, -14), (24, -22), (18, -15))):
            self.poly(points(crack), "#292640")

    def _haunting_intro(self, game):
        self.rect(0, 0, 600, 480, "#0d1022")
        t = game.stage_age
        for row in range(4):
            for column in range(5):
                index = row*5+column
                phase = index*2.399
                x = -240+column*120+8*math.sin(t*1.7+phase)
                y = 184-row*115+7*math.sin(t*2.2+phase)
                scale = .66+.14*math.sin(phase)+.035*math.sin(t*4+phase)
                self._laughing_face(x, y, scale, HAUNT_FACE_COLORS[index%3], t, phase)
        # Preview the first quadrant without activating its damage.
        self.rect(-150, 239, 300, 2, "#9e8cff")
        self.rect(-299, 120, 2, 240, "#9e8cff")
        self.rect(0, 0, 3, 480, "#d9b8f5")
        self.rect(0, 0, 600, 3, "#d9b8f5")

    def _scares(self, game):
        x, y, width, height = game.scare_rectangle
        warning = game.scare_warning
        self.rect(x, y, width, height, "#251d30" if warning else "#482a60")
        # The plus sign divides the entire arena; the lines themselves are safe.
        self.rect(0, 0, 3, 480, "#d9b8f5")
        self.rect(0, 0, 600, 3, "#d9b8f5")
        if not warning:
            # Three spectral faces fill the active quadrant, with hollow eyes
            # and jagged mouths. They share one hit allowance for this beat.
            for offset, lift, scale in ((-80, 40, .7), (0, -20, 1), (80, 40, .7)):
                cx, cy = x + offset, y + lift
                shape = ((-36, -36), (-36, 16), (-25, 35), (0, 44), (25, 35),
                         (36, 16), (36, -36), (22, -25), (10, -38), (0, -26),
                         (-10, -38), (-22, -25))
                self.poly([(cx+px*scale, cy+py*scale) for px, py in shape], "#e7d9ff")
                for side in (-1, 1):
                    self.poly([(cx+(side*15+px)*scale, cy+py*scale)
                               for px, py in ((-8, 18), (8, 12), (5, 0), (-6, 2))], "#251239")
                mouth = ((-17, -8), (-8, -13), (0, -8), (8, -13), (17, -8),
                         (12, -22), (0, -27), (-12, -22))
                self.poly([(cx+px*scale, cy+py*scale) for px, py in mouth], "#251239")

    def _practice_countdown(self, game):
        remaining = max(0, game.stage.duration-game.stage_age)
        seconds = math.ceil(remaining-1e-9)
        self.rect(0, -67, 496, 242, "#756a3c")
        self.rect(0, -67, 490, 236, "#141a29")
        self.text(0, 21, "GET READY", "#ffe066", 27)
        self.text(0, -48, str(seconds), "#fff2bd", 70)
        self.text(0, -109, "POSITION YOUR FINGERS", "#e5e9ed", 16)
        self.text(0, -137, "ARROWS MOVE · F SHOOTS · E COUNTERS", "#aab9c8", 12)
        self.rect(0, -164, 390, 5, "#343b49")
        width = 390*(1-remaining/game.stage.duration)
        if width > 0:
            self.rect(-195+width/2, -164, width, 5, "#ffe066")

    def draw(self, game):
        self.counts, self.used = {}, set()
        if self.audio:
            for event in game.sound_events:
                self.audio.play(event)
        game.sound_events.clear()
        rule = game.screen_rule
        bg = {"blue": "#123e69", "orange": "#713b17"}.get(rule, BACKGROUND)
        background = self.rect(0, 0, 600, 480, bg)
        self.canvas.tag_lower(background)
        name = game.stage.name
        progress = min(1, game.stage_age/game.stage.duration)
        if name == "scare_ready" and not game.won:
            self._haunting_intro(game)
        elif name == "scares" and not game.won:
            self._scares(game)
        if not game.won:
            self._arm(game, "left")
            self._arm(game, "right")
            body_x, body_y, _, _ = game.body_rectangle
            if name in ("shell", "glow", "left_burst", "right_burst") and not game.intro_done:
                glow = "#111827" if name == "shell" else mix("#111827", "#ffef42", progress if name == "glow" else 1)
                self._face(body_x, body_y, 1, True, glow, game.elapsed)
            else:
                hit_eyes = game.hit_flash > 0 and game.attack_index != 0
                glow = COLORS.get(game.eye_rule, "#fff351" if hit_eyes else "#38201c")
                self._face(body_x, body_y, 1.65, False, glow, game.elapsed, game)
                if name == "shatter" and not game.intro_done:
                    for i in range(22):
                        angle = i*2.399
                        x = math.cos(angle)*(25+progress*155)
                        y = 219 + math.sin(angle)*progress*55-progress*progress*210
                        self.poly(((x-5, y), (x+6, y+4), (x+2, y+12)), mix("#ffffff", bg, progress))
        if name == "scares" and game.scare_warning and not game.won:
            x, y, _, _ = game.scare_rectangle
            # Upper-quadrant warnings sit below the arms and draw in front so
            # the King cannot hide the cue to move out of the active section.
            y = 40 if y > 0 else y
            color = "#ff4d55" if int(game.stage_age * 2 / SCARE_WARNING) % 2 == 0 else "#ffe45c"
            for offset in (-76, 0, 76):
                self.text(x + offset, y, "!", color, 64)
        if name == "scare_ready" and not game.won:
            self.rect(0, -21, 458, 64, "#101021")
            self.text(0, -9, "THEY'RE LAUGHING AT YOU", "#b8a3f4", 18)
            seconds = math.ceil(max(0, SCARE_PREP_TIME-game.stage_age))
            self.text(0, -35, f"TOP LEFT FIRST · MOVE CLEAR · {seconds}", "#a4f4ff", 14)
        for x, y, width, height in game.hazard_rectangles():
            if name == "fire":
                self.rect(x, y, width, height, "#cb3c13")
                for i in range(28):
                    py = -230+i*12
                    offset = math.sin(game.elapsed*23+i)*9
                    self.poly(((offset-22, py), (offset+22, py), (offset+6, py+35)), "#ffbb25" if i%2 else "#fff08c")
            else:
                self.rect(x, y, width, height, "#d85615")
                for i in range(13):
                    self.rect(x-width/2+10+i*20, y, 8, height, "#ffb238" if i%2 else "#ffd05c")
        for bullet in game.bullets:
            color = COLORS.get(bullet.rule, "#ffffff")
            for rectangle in bullet.rectangles():
                self.rect(*rectangle, color)
            if isinstance(bullet, Finger):
                self.rect(bullet.x, bullet.y+8, 6, 8, "#ffd1f8")
        for ring in game.rings:
            for x, y, width, height, rule in ring.pieces():
                self.rect(x, y, width, height, COLORS[rule])
        for shot in game.shots:
            self.rect(shot.x, shot.y, 4, 12, "#67e8f9")
        for pickup in game.healing_pickups:
            self.rect(pickup.x, pickup.y, 16, 16, "#22c55e")
            self.rect(pickup.x, pickup.y, 4, 12, "#ffffff")
            self.rect(pickup.x, pickup.y, 12, 4, "#ffffff")
        if game.counter_time > 0:
            r = COUNTER_RANGE
            self.item("oval", (game.x-r, -game.y-r, game.x+r, -game.y+r),
                      fill="", outline="#ff69e5", width=3)
        if name == "wrath_ready" and not game.won:
            self._practice_countdown(game)
        if name in ("roar", "laugh"):
            self.text(0, 68, "ROOOAAAR!" if name == "roar" else "HA. HA. HA!", "#ffdd63", 22)
        if name == "title":
            fade = min(1, progress*5) * (1-progress)**0.6
            self.text(0, 10, "THE PUMPKIN KING", mix(bg, "#ffce55", fade), 31)
        self.rect(0, 265, 220, 8, "#374151", clip=False)
        if game.hp > 0:
            width = 220*game.hp/game.config.hp
            self.rect(-110+width/2, 265, width, 8, "#ffc14d", clip=False)
        for key in self.previous-self.used:
            self.canvas.itemconfigure(self.items[key], state="hidden")
        self.previous = self.used

    def close(self):
        if self.audio:
            self.audio.close()
