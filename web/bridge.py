"""Browser adapter. Game rules live in the shared root Python modules."""

import json
import random

from hangman_model import DIFFICULTY, HangmanGame, hangman_picture
from keyboard_model import KeyboardRound, make_round
from dodge_model import DodgeGame, PLAYER_POLYGON, BLOCK_SIZE, BLOCK_OUTLINE_WIDTH, block_outline_color
from boss_crush import BossCrush
from pumpkin_king import PumpkinKing
from kings_wrath import KingsWrath
from singularity_core import ATTACKS, SingularityCore
from singularity_practice import PRACTICE_ATTACKS, SingularityCutscene, SingularityPractice
from singularity_core_view import draw_core
from pumpkin_king_view import KingView
from arcade_effects import DEATH_DURATION, death_pixels


class DrawCanvas:
    """Small Tk Canvas protocol adapter for the existing Pumpkin King renderer."""
    def __init__(self):
        self.items = {}
        self.order = []

    def create(self, kind, coords, options):
        item = len(self.items) + 1
        self.items[item] = {"kind": kind, "coords": coords, **options}
        self.order.append(item)
        return item

    def create_rectangle(self, *coords, **options):
        return self.create("rectangle", coords, options)

    def create_polygon(self, *coords, **options):
        return self.create("polygon", coords, options)

    def create_text(self, *coords, **options):
        return self.create("text", coords, options)

    def create_oval(self, *coords, **options):
        return self.create("oval", coords, options)

    def coords(self, item, *coords):
        self.items[item]["coords"] = coords

    def itemconfigure(self, item, **options):
        self.items[item].update(options)

    def tag_raise(self, item):
        self.order.remove(item)
        self.order.append(item)

    def tag_lower(self, item):
        self.order.remove(item)
        self.order.insert(0, item)

    def commands(self):
        return [self.items[item].copy() for item in self.order
                if self.items[item].get("state") != "hidden"]


