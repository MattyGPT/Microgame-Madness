"""Arena identities and readable, delayed hazards for Geomayhem."""
import math

# Background, quiet structure, secondary detail, hazard, boss.
ARENAS = (
    ("#0b2422", "#153b35", "#23594b", "Pulse rails", "Circuit Warden"),
    ("#281c12", "#49301c", "#704322", "Molten vents", "Foundry Colossus"),
    ("#1b1530", "#33244d", "#50346d", "Array beams", "Array Architect"),
    ("#102a39", "#214453", "#346575", "Frost fields", "Glacier Monarch"),
    ("#2b1628", "#48253c", "#70364e", "Bloom pulses", "Rose Heart"),
    ("#24250e", "#3a401b", "#5b6129", "Lightning strikes", "Volt Conductor"),
    ("#27191a", "#43282a", "#663731", "Burning streets", "Cinder Juggernaut"),
    ("#161d35", "#293253", "#414c72", "Lunar gates", "Labyrinth Keeper"),
    ("#25152e", "#432447", "#6b386a", "Rift collapses", "Prism Doppelstar"),
    ("#151720", "#2b2d3c", "#44495b", "Core overloads", "Mayhem Engine"),
    ("#102b32", "#204852", "#386572", "Tidal crescents", "Coral Leviathan"),
    ("#282217", "#473b27", "#6a593b", "Clock hands", "Brass Timekeeper"),
    ("#12291d", "#25452e", "#3c6041", "Thorn thickets", "Canopy Colossus"),
    ("#231b21", "#42303a", "#684337", "Obsidian fractures", "Basalt Behemoth"),
    ("#14243a", "#274057", "#39636c", "Aurora curtains", "Polar Astronomer"),
    ("#27182e", "#422743", "#6a3a60", "Turbo lanes", "Neon Pursuer"),
    ("#142938", "#294453", "#416577", "Sealing shelves", "Drowned Librarian"),
    ("#2a241c", "#4b402d", "#706044", "Mirage flares", "Mirage Sovereign"),
    ("#1c1930", "#332b4b", "#51416d", "Void seals", "Hollow Cantor"),
    ("#282330", "#464053", "#6a6075", "Crownfall", "Infinity Regent"),
)


def contains(zone, x, y, padding=0):
    if zone["shape"] == "circle":
        return math.hypot(x-zone["x"], y-zone["y"]) <= zone["r"] + padding
    if zone["shape"] == "ring":
        return abs(math.hypot(x-zone["x"], y-zone["y"])-zone["r"]) <= zone["width"]/2 + padding
    if zone["shape"] == "rect":
        return abs(x-zone["x"]) <= zone["w"]/2 + padding and abs(y-zone["y"]) <= zone["h"]/2 + padding
    dx, dy = zone["ex"]-zone["x"], zone["ey"]-zone["y"]
    t = max(0, min(1, ((x-zone["x"])*dx+(y-zone["y"])*dy)/max(1, dx*dx+dy*dy)))
    return math.hypot(x-zone["x"]-t*dx, y-zone["y"]-t*dy) <= zone["width"]/2 + padding


