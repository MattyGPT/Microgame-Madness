"""Boss-only attack choreography; all danger is telegraphed before activation."""
import math

INTRO_DURATION = 14.0
MOVES = (
    ('Circuit Lock', 'Pulse Grid', 'Node Crossfire'),
    ('Hammerfall', 'Furnace Bloom', 'Molten Cascade'),
    ('Drafting Cage', 'Array Rotation', 'Blueprint Collapse'),
    ('Frozen Crown', 'Ice Spear March', 'Glacial Shatter'),
    ('Heartpulse', 'Thorn Spiral', 'Petal Closure'),
    ('Thunder Count', 'Capacitor Chain', 'Lightning Encore'),
    ('Burning Crossroads', 'Impact Craters', 'Cinder Run'),
    ('Moon Gates', 'Crescent Prison', 'Doorway Collapse'),
    ('Mirror Cross', 'Doppelstar Bloom', 'Prism Fracture'),
    ('Reactor Spokes', 'Overload Sequence', 'Core Meltdown'),
    ('Tidal Eclipse', 'Bubble Shoal', 'Leviathan Wake'),
    ('Minute Hand', 'Pendulum Echo', 'Midnight Chime'),
    ('Root March', 'Seedpod Garden', 'Thorn Crown'),
    ('Fault Line', 'Obsidian Teeth', 'Basalt Crush'),
    ('Star Chart', 'Meteor Catalogue', 'Aurora Curtain'),
    ('Overtake', 'Neon Chicane', 'Finish Line'),
    ('Sealed Aisles', 'Inkblot Verse', 'Last Chapter'),
    ('Sun Court', 'Mirage Lattice', 'Solar Decree'),
    ('Hollow Hymn', 'Resonance Cross', 'Final Silence'),
    ('Crownfall', 'Infinity Seal', 'Regent’s Judgment'),
)


def boss_pressure(level, phase=1):
    """Continuous escalation with a steeper final-act ramp and readable windups."""
    progress = (max(1, min(20, level))-1)/19
    late = max(0, (level-10)/10)**1.4
    rage = max(0, min(2, phase-1))
    return dict(cast_interval=4.4-1.7*progress-1.05*late-.22*rage,
                volley_interval=2.0-.85*progress-.5*late-.07*rage,
                projectile_speed=160+110*progress+110*late+15*rage,
                warning=max(.55,1.1-.32*progress-.16*late-.035*rage),
                stagger=1-.36*progress-.18*late,
                dash_speed=340+140*progress+80*late,
                echoes=int(level>=11)+int(level>=16)+int(level>=19))


