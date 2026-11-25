"""Read and save personal bests alongside the game, regardless of launch directory."""

import json
import os
from pathlib import Path
import tempfile

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
    if not isinstance(player, str) or not player or type(score) is not int or score < 0:
        raise ScoreError("Player must be a non-empty string and score must be a non-negative integer.")
    path = Path(path)
    scores = load_scores(path)  # Never overwrite unreadable existing scores.
    scores[player] = max(score, scores.get(player, 0))
    tmp_path = None
    try:
        with tempfile.NamedTemporaryFile(
            mode="w", encoding="utf-8", dir=path.parent,
            prefix=f".{path.name}.", suffix=".tmp", delete=False,
        ) as file:
            tmp_path = Path(file.name)
            json.dump(scores, file, indent=2)
            file.write("\n")
            file.flush()
            os.fsync(file.fileno())
        os.replace(tmp_path, path)
        tmp_path = None
    except OSError as exc:
        raise ScoreError(f"Could not save scores to {path}: {exc}") from exc
    finally:
        if tmp_path is not None:
            try:
                tmp_path.unlink(missing_ok=True)
            except OSError:
                pass
