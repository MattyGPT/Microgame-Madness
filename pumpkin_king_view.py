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

from pumpkin_king import (Finger, COUNTER_RANGE, SCARE_WARNING, SCARE_PREP_TIME,
                          EYE_FLASH_PERIOD, EYE_FLASH_ON)

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


def happy_laugh_mouth(x, y, width, depth, age):
    """An upturned open smile, pulsing on the defeat laugh's ha syllables."""
    phase = min(1, (age % .36) / .28)
    opening = depth * (.35 + .65 * math.sin(math.pi * phase))
    top = [(x + width * (i / 12 - .5), y + 3 * (abs(i - 6) / 6) ** 2)
           for i in range(13)]
    bottom = [(x + width * (i / 12 - .5), y + 3 - opening * (1 - ((i - 6) / 6) ** 2))
              for i in range(12, -1, -1)]
    return top + bottom


def mix(a, b, amount):
    amount = max(0, min(1, amount))
    return "#" + "".join(f"{round(int(a[i:i+2],16)*(1-amount)+int(b[i:i+2],16)*amount):02x}" for i in (1, 3, 5))


class KingAudio:
    """Short original growls and impacts, generated locally without extra packages."""
    def __init__(self, effects=None):
        self.player = shutil.which("paplay")
        self.directory = tempfile.TemporaryDirectory(prefix="pumpkin-king-audio-")
        self.processes = []
        self.paths = {}
        if self.player:
            for name, duration in (effects if effects is not None else
                                   (("roar", .6), ("laugh", .75), ("slam", .12), ("scare", .38), ("turtle_death", 1.6))):
                rng = random.Random(12)
                rate = 22050
                samples = bytearray()
                held, phase = 0.0, 0.0
                for i in range(int(rate*duration)):
                    t = i/rate
                    envelope = min(1, t*30) * (1-t/duration)
                    if name in ("laugh", "scare"):
                        envelope *= max(0, math.sin(t*math.tau*6))
                    frequency = (75 if name != "slam" else 45) - 25*t/duration
                    tone = math.sin(math.tau*frequency*t) + 0.35*math.sin(math.tau*frequency*2.03*t)
                    if name == "turtle_death":
                        phase += (340*math.exp(-t*2.8)+25)/rate
                        if i % max(1, int(rate/(6500-3900*t/duration))) == 0:
                            held = round(((1 if math.sin(phase*math.tau) > 0 else -1)*.6+rng.uniform(-.4,.4))*7)/7
                        sound = held*envelope*.38
                    else:
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
        if name == "turtle_death":
            for process in self.processes:
                process.terminate()
                process.wait()
            self.processes.clear()
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

    def _vocal_caption(self, name, age):
        caption = "ROOOAAAR!" if name == "roar" else "HA. HA. HA!"
        # Entry Number Seventeen's lettering jitters independently on a 30 Hz
        # clock, by about one native pixel per axis. Keep redraws deterministic
        # so pausing freezes the text and rendering never consumes combat RNG.
        jitter = random.Random(int((age + 1e-9)*30) + (17000 if name == "roar" else 27000))
        widths = {"R": .722, "O": .778, "A": .722, "H": .722,
                  ".": .278, "!": .333, " ": .278}
        advances = [22*widths[letter] for letter in caption]
        if hasattr(self.canvas, "tk"):
            advances = [float(self.canvas.tk.call("font", "measure", ("Arial", 22, "bold"), letter))
                        for letter in caption]
        x = -sum(advances)/2
        for letter, advance in zip(caption, advances):
            dx, dy = jitter.randint(-1, 1), jitter.randint(-1, 1)
            if letter != " ":
                self.text(x+advance/2+dx, 68+dy, letter, "#ffdd63", 22)
            x += advance

    def rounded_rect(self, x, y, width, height, radius, color):
        radius = min(radius, width/2, height/2)
        self.rect(x, y, width-2*radius, height, color)
        self.rect(x, y, width, height-2*radius, color)
        for dx in (-1, 1):
            for dy in (-1, 1):
                self.oval(x+dx*(width/2-radius), y+dy*(height/2-radius),
                          radius*2, radius*2, color)

    def draw_bone_walls(self, bullets):
        """Fuse each gauntlet column into two shafts with gap-facing knuckles."""
        columns = {}
        for bullet in bullets:
            if getattr(bullet, "bone", False):
                columns.setdefault((bullet.x, bullet.vx, bullet.rule), []).append(bullet)
        for (x, _, rule), column in columns.items():
            column.sort(key=lambda bone: bone.y)
            runs = [[]]
            for bone in column:
                if runs[-1] and bone.y-runs[-1][-1].y > 30:
                    runs.append([])
                runs[-1].append(bone)
            color = COLORS.get(rule, "#ffffff")
            for run in runs:
                lower = run[0].y-run[0].height/2
                upper = run[-1].y+run[-1].height/2
                # The screen-facing end is flat; only the opening gets two lobes.
                points_up = run[0] is column[0]
                tip = upper if points_up else lower
                edge = -240 if points_up else 240
                direction = 1 if points_up else -1
                cap_y = tip-direction*6
                self.rect(x, (edge+cap_y)/2, 16, abs(cap_y-edge), color)
                for side in (-1, 1):
                    self.oval(x+side*5, cap_y, 12, 12, color)
                # Ivory shafts, shaded knuckles and hairline fractures stay
                # inside the existing silhouette and never bridge the safe gap.
                self.rect(x+4, (edge+cap_y)/2, 4, abs(cap_y-edge), mix(color, "#44354b", .5))
                self.rect(x-4, (edge+cap_y)/2, 3, abs(cap_y-edge), mix(color, "#ffffff", .65))
                for side in (-1, 1):
                    self.oval(x+side*5-1, cap_y+2, 6, 5, mix(color, "#ffffff", .6))
                for index in range(int(abs(cap_y-edge)/42)):
                    py = edge+direction*(15+index*42)
                    self.ribbon(((x-3, py-5), (x+1, py), (x-1, py+5)), 1.2, "#8f8292")
                # Spent sections keep their shape beneath a ragged red stain.
                for bone in run:
                    if not getattr(bone, "spent", False):
                        continue
                    low = max(min(edge, cap_y), bone.y-bone.height/2-1)
                    high = min(max(edge, cap_y), bone.y+bone.height/2+1)
                    if high > low:
                        self.rect(x, (low+high)/2, 16, high-low, "#991b30")
                        # Stable irregular patches travel with the bone; no
                        # random redraw flicker or new collision geometry.
                        for patch in range(5):
                            px = x-6+patch*3
                            phase = bone.y*.17+patch*2.399
                            top = high-(1+math.sin(phase))*2
                            bottom = low+(1+math.cos(phase))*3
                            self.poly(((px-2, top-2), (px, top), (px+2, top-3),
                                       (px+1.5, bottom+4), (px+.5, bottom),
                                       (px-1, bottom+1), (px-2, bottom+5)),
                                      "#dc2941" if patch%2 else "#b50e28")
                            self.oval(px, bottom+1, 2.5, 4, "#be1530")
                        self.ribbon(((x-4, high-4), (x-3, high-7),
                                     (x-4, max(low+2, high-11))), 1, "#f46570")
                    tip_bone = run[-1] if points_up else run[0]
                    if bone is tip_bone:
                        for side in (-1, 1):
                            self.oval(x+side*5, cap_y, 12, 12, "#991b30")
                            self.oval(x+side*5-1, cap_y+1, 7, 6, "#cf2039")
                            self.oval(x+side*6, cap_y-3, 3, 5, "#b50e28")
                            self.oval(x+side*5-2, cap_y+3, 3, 2, "#f46570")

    def _attack_atmosphere(self, game):
        """Quiet stage decoration; only the existing hazards represent danger."""
        name, t = game.stage.name, game.elapsed
        if name in ("memory", "recall_ready", "color", "color_gap"):
            rule = game.eye_rule
            color = COLORS.get(rule, "#a394cc")
            for side in (-1, 1):
                for index in range(9):
                    y = -210+index*49
                    self.poly(((side*298, y-10), (side*290, y), (side*298, y+10)),
                              mix(BACKGROUND, color, .28+.12*math.sin(t*4+index)))
            if name == "memory":
                current = int(game.stage_age/EYE_FLASH_PERIOD)
                for index in range(6):
                    x = (index-2.5)*27
                    lit = index == current and game.stage_age%EYE_FLASH_PERIOD < EYE_FLASH_ON
                    self.poly(((x-7, -218), (x, -211), (x+7, -218), (x, -225)),
                              color if lit else "#343047")
                # Only the currently flashed color is shown, never the answer sequence.
            if name == "color":
                self.text(0, -218, "Ⅱ  HOLD STILL" if rule == "blue" else "»  KEEP MOVING", color, 12)
        elif name in ("bones", "rings", "fingers", "chaos"):
            tint = {"bones": "#b9b2a5", "rings": "#7abfd2", "fingers": "#ed74ce", "chaos": "#c088ee"}[name]
            for side in (-1, 1):
                for index in range(7):
                    y = -215+index*66
                    self.ribbon(((side*298, y-14), (side*290, y-6), (side*290, y+6), (side*298, y+14)),
                                1.5, mix(BACKGROUND, tint, .25))
            if name == "chaos":
                for index in range(12):
                    x = -260+index*47
                    y = 224+4*math.sin(t*3+index)
                    self._star(x, y, 3, tint, t*4+index)
        elif name == "raise":
            # The raised hands already announce these exact slam regions.
            sides = (-1, 1) if game.stage.side == "both" else (-1,) if game.stage.side == "left" else (1,)
            for side in sides:
                x, width = (side*170, 260) if len(sides) == 2 else (side*150, 300)
                self.rect(x, -236, width-4, 3, "#e6a95b")
                for index in range(6):
                    px = x-width/2+(index+.5)*width/6
                    self.ribbon(((px-5, -218), (px, -224), (px+5, -218)), 2, "#b57542")
        elif name == "roar":
            for index in range(3):
                radius = 14+((t*38+index*12)%38)
                self.item("oval", (game.boss_x-radius, -game.boss_y+9-radius*.5,
                                   game.boss_x+radius, -game.boss_y+9+radius*.5),
                          fill="", outline=mix(BACKGROUND, "#ffb35c", 1-radius/65), width=2)

    def _candy(self, pickup, t):
        x, y = pickup.x, pickup.y
        variant = getattr(pickup, "variant", "bonbon")
        # A green halo/+ marks every design as healing. The sprite is anchored
        # to the unchanged 16×16 collection box, and never rerolls while drawn.
        self.item("oval", (x-13, -y-13, x+13, -y+13), fill="", outline="#5dd6a1", width=1)
        if variant == "bonbon":
            for side in (-1, 1):
                self.poly(((x+side*5, y), (x+side*12, y+6), (x+side*10, y), (x+side*12, y-6)), "#f6a9dc")
            self.oval(x, y, 15, 13, "#b54a9a")
            self.oval(x-1, y+1, 12, 10, "#ff80c7")
            self.ribbon(((x-3, y-4), (x, y), (x+2, y+4)), 2, "#ffe1f3")
        elif variant == "peppermint":
            self.oval(x, y, 18, 18, "#fff4dd")
            for index in range(6):
                a = index*math.tau/6
                self.poly(((x, y), (x+math.cos(a)*8, y+math.sin(a)*8),
                           (x+math.cos(a+.45)*8, y+math.sin(a+.45)*8),
                           (x+math.cos(a+.9)*3, y+math.sin(a+.9)*3)), "#e9576b")
        elif variant == "lollipop":
            self.rect(x, y-5, 3, 17, "#fff2cf")
            self.oval(x, y+3, 17, 17, "#54dcd9")
            self.ribbon([(x+math.cos(i*.4)*i*.23, y+3+math.sin(i*.4)*i*.23)
                         for i in range(28)], 2, "#f1ffe0")
        elif variant == "candy_corn":
            self.poly(((x, y+11), (x-9, y-8), (x+9, y-8)), "#ffd75f")
            self.poly(((x, y+11), (x-6, y-2), (x+6, y-2)), "#ff974f")
            self.poly(((x, y+11), (x-3, y+5), (x+3, y+5)), "#fff4dd")
        else:  # gummy bear
            for dx in (-5, 5):
                self.oval(x+dx, y+7, 6, 6, "#b18cf7")
                self.oval(x+dx, y-6, 6, 7, "#b18cf7")
                self.oval(x+dx, y-1, 7, 6, "#9261da")
            self.oval(x, y-2, 12, 13, "#aa78ec")
            self.oval(x, y+5, 13, 11, "#c7a0ff")
            for dx in (-2, 2):
                self.oval(x+dx, y+6, 1.5, 2, "#473460")
            self.oval(x, y+2, 4, 3, "#e3caff")
        self.oval(x-3, y+5, 3, 2, "#ffffff")
        self.rect(x+13, y+11, 2, 6, "#a0ffca")
        self.rect(x+13, y+11, 6, 2, "#a0ffca")
        if pickup.remaining < 2:
            self.item("oval", (x-15, -y-15, x+15, -y+15), fill="",
                      outline=mix(BACKGROUND, "#b8ffdc", .4+.3*math.sin(t*9)), width=1)

    def _spell_projectile(self, bullet, t):
        color = COLORS.get(bullet.rule, "#fff5e5")
        x, y, w, h = bullet.x, bullet.y, bullet.width, bullet.height
        if isinstance(bullet, Finger):
            self._finger_claw(x, y, h, -1 if bullet.vx > 0 else 1, t,
                              magenta=True, width=w)
        else:
            # Little ghosts with domed heads, trailing hems, and round faces.
            # Chaos and Color Memory share these bullets and their rule colors.
            self.oval(x, y+h*.12, w, h*.76, color)
            hem = ((-.5, .12), (.5, .12), (.5, -.5),
                   (.25, -.3), (0, -.5), (-.25, -.3), (-.5, -.5))
            self.poly([(x+px*w, y+py*h) for px, py in hem], color)
            eye_size = min(w, h)*.19
            for side in (-1, 1):
                self.oval(x+side*w*.21, y+h*.15, eye_size, eye_size, "#182030")
            mouth_size = min(w, h)*.23
            self.oval(x, y-h*.14, mouth_size, mouth_size, "#182030")

    def _runic_ring(self, ring, t):
        for index, (x, y, w, h, rule) in enumerate(ring.pieces()):
            if not (-310 < x < 310 and -250 < y < 250):
                continue
            color = COLORS[rule]
            self.rect(x, y, w, h, color if index % 2 else mix(color, "#263149", .18))
            if index % 8 == 0:
                self.poly(((x-3, y), (x, y+4), (x+3, y), (x, y-4)), "#fff8e9")

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

    def _finger_claw(self, x, y, height, sign, t, magenta=False, width=12):
        """The same curved claw, knuckle, and highlight on hands and projectiles."""
        top, bottom = y+height/2, y-height/2
        rim, slit, edge, shell, inner, shine, glint = (
            ("#ec91e2", "#43133f", "#873878", "#850c76", "#ff42de", "#ffb3f3", "#ffe0fa")
            if magenta else
            ("#a987aa", "#382037", "#285d46", "#690f35", "#ed294b", "#ff9d9a", "#e4b7c5"))
        sx = width/12
        # Shorter flying fingers retain the attached claws' curved silhouette.
        sy = min(1, height/32)
        self.oval(x, top-1, width, 10*sy, rim)
        self.oval(x, top-2*sy, width*.75, 5*sy, slit)
        shape = ((x-sign*4*sx, top+sy), (x+sign*4*sx, top),
                 (x+sign*5*sx, y+7*sy), (x+sign*4*sx, y-5*sy),
                 (x-sign*3*sx, bottom+5*sy), (x-sign*5*sx, bottom),
                 (x-sign*sx, y-7*sy), (x-sign*4*sx, y+4*sy))
        wobble = 1.15+.035*math.sin(t*3+abs(x))
        self.soft_poly([(x+(px-x)*wobble, y+(py-y)*1.04) for px, py in shape], edge)
        self.soft_poly(shape, shell)
        self.soft_poly([(x+(px-x)*.69, py+sy) for px, py in shape], inner)
        self.ribbon(((x-sign*sx, top-3*sy), (x+sign*sx, y+9*sy),
                     (x+sign*1.8*sx, y)), 1.4, shine)
        self.oval(x-sign*3*sx, top+sy, 4*sx, 2*sy, glint)

    def _claws(self, game, side):
        sign = -1 if side == "left" else 1
        for x, y, _, height in game.hand_rectangles(side):
            self._finger_claw(x, y, height, sign, game.elapsed,
                              magenta=game.stage.name == "fingers")

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
        """Layered fire with upward-moving turbulence and cooling embers."""
        base = y+34
        # Fit the complete flame into the arena instead of flattening its tip.
        room = max(0, 238-base)
        wind = 2.4*math.sin(t*1.7)+1.3*math.sin(t*3.13)
        palette = ("#913321", "#d94317", "#f96c19", "#ffb536", "#fff2b0")
        # Draw each temperature layer across the crown before the next, so
        # neighboring flames merge into one continuous bed of fire.
        for layer, color in enumerate(palette):
            for index, offset in enumerate((-39, -26, -13, 0, 13, 26, 39)):
                phase = index*2.399
                flicker = (math.sin(t*6.3+phase)*.12
                           + math.sin(t*10.7+phase*1.8)*.06
                           + math.sin(t*3.1+phase*.7)*.1)
                height = min(room, (22+27*(abs(offset)/39)**1.5)*(1+flicker))
                height *= 1-layer*.13
                left, right = [], []
                for step in range(23):
                    p = step/22
                    # Waves travel from the root toward the tip. Higher
                    # frequencies become visible only as the flame thins.
                    curl = (wind*p+math.sin(p*7-t*5.4+phase)*4*p
                            + math.sin(p*14-t*8.1+phase)*2*p*p)
                    width = (12.5-layer*2.1)*(1-p)**.85
                    width *= 1+.22*math.sin(p*11-t*7+phase)*p
                    px = x+offset+curl
                    py = base+p*height
                    asymmetry = math.sin(p*9-t*4.7+phase)*.22*p
                    left.append((px-width*(1+asymmetry), py))
                    right.append((px+width*(1-asymmetry), py))
                self.poly(left+right[::-1], color)
        for index in range(11):
            lifetime = 1.1+(index%4)*.23
            rise = (t/lifetime+index*.6180339)%1
            offset = -40+(index*29)%81
            px = x+offset+wind*rise+math.sin(rise*5+index)*5*rise
            py = base+12+rise*min(64, max(0, room-14))
            # Fade in after birth and cool to red as the spark rises.
            intensity = min(1, rise*12)*(1-rise)**1.3
            heat = mix("#ff5924", "#fff0a2", 1-rise)
            color = mix(BACKGROUND, heat, intensity)
            self.oval(px, py, 1.8*(1-rise)+.3, 3*(1-rise)+.5, color)

    def _happy_laugh(self, x, y, width, depth, age, color="#251727"):
        self.poly(happy_laugh_mouth(x, y, width, depth, age), color)
        # Small bright teeth make the open mouth read as a delighted grin.
        self.ribbon(((x-width*.24, y-.8), (x, y-1.7), (x+width*.24, y-.8)),
                    2, "#fff2ce")

    def _face(self, x, y, scale, shell, glow, t, game=None):
        if shell:
            self.rounded_rect(x, y, 72, 42, 6, "#ffffff")
            for index, polygon in enumerate(PUMPKIN_FACE_FEATURES):
                if game is not None and not game.alive and index == 3:
                    self._happy_laugh(x, y-7, 43, 14, getattr(game, "defeat_laugh_age", 0), glow)
                    continue
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
        if not game.alive and not game.won:
            self._happy_laugh(x, y-7, 45, 22, getattr(game, "defeat_laugh_age", 0))
            return
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
        """Lit arena and beveled Boss Crush bodies, shared by both front ends."""
        self.counts, self.used = {}, set()
        # Cosmetic geometry only: the arena and collision rectangles stay unchanged.
        t = game.elapsed
        left, right, bottom, top = game.left, game.right, game.bottom, game.top
        accent = game.config.color
        self.rect((left+right)/2, (bottom+top)/2, right-left, top-bottom, "#0c1221")
        for gx in range(int(left)+30, int(right), 40):
            self.rect(gx, (bottom+top)/2, .7, top-bottom, "#151f32")
        for gy in range(int(bottom)+30, int(top), 40):
            self.rect((left+right)/2, gy, right-left, .7, "#151f32")
        for side in (-1, 1):
            edge = left if side < 0 else right
            self.rect(edge-side*3, (bottom+top)/2, 5, top-bottom, "#253047")
            self.rect(edge-side*6, (bottom+top)/2, 1, top-bottom, mix(accent, "#111827", .65))
            for gy in range(int(bottom)+22, int(top)-10, 32):
                pulse = .25+.2*math.sin(t*2-gy*.025)
                self.rect(edge-side*3, gy, 2, 10, mix("#29354a", accent, pulse))
        for edge in (bottom, top):
            self.rect((left+right)/2, edge+(3 if edge == bottom else -3), right-left, 5, "#253047")
            for gx in (left+22, right-22):
                self.rect(gx, edge+(4 if edge == bottom else -4), 28, 2, mix(accent, "#ffffff", .2))
        if not game.won:
            x, y, t = game.boss_x, game.boss_y, game.elapsed
            hit = game.hit_flash > 0
            danger = game.lunge_state in ("warning", "lunging")
            defeated_player = not game.alive
            attacking = game.volley > 0 and game.attack_in > game.config.interval-.17
            color = game.config.color
            if hit and game.difficulty != "impossible":
                color = mix(color, "#fff5ac", .7)
            # Low-contrast shadow separates the hovering shell from the floor.
            self.oval(x, y-27, 66, 9, "#080d18")
            self.rounded_rect(x, y, 72, 42, 9, mix(color, "#080e20", .7))
            self.rounded_rect(x, y+1, 68, 38, 8, mix(color, "#ffffff", .35))
            self.rounded_rect(x, y, 64, 34, 7, mix(color, "#0c152b", .32))
            self.rounded_rect(x, y+3, 62, 28, 6, color)
            self.poly(((x-30,y+10),(x-24,y+16),(x+23,y+16),(x+29,y+10)), mix(color,"#ffffff",.3))
            self.poly(((x-30,y-8),(x-24,y-15),(x+24,y-15),(x+30,y-8),(x+24,y-11),(x-24,y-11)), mix(color,"#10162c",.5))
            self.rounded_rect(x-7, y+17, 37, 1.5, .7, mix(color, "#ffffff", .7))
            for side in (-1, 1):
                self.rounded_rect(x+side*33, y-2, 2, 11, 1, mix(color, "#ffffff", .5))
                self.oval(x+side*28, y-13, 2, 2, "#dce9ff")
            # Tiny reactor vents breathe, then light up before an attack.
            vent = "#fff0ba" if danger or attacking else mix(color,"#d9ffff",.45+.2*math.sin(t*3))
            for dx in (-5, 0, 5):
                self.rect(x+dx, y-18, 2, 1.5, vent)
            gaze = max(-2, min(2, (game.x-x)/110))
            blink = .13 if t%4.1 > 3.97 and not danger and not hit else 1
            if game.difficulty == "impossible":
                for index, polygon in enumerate(PUMPKIN_FACE_FEATURES):
                    if defeated_player and index == 3:
                        self._happy_laugh(x, y-7, 43, 14, getattr(game, "defeat_laugh_age", 0), "#000000")
                        continue
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
                if defeated_player:
                    self._happy_laugh(x, y-7, 30, 14, getattr(game, "defeat_laugh_age", 0))
                elif hit or danger or attacking:
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
        upper_teeth = []
        for i in range(7):
            px = -20+i*6
            top = -7-4*math.sin((i+1)*math.pi/8)
            upper_teeth.extend(((px-2.5, top), (px+.7, top-7-i%3), (px+2.5, top+1)))
        self.poly(points(upper_teeth), "#d5ffff")
        lower_teeth = []
        for i in range(5):
            px, bottom = -13+i*6, -23-jaw+abs(i-2)*1.7
            lower_teeth.extend(((px-2, bottom), (px-.6, bottom+6), (px+2, bottom)))
        self.poly(points(lower_teeth), color)
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
        for index in range(5):
            py = y-100+index*44
            self.ribbon([(x-145+step*29, py+5*math.sin(step*.8+game.elapsed*4+index))
                         for step in range(11)], 4, "#312341" if warning else "#58306f")
        for side in (-1, 1):
            self.rect(x+side*(width/2-2), y, 2, height, "#b68bcf")
        # The plus sign divides the entire arena; the lines themselves are safe.
        self.rect(0, 0, 3, 480, "#d9b8f5")
        self.rect(0, 0, 600, 3, "#d9b8f5")
        if not warning:
            # Three spectral faces fill the active quadrant, with hollow eyes
            # and jagged mouths. They share one hit allowance for this beat.
            for offset, lift, scale in ((-80, 40, .7), (0, -20, 1), (80, 40, .7)):
                cx, cy = x + offset, y + lift
                self._laughing_face(cx, cy, scale, "#e7d9ff", game.elapsed*1.4, offset*.07)
                for side in (-1, 1):
                    self._star(cx+side*35*scale, cy+45*scale, 4, "#96e9f2", game.elapsed*7+side)

    def _mouth_fire(self, x, y, width, height, t, mouth_x, mouth_y):
        bottom, top = y-height/2, y+height/2
        top = mouth_y
        height = top-bottom
        # The jet starts inside the open mouth and spreads into a cone.
        taper_length = 105
        for layer, color in enumerate(("#692b20", "#b93619", "#ed5318", "#ff9626", "#ffd35c", "#fff2bc")):
            left, right = [], []
            for step in range(49):
                p = step/48
                py = top-p*height
                wave = math.sin(p*23-t*16)+.45*math.sin(p*47-t*23)
                spread = min(1, p*height/taper_length)
                center = mouth_x+(x-mouth_x)*spread+math.sin(p*17-t*12)*p*5
                radius = (width/2-layer*6.5)*spread
                radius *= 1+.12*wave
                radius = min(width/2-abs(center-x), radius)
                left.append((center-radius, py))
                right.append((center+radius, py))
            self.poly(left+right[::-1], color)
        # Hot fragments are carried down by the jet, then vanish at the floor.
        for index in range(18):
            p = (t*(1.7+index%3*.17)+index*.618)%1
            spread = min(1, p*height/taper_length)
            px = mouth_x+(x-mouth_x)*spread+math.sin(index*2.399+p*8)*(width/2-5)*spread
            py = top-5-p*(height-10)
            self.oval(px, py, 2, 4+5*p, mix("#ff7623", "#fff6c8", 1-p))
        # Thin bright filaments inside the cone add turbulent motion without
        # widening the damaging lane or hiding its silhouette.
        for side in (-1, 1):
            self.ribbon([(mouth_x+side*min(width*.22, p*height*.18)+math.sin(p*28-t*19)*3*p,
                          top-p*height) for p in (step/32 for step in range(33))],
                        1.5, "#fff8d1")

    def _slam_impact(self, x, y, width, height, progress):
        left, right = x-width/2, x+width/2
        floor = y-height/2
        fade = (1-progress)**.7
        self.rect(x, y, width, height, mix(BACKGROUND, "#754027", .45+.3*fade))
        self.rect(x, floor+3, width-4, 5, mix(BACKGROUND, "#fff0a4", fade))
        for side in (-1, 1):
            self.rect(x+side*(width/2-2), y, 2, height, mix(BACKGROUND, "#ffbb68", fade*.7))
        # Fast downward streaks communicate the whole struck area.
        for i in range(15):
            px = left+width*(i+.5)/15
            fall = (progress*2.6+i*.618)%1
            py = y+height/2-fall*(height-55)
            self.ribbon(((px-2, py), (px, py-22), (px+1, py-50)),
                        1+i%3, mix(BACKGROUND, "#ffca78", fade*.7))
        # Expanding ground shockwave and branching fissures remain inside
        # the actual danger zone, including the safe gap on a double slam.
        radius = width*.48*min(1, progress*3)
        for band in range(3):
            self.oval(x, floor+7+band*3, max(1, radius*2-band*10),
                      8+band*4, mix(BACKGROUND, "#ffba60", fade*(.7-band*.15)))
        for i in range(9):
            origin = left+(i+.5)*width/9
            reach = (18+i%3*12)*min(1, progress*5)
            self.ribbon(((origin, floor+2), (origin-7, floor+reach*.4),
                         (origin+4, floor+reach*.7), (origin+1, floor+reach)),
                        2, mix(BACKGROUND, "#ffd394", fade))
        # Ballistic debris rises quickly and falls under gravity.
        for i in range(20):
            origin = left+(i+.5)*width/20
            age = progress*.75
            px = max(left+5, min(right-5, origin+math.sin(i*4.7)*age*24))
            py = floor+5+max(0, (90+i%5*22)*age-190*age*age)
            size = 2+i%3
            color = mix(BACKGROUND, "#c79b73", fade)
            self.poly(((px-size, py), (px, py+size*1.4),
                       (px+size, py+1), (px+1, py-size)), color)

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
                self._face(body_x, body_y, 1, True, glow, game.elapsed, game)
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
        if not game.won:
            self._attack_atmosphere(game)
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
                self._mouth_fire(x, y, width, height, game.elapsed, game.boss_x, game.boss_y-9)
            else:
                self._slam_impact(x, y, width, height, progress)
        self.draw_bone_walls(game.bullets)
        for bullet in game.bullets:
            if getattr(bullet, "bone", False):
                continue
            self._spell_projectile(bullet, game.elapsed)
        for ring in game.rings:
            self._runic_ring(ring, game.elapsed)
        for shot in game.shots:
            self.rect(shot.x, shot.y, 4, 12, "#67e8f9")
        for pickup in game.healing_pickups:
            self._candy(pickup, game.elapsed)
        if game.counter_time > 0:
            r = COUNTER_RANGE
            self.item("oval", (game.x-r, -game.y-r, game.x+r, -game.y+r),
                      fill="", outline="#ff69e5", width=3)
        if name == "wrath_ready" and not game.won:
            self._practice_countdown(game)
        if name in ("roar", "laugh"):
            self._vocal_caption(name, game.stage_age)
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
