"""Read and save personal bests alongside the game, regardless of launch directory."""

import json
from pathlib import Path

SCORE_FILE = Path(__file__).resolve().with_name("scores.json")


class ScoreError(Exception):
    """Score data could not be safely read or saved."""


def load_scores(path=SCORE_FILE):
    path = Path(path)
    try:
        with path.open(encoding="utf-8") as file:
            scores = json.load(file)
    except FileNotFoundError:
        return {}
    except (OSError, ValueError) as exc:
        raise ScoreError(f"Could not read {path}: {exc}") from exc
    if not isinstance(scores, dict) or any(
        not isinstance(name, str) or type(score) is not int or score < 0
        for name, score in scores.items()
    ):
        raise ScoreError(f"Invalid score data in {path}.")
    return scores


def save_score(player, score, path=SCORE_FILE):
    path = Path(path)
    scores = load_scores(path)  # Never overwrite unreadable existing scores.
    scores[player] = max(score, scores.get(player, 0))
    temporary = path.with_suffix(".json.tmp")
    try:
        with temporary.open("w", encoding="utf-8") as file:
            json.dump(scores, file, indent=2)
            file.write("\n")
        temporary.replace(path)
    except OSError as exc:
        raise ScoreError(f"Could not save scores to {path}: {exc}") from exc
