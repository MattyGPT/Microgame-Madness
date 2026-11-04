"""Package only the browser UI and shared Python sources for static hosting."""
from pathlib import Path
import hashlib
import json
import base64
import os
import shutil
from urllib.parse import urlsplit

ROOT = Path(__file__).resolve().parents[1]
OUTPUT = ROOT / "dist"
PYTHON_SOURCES = (
    "hangman_model.py", "keyboard_model.py", "dodge_model.py", "boss_crush.py",
    "pumpkin_king.py", "pumpkin_king_view.py", "kings_wrath.py",
    "singularity_core.py", "singularity_core_view.py", "singularity_practice.py",
    "arcade_effects.py",
)


def leaderboard_config():
    """Only browser-safe project configuration may enter the public build."""
    url = os.environ.get("SUPABASE_URL", "").strip().rstrip("/")
    key = os.environ.get("SUPABASE_PUBLISHABLE_KEY", "").strip()
    # Keep local builds and Pages on the same backend without requiring shell
    # variables on every machine. A complete environment pair can override it.
    if not url and not key:
        source = ROOT / "leaderboard-config.json"
        if source.exists():
            try:
                config = json.loads(source.read_text())
            except (ValueError, OSError) as error:
                raise ValueError("Could not read leaderboard-config.json as JSON.") from error
            if (not isinstance(config, dict) or set(config) != {"url", "key"}
                    or not all(isinstance(value, str) for value in config.values())):
                raise ValueError("leaderboard-config.json must contain only string fields url and key.")
            url, key = config["url"].strip().rstrip("/"), config["key"].strip()
    if not url and not key:
        return {"url": "", "key": ""}
    parsed = urlsplit(url)
    if (not url or not key or parsed.scheme != "https" or not parsed.hostname
            or parsed.username or parsed.password or parsed.path or parsed.query or parsed.fragment):
        raise ValueError("Set SUPABASE_URL to an HTTPS project URL and SUPABASE_PUBLISHABLE_KEY to its public key.")
    public = key.startswith("sb_publishable_")
    if not public:
        try:
            payload = key.split(".")[1]
            public = json.loads(base64.urlsafe_b64decode(payload + "=" * (-len(payload) % 4)))["role"] == "anon"
        except (IndexError, KeyError, ValueError, TypeError):
            public = False
    if not public:
        raise ValueError("The leaderboard needs a publishable or legacy anon key. Never publish a secret/service-role key.")
    return {"url": url, "key": key}


def build():
    config = leaderboard_config()  # Validate before replacing the last good build.
    if not config["url"]:
        print("Global leaderboards are disconnected: configure leaderboard-config.json "
              "with a Supabase project URL and publishable key. Local scores still work.")
    OUTPUT.mkdir(exist_ok=True)
    # Only this generated directory is replaced; user score/runtime files stay local.
    for child in OUTPUT.iterdir():
        if child.is_dir():
            shutil.rmtree(child)
        else:
            child.unlink()
    html = (ROOT / "web" / "index.html").read_text()
    for name in ("style.css", "app.js", "achievements.js", "customs.js", "shop.js", "music.js", "effects.js", "core-origin.js", "core-origin.css", "leaderboards.js", "favicon.svg"):
        shutil.copy2(ROOT / "web" / name, OUTPUT / name)
        version = hashlib.sha256((OUTPUT / name).read_bytes()).hexdigest()[:12]
        html = html.replace(f'"./{name}"', f'"./{name}?v={version}"')
    (OUTPUT / "index.html").write_text(html)
    (OUTPUT / "leaderboard-config.json").write_text(json.dumps(config) + "\n")
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