class BrowserGame:
    def __init__(self):
        self.game = None
        self.paused = False
        self.completed = 0
        self.now = 0
        self.message = ""

    def start(self, mode, difficulty, now):
        self.mode, self.difficulty = mode, difficulty
        self.paused = False
        self.completed = 0
        self.message = ""
        self.now = now
        self.canvas = DrawCanvas()
        self.death_age = None
        self.death_sound_pending = False
        self.view = KingView(self.canvas, audio=False)
        if mode == "hangman":
            rules = DIFFICULTY[difficulty]
            self.game = HangmanGame(random.choice(rules["words"]), rules["max_attempts"])
        elif mode == "keyboard":
            self.new_round(now)
        elif mode == "dodge":
            self.game = DodgeGame(difficulty=difficulty)
        elif mode == "boss":
            self.game = BossCrush(difficulty)
        elif mode == "pumpkin":
            self.game = PumpkinKing(difficulty=difficulty)
        elif mode == "wrath":
            self.game = KingsWrath(attack=difficulty)
        elif mode == "singularity":
            if difficulty != "gravitron":
                raise ValueError("Unknown Singularity Core difficulty")
            self.game = SingularityCore()
        elif mode == "core_practice":
            self.game = (SingularityCutscene() if difficulty == "final_cutscene"
                         else SingularityPractice(difficulty))
        else:
            raise ValueError("Unknown game")

    def new_round(self, now):
        sequence, seconds = make_round(self.completed + 1)
        self.game = KeyboardRound(sequence, seconds, now)

    def dispatch(self, request):
        action = request["action"]
        now = float(request.get("now", self.now))
        self.now = now
        if action == "core_practice_options":
            return {"attacks": [{"id": key, "number": index + 1,
                                 "name": ATTACKS[index].name, "hint": ATTACKS[index].hint}
                                for key, index in PRACTICE_ATTACKS.items()]}
        if action == "start":
            self.start(request["mode"], request.get("difficulty", "easy"), now)
        elif self.game is None:
            raise ValueError("Start a game first")
        elif action == "guess" and self.mode == "hangman":
            result = self.game.guess(request["key"])
            self.message = {"correct": "Nice guess!", "wrong": "Not this time.",
                            "repeated": "Already guessed.", "invalid": "Choose a letter."}.get(result, "")
        elif action in ("tick", "key") and self.mode == "keyboard":
            self.game.feed(request.get("key"), now)
            if self.game.result == "completed":
                self.completed += 1
                self.new_round(now)
        elif action == "laser" and self.mode == "singularity" and not self.paused:
            self.game.fire_laser()
        elif action == "pause" and self.mode in ("dodge", "boss", "pumpkin", "wrath", "singularity", "core_practice"):
            if self.game.rules.can_pause and self.game.alive and not getattr(self.game, "won", False):
                self.paused = not self.paused
        elif action == "tick" and self.mode in ("dodge", "boss", "pumpkin", "wrath", "singularity", "core_practice") and not self.paused:
            dt = max(0, min(float(request.get("dt", 0)), 0.05))
            if self.death_age is not None:
                self.death_age = min(DEATH_DURATION, self.death_age+dt)
            else:
                self.game.update(dt, set(request.get("keys", [])))
        return self.snapshot()

    def snapshot(self):
        game = self.game
        result = {"mode": self.mode, "difficulty": self.difficulty, "paused": self.paused,
                  "message": self.message, "sounds": [], "commands": []}
        if self.mode == "hangman":
            result.update(over=game.over, won=game.won, score=game.score,
                          word=" ".join(c if c in game.guessed or game.over else "_" for c in game.word),
                          guessed=sorted(game.guessed), mistakes=game.mistakes,
                          remaining=game.max_attempts-game.mistakes,
                          picture=hangman_picture(game.mistakes, game.max_attempts))
        elif self.mode == "keyboard":
            result.update(over=game.result is not None, won=False, score=self.completed,
                          sequence=game.sequence, matched=game.matched, mistakes=game.mistakes,
                          remaining=game.remaining(self.now), level=self.completed+1)
        else:
            if not game.alive and self.death_age is None:
                self.death_age = 0.0
                self.death_sound_pending = True
            result.update(over=not game.alive or getattr(game, "won", False),
                          dying=self.death_age is not None and self.death_age < DEATH_DURATION-1e-9,
                          death_age=self.death_age,
                          won=getattr(game, "won", False), score=game.score,
                          death_message=getattr(game, "death_message", None),
                          damage_taken=getattr(game, "damage_taken", None),
                          attacks_completed=getattr(game, "attacks_completed", 0),
                          attack_survivals=list(getattr(game, "attack_survivals", [])),
                          counter_hits=getattr(game, "counter_hits", 0),
                          healing_collected=getattr(game, "healing_collected", 0),
                          near_misses=getattr(game, "near_misses", 0),
                          elapsed=int(game.elapsed), can_pause=game.rules.can_pause and game.alive,
                          bounds=[game.left, game.right, game.bottom, game.top],
                          label=getattr(game, "pattern_label", "Dodge the blocks. Stay in the game."),
                          lives=getattr(game, "lives", None), max_lives=getattr(game, "max_lives", None),
                          hp=getattr(game, "hp", None), max_hp=game.config.hp if isinstance(game, BossCrush) else None)
            commands = []
            def rect(x, y, width, height, color, outline="", outline_width=1):
                command = {"kind": "rectangle", "coords": [x-width/2, -y-height/2, x+width/2, -y+height/2], "fill": color}
                if outline:
                    command.update(outline=outline, width=outline_width)
                commands.append(command)
            if isinstance(game, SingularityCore):
                result.update(sounds=game.sound_events[:], hp=game.hp, max_hp=1,
                              attacks_completed=game.attacks_completed, attack_total=15,
                              shielded=game.shielded, laser_ready=game.laser_ready,
                              laser_firing=game.stage == "laser",
                              cinematic_age=game.stage_age if game.stage == "laser" else None,
                              cinematic_phase=game.laser_phase,
                              arena_shattered=game.laser_phase in ("shatter", "complete"))
                commands = draw_core(game)
                game.sound_events.clear()
            elif isinstance(game, PumpkinKing):
                result["sounds"] = game.sound_events[:]
                self.view.draw(game)
                commands = self.canvas.commands()
            elif isinstance(game, BossCrush):
                self.view.draw_boss(game)
                commands = self.canvas.commands()
                if game.lunge_state == "warning" and game.lunge_target:
                    x, y = game.lunge_target
                    commands.append({"kind": "oval", "coords": [x-32, -y-32, x+32, -y+32], "fill": "", "outline": "#ff4565", "width": 3})
                for bullet in game.bullets:
                    if bullet.delay > 0:
                        continue
                    color = {"blue": "#42c9ff", "orange": "#ff9d32"}.get(bullet.rule, game.config.color)
                    for shape in bullet.rectangles():
                        rect(*shape, color)
                for shot in game.shots:
                    rect(shot.x, shot.y, 4, 12, "#67e8f9")
                for pickup in game.healing_pickups:
                    rect(pickup.x, pickup.y, 16, 16, "#22c55e")
                    rect(pickup.x, pickup.y, 4, 12, "#ffffff")
                    rect(pickup.x, pickup.y, 12, 4, "#ffffff")
            else:
                for block in game.blocks:
                    outline = block_outline_color(block.color)
                    for x, y in block.centers():
                        rect(x, y, BLOCK_SIZE, BLOCK_SIZE, block.color, outline, BLOCK_OUTLINE_WIDTH)
            if self.death_age is not None:
                for x, y, size in death_pixels(game.x, game.y, self.death_age):
                    rect(x, y, size, size, "#ffffff")
                if self.death_sound_pending:
                    result["sounds"].append("turtle_death")
                    self.death_sound_pending = False
            elif not result.get("arena_shattered"):
                commands.append({"kind": "polygon", "role": "player", "coords": [v for x, y in PLAYER_POLYGON for v in (game.x+x, -game.y-y)],
                                 "fill": "#ffffff" if getattr(game, "invulnerable", 0) else "#a3ff80"})
            result["player"] = {"x": game.x, "y": game.y,
                                "visible": self.death_age is None and not result.get("arena_shattered", False)}
            result["commands"] = commands
        return result


session = BrowserGame()


def handle(payload):
    return json.dumps(session.dispatch(json.loads(payload)))
