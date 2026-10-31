import io
import string
import unittest
from contextlib import redirect_stdout
from unittest.mock import patch

from hangman import main_menu
from keyboard_challenge import make_round, play_round


class KeyboardTests(unittest.TestCase):
    def run_round(self, events, sequence="ab", seconds=2):
        now = [0.0]
        events = iter(events)

        def read_key(timeout):
            delay, key = next(events, (timeout, None))
            now[0] += delay
            return key

        return play_round(sequence, seconds, read_key, render=lambda *args: None, clock=lambda: now[0])

    def test_success_without_enter(self):
        self.assertEqual(self.run_round([(0.1, "a"), (0.1, "b")]), "completed")

    def test_no_input_expires(self):
        self.assertEqual(self.run_round([]), "timeout")

    def test_late_final_key_does_not_win(self):
        self.assertEqual(self.run_round([(0.1, "a"), (1.9, "b")]), "timeout")

    def test_wrong_key_penalty_and_case_sensitivity(self):
        self.assertEqual(self.run_round([(0.1, "A"), (0.1, "a"), (1.4, "b")]), "timeout")

    def test_can_recover_from_wrong_key(self):
        self.assertEqual(self.run_round([(0.1, "x"), (0.1, "a"), (0.1, "b")]), "completed")

    def test_escape_quits(self):
        self.assertEqual(self.run_round([(0.1, "\x1b")]), "quit")

    def test_progression(self):
        lengths, times = [], []
        for level in range(1, 30):
            sequence, seconds = make_round(level)
            lengths.append(len(sequence))
            times.append(seconds)
        self.assertEqual(lengths, sorted(lengths))
        self.assertEqual(times, sorted(times, reverse=True))
        self.assertEqual(lengths[0], 3)
        self.assertGreaterEqual(min(times), 4)
        for level, expected in ((1, "asdfjkl"), (3, string.ascii_lowercase),
                                (5, string.ascii_lowercase + string.digits),
                                (7, string.ascii_lowercase + string.digits + string.ascii_uppercase),
                                (9, string.ascii_lowercase + string.digits + string.ascii_uppercase + "!@#$%&*?+-=")):
            with patch("keyboard_challenge.random.choice", return_value="a") as choose:
                make_round(level)
            self.assertEqual(choose.call_args.args[0], expected)

    def test_menu_routes_new_mode(self):
        with patch("builtins.input", side_effect=["4", "3"]), patch("hangman.start_keyboard_challenge") as start, redirect_stdout(io.StringIO()):
            main_menu()
        start.assert_called_once_with()


if __name__ == "__main__":
    unittest.main()
