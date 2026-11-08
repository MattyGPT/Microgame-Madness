# Game and development reference

Detailed gameplay, collection, audio, architecture, testing, and deployment notes for Microgame Madness. Commands and source paths are relative to the repository root. This reference includes secret unlocks and achievement spoilers.

[Back to README](../README.md) · [Play in your browser](https://mattygpt.github.io/Microgame-Madness/)

- [Games and collections](#games-and-collections)
- [Singularity Core](#singularity-core-browser-rough-draft)
- [Python setup](#play-the-python-version)
- [Local web setup and feature details](#play-the-web-version-locally)
- [New-feature achievements and Empyrorite](#new-feature-achievements-and-empyrorite)
- [Global leaderboard setup](#connect-the-global-leaderboards)
- [Design proposals](#design-proposals)
- [Source architecture](#maintain-both-versions)
- [Tests](#validate-changes)
- [GitHub Pages deployment](#github-pages)
- [Additional feature notes](#additional-feature-notes)

## Games and collections

Six browser games, a secret unlockable boss, and a Python desktop/terminal collection, powered by the **same Python game rules**.

- **Hangman:** guess words on easy, medium, or hard difficulty.
- **Key Rush / Timed Keyboard Challenge:** type increasingly difficult sequences before time runs out.
- **Turtle Dodge:** survive falling blocks across four difficulty levels.
- **Boss Crush:** dodge and shoot through four boss difficulties.
- **Geomayhem (roguelike campaign):** play as Cubie in a geometric survivor roguelike with **20 sequential arenas × 20 waves**. WASD or arrow keys move; Cubie's face follows movement. Aim with the mouse and click or hold the left button to fire. Touch players use the joystick and hold Fire to aim at the nearest enemy. R pauses; Escape returns to the picker. Pick one of **44 weapons**, gather green XP crystals, and choose upgrades while combat pauses. Level-ups offer new weapons as well as upgrades: equip up to **four weapons (including the starter)** per run. Handheld weapons fire together; **A Drone** (homing missiles) and **B Drone** (chain shots) orbit Cubie and attack automatically. Ten additional automatic item weapons—Ember Lantern, Frost Orb, Tesla Coil, Blade Bot, Gravity Cube, Prism Turret, Spore Pod, Repair Beetle, Storm Totem, and Solar Shield—are acquired through XP level-up choices. All 12 item weapons have independent five-star upgrades, with new traits, names, and artwork at stars three and five. Whenever a weapon slot is open, level-up drafts offer a random item companion and a random handheld weapon alongside an upgrade and passive/relic choice. Neither drone is guaranteed in the opening. Each slot upgrades independently; full loadouts receive upgrades and passive choices instead of duplicate or fifth weapons. Weapons and item companions do not drop on the ground; acquire them through XP level-up choices. Only XP crystals drop from defeated enemies. Level-up costs are 50% higher than the original curve, rounded up: 12, 20, 27, 35 XP, then continuing upward. Clearing a wave collects all remaining XP crystals and can trigger earned level-ups. Enemy contact deals 15 damage, elite/boss contact deals 24, and enemy projectiles deal 12 (50% more than the initial damage values). Arenas are 930 × 705 world units, 50% wider and taller than the original 620 × 470. Mobile play uses a closer camera that follows Cubie, with a minimap and corrected mouse aiming. Friendly effects fade near Cubie and render below enemies and high-contrast hostile shots. Queued level-ups show the number of remaining choices. Each weapon caps at **five stars**, gaining an additional combat trait and new effect artwork at **three and five stars**. Elites arrive on waves 5, 10 and 15; wave 20 brings a boss. Clear every enemy to advance. Only arena 1 and five starting weapons are initially unlocked. Clear an arena to unlock the next one and five more starters (all 44 by eight clears); all weapons remain discoverable during runs. Each expedition starts at one star and rolls a Swarming, Armored, or Frenzied enemy modifier. Every third XP rank can offer a relic, up to three per run: Glass Prism, Siphon Core, Winter Engine, Echo Chamber, Fleet Core, or Long Reach. Two rerolls per expedition change the current choices without spending XP. Defeat or leaving ends the run and resets weapons, stars, relics, and rerolls. Finished runs award two shards per wave cleared plus one per ten defeats; wins add 20 and first clears add another 40. The workshop spends shards on permanent health (+10/tier), damage (+5%/tier), or pickup range (+12/tier); each caps at three tiers costing 30, 120, and 240 shards, unlocked after clearing arenas 1, 4, and 8 respectively. Previously purchased tiers remain owned. Arena unlocks, best waves, shards, and workshop tiers persist in browser local storage, separately per account/guest profile; they do not cloud-sync. A storage failure is visibly reported and keeps progress in memory for the visit. Geomayhem does not award Cubie Cash or global achievements.

Geomayhem's arenas have unique backgrounds and mechanics. Yellow marked zones warn before activating in red; their locations lock in, leaving time to escape. Runners and flankers telegraph straight charges; flankers intercept movement and ranged enemies lead their shots. Bosses gain an additional aimed danger mark below half health, while the Mayhem Engine has a third phase below one-quarter health. Boss freezes are brief and have a resistance cooldown.

| Arena | Background | Arena hazard | Boss |
| --- | --- | --- | --- |
| Mint Circuit | PCB traces and nodes | Pulse rails | Circuit Warden |
| Amber Foundry | Steel plates, vents, conveyors | Molten vents | Foundry Colossus |
| Violet Array | Linked triangular arrays | Crossing array beams | Array Architect |
| Glacier Grid | Fractured ice plates | Slowing frost fields | Glacier Monarch |
| Rose Reactor | Flower reactors and pipes | Bloom pulses | Rose Heart |
| Volt Vault | Capacitors and current channels | Predicted lightning strikes | Volt Conductor |
| Cinder City | Charred blocks and streets | Burning streets | Cinder Juggernaut |
| Lunar Labyrinth | Craters and staggered maze paths | Alternating lunar gates | Labyrinth Keeper |
| Prism Rift | Faceted islands and split rifts | Rift collapses | Prism Doppelstar |
| Mayhem Core | Radial machine and segmented rings | Core beams and overload rings | Mayhem Engine |
| Coral Cascade | Coral branches, bubbles, rippling seabed | Tidal rings | Coral Leviathan |
| Clockwork Keep | Interlocking cogs and clock face | Rotating clock-hand beams | Brass Timekeeper |
| Emerald Canopy | Leaves and branching vines | Thorn thickets | Canopy Colossus |
| Obsidian Forge | Black glass and copper seams | Zigzag fractures | Basalt Behemoth |
| Aurora Observatory | Polar light and telescope lens | Slanted aurora curtains | Polar Astronomer |
| Neon Speedway | Racing lanes and starting grid | Alternating turbo lanes | Neon Pursuer |
| Sunken Archive | Book stacks and water stains | Sealing shelves | Drowned Librarian |
| Mirage Palace | Palace diamonds and pillars | Mirage flares and rings | Mirage Sovereign |
| Void Cathedral | Gothic pillars and stained glass | Void seals and crossed beams | Hollow Cantor |
| Infinity Crown | Twin infinity loops and crown | Crownfall marks and final overload | Infinity Regent |

Arenas 11–20 unlock sequentially after Mayhem Core, with twenty waves each and ten additional original looping tracks also available in the jukebox. Existing saves retain their clears, shards, workshop tiers, and best waves. Arena hazards never repeat faster than every 4.5 seconds; attack warnings remain visible before damage. Infinity Regent gains a third phase below 25% health.


- **The Pumpkin King:** survive a transformation and seven attacks, including a timed counter move. Choose “Come On, Are You Really That Bad at the Game?” for 23 HP, Baby Mode for 15 HP, Coward Mode for 10 HP, or Impossible Phase 2 for 5 HP; each has separate high scores. Touching the King’s head, arms, or hands kills instantly in every mode, including during the awakening and damage immunity. The roar warns of mouth fire; fire and arm-lift smashes deal 1 HP per hit with normal damage immunity. Projectiles and rings deal their usual damage.

- **The King’s Wrath (browser):** a separate yellow-crown minigame that loads any of the Pumpkin King’s seven attacks with 15 HP. Every attack begins with a three-second 3–2–1 countdown, including repeats. Haunted Quadrants adds its two-second positioning break afterward, for five seconds before the scares begin. Choose Color Memory, Bone Gauntlet, Rotating Rings, Magenta Fingers, Chaos, Royal Slams, or Haunted Quadrants (the spook attack). The chosen attack repeats with the same three-second countdown until you win or die. Choose **Random Order** to play all seven attacks once in a shuffled order, then reshuffle. Adjacent attacks never repeat, including between shuffles. Random Order keeps the same 15 HP, countdowns, and combat rules, with separate local and global scores. Combat, movement, healing, and score time pause during this countdown. Arrows move, F shoots, E counters, and D pauses; Escape returns to the attack picker. Local and global records are separate for each practice attack. Practice victories do not award full-fight Pumpkin King achievements.

Bone Gauntlet columns render as continuous thick bone shafts, with paired rounded knuckles facing the safe opening and flat ends at the arena edges. This shared artwork appears in Pumpkin King and The King’s Wrath. All seven attacks now use richer shared effects: color-memory sigils, shaded and cracked ivory bones, alternating gem facets and runes on rings, jointed magenta fingers, luminous Chaos projectiles, slam warning chevrons and hot impact edges, turbulent mouth-fire filaments, and animated haunted faces with drifting mist. Damage shapes, color rules, and warning timings stay the same.

Pumpkin King healing pickups are candies: wrapped bonbons, peppermints, lollipops, candy corn, and gummy bears. Each spawn independently chooses one of the five designs and keeps it until collected or expired. A green halo and plus mark identify healing items. They still spawn every 16 seconds, last nine seconds, and restore 1 HP up to the mode’s maximum, using the same collection area. Candy selection uses independent cosmetic randomness and cannot change combat patterns. The shared artwork and candies also appear in The King’s Wrath.

**Custom Cubie:** open Cubie’s floating, blinking card to browse **155 Customs**: 90 linked to achievements and 65 exclusive to the Cubie Shop (Classic Cubie comes with the automatic welcome achievement). Each has a distinct silhouette or accessory, with the same body size, pixel face, shaded sides, and floating style as normal Cubie. Pumpkin Cubie has a lobed, ribbed pumpkin body; Turbo Cubie has four wheels, tire highlights, racing stripes, and a rear spoiler. Defeating the Pumpkin King in any mode unlocks **Pumpkin Cubie**, complete with pumpkin ribs, a stem, and a leaf. Other Customs include a wizard, detective, typewriter, rocket, turtle, cactus, astronaut, dragon, ghost, jester, and more. Each card lists its unlock requirement and a tier badge, with an outline matching its Bronze, Silver, Gold, Crystal, Diamond, Rainbow, Empyrorite, or Black tier. The top preview shows the same tier. Tiers match the unlocking achievement except Rainbow Phantom King Cubie, which unlocks from the Diamond King of Suffering achievement; Pumpkin Cubie uses Silver, the lowest of its alternative unlock tiers, and Gaster Cubie uses Black. Choose **Preview** on any Custom, including locked ones, to see its look and unique flavor text without equipping it. Filter by locked or unlocked, then choose **Wear Custom** on an unlocked Custom to equip it. Your choice appears on Cubie in the header, the Custom Cubie card, and Cubie’s hint popup, and persists in this browser. Previously earned achievements unlock their Customs immediately. Dressing Cubie does not start a round or change scores.

**Trooper Cubie (Bronze):** earn **At Least You Tried** by dying in under five seconds in Turtle Dodge. This mint-colored Cubie wears a forehead bandage, stitched patch, and bronze comeback ribbon. Already-earned achievements unlock it immediately.

**Cubie animations:** character-specific accessories animate in the closet, shop, previews, and equipped art: hinged wings and paddling limbs, rolling tire treads, rocket exhaust, moving attack effects, clockwork, rain, steam, and polished metal. The shared face and body size stay consistent. Reduced-motion preferences keep every outfit in a readable static pose.

**Two more Gold Customs:** **Bumblebee Cubie** has striped golden fur, antennae, and pale blue wings; earn **Thread the Shell** with 10 close calls in one Turtle Dodge game. **Pharaoh Cubie** wears a blue-and-gold headdress and collar; earn **Flawless Five** with five perfect Hangman wins. Already-earned medals unlock these outfits immediately.

**Gaster and medal Customs:** finish the GASTER event and earn **WASTE OF TIME** for Gaster Cubie. The seven collection achievements unlock Bronze Cubie at **20 bronze**, Silver Cubie at **15 silver**, Golden Cubie at **10 gold**, Crystal Cubie at **5 crystal**, Diamond Cubie at **3 diamond**, Rainbow Cubie at **2 rainbow**, and Empyrorite Cubie at **1 empyrorite** achievement. Each collection achievement awards its own tier's normal points, but never counts itself toward its requirement. Existing medals count on your next visit; the closet displays collection progress. The first eight additional bronze milestones brought the ordinary bronze catalog to 20: two Hangman wins, three Key Rush rounds, ten seconds in Turtle Dodge, ten Cubie pets, two Boss Crush wins, two Pumpkin King wins, a King's Wrath counter, and fifteen seconds on Merciless.

**Eight more bronze achievements** bring the ordinary bronze catalog to **28** (29 including Bronze Collection): **Third Word’s the Charm** (3 Hangman wins), **Taking the Hard Way** (3 hard wins), **Clean Spelling** (3 perfect wins), **Double Tap** (2 Key Rush rounds in one game), **Twenty-Second Turtle** (20 seconds in Turtle Dodge), **Quarter-Century Cuddles** (25 Cubie pets), **Second Rehearsal** (2 King’s Wrath wins), and **Three Close Shaves** (3 close calls in one Turtle Dodge game). Each awards 10 points; saved progress counts, and Bronze Cubie still requires 20 bronze achievements.

**Attack-survival Customs:** seven outfits unlock by surviving each Pumpkin King attack ten times, combining completions across Pumpkin King difficulties and The King’s Wrath, including Random Order. Fifteen more unlock by surviving each Core protocol three times, combining the full fight and attack loader. Each has its own achievement, progress counter, and themed artwork. Only completed attacks count; entering an attack, dying before its end, quitting, and replaying the finale do not. Counts persist across runs and reloads; older profiles start these counters at zero.

**Cubie Shop:** the deep-blue C coin opens 65 exclusive Customs priced from 150 to 4,000 Cubie Cash. The shop always sorts by ascending price, with equal prices alphabetized by name. Each can be inspected before purchase and equipped from either the shop or closet afterward. Cash and purchases are saved in the existing local profile; old profiles start at zero without changing existing records. Every 100 converted score earns 1 Cash, with fractional progress retained. Conversion is raw score × game multiplier × difficulty bonus: Hangman and Key Rush ×400; Turtle Dodge ×1.2; Singularity ×0.1; Boss Crush, Pumpkin King, and King's Wrath ×1. Hangman bonuses are ×1/×2/×3, Dodge and Boss Crush ×1/×2/×3/×5 in ascending difficulty order, Pumpkin ×1/×2/×3/×5 from Come On through Phase 2, Wrath ×2 for Random Order (otherwise ×1), and Singularity ×3. Finished rounds pay once, including losses with a positive score; Key Rush also pays on exit. Temporary Core practice pays nothing. Achievement profile points are separate from Cash.

**New Rainbow shop Cubies:** Prism Moth Cubie (2,100 Cash) has fluttering multicolor wings; Rainbow Sundae Cubie (2,150 Cash) wears colorful scoops and a bobbing cherry. Both use the existing purchase, preview, and equip controls and respect reduced-motion preferences.

**Turtle Trails:** the Cubie Shop also has a separate collection of 48 trails, sorted by price from 50 to 2,400 Cubie Cash. Buy a trail, choose **Equip trail**, or select **No trail** to turn it off. Trails use the same wallet as Customs and save ownership and equipment independently from your Cubie skin. Small particles follow movement and disappear in 0.32–0.395 seconds in Turtle Dodge, Boss Crush, Pumpkin King, and The King's Wrath. Trails never appear in Singularity Core, its attack practice, or either cinematic. Pausing freezes them; stopping lets them fade. Reduced-motion preferences disable the particles and preview animation. Trails have no effect on movement, damage, hitboxes, rewards, or random attack patterns.

**Arcade Jukebox:** open the music-room card to choose any arcade song, game theme, or rock track. The selected song loops; Pause/Resume keeps your place, Stop (or Escape) stops playback, and the Sound toggle mutes it. Leaving the card restores normal game music. Listening to the Gaster remix while wearing Gaster Cubie unlocks the black **Signal Recognized** achievement (666 profile points).

After finishing 20 minigame rounds, Cubie appears in a large one-time popup hinting that entering **GRAVITRON** somewhere on the website unlocks a secret, without revealing where. **Okay** dismisses the popup and resumes play. Gameplay and timers freeze while it is open. Wins and losses count once each; exiting early, jukebox selections, and temporary practice do not count. The completion counter and shown flag stay in this browser profile across reloads; previous starts do not count toward completions.

Chaos and Color Memory bullets appear as small ghosts with rounded heads, trailing hems, and circular eyes and mouths, retaining their white, blue, or orange rule colors. This artwork is shared with The King’s Wrath; bullet movement and collision rules are unchanged.

## Singularity Core (browser rough draft)

**Origin cinematic:** entering `GRAVITRON` in the player-name field plays a 23-second animated origin, both on first unlock and when entered again later. A red giant consumes its planets, implodes into a black hole, and gathers eight metal armor plates before the Singularity Core title appears. An original stereo score follows the absorption, collapse, assembly, and title reveal. Pause, sound, and skip controls are available throughout; Escape skips. Switching tabs pauses the picture and sound together. Reduced-motion players receive a still final reveal with an Enter containment button. Reloading a previously unlocked profile does not force a replay.

**Temporary attack practice:** after unlocking the Core, choose **Practice attacks (temporary)** in its menu. Pick any of the 15 protocols to repeat it with 10 HP, a frozen three-second countdown before each repeat, and a galactic healing pack every three completed repeats. Hold arrows to teleport, release to return to center, D pauses, and Escape returns to the attack picker. Practice uses the full fight’s shared attack code, so tuning a pattern changes both modes. Attack practice never unlocks the final laser. Choose **Watch final cutscene** in the same picker to replay the annihilation laser finale immediately; D pauses and Escape returns to the picker. Completed attack survivals contribute to the new attack-survival achievements and Cubie unlocks; practice does not grant full-fight achievements or save scores. The finale replay grants no attack survivals or rewards. The temporary wrapper lives in `singularity_practice.py` and will be removed when requested.

**Secret browser boss — Singularity Core (rough draft):** enter `GRAVITRON` in the arcade’s player-name field to unlock the robotic black hole. The new game card stays unlocked in this browser after reloading or changing your name. Start with 10 HP. A galactic healing pack appears after every third completed attack (3, 6, 9, 12, and 15). Teleport to its glowing cross to recover 1 HP, up to the 10-HP maximum. Packs appear at reachable nodes away from the turtle and expire after nine seconds; pausing freezes their lifetime. Healing never erases damage history. Hold an arrow to teleport immediately to that edge of the containment box; hold two arrows for a corner. Release the arrows to return to the center. D pauses and Escape exits. The Core is invulnerable throughout all 15 survival protocols. After the last one, release and press F (or tap the enabled Laser button) to fire the annihilation laser and win. Scores are saved locally for this draft.

The protocols are Railgun Array, Accretion Sweep, Collapsing Horizons, Target Lock, Event Lattice, Binary Stars, Gravity Guillotine, Photon Rain, Crossfire Engine, Dark Matter Mines, Polarity Inversion, Orbital Saws, Echo Protocol, Lens Fracture, and Total Collapse. Amber outlines warn of attacks; pink hazards deal damage. This is a tougher endurance fight than Pumpkin King, with only 0.42 seconds of damage immunity and healing available after every three attacks. Railgun Array gives 0.72 seconds of warning before each lane fires, 0.4 seconds longer than before; later protocols keep their own warning timings. The Core has a procedural animated accretion disk, mechanical armor, and an original cinematic boss theme: sustained low strings, legato brass, choir-like pads, resonant drums, and spacious reverb in a 48-bar, roughly 2½-minute arrangement at 78 BPM. Accelerating snare rolls and a rising synth lead into a brief silence, then a heavy drop around 0:49 with syncopated sub-bass, a half-time backbeat, and fast string arpeggios. A weightless choir interlude builds into a larger second drop around 1:38, adding high choir responses before dissolving back into low strings. Its theme loops and preserves its position through mute, pause, and hidden tabs. The fight ends with a final laser destruction animation. Timing and patterns live in `singularity_core.py`; artwork lives in `singularity_core_view.py` for later tuning.

Binary Stars and Orbital Saws follow rounded-square orbits that sweep through all four corner teleport nodes, closing the stationary-corner safe spots. A faint guide shows the actual orbit. The two stars/four saws, their sizes, opening warnings, attack durations, and center pulses are preserved. The saws rotate more slowly along the wider route, leaving readable escape windows; both attacks remain survivable without damage by changing nodes. These changes also apply to practice.

Photon Rain emits 10% fewer bullets per second at the same projectile speed. Polarity Inversion cycles 21% faster than its original timing, including its warnings and active pulses. Echo Protocol demonstrates four steps directly on the box: harmless cyan blasts and a green ring mark each safe position. After this 3.44-second preview, the same four moves repeat at the same pace with damaging pink blasts and no safe-position highlights. The full protocol lasts 6.88 seconds. These changes apply to the full boss fight and temporary attack practice.

The final laser starts a 5.4-second ending: the continuous beam enters the black hole, turns its horizon white, and drives an implosion that pulls surrounding stars inward. The Core then explodes, shattering the containment box and its displays before revealing the final score. Aim locks during this sequence. Stereo effects combine an electrical beam, low collapse rumble, an explosive impact, and scattering glass-like debris; they follow the animation through pause, mute, and hidden tabs.

Dying in any turtle game triggers a 1.6-second burst of white pixels and a bit-crushed sound before the result appears. Combat, movement, and score time freeze immediately. This applies to Turtle Dodge, Boss Crush, Pumpkin King, King’s Wrath, Singularity Core, and temporary Core practice. The Python desktop turtle games use the same particle artwork and timing.

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
python3 -m http.server 8770 --bind 127.0.0.1 --directory dist
```

Open **http://localhost:8770** in a modern browser. Use an HTTP server rather than opening `index.html` directly. The first load downloads the pinned Pyodide 0.29.3 runtime from jsDelivr and requires an internet connection. Browser games need no Python installation on the player's machine.

The web interface provides game selection, desktop keyboard input, touch controls, and local high scores. Choose a game, then click a difficulty (or a practice attack in The King’s Wrath) in the play area to start each round. Play again returns to the difficulty choices; resuming a paused game keeps the current round. Selecting a game brings the play area into view, and arcade games resize to fit the available screen height with their controls. Boss fights show your current/max HP and a health bar above the arena, including while paused. Key Rush is the web name for the timed keyboard challenge. Local scores are per browser and device; they do not sync with the Python version. The **Global** tab has separate top-ten rankings for all 24 game/difficulty or practice-mode combinations when the shared leaderboard is connected. Browse any difficulty without starting a round. Completed rounds publish your best score under your nickname; lower scores never replace a record. Global rankings do not change your local achievement profile or profile points. If browser storage is blocked, scores last only for the current visit. Browser audio starts enabled. The first click or key press unlocks a shuffled playlist of twenty-three arcade chiptunes, as required by browser autoplay rules. The original Pixel Promenade is joined by Pocket Comet, Clockwork Mischief, Moonlit Checkpoint, Soda Circuit, Polite Little Ghost, Very Small Hero, Crystal Staircase, Midnight Overdrive, and Home in Eight Bits. The new songs pair playful, offbeat RPG melodies with pulse leads, triangle bass, fast arpeggios, and noise drums; each has its own melody, harmony, tempo, and arrangement. Pixel Parade, Moonlit Circuit, Turbo Tokens, Bubblebyte Bay, and High Score Horizon join the merged playlist. Five more tracks join the mix: **Megalovania — Neon Determination** (168 BPM), **Freedom Motif — Unbound Carousel** (144 BPM), **Gaster’s Theme — Signal in the Static** (108 BPM), **Lantern Leap** (132 BPM), and **Copper Comet** (174 BPM). The first three are custom fan arrangements of Toby Fox’s UNDERTALE/DELTARUNE themes; Lantern Leap and Copper Comet use newly composed motifs. Each develops over 32 bars with a varied reprise. **Sleepy Satellite** adds a relaxed original chiptune at **60 BPM**, with a soft triangle lead, gentle drums, and a 128-second arrangement. **Hyperspeed Hopscotch** adds a driving 212-BPM track, while **Velvet Tokens** brings a mellow triangle-led groove at 99 BPM. Both also appear in the jukebox. Every song plays once before the playlist reshuffles, with a random first song and no consecutive repeats across shuffles. Starting any Pumpkin King difficulty or The King’s Wrath attack crossfades to the looping Halloween boss theme; exiting or finishing the fight returns to the next arcade song. Music pauses with the game or a hidden tab, resumes the same song from the same position, and the Sound toggle mutes both music and effects. Synthesized Pumpkin King attack cues remain louder than the music. Key Rush plays its own original theme, **Keystroke Sprint**, a 48-second, 160-BPM chiptune with a pulse lead, triangle bass, fast arpeggios, and crisp drums. It loops across typing rounds, preserves its position through mute and hidden tabs, and returns to the arcade playlist when the run ends or you exit. No external music downloads or desktop audio player are needed.

Hangman plays **Letter by Letter**, its own original 64-second, 120-BPM theme with a gentle triangle lead, warm bass, arpeggios, and soft drums. It loops while you guess, keeps its position through mute and hidden tabs, and returns to the arcade playlist when you win, lose, or exit.

Turtle Dodge has a separate original theme for each difficulty, becoming progressively more tense through darker harmony, more urgent rhythms, and denser percussion:

| Difficulty | Theme | Character | BPM |
| --- | --- | --- | --- |
| Easy | Shellside Stroll | Bright major-key melody, relaxed rhythm, soft triangle lead | 112 |
| Normal | Falling Forecast | Minor-key suspense and a steady pulse | 132 |
| Hard | Pressure Current | Dark driving melody, trembling pulse lead, and busier drums | 156 |
| Merciless | No Safe Shore | Chromatic and diminished harmonies, relentless bass, and pounding drums | 180 |

Each difficulty's theme loops during play, follows pause where available, preserves its position through mute and hidden tabs, and returns to the arcade playlist on death or exit.

Boss Crush has four original hard-rock battle themes. Each difficulty adds heavier guitar distortion, tighter palm-muted riffs, and denser drums:

| Difficulty | Theme | Character | BPM |
| --- | --- | --- | --- |
| Mean | First Blood Circuit | Crunchy power chords and a steady hard-rock groove | 128 |
| Cruel | Iron Verdict | Sharper muted riffs, thicker distortion, and busier drums | 148 |
| Nightmare | Nightmare Engine | Low chromatic riffs, sixteenth-note chugs, and double-kick patterns | 168 |
| Impossible | Crown of Ruin | The Pumpkin King's opening D-minor motif in the heaviest guitar/bass/drum arrangement | 188 |

Impossible keeps the familiar Pumpkin King hook in a focused rock-band arrangement. Boss themes loop seamlessly during combat, preserve position through pause, mute, and hidden tabs, and return to the arcade playlist after victory, defeat, or exit. The five ROCKNROY songs remain a separate one-shot selection.

The browser also has **214 achievements**. A first visit unlocks **Welcome to Microgame Madness!** automatically. Open the **Achievements** subtab beside Scores to browse requirements, progress, and unlocked medals. New awards immediately play a ding and fill the screen with tier-colored confetti for four seconds, followed by a one-second fade. Notifications stack vertically at the top left. Up to three simultaneous awards appear together; larger batches show two at a time, with the next queued award appearing whenever a card fades or is dismissed. Each card lasts 4.5 seconds, and celebrations start immediately. Muting also mutes the ding; the automatic welcome ding waits for the first browser audio-unlocking interaction. Reduced-motion settings keep the confetti still. **At Least You Tried** awards bronze for dying in Turtle Dodge in less than five seconds, on any difficulty. Bronze medals add **10 profile points**, silver **30**, gold **90**, crystal **270**, diamond **810**, rainbow **2,430**, and Empyrorite **7,290**, once per achievement. Empyrorite is the highest regular tier, above Rainbow. Profile points are separate from game scores. One secret achievement stays fully redacted until its event finishes; its special tier appears only on the revealed card, outside the regular tier legend.

**Ten new achievements:** enter **PIXEL**, **1UP**, or **HIGH SCORE** as your arcade name (case-insensitive) for Pixel Perfect, Extra Life Energy, or Name on the Leaderboard. Gameplay additions reward 5 perfect hard Hangman wins, 5 last-chance Hangman wins, 15 Key Rush rounds in one game, 90 seconds in Turtle Dodge, 50 Boss Crush wins, 50 Pumpkin King wins, and 10 King’s Wrath wins. Existing saved progress counts toward these milestones.

**Determination** is a Crystal achievement worth **270 profile points** for losing **50 minigame rounds in total**. Losses accumulate across all seven minigames and persist across visits and name changes. Each completed loss counts once; wins, unfinished rounds, and temporary Core practice do not count. Loss tracking starts with this update because older profiles did not record losses.

Hangman awards include **Hang in There!** for starting a game, **Good Game** for a win, **You've Got the Hang of It!!** for a hard win, **Word Wizard** for 5 wins, and **Professional Prodigy** for 10 wins. Additional achievements reward perfect guesses, typing rounds, survival times, playing all five original games, and boss victories in specific modes. Wins accumulate across visits; typing and survival milestones require a single run. Existing high scores and earned medals are preserved. Win counts track games completed since achievements were introduced; new cumulative milestones recognize that saved progress.

**Gerson Boom** (rainbow, +2,430) requires surviving 360 seconds in one Turtle Dodge game. **Domination!** (silver, +30) requires beating the Mean boss without taking damage. **Cruel and Unscathed** (silver, +30) and **Flawless Nightmare** (crystal, +270) reward zero-damage wins against the Cruel and Nightmare bosses respectively; healing does not erase damage. **Walking Dictionary** and **Speed of Type** remain gold (+90 each). **King of Suffering** (diamond) requires a Pumpkin King victory in any mode with zero damage taken throughout the fight; healing cannot undo a hit. **Close One** (silver) requires entering a six-pixel proximity zone around a Turtle Dodge block and safely leaving it without collision. **I'm Still Standing!** (crystal) requires 120 seconds in a single Turtle Dodge game. Other crystal and diamond challenges include longer typing runs, 50/100 Hangman wins, perfect guesses, repeated boss victories, 120 seconds on Merciless, and a no-hit Impossible Boss Crush win.

Locked achievement cards are grayscale with dimmer borders and sparkles, except Empyrorite cards, which retain a subdued emerald tint. Unlocking restores full tier colors and shine without changing text readability. Bronze, silver, and gold use thick rounded metallic borders; crystal, diamond, and rainbow use thinner prismatic hexagons. Rainbow medals and their confetti use a full spectrum of colors. Visible cards gently shine and sparkle, and reduced-motion preferences disable the animation.

Secret achievements include **DINGDONG** (crystal, “WHO YOU ARE.”) for triggering the name effect and **Awwwwww!** (gold) for clicking, tapping, or keyboard-activating Cubie. **Cubie’s Best Friend** (crystal, +270) rewards petting Cubie 100 times. Pet counts carry across visits; clicking, tapping, and keyboard activation each count as one pet. Entering Cubie’s name does not count as petting. Cubie blushes and squeaks when sound is enabled. Enter **CUBIE** for a green greeting and **On a First-Name Basis** (gold), **BOO** for a purple scare and **Boo to You Too!** (gold), or **STARLIGHT** for a starfield and **Written in the Stars** (crystal). Names ignore case and surrounding spaces. Each effect lasts four seconds and pauses music, then restores your sound/pause settings; awards only count once. Cubie’s sparkles and orbit animate, with reduced-motion support. **Down to the Wire** (gold) rewards a Hangman win with exactly one wrong guess remaining.

Enter **ROCKNROY** to play one randomly chosen original rock song and unlock **Game Tester** (rainbow, +2,430 profile points) once. The five songs are **Afterburn**, **Neon Overdrive**, **Static Revolt**, **Midnight Circuit**, and **Victory Voltage**. Each has its own tempo, guitar riffs, bass, drums, and a complete ending, running about 45–70 seconds. The song plays once, then the usual arcade music returns (or the Pumpkin King theme if a boss fight is still running). Mute, game pause, and hidden tabs pause the song and preserve its position. Re-enter the name after changing it to choose another song; achievements never award twice. Songs are synthesized locally with no external audio downloads.

**Untouchable Streak** (crystal, +270) rewards five consecutive Boss Crush wins without damage, across any difficulties. Damage, a loss, leaving an unfinished fight, or reloading during a fight resets the streak; completed streak progress survives reloads and other games. **Fit for a King** (crystal, +270) rewards a Pumpkin King victory at full HP in any mode, including health restored by healing. Collecting a healing item flashes the screen green, even at full HP.

Boss Crush has separate full-HP awards for **Mean and Pristine** (Mean, silver), **Cruel and Complete** (Cruel, silver), **Healthy Awakening** (Nightmare, gold), and **Impossible Vitality** (Impossible, crystal). A victory at maximum HP qualifies whether or not healing was used. **Untouchable Champion** remains the existing Diamond Impossible no-damage award; taking damage and healing back to full HP never qualifies for it.

Rainbow achievements each award **2,430 points**:

| Achievement | Requirement |
| --- | --- |
| Gerson Boom | Survive 360 seconds in one Turtle Dodge game. |
| Game Tester | Enter ROCKNROY as the player name. |
| Rainbow Lexicon | Win 250 Hangman games. |
| Spectrum Speed | Complete 75 rounds in one Key Rush game. |
| Beyond Mercy | Survive 240 seconds in one Merciless game. |
| Unbreakable Spectrum | Win 15 consecutive Boss Crush fights without damage. |
| Sovereign of Suffering | Win 5 Pumpkin King fights without damage, in any mode. |
| My Fingers Hurt | Survive all 15 Core protocols and destroy Singularity Core with the final laser. |
| Callus Protocol | Defeat Singularity Core 3 times. |
| One Finger Left | Destroy Singularity Core with exactly 1 HP remaining. |
| Gravity Is Optional | Defeat Singularity Core 10 times. |
| Resident of the Throne Room | Win 25 King’s Wrath fights in any modes. |
| Shuffled Survivor | Survive 21 attacks in one Random Order fight. |
| Chaos, Perfected | Survive all seven Random Order attacks, then win without damage throughout the fight. |

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


## New-feature achievements and Empyrorite

Forty-two additional achievements cover Singularity Core, The King’s Wrath, and new Merciless and Boss Crush mastery challenges. Singularity Core has an unlock reward, a first-fight reward, one milestone for each of its 15 protocols, repeat victories, a 1-HP victory, and clean survival challenges. **My Fingers Hurt** is the Rainbow (+2,430) reward for completing the final laser victory. Surviving the protocols alone does not count as a win.

The King’s Wrath rewards winning each of its eight modes, completing all seven individual practice fights, 5/25 victories, a no-damage victory, one/three complete Random Order sets, and 25 successful magenta-finger counters across fights. Random Order set milestones must happen in one run. Practice victories remain separate from Pumpkin King achievements.

**Empyrorite** is a celestial green crystal tier worth **7,290 profile points per achievement**. Its cards have an emerald interior, a brighter faceted frame, a crystal insignia, starry highlights, and matching green crystal celebrations. Its tint remains visible while locked; earned cards gain a stronger emerald glow. Reduced-motion settings stop the shine and sparkle animations.

| Empyrorite achievement | Requirement |
| --- | --- |
| Hands of Empyrorite | Destroy Singularity Core without taking any damage throughout the fight. |
| Beyond the Last Mercy | Survive 300 seconds in one Merciless Turtle Dodge game. |
| Sovereign of the Arena | Win 20 consecutive undamaged Boss Crush fights on Cruel, Nightmare, or Impossible. Mean fights neither advance nor reset this streak. Damage, losses, and abandoned qualifying fights reset it. |

**Chaos, Perfected** is now Rainbow (+2,430), with its existing requirement and unlock date preserved. Its profile points automatically update to the current tier without awarding the badge again. The three Empyrorite rewards each give +7,290 points.

New progress comes from actual completed attacks, successful counters, and finishing victories. Damage history, rather than restored HP, decides no-damage awards. Repeated frames and reloading cannot duplicate an award. Existing medals, dates, scores, and high scores stay intact. Saved GRAVITRON unlocks receive Access Granted on the next visit; older wins without recorded outcome evidence are not inferred from high scores.

## Connect the global leaderboards

The global leaderboard uses Supabase alongside the existing static website, so players keep the same website address and browser profile. Until a backend is configured, the Global tab reports that rankings are not connected; local scores, achievements, music, and all games still work.

1. Create or connect a Supabase project and apply the SQL files in `supabase/migrations/` in filename order (or run each once in the SQL Editor).
2. Enable **Allow anonymous sign-ins** in that project's Authentication settings. Guests who opt into leaderboard sharing get an anonymous identity when submitting scores; browsing rankings does not create an account.
3. Put the project's URL and publishable key in the root `leaderboard-config.json` fields `url` and `key`, then commit that file. Local builds and GitHub Pages both read this shared configuration. These are browser-public settings; use a publishable key (or legacy `anon` key), never a secret or `service_role` key. The build validates both sources before replacing `dist/`.
   To override the shared configuration, set **both** `SUPABASE_URL` and `SUPABASE_PUBLISHABLE_KEY` before running `npm run build`, or set both as GitHub repository **Actions variables**. Empty Actions variables use the shared file; a partial override is rejected so credentials from different projects cannot be mixed.
4. Build and publish the site as usual. Only the public connection settings enter `dist/leaderboard-config.json`; the SQL migration and test tooling stay outside the published package.

Empty connection settings mean the backend has not been connected; the build prints this explicitly. GitHub Pages hosts the game files but does not supply a leaderboard database. Once connected, local browser builds and the public website share rankings, while each browser origin keeps its own guest identity. Verify the Global tab can load rankings and that a newly completed round appears after Refresh.

Every identity has one record per difficulty, even after changing its nickname. Identical nicknames from different identities are separate players. Rankings show ten scores per page, with earlier records breaking ties. Authentication tokens and private account identifiers are never published; an optional public profile has its own opaque identifier. Guest identities are specific to the browser origin, while signed-in accounts can continue across devices. Imported personal bests do not become historical runs or global scores; eligible completed rounds supply those records.

Guest submissions retain the highest pending score for each difficulty in a separate browser-storage key. Signed-in accounts retain individual semantic operations in their durable queue. Reopening the page, reconnecting, or requesting sync retries work under the same identity. If storage is unavailable, unsynced work lasts only for the current visit. An expired session refreshes its existing identity; a failed refresh does not silently replace the player.

These are casual rankings from browser-computed scores. The database validates game/difficulty pairs, score ranges, ownership, and monotonic bests, but does not replay runs to prove they were played honestly. Competitive anti-cheat would require server-verified gameplay. Protect anonymous signup with the rate limits and abuse controls appropriate to your Supabase deployment.

For optional accounts, deploy the additional migration and account function using the [account backend runbook](accounts-backend.md) before enabling cloud sign-in. The browser keeps guest/account profiles and pending changes in IndexedDB, preserving the original local save as a migration backup. Account players use the separate arcade-code input for secrets so changing a display name does not activate them. See [implementation status](accounts-implementation-status.md) for rollout requirements.

The development-only PGlite dependency runs the actual migration in PostgreSQL during `npm test`, checking access controls, player isolation, score validation, and every mode. It is never shipped to players.

## Design proposals

[Optional accounts and progression](accounts-and-progression-design.md) is a draft for design review covering guest play, cloud saves, history, settings, migration, Cash, and expanded leaderboards. It includes review decisions and acceptance criteria. The [implementation plan](accounts-and-progression-plan.md) uses explicit planning assumptions pending design review.

## Maintain both versions

Change shared rules once, then test and rebuild. **Do not edit `dist/`**: it is generated from the canonical source files.

| Files | Responsibility |
| --- | --- |
| `hangman_model.py` | Hangman words, difficulty, guesses, win/loss, scoring |
| `keyboard_model.py` | Typing sequences, progression, deadlines, penalties |
| `dodge_model.py` | Turtle movement, blocks, collisions, scoring |
| `boss_crush.py` | Boss combat, attacks, healing, difficulty |
| `pumpkin_king.py` | Phase 2 timing, attacks, counters, collision rules |
| `kings_wrath.py` | Immediate attack selection and repeating Pumpkin King practice patterns |
| `singularity_core.py` | Secret boss teleport rules, 15 survival protocols, damage, and locked laser finisher |
| `singularity_core_view.py` | Procedural Core machinery, containment grid, warnings, and laser artwork |
| `singularity_practice.py` | Temporary picker wrapper that repeats any shared Core attack |
| `geomayhem.py` | Campaign start validation, combat, modifiers, relics, rerolls, workshop effects, XP and 20-arena/20-wave progression |
| `web/geomayhem-progress.js` | Per-profile browser campaign saves, sequential arena/starter unlocks, idempotent shard rewards and permanent workshop purchases |
| `geomayhem_weapons.py` | 44 weapon definitions, eight handheld firing patterns, 12 item companions and three-/five-star evolution traits |
| `geomayhem_view.py` | Themed environments, warning zones, readable combat layers, movement-facing Cubie and weapon evolution art |
| `geomayhem_arenas.py` | Ten background designs, distinct delayed arena/boss hazards and hazard collision geometry |
| `pumpkin_king_view.py` | Pumpkin King procedural artwork shared by both renderers |
| `arcade_effects.py` | Shared turtle pixel explosion and 1.6-second death timing |
| `hangman.py`, `keyboard_challenge.py`, `turtle_dodge.py` | Desktop/terminal input and presentation |
| `scores.py` | Desktop score persistence |
| `web/bridge.py` | Browser session adapter and Canvas drawing commands |
| `web/leaderboards.js`, `supabase/migrations/` | Shared rankings client, guest identity, retry queue, and database access rules |
| `web/music.js` | Original chiptune and rock scores, synthesis, shuffled playback, and music transitions |
| `web/effects.js` | Bit-crushed death sound, cinematic stereo effects, and playback synchronized to animation |
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
npm test
npx playwright install chromium
npm run test:browser
```

`npm test` builds the browser package explicitly, then runs unit and integration tests together. For focused runs, use `npm run test:unit` (no build required) or `npm run test:integration` (builds first). `npm run test:browser` also builds before starting Playwright. Python packaging tests use temporary output directories and never overwrite your local `dist/`.

The JavaScript tests check achievement thresholds, persistence, and duplicate prevention, and run the packaged Python modules in the actual Pyodide WebAssembly runtime. Playwright exercises the interface in desktop and mobile Chromium, including each game, scores across reloads, pause controls, layout width, and loading errors. Browser tests serve the exact pinned Pyodide npm distribution locally instead of depending on CDN uptime. CI also installs Chromium's system dependencies.

Browser specs are grouped by feature in `web/tests/`. Shared setup lives in `web/tests/fixtures/game.cjs`: it installs the pinned local runtime before navigation. Install test-specific routes before calling `openGame(page)`; use explicit reloads when testing persistence. Each test retains a fresh browser context. Local browser runs use parallel workers; use `--workers=1` when debugging. Runtime startup retains a 30-second allowance, while ordinary assertions fail after 10 seconds. CI records traces on the first retry and merges all shard results into one downloadable `browser-report`.

Pull requests run Python/JavaScript checks alongside a browser build and four browser shards. The shards download the same build artifact and run `npm run test:browser:built` without rebuilding it. Browser fixtures mock leaderboard configuration to keep production services out of the suite. Superseded checks for the same workflow/ref are cancelled. The publish workflow reruns checks on `main` and requires every check to pass before deployment.

## GitHub Pages

Play the browser version at **https://mattygpt.github.io/Microgame-Madness/**.

The repository and website are public. GitHub Pages publishes through GitHub Actions, with the repository variable `PAGES_ENABLED` set to `true`.

Each push to `main` builds a browser artifact, runs the Python, WebAssembly, and browser checks, then deploys that tested artifact without rebuilding. The artifact includes the source revision and preserves `.nojekyll`. Only the publishing job is serialized; before publishing it verifies that the tested revision is still the head of `main`. Manual publishing is also limited to `main`. Shared rule changes therefore reach both the Python source and the published browser game. Local score files and the desktop runtime are excluded from the deployment package.

To republish the current `main` branch manually:

```sh
gh workflow run pages.yml --repo MattyGPT/Microgame-Madness
```

Deployment progress is available in the repository's **Actions → Publish browser game** workflow. Setting `PAGES_ENABLED` to `false` skips future deployments while still running checks; it does not remove an already published site.

## Additional feature notes

The Pumpkin King has a rounded inverted-triangle orange head, an animated crown made of red-orange fire with yellow cores, tall side flames, a shorter middle, and rising embers, long red-rimmed eyes, and a curved carved grin. Green, purple, and magenta spectral fire ripples from his shoulders and the tops of his arms. The original rainbow arm rims surround dark galaxy interiors with twinkling white stars and drifting comets edged in cyan, purple, and pink. Three pale ribs unfold sideways beneath each arm, and curved red claws emerge through neat knuckle slits. A green contour wobbles around his head and limbs. His face tracks the player, blinks, flinches when hit, opens for roars and mouth fire, and laughs during hauntings. This renderer is shared by the full fight, The King’s Wrath, and the Python desktop version. Blue and orange eye cues remain readable and combat rules are unchanged.

Every Boss Crush boss has rounded corners, a darker border, and an animated face that reacts to hits, attacks, lunges, low health, and defeating the player. The Impossible boss keeps the Pumpkin King’s pre-transformation carved face on a white body; only its eyes flash yellow when struck. Boss Crush artwork is shared by the browser and Python desktop versions.

**Color Memory** gives you 0.2 seconds at the start of every blue or orange phase before its movement rule can hurt you, in every Pumpkin King difficulty and The King’s Wrath. Bullets during this attack and its color breaks now spawn every 0.6 seconds, a 25% lower firing rate.

The Pumpkin King’s seventh attack, **Haunted Quadrants**, opens with a two-second positioning break in both the full fight and The King’s Wrath, including every practice repeat. In The King’s Wrath, the three-second countdown comes first, stacking with this break for five seconds before the active scares. Twenty animated purple-cyan faces grin, open their jagged mouths, and laugh while a countdown previews the top-left quadrant as the first danger zone. You can move during this break; the faces do not deal damage. The active pattern then divides the arena with a plus sign for exactly five seconds. Eighteen scares appear about every 0.278 seconds, a 25% lower rate than before, in clockwise order: top left, top right, bottom right, bottom left. Each slot starts with about 0.111 seconds of flashing red/yellow exclamation marks, then three spooky faces and a short laugh. The active section deals 0.5 HP once per appearance, even if you enter it after the faces appear. The dividing lines and warnings do not deal damage; head/arm contact remains lethal. Healing restores HP normally but never erases the half-point damage history.

Key Rush includes a touch keyboard with Shift and number/symbol modes on touchscreens, so the device keyboard does not cover the sequence. Optional device-keyboard input supports composition. Game surfaces suppress text selection and mobile long-press menus; editable fields keep normal caret behavior. Existing shop purchases remain owned after the tenfold price increase.

Premium Custom artwork: Cosmic Whale has a rotating spiral galaxy, twinkling stars, swimming fins and tail, and a glowing spout. Empyrorite Cubie has layered crystal facets, floating shards, a rotating halo and moving sheen; Arena Sovereign has gilded armor, animated banners and a revolving aura. Peacock's individually detailed feathers sit behind the body. Snowglobe has a centered pedestal and clipped falling snow. Aurora, Jellyfish and Disco also have ambient animation. All these effects stop under reduced-motion preferences, and Cubie's face remains visible.

**TON 618** unlocks with Hands of Empyrorite: defeat Singularity Core without taking damage. This Gravity-style Custom has red eyes, a white accretion ring edged in red, swirling crimson gas, and four meteors on varied orbits. Existing flawless victories count.

**Phantom King Cubie** is a Rainbow Custom unlocked by a single no-hit Pumpkin King victory in any mode. Yellow fire glows in their eyes, green and purple flames surround the pumpkin body, and ghosts drift along independent orbits. Previously earned King of Suffering medals unlock it immediately.

Enter **CODEXISTHEBEST** as your arcade name to earn the rainbow **Code to the Rainbow** achievement and unlock **Codex Cubie**: a gray monitor body, small rectangular stand, lime-green screen with a terminal-style Codex mark in its top-left corner, and purple crystal wings.

**Hacker Cubie** is an Empyrorite shop Custom costing **4,000 Cubie Cash**. It keeps Codex Cubie’s monitor and crystal wings, with a rainbow fracture, black corrupted right screen, white X eye and jagged teeth, and an oversized animated claw outlined in red. Glitch motion and screen scanning respect reduced-motion preferences.

**Boss Cubie** unlocks with Boss Rush Royalty at ten Boss Crush wins on any difficulty. It is purple with black angry eyebrows that Cubie drew on with dry erase marker; existing wins count.

**Five achievement Empyrorite Customs:** Phantom Emperor requires 10 no-hit Pumpkin King wins in any mode; Living Grimoire requires 100 perfect Hangman wins; Tempest Seraph requires 100 rounds in one Key Rush game; Celestial Forge requires 100 Boss Crush wins; Abyssal Leviathan requires 420 seconds in one Merciless Turtle Dodge game. Each has layered animated artwork, unique flavor text, and reduced-motion support. Existing saved progress counts toward the new achievements.

**Arcade audio additions:** Starburst Circuit (255 BPM), Slow Orbit (55 BPM), and Snowfall at the Arcade (99 BPM, Christmas bells) join the arcade shuffle and jukebox. Audible Snowfall playback unlocks the Gold Santa Cubie and A Very Cubie Christmas achievement; muted selection does not count. After the GRAVITRON origin film closes, After the Event Horizon plays as a louder looping cinematic theme until another game/song is chosen or the page reloads. It is also available in the jukebox. Boss Crush, Pumpkin King, King's Wrath, and both Core modes play a single defeat laugh, respecting sound controls.

GRAVITRON618 is retired and cannot grant new access, including from a saved arcade name. Previously restored code owners keep their Custom. A flawless Singularity Core victory still awards its achievement and unlocks TON 618 normally.

The five new Empyrorites have additional animated detailing: Phantom Emperor spectral corona, Tempest Seraph feather tracery, Celestial Forge molten seams and counter-rotating gears, Abyssal Leviathan moving underwater light, and drifting motes. Living Grimoire is a closed, clasped spellbook with a bound spine, exposed page edges, enchanted cover, and swaying ribbon; its cover carries Cubie’s face.

**Forever Friend Cubie:** pet Cubie 1,000 times to earn **A Thousand Little Hugs** and unlock this Empyrorite Custom, with a heart crown, mint wings, and gold trim. Previously saved pets count, including profiles already at 1,000 or more.

The GRAVITRON entrance film uses the audio playback clock to keep its animation synchronized through slow frames and audio interruptions. Planet absorption, the collapse shockwave, armor locks, and the title share sound/animation cue times. Muted playback keeps advancing; pause and tab hiding preserve the current position.

**Space Junk Cubie:** 1,230 Cash in the shop, with floating blue-edged metal shards and Cubie’s grin. **Singularity Cubie:** a mechanical black hole with segmented armor, a violet plasma ring, and Cubie’s smile; unlocks with **One Finger Left** by defeating Singularity Core with exactly 1 HP remaining. Existing achievement holders unlock it automatically.

**Satellite Cubie (Silver):** start a Singularity Core fight to earn **Into the Event Horizon** and unlock a silver satellite with blue solar panels and a swaying antenna. Existing achievement holders unlock it automatically.

**Chocolate Cubie (Silver):** earn **Sweet Recovery** by collecting 20 healing items in total across Boss Crush, Pumpkin King, The King’s Wrath, Singularity Core, and Core attack practice. Pickups count immediately and persist across fights and reloads. The chocolate-bar body has a peeled foil wrapper and a creamy smile. Space Junk Cubie’s body fragments now bob, rotate, and spread apart independently, with reduced-motion support.

**Collection search:** the Shop, achievements, and Cubie collection each have a search bar. Results update as you type, ignore capitalization and extra spaces, and match the words shown on cards. Search works with locked/unlocked filters and both shop categories; redacted achievement details remain hidden. Clear the search to restore the current view.

**Crabby Cubie:** a deep-blue Diamond Custom for **1,020 Cubie Cash**, with six legs behind its body and two oversized pincers that sway and snap with red tips. Reduced motion keeps the claws still.

**Four new achievement Customs:** **Merciful Cubie** (Rainbow) is pink with happy eyes: survive 300 seconds in a single Pumpkin King fight without firing any shots. **Speedrunner Cubie** (Diamond) requires a Pumpkin King win in **70 seconds or less**, including the introduction and excluding pauses. An input-only continuous-fire dodge benchmark wins around 67.1 seconds at 30/60/120 FPS; the cutoff gives roughly three seconds of margin. Run `python3 scripts/benchmark_pumpkin_speedrun.py` to reproduce it. **Hand Cubie** (Rainbow) is a golden five-fingered hand: counter 100 magenta fingers across Pumpkin King and King's Wrath; saved Wrath counters count. **Prismatic Cubie** (Rainbow) requires three achievements in each of Crystal, Diamond, and Rainbow, including existing collection medals but excluding its own medal. Its clear beveled body and clear eyes have diamond-like facets with diagonal rainbow sweeps reflected inside; reduced motion keeps a static shine.

**Attack Cubie artwork:** all 22 attack-earned Customs now share detailed shaded materials and crisp edge highlights, with individual effects including charged rails, glowing mines, ghost wisps, polished blades, and faceted crystals. Lattice retains its illuminated grid. Prism keeps its one-second color swaps, Counter its animated lightning, and Chaos its fast-moving, color-cycling accessories. Reduced motion stops the effects.

Mobile arcade games use a drag joystick with eight-direction movement and a center dead zone. Fire, Counter, and Laser remain separate buttons so players can move and act with two fingers. Releasing or canceling a touch, pausing, or leaving a round resets movement. Desktop arrow-key controls remain available.

**Matrix Cubie:** a Rainbow shop Custom costing **2,225 Cubie Cash**, with a black body, white eyes, and independently falling columns of green code. Reduced motion keeps the symbols still.

**Creeper, Cybercubie, and Tetris:** Creeper Cubie (Silver) unlocks after 10 deaths across the action games, including Core practice; word-game losses and abandoning a round do not count. Cybercubie (Crystal) costs **900 Cubie Cash** and wears a cute neon cyberpunk mask. Tetris Cubie (Gold) is a yellow 2×2 square piece, unlocked by 50 Turtle Dodge deaths to the O-shaped block across all four difficulties. The square shape counts even when a difficulty recolors it; Merciless edge deaths and other block shapes do not count. These death counters begin with this update and persist across visits; old saves did not record deaths separately from losses or identify the fatal block.

**Puzzle Cube Cubie:** a Rainbow shop Custom for **2,000 Cubie Cash**. Its scrambled six-color cube has independently turning 3D layers in a seamless, endlessly unsolved loop. Reduced motion keeps the scrambled cube still.

**Mobile fight zoom:** pinch zoom magnifies the existing fight canvas without shrinking it or forcing the page to scroll back to the arena. The shared layout handles Turtle Dodge, Boss Crush, Pumpkin King, King's Wrath, Singularity Core, and Core practice; genuine viewport changes still resize the arena.


## Impossible Turtle Dodge

Impossible uses a 420×340 arena (Merciless is 440×360), white blocks and deadly white borders. Blocks are 25% smaller with matching hitboxes, have a base fall speed 10% faster than Merciless at the same elapsed time, and sway 1.5 times as far. Pausing is disabled. Local scores and global leaderboard records use `dodge:impossible`; Cash conversion uses a 6× difficulty multiplier. It shares Merciless's music.

Survive in a **single run** to earn these medals and Customs:

| Seconds | Achievement | Tier | Cubie |
|---:|---|---|---|
| 15 | Into the Whiteout | Silver | — |
| 30 | White-Knuckle Dodge | Gold | Whiteout Cubie |
| 60 | Ride the Slipstream | Diamond | Slipstream Cubie |
| 120 | Absolute Zero Fear | Rainbow | Absolute Zero Cubie |
| 180 | Beyond Impossible | Empyrorite | White Dwarf Cubie |

Existing general Turtle Dodge milestones, near misses, and O-block death progress also work in Impossible. Merciless records do not grant Impossible rewards. Desktop users can select `dodge_impossible`; the existing `impossible` command-line argument continues to launch Boss Crush. Before enabling the new global leaderboard in production, apply `supabase/migrations/20261108000000_dodge_impossible.sql`.


**Chaos Jackpot Cubie slots:** the three reels independently choose among seven, star, cherry, diamond, and bell, then stop one after another and hold the result. Visible previews also spin. Landing **777** while Chaos Jackpot Cubie is equipped and visible earns the one-time Rainbow achievement **Lucky Sevens!**. Hidden or offscreen reels pause and discard unfinished spins; changing equipment starts a fresh spin. Reduced motion swaps the symbols at their stopping points without scrolling. These cosmetic spins do not cost or award Cubie Cash.


## Geomayhem achievements and Cubies

Geomayhem has 28 achievements (four per tier) and 16 achievement-earned Customs (four bronze and two per remaining tier). Kills and cleared waves accumulate across expeditions. Repeated frames and final results do not count twice. Run-specific milestones use the best single expedition; abandoned runs keep progress already earned but never grant victories. Victory requires all 20 waves. The flawless final-arena reward checks cumulative damage, so healing cannot restore eligibility.

| Tier | Cubie | Requirement |
|---|---|---|
| Bronze | Expedition Scout | Start an expedition |
| Bronze | Polygon Rookie | Defeat 10 shapes total |
| Bronze | Wave Guard | Clear your first wave |
| Bronze | Corner Collector | Defeat 25 shapes total |
| Silver | Circuit Runner | Clear 5 waves in one run |
| Silver | Spark Apprentice | Evolve a weapon to 3 stars |
| Gold | Arsenal | Carry four weapons |
| Gold | Arena Victor | Win an expedition |
| Crystal | Relic Keeper | Carry three relics |
| Crystal | Nova Engineer | Evolve a weapon to 5 stars |
| Diamond | Rift Warden | Clear arena 5 or higher |
| Diamond | Prism Hunter | Defeat 500 shapes total |
| Rainbow | Star Voyager | Clear arena 8 or higher |
| Rainbow | Orbit Conductor | Carry three 5-star weapons |
| Empyrorite | Mayhem Sovereign | Clear arena 10 |
| Empyrorite | Zero Point Seraph | Clear arena 10 without taking damage |

Other medals cover 100/250/2,000 total kills, rank 5, 50/200 total cleared waves, 150 kills in one run, 3/10/50 victories, 20,000 points in one run, and four simultaneous 5-star weapons.

Artwork scales with tier: Bronze uses simple clothing and base Cubie motion; Silver adds shaded surfaces and subtle light pulses; Gold adds metallic equipment and ornaments; Crystal adds faceted gems, aura, sparks, and moving accessories; Diamond adds portals or wings and sweeping highlights; Rainbow adds multicolor orbits; Empyrorite adds elaborate crowns or crystal wings, layered halos, and luminous ornaments. Reduced-motion preferences stop the added animation.

Achievement progress and unlocked Cubies persist through the standard profile/account system, with compact validated run evidence for syncing. The existing local Geomayhem campaign, shard economy, workshop, and arena unlocks remain separate. Geomayhem runs do not grant Cubie Cash or enter the arcade leaderboard. Detailed achievement counters begin with this update; older campaign saves did not record enough evidence to reconstruct past combat or flawless runs.
