"""A terminal Hangman game. Run with: python3 hangman.py."""

import random
import string

from scores import ScoreError, load_scores, save_score
from keyboard_challenge import KEYBOARD_SCORE_FILE, start_keyboard_challenge
from turtle_dodge import BOSS_DIFFICULTIES, DIFFICULTIES, PHASE_TWO, dodge_score_file, start_turtle_dodge

try:
    from colorama import Fore, init
except ImportError:
    class Fore:
        RED = GREEN = BLUE = YELLOW = CYAN = MAGENTA = ""
else:
    init(autoreset=True)


HANGMAN_PICS = (
    " +---+\n     |\n     |\n     |\n    ===",
    " +---+\n O   |\n     |\n     |\n    ===",
    " +---+\n O   |\n |   |\n     |\n    ===",
    " +---+\n O   |\n/|   |\n     |\n    ===",
    " +---+\n O   |\n/|\\  |\n     |\n    ===",
    " +---+\n O   |\n/|\\  |\n/    |\n    ===",
    " +---+\n O   |\n/|\\  |\n/ \\  |\n    ===",
)

DIFFICULTY = {
    "easy": {"words": ["cat", "tree", "book", "dog", "sun"], "max_attempts": 10},
    "medium": {
        "words": ["python", "castle", "planet", "rocket", "winter"],
        "max_attempts": 7,
    },
    "hard": {
        "words": ["asynchronous", "philosophy", "xylophone", "microscope", "algorithm"],
        "max_attempts": 5,
    },
}


def hangman_picture(mistakes, max_attempts):
    """Spread the six drawing stages across the difficulty's mistake limit."""
    stage = min(mistakes * (len(HANGMAN_PICS) - 1) // max_attempts, len(HANGMAN_PICS) - 1)
    return HANGMAN_PICS[stage]


def play_hangman(word, max_attempts):
    """Return remaining attempts on a win, zero on a loss, or None when quit."""
    word = word.strip().lower()
    if not word or any(letter not in string.ascii_lowercase for letter in word):
        raise ValueError("The word must contain only English letters.")
    if type(max_attempts) is not int or max_attempts < 1:
        raise ValueError("max_attempts must be a positive integer.")

    guessed = set()
    mistakes = 0
    while mistakes < max_attempts:
        print(Fore.YELLOW + hangman_picture(mistakes, max_attempts))
        print(Fore.CYAN + "Word: " + " ".join(c if c in guessed else "_" for c in word))
        print(f"Attempts left: {max_attempts - mistakes}")
        print("Guessed: " + (" ".join(sorted(guessed)) or "none"))
        guess = input(Fore.GREEN + "Guess a letter (or type quit to return to menu): ").strip().lower()

        if guess in ("quit", "exit"):
            print(Fore.YELLOW + "Round ended. Returning to the menu.")
            return None

        if len(guess) != 1 or guess not in string.ascii_lowercase:
            print(Fore.RED + "Please enter a single English letter.")
            continue
        if guess in guessed:
            print(Fore.RED + "You already guessed that!")
            continue

        guessed.add(guess)
        if guess in word:
            print(Fore.BLUE + "Correct!")
        else:
            mistakes += 1
            print(Fore.RED + "Wrong guess!")

        if set(word) <= guessed:
            print(Fore.GREEN + f"You win! The word was: {word}")
            return max_attempts - mistakes

    print(Fore.RED + HANGMAN_PICS[-1])
    print(Fore.RED + f"You lost! The word was: {word}")
    return 0


def start_game():
    print(Fore.MAGENTA + "Choose difficulty: easy / medium / hard")
    while True:
        difficulty = input("Difficulty: ").strip().lower()
        if difficulty in DIFFICULTY:
            break
        print(Fore.RED + "Invalid difficulty. Choose easy, medium, or hard.")

    player = input("Enter your name: ").strip()
    while not player:
        player = input("Please enter a nonempty name: ").strip()

    config = DIFFICULTY[difficulty]
    score = play_hangman(random.choice(config["words"]), config["max_attempts"])
    if score is None:
        return
    print(Fore.YELLOW + f"Your score: {score}")
    try:
        save_score(player, score)
    except ScoreError as exc:
        print(Fore.RED + str(exc))
    else:
        print(Fore.GREEN + "Score saved!")


def show_scores(path=None, title="HIGH SCORES"):
    try:
        scores = load_scores() if path is None else load_scores(path)
    except ScoreError as exc:
        print(Fore.RED + str(exc))
        return
    print(Fore.CYAN + f"=== {title} ===")
    if not scores:
        print("No scores yet. Play a game!")
    for player, score in sorted(scores.items(), key=lambda item: (-item[1], item[0])):
        print(f"{player}: {score}")


def main_menu():
    while True:
        print(Fore.MAGENTA + "\n=== HANGMAN MENU ===")
        print("1. Play Hangman\n2. Hangman High Scores\n3. Quit")
        print("4. Timed Keyboard Challenge\n5. Keyboard Challenge High Scores")
        print("6. Turtle Dodge / Boss Crush\n7. Turtle Dodge / Boss Crush High Scores")
        choice = input("Choose an option: ").strip()
        if choice == "1":
            start_game()
        elif choice == "2":
            show_scores()
        elif choice == "3":
            print("Goodbye!")
            return
        elif choice == "4":
            start_keyboard_challenge()
        elif choice == "5":
            show_scores(KEYBOARD_SCORE_FILE, "KEYBOARD CHALLENGE HIGH SCORES")
        elif choice == "6":
            start_turtle_dodge()
        elif choice == "7":
            for difficulty in DIFFICULTIES:
                show_scores(dodge_score_file(difficulty), f"TURTLE DODGE: {difficulty.upper()}")
            for difficulty in BOSS_DIFFICULTIES:
                show_scores(dodge_score_file(difficulty), f"BOSS CRUSH: {difficulty.upper()}")
            show_scores(dodge_score_file(PHASE_TWO), "IMPOSSIBLE PHASE 2: THE PUMPKIN KING")
        else:
            print(Fore.RED + "Invalid choice.")


if __name__ == "__main__":
    try:
        main_menu()
    except (EOFError, KeyboardInterrupt):
        print("\nGoodbye!")
