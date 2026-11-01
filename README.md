# Microgame Madness

Five games, two ways to play: a Python desktop/terminal collection and a browser arcade powered by the **same Python game rules**.

- **Hangman:** guess words on easy, medium, or hard difficulty.
- **Key Rush / Timed Keyboard Challenge:** type increasingly difficult sequences before time runs out.
- **Turtle Dodge:** survive falling blocks across four difficulty levels.
- **Boss Crush:** dodge and shoot through four boss difficulties.
- **The Pumpkin King:** survive a transformation and seven attacks, including a timed counter move. Choose “Come On, Are You Really That Bad at the Game?” for 23 HP, Baby Mode for 15 HP, Coward Mode for 10 HP, or Impossible Phase 2 for 5 HP; each has separate high scores. Touching the King’s head, arms, or hands kills instantly in every mode, including during the awakening and damage immunity. The roar warns of mouth fire; fire and arm-lift smashes deal 1 HP per hit with normal damage immunity. Projectiles and rings deal their usual damage.

## Play the Python version

```sh
git clone https://github.com/MattyGPT/Microgame-Madness.git
cd Microgame-Madness
python3 hangman.py
```

Use Python 3.10 or newer (automated checks use 3.12). No third-party Python packages are required. Optional `colorama` enables colored terminal output.

The keyboard challenge requires an interactive Linux or macOS terminal. Graphical modes require a desktop session and Python's Tkinter/Tcl/Tk support. Install the Tk package for your operating system and Python installation if needed. A machine-local `.runtime/` Tcl/Tk installation is supported but is not tracked in Git. Pumpkin King sound uses `paplay` when available.

Controls: letters for Hangman; type the displayed sequence for Key Rush; arrow keys to move in arcade modes, F to shoot, E to counter in Pumpkin King, D to pause where allowed, Space to start/restart, and Escape to exit. Scores are stored in local JSON files excluded from Git.

## Play the web version locally

```sh
python3 scripts/build_web.py
python3 -m http.server 8000 --bind 127.0.0.1 --directory dist
```

Open **http://localhost:8000** in a modern browser. Use an HTTP server rather than opening `index.html` directly. The first load downloads the pinned Pyodide 0.29.3 runtime from jsDelivr and requires an internet connection. Browser games need no Python installation on the player's machine.

The web interface provides game selection, desktop keyboard input, touch controls, and local high scores. Choose a game, then click a difficulty in the play area to start each round. Play again returns to the difficulty choices; resuming a paused game keeps the current round. Selecting a game brings the play area into view, and arcade games resize to fit the available screen height with their controls. Boss fights show your current/max HP and a health bar above the arena, including while paused. Key Rush is the web name for the timed keyboard challenge. Scores are per browser and device; they do not sync with the Python version. If browser storage is blocked, scores last only for the current visit. Browser audio starts enabled. The first click or key press unlocks an original looping arcade chiptune, as required by browser autoplay rules. Starting any Pumpkin King difficulty crossfades to a faster Halloween boss theme; exiting or finishing the fight returns to the arcade theme. Music pauses with the game or a hidden tab, resumes from the same position, and the Sound toggle mutes both music and effects. Synthesized Pumpkin King attack cues remain louder than the music. No external music downloads or desktop audio player are needed.

The browser also has **71 achievements**. A first visit unlocks **Welcome to Microgame Madness!** automatically. Open the **Achievements** subtab beside Scores to browse requirements, progress, and unlocked medals. New awards immediately play a ding and fill the screen with tier-colored confetti for four seconds, followed by a one-second fade. Notifications appear at the top left; simultaneous notifications appear one at a time while celebrations start immediately. Muting also mutes the ding; the automatic welcome ding waits for the first browser audio-unlocking interaction. Reduced-motion settings keep the confetti still. Bronze medals add **10 profile points**, silver **30**, gold **90**, crystal **270**, diamond **810**, and rainbow **2,430**, once per achievement. Rainbow is the highest tier, above Diamond. Profile points are separate from game scores.

Hangman awards include **Hang in There!** for starting a game, **Good Game** for a win, **You've Got the Hang of It!!** for a hard win, **Word Wizard** for 5 wins, and **Professional Prodigy** for 10 wins. Additional achievements reward perfect guesses, typing rounds, survival times, playing every game, and boss victories in specific modes. Wins accumulate across visits; typing and survival milestones require a single run. Existing high scores and earned medals are preserved. Win counts track games completed since achievements were introduced; new cumulative milestones recognize that saved progress.

**Gerson Boom** (rainbow, +2,430) requires surviving 360 seconds in one Turtle Dodge game. **Domination!** (silver, +30) requires beating the Mean boss without taking damage. **Cruel and Unscathed** (silver, +30) and **Flawless Nightmare** (crystal, +270) reward zero-damage wins against the Cruel and Nightmare bosses respectively; healing does not erase damage. **Walking Dictionary** and **Speed of Type** remain gold (+90 each). **King of Suffering** (diamond) requires a Pumpkin King victory in any mode with zero damage taken throughout the fight; healing cannot undo a hit. **Close One** (silver) requires entering a six-pixel proximity zone around a Turtle Dodge block and safely leaving it without collision. **I'm Still Standing!** (crystal) requires 120 seconds in a single Turtle Dodge game. Other crystal and diamond challenges include longer typing runs, 50/100 Hangman wins, perfect guesses, repeated boss victories, 120 seconds on Merciless, and a no-hit Impossible Boss Crush win.

