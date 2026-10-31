"""Timed, character-by-character keyboard challenges for a Linux/macOS terminal."""

from contextlib import contextmanager
import os
import random  # Re-exported for callers that patch the original random source.
import select
import sys
import time

from keyboard_model import KeyboardRound, make_round
from scores import SCORE_FILE, ScoreError, save_score

KEYBOARD_SCORE_FILE = SCORE_FILE.with_name("keyboard_scores.json")


@contextmanager
def keyboard_input():
    """Read single keys without Enter; always restore normal terminal settings."""
    import termios
    import tty

    fd = sys.stdin.fileno()
    original = termios.tcgetattr(fd)
    try:
        tty.setcbreak(fd)
        termios.tcflush(fd, termios.TCIFLUSH)

        def read_key(timeout):
            ready, _, _ = select.select([fd], [], [], timeout)
            if not ready:
                return None
            data = os.read(fd, 1)
            if not data or data == b"\x04":
                return "\x1b"
            return data.decode("ascii", errors="replace")

        yield read_key
    finally:
        termios.tcsetattr(fd, termios.TCSAFLUSH, original)


def show_progress(sequence, matched, seconds, mistakes):
    progress = sequence[:matched] + "_" * (len(sequence) - matched)
    print(
        f"\r\033[2KTime: {seconds:4.1f}s | Typed: {progress} | Mistakes: {mistakes}",
        end="",
        flush=True,
    )


def play_round(sequence, seconds, read_key, render=show_progress, clock=time.monotonic):
    """Return completed, timeout, or quit. Wrong keys subtract half a second."""
    game = KeyboardRound(sequence, seconds, clock())
    while True:
        now = clock()
        render(sequence, game.matched, game.remaining(now), game.mistakes)
        if game.feed(None, now):
            return game.result
        key = read_key(min(0.05, game.remaining(now)))
        now = clock()
        if game.feed(key, now):
            render(sequence, game.matched, game.remaining(now), game.mistakes)
            return game.result


def start_keyboard_challenge():
    if os.name != "posix" or not sys.stdin.isatty() or not sys.stdout.isatty():
        print("Open the game in a Linux/macOS terminal to play the timed challenge.")
        return
    print("\n=== KEYBOARD CHALLENGE ===")
    print("Type each sequence exactly, in order. No Enter needed; case matters.")
    print("Each round gets harder: letters, numbers, capitals, then symbols.")
    print("Wrong keys cost 0.5 seconds. The timer resets each round.")
    print("Escape ends the challenge. Your score is the number of rounds completed.")
    player = input("Enter your name: ").strip()
    while not player:
        player = input("Please enter a nonempty name: ").strip()
    input("Press Enter when ready...")

    completed = 0
    with keyboard_input() as read_key:
        while True:
            sequence, seconds = make_round(completed + 1)
            print(f"\nRound {completed + 1} | {seconds:g} seconds | Type: {sequence}", flush=True)
            result = play_round(sequence, seconds, read_key)
            print()
            if result != "completed":
                print("Time's up!" if result == "timeout" else "Challenge ended.")
                break
            completed += 1
            print("Round complete!")

    print(f"Rounds completed: {completed}")
    try:
        save_score(player, completed, KEYBOARD_SCORE_FILE)
    except ScoreError as exc:
        print(str(exc))
    else:
        print("Keyboard challenge score saved!")
