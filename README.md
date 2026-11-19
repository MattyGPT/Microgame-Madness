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

## Microgame News and private moderation

**Never make moderator access public.** Never deploy `scripts/serve_news.mjs`, expose
port 8777 through a tunnel/reverse proxy, bind the moderator to a public interface,
or ship `.env.supabase` or management credentials in browser assets. A localhost
hostname check in browser JavaScript is not authorization: the private loopback
server checks Host and Origin and performs moderator writes using server-only
credentials. Public visitors cannot publish posts, delete comments, or block players. The
authenticated moderation API grants those actions only to explicitly invited account
UUIDs. GAMETESTER is an invited moderator; editing a name or browser storage never
grants this access.

Apply migrations and run the connected local creator preview:

```sh
npm run accounts:migrate
npm run accounts:build-preview
node --env-file=.env.supabase scripts/serve_news.mjs
```

Visit http://localhost:8777/ and open **Microgame News**. The creator desk publishes
updates to the shared backend. Suggestions have delete-for-everyone and block
controls, plus a blocked-player list for unblocking. Public hosting includes only
`dist`; configure its browser-safe backend URL and publishable key to use the same
feed. A plain static local server supports reading but cannot moderate.

News has one toggleable like per signed-in player and an unread badge. A post is
read after five uninterrupted seconds visible in the open News panel in a visible
browser tab. Read markers persist locally, and for signed-in players on the backend.
The feed shows the latest 100 posts and suggestions. Suggestions require an account,
are limited to 1,000 characters and one every 30 seconds, and show the current
account Cubie and top-three lifetime game standings (respecting ranking privacy).

The server rejects a maintained list of profanity/slurs, including simple spacing,
punctuation and leetspeak substitutions. Each rejected submission pauses commenting
for 10 minutes; the fifth and subsequent violations pause it for 24 hours. Attempts
during an active pause do not add strikes. Manual blocks last until unblocked.
Filtering is not comprehensive language understanding and can have false positives;
maintain the vocabulary and use the private moderation controls as needed.

### Creator, game tester, and private chat

Localhost posts are labeled **Nate, the creator**, with a violet galaxy theme.
The invited GAMETESTER account posts as **Aidan, the gametester**, with a fiery
orange theme. GAMETESTER has the TON618 Cubie unlocked and equipped in the cloud.
Moderator membership is stored in `news_private.team` by verified account UUID;
only a private operator can grant or revoke it. Moderator actions are audited.

**The Autumn Room** is a separate private chat tab, visible to the local creator
and the invited account. Its backend checks membership on every read and send;
chat messages are never included in the public news feed. It stores the latest
conversation on the backend and displays the most recent 100 messages. The purple
fall setting starts original synthesized lo-fi music when opened, pausing other
arcade music. A play/pause button and volume control remain available. Room music
stops when the room closes or the browser tab is hidden; arcade music can resume
when you close the room.

For a preview that survives terminal closure, run from this workspace:

```sh
systemd-run --user --unit=microgame-preview \
  --property=WorkingDirectory="$PWD" --property=Restart=on-failure \
  /usr/bin/env node --env-file=.env.supabase scripts/serve_news.mjs
```

If it is already installed for the current login, use
`systemctl --user restart microgame-preview`. This remains a loopback-only service;
do not expose it on the public site. Public News and invited-account moderation
are delivered through the static site and authenticated database API.

### Expanded game rewards and rankings

Geomayhem retains its existing achievement and Cubie rewards and now ranks total
points from completed expeditions across all 20 arenas. Coin Drop, Nano Lab,
Treasure Trove, and Tearesseract add 30 achievements and 28 permanent Cubies.

- Coin Drop: one leaderboard point per banked non-mini coin; upgrade currencies stay separate.
- Nano Lab: one point per win. Closing a challenge or reading a lesson earns no points. The random button selects from all 300 nanogames.
- Treasure Trove: one point per correct treasure; achievements use the highest round won.
- Tearesseract: cleared attacks from full encounters that end in defeat or victory. Attack loading, ending previews, and any use of invincibility disqualify that encounter.

All five games have temporary #1 Cubie, Turtle, and Trail packs. Crown ownership
is checked against the all-time combined leaderboard and expires when unverified
or when another player takes first place. Every crown Turtle uses turtle anatomy
and a game-specific shell emblem.

Cloud rollout requires migration `20261119000005_expanded_combined_leaderboards.sql`
and redeployment of the `accounts` function with the updated shared rules and
catalogs. Local profile rewards work without a configured leaderboard service.
