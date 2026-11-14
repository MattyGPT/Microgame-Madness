"""Package only the browser UI and shared Python sources for static hosting."""
from pathlib import Path
import hashlib
import json
import base64
import os
import shutil
import sys
from urllib.parse import urlsplit

ROOT = Path(__file__).resolve().parents[1]
OUTPUT = ROOT / "dist"
PYTHON_SOURCES = (
    "hangman_model.py", "keyboard_model.py", "dodge_model.py", "chaos_dodge.py", "boss_crush.py",
    "pumpkin_king.py", "pumpkin_king_view.py", "kings_wrath.py", "wrath_attacks.py",
    "singularity_core.py", "singularity_core_view.py", "singularity_practice.py",
    "arcade_effects.py",
    "geomayhem.py", "geomayhem_bosses.py", "geomayhem_weapons.py", "geomayhem_view.py", "geomayhem_arenas.py",
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


def language_chart(output, html_source):
    """Measure first-party source shipped to browsers; omit assets and vendors.

    Use the HTML template rather than the generated chart to avoid counting the
    chart's own output. Reading the built files includes newly shipped modules.
    """
    languages = {".py": ("Python", "#66b9ff"), ".js": ("JavaScript", "#f4d66c"),
                 ".css": ("CSS", "#b39aff"), ".html": ("HTML", "#ff937c")}
    counts = {suffix: 0 for suffix in languages}
    counts[".html"] = len(html_source.encode("utf-8"))
    for path in output.rglob("*"):
        if path.is_file() and path.suffix in counts and path.name != "index.html":
            counts[path.suffix] += path.stat().st_size
    total = sum(counts.values())
    if not total:
        return ""
    stops, rows, start = [], [], 0
    for suffix, (name, color) in languages.items():
        amount = counts[suffix]
        share = amount / total * 100
        end = start + share
        stops.append(f"{color} {start:.6f}% {end:.6f}%")
        rows.append(f'<li data-language="{name}" data-bytes="{amount}">'
                    f'<span class="language-swatch" style="--language-color:{color}"></span>'
                    f'<span>{name}</span><strong>{share:.1f}%</strong></li>')
        start = end
    return ('<section class="language-breakdown" aria-labelledby="language-heading">'
            '<h3 id="language-heading">Behind the games</h3>'
            '<div class="language-pie" aria-hidden="true" style="background:conic-gradient('
            + ','.join(stops) + ')"></div><ul class="language-legend">' + ''.join(rows)
            + '</ul><p>Website source by file size. Recalculated every build. '
            'Images, videos, and third-party libraries excluded.</p></section>')


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
    # Publish the same weighted block catalog before the browser engine loads.
    sys.path.insert(0, str(ROOT))
    try:
        from chaos_dodge import catalog as chaos_catalog
        bootstrap = json.dumps(chaos_catalog()).replace("<", "\\u003c")
    finally:
        sys.path.pop(0)
    html = html.replace('<!-- CHAOS_BOOTSTRAP -->', bootstrap)
    for name in ("style.css", "app.js", "coin-drop.js", "coin-drop-nanogames.js", "coin-drop-nano-music.js", "coin-drop-lessons.js", "coin-drop.css", "geomayhem-progress.js", "chaos-art.js", "chaos-preview.js", "achievements.js", "customs-expansion.js", "customs.js", "jackpot-slots.js", "shop.js", "music.js", "effects.js", "core-origin.js", "core-origin.css", "geomayhem-bosses.js", "boss-showcase.html", "playtest-progress.html", "boss-showcase.js", "boss-showcase.css", "boss-film.js", "boss-defeat.js", "boss-audio.js", "boss-arena.js", "regent-art.js", "trails.js", "turtle-customs.js", "trails.css", "leaderboards.js", "usage.js", "favicon.svg"):
        shutil.copy2(ROOT / "web" / name, OUTPUT / name)
        version = hashlib.sha256((OUTPUT / name).read_bytes()).hexdigest()[:12]
        html = html.replace(f'"./{name}"', f'"./{name}?v={version}"')
    # Version the standalone theater's dependencies too, so an existing browser
    # cannot combine the playable UI with a cached demo-only script.
    theater_path = OUTPUT / "boss-showcase.html"
    theater = theater_path.read_text()
    for name in ("boss-showcase.js", "boss-showcase.css", "regent-art.js",
                 "geomayhem-bosses.js", "boss-film.js", "boss-defeat.js", "boss-audio.js", "boss-arena.js"):
        version = hashlib.sha256((OUTPUT / name).read_bytes()).hexdigest()[:12]
        theater = theater.replace(f'"./{name}"', f'"./{name}?v={version}"')
    theater_path.write_text(theater)
    shutil.copy2(ROOT / "shared" / "account-rules.js", OUTPUT / "account-rules.js")
    account_names = ("store.js", "session.js", "sync.js", "app.js", "welcome.js", "profile.css")
    (OUTPUT / "accounts").mkdir()
    for name in account_names:
        shutil.copy2(ROOT / "web" / "accounts" / name, OUTPUT / "accounts" / name)
    for name in ("account-rules.js", *(f"accounts/{name}" for name in account_names)):
        version = hashlib.sha256((OUTPUT / name).read_bytes()).hexdigest()[:12]
        html = html.replace(f'"./{name}"', f'"./{name}?v={version}"')
    shutil.copytree(ROOT / "web" / "accounts" / "tours", OUTPUT / "accounts" / "tours")
    # The operator dashboard ships unlinked: nothing in the arcade references it.
    (OUTPUT / "ops").mkdir()
    for name in ("usage.html", "usage.css", "usage.js"):
        shutil.copy2(ROOT / "web" / "ops" / name, OUTPUT / "ops" / name)
    ops_html = (OUTPUT / "ops" / "usage.html").read_text()
    for name in ("usage.css", "usage.js"):
        version = hashlib.sha256((OUTPUT / "ops" / name).read_bytes()).hexdigest()[:12]
        ops_html = ops_html.replace(f'"./{name}"', f'"./{name}?v={version}"')
    (OUTPUT / "ops" / "usage.html").write_text(ops_html)
    (OUTPUT / "leaderboard-config.json").write_text(json.dumps(config) + "\n")
    python_dir = OUTPUT / "python"
    python_dir.mkdir()
    for name in PYTHON_SOURCES:
        shutil.copy2(ROOT / name, python_dir / name)
    shutil.copy2(ROOT / "web" / "bridge.py", python_dir / "bridge.py")
    (OUTPUT / "python-files.json").write_text(json.dumps([*PYTHON_SOURCES, "bridge.py"]) + "\n")
    chart = language_chart(OUTPUT, (ROOT / "web" / "index.html").read_text())
    html = html.replace("<!-- LANGUAGE_BREAKDOWN -->", chart)
    (OUTPUT / "index.html").write_text(html)
    (OUTPUT / ".nojekyll").touch()
    print(f"Built browser game in {OUTPUT}")


if __name__ == "__main__":
    build()