def queue_pattern(game, *, boss=False, phase=1):
    """Lock danger to visible positions, warn first, and leave room to escape."""
    level = game.level
    step = game.pattern_step
    game.pattern_step += 1
    warning = 1.15 if not boss else .95
    damage = 12 if not boss else 18
    # A small lead punishes running in one direction, without following after warning.
    x = max(game.left+85, min(game.right-85, game.x + game.velocity[0]*.35))
    y = max(game.bottom+85, min(game.top-85, game.y + game.velocity[1]*.35))
    def add(shape, **geometry):
        if len(game.zones) < 22:
            game.zones.append(dict(shape=shape, warning=warning, active=.85 if boss else 1.25,
                                   damage=damage, source="boss" if boss else "arena", slow=level==4,
                                   **geometry))
    def circle(cx, cy, radius=60):
        add("circle", x=cx, y=cy, r=radius)
    def beam(cx, cy, ex, ey, width=32):
        add("beam", x=cx, y=cy, ex=ex, ey=ey, width=width)
    if level == 1:
        add("rect", x=x, y=0, w=44, h=game.top*2)
        if boss: add("rect", x=0, y=y, w=game.right*2, h=32)
    elif level == 2:
        for dx in (-90, 90): circle(x+dx, y, 65)
        if boss: circle(x, y+105 if y<0 else y-105, 78)
    elif level == 3:
        beam(game.left, y-100, game.right, y+100)
        if boss: beam(x-100, game.bottom, x+100, game.top)
    elif level == 4:
        circle(x, y, 90)
        if boss:
            add("ring", x=x, y=y, r=155, width=30)
    elif level == 5:
        for i in range(4 if not boss else 6):
            angle=step*.6+i*math.tau/(4 if not boss else 6)
            circle(x+math.cos(angle)*105, y+math.sin(angle)*105, 45)
    elif level == 6:
        for i in range(2 if not boss else 3):
            circle(x-game.velocity[0]*i*.45, y-game.velocity[1]*i*.45, 45+i*9)
    elif level == 7:
        add("rect", x=0, y=y, w=game.right*2, h=48)
        if boss: add("rect", x=x, y=0, w=48, h=game.top*2)
    elif level == 8:
        # Alternating gates make changing corridors, with generous gaps at their ends.
        for i, gx in enumerate((-220, 0, 220)):
            gy=110 if (step+i)%2 else -110
            add("rect", x=gx, y=gy, w=34, h=260)
        if boss: add("ring", x=x, y=y, r=100, width=28)
    elif level == 9:
        circle(x-90, y-65, 70)
        circle(x+90, y+65, 70)
        if boss: beam(x-180, y+120, x+180, y-120, 36)
    elif level == 10:
        angle=step*.55
        for i in range(2 if not boss else 3):
            a=angle+i*math.pi/(2 if not boss else 3)
            beam(-math.cos(a)*580, -math.sin(a)*580, math.cos(a)*580, math.sin(a)*580, 28)
        if boss: add("ring", x=0, y=0, r=160+(step%2)*60, width=32)
    elif level == 11:  # Two tidal arcs with an open centre and a changing exit.
        add("ring", x=x-125, y=y, r=150, width=26)
        if boss: add("ring", x=x+125, y=y, r=215, width=24)
    elif level == 12:
        angle=step*math.pi/6
        beam(x,y,x+math.cos(angle)*360,y+math.sin(angle)*360,30)
        if boss: beam(x,y,x+math.cos(angle+2)*260,y+math.sin(angle+2)*260,42)
    elif level == 13:
        for i in range(3 if not boss else 5):
            circle(x+(i-2)*80,y+math.sin(i+step)*90,38)
    elif level == 14:
        for side in (-1,1):
            beam(x+side*160,y-190,x+side*35,y,26)
            beam(x+side*35,y,x+side*160,y+190,26)
        if boss: circle(x,y-140,55)
    elif level == 15:
        for i in range(2 if not boss else 3):
            offset=(i-1)*150
            beam(x+offset-80,game.bottom,x+offset+80,game.top,26)
    elif level == 16:
        # Leave one of four horizontal lanes open, alternating with each cast.
        for i,cy in enumerate((-255,-85,85,255)):
            if i != step%4: add("rect",x=0,y=cy,w=930,h=58 if not boss else 76)
    elif level == 17:
        for i,cy in enumerate((-210,0,210)):
            cx=-190 if (step+i)%2 else 190
            add("rect",x=cx,y=cy,w=320,h=34)
        if boss: beam(x,game.bottom,x,game.top,28)
    elif level == 18:
        for i in range(3 if not boss else 5):
            angle=step*.8+i*math.tau/(3 if not boss else 5)
            circle(x+math.cos(angle)*155,y+math.sin(angle)*105,52)
        if boss: add("ring",x=x,y=y,r=240,width=22)
    elif level == 19:
        add("ring",x=x,y=y,r=120,width=34)
        beam(x-230,y-160,x+230,y+160,24)
        if boss: beam(x-230,y+160,x+230,y-160,24)
    elif level == 20:
        for i in range(5):
            angle=step*.4+i*math.tau/5
            circle(math.cos(angle)*230,math.sin(angle)*200,45)
        if boss:
            add("ring",x=0,y=0,r=290,width=26)
            beam(x-160,y+80,x+160,y-80,30)
    if boss and phase >= 2:
        # Phase two adds an aimed mark rather than silently increasing damage.
        circle(x, y, 45 if phase==2 else 65)