def boss_attack(game, enemy, phase):
    """Three distinct boss casts per arena, with phase-dependent geometry."""
    cast = game.boss_cast % 3
    game.boss_cast += 1
    game.boss_move = MOVES[game.level-1][cast]
    x, y = max(-350,min(350,game.x)), max(-240,min(240,game.y))
    angle = game.boss_cast * .43
    pressure = boss_pressure(game.level, phase)
    zones = []
    def add(shape, delay=0, **geometry):
        zones.append(dict(shape=shape, warning=pressure["warning"]+delay*pressure["stagger"], active=.65,
                          damage=18, source='boss', slow=game.level==4, **geometry))
    def circle(cx,cy,r=48,delay=0): add('circle',delay,x=cx,y=cy,r=r)
    def ring(cx,cy,r=120,delay=0): add('ring',delay,x=cx,y=cy,r=r,width=20)
    def beam(cx,cy,ex,ey,w=25,delay=0): add('beam',delay,x=cx,y=cy,ex=ex,ey=ey,width=w)
    def spokes(count, radius=260):
        for n in range(count):
            a=angle+n*math.tau/count
            beam(x+math.cos(a)*60,y+math.sin(a)*60,x+math.cos(a)*radius,y+math.sin(a)*radius,20,n*.09)
    def petals(count,radius=120):
        for n in range(count):
            a=angle+n*math.tau/count
            circle(x+math.cos(a)*radius,y+math.sin(a)*radius,32+phase*3,n*.08)
    level=game.level
    if level==1:
        for n in range(3):
            gx=-260+n*260
            if cast==0: beam(gx,-300,gx,300,24,n*.2)
            elif cast==1: beam(-430,-180+n*180,430,-180+n*180,24,n*.3)
            else: beam(gx,-280,x,y,20,n*.25)
    elif level==2:
        if cast==0:
            circle(x,y,75);ring(x,y,135,.45)
        elif cast==1: petals(5,150)
        else:
            for n in range(5): circle(-300+n*150,y,52,n*.3)
    elif level==3:
        if cast==0:
            for side in [-1,1]: beam(x+side*120,y-150,x+side*120,y+150)
            beam(x-120,y+150,x+120,y+150)
        elif cast==1: spokes(4+phase)
        else:
            for n in range(4): beam(-400,-260+n*160,400,-160+n*120,20,n*.25)
    elif level==4:
        if cast==0: ring(x,y,100);ring(x,y,180,.5)
        elif cast==1:
            for n in range(5): beam(-280+n*140,-300,-280+n*140,220,18,n*.18)
        else: petals(8,145)
    elif level==5:
        if cast==0:
            for n in range(3): ring(x,y,70+n*60,n*.4)
        elif cast==1: spokes(6)
        else: petals(6+phase,105)
    elif level==6:
        for n in range(4+phase):
            if cast==0: circle(x+(n%2*2-1)*65,y-140+n*60,32,n*.28)
            elif cast==1: beam(-320+n*100,-240,320-n*100,240,16,n*.2)
            else: circle(x+math.cos(n*2.4)*140,y+math.sin(n*2.4)*140,38,n*.3)
    elif level==7:
        if cast==0: beam(-440,y,440,y,40);beam(x,-310,x,310,40,.45)
        elif cast==1:
            for n in range(4): circle(x-180+n*120,y,55,n*.22)
        else: beam(enemy.x,enemy.y,x,y,70);ring(x,y,100,.65)
    elif level==8:
        if cast==0:
            for n in range(3): beam(-230+n*230,-200 if n%2 else -320,-230+n*230,320 if n%2 else 200,24,n*.25)
        elif cast==1: ring(x-100,y,140);ring(x+100,y,140,.3)
        else: petals(4,180)
    elif level==9:
        if cast==0: beam(-360,-220,360,220);beam(-360,220,360,-220,25,.4)
        elif cast==1: petals(5,155)
        else: spokes(7)
    elif level==10:
        if cast==0: spokes(3+phase)
        elif cast==1:
            for n in range(3): ring(0,0,90+n*80,n*.4)
        else: petals(5+phase,190);circle(x,y,45,.7)
    elif level==11:
        if cast==0: ring(x-130,y,170);ring(x+130,y,170,.35)
        elif cast==1: petals(7,155)
        else:
            for n in range(4): beam(-420,-230+n*145,420,-150+n*125,30,n*.3)
    elif level==12:
        if cast==0: spokes(2+phase)
        elif cast==1:
            for n in range(3): beam(x-200,y-200+n*120,x+200,y+120-n*120,22,n*.5)
        else:
            for n in range(8):
                a=n*math.pi/4;circle(math.cos(a)*230,math.sin(a)*230,35,n*.2)
    elif level==13:
        if cast==0:
            for n in range(6): circle(x-200+n*80,y+math.sin(n)*70,30,n*.2)
        elif cast==1: petals(5,160)
        else: spokes(7);ring(x,y,200,.5)
    elif level==14:
        if cast==0:
            for n in range(4): beam(x-200+n*100,y-200,x-100+n*100,y+200,28,n*.12)
        elif cast==1: petals(6,130)
        else: circle(x-85,y,65);circle(x+85,y,65,.25);ring(x,y,180,.6)
    elif level==15:
        if cast==0: spokes(5)
        elif cast==1:
            for n in range(6): circle(-300+n*120,math.sin(n*1.8)*220,40,n*.3)
        else:
            for n in range(3): beam(-300+n*250,-320,-180+n*250,320,28,n*.3)
    elif level==16:
        if cast==0:
            for n in range(4):
                if n!=game.boss_cast%4: beam(-440,-255+n*170,440,-255+n*170,65)
        elif cast==1:
            for n in range(3): beam(-400,-220+n*180,400,220-n*180,25,n*.25)
        else: beam(enemy.x,enemy.y,x,y,70);ring(x,y,110,.6)
    elif level==17:
        if cast==0:
            for n in range(3): beam(-400 if n%2 else -160,-210+n*210,160 if n%2 else 400,-210+n*210,32,n*.2)
        elif cast==1: petals(5,130)
        else: beam(x,-320,x,320,35);ring(x,y,160,.5)
    elif level==18:
        if cast==0: petals(8,180)
        elif cast==1: spokes(4);ring(x,y,130,.4)
        else:
            for n in range(5): beam(-350+n*160,-300,350-n*160,300,22,n*.15)
    elif level==19:
        if cast==0:
            for n in range(3): ring(x,y,80+n*65,n*.45)
        elif cast==1: beam(x-250,y-200,x+250,y+200);beam(x-250,y+200,x+250,y-200,25,.35)
        else: petals(6,180);circle(x,y,50,.9)
    else:
        if cast==0: petals(5+phase,220)
        elif cast==1:
            for n in range(10):
                a=n*math.tau/10;circle(math.sin(a)*250,math.sin(2*a)*140,30,n*.1)
        else: spokes(5+phase);ring(0,0,280,.5)
    # Late bosses chain a few existing shapes rather than filling every escape gap.
    original = list(zones)
    for n in range(min(pressure['echoes'] + (phase-1 if game.level>=11 else 0), 5)):
        if not original: break
        echo = dict(original[(cast+n*2) % len(original)])
        echo['warning'] += .75 + n*.22
        echo['active'] = .45
        zones.append(echo)
    # Bound overlapping choreography while retaining every visible warning.
    game.zones.extend(zones[:max(0,28-len(game.zones))])
