"use strict";

// Original scores. MIDI pitches, with 0 representing a rest.
// Pulse lead + triangle bass + arpeggio + noise drums evoke a small chip synth.
const ArcadeMusic = (() => {
  const semitones = { C: 0, D: 2, E: 4, F: 5, G: 7, A: 9, B: 11 };
  const intervals = { "": [0, 4, 7], m: [0, 3, 7], "7": [0, 4, 7, 10],
    maj7: [0, 4, 7, 11], m7: [0, 3, 7, 10], dim: [0, 3, 6], sus2: [0, 2, 7] };
  function note(value) {
    if (value === "-") return 0;
    const [, letter, accidental, octave] = value.match(/^([A-G])([b#]?)(\d)$/);
    return (Number(octave) + 1) * 12 + semitones[letter] + (accidental === "#" ? 1 : accidental === "b" ? -1 : 0);
  }
  function song(title, bpm, progression, bars, options = {}) {
    const harmony = progression.split(" ").map(symbol => {
      const [, letter, accidental, quality] = symbol.match(/^([A-G])([b#]?)(maj7|m7|dim|sus2|m|7)?$/);
      return { root: ((options.bassOctave ?? 2) + 1) * 12 + semitones[letter]
        + (accidental === "#" ? 1 : accidental === "b" ? -1 : 0), chord: intervals[quality || ""] };
    });
    const melody = bars.map(bar => bar.split(" ").map(note));
    // A second chorus adds an answering voice and lifts the middle phrases.
    const reprise = melody.map((bar, index) => bar.map(pitch => pitch && index >= 8 && index < 12 ? pitch + 12 : pitch));
    return { title, bpm, ...options, roots: [...harmony, ...harmony].map(bar => bar.root),
      chords: [...harmony, ...harmony].map(bar => bar.chord), melody: [...melody, ...reprise] };
  }
  const scores = {
    arcade: {
      title: "Pixel Promenade",
      bpm: 128,
      roots: [48, 45, 53, 55, 48, 45, 53, 55, 48, 52, 53, 55, 45, 53, 55, 48],
      chords: [[0, 4, 7], [0, 3, 7], [0, 4, 7], [0, 4, 7],
        [0, 4, 7], [0, 3, 7], [0, 4, 7], [0, 4, 7],
        [0, 4, 7], [0, 3, 7], [0, 4, 7], [0, 4, 7],
        [0, 3, 7], [0, 4, 7], [0, 4, 7], [0, 4, 7]],
      melody: [
        [72, 0, 76, 79, 76, 74, 72, 0], [69, 72, 76, 0, 79, 76, 72, 0],
        [77, 0, 76, 74, 72, 74, 77, 0], [74, 79, 0, 81, 79, 77, 74, 71],
        [72, 76, 79, 0, 84, 79, 76, 74], [72, 69, 0, 72, 76, 79, 81, 0],
        [81, 79, 77, 0, 76, 74, 72, 69], [71, 74, 79, 77, 74, 71, 72, 0],
        [84, 0, 79, 76, 79, 81, 79, 0], [83, 79, 76, 0, 74, 76, 79, 0],
        [81, 0, 77, 72, 74, 77, 81, 79], [79, 74, 71, 0, 74, 77, 79, 83],
        [84, 81, 79, 76, 72, 0, 76, 79], [81, 79, 77, 74, 72, 0, 74, 77],
        [79, 0, 77, 74, 71, 74, 79, 0], [76, 74, 72, 0, 67, 71, 72, 0],
      ],
    },
    comet: song("Pocket Comet", 146, "Am F C G Am F Dm E Am Em F C Dm Am E Am", [
      "E5 - A5 B5 C6 B5 A5 E5", "F5 A5 C6 - A5 G5 F5 E5",
      "G5 - E5 G5 C6 B5 G5 E5", "D5 G5 B5 A5 G5 - D5 E5",
      "A5 E5 A5 C6 B5 A5 E5 -", "C6 A5 G5 E5 F5 - A5 C6",
      "D6 C6 A5 F5 E5 F5 A5 -", "B5 G#5 E5 B4 D5 E5 G#5 B5",
      "C6 - B5 A5 E5 G5 A5 -", "B5 G5 E5 - G5 B5 A5 G5",
      "A5 C6 A5 F5 C5 F5 G5 A5", "G5 E5 C5 - E5 G5 C6 B5",
      "A5 F5 D5 E5 F5 A5 D6 C6", "B5 A5 E5 C5 E5 - A5 E5",
      "G#5 B5 D6 B5 G#5 E5 D5 B4", "C5 E5 A5 - B5 G#5 A5 -",
    ], { groove: "drive", pulse: "narrow" }),
    clockwork: song("Clockwork Mischief", 164, "Cm Ab Fm G Cm Eb Ab G Cm Bb Ab Eb Fm Cm G Cm", [
      "G5 C5 Eb5 G5 - F#5 G5 Eb5", "C6 - Ab5 G5 Eb5 C5 Eb5 G5",
      "Ab5 F5 C5 F5 G5 Ab5 C6 -", "B5 G5 D5 - F5 Eb5 D5 B4",
      "C5 - G5 C6 Bb5 G5 Eb5 D5", "Eb5 G5 Bb5 G5 F5 Eb5 D5 -",
      "C5 Eb5 Ab5 C6 B5 C6 Ab5 G5", "B5 D6 B5 G5 F5 D5 B4 -",
      "Eb6 D6 C6 G5 Eb5 - C5 G5", "F5 Bb5 D6 F6 D6 C6 Bb5 F5",
      "Eb6 C6 Ab5 G5 Ab5 - C6 Eb6", "D6 Bb5 G5 Eb5 F5 G5 Bb5 -",
      "C6 Ab5 F5 C5 F5 G5 Ab5 C6", "G5 Eb5 C5 - D5 Eb5 G5 C6",
      "B5 G5 F5 D5 B4 D5 F5 G5", "C6 G5 Eb5 C5 - D5 C5 -",
    ], { groove: "skip", swing: .16, pulse: "narrow" }),
    moonlit: song("Moonlit Checkpoint", 94, "Fmaj7 C Am G Fmaj7 Em Dm G Am Em F C Dm Am G C", [
      "A5 - G5 E5 - C5 E5 -", "G5 - E5 - D5 E5 C5 -",
      "E5 A5 - B5 C6 - B5 A5", "G5 D5 - E5 G5 - A5 G5",
      "F5 A5 C6 - B5 A5 G5 E5", "E5 G5 B5 - A5 G5 E5 -",
      "F5 - E5 D5 A4 D5 F5 -", "G5 - A5 B5 D6 B5 G5 -",
      "C6 - B5 A5 G5 E5 A5 -", "B5 - G5 E5 F#5 G5 B5 -",
      "A5 G5 E5 F5 - A5 C6 -", "G5 E5 D5 C5 - E5 G5 -",
      "F5 A5 D6 C6 A5 F5 E5 D5", "E5 - A5 C6 B5 A5 E5 -",
      "D5 G5 B5 - A5 F5 D5 B4", "E5 - G5 E5 D5 - C5 -",
    ], { groove: "hush", lead: "triangle", gate: 1.5, bassOctave: 3 }),
    soda: song("Soda Circuit", 138, "D Bm G A D F#m G A Em Bm G D Em G A D", [
      "F#5 A5 - D6 A5 F#5 E5 D5", "F#5 B5 A5 F#5 D5 - F#5 A5",
      "B5 G5 D5 - G5 A5 B5 D6", "C#6 A5 E5 F#5 A5 - G5 E5",
      "D6 A5 F#5 E5 D5 F#5 A5 -", "C#6 A5 F#5 - E5 F#5 A5 C#6",
      "B5 A5 G5 D5 E5 G5 A5 B5", "A5 E5 C#5 - E5 G5 A5 -",
      "G5 B5 E6 D6 B5 G5 F#5 E5", "F#5 D5 B4 D5 F#5 A5 B5 -",
      "D6 B5 G5 - A5 B5 D6 E6", "F#6 E6 D6 A5 F#5 - E5 D5",
      "E5 G5 B5 G5 F#5 E5 B4 -", "D5 G5 B5 D6 B5 A5 G5 -",
      "C#6 B5 A5 G5 E5 C#5 E5 G5", "F#5 A5 D6 - E6 C#6 D6 -",
    ], { groove: "skip", swing: .1 }),
    ghost: song("Polite Little Ghost", 118, "Dm Bb Gm A Dm F Bb A Dm C Bb F Gm Dm A Dm", [
      "D5 - F5 E5 A5 - F5 E5", "D5 F5 Bb5 A5 F5 - D5 -",
      "G5 - Bb5 A5 G5 F5 D5 -", "C#5 E5 A5 Bb5 A5 G5 E5 -",
      "A5 D6 - C#6 D6 A5 F5 D5", "C5 F5 A5 C6 A5 G5 F5 -",
      "D6 Bb5 A5 F5 D5 - F5 Bb5", "A5 - G5 E5 C#5 E5 G5 A5",
      "F5 A5 D6 - E6 D6 C6 A5", "G5 E5 C5 E5 G5 Bb5 C6 -",
      "F5 Bb5 D6 F6 D6 C6 Bb5 A5", "A5 - C6 A5 G5 F5 E5 C5",
      "D5 G5 Bb5 D6 C6 Bb5 G5 -", "F5 D5 A4 D5 F5 A5 D6 C6",
      "C#6 A5 G5 E5 C#5 - E5 A5", "F5 E5 D5 - A4 C#5 D5 -",
    ], { groove: "skip", swing: .22, tremolo: true, pulse: "narrow" }),
    hero: song("Very Small Hero", 152, "G D Em C G Bm C D Em C G D Am Em D G", [
      "D5 G5 B5 - A5 G5 D5 E5", "F#5 A5 D6 A5 F#5 E5 D5 -",
      "G5 B5 E6 D6 B5 G5 E5 -", "E5 G5 C6 B5 A5 G5 E5 C5",
      "B5 D6 G6 - F#6 D6 B5 A5", "F#5 B5 D6 F#6 D6 B5 A5 -",
      "G5 E5 C5 E5 G5 A5 C6 B5", "A5 F#5 D5 E5 F#5 A5 D6 -",
      "E6 B5 G5 - A5 B5 D6 E6", "E6 D6 C6 G5 E5 G5 C6 -",
      "D6 B5 G5 D5 E5 G5 B5 A5", "A5 F#5 E5 D5 F#5 A5 D6 C6",
      "C6 A5 E5 A5 B5 C6 E6 D6", "B5 G5 E5 B4 E5 G5 B5 -",
      "A5 D6 C6 A5 F#5 D5 F#5 A5", "B5 A5 G5 D5 B4 D5 G5 -",
    ], { groove: "drive" }),
    crystal: song("Crystal Staircase", 126, "Em Cmaj7 Am B Em G C B Am Em C G Am C B Em", [
      "B4 E5 G5 B5 F#5 G5 E5 -", "E5 G5 B5 E6 D6 B5 G5 E5",
      "A4 E5 A5 C6 B5 A5 G5 E5", "D#5 F#5 B5 D#6 C6 B5 A5 F#5",
      "G5 B5 E6 F#6 E6 B5 G5 -", "B5 G5 D5 G5 A5 B5 D6 -",
      "E6 D6 B5 G5 E5 G5 C6 B5", "A5 F#5 D#5 B4 D#5 F#5 B5 -",
      "C6 E6 C6 A5 E5 A5 B5 C6", "B5 G5 E5 - F#5 G5 B5 E6",
      "G6 E6 D6 B5 G5 E5 D5 E5", "D5 G5 B5 D6 B5 A5 G5 -",
      "E5 A5 C6 E6 D6 C6 B5 A5", "G5 C6 E6 D6 B5 G5 E5 -",
      "F#5 A5 C6 D#6 B5 A5 F#5 D#5", "E5 B4 E5 G5 B5 F#5 E5 -",
    ], { groove: "hush", gate: .95, pulse: "narrow" }),
    midnight: song("Midnight Overdrive", 178, "F#m D Bm C# F#m A D C# F#m E D A Bm D C# F#m", [
      "C#5 F#5 C#5 A5 G#5 F#5 E5 C#5", "D5 F#5 A5 D6 C#6 A5 F#5 E5",
      "F#5 B5 A5 F#5 D5 F#5 B5 C#6", "E#5 G#5 C#6 D6 C#6 B5 G#5 E#5",
      "F#5 A5 C#6 F#6 E6 C#6 A5 G#5", "E5 A5 C#6 E6 C#6 B5 A5 E5",
      "F#6 D6 A5 F#5 E5 F#5 A5 D6", "E#6 C#6 B5 G#5 E#5 G#5 B5 C#6",
      "A5 C#6 F#6 E6 C#6 A5 F#5 -", "G#5 B5 E6 G#6 F#6 E6 B5 G#5",
      "F#6 E6 D6 A5 F#5 A5 D6 E6", "E6 C#6 A5 E5 F#5 A5 C#6 -",
      "D6 B5 F#5 D5 F#5 A5 B5 D6", "F#6 D6 C#6 A5 F#5 D5 F#5 A5",
      "G#5 C#6 E#6 G#6 E#6 C#6 B5 G#5", "A5 G#5 F#5 C#5 E#5 G#5 F#5 -",
    ], { groove: "drive", pulse: "narrow" }),
    home: song("Home in Eight Bits", 108, "Bb F Gm Eb Bb Dm Eb F Gm Dm Eb Bb Cm Eb F Bb", [
      "D5 - F5 Bb5 A5 F5 D5 -", "C5 F5 A5 - G5 F5 C5 -",
      "D5 G5 Bb5 D6 C6 Bb5 G5 F5", "G5 - Bb5 G5 F5 Eb5 D5 -",
      "F5 Bb5 D6 - C6 Bb5 A5 F5", "F5 A5 D6 C6 A5 F5 E5 D5",
      "Eb5 G5 Bb5 Eb6 D6 Bb5 G5 -", "A5 G5 F5 C5 F5 G5 A5 -",
      "Bb5 D6 G6 F6 D6 Bb5 G5 -", "A5 F5 D5 F5 A5 C6 D6 -",
      "Eb6 D6 Bb5 G5 F5 G5 Bb5 -", "D6 Bb5 F5 D5 F5 Bb5 C6 D6",
      "Eb6 C6 G5 Eb5 D5 Eb5 G5 C6", "Bb5 G5 Eb5 - F5 G5 Bb5 D6",
      "C6 A5 F5 Eb5 C5 F5 A5 C6", "D6 C6 Bb5 F5 D5 - Bb4 -",
    ], { groove: "hush", gate: 1.2, lead: "triangle", bassOctave: 3 }),
    arcade_pixel: {
      title: "Pixel Parade",
      bpm: 140,
      roots: [48, 53, 50, 55, 52, 45, 50, 55, 48, 53, 45, 55, 53, 50, 55, 48],
      chords: [[0, 4, 7], [0, 4, 7], [0, 3, 7], [0, 4, 7], [0, 3, 7], [0, 3, 7], [0, 3, 7], [0, 4, 7],
        [0, 4, 7], [0, 4, 7], [0, 3, 7], [0, 4, 7], [0, 4, 7], [0, 3, 7], [0, 4, 7], [0, 4, 7]],
      melody: [
        [72, 76, 79, 76, 74, 72, 0, 79], [77, 81, 79, 77, 76, 77, 81, 0],
        [74, 77, 81, 77, 76, 74, 72, 0], [71, 74, 79, 0, 77, 74, 71, 72],
        [76, 79, 83, 79, 78, 76, 74, 0], [81, 76, 72, 76, 79, 81, 84, 0],
        [81, 77, 74, 0, 77, 79, 81, 84], [83, 81, 79, 77, 74, 71, 74, 0],
        [84, 79, 76, 79, 84, 83, 81, 79], [81, 84, 89, 84, 81, 79, 77, 0],
        [84, 81, 76, 72, 76, 79, 81, 0], [86, 83, 79, 74, 77, 79, 83, 0],
        [81, 79, 77, 76, 77, 81, 84, 0], [81, 79, 77, 74, 72, 74, 77, 0],
        [79, 77, 74, 71, 74, 77, 79, 83], [84, 79, 76, 72, 76, 74, 72, 0],
      ],
    },
    arcade_moonlit: {
      title: "Moonlit Circuit",
      bpm: 104,
      roots: [45, 41, 48, 43, 50, 45, 40, 40, 45, 50, 41, 40, 41, 48, 40, 45],
      chords: [[0, 3, 7], [0, 4, 7], [0, 4, 7], [0, 4, 7], [0, 3, 7], [0, 3, 7], [0, 3, 7], [0, 4, 7],
        [0, 3, 7], [0, 3, 7], [0, 4, 7], [0, 4, 7], [0, 4, 7], [0, 4, 7], [0, 4, 7], [0, 3, 7]],
      melody: [
        [69, 0, 72, 76, 0, 74, 72, 0], [69, 72, 77, 0, 76, 72, 69, 0],
        [67, 72, 76, 0, 79, 76, 72, 0], [71, 74, 79, 0, 78, 74, 71, 0],
        [69, 74, 77, 0, 81, 77, 74, 0], [76, 72, 69, 0, 67, 69, 72, 0],
        [71, 76, 79, 0, 78, 76, 71, 0], [68, 71, 76, 0, 80, 76, 71, 0],
        [81, 0, 79, 76, 0, 72, 69, 0], [77, 81, 86, 0, 84, 81, 77, 0],
        [81, 77, 72, 0, 69, 72, 77, 0], [80, 76, 71, 0, 68, 71, 76, 0],
        [77, 0, 76, 72, 0, 69, 72, 0], [76, 79, 84, 0, 83, 79, 76, 0],
        [80, 76, 71, 68, 71, 76, 80, 0], [81, 76, 72, 69, 0, 72, 69, 0],
      ],
    },
    arcade_turbo: {
      title: "Turbo Tokens",
      bpm: 168,
      roots: [50, 47, 43, 45, 50, 45, 52, 45, 42, 43, 50, 45, 47, 43, 45, 50],
      chords: [[0, 4, 7], [0, 3, 7], [0, 4, 7], [0, 4, 7], [0, 4, 7], [0, 4, 7], [0, 3, 7], [0, 4, 7],
        [0, 3, 7], [0, 4, 7], [0, 4, 7], [0, 4, 7], [0, 3, 7], [0, 4, 7], [0, 4, 7], [0, 4, 7]],
      melody: [
        [74, 78, 81, 86, 81, 78, 76, 74], [71, 74, 78, 83, 81, 78, 74, 0],
        [79, 83, 86, 83, 81, 79, 78, 76], [73, 76, 81, 85, 83, 81, 76, 0],
        [86, 81, 78, 74, 78, 81, 86, 88], [85, 83, 81, 76, 73, 76, 81, 0],
        [76, 79, 83, 88, 86, 83, 79, 76], [81, 85, 88, 85, 83, 81, 76, 0],
        [78, 81, 85, 81, 78, 76, 73, 0], [79, 83, 86, 91, 86, 83, 81, 79],
        [90, 86, 81, 78, 81, 86, 90, 0], [88, 85, 81, 76, 81, 83, 85, 0],
        [83, 81, 78, 74, 71, 74, 78, 83], [86, 83, 79, 76, 79, 81, 83, 0],
        [85, 81, 76, 73, 76, 81, 85, 88], [86, 81, 78, 74, 76, 78, 74, 0],
      ],
    },
    arcade_bubblebyte: {
      title: "Bubblebyte Bay",
      bpm: 116,
      roots: [41, 50, 43, 48, 41, 46, 48, 41, 50, 46, 43, 48, 46, 41, 48, 41],
      chords: [[0, 4, 7], [0, 3, 7], [0, 3, 7], [0, 4, 7], [0, 4, 7], [0, 4, 7], [0, 4, 7], [0, 4, 7],
        [0, 3, 7], [0, 4, 7], [0, 3, 7], [0, 4, 7], [0, 4, 7], [0, 4, 7], [0, 4, 7], [0, 4, 7]],
      melody: [
        [77, 0, 81, 79, 77, 0, 72, 74], [77, 81, 86, 81, 77, 74, 0, 72],
        [79, 82, 81, 79, 77, 74, 0, 79], [76, 79, 84, 79, 76, 74, 72, 0],
        [81, 77, 72, 0, 77, 79, 81, 84], [82, 0, 86, 84, 82, 81, 77, 0],
        [79, 76, 72, 0, 76, 79, 84, 0], [81, 79, 77, 0, 72, 74, 77, 0],
        [86, 81, 77, 74, 0, 77, 81, 0], [86, 82, 77, 0, 82, 84, 86, 89],
        [82, 81, 79, 77, 74, 77, 79, 0], [84, 79, 76, 72, 76, 79, 84, 0],
        [82, 86, 89, 86, 84, 82, 81, 0], [84, 81, 77, 72, 77, 79, 81, 0],
        [79, 76, 72, 74, 76, 79, 84, 0], [81, 79, 77, 72, 0, 74, 77, 0],
      ],
    },
    arcade_horizon: {
      title: "High Score Horizon",
      bpm: 148,
      roots: [43, 40, 48, 50, 47, 48, 45, 50, 43, 48, 40, 50, 48, 45, 50, 43],
      chords: [[0, 4, 7], [0, 3, 7], [0, 4, 7], [0, 4, 7], [0, 3, 7], [0, 4, 7], [0, 3, 7], [0, 4, 7],
        [0, 4, 7], [0, 4, 7], [0, 3, 7], [0, 4, 7], [0, 4, 7], [0, 3, 7], [0, 4, 7], [0, 4, 7]],
      melody: [
        [79, 0, 83, 86, 83, 81, 79, 0], [76, 79, 83, 0, 86, 83, 79, 76],
        [76, 79, 84, 0, 83, 79, 76, 0], [78, 81, 86, 0, 88, 86, 81, 78],
        [78, 83, 86, 83, 81, 78, 74, 0], [84, 79, 76, 0, 79, 83, 84, 0],
        [81, 84, 88, 84, 81, 79, 76, 0], [86, 81, 78, 0, 81, 86, 90, 0],
        [91, 86, 83, 79, 83, 86, 91, 0], [88, 84, 79, 76, 79, 84, 88, 0],
        [86, 83, 79, 76, 79, 83, 86, 0], [90, 86, 81, 78, 81, 86, 90, 0],
        [88, 84, 79, 76, 79, 83, 84, 0], [84, 81, 76, 72, 76, 79, 81, 0],
        [86, 81, 78, 74, 78, 81, 86, 90], [91, 86, 83, 79, 81, 83, 79, 0],
      ],
    },
    pumpkin: {
      title: "The Pumpkin King",
      bpm: 156,
      roots: [38, 34, 43, 45, 38, 41, 34, 45, 38, 39, 43, 45, 34, 43, 45, 38],
      chords: [[0, 3, 7], [0, 4, 7], [0, 3, 7], [0, 4, 7],
        [0, 3, 7], [0, 4, 7], [0, 4, 7], [0, 4, 7],
        [0, 3, 7], [0, 3, 6], [0, 3, 7], [0, 4, 7],
        [0, 4, 7], [0, 3, 7], [0, 4, 7], [0, 3, 7]],
      melody: [
        [74, 77, 81, 77, 74, 73, 74, 0], [70, 74, 77, 74, 70, 69, 70, 0],
        [79, 82, 81, 79, 77, 74, 73, 74], [73, 76, 79, 82, 81, 79, 76, 73],
        [86, 81, 77, 74, 77, 81, 86, 85], [81, 77, 72, 69, 72, 77, 81, 0],
        [82, 81, 77, 74, 70, 74, 77, 0], [73, 76, 81, 0, 82, 81, 76, 73],
        [74, 0, 86, 85, 86, 81, 77, 74], [75, 78, 81, 78, 75, 74, 75, 0],
        [79, 82, 86, 82, 79, 77, 74, 0], [85, 81, 79, 76, 73, 76, 79, 81],
        [82, 77, 74, 70, 74, 77, 82, 81], [79, 74, 70, 67, 70, 74, 79, 0],
        [73, 76, 79, 82, 85, 82, 79, 73], [74, 77, 81, 86, 81, 77, 74, 0],
      ],
    },
  };
  const tracks = Object.freeze(Object.entries(scores).filter(([id]) => !["pumpkin", "singularity"].includes(id))
    .map(([id, score]) => Object.freeze({ id, title: score.title, bpm: score.bpm })));
  const grooves = {
    classic: { bass: [0, .5, 1, 1.5, 2, 2.5, 3, 3.5], kicks: [0, 2], hats: 8 },
    drive: { bass: [0, .5, 1, 1.5, 2, 2.5, 3, 3.5], kicks: [0, 1.5, 2, 2.75], hats: 16 },
    skip: { bass: [0, .75, 1.5, 2, 2.75, 3.5], kicks: [0, 1.5, 2.5], hats: 8 },
    hush: { bass: [0, 2, 3.5], kicks: [0, 2.5], hats: 4 },
  };
  const waveTables = new Map();
  function pulseWave(narrow, frequency, sampleRate) {
    const harmonics = [1, ...(narrow ? [2] : []), 3, 5].filter(n => n * frequency < sampleRate / 2);
    const key = `${narrow}:${harmonics.join(",")}`;
    if (!waveTables.has(key)) {
      const table = Float32Array.from({ length: 4096 }, (_, index) => harmonics.reduce((sum, n) =>
        sum + Math.sin(2 * Math.PI * n * index / 4096) * (n === 2 ? .35 : 1 / n), 0) / (narrow ? 1.88 : 1.53));
      waveTables.set(key, table);
    }
    return waveTables.get(key);
  }
  // Five original rock scores: individual tempos, progressions and four riffs
  // each, arranged into intro, verse, chorus, bridge, reprise and final chord.
  const rockTracks = [
    { id: "rock_afterburn", title: "Afterburn", bpm: 156,
      roots: [40, 40, 43, 45, 40, 43, 38, 35], kicks: [0, 1.5, 2, 2.75],
      riffs: [[0, 0, 3, 0, 5, 3, 0, null], [7, 5, 3, 0, 3, 5, 7, 10],
        [12, null, 10, 7, 10, 12, 15, 12], [7, 10, 12, 10, 7, 5, 3, 0]] },
    { id: "rock_neon", title: "Neon Overdrive", bpm: 144,
      roots: [38, 45, 43, 38, 41, 43, 45, 45], kicks: [0, .75, 2, 3.5],
      riffs: [[0, 4, 7, null, 9, 7, 4, 2], [2, 4, 7, 4, 0, null, 2, 4],
        [12, 11, 9, 7, 9, null, 12, 14], [16, 14, 12, 9, 7, 9, 11, 12]] },
    { id: "rock_static", title: "Static Revolt", bpm: 176,
      roots: [42, 45, 40, 47, 42, 40, 38, 40], kicks: [0, 1, 2, 2.5, 3.5],
      riffs: [[0, 0, null, 7, 0, 0, 3, 5], [7, null, 7, 5, 3, 0, 3, null],
        [12, 12, 7, 10, 12, 15, 14, 12], [10, 7, 5, 7, 10, 12, 7, 0]] },
    { id: "rock_midnight", title: "Midnight Circuit", bpm: 112,
      roots: [45, 45, 48, 50, 45, 52, 50, 45], kicks: [0, 1.75, 2, 2.75],
      riffs: [[0, null, 3, 5, 6, 5, 3, 0], [7, null, 10, 7, 5, 3, 0, null],
        [12, null, 15, 17, 18, 17, 15, 12], [19, 17, 15, null, 12, 10, 7, 12]] },
    { id: "rock_victory", title: "Victory Voltage", bpm: 164,
      roots: [36, 43, 45, 41, 36, 41, 43, 43], kicks: [0, .5, 2, 3],
      riffs: [[0, 4, 7, 12, 7, 4, 2, 0], [4, 7, 9, 7, 4, 2, 0, null],
        [12, null, 16, 19, 17, 16, 14, 12], [19, 16, 12, 14, 16, 19, 21, 19]] },
  ];
  function pickRockTrack(random = Math.random) {
    return rockTracks[Math.floor(random() * rockTracks.length)];
  }
  function composeRock(track, sampleRate) {
    const beat = 60 / track.bpm, duration = 32 * 4 * beat + 1.2;
    const samples = new Float32Array(Math.round(duration * sampleRate));
    let seed = 9317 + track.bpm;
    function noise() {
      seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0;
      return seed / 2147483648 - 1;
    }
    function guitar(pitch, start, length, amplitude, lead = false) {
      const frequency = 440 * 2 ** ((pitch - 69) / 12);
      const offset = Math.round(start * sampleRate);
      for (let i = 0; i < length * sampleRate && offset + i < samples.length; i++) {
        const t = i / sampleRate;
        const phase = 2 * Math.PI * (frequency * t + (lead ? .035 * Math.sin(t * 32) : 0));
        const string = Math.sin(phase) + .5 * Math.sin(phase * 2) + .25 * Math.sin(phase * 3);
        const wave = Math.tanh(string * 2.4) + .15 * Math.sin(phase * 1.003);
        const envelope = Math.min(1, t / .003, (length - t) / .035)
          * Math.exp(-t * (lead ? .9 : 2.5));
        samples[offset + i] += wave * envelope * amplitude;
      }
    }
    function bass(pitch, start, length) {
      const frequency = 440 * 2 ** ((pitch - 69) / 12);
      const offset = Math.round(start * sampleRate);
      for (let i = 0; i < length * sampleRate && offset + i < samples.length; i++) {
        const t = i / sampleRate, phase = 2 * Math.PI * frequency * t;
        const envelope = Math.min(1, t / .005, (length - t) / .03);
        samples[offset + i] += (Math.sin(phase) + .25 * Math.sin(phase * 2)) * .17 * envelope;
      }
    }
    function drum(start, kind, strength = 1) {
      const length = { kick: .22, snare: .18, hat: .05, crash: .8 }[kind];
      const offset = Math.round(start * sampleRate);
      let previous = 0;
      for (let i = 0; i < length * sampleRate && offset + i < samples.length; i++) {
        const t = i / sampleRate, hiss = noise();
        const envelope = Math.min(1, t / .001) * (1 - t / length) ** 2;
        const wave = kind === "kick" ? .46 * Math.sin(2 * Math.PI * (49 * t + 6 * (1 - Math.exp(-t * 40))))
          : kind === "snare" ? .28 * hiss + .12 * Math.sin(2 * Math.PI * 185 * t) * Math.exp(-t * 30)
          : (hiss - previous) * (kind === "hat" ? .09 : .14);
        samples[offset + i] += wave * envelope * strength;
        previous = hiss;
      }
    }
    for (let bar = 0; bar < 32; bar++) {
      const start = bar * 4 * beat, root = track.roots[bar % 8];
      const chorus = (bar >= 12 && bar < 20) || (bar >= 24 && bar < 30);
      const bridge = bar >= 20 && bar < 24;
      if (bar === 31) {
        // A resolved, sustained ending rather than cutting off a looping riff.
        for (const interval of [0, 7, 12]) guitar(track.roots[0] + interval, start, 4 * beat + 1, .085);
        guitar(track.roots[0] + 36, start, 4 * beat, .13, true);
        bass(track.roots[0] - 12, start, 4 * beat);
        drum(start, "kick"); drum(start, "crash");
        continue;
      }
      for (let n = 0; n < 8; n++) {
        const when = start + n * beat / 2;
        if (!bridge || n % 2 === 0)
          for (const [string, interval] of [0, 7, 12].entries())
            guitar(root + interval, when + string * .006, beat * (chorus ? .7 : .36), chorus ? .075 : .06);
        bass(root - 12 + (n % 4 === 3 ? 7 : 0), when, beat * .43);
        drum(when, "hat", n % 2 ? .65 : 1);
      }
      if (bar >= 4) {
        const riff = track.riffs[(chorus ? 2 : 0) + bar % 2];
        riff.forEach((note, n) => {
          if (note !== null) guitar(root + 24 + note, start + n * beat / 2, beat * (bridge ? .8 : .43), .15, true);
        });
      }
      for (const n of track.kicks) drum(start + n * beat, "kick");
      for (const n of [1, 3]) drum(start + n * beat, "snare");
      if (bar % 4 === 3)
        for (const n of [3.25, 3.5, 3.75]) drum(start + n * beat, "snare", .65);
      if ([0, 4, 12, 20, 24, 30].includes(bar)) drum(start, "crash");
    }
    for (let i = 0; i < samples.length; i++) {
      const fade = Math.min(1, i / (sampleRate * .005), (samples.length - 1 - i) / (sampleRate * .25));
      samples[i] = .8 * Math.tanh(samples[i] / .8) * fade;
    }
    return samples;
  }
  function composeCinematicCore(sampleRate) {
    // A slow, original orchestral/synth cue: bowed low strings, legato brass,
    // vowel-like choir, resonant ensemble drums, and a diffuse reverb tail.
    const beat = 60 / 78, barLength = beat * 4;
    const samples = new Float32Array(Math.round(barLength * 16 * sampleRate));
    const roots = [38, 34, 43, 45, 38, 41, 34, 45, 38, 36, 34, 45, 43, 34, 45, 45];
    const melody = [[62, 65], [65, 62], [67, 70], [69, 73],
      [74, 72], [69, 65], [70, 74], [73, 69],
      [74, 77], [72, 69], [70, 67], [69, 73],
      [77, 74], [74, 70], [73, 69], [69, 61]];
    const tables = new Map(), notes = new Map();
    function tableFor(pitch, voice) {
      const key = `${pitch}:${voice}`;
      if (tables.has(key)) return tables.get(key);
      const frequency = 440 * 2 ** ((pitch - 69) / 12);
      const harmonics = [];
      for (let n = 1; n <= 16 && n * frequency < sampleRate * .45; n++) {
        const f = n * frequency;
        const weight = voice === 'choir'
          ? .13 / n + .65 * Math.exp(-(((f - 720) / 210) ** 2))
            + .4 * Math.exp(-(((f - 1150) / 260) ** 2))
          : voice === 'bass' ? (n === 1 ? 1 : n === 2 ? .16 : 0)
          : Math.exp(-n / (voice === 'brass' ? 5 : 8)) / n ** (voice === 'brass' ? 1.1 : 1.3);
        harmonics.push([n, weight]);
      }
      const total = harmonics.reduce((sum, [, weight]) => sum + weight, 0);
      const table = Float32Array.from({ length: 4096 }, (_, i) => harmonics.reduce((sum, [n, weight]) =>
        sum + Math.sin(Math.PI * 2 * n * i / 4096) * weight, 0) / total);
      tables.set(key, table);
      return table;
    }
    function lookup(table, phase) {
      const index = (phase - Math.floor(phase)) * table.length;
      const left = Math.floor(index), fraction = index - left;
      return table[left] * (1 - fraction) + table[(left + 1) % table.length] * fraction;
    }
    function voice(pitch, start, duration, level, kind, attack, release) {
      const key = `${pitch}:${duration}:${kind}:${attack}:${release}`;
      if (!notes.has(key)) {
        const data = new Float32Array(Math.round(duration * sampleRate));
        const table = tableFor(pitch, kind), frequency = 440 * 2 ** ((pitch - 69) / 12);
        let phase = 0, second = .137;
        for (let i = 0; i < data.length; i++) {
          const t = i / sampleRate;
          const envelope = Math.sin(Math.min(1, t / attack) * Math.PI / 2)
            * Math.sin(Math.min(1, (duration - t) / release) * Math.PI / 2);
          phase += frequency / sampleRate * (1 + .0015 * Math.sin(t * 27));
          second += frequency * .9978 / sampleRate;
          const ensemble = lookup(table, phase) * .6 + lookup(table, second) * .4;
          const breath = .92 + .08 * Math.sin(t * 2.3);
          data[i] = ensemble * envelope * breath;
        }
        notes.set(key, data);
      }
      const data = notes.get(key), offset = Math.round(start * sampleRate);
      for (let i = 0; i < data.length && offset + i < samples.length; i++) samples[offset + i] += data[i] * level;
    }
    let seed = 47011;
    function noise() {
      seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0;
      return seed / 2147483648 - 1;
    }
    function drum(start, level) {
      const offset = Math.round(start * sampleRate), duration = 1.25;
      let air = 0;
      for (let i = 0; i < duration * sampleRate && offset + i < samples.length; i++) {
        const t = i / sampleRate;
        const phase = Math.PI * 2 * (43 * t + 4.8 * (1 - Math.exp(-t * 18)));
        air += .12 * (noise() - air);
        const body = Math.sin(phase) * Math.exp(-t * 3.8)
          + .38 * Math.sin(phase * 1.49) * Math.exp(-t * 6.2)
          + .2 * Math.sin(phase * 2.13) * Math.exp(-t * 9);
        const strike = air * 1.6 * Math.exp(-t * 28);
        samples[offset + i] += (body + strike) * Math.min(1, t / .006) * level;
      }
    }
    function swell(start, duration, level) {
      const offset = Math.round(start * sampleRate);
      let low = 0, high = 0;
      for (let i = 0; i < duration * sampleRate && offset + i < samples.length; i++) {
        const t = i / sampleRate;
        low += .035 * (noise() - low);
        high += .35 * (noise() - high);
        samples[offset + i] += (high - low) * Math.sin(Math.PI * t / duration) ** 2 * level;
      }
    }
    for (let bar = 0; bar < 16; bar++) {
      const start = bar * barLength, root = roots[bar];
      const chord = [0, [45, 41, 36, 34].includes(root) ? 4 : 3, 7];
      const intensity = bar < 4 ? .52 : bar < 8 ? .74 : bar < 12 ? 1 : .86;
      voice(root - 12, start, barLength + .55, .21 * intensity, 'bass', .14, .75);
      chord.forEach((interval, i) => {
        voice(root + 12 + interval, start, barLength + .7, .12 * intensity, 'strings', .55, .95);
        if (bar >= 8) voice(root + 24 + interval, start + .08 * i, barLength + .5,
          .065 * intensity, 'choir', .8, 1.1);
      });
      if (bar >= 4) {
        for (let n = 0; n < 4; n++) voice(root + 12 + [0, 7, 12, 7][n], start + n * beat,
          beat * .72, .14 * intensity, 'strings', .045, .27);
        melody[bar].forEach((pitch, i) => voice(pitch, start + i * beat * 2,
          beat * 2.25, .15 * intensity, 'brass', .25, .5));
      }
      drum(start, .36 * intensity);
      if (bar >= 4) drum(start + beat * 2, .24 * intensity);
      if (bar >= 8) drum(start + beat * 3.5, .16 * intensity);
      if (bar % 4 === 3) {
        swell(start + beat, beat * 3, .15);
        for (let n = 0; n < 4; n++) drum(start + beat * (3 + n / 4), .045 + n * .018);
      }
    }
    // Feed-forward diffusion keeps the orchestration spacious without feedback
    // building up over loops. All synthesis is local; there are no audio downloads.
    const dry = samples.slice();
    for (const [seconds, level] of [[.139, .17], [.227, .13], [.353, .1], [.487, .07]]) {
      const delay = Math.round(seconds * sampleRate);
      for (let i = delay; i < samples.length; i++) samples[i] += dry[i - delay] * level;
    }
    for (let i = 0; i < samples.length; i++) {
      const fade = Math.min(1, i / (sampleRate * .08), (samples.length - 1 - i) / (sampleRate * .55));
      samples[i] = Math.tanh(samples[i] * 1.35) * .82 * fade;
    }
    return samples;
  }
  function compose(track, sampleRate = 22050) {
    if (track === "singularity") return composeCinematicCore(sampleRate);
    const rock = rockTracks.find(song => song.id === track);
    if (rock) return composeRock(rock, sampleRate);
    const score = scores[track];
    if (!score) throw new Error(`Unknown music theme: ${track}`);
    const beat = 60 / score.bpm;
    const samples = new Float32Array(Math.round(score.roots.length * 4 * beat * sampleRate));
    const groove = grooves[score.groove || "classic"];
    const tones = new Map();
    function tone(pitch, start, duration, amplitude, voice) {
      if (!pitch) return;
      const offset = Math.round(start * sampleRate);
      const key = `${pitch}:${duration}:${amplitude}:${voice}`;
      if (!tones.has(key)) {
        const frequency = 440 * 2 ** ((pitch - 69) / 12);
        const data = new Float32Array(Math.floor(duration * sampleRate));
        const triangle = voice === "bass" || (voice === "lead" && score.lead === "triangle");
        const table = triangle ? null : pulseWave(score.pulse === "narrow", frequency, sampleRate);
        for (let i = 0; i < data.length; i++) {
          const t = i / sampleRate;
          const envelope = Math.min(1, t / .004, (duration - t) / .018);
          const phase = (t * frequency) % 1;
          const wave = triangle ? 1 - 4 * Math.abs(phase - .5) : table[Math.floor(phase * table.length)];
          const tremolo = (track === "pumpkin" || score.tremolo) && voice === "lead" ? .88 + .12 * Math.cos(t * 35) : 1;
          data[i] = wave * amplitude * envelope * tremolo;
        }
        tones.set(key, data);
      }
      // Reuse rendered notes within a song to keep synthesis short during play.
      const data = tones.get(key);
      for (let i = 0; i < data.length && offset + i < samples.length; i++) samples[offset + i] += data[i];
    }
    let seed = 7341;
    function drum(start, kind, volume = 1) {
      const duration = kind === "hat" ? .035 : .13;
      const offset = Math.round(start * sampleRate);
      let previousNoise = 0;
      for (let i = 0; i < duration * sampleRate && offset + i < samples.length; i++) {
        const t = i / sampleRate;
        seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0;
        const noise = seed / 2147483648 - 1;
        const envelope = Math.min(1, t / .002) * (1 - t / duration) ** 3;
        const wave = kind === "kick" ? Math.sin(2 * Math.PI * (58 * t + 5 * (1 - Math.exp(-t * 35))))
          : kind === "hat" ? (noise - previousNoise) * .18 : noise * .5;
        samples[offset + i] += wave * envelope * (kind === "kick" ? .3 : .2) * volume;
        previousNoise = noise;
      }
    }
    for (let bar = 0; bar < score.roots.length; bar++) {
      const root = score.roots[bar], chord = score.chords[bar];
      const start = bar * 4 * beat;
      const swing = n => n + (n % 2 ? score.swing || 0 : 0);
      score.melody[bar].forEach((pitch, n) => tone(pitch, start + swing(n) * beat / 2, beat * .42 * (score.gate || 1), .21, "lead"));
      groove.bass.forEach((position, n) => tone(root + (n % 4 === 3 ? 12 : n % 2 ? 7 : 0),
        start + position * beat, beat * (score.groove === "hush" ? .85 : .4), .24, "bass"));
      for (let n = 0; n < groove.hats; n++)
        drum(start + (n + (n % 2 ? score.swing || 0 : 0)) * 4 * beat / groove.hats, "hat", score.groove === "hush" ? .55 : 1);
      for (let n = 0; n < 16; n++)
        tone(root + 24 + chord[[0, 1, 2, chord.length === 4 ? 3 : 1][n % 4]], start + n * beat / 4, beat * .18, .065, "arp");
      for (const position of groove.kicks) drum(start + position * beat, "kick");
      for (const position of [1, 3]) drum(start + position * beat, "snare", score.groove === "hush" ? .45 : 1);
      if (bar >= 16) {
        // Short chord-tone replies leave the main melody room to breathe.
        for (const n of [3, 7]) tone(root + 24 + chord[(bar + n) % chord.length],
          start + swing(n) * beat / 2, beat * .7, .055, "answer");
        if (bar % 4 === 3) drum(start + beat * 3.75, "snare", .4);
      }
      if (track === "pumpkin") drum(start + beat * 2.75, "kick");
    }
    // Leave headroom for the mix and end long notes quietly at a song boundary.
    let peak = 0;
    for (const sample of samples) peak = Math.max(peak, Math.abs(sample));
    if (peak > .85) {
      const level = .85 / peak;
      for (let i = 0; i < samples.length; i++) samples[i] *= level;
    }
    const fade = Math.round(.02 * sampleRate);
    for (let i = 0; i < fade; i++) samples[samples.length - 1 - i] *= i / fade;
    samples[samples.length - 1] = 0;
    return samples;
  }

  const gasterDuration = 6.66;
  function composeGaster(sampleRate = 22050) {
    // Original reversed, granular vocal-like noise inspired by Entry 17.
    // Slow formants, uneven pulses and crushed noise; no sampled recordings.
    const samples = new Float32Array(Math.round(gasterDuration * sampleRate));
    let seed = 17666, noise = 0, phase = 0;
    for (let i = 0; i < samples.length; i++) {
      const t = i / sampleRate, reverse = gasterDuration - t;
      seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0;
      noise = noise * .93 + (seed / 2147483648 - 1) * .07;
      const grain = reverse % .83;
      const pitch = 47 + 11 * Math.sin(reverse * 1.7) + 23 * grain;
      phase += pitch / sampleRate;
      const voice = Math.sin(2 * Math.PI * phase
        + 2.8 * Math.sin(2 * Math.PI * phase * 3.01));
      const formants = .35 * Math.sin(2 * Math.PI * phase * 6.03)
        + .2 * Math.sin(2 * Math.PI * phase * 10.07);
      const pulse = (.5 + .5 * Math.cos(reverse * 18 + Math.sin(reverse * 7))) ** 2;
      const envelope = Math.min(1, t / .03, (samples.length - 1 - i) / (sampleRate * .12));
      samples[i] = Math.tanh((voice + formants + noise * 4) * 1.8)
        * (.16 + .24 * pulse) * envelope;
    }
    return samples;
  }

  class Player {
    constructor(context, destination = context.destination, random = Math.random) {
      this.context = context;
      this.destination = destination;
      this.buffers = new Map();
      this.voices = new Set();
      this.current = null;
      this.theme = "arcade";
      this.track = null;
      this.queue = [];
      this.lastArcadeTrack = null;
      this.random = random;
      this.playing = false;
      this.offset = 0;
      this.oneShot = null;
      this.state = { theme: "arcade", playing: false };
      this.interruptedArcade = null;
    }
    nextTrack() {
      if (!this.queue.length) {
        this.queue = tracks.map(track => track.id);
        for (let i = this.queue.length - 1; i > 0; i--) {
          const j = Math.floor(this.random() * (i + 1));
          [this.queue[i], this.queue[j]] = [this.queue[j], this.queue[i]];
        }
        // Avoid repeating the last song across two shuffled playlists.
        if (this.queue[0] === this.lastArcadeTrack) {
          const j = 1 + Math.floor(this.random() * (this.queue.length - 1));
          [this.queue[0], this.queue[j]] = [this.queue[j], this.queue[0]];
        }
      }
      this.lastArcadeTrack = this.queue.shift();
      return this.lastArcadeTrack;
    }
    buffer(theme) {
      if (!this.buffers.has(theme)) {
        const data = compose(theme);
        const buffer = this.context.createBuffer(1, data.length, 22050);
        buffer.copyToChannel(data, 0);
        this.buffers.set(theme, buffer);
      }
      return this.buffers.get(theme);
    }
    retire(voice, fade) {
      const now = this.context.currentTime;
      if (voice.stopAt && voice.stopAt <= now + fade) return;
      voice.stopAt = now + fade;
      voice.gain.gain.cancelAndHoldAtTime(now);
      voice.gain.gain.setTargetAtTime(0, now, fade / 4);
      voice.source.stop(voice.stopAt);
    }
    playOnce(theme, state = this.state) {
      if (!rockTracks.some(track => track.id === theme)) throw new Error(`Unknown rock song: ${theme}`);
      if (!this.oneShot && this.theme === "arcade" && this.track) {
        this.interruptedArcade = {
          track: this.track,
          offset: this.current
            ? this.current.offset + this.context.currentTime - this.current.started
            : this.offset,
        };
      }
      if (this.current) {
        this.retire(this.current, .18);
        this.current = null;
      }
      this.track = null;
      this.offset = 0;
      this.oneShot = theme;
      this.setState(state);
    }
    setState({ theme, playing }) {
      if (!["arcade", "pumpkin", "singularity"].includes(theme)) throw new Error(`Unknown music theme: ${theme}`);
      this.state = { theme, playing };
      theme = this.oneShot || theme;
      this.playing = playing;
      const changed = theme !== this.theme;
      if (this.current && (changed || !playing)) {
        const elapsed = this.current.offset + this.context.currentTime - this.current.started;
        const duration = this.current.source.buffer.duration;
        this.offset = this.current.source.loop ? elapsed % duration : Math.min(elapsed, duration);
        this.retire(this.current, playing ? .18 : .02);
        this.current = null;
      }
      if (changed) {
        this.offset = 0;
        this.track = null;
        if (theme === "arcade" && this.interruptedArcade) {
          this.track = this.interruptedArcade.track;
          this.offset = Math.min(this.interruptedArcade.offset, this.buffer(this.track).duration);
        }
        if (!this.oneShot) this.interruptedArcade = null;
      }
      this.theme = theme;
      if (!playing) {
        // Include any fading old theme, so mute/pause never leaves a second loop.
        for (const voice of this.voices) this.retire(voice, .02);
        return;
      }
      if (this.current) return;
      this.start();
    }
    start() {
      if (!this.track) this.track = this.oneShot || (["pumpkin", "singularity"].includes(this.theme) ? this.theme : this.nextTrack());
      const source = this.context.createBufferSource();
      const gain = this.context.createGain();
      source.buffer = this.buffer(this.track);
      source.loop = ["pumpkin", "singularity"].includes(this.theme);
      gain.gain.setValueAtTime(0, this.context.currentTime);
      gain.gain.linearRampToValueAtTime(.22, this.context.currentTime + .18);
      source.connect(gain);
      gain.connect(this.destination);
      const voice = { source, gain, track: this.track, offset: this.offset, started: this.context.currentTime };
      source.onended = () => {
        source.disconnect();
        gain.disconnect();
        this.voices.delete(voice);
        // An old crossfade/pause callback must never advance the playlist.
        if (this.current !== voice) return;
        this.current = null;
        this.offset = 0;
        this.track = null;
        if (this.oneShot) {
          this.oneShot = null;
          this.setState(this.state);
        } else if (this.playing) this.start();
      };
      this.voices.add(voice);
      this.current = voice;
      source.start(this.context.currentTime, this.offset);
    }
  }
  return { compose, composeGaster, gasterDuration, Player, tracks, arcadeTracks: tracks, rockTracks, pickRockTrack };
})();
if (typeof module !== "undefined") module.exports = ArcadeMusic;
