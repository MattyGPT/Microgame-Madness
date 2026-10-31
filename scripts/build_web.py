"""Package only the browser UI and shared Python sources for static hosting."""
from pathlib import Path
import json
import shutil

ROOT = Path(__file__).resolve().parents[1]
OUTPUT = ROOT / "dist"
PYTHON_SOURCES = (
    "hangman_model.py", "keyboard_model.py", "dodge_model.py", "boss_crush.py",
    "pumpkin_king.py", "pumpkin_king_view.py",
)


def build():
    OUTPUT.mkdir(exist_ok=True)
    # Only this generated directory is replaced; user score/runtime files stay local.
    for child in OUTPUT.iterdir():
        if child.is_dir():
            shutil.rmtree(child)
        else:
            child.unlink()
    for name in ("index.html", "style.css", "app.js", "achievements.js", "favicon.svg"):
        shutil.copy2(ROOT / "web" / name, OUTPUT / name)
    python_dir = OUTPUT / "python"
    python_dir.mkdir()
    for name in PYTHON_SOURCES:
        shutil.copy2(ROOT / name, python_dir / name)
    shutil.copy2(ROOT / "web" / "bridge.py", python_dir / "bridge.py")
    (OUTPUT / "python-files.json").write_text(json.dumps([*PYTHON_SOURCES, "bridge.py"]) + "\n")
    (OUTPUT / ".nojekyll").touch()
    print(f"Built browser game in {OUTPUT}")


if __name__ == "__main__":
    build()
