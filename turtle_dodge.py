"""Turtle graphics interface and isolated launcher for Turtle Dodge."""

import math
import os
from pathlib import Path
import subprocess
import sys
import time

from dodge_model import BLOCK_SIZE, CELL, DIFFICULTIES, DodgeGame, PLAYER_POLYGON
from boss_crush import (BOSS_DIFFICULTIES, BOSS_WIDTH, BOSS_HEIGHT,
                        HEAL_SIZE, SHOT_WIDTH, SHOT_HEIGHT, BossCrush)
from scores import SCORE_FILE, ScoreError, load_scores, save_score
from pumpkin_king import MODE as PHASE_TWO, PumpkinKing

DODGE_SCORE_FILE = SCORE_FILE.with_name("turtle_scores.json")
CANVAS_WIDTH, CANVAS_HEIGHT = 680, 660


def register_pumpkin_shape(turtle, screen, name="white_jack_o_lantern", eye_color="#111827"):
    """A carved white face inside the boss's unchanged rectangular silhouette."""
    shape = turtle.Shape("compound")
    half_w, half_h = BOSS_WIDTH / 2, BOSS_HEIGHT / 2
    shape.addcomponent(((-half_w, -half_h), (half_w, -half_h),
                        (half_w, half_h), (-half_w, half_h)), "#ffffff", "#ffffff")
    for x in (-28, -8, 8, 28):
        shape.addcomponent(((x, -18), (x + 1.5, -18), (x + 1.5, 18), (x, 18)),
                           "#d5d8df", "#d5d8df")
    features = (
        ((-25, 3), (-10, 5), (-17, 15)),
        ((10, 5), (25, 3), (17, 15)),
        ((-4, 0), (4, 0), (0, 6)),
        ((-25, -5), (-18, -8), (-14, -4), (-8, -8), (0, -5),
         (8, -8), (14, -4), (18, -8), (25, -5), (22, -15),
         (14, -12), (8, -16), (0, -12), (-8, -16), (-14, -12), (-22, -15)),
    )
    for index, polygon in enumerate(features):
        color = eye_color if index < 2 else "#111827"
        shape.addcomponent(polygon, color, color)
    screen.register_shape(name, shape)


def create_game(difficulty):
    if difficulty == PHASE_TWO:
        return PumpkinKing()
    return BossCrush(difficulty) if difficulty in BOSS_DIFFICULTIES else DodgeGame(difficulty=difficulty)


def dodge_score_file(difficulty):
    # Existing scores belong to Easy; keep that file intact.
    if difficulty == "easy":
        return DODGE_SCORE_FILE
    if difficulty in (*BOSS_DIFFICULTIES, PHASE_TWO):
        return DODGE_SCORE_FILE.with_name(f"boss_crush_{difficulty}_scores.json")
    return DODGE_SCORE_FILE.with_name(f"turtle_{difficulty}_scores.json")


