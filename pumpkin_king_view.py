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

from pumpkin_king import Finger, KING_WIDTH, KING_HEIGHT, COUNTER_RANGE

COLORS = {"normal": "#fff5e5", "blue": "#42c9ff", "orange": "#ff9d32", "magenta": "#ff42de"}
BACKGROUND = "#111827"


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
            for name, duration in (("roar", 0.6), ("laugh", 0.75), ("slam", 0.12)):
                rng = random.Random(12)
                rate = 22050
                samples = bytearray()
                for i in range(int(rate*duration)):
                    t = i/rate
                    envelope = min(1, t*30) * (1-t/duration)
                    if name == "laugh":
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

    def text(self, x, y, text, color, size=18):
        return self.item("text", (x, -y), text=text, fill=color, font=("Arial", size, "bold"), anchor="center")

    def _arm(self, game, side, extent):
        if extent <= 0:
            return
        t = game.elapsed
        raised = game.stage.name == "raise" and game.stage.side in (side, "both")
        sign = -1 if side == "left" else 1
        shoulder_y = 219 if not game.transformed else 130
        if game.stage.name == "shatter":
            shoulder_y = 219-89*min(1, game.stage_age/game.stage.duration)
        lift = 45 * min(1, game.stage_age/0.5) if raised else 0
        for i in range(24):
            progress = (i+0.5)/24
            if progress > extent:
                break
            x = sign*(45+progress*242)
            y = shoulder_y+10 - progress*65 + math.sin(progress*math.pi)*18 + lift*progress
            hue = (0.08 + progress*0.12 + math.sin(t*2+progress*5)*0.08) % 1
            prism = colorsys.hsv_to_rgb((t*0.15+progress*0.8) % 1, 0.7, 1)
            color = '#'+''.join(f'{int(c*255):02x}' for c in colorsys.hsv_to_rgb(hue, 0.85, 1))
            edge = '#'+''.join(f'{int(c*255):02x}' for c in prism)
            self.rect(x, y, 14, 40+progress*20, edge)
            self.rect(x, y, 14, 29+progress*14, color)
        if extent >= 0.95:
            for finger in range(4):
                x = sign*(245+finger*12)
                self.rect(x, shoulder_y-92+lift+(finger%2)*8, 10, 42, "#ff42de" if game.stage.name == "fingers" else "#ffc14d")

    def _face(self, x, y, scale, shell, glow, t):
        if shell:
            self.rect(x, y, 72, 42, "#ffffff")
        else:
            # Layered flames animate independently of the collision rectangle.
            for layer, color in ((0, "#b73218"), (1, "#ff6a16"), (2, "#ffbd38")):
                points = [(x-50+layer*5, y-35), (x+50-layer*5, y-35)]
                for i in range(10, -1, -1):
                    px = x-50+layer*5 + i*(100-layer*10)/10
                    peak = 20 + 16*math.sin(t*9+i*2+layer) + 14*(i%2)
                    points.append((px, min(235, y+28+peak-layer*8)))
                self.poly(points, color)
            self.rect(x, y, KING_WIDTH, KING_HEIGHT, "#ff9d25")
            for i in range(5):
                self.rect(x-40+i*20, y, 3, 72, "#f77719")
        features = (
            ((-25, 3), (-10, 5), (-17, 15)), ((10, 5), (25, 3), (17, 15)),
            ((-4, 0), (4, 0), (0, 6)),
            ((-25, -5), (-18, -8), (-14, -4), (-8, -8), (0, -5), (8, -8),
             (14, -4), (18, -8), (25, -5), (22, -15), (14, -12), (8, -16),
             (0, -12), (-8, -16), (-14, -12), (-22, -15)),
        )
        for index, polygon in enumerate(features):
            color = glow if shell or index < 2 else "#38201c"
            self.poly([(x+px*scale, y+py*scale) for px, py in polygon], color)

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
        left = 0 if name in ("shell", "glow") else progress if name == "left_burst" else 1
        right = 0 if name in ("shell", "glow", "left_burst") else progress if name == "right_burst" else 1
        if not game.won:
            self._arm(game, "left", left)
            self._arm(game, "right", right)
            if name in ("shell", "glow", "left_burst", "right_burst") and not game.intro_done:
                glow = "#111827" if name == "shell" else mix("#111827", "#ffef42", progress if name == "glow" else 1)
                self._face(0, 219, 1, True, glow, game.elapsed)
            else:
                glow = COLORS.get(game.eye_rule, "#fff351" if game.hit_flash > 0 else "#38201c")
                self._face(0, 130, 1.65, False, glow, game.elapsed)
                if name == "shatter" and not game.intro_done:
                    for i in range(22):
                        angle = i*2.399
                        x = math.cos(angle)*(25+progress*155)
                        y = 219 + math.sin(angle)*progress*55-progress*progress*210
                        self.poly(((x-5, y), (x+6, y+4), (x+2, y+12)), mix("#ffffff", bg, progress))
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