def draw_background(game, rect, circle, line, polygon):
    bg, structure, detail, _, _ = ARENAS[game.level-1]
    rect(0, 0, game.right-game.left, game.top-game.bottom, bg)
    level=game.level
    if level == 1:  # Printed circuit board.
        for x in range(-400, 401, 100):
            for y in range(-300, 301, 100):
                line(x, y, x+50, y, 3, structure)
                line(x+50, y, x+50, y+60, 3, structure)
                circle(x, y, 7, bg, detail, 2)
    elif level == 2:  # Steel plates, furnace vents and conveyor tracks.
        for x in range(-360, 361, 180):
            for y in (-230, 0, 230):
                rect(x,y,150,185,structure,detail)
                for dy in (-55,-25,5,35): rect(x,y+dy,104,7,bg)
        for x in (-445,445):
            rect(x,0,15,660,detail)
            for y in range(-300,301,40):line(x-8,y,x+8,y+15,3,structure)
    elif level == 3:  # Linked triangular arrays.
        for x in range(-400,401,100):
            for y in range(-300,301,100):
                polygon(x,y,49,3,structure,detail,angle=(x+y)/100*math.pi)
                circle(x,y,8,bg,detail,1)
    elif level == 4:  # Fractured ice plates.
        for x in range(-400,401,130):
            for y in range(-300,301,115):
                polygon(x,y,62,6,structure,detail,angle=.2)
                line(x-45,y-20,x+10,y+15,2,bg)
                line(x+10,y+15,x+35,y+50,2,bg)
    elif level == 5:  # Flower reactors and connecting pipes.
        for x,y in ((-300,-210),(300,-210),(-300,210),(300,210),(0,0)):
            for i in range(6):
                a=i*math.tau/6
                circle(x+math.cos(a)*37,y+math.sin(a)*37,30,structure,detail,1)
            circle(x,y,24,bg,detail,3)
            line(x,y,0,0,4,structure)
    elif level == 6:  # Capacitors and zigzag current channels.
        for x in range(-400,401,160):
            for y in (-240,0,240):
                rect(x,y,62,108,structure,detail)
                line(x-16,y+35,x+14,y,4,detail)
                line(x+14,y,x-12,y-35,4,detail)
        for y in (-130,130):line(-450,y,450,y,3,detail)
    elif level == 7:  # Charred city blocks and broken street markings.
        for x in (-330,-110,110,330):
            for y in (-240,0,240):
                rect(x,y,140,145,structure,detail)
                for dx in (-35,0,35):
                    for dy in (-35,0,35):rect(x+dx,y+dy,12,15,detail)
        for y in (-120,120):
            for x in range(-440,441,50):rect(x,y,20,3,detail)
    elif level == 8:  # Lunar craters around a staggered maze.
        for x,y,r in ((-350,240,52),(320,-230,67),(-320,-250,38),(350,240,33)):
            circle(x,y,r,structure,detail,2);circle(x-12,y+10,r*.55,bg)
        for i,x in enumerate((-220,0,220)):
            y=110 if i%2 else -110
            rect(x,y,34,260,structure,detail)
            line(x,y+130,x+110,y+130,5,detail)
        for i in range(22):circle(-440+(i*137)%880,-325+(i*193)%650,1,detail)
    elif level == 9:  # Faceted prism islands with split rifts.
        for x in range(-360,361,180):
            for y in (-240,0,240):
                polygon(x,y,80,4,structure,detail,angle=.35)
                line(x-60,y-45,x+60,y+45,3,detail)
                polygon(x+10,y,25,3,bg,detail,angle=-.3)
    elif level == 10:  # The central machine, radial conduits and segmented rings.
        for r in (65,130,210,300,390):polygon(0,0,r,12,"",structure,width=8)
        for i in range(12):
            a=i*math.tau/12
            line(math.cos(a)*80,math.sin(a)*80,math.cos(a)*440,math.sin(a)*330,3,detail)
        polygon(0,0,52,8,structure,detail)
        circle(0,0,24,bg,detail,3)
    elif level == 11:  # Coral branches, bubbles and rippling seabed.
        for y in (-270,-90,90,270):
            for x in range(-420,421,60):
                line(x,y+math.sin(x/85)*14,x+60,y+math.sin((x+60)/85)*14,3,structure)
        for x,y in ((-350,-230),(330,230),(-340,220),(340,-210)):
            for dx in (-35,0,35):
                line(x,y-60,x+dx,y+35,7,detail)
                circle(x+dx,y+45,12,structure,detail)
            circle(x+65,y+65,18,"",structure)
    elif level == 12:  # Interlocking cogs and a giant clock face.
        for x,y,r in ((0,0,165),(-320,215,95),(320,-215,95),(-320,-215,60),(320,215,60)):
            polygon(x,y,r,12,structure,detail,star=True,width=3)
            circle(x,y,r*.62,bg,detail,3)
        for i in range(12):
            a=i*math.tau/12
            line(math.cos(a)*125,math.sin(a)*125,math.cos(a)*140,math.sin(a)*140,4,detail)
        line(0,0,60,80,7,detail);line(0,0,-90,0,5,detail)
    elif level == 13:  # Overlapping leaves and branching vines.
        for x in range(-400,401,160):
            for y in range(-280,281,140):
                polygon(x,y,66,4,structure,detail,angle=.65)
                line(x-40,y-30,x+40,y+30,3,detail)
        for x in (-240,240):
            line(x,-350,x,350,8,structure)
    elif level == 14:  # Black glass slabs separated by copper seams.
        for x in range(-400,401,160):
            for y in range(-280,281,140):
                polygon(x,y,83,5,structure,detail,angle=.4)
                polygon(x-15,y+12,40,3,bg,angle=.2)
        for x in (-280,0,280):
            line(x-80,-350,x+65,0,5,detail);line(x+65,0,x-40,350,5,detail)
    elif level == 15:  # Observatory lens and bands of polar light.
        for offset in (-190,-100,100,190):
            for x in range(-450,450,45):
                line(x,offset+math.sin(x/130)*35,x+45,offset+math.sin((x+45)/130)*35,12,structure)
        circle(0,0,115,"",detail,3);circle(0,0,75,"",structure,8)
        for i in range(35):circle(-440+(i*173)%880,-330+(i*127)%660,2,detail)
        line(-130,0,130,0,2,detail);line(0,-130,0,130,2,detail)
    elif level == 16:  # Racing lanes, starting grid and chevrons.
        for y in (-340,-170,0,170,340):line(-465,y,465,y,4,detail)
        for x in (-360,-120,120,360):
            for y in (-255,-85,85,255):
                line(x-25,y-25,x+10,y,6,structure);line(x+10,y,x-25,y+25,6,structure)
        for i in range(14):rect(-440,-325+i*50,22,24,detail if i%2 else structure)
    elif level == 17:  # Sunken book stacks and circular water stains.
        for x in (-325,-110,110,325):
            for y in (-230,0,230):
                rect(x,y,145,125,structure,detail)
                for i in range(6):rect(x-55+i*22,y,12,85,detail if i%3 else bg)
        for x,y in ((-220,110),(220,-110),(0,280)):circle(x,y,45,"",detail,2)
    elif level == 18:  # Palace diamonds, pillars and sand contours.
        for x in (-330,0,330):
            for y in (-230,0,230):
                polygon(x,y,100,4,structure,detail,angle=math.pi/4)
                polygon(x,y,55,4,bg,detail,angle=math.pi/4)
        for x in (-445,445):
            for y in (-280,0,280):rect(x,y,25,130,detail)
        for y in (-115,115):line(-465,y,465,y,3,structure)
    elif level == 19:  # Gothic pillars and fractured stained-glass windows.
        for x in (-330,0,330):
            for y in (-210,210):
                polygon(x,y,105,6,structure,detail,angle=math.pi/6)
                polygon(x,y,80,3,bg,detail,angle=-math.pi/2)
                line(x-70,y,x+70,y,3,detail)
        for x in (-180,180):rect(x,0,30,650,structure,detail)
        circle(0,0,70,"",detail,3)
    elif level == 20:  # Twin infinity loops encircling a five-point crown.
        for x in (-135,135):
            for r in (135,160,185):circle(x,0,r,"",structure,5)
        polygon(0,0,95,5,structure,detail,angle=math.pi/2,star=True,width=4)
        for i in range(10):
            a=i*math.tau/10
            polygon(math.cos(a)*370,math.sin(a)*285,26,4,structure,detail,angle=a)
