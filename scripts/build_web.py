"""Package only the browser UI and shared Python sources for static hosting."""
from pathlib import Path
import hashlib
import json
import base64
import os
import re
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
    for name in ("exclusive-polish.js", "exclusive-polish.css", "game-dialog.js", "game-dialog.css", "settings.js", "settings.css", "news.js", "news.css", "autumn-room.js", "autumn-room.css", "tearesseract-theme.mp3", "tearesseract-prelude.mp3", "tearesseract-death.js", "jukebox-archive.js", "jukebox-search.js", "tearesseract-icon.js", "tearesseract.html", "tearesseract.js", "tearesseract-progress.js", "style.css", "crown-packs.js", "treasure-trove.js", "treasure-trove.css", "collections.js", "app.js", "coin-drop.js", "coin-drop-nanogames.js", "coin-drop-expansion.js", "coin-drop-frontier.js", "coin-drop-nano-music.js", "coin-drop-lessons.js", "coin-drop.css", "geomayhem-progress.js", "chaos-art.js", "chaos-preview.js", "achievements.js", "customs-expansion.js", "customs.js", "jackpot-slots.js", "shop.js", "music.js", "effects.js", "core-origin.js", "core-origin.css", "geomayhem-bosses.js", "playtest-progress.html", "boss-film.js", "boss-defeat.js", "boss-audio.js", "boss-arena.js", "regent-art.js", "trails.js", "turtle-customs.js", "trails.css", "leaderboards.js", "usage.js", "favicon.svg"):
        shutil.copy2(ROOT / "web" / name, OUTPUT / name)
        version = hashlib.sha256((OUTPUT / name).read_bytes()).hexdigest()[:12]
        html = html.replace(f'"./{name}"', f'"./{name}?v={version}"')
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
    # Standalone encounter assets must refresh together after deployment.
    encounter_path = OUTPUT / "tearesseract.html"
    encounter_html = encounter_path.read_text()
    for name in (*re.findall(r'src="\./([^"?]+)"', encounter_html), "tearesseract-theme.mp3", "tearesseract-prelude.mp3"):
        version = hashlib.sha256((OUTPUT / name).read_bytes()).hexdigest()[:12]
        encounter_html = encounter_html.replace(f'"./{name}"', f'"./{name}?v={version}"')
    encounter_path.write_text(encounter_html)
    (OUTPUT / "leaderboard-config.json").write_text(json.dumps(config) + "\n")
    # Announcement clips may be public while unreleased game sources stay local.
    media = ROOT / "web" / "media"
    if media.exists():
        (OUTPUT / "media").mkdir()
        for asset in media.iterdir():
            if asset.is_file() and asset.suffix in (".mp4", ".jpg"):
                shutil.copy2(asset, OUTPUT / "media" / asset.name)
    python_dir = OUTPUT / "python"
    python_dir.mkdir()
    for name in PYTHON_SOURCES:
        shutil.copy2(ROOT / name, python_dir / name)
    shutil.copy2(ROOT / "web" / "bridge.py", python_dir / "bridge.py")
    (OUTPUT / "python-files.json").write_text(json.dumps([*PYTHON_SOURCES, "bridge.py"]) + "\n")
    chart = language_chart(OUTPUT, (ROOT / "web" / "index.html").read_text())
    html = html.replace("<!-- LANGUAGE_BREAKDOWN -->", chart)
    # Released games ship in workspace and CI builds.
    for slug, number, title, accent in (("balloon-pop",16,"Balloon Pop","#f5a5c7"),("pool",17,"Penguin Pool","#69e8be")):
        source = ROOT / "web" / slug
        if (source / "index.html").exists():
            (OUTPUT / slug).mkdir()
            for asset in ("index.html", "game.js", "model.js", "style.css", "progress.js"):
                if (source / asset).exists():
                    shutil.copy2(source / asset, OUTPUT / slug / asset)
            sub_path = OUTPUT / slug / "index.html"
            sub_html = sub_path.read_text()
            output_root = OUTPUT.resolve()
            for ref in dict.fromkeys(re.findall(r'(?:src|href)="([^"?#]+)"', sub_html)):
                if ref.startswith(("http://", "https://")) or ref.endswith("/"):
                    continue
                target = (OUTPUT / slug / ref).resolve()
                if target.is_file() and (target == output_root or output_root in target.parents):
                    version = hashlib.sha256(target.read_bytes()).hexdigest()[:12]
                    sub_html = sub_html.replace(f'"{ref}"', f'"{ref}?v={version}"')
            sub_path.write_text(sub_html)
            art = '🎈' if number == 16 else '<svg viewBox="0 0 80 80" width="72" height="72" xmlns="http://www.w3.org/2000/svg"><defs><radialGradient id="penguin-card-ice" cx=".3" cy=".2" r=".8"><stop stop-color="#fff"/><stop offset=".4" stop-color="#b9f0ff"/><stop offset="1" stop-color="#3575aa"/></radialGradient></defs><circle cx="40" cy="40" r="30" fill="url(#penguin-card-ice)" stroke="#e5fcff" stroke-width="2"/><path d="m18 31 12-9 9 9-5 12 14 11 14-5M30 22l3-9m6 18 18-8m-9 31 1 15" fill="none" stroke="#efffff" stroke-opacity=".8"/><circle cx="40" cy="40" r="13" fill="#f6fdff" stroke="#9bcde0"/><text x="40" y="47" font-family="sans-serif" font-size="20" font-weight="bold" text-anchor="middle" fill="#285e85">8</text><path d="M21 25q7-12 18-10" fill="none" stroke="#fff" stroke-width="3" stroke-linecap="round"/></svg>'
            card = f'<a class="game-card" href="./{slug}/index.html" style="--accent:{accent};text-decoration:none" data-card-kind="microgame"><span class="card-kind-label" data-label="MICROGAME"><span>MICROGAME</span></span><span class="card-top">{number} / {title.upper()}</span><span class="card-art" aria-hidden="true">{art}</span><span class="card-title">{title} ↗</span><span class="card-description">Billiards and Balloons · mmu1.5</span></a>'
            html = html.replace('<button id="news-open"', card + '<button id="news-open"')
    (OUTPUT / "index.html").write_text(html)
    (OUTPUT / ".nojekyll").touch()
    print(f"Built browser game in {OUTPUT}")


if __name__ == "__main__":
    build()
