# Microgame Madness

A Python game collection with a terminal menu, personal high scores, and Turtle graphics arcade modes.

## Games

- **Hangman:** guess words on easy, medium, or hard difficulty.
- **Timed Keyboard Challenge:** type increasingly challenging sequences before time runs out.
- **Turtle Dodge:** avoid falling blocks across four difficulty levels.
- **Boss Crush:** dodge projectile patterns and shoot the boss.
- **The Pumpkin King:** an Impossible Phase 2 boss battle with transformations, six attacks, and a counter move.

## Run

Clone the repository and start the menu with Python 3:

```sh
git clone https://github.com/MattyGPT/Microgame-Madness.git
cd Microgame-Madness
python3 hangman.py
```

The game has no required third-party Python packages. Install `colorama` in your Python environment if you want colored terminal output.

The timed keyboard challenge requires an interactive Linux or macOS terminal. The graphical modes require a desktop session and Python's Tkinter/Tcl/Tk support. If Tkinter is missing, install the appropriate Tk package for your operating system and Python installation. The local `.runtime/` directory, when present, supplies a machine-specific Tcl/Tk runtime and is not included in this repository.

Pumpkin King audio uses `paplay` when available; otherwise the game runs without those sounds.

## Controls

- **Hangman:** enter a letter, or type `quit` to return to the menu.
- **Keyboard challenge:** type the displayed sequence; press Escape to quit.
- **Graphical games:** use the arrow keys to move, Space to start, and Escape to return to the menu.
- **Boss Crush:** press F to shoot.
- **Pumpkin King:** press C to counter.

High scores are saved alongside the game in local JSON files. Each player's best score is retained. Score files are excluded from Git.

## Tests

Run the existing unit tests from the project directory:

```sh
python3 -m unittest discover -v
```