def start_turtle_dodge():
    print("\nTurtle Dodge difficulty:")
    print("Easy: original rules\nNormal: faster blocks with varied speeds")
    print("Hard: much faster yellow blocks that sway left and right")
    print("Merciless: faster red blocks, more spawns, smaller arena, deadly edges, NO PAUSE")
    print("Boss Crush: dodge bullet patterns and shoot the boss with F")
    print("Impossible Phase 2: THE PUMPKIN KING — transformation, six attacks, C to counter")
    difficulty = input("Choose easy / normal / hard / merciless / boss / phase2: ").strip().lower()
    while difficulty not in (*DIFFICULTIES, "boss", "boss crush", PHASE_TWO, "impossible phase 2"):
        difficulty = input("Please choose easy, normal, hard, merciless, boss, or phase2: ").strip().lower()
    if difficulty == "impossible phase 2":
        difficulty = PHASE_TWO
    if difficulty in ("boss", "boss crush"):
        print("Mean: fans and aimed bursts\nCruel: faster volleys plus rings\nNightmare: dense, fast patterns\nImpossible: bone walls, spirals, blue/orange attacks, and the toughest boss")
        difficulty = input("Choose mean / cruel / nightmare / impossible: ").strip().lower()
        while difficulty not in BOSS_DIFFICULTIES:
            difficulty = input("Please choose mean, cruel, nightmare, or impossible: ").strip().lower()
    player = input("Enter your name: ").strip()
    while not player:
        player = input("Please enter a nonempty name: ").strip()
    print("Opening Turtle Dodge. Arrow keys move; Space starts; Esc returns here.")
    env = os.environ.copy()
    runtime = Path(__file__).resolve().parent / ".runtime" / "usr"
    if runtime.exists():
        env["LD_LIBRARY_PATH"] = str(runtime / "lib") + (":" + env["LD_LIBRARY_PATH"] if env.get("LD_LIBRARY_PATH") else "")
        env["TCL_LIBRARY"] = str(runtime / "lib" / "tcl8.6")
        env["TK_LIBRARY"] = str(runtime / "lib" / "tk8.6")
    # A fresh process lets Turtle open/close repeatedly without stale Tk state.
    result = subprocess.run([sys.executable, str(Path(__file__).resolve()), player, difficulty], env=env)
    if result.returncode:
        print("Turtle Dodge could not run. Check the message above for details.")


