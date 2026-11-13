"""Eight King's Wrath exclusives. Geometry is shared by collision and drawing."""
import math
from dataclasses import dataclass

NEW_ATTACKS = {
    "starfall_verdict": ("STARFALL VERDICT", "Leave the star marks before the meteors land.", ("#ffe9ab", "#ffbf55", "#ff5c86")),
    "pendulum_court": ("PENDULUM COURT", "Dodge the swinging clock hands; dashed hands are warnings.", ("#bce9ef", "#64d9e8", "#ff8761")),
    "crown_chess": ("CROWN CHESS", "Leave the marked chess squares before they light up.", ("#e8ddff", "#ba9cff", "#f45ba8")),
    "mirror_lances": ("MIRROR LANCES", "Pass through the openings in the advancing mirror walls.", ("#b9f5f0", "#6ce6eb", "#6a97ff")),
    "briar_pursuit": ("BRIAR PURSUIT", "Keep moving; seeds bloom into thorns behind you.", ("#ceefae", "#8bd470", "#e96f9b")),
    "eclipse_waltz": ("ECLIPSE WALTZ", "Stay inside the moving moonlight. The dark floor hurts.", ("#d4ddff", "#b49aff", "#f17cdd")),
    "resonant_bells": ("RESONANT BELLS", "Dodge the expanding sound rings, or tap E as they reach you.", ("#ffe6ad", "#ffc76e", "#ff8360")),
    "royal_loom": ("ROYAL LOOM", "Dodge lit threads and filled squares. Dashed outlines warn before they fire.", ("#c5eeff", "#74b9ff", "#ff71df")),
}


@dataclass(frozen=True)
class Hazard:
    shape: str
    coords: tuple
    active: bool
    progress: float = 0
    token: int = -1

    def hits(self, x, y, radius=12):
        if not self.active:
            return False
        if self.shape == "rect":
            cx, cy, w, h = self.coords
            return abs(x-cx) < w/2+radius and abs(y-cy) < h/2+radius
        if self.shape in ("disc", "safe", "ring"):
            cx, cy, r, *extra = self.coords
            distance = math.hypot(x-cx, y-cy)
            if self.shape == "safe":
                return distance > r-radius
            if self.shape == "ring":
                return abs(distance-r) < extra[0]/2+radius
            return distance < r+radius
        ax, ay, bx, by, width = self.coords
        dx, dy = bx-ax, by-ay
        t = max(0, min(1, ((x-ax)*dx+(y-ay)*dy)/(dx*dx+dy*dy or 1)))
        return math.hypot(x-ax-t*dx, y-ay-t*dy) < width/2+radius


