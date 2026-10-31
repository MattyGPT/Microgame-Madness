"""Hangman rules shared by the terminal and browser interfaces."""

import string

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



class HangmanGame:
    def __init__(self, word, max_attempts):
        word = word.strip().lower()
        if not word or any(letter not in string.ascii_lowercase for letter in word):
            raise ValueError("The word must contain only English letters.")
        if type(max_attempts) is not int or max_attempts < 1:
            raise ValueError("max_attempts must be a positive integer.")
        self.word = word
        self.max_attempts = max_attempts
        self.guessed = set()
        self.mistakes = 0

    @property
    def won(self):
        return set(self.word) <= self.guessed

    @property
    def over(self):
        return self.won or self.mistakes >= self.max_attempts

    @property
    def score(self):
        return self.max_attempts - self.mistakes if self.won else 0

    def guess(self, letter):
        letter = letter.strip().lower()
        if self.over:
            return "over"
        if len(letter) != 1 or letter not in string.ascii_lowercase:
            return "invalid"
        if letter in self.guessed:
            return "repeated"
        self.guessed.add(letter)
        if letter in self.word:
            return "correct"
        self.mistakes += 1
        return "wrong"
