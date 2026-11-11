**[Play at microgame-madness.com →](https://microgame-madness.com/)**  
**[Play on MattyGPT’s GitHub Pages →](https://mattygpt.github.io/Microgame-Madness/)**

# Microgame Madness

A collection of browser and Python games powered by the same Python rules. Play Hangman, Key Rush, Turtle Dodge, Boss Crush, The Pumpkin King, The King’s Wrath, and Geomayhem—plus a secret unlockable boss.

Earn achievements, collect Cubie Customs and Turtle Trails, and explore the arcade jukebox. The browser supports keyboard and touch controls, local progress, and global leaderboards when connected. Optional accounts add cloud saves, history, and settings when the Supabase account service is configured.

## Run locally

From the repository root, build and serve the browser version:

```sh
python3 scripts/build_web.py
python3 -m http.server 8777 --bind 127.0.0.1 --directory dist
```

Open [localhost:8777](http://localhost:8777). The first load needs internet access to download Pyodide. `dist/` is generated; edit the source files instead.

For the Python desktop/terminal version, use Python 3.10+:

```sh
python3 hangman.py
```

Graphical games require Tkinter/Tcl/Tk. See the [setup and controls](docs/game-and-development-reference.md#play-the-python-version) for platform details.

## Development

Python checks:

```sh
python3 -m unittest discover -v
```

Web checks require Node 22+:

```sh
npm ci
npm test
npx playwright install chromium
npm run test:browser
```

## Documentation

- [Game and development reference](docs/game-and-development-reference.md): detailed rules, achievements, cosmetics, music, controls, and feature notes. Contains spoilers.
- [Global leaderboard setup](docs/game-and-development-reference.md#connect-the-global-leaderboards), [source architecture](docs/game-and-development-reference.md#maintain-both-versions), and hosting via [Cloudflare Workers static assets](docs/game-and-development-reference.md#cloudflare-workers-static-assets) with a [GitHub Pages mirror](docs/game-and-development-reference.md#github-pages).
- [Account service setup and operation](docs/accounts-backend.md), and [implementation status](docs/accounts-implementation-status.md).
- [Usage analytics](docs/usage-analytics.md): aggregate visit, login, and per-game counters, what is never collected, and how to read the report.
- [Accounts and progression design](docs/accounts-and-progression-design.md): proposed player experience, data model, sync, migration, and review decisions.
- [Accounts and progression implementation plan](docs/accounts-and-progression-plan.md): dependencies, subagent work packages, integration gates, tests, and rollout.