class WrathPattern:
    def __init__(self, key, variant, rng):
        self.key, self.variant, self.rng = key, variant, rng
        self.level = ("easy", "normal", "hard").index(variant)
        self.age = 0.0
        self.next_event = 0.0
        self.serial = 0
        self.events = []
        self.countered = set()
        self.duration = (10, 12, 14)[self.level]
        self.warning = (1.4, 1.05, .8)[self.level]
        if key == "pendulum_court" and self.level == 2:
            self.warning /= 1.5 * 1.25 * 1.25
            self.duration /= 1.25
        self.interval = {
            "starfall_verdict": (2.2, 1.8, 1.45), "pendulum_court": (3.4, 3, 2.7),
            "crown_chess": (2.8, 2.4, 2), "mirror_lances": (3.2, 2.7, 2.4),
            "briar_pursuit": (.7, .5, .35), "eclipse_waltz": (99, 99, 99),
            "resonant_bells": (2.8, 2.3, 1.8), "royal_loom": (2.7, 2.2, 1.9),
        }[key][self.level]
        if key == "pendulum_court" and self.level == 2:
            self.interval = .75
        if key == "starfall_verdict":
            self.warning /= 1.3
            self.interval /= 1.3
            self.duration /= 1.3
        if key == "crown_chess":
            self.warning /= 1.5
            self.interval /= 1.5
            self.duration /= 1.5
        if key == "royal_loom":
            self.warning /= 1.6
            self.interval /= 1.6
            self.duration /= 1.6
        self.hazards = []

    def update(self, dt, x, y):
        self.age += dt
        while self.next_event <= self.age + 1e-9:
            # Stop creating new threats shortly before the reset.
            if self.next_event + self.warning < self.duration:
                self.events.append((self.serial, self.next_event, x, y, self.rng.uniform(-1, 1)))
                self.serial += 1
            self.next_event += self.interval
        self.events = [e for e in self.events if self.age-e[1] < 6]
        live_tokens = {e[0] for e in self.events}
        self.countered.intersection_update(live_tokens)
        self.hazards = self.geometry()

    def geometry(self):
        shapes = []
        k, level = self.key, self.level
        if k == "eclipse_waltz":
            t = max(0, self.age-1.6) * (1 if level == 0 else 1.25)
            speed = (.35, .48, .62)[level]
            x = (75, 135, 175)[level]*math.sin(t*speed)
            y = -120-45*math.cos(t*speed)
            radius = (122, 96, 78)[level] + (6*math.sin(t*2) if level == 2 else 0)
            if level == 2:
                radius *= .9
            shapes.append(Hazard("safe", (x, y, radius), self.age > 1.6))
            return shapes
        for token, birth, px, py, seed in self.events:
            age = self.age-birth
            t = age-self.warning
            active = t >= 0
            progress = max(0, min(1, age/self.warning))
            def add(shape, coords, live=active):
                shapes.append(Hazard(shape, tuple(coords), live, progress, token))
            if k == "starfall_verdict" and t < .5 / 1.3:
                radius = (34, 44, 52)[level]
                for offset in ((0,) if level < 2 else (-115, 0, 115)):
                    add("disc", (max(-260, min(260, px+offset)), max(-200, min(25, py)), radius))
                if level == 2:
                    # A fourth impact above/below the row stays on the playable floor.
                    fourth_y = py + 115 if py < -85 else py - 115
                    add("disc", (max(-260, min(260, px)), max(-200, min(25, fourth_y)), radius))
            elif k == "pendulum_court" and t < 1.7 / (1, 1.15, 1.3 * 1.25)[level]:
                for side in ((-1,) if level == 0 else ((-1, 1, 0) if level == 2 else ((-1,) if token % 2 == 0 else (1,)))):
                    ax, ay = side*(189 if level == 2 else 210), -5 if level >= 1 else 35
                    swing_time = max(0, t) * (1, 1.15, 1.3 * 1.25)[level]
                    direction = side or (-1 if token % 2 == 0 else 1)
                    angle = -math.pi/2-direction*(.95-math.pi*swing_time/(2.8,2.2,1.8)[level])
                    # Midnight's blades trade high/low reach on every swing.
                    # Use the same reach for the warning and damaging blade.
                    reach = (210 if (token + (side == 1)) % 2 == 0 else 270) if level == 2 else 300
                    if level == 2 and side == 0:
                        ay += 55
                        # Travel across the court, reversing on the next wave.
                        # Freeze at the starting position during the warning.
                        ax = direction * 90 * math.cos(math.pi * swing_time / 1.7)
                        reach = 240
                    add("line", (ax, ay, ax+reach*math.cos(angle), ay+reach*math.sin(angle), (10,14,18)[level]))
            elif k == "crown_chess" and t < .65 / 1.5:
                divisor = (4, 3, 2)[level]
                for row in range(3):
                    for col in range(6):
                        if (col+row+token) % divisor == 0:
                            add("rect", (-250+col*100, -190+row*100, 96, 96))
            elif k == "mirror_lances" and t < 3.4:
                horizontal = level == 0 or token % 2 == 0
                gap = (140, 112, 92)[level]
                # Both hard walls share one safe opening, never sealing it.
                opening = (-140, -65, 10)[token % 3] if horizontal else (-170, 0, 170)[token % 3]
                for direction in ((1, -1) if level == 2 else ((1,) if token % 2 == 0 else (-1,))):
                    speed = (170, 230, 258.75)[level]
                    position = direction*(-310+max(0,t)*speed)
                    if not active:
                        # Entry warnings must be inside the visible arena, not off-screen.
                        position = -direction*288 if horizontal else (-225 if direction == 1 else 35)
                    low, high = (-240, 45) if horizontal else (-300, 300)
                    for a,b in ((low, opening-gap/2),(opening+gap/2,high)):
                        if b <= a: continue
                        coords = (position, (a+b)/2, 14, b-a) if horizontal else ((a+b)/2, position, b-a, 14)
                        add("rect", coords)
            elif k == "briar_pursuit" and t < (1.5, 2.1, 2.7)[level]:
                radius = (20, 25, 29)[level]
                add("disc", (px, py, radius))
                if level == 2:
                    add("disc", (max(-270,min(270,px+(-65 if token%2 else 65))), py, 21))
            elif k == "resonant_bells" and t < 3.5 and token not in self.countered:
                centers = ((0,-55),) if level == 0 else ((-185,-65),(185,-65),(0,-170))
                cx,cy = centers[token % len(centers)]
                add("ring", (cx,cy, 22+max(0,t)*(85,110,135)[level], (8,10,13)[level]))
                if level == 2 and t > .55:
                    add("ring", (cx,cy,22+(t-.55)*135,10))
            elif k == "royal_loom" and t < .75 / 1.6:
                horizontal = token % 2 == 0
                size = (90, 105, 120)[level]
                for i in range(level + 1):
                    col = (token + i * 2) % 5
                    row = (token + i) % 2
                    add("rect", (-240 + col * 120, -175 + row * 140, size, size))
                for i in range((1,2,3)[level]):
                    offset = ((token*83+i*125) % 470)-235
                    coords = (-300, -110+offset*.45, 300, -110+offset*.45, 12) if horizontal else (offset,-240,offset,45,12)
                    add("line", coords)
                if level == 2:
                    offset = 190*math.sin(token*2)
                    add("line", (offset,-240,offset,45,10) if horizontal else (-300,-100,300,-100,10))
        return shapes

    def collide(self, game):
        for hazard in self.hazards:
            if hazard.token in self.countered or not hazard.hits(game.x, game.y):
                continue
            if self.key == "resonant_bells" and game.counter_time > 0:
                self.countered.add(hazard.token)
                game.counter_hits += 1
                game.sound_events.append("counter")
            else:
                game.hurt(2 if self.key == "mirror_lances" and self.level == 2 else 1)
        self.hazards = [h for h in self.hazards if h.token not in self.countered]