class TurtleDodge:
    def __init__(self, turtle, player, difficulty="easy"):
        import tkinter

        self.turtle = turtle
        self.player_name = player
        self.root = tkinter.Tk()
        mode = "Impossible Phase 2" if difficulty == PHASE_TWO else "Boss Crush" if difficulty in BOSS_DIFFICULTIES else "Turtle Dodge"
        self.root.title(f"{mode} — {difficulty.title()}")
        self.root.geometry(f"{CANVAS_WIDTH}x{CANVAS_HEIGHT}")
        self.root.minsize(CANVAS_WIDTH, CANVAS_HEIGHT)
        self.root.configure(bg="#111827")
        # Fixed canvas centered in larger windows: no stretching or world scaling.
        canvas = tkinter.Canvas(self.root, width=CANVAS_WIDTH, height=CANVAS_HEIGHT,
                                borderwidth=0, highlightthickness=0)
        canvas.place(relx=0.5, rely=0.5, anchor="center",
                     width=CANVAS_WIDTH, height=CANVAS_HEIGHT)
        self.screen = turtle.TurtleScreen(canvas)
        self.screen.bgcolor("#111827")
        self.screen.tracer(0)
        self.game = create_game(difficulty)
        self.king_view = None
        if difficulty == PHASE_TWO:
            from pumpkin_king_view import KingView
            self.king_view = KingView(canvas)
        self.state = "ready"
        self.keys = set()
        self.saved = False
        self.closed = False
        self.best = 0
        self.notice = ""
        try:
            self.best = load_scores(dodge_score_file(difficulty)).get(player, 0)
        except ScoreError as exc:
            self.notice = "Scores unavailable (see terminal)."
            print(exc)

        self.player = self.pen()
        self.screen.register_shape("dodge_turtle", PLAYER_POLYGON)
        self.player.shape("dodge_turtle")
        self.player.color("#b7f7cc", "#4ade80")
        self.player.setheading(90)
        self.player.showturtle()
        self.blocks = self.pen()
        self.blocks.shape("square")
        self.blocks.shapesize(BLOCK_SIZE / 20, outline=0)
        self.boss = self.pen()
        self.boss.shape("square")
        register_pumpkin_shape(turtle, self.screen)
        register_pumpkin_shape(turtle, self.screen, "white_jack_o_lantern_hit", "#ffdf00")
        self.lunge_warning = self.pen()
        self.hud = self.pen()
        self.message = self.pen()
        border = self.pen()
        border.color("#ff3030" if self.game.rules.deadly_edges else "#43536b")
        left, right, bottom, top = self.game.rules.bounds
        border.goto(left, bottom)
        border.pendown()
        for point in ((right, bottom), (right, top), (left, top), (left, bottom)):
            border.goto(*point)
        self.last_hud = None
        warning = "\nNO PAUSE — touching edges kills!" if self.game.rules.deadly_edges else ""
        instructions = "Arrow keys to move\nDodge the falling blocks" + warning
        if isinstance(self.game, BossCrush):
            instructions = f"Arrow keys to dodge\nPress or hold F to shoot upward\n{self.game.max_lives} HP — touching the boss kills instantly!"
            if difficulty == "impossible":
                instructions += "\nBLUE: stay still • ORANGE: move\nWhite bullets and bones always hurt"
            if difficulty == PHASE_TWO:
                instructions = "ARROWS move • F shoots after the intro\nTap C just before magenta fingers hit\nBLUE: still • ORANGE: move • WHITE: dodge\n5 HP • Green + heals • D pauses\nThe opening fire and slams deal damage!"
        self.set_message(f"{mode.upper()}: {difficulty.upper()}\n\n{instructions}\n\nSPACE to start")
        for key in ("Left", "Right", "Up", "Down", "f", "F", "c", "C"):
            self.screen.onkeypress(lambda k=key: self.keys.add(k.lower() if len(k) == 1 else k), key)
            self.screen.onkeyrelease(lambda k=key: self.keys.discard(k.lower() if len(k) == 1 else k), key)
        self.screen.onkeypress(self.space, "space")
        self.screen.onkeyrelease(self.toggle_pause, "d")
        self.screen.onkeypress(self.close, "Escape")
        canvas = self.screen.getcanvas()
        canvas.bind("<FocusOut>", lambda event: self.pause(), add="+")
        canvas.winfo_toplevel().protocol("WM_DELETE_WINDOW", self.close)
        self.screen.listen()
        self.last_time = time.monotonic()
        self.tick()

    def pen(self):
        pen = self.turtle.RawTurtle(self.screen, visible=False)
        pen.penup()
        pen.speed(0)
        return pen

    def set_message(self, text):
        self.message.clear()
        self.message.color("#ffffff")
        self.message.goto(0, -50)
        self.message.write(text, align="center", font=("Arial", 18, "bold"))

    def space(self):
        if self.state in ("playing", "countdown"):
            return
        if self.state == "paused":
            self.keys.clear()
            self.state = "countdown"
            self.countdown_end = time.monotonic() + 3
            self.countdown_number = 3
            self.set_message("GET READY\n\n3")
            return
        self.game = create_game(self.game.difficulty)
        self.saved = False
        self.keys.clear()
        self.state = "playing"
        self.message.clear()
        self.last_time = time.monotonic()

    def toggle_pause(self):
        if not self.game.rules.can_pause:
            return
        if self.state == "paused":
            self.space()
        else:
            self.pause()

    def pause(self):
        self.keys.clear()
        if not self.game.rules.can_pause:
            return
        if self.state in ("playing", "countdown"):
            self.state = "paused"
            self.set_message("PAUSED\n\nD or SPACE to continue\nwith a 3-second countdown")

    def save(self):
        if self.saved or self.state == "ready":
            return
        self.saved = True
        try:
            save_score(self.player_name, self.game.score, dodge_score_file(self.game.difficulty))
            self.best = max(self.best, self.game.score)
        except ScoreError as exc:
            self.notice = "Score could not be saved (see terminal)."
            print(exc)

    def close(self):
        if not self.closed:
            self.save()
            self.closed = True
            if self.king_view:
                self.king_view.close()
            self.root.destroy()

    def draw_boss(self):
        game = self.game
        if isinstance(game, PumpkinKing):
            self.king_view.draw(game)
            self.player.color("#ffffff" if game.invulnerable > 0 else "#b7f7cc",
                              "#ffffff" if game.invulnerable > 0 else "#4ade80")
            return
        self.lunge_warning.clear()
        if game.lunge_state == "warning" and game.alive and not game.won:
            x, y = game.lunge_target
            for offset, color in ((-12, "#ff3030"), (12, "#ffdf00")):
                self.lunge_warning.color(color)
                self.lunge_warning.goto(x + offset, min(game.top - 48, y + 16))
                self.lunge_warning.write("!", align="center", font=("Arial", 32, "bold"))
        self.boss.clearstamps()
        if not game.won:
            if game.difficulty == "impossible":
                self.boss.shape("white_jack_o_lantern_hit" if game.hit_flash > 0 else "white_jack_o_lantern")
                self.boss.setheading(90)
                self.boss.shapesize(1, 1, outline=0)
                self.boss.goto(game.boss_x, game.boss_y)
                self.boss.stamp()
            else:
                self.boss.shapesize(BOSS_HEIGHT / 20, BOSS_WIDTH / 20, outline=0)
                self.boss.color(game.config.color)
                self.boss.goto(game.boss_x, game.boss_y)
                self.boss.stamp()
                self.boss.shapesize(0.3, 0.4, outline=0)
                self.boss.color("#111827")
                for offset in (-16, 16):
                    self.boss.goto(game.boss_x + offset, game.boss_y - 3)
                    self.boss.stamp()
        self.boss.shape("square")
        self.boss.setheading(0)
        self.boss.color("#374151")
        self.boss.shapesize(0.4, 11, outline=0)
        self.boss.goto(0, 265)
        self.boss.stamp()
        if game.hp:
            width = 220 * game.hp / game.config.hp
            self.boss.color(game.config.color)
            self.boss.shapesize(0.4, width / 20, outline=0)
            self.boss.goto(-110 + width / 2, 265)
            self.boss.stamp()
        for bullet in game.bullets:
            if bullet.delay > 0:
                continue
            self.blocks.color({"blue": "#42c9ff", "orange": "#ff9d32"}.get(bullet.rule, game.config.color))
            for x, y, width, height in bullet.rectangles():
                self.draw_projectile_rectangle(x, y, width, height)
        self.blocks.color("#67e8f9")
        for shot in game.shots:
            self.draw_projectile_rectangle(shot.x, shot.y, SHOT_WIDTH, SHOT_HEIGHT)
        for pickup in game.healing_pickups:
            self.blocks.color("#22c55e")
            self.draw_projectile_rectangle(pickup.x, pickup.y, HEAL_SIZE, HEAL_SIZE)
            self.blocks.color("#ffffff")
            self.draw_projectile_rectangle(pickup.x, pickup.y, 4, 12)
            self.draw_projectile_rectangle(pickup.x, pickup.y, 12, 4)
        self.player.color("#ffffff" if game.invulnerable > 0 else "#b7f7cc",
                          "#ffffff" if game.invulnerable > 0 else "#4ade80")

    def draw_projectile_rectangle(self, x, y, width, height):
        # Incoming attacks stay inside the arena instead of covering the HUD.
        left = max(self.game.left, x - width / 2)
        right = min(self.game.right, x + width / 2)
        bottom = max(self.game.bottom, y - height / 2)
        top = min(self.game.top, y + height / 2)
        if right > left and top > bottom:
            self.blocks.shapesize((top - bottom) / 20, (right - left) / 20, outline=0)
            self.blocks.goto((left + right) / 2, (bottom + top) / 2)
            self.blocks.stamp()

    def tick(self):
        if self.closed:
            return
        now = time.monotonic()
        dt = min(now - self.last_time, 0.05)
        self.last_time = now
        if self.state == "countdown":
            remaining = max(0, math.ceil(self.countdown_end - now))
            if remaining == 0:
                self.state = "playing"
                self.message.clear()
            elif remaining != self.countdown_number:
                self.countdown_number = remaining
                self.set_message(f"GET READY\n\n{remaining}")
        elif self.state == "playing":
            self.game.update(dt, self.keys)
            if not self.game.alive or getattr(self.game, "won", False):
                self.state = "over"
                self.keys.clear()
                self.save()
                result = "BOSS CRUSHED!" if getattr(self.game, "won", False) else "GAME OVER"
                if getattr(self.game, "death_message", None):
                    result = self.game.death_message
                self.set_message(f"{result}\nScore: {self.game.score}\n\nSPACE to try again\nESC to return to menu")
        self.player.goto(self.game.x, self.game.y)
        self.blocks.clearstamps()
        boss_mode = isinstance(self.game, BossCrush)
        if boss_mode:
            self.draw_boss()
        else:
            for block in self.game.blocks:
                self.blocks.color(block.color)
                for x, y in block.centers():
                    if self.game.bottom - CELL / 2 <= y <= self.game.top + CELL / 2:
                        self.blocks.goto(x, y)
                        self.blocks.stamp()
        hud = (self.game.score, self.best, int(self.game.elapsed), self.notice,
               self.game.hp if boss_mode else None, self.game.lives if boss_mode else None,
               self.game.pattern_label if boss_mode else "")
        if hud != self.last_hud:
            self.last_hud = hud
            self.hud.clear()
            self.hud.color("#e2e8f0")
            self.hud.goto(0, 285)
            label = "Pumpkin King" if isinstance(self.game, PumpkinKing) else self.game.difficulty.title()
            self.hud.write(f"{label}  |  Score {hud[0]}  |  Best {hud[1]}  |  {hud[2]}s", align="center", font=("Arial", 16, "bold"))
            if boss_mode:
                self.hud.goto(0, 245)
                self.hud.write(f"BOSS HP {self.game.hp}/{self.game.config.hp}   |   YOUR HP {self.game.lives}/{self.game.max_lives}", align="center", font=("Arial", 10, "bold"))
                if self.game.pattern_label:
                    self.hud.goto(0, -263)
                    self.hud.write(self.game.pattern_label, align="center", font=("Arial", 11, "bold"))
            self.hud.goto(0, -285)
            controls = "ARROWS move   •   D pause/resume   •   ESC menu" if self.game.rules.can_pause else "NO PAUSE   •   EDGES KILL   •   ARROWS move   •   ESC menu"
            if boss_mode:
                controls = "ARROWS move  •  F shoot  •  D pause/resume  •  ESC menu"
            if isinstance(self.game, PumpkinKing):
                controls = "ARROWS move • F shoot • C counter • D pause • ESC menu"
            self.hud.write(self.notice or controls, align="center", font=("Arial", 12, "normal"))
            if boss_mode and self.game.difficulty == "impossible":
                self.hud.goto(0, -308)
                self.hud.color("#4ade80")
                self.hud.write("Green + pickups: +1 HP • appear every 15s • last 10s", align="center", font=("Arial", 10, "normal"))
            if isinstance(self.game, PumpkinKing):
                self.hud.goto(0, -308)
                self.hud.color("#4ade80")
                self.hud.write("Green +: +1 HP • every 16s • lasts 9s", align="center", font=("Arial", 10, "normal"))
        if isinstance(self.game, PumpkinKing) and self.state != "playing":
            for item in self.message.items:
                self.screen.getcanvas().tag_raise(item)
        self.screen.update()
        if not self.closed:
            self.screen.ontimer(self.tick, 16)


def main():
    try:
        import turtle
        import tkinter
    except ImportError as exc:
        print(f"Turtle needs Tk support for this Python installation: {exc}")
        return 1
    try:
        difficulty = sys.argv[2] if len(sys.argv) > 2 else "easy"
        if difficulty not in (*DIFFICULTIES, *BOSS_DIFFICULTIES, PHASE_TWO):
            print("Unknown difficulty. Choose easy, normal, hard, merciless, mean, cruel, nightmare, impossible, or phase2.")
            return 1
        app = TurtleDodge(turtle, sys.argv[1] if len(sys.argv) > 1 else "Player", difficulty)
        app.root.mainloop()
    except turtle.Terminator:
        pass
    except tkinter.TclError as exc:
        print(f"Turtle could not use the graphical display: {exc}")
        return 1
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
