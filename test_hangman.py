import io
import tempfile
import unittest
from contextlib import redirect_stdout
from pathlib import Path
from unittest.mock import patch

from hangman import DIFFICULTY, HANGMAN_PICS, hangman_picture, play_hangman, main_menu
from scores import ScoreError, load_scores, save_score


class GameTests(unittest.TestCase):
    def play(self, word, attempts, guesses):
        output = io.StringIO()
        with patch("builtins.input", side_effect=guesses), redirect_stdout(output):
            score = play_hangman(word, attempts)
        return score, output.getvalue()

    def test_invalid_and_repeated_guesses_do_not_cost_attempts(self):
        score, output = self.play("cat", 5, ["", "12", "é", "x", "X", " c ", "c", "a", "t"])
        self.assertEqual(score, 4)
        self.assertEqual(output.count("You already guessed that!"), 2)

    def test_win_with_repeated_letters(self):
        score, output = self.play("tree", 7, ["t", "r", "e"])
        self.assertEqual(score, 7)
        self.assertIn("You win!", output)

    def test_quit_returns_to_menu_without_saving(self):
        with patch("builtins.input", side_effect=["1", "easy", "Ada", " QUIT ", "3"]), patch("hangman.save_score") as save, redirect_stdout(io.StringIO()) as output:
            main_menu()
        save.assert_not_called()
        self.assertIn("Returning to the menu.", output.getvalue())
        self.assertIn("Goodbye!", output.getvalue())

    def test_q_is_still_a_valid_guess(self):
        score, output = self.play("quiz", 5, ["q", "u", "i", "z"])
        self.assertEqual(score, 5)

    def test_loss_at_each_difficulty(self):
        for config in DIFFICULTY.values():
            attempts = config["max_attempts"]
            with self.subTest(attempts=attempts):
                score, output = self.play("cat", attempts, list("bdefghijkl"))
                self.assertEqual(score, 0)
                self.assertEqual(output.count("Wrong guess!"), attempts)
                self.assertIn(HANGMAN_PICS[-1], output)
                self.assertIn("You lost!", output)

    def test_complete_drawing_only_on_loss(self):
        for attempts in (5, 7, 10):
            self.assertEqual(hangman_picture(0, attempts), HANGMAN_PICS[0])
            for mistakes in range(attempts):
                self.assertNotEqual(hangman_picture(mistakes, attempts), HANGMAN_PICS[-1])
            self.assertEqual(hangman_picture(attempts, attempts), HANGMAN_PICS[-1])

    def test_menu_recovers_from_invalid_choice(self):
        with patch("builtins.input", side_effect=["bad", "3"]), redirect_stdout(io.StringIO()) as output:
            main_menu()
        self.assertIn("Invalid choice.", output.getvalue())
        self.assertIn("Goodbye!", output.getvalue())


class ScoreTests(unittest.TestCase):
    def setUp(self):
        directory = tempfile.TemporaryDirectory()
        self.addCleanup(directory.cleanup)
        self.path = Path(directory.name) / "scores.json"

    def test_missing_scores_and_personal_bests(self):
        self.assertEqual(load_scores(self.path), {})
        for score in (5, 2, 8):
            save_score("Ada", score, self.path)
        save_score("Ben", 0, self.path)
        self.assertEqual(load_scores(self.path), {"Ada": 8, "Ben": 0})

    def test_corrupt_scores_are_not_overwritten(self):
        for data in ('broken json', '[]', '{"Ada": "5"}', '{"Ada": true}', '{"Ada": -1}'):
            with self.subTest(data=data):
                self.path.write_text(data, encoding="utf-8")
                with self.assertRaises(ScoreError):
                    save_score("Ada", 10, self.path)
                self.assertEqual(self.path.read_text(encoding="utf-8"), data)


if __name__ == "__main__":
    unittest.main()