def draw_wrath_pattern(view, game):
    pattern = getattr(game, "wrath_pattern", None)
    if pattern is None or game.won:
        return
    key, level = pattern.key, pattern.level
    color = NEW_ATTACKS[key][2][level]
    dark = "#192332"
    pale = "#fff3db"

    def line(ax,ay,bx,by,width=2,tint=color,dashed=False):
        view.item("line", (ax,-ay,bx,-by), fill=tint, width=width, dash=(7,5) if dashed else ())

    def circle(x,y,r,width=2,tint=color,dashed=False,fill=""):
        view.item("oval", (x-r,-y-r,x+r,-y+r), fill=fill, outline=tint,
                  width=width, dash=(6,5) if dashed else ())

    def emblem(x,y,r=17):
        if key == "starfall_verdict":
            points=[(x+math.sin(i*math.pi/5)*r*(1 if i%2==0 else .42),
                     y+math.cos(i*math.pi/5)*r*(1 if i%2==0 else .42)) for i in range(10)]
            view.poly(points,color)
        elif key == "pendulum_court":
            circle(x,y,r,3)
            a=game.elapsed*(1+level*.3)
            line(x,y,x+math.sin(a)*r*.7,y+math.cos(a)*r*.7,3)
            line(x,y,x-r*.5,y,2)
        elif key == "crown_chess":
            view.poly(((x-r,y+r),(x-r*.4,y+r*.5),(x,y+r),(x+r*.4,y+r*.5),
                       (x+r,y+r),(x+r*.65,y-r),(x-r*.65,y-r)),color)
            view.rect(x,y-r,r*1.8,4,pale)
        elif key == "mirror_lances":
            view.poly(((x,y+r),(x+r*.65,y),(x,y-r),(x-r*.65,y)),color)
            line(x-r*.3,y-r*.3,x+r*.3,y+r*.3,2,pale)
        elif key == "briar_pursuit":
            for i in range(5):
                a=i*math.tau/5
                if level==2:
                    view.poly(((x,y),(x+math.cos(a)*r,y+math.sin(a)*r),
                               (x+math.cos(a+.5)*r*.5,y+math.sin(a+.5)*r*.5)),color)
                else: view.oval(x+math.cos(a)*r*.5,y+math.sin(a)*r*.5,r*.8,r*.8,color)
            circle(x,y,r*.2,2,pale,fill=pale)
        elif key == "eclipse_waltz":
            circle(x,y,r,2,fill=color)
            view.oval(x+r*.45,y+r*.25,r*1.8,r*1.8,dark)
        elif key == "resonant_bells":
            view.poly(((x-r,y-r*.6),(x-r*.65,y),(x-r*.5,y+r*.7),
                       (x,y+r),(x+r*.5,y+r*.7),(x+r*.65,y),(x+r,y-r*.6)),color)
            circle(x,y-r*.8,r*.2,2,pale,fill=pale)
        else:
            for d in (-1,0,1):
                line(x-r,y+d*r*.6,x+r,y+d*r*.6,2)
                line(x+d*r*.6,y-r,x+d*r*.6,y+r,2,pale)

    # Eight different regalia silhouettes, with soft medallions on Easy and
    # jagged coronets on Hard. Decoration never participates in collisions.
    for x in (-140,140):
        if level==0: circle(x,200,25,2,tint="#738a8d")
        elif level==2:
            view.poly(((x-27,185),(x-30,222),(x-12,209),(x,230),
                       (x+12,209),(x+30,222),(x+27,185)),dark)
            for side in (-1,1): line(x+side*27,185,x+side*30,222,3)
        emblem(x,200,18)
    emblem(0,211,22)
    if game.stage.name != "wrath_exclusive":
        return
    for h in pattern.hazards:
        tint = color if h.active else "#a0abbc"
        width = 3 if h.active else 1.5
        if h.shape in ("disc", "ring", "safe"):
            x,y,r,*extra=h.coords
            if h.shape=="safe":
                circle(x,y,r,4,color,not h.active)
                circle(x,y,r-8,1,"#e8dfff")
                view.text(x,y,"MOONLIGHT",pale,11)
            elif h.shape=="ring":
                circle(x,y,r,extra[0] if h.active else 2,tint,not h.active)
                emblem(x,y,12)
            else:
                circle(x,y,r,width,tint,not h.active, "#442b3a" if h.active else "")
                if h.active:
                    emblem(x,y,r*.65)
                    if key=="starfall_verdict":
                        line(x+18,y+70,x,y+12,4,pale)
                else:
                    circle(x,y,max(3,r*(1-h.progress)),1,color)
                    if key=="briar_pursuit": view.oval(x,y,7,9,color)
                    else: line(x-8,y,x+8,y,1);line(x,y-8,x,y+8,1)
        elif h.shape=="rect":
            x,y,w,height=h.coords
            if h.active: view.rect(x,y,w,height,"#42304a" if key=="crown_chess" else color)
            view.item("rectangle",(x-w/2,-y-height/2,x+w/2,-y+height/2),
                      fill="",outline=tint,width=width,dash=() if h.active else (6,5))
            if key=="crown_chess": emblem(x,y,17 if h.active else 11)
            elif h.active:
                line(x-w/2+2,y-height/2+2,x+w/2-2,y+height/2-2,2,pale)
        else:
            ax,ay,bx,by,w=h.coords
            line(ax,ay,bx,by,w if h.active else 2,tint,not h.active)
            if h.active: line(ax,ay,bx,by,2,pale)
            if key=="pendulum_court":
                circle(ax,ay,10,3,color)
                view.poly(((bx-13,by),(bx,by-18),(bx+13,by),(bx,by+18)),color)
            else:
                for x,y in ((ax,ay),(bx,by)): circle(x,y,6,2,color)


def draw_wrath_floor(view, game):
    """Paint eclipse danger behind the King, including the upper escape corners."""
    pattern = getattr(game, "wrath_pattern", None)
    if not pattern or pattern.key != "eclipse_waltz" or game.stage.name != "wrath_exclusive" or game.won:
        return
    for hazard in pattern.hazards:
        x, y, radius = hazard.coords
        for cy in range(-234, 240, 12):
            span = math.sqrt(max(0, radius*radius-(cy-y)**2)) if abs(cy-y) < radius else 0
            for a, b in ((-300, max(-300, x-span)), (min(300, x+span), 300)):
                if b > a:
                    view.rect((a+b)/2, cy, b-a, 12, "#281c3d" if hazard.active else "#192332")