Locked achievement cards are fully grayscale, with dimmer borders and sparkles; unlocking restores their tier colors and full shine without changing text readability. Bronze, silver, and gold use thick rounded metallic borders; crystal, diamond, and rainbow use thinner prismatic hexagons. Rainbow medals and their confetti use a full spectrum of colors. Visible cards gently shine and sparkle, and reduced-motion preferences disable the animation.

Secret achievements include **DINGDONG** (crystal, “WHO YOU ARE.”) for triggering the name effect and **Awwwwww!** (gold) for clicking, tapping, or keyboard-activating Cubie. Cubie blushes and squeaks when sound is enabled. Enter **CUBIE** for a green greeting and **On a First-Name Basis** (gold), **BOO** for a purple scare and **Boo to You Too!** (gold), or **STARLIGHT** for a starfield and **Written in the Stars** (crystal). Names ignore case and surrounding spaces. Each effect lasts four seconds and pauses music, then restores your sound/pause settings; awards only count once. Cubie’s sparkles and orbit animate, with reduced-motion support. **Down to the Wire** (gold) rewards a Hangman win with exactly one wrong guess remaining.

**Untouchable Streak** (crystal, +270) rewards five consecutive Boss Crush wins without damage, across any difficulties. Damage, a loss, leaving an unfinished fight, or reloading during a fight resets the streak; completed streak progress survives reloads and other games. **Fit for a King** (crystal, +270) rewards a Pumpkin King victory at full HP in any mode, including health restored by healing. Collecting a healing item flashes the screen green, even at full HP.

Boss Crush has separate full-HP awards for **Mean and Pristine** (Mean, silver), **Cruel and Complete** (Cruel, silver), **Healthy Awakening** (Nightmare, gold), and **Impossible Vitality** (Impossible, crystal). A victory at maximum HP qualifies whether or not healing was used. **Untouchable Champion** remains the existing Diamond Impossible no-damage award; taking damage and healing back to full HP never qualifies for it.

Rainbow achievements each award **2,430 points**:

| Achievement | Requirement |
| --- | --- |
| Gerson Boom | Survive 360 seconds in one Turtle Dodge game. |
| Rainbow Lexicon | Win 250 Hangman games. |
| Spectrum Speed | Complete 75 rounds in one Key Rush game. |
| Beyond Mercy | Survive 240 seconds in one Merciless game. |
| Unbreakable Spectrum | Win 15 consecutive Boss Crush fights without damage. |
| Sovereign of Suffering | Win 5 Pumpkin King fights without damage, in any mode. |

Other new milestones reward five perfect Hangman wins, a perfect hard Hangman win, 180 seconds in Turtle Dodge, 25 Boss Crush victories, 25 Pumpkin King victories, a win in the 23-HP Pumpkin King mode, and ten consecutive no-damage Boss Crush victories.

Existing tiers have been rebalanced:

| Achievement | Previous tier / points | Current tier / points |
| --- | --- | --- |
| Impossible Is Possible | Gold / 90 | Crystal / 270 |
| Flawless Nightmare | Gold / 90 | Crystal / 270 |
| Long Live the New King | Gold / 90 | Diamond / 810 |
| Gerson Boom | Diamond / 810 | Rainbow / 2,430 |

Opening the updated game automatically recalculates existing profile scores using the current tiers. Unlock dates and progress are retained; converted achievements are not awarded or celebrated again.

Achievements belong to one local browser profile. Changing the player nickname keeps that profile; clearing browser storage removes its progress. If storage is blocked, achievements work for the current visit only.


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
| `web/music.js` | Original chiptune scores, synthesis, looping, and music transitions |
| `web/achievements.js` | Achievement catalog, progress rules, and profile points |
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

`npm test` checks achievement thresholds, persistence, and duplicate prevention, and runs the packaged Python modules in the actual Pyodide WebAssembly runtime. Playwright exercises the interface in desktop and mobile Chromium, including each game, scores across reloads, pause controls, layout width, and loading errors. Browser tests serve the exact pinned Pyodide npm distribution locally instead of depending on CDN uptime. CI also installs Chromium's system dependencies.

Pull requests run these checks automatically. The publish workflow reruns them on `main` before deployment.

## GitHub Pages

Play the browser version at **https://mattygpt.github.io/Microgame-Madness/**.

The repository and website are public. GitHub Pages publishes through GitHub Actions, with the repository variable `PAGES_ENABLED` set to `true`.

Each push to `main` runs the Python, WebAssembly, and browser checks, then builds and deploys only the generated `dist/` directory. Shared rule changes therefore reach both the Python source and the published browser game. Local score files and the desktop runtime are excluded from the deployment package.

To republish the current `main` branch manually:

```sh
gh workflow run pages.yml --repo MattyGPT/Microgame-Madness
```

Deployment progress is available in the repository's **Actions → Publish browser game** workflow. Setting `PAGES_ENABLED` to `false` skips future deployments while still running checks; it does not remove an already published site.

The Impossible Boss Crush boss shares the Pumpkin King’s pre-transformation pumpkin face: black features on a white body, with only its eyes flashing yellow when struck.

The Pumpkin King’s seventh attack, **Haunted Quadrants**, divides the arena with a plus sign for exactly five seconds. Fifteen scares appear every ⅓ second (50% faster than the original attack) in clockwise order: top left, top right, bottom right, bottom left. Each slot starts with about 0.133 seconds of flashing red/yellow exclamation marks, then three spooky faces and a short laugh. The active section deals 0.5 HP once per appearance, even if you enter it after the faces appear. The dividing lines and warnings do not deal damage; head/arm contact remains lethal. Healing restores HP normally but never erases the half-point damage history.
