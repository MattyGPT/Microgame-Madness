# Microgame Madness

Five games, two ways to play: a Python desktop/terminal collection and a browser arcade powered by the **same Python game rules**.

- **Hangman:** guess words on easy, medium, or hard difficulty.
- **Key Rush / Timed Keyboard Challenge:** type increasingly difficult sequences before time runs out.
- **Turtle Dodge:** survive falling blocks across four difficulty levels.
- **Boss Crush:** dodge and shoot through four boss difficulties.
- **The Pumpkin King:** survive a transformation and six attacks, including a timed counter move.

## Play the Python version

```sh
git clone https://github.com/MattyGPT/Microgame-Madness.git
cd Microgame-Madness
python3 hangman.py
```

Use Python 3.10 or newer (automated checks use 3.12). No third-party Python packages are required. Optional `colorama` enables colored terminal output.

The keyboard challenge requires an interactive Linux or macOS terminal. Graphical modes require a desktop session and Python's Tkinter/Tcl/Tk support. Install the Tk package for your operating system and Python installation if needed. A machine-local `.runtime/` Tcl/Tk installation is supported but is not tracked in Git. Pumpkin King sound uses `paplay` when available.

Controls: letters for Hangman; type the displayed sequence for Key Rush; arrow keys to move in arcade modes, F to shoot, C to counter in Pumpkin King, D to pause where allowed, Space to start/restart, and Escape to exit. Scores are stored in local JSON files excluded from Git.

## Play the web version locally

```sh
python3 scripts/build_web.py
python3 -m http.server 8000 --bind 127.0.0.1 --directory dist
```

Open **http://localhost:8000** in a modern browser. Use an HTTP server rather than opening `index.html` directly. The first load downloads the pinned Pyodide 0.29.3 runtime from jsDelivr and requires an internet connection. Browser games need no Python installation on the player's machine.

The web interface provides game selection, difficulty controls, desktop keyboard input, touch controls, and local high scores. Key Rush is the web name for the timed keyboard challenge. Scores are per browser and device; they do not sync with the Python version. If browser storage is blocked, scores last only for the current visit. Optional browser audio supplies synthesized Pumpkin King cues; it does not run the desktop audio player.

## Maintain both versions

Change shared rules once, then test and rebuild. **Do not edit `dist/`**: it is generated from the canonical source files.

| Files | Responsibility |
| --- | --- |
| `hangman_model.py` | Hangman words, difficulty, guesses, win/loss, scoring |
| `keyboard_model.py` | Typing sequences, progression, deadlines, penalties |
| `dodge_model.py` | Turtle movement, blocks, collisions, scoring |
| `boss_crush.py` | Boss combat, attacks, healing, difficulty |
| `pumpkin_king.py` | Phase 2 timing, attacks, counters, collision rules |
| `pumpkin_king_view.py` | Pumpkin King procedural artwork shared by both renderers |
| `hangman.py`, `keyboard_challenge.py`, `turtle_dodge.py` | Desktop/terminal input and presentation |
| `scores.py` | Desktop score persistence |
| `web/bridge.py` | Browser session adapter and Canvas drawing commands |
| `web/app.js`, `web/index.html`, `web/style.css` | Web input, Canvas presentation, browser scores, layout |
| `scripts/build_web.py` | Allowlisted packaging of the web interface and shared Python sources |

Pyodide runs the shared Python code through WebAssembly. JavaScript handles browser input and graphics, not a duplicate arcade rules engine. The browser adapter reuses the Pumpkin King renderer through a small Canvas adapter; other graphical modes have browser-specific drawing. If you change controls, difficulty names, or user-facing instructions, update the relevant interface copy too.

To add a shared module, include it in `PYTHON_SOURCES` in `scripts/build_web.py`. The generated manifest tells the browser which Python files to load. The build deliberately excludes score files, the desktop runtime, tests, and repository metadata.

## Validate changes

Python rules, desktop regressions, browser adapter parity, and deployment packaging:

```sh
python3 -m unittest discover -v
```

For web changes, install the development-only Node dependencies (Node 22+):

```sh
npm ci
npm run build
npm test
npx playwright install chromium
npm run test:browser
```

`npm test` runs the packaged Python modules in the actual Pyodide WebAssembly runtime. Playwright exercises the interface in desktop and mobile Chromium, including each game, scores across reloads, pause controls, layout width, and loading errors. Browser tests serve the exact pinned Pyodide npm distribution locally instead of depending on CDN uptime. CI also installs Chromium's system dependencies.

Pull requests run these checks automatically. The publish workflow reruns them on `main` before deployment.

## GitHub Pages

The intended address is **https://mattygpt.github.io/Microgame-Madness/**. Publishing is currently disabled because GitHub rejected Pages creation for this private repository on the account's current plan. The repository remains private.

A private personal repository requires GitHub Pro for Pages. The resulting Pages site and downloaded browser game code are public even though the repository remains private. [GitHub Pages availability](https://docs.github.com/en/pages/getting-started-with-github-pages/creating-a-github-pages-site)

After upgrading, enable Pages with GitHub Actions as the publishing source, then set the repository Actions variable `PAGES_ENABLED` to `true`. With the GitHub CLI:

```sh
gh api --method POST repos/MattyGPT/Microgame-Madness/pages -f build_type=workflow
gh variable set PAGES_ENABLED --body true --repo MattyGPT/Microgame-Madness
gh workflow run pages.yml --repo MattyGPT/Microgame-Madness
```

If Pages is already enabled, select **Settings → Pages → Source → GitHub Actions** instead of running the first command. Future pushes to `main` will test, package, and publish automatically. Only the generated `dist/` directory is deployed. Leaving `PAGES_ENABLED` unset runs checks and skips publication.
