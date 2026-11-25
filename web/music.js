"use strict";

// Original scores and credited fan remixes. MIDI pitches, with 0 representing a rest.
// Pulse lead + triangle bass + arpeggio + noise drums evoke a small chip synth.
const ArcadeMusic = (() => {
  const archive=typeof JukeboxArchive!=='undefined'?JukeboxArchive:typeof module!=='undefined'?require('./jukebox-archive.js'):null;
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
    news_broadcast: song("Live from Cubie’s Desk", 148, "Dm7 G7 Cmaj7 A7 Dm7 G7 Cmaj7 C7 Fmaj7 Fm Cmaj7 A7 Dm7 G7 Cmaj7 G7", [
      "D5 - A5 F5 E5 F5 A5 -", "B4 D5 G5 - A5 G5 F5 D5",
      "E5 G5 - B5 C6 G5 E5 -", "C#5 E5 A5 G5 E5 - C#5 E5",
      "F5 A5 D6 - C6 A5 F5 E5", "D5 G5 B5 A5 - G5 D5 B4",
      "C5 E5 G5 B5 - G5 E5 D5", "E5 G5 Bb5 - A5 G5 E5 -",
      "A5 - C6 A5 G5 A5 C6 -", "Ab5 C6 - Ab5 F5 Eb5 C5 -",
      "G5 B5 E6 D6 B5 G5 E5 -", "C#5 E5 G5 A5 C6 A5 G5 E5",
      "D5 F5 A5 C6 - A5 F5 D5", "B4 D5 F5 G5 B5 A5 G5 D5",
      "E5 G5 C6 - B5 G5 E5 C5", "D5 G5 B5 D6 C6 B5 G5 -",
    ], {groove:"skip", lead:"square", swing:.08, gate:.62}),
    cubie_hello: song("Hello, New Friend!", 116, "C Am F G C Em F G Am Dm G C F C G C", [
      "E5 - G5 A5 G5 E5 D5 C5", "C5 E5 A5 - G5 E5 C5 -",
      "F5 - A5 C6 A5 G5 F5 E5", "D5 G5 B5 A5 G5 - D5 -",
      "E5 G5 C6 - B5 A5 G5 E5", "G5 B5 E6 D6 B5 G5 E5 -",
      "A5 G5 F5 A5 C6 - A5 F5", "G5 A5 B5 D6 C6 B5 G5 -",
      "A5 C6 E6 - D6 C6 A5 G5", "F5 A5 D6 C6 A5 F5 D5 -",
      "G5 B5 D6 - B5 A5 G5 D5", "E5 G5 C6 B5 G5 E5 C5 -",
      "F5 A5 C6 - A5 G5 F5 E5", "E5 G5 C6 - G5 E5 D5 C5",
      "D5 G5 B5 D6 C6 B5 A5 G5", "E5 G5 C6 - G5 E5 C5 -",
    ], {groove:"skip", lead:"triangle", swing:.06, gate:.8}),
    starburst_255: song("Starburst Circuit", 255, "Bm G D A Bm Em G F# Bm D G A Em G F# Bm", [
      "B5 F#5 D5 F#5 A5 B5 D6 F#6",
      "G5 B5 D6 B5 A5 G5 F#5 E5",
      "D5 F#5 A5 D6 C#6 A5 F#5 E5",
      "C#5 E5 A5 B5 C#6 B5 A5 E5",
      "B5 F#5 D5 F#5 A5 B5 D6 F#6",
      "G5 B5 D6 B5 A5 G5 F#5 E5",
      "D5 F#5 A5 D6 C#6 A5 F#5 E5",
      "C#5 E5 A5 B5 C#6 B5 A5 E5",
      "B5 F#5 D5 F#5 A5 B5 D6 F#6",
      "G5 B5 D6 B5 A5 G5 F#5 E5",
      "D5 F#5 A5 D6 C#6 A5 F#5 E5",
      "C#5 E5 A5 B5 C#6 B5 A5 E5",
      "B5 F#5 D5 F#5 A5 B5 D6 F#6",
      "G5 B5 D6 B5 A5 G5 F#5 E5",
      "D5 F#5 A5 D6 C#6 A5 F#5 E5",
      "C#5 E5 A5 B5 C#6 B5 A5 E5",
    ], { groove: "drive", lead: "triangle", gate: 1.2 }),
    slow_orbit: song("Slow Orbit", 55, "Cmaj7 Am Fmaj7 G C Em F G Am Em F C Dm F G C", [
      "E5 - G5 - B5 - G5 -",
      "A4 - C5 - E5 - G5 -",
      "A5 - G5 - E5 - C5 -",
      "D5 - B4 - G4 - - -",
      "E5 - G5 - B5 - G5 -",
      "A4 - C5 - E5 - G5 -",
      "A5 - G5 - E5 - C5 -",
      "D5 - B4 - G4 - - -",
      "E5 - G5 - B5 - G5 -",
      "A4 - C5 - E5 - G5 -",
      "A5 - G5 - E5 - C5 -",
      "D5 - B4 - G4 - - -",
      "E5 - G5 - B5 - G5 -",
      "A4 - C5 - E5 - G5 -",
      "A5 - G5 - E5 - C5 -",
      "D5 - B4 - G4 - - -",
    ], { groove: "hush", lead: "triangle", gate: 1.2 }),
    christmas_99: song("Snowfall at the Arcade", 99, "C F G C Am Dm G C F C Dm G F C G C", [
      "E5 G5 C6 G5 E5 - D5 E5",
      "F5 A5 C6 A5 G5 F5 E5 -",
      "D5 G5 B5 D6 C6 B5 A5 G5",
      "E5 D5 C5 E5 G5 - C6 -",
      "E5 G5 C6 G5 E5 - D5 E5",
      "F5 A5 C6 A5 G5 F5 E5 -",
      "D5 G5 B5 D6 C6 B5 A5 G5",
      "E5 D5 C5 E5 G5 - C6 -",
      "E5 G5 C6 G5 E5 - D5 E5",
      "F5 A5 C6 A5 G5 F5 E5 -",
      "D5 G5 B5 D6 C6 B5 A5 G5",
      "E5 D5 C5 E5 G5 - C6 -",
      "E5 G5 C6 G5 E5 - D5 E5",
      "F5 A5 C6 A5 G5 F5 E5 -",
      "D5 G5 B5 D6 C6 B5 A5 G5",
      "E5 D5 C5 E5 G5 - C6 -",
    ], { groove: "skip", lead: "triangle", gate: 1.2 }),
    core_aftermath: song("After the Event Horizon", 92, "Dm Bb F C Dm Gm Bb A Dm F Bb C Gm Bb A Dm", [
      "D4 - A4 D5 F5 - E5 D5",
      "Bb4 - F5 - D5 C5 Bb4 A4",
      "F4 A4 C5 F5 A5 - G5 F5",
      "E5 G5 C6 - G5 E5 D5 -",
      "D4 - A4 D5 F5 - E5 D5",
      "Bb4 - F5 - D5 C5 Bb4 A4",
      "F4 A4 C5 F5 A5 - G5 F5",
      "E5 G5 C6 - G5 E5 D5 -",
      "D4 - A4 D5 F5 - E5 D5",
      "Bb4 - F5 - D5 C5 Bb4 A4",
      "F4 A4 C5 F5 A5 - G5 F5",
      "E5 G5 C6 - G5 E5 D5 -",
      "D4 - A4 D5 F5 - E5 D5",
      "Bb4 - F5 - D5 C5 Bb4 A4",
      "F4 A4 C5 F5 A5 - G5 F5",
      "E5 G5 C6 - G5 E5 D5 -",
    ], { groove: "drive", lead: "triangle", gate: 1.2 }),

    hyperspeed: song("Hyperspeed Hopscotch", 212, "Bm G D A Bm G Em F# Bm D A Em G Em F# Bm", [
      "B4 F#5 B5 A5 F#5 D5 E5 F#5", "G5 D5 B4 D5 G5 A5 B5 D6",
      "F#5 A5 D6 C#6 A5 F#5 E5 D5", "E5 A5 C#6 B5 A5 E5 C#5 -",
      "B5 F#5 D5 F#5 A5 B5 D6 F#6", "G6 D6 B5 A5 G5 D5 B4 -",
      "E5 G5 B5 E6 D6 B5 G5 F#5", "A#5 C#6 F#6 E6 C#6 A#5 F#5 -",
      "B5 - F#5 B5 D6 C#6 B5 A5", "F#5 A5 D6 F#6 E6 D6 A5 -",
      "C#6 B5 A5 E5 A5 B5 C#6 E6", "G6 E6 B5 G5 E5 F#5 G5 B5",
      "D6 B5 G5 D5 G5 A5 B5 D6", "E6 B5 G5 F#5 E5 G5 B5 -",
      "C#6 A#5 F#5 E5 C#5 F#5 A#5 C#6", "B5 A5 F#5 D5 B4 - B5 -",
    ], { groove: "drive", pulse: "narrow", gate: .7, bassGate: .25 }),
    velvet_tokens: song("Velvet Tokens", 99, "Abmaj7 Fm Dbmaj7 Eb Cm Fm Bbm Eb Abmaj7 Cm Dbmaj7 Ab Bbm Db Eb Ab", [
      "C5 - G4 Ab4 - Eb5 C5 -", "Ab4 C5 - Eb5 G5 - F5 -",
      "F5 - Eb5 C5 Db5 - Ab4 -", "Bb4 - G4 Bb4 F5 Eb5 - -",
      "Eb5 G5 - D5 C5 - G4 -", "C5 Ab4 - F4 G4 Ab4 C5 -",
      "Db5 - F5 C5 Bb4 - F4 -", "G4 Bb4 - Eb5 Db5 Bb4 G4 -",
      "Eb5 - C5 G4 Ab4 - C5 Eb5", "G5 - Eb5 D5 C5 - Bb4 -",
      "Ab5 F5 - Eb5 C5 - Db5 -", "Eb5 C5 - Bb4 Ab4 - Eb4 -",
      "F4 Bb4 Db5 - C5 Bb4 F4 -", "Ab4 Db5 F5 - Eb5 C5 Ab4 -",
      "G4 Bb4 Eb5 - F5 Db5 Bb4 G4", "C5 - G4 Ab4 - Eb4 Ab4 -",
    ], { groove: "hush", lead: "triangle", gate: 1.5, bassOctave: 3 }),
    megalo_remix: song("Megalovania — Neon Determination", 168, "Dm Dm C C Bdim Bdim Bb A Dm F C Gm Bb Gm A Dm", [
      "D4 D4 D5 - A4 - - Ab4 - G4 - F4 F4 D4 F4 G4",
      "A4 D5 C5 A4 G4 F4 E4 D4",
      "C4 C4 D5 - A4 - - Ab4 - G4 - F4 F4 D4 F4 G4",
      "E5 G5 E5 D5 C5 G4 E4 -",
      "B3 B3 D5 - A4 - - Ab4 - G4 - F4 F4 D4 F4 G4",
      "F5 D5 B4 F4 Ab4 B4 D5 -",
      "Bb3 D4 F4 A4 D5 C5 A4 F4", "E5 C#5 A4 G4 E4 G4 A4 C#5",
      "D5 A4 D5 F5 E5 D5 A4 -", "A5 F5 C5 A4 C5 E5 F5 -",
      "G5 E5 C5 G4 C5 D5 E5 G5", "Bb5 A5 G5 D5 F5 D5 Bb4 -",
      "F5 D5 Bb4 D5 F5 A5 Bb5 -", "G5 D5 Bb4 G4 A4 Bb4 D5 F5",
      "E5 C#5 A4 C#5 E5 G5 A5 C#6", "D6 A5 F5 E5 D5 - D4 -",
    ], { groove: "drive", pulse: "narrow", gate: .9,
      credit: "Fan remix of MEGALOVANIA (UNDERTALE), composed by Toby Fox." }),
    freedom_remix: song("Freedom Motif — Unbound Carousel", 144, "Em F# B G#m Em B C#m F# Em F# G#m B C#m Em F# B", [
      "B4 - B4 A#4 B4 F#5 A#4 B4", "F#5 - F#5 G#5 F#5 E5 D#5 -",
      "B4 C#5 - G#4 C#5 D#5 E5 D#5", "C#5 - B4 - D#5 F#5 G#5 -",
      "B5 - B5 A#5 B5 F#6 A#5 B5", "D#6 B5 F#5 D#5 F#5 A#5 B5 -",
      "G#5 E5 C#5 D#5 E5 G#5 B5 -", "A#5 F#5 C#5 A#4 C#5 E5 F#5 -",
      "G5 E5 B4 E5 G5 A5 B5 G5", "F#5 A#5 C#6 - B5 A#5 G#5 F#5",
      "B5 G#5 D#5 G#5 A#5 B5 D#6 -", "F#6 D#6 B5 A#5 F#5 D#5 B4 -",
      "E5 G#5 B5 C#6 B5 G#5 E5 -", "G5 B5 E6 D#6 B5 G5 E5 -",
      "C#6 A#5 F#5 E5 C#5 E5 A#5 C#6", "B5 F#5 D#5 C#5 B4 - B5 -",
    ], { groove: "skip", swing: .12, pulse: "narrow", gate: 1.1,
      credit: "Fan remix of the Freedom / THE WORLD REVOLVING motif (DELTARUNE), composed by Toby Fox." }),
    gaster_remix: song("Gaster's Theme — Signal in the Static", 108, "Dm Dm Db Db Cm Cm B B Dm Bb Db A Cm Ab B Dm", [
      "C#5 D5 A5 D5 C#6 D5 A5 D5", "C#5 D5 A5 - D5 A4 D5 -",
      "C5 Db5 Ab5 Db5 C6 Db5 Ab5 Db5", "C5 Db5 Ab5 - Db5 Ab4 Db5 -",
      "B4 C5 G5 C5 B5 C5 G5 C5", "B4 C5 G5 - C5 G4 C5 -",
      "A#4 B4 F#5 B4 A#5 B4 F#5 B4", "A#4 B4 F#5 - B4 F#4 B4 -",
      "D5 A5 F5 E5 C#5 D5 A5 -", "F5 D5 Bb4 D5 F5 A5 Bb5 -",
      "Db5 Ab5 F5 Eb5 C5 Db5 Ab5 -", "E5 C#5 A4 C#5 E5 G5 A5 -",
      "C5 G5 Eb5 D5 B4 C5 G5 -", "Eb5 C5 Ab4 C5 Eb5 G5 Ab5 -",
      "B4 F#5 D#5 C#5 A#4 B4 F#5 -", "C#5 D5 A5 D5 F5 E5 D5 -",
    ], { groove: "hush", lead: "triangle", tremolo: true, gate: 1.6,
      credit: "Fan remix of Gaster's Theme (UNDERTALE), composed by Toby Fox." }),
    sleepy_satellite: song("Sleepy Satellite", 60, "Cmaj7 Am Fmaj7 G Em Am Dm G Cmaj7 Em Fmaj7 C Dm F G C", [
      "E5 - B4 C5 - G5 E5 -", "C5 - E5 B5 - A5 E5 -",
      "A4 C5 - E5 G5 - F5 -", "D5 - B4 D5 A5 G5 - -",
      "G5 - B5 F#5 E5 - B4 -", "E5 C5 - A4 B4 C5 E5 -",
      "F5 - A5 E5 D5 - A4 -", "B4 D5 - G5 F5 D5 B4 -",
      "G5 - E5 B4 C5 - E5 G5", "B5 - G5 F#5 E5 - D5 -",
      "C6 A5 - G5 E5 - F5 -", "G5 E5 - D5 C5 - G4 -",
      "A4 D5 F5 - E5 D5 A4 -", "C5 F5 A5 - G5 E5 C5 -",
      "B4 D5 G5 - A5 F5 D5 B4", "E5 - B4 C5 - G4 C5 -",
    ], { groove: "hush", lead: "triangle", gate: 1.6, bassOctave: 3 }),
    lantern_leap: song("Lantern Leap", 132, "Eb Cm Ab Bb Eb Gm Ab Bb Fm Cm Ab Eb Fm Ab Bb Eb", [
      "G5 - D5 Eb5 Bb5 G5 - F5", "Eb5 C6 G5 - Bb5 G5 Eb5 D5",
      "C5 Eb5 Ab5 - G5 C6 Bb5 Ab5", "D5 F5 - Bb5 A5 Bb5 F5 D5",
      "G5 Bb5 F5 G5 Eb6 - D6 Bb5", "D6 Bb5 G5 D5 F5 G5 Bb5 -",
      "Eb6 C6 Ab5 G5 C6 - Eb5 Ab5", "F5 D5 Bb4 F5 Ab5 G5 F5 -",
      "Ab5 C6 G5 Ab5 F6 Eb6 C6 -", "G5 Eb5 C5 G5 Bb5 C6 D6 Eb6",
      "C6 Ab5 Eb5 C5 Eb5 G5 Ab5 -", "Bb5 G5 Eb5 - D5 Eb5 G5 Bb5",
      "C6 Ab5 F5 Eb5 C5 F5 G5 Ab5", "Eb6 C6 Bb5 Ab5 G5 Eb5 C5 -",
      "D5 F5 Bb5 D6 C6 Ab5 F5 D5", "Eb5 G5 D5 Eb5 Bb5 - Eb6 -",
    ], { groove: "skip", swing: .2, lead: "triangle", gate: 1.15 }),
    copper_comet: song("Copper Comet", 174, "F#m D A E F#m D Bm C# F#m A E B D Bm C# F#m", [
      "F#5 C#6 G#5 A5 - E5 F#5 C#5", "D5 A5 E5 F#5 - C#5 D5 A4",
      "E5 A5 B5 C#6 E6 C#6 B5 -", "G#5 E5 B4 E5 F#5 G#5 B5 D6",
      "C#6 F#5 A5 G#5 F#5 - E5 C#5", "A5 F#5 D5 E5 F#5 A5 C#6 D6",
      "B5 F#5 D5 C#5 B4 D5 E5 F#5", "G#5 E#5 C#5 E#5 G#5 B5 C#6 -",
      "A5 C#6 F#6 E6 C#6 A5 G#5 F#5", "E6 C#6 B5 A5 E5 C#5 E5 -",
      "B5 E6 G#6 F#6 E6 B5 G#5 -", "D#6 B5 F#5 D#5 F#5 A5 B5 -",
      "A5 D6 F#6 E6 D6 A5 F#5 E5", "D6 B5 F#5 E5 D5 C#5 B4 -",
      "E#5 G#5 C#6 B5 G#5 E#5 C#5 E#5", "F#5 C#6 G#5 A5 E5 - F#5 -",
    ], { groove: "pursuit", pulse: "narrow", gate: .75, bassGate: .25 }),
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
    dodge_easy: song("Shellside Stroll", 112, "C G Am F C Em F G Am F C G Dm F G C", [
      "E5 - G5 A5 G5 E5 D5 -", "D5 G5 B5 - A5 G5 D5 -",
      "E5 A5 C6 B5 A5 E5 C5 -", "F5 A5 G5 F5 - E5 C5 -",
      "G5 E5 C5 - D5 E5 G5 -", "B4 E5 G5 A5 G5 E5 D5 -",
      "A5 G5 F5 C5 F5 - G5 A5", "B5 A5 G5 D5 E5 F5 G5 -",
      "C5 E5 A5 - G5 E5 C5 -", "C5 F5 A5 G5 F5 - E5 C5",
      "E5 G5 C6 - B5 A5 G5 E5", "D5 G5 B5 A5 G5 - E5 D5",
      "F5 A5 D6 C6 A5 F5 E5 -", "A5 F5 C5 - D5 F5 G5 A5",
      "G5 B5 D6 B5 A5 G5 F5 D5", "E5 G5 C6 - G5 E5 C5 -",
    ], { groove: "skip", swing: .12, lead: "triangle", gate: 1.05, bassOctave: 3 }),
    dodge_normal: song("Falling Forecast", 132, "Am F Dm E Am G Dm E Am C F E Dm Am E Am", [
      "E5 F5 E5 - A4 C5 B4 A4", "C5 F5 E5 C5 A4 - C5 E5",
      "D5 A4 D5 F5 E5 D5 C5 A4", "B4 E5 G#5 F5 E5 D5 B4 -",
      "A4 C5 E5 A5 G5 E5 D5 C5", "D5 G5 F5 D5 B4 D5 G5 -",
      "A5 F5 E5 D5 A4 C5 D5 F5", "G#5 E5 D5 B4 E5 - G#5 B5",
      "E5 F5 E5 C5 B4 A4 E4 -", "G5 E5 C5 D5 E5 G5 E5 -",
      "A5 F5 E5 C5 A4 C5 F5 E5", "G#5 B5 A5 G#5 E5 D5 B4 -",
      "F5 E5 D5 A4 C5 D5 E5 F5", "E5 C5 A4 B4 C5 E5 D5 C5",
      "B4 D5 E5 G#5 B5 A5 G#5 E5", "A5 E5 C5 A4 B4 G#4 A4 -",
    ], { groove: "classic", gate: .9 }),
    dodge_hard: song("Pressure Current", 156, "Cm Ab Fm G Cm Bdim Ab G Fm Cm Ab G Fm Ab G Cm", [
      "G4 C5 Eb5 C5 F#5 G5 F#5 G5", "Ab5 G5 Eb5 C5 Eb5 G5 Ab5 G5",
      "F5 C5 F5 Ab5 G5 F5 Eb5 C5", "B4 D5 G5 F5 D5 B4 D5 F5",
      "C5 Eb5 G5 C6 B5 G5 Eb5 D5", "B4 D5 F5 B5 A5 F5 D5 B4",
      "Ab5 C6 Ab5 G5 Eb5 C5 Eb5 G5", "B5 G5 F5 D5 B4 D5 F5 G5",
      "F5 G5 Ab5 G5 F5 C5 Eb5 F5", "G5 Eb5 C5 D5 Eb5 F#5 G5 -",
      "Ab5 G5 Eb5 C5 Eb5 G5 Ab5 B5", "B5 D6 B5 G5 F5 D5 B4 G4",
      "Ab5 F5 C5 F5 Ab5 G5 F5 Eb5", "C6 Ab5 G5 Eb5 C5 Eb5 G5 Ab5",
      "B5 G5 F5 D5 G5 F5 D5 B4", "C5 G4 C5 Eb5 G5 F#5 G5 C5",
    ], { groove: "drive", pulse: "narrow", tremolo: true, gate: .8 }),
    dodge_merciless: song("No Safe Shore", 180, "F#m Gdim F#m C#7 F#m D Gdim C#7 F#m Gdim D C#7 Gdim F#m C#7 F#m", [
      "F#4 G4 F#4 C5 F#4 G4 A4 G4", "G4 Bb4 Db5 Bb4 G4 F#4 G4 Db5",
      "F#4 C#5 F#4 G4 A4 G#4 F#4 C5", "C#5 E#5 G#5 B5 G#5 E#5 D5 C#5",
      "F#4 F#4 G4 F#4 C5 B4 A4 G4", "D5 F#5 A5 F#5 E5 D5 C#5 A4",
      "G4 Db5 Bb4 G4 F#4 G4 Bb4 Db5", "C#5 D5 C#5 G#4 B4 G#4 E#4 C#4",
      "F#4 G4 F#4 C5 G4 F#4 E4 C#4", "G4 Bb4 Db5 E5 Db5 Bb4 G4 F#4",
      "D5 C#5 A4 F#4 D4 F#4 A4 C#5", "C#5 E#5 G#5 B5 A5 G#5 E#5 C#5",
      "G4 F#4 G4 Bb4 Db5 Bb4 G4 Db5", "F#4 C5 B4 A4 G4 F#4 G4 F#4",
      "E#5 G#5 B5 G#5 E#5 D5 C#5 E#5", "F#5 C#5 A4 F#4 G4 F#4 C#4 F#4",
    ], { groove: "pursuit", pulse: "narrow", tremolo: true, gate: .7, bassGate: .22 }),
    hangman: song("Letter by Letter", 120, "Fmaj7 C Dm Bb Fmaj7 Am Gm C Dm Am Bb F Gm Bb C F", [
      "A4 - C5 D5 - C5 A4 -", "G4 C5 E5 - D5 C5 G4 -",
      "A4 - F5 E5 D5 - A4 C5", "D5 F5 Bb5 - A5 F5 D5 -",
      "C5 A4 C5 E5 G5 - E5 C5", "E5 C5 A4 - B4 C5 E5 -",
      "Bb4 D5 G5 F5 - D5 Bb4 -", "C5 E5 G5 - F5 D5 C5 -",
      "F5 - E5 D5 A4 C5 D5 -", "E5 C5 A4 C5 E5 - D5 C5",
      "D5 F5 Bb5 A5 F5 D5 C5 -", "C5 A4 F4 A4 C5 D5 C5 -",
      "Bb4 D5 G5 A5 Bb5 A5 G5 D5", "F5 D5 Bb4 - C5 D5 F5 -",
      "E5 G5 C6 Bb5 G5 E5 D5 C5", "A4 C5 F5 - E5 C5 F5 -",
    ], { groove: "hush", lead: "triangle", gate: 1.25, bassOctave: 3 }),
    keyrush: song("Keystroke Sprint", 160, "Em C G D Em Am C B Em G C D Am C B Em", [
      "E5 B5 G5 B5 F#5 G5 E5 -", "G5 E5 C5 E5 G5 A5 G5 -",
      "D5 G5 B5 D6 B5 A5 G5 F#5", "F#5 A5 D6 C6 A5 F#5 E5 D5",
      "E5 G5 B5 E6 D6 B5 G5 E5", "A5 E5 C6 B5 A5 G5 E5 -",
      "G5 C6 E6 D6 C6 G5 E5 G5", "F#5 D#5 B4 D#5 F#5 A5 B5 -",
      "B4 E5 D5 B4 G4 F#4 E4 B3", "D5 G5 B5 G5 A5 B5 A5 G5",
      "E5 G5 C6 B5 A5 G5 E5 -", "F#5 A5 D5 E5 F#5 E5 D5 A4",
      "C6 A5 E5 A5 C6 B5 A5 G5", "G5 E5 C5 E5 G5 C6 B5 A5",
      "F#5 D#5 B4 F#5 A5 F#5 D#5 B4", "E5 G5 B5 E6 B5 G5 E5 -",
    ], { groove: "drive", pulse: "narrow", gate: .85 }),
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
  const bossTracks = [
    { id: "boss_mean", difficulty: "mean", title: "First Blood Circuit", bpm: 128,
      drive: 2, chugs: 8, hats: 8, palmMute: .42,
      roots: [40, 43, 45, 40, 36, 43, 38, 35], kicks: [0, 1.5, 2, 3],
      riffs: [[0, 3, 5, 7, 5, 3, 0, null], [0, 0, 7, 5, 3, 0, 2, 3],
        [12, 10, 7, 10, 12, null, 15, 12], [7, 10, 12, 7, 5, 3, 2, 0]] },
    { id: "boss_cruel", difficulty: "cruel", title: "Iron Verdict", bpm: 148,
      drive: 3, chugs: 8, hats: 16, palmMute: .32,
      roots: [38, 38, 41, 43, 38, 36, 34, 37], kicks: [0, .5, 1.5, 2, 2.75, 3.5],
      riffs: [[0, 0, 1, 0, 7, 5, 3, 0], [7, 6, 5, 3, 0, null, 3, 5],
        [12, 13, 12, 7, 10, 12, 15, 13], [7, 10, 13, 12, 10, 7, 6, 0]] },
    { id: "boss_nightmare", difficulty: "nightmare", title: "Nightmare Engine", bpm: 168,
      drive: 4.2, chugs: 16, hats: 16, palmMute: .18,
      roots: [36, 37, 36, 31, 32, 36, 35, 31], kicks: [0, .25, .75, 1.5, 2, 2.25, 2.75, 3.5],
      riffs: [[0, 0, 1, 7, 0, 6, 5, 1], [0, 3, 1, 0, 6, 7, 6, 0],
        [12, 13, 12, 6, 7, 10, 13, 12], [7, 6, 3, 1, 0, 1, 6, 7]] },
    { id: "boss_impossible", difficulty: "impossible", title: "Crown of Ruin", bpm: 188,
      drive: 5, chugs: 16, hats: 16, palmMute: .20,
      roots: [38, 34, 43, 45, 38, 41, 34, 45], kicks: [0, .25, .5, 1, 1.5, 2, 2.25, 2.5, 3, 3.5],
      // The King's opening D-minor hook, played by a tight guitar/bass/drum band.
      riffs: [scores.pumpkin.melody[0].map(pitch => pitch ? pitch - 62 : null),
        [12, 11, 12, 15, 19, 18, 15, 12], [12, 15, 19, 24, 19, 15, 12, 11],
        [19, 18, 15, 12, 11, 12, 15, 19]] },
  ].map(track => Object.freeze({ ...track, loop: true }));
  const impossibleRemix = Object.freeze({
    ...bossTracks.find(track => track.id === "boss_impossible"),
    id: "dodge_impossible", title: "Crown of Ruin — Undertow Remix", bpm: 204,
    drive: 4.6, palmMute: .14,
    roots: [38, 34, 43, 45, 41, 38, 34, 45],
    kicks: [0, .5, .75, 1.5, 2, 2.5, 2.75, 3.25, 3.5],
    riffs: [bossTracks[3].riffs[0], [12, 15, 19, 12, 24, 19, 18, 15],
      [24, 23, 24, 27, 31, 30, 27, 24], [19, 15, 12, 11, 12, 19, 18, 12]],
  });
  const dodgeTracks = Object.freeze([
    ...Object.entries(scores).filter(([id]) => id.startsWith("dodge_"))
      .map(([id, score]) => Object.freeze({ id, difficulty: id.slice(6), title: score.title, bpm: score.bpm })),
    impossibleRemix,
  ]);
  // Original electronic arena scores: individual hooks, harmony and drum feels.
  // Thirty-two bars each: opening, main hook, breakdown, then a lifted reprise.
  const geomayhemTracks = [
    { title: "Mint Condition", bpm: 124, root: 48, color: "#71f5d2", groove: "dance",
      harmony: [0, 9, 5, 7], minor: false, bell: .7,
      hook: [12,16,19,0,21,19,16,14], reply: [19,16,14,12,0,9,14,16] },
    { title: "Molten Momentum", bpm: 132, root: 38, color: "#ffba69", groove: "stomp",
      harmony: [0, 0, 8, 7], minor: true, bell: 1.8,
      hook: [12,0,12,15,19,17,15,0], reply: [19,18,17,15,12,0,10,12] },
    { title: "Ultraviolet Signal", bpm: 138, root: 45, color: "#b695ff", groove: "breaks",
      harmony: [0, 3, 10, 5], minor: true, bell: 2.5,
      hook: [19,12,0,15,22,19,17,15], reply: [24,22,19,0,17,19,15,12] },
    { title: "Icebound Velocity", bpm: 118, root: 50, color: "#a9edff", groove: "breaks",
      harmony: [0, 8, 3, 10], minor: true, bell: 3,
      hook: [24,0,19,17,0,15,19,22], reply: [27,24,22,19,17,0,14,12] },
    { title: "Heart of the Reactor", bpm: 142, root: 41, color: "#ff8fa5", groove: "dance",
      harmony: [0, 8, 3, 7], minor: true, bell: 1.1,
      hook: [12,15,19,22,0,19,24,22], reply: [19,17,15,12,15,17,19,0] },
    { title: "Livewire Lockdown", bpm: 156, root: 42, color: "#f9ff72", groove: "breaks",
      harmony: [0, 10, 5, 7], minor: true, bell: 2,
      hook: [12,12,0,19,15,12,22,19], reply: [24,22,24,19,0,18,15,12] },
    { title: "Ashphalt Rush", bpm: 148, root: 40, color: "#ff7968", groove: "stomp",
      harmony: [0, 3, 5, 10], minor: true, bell: 1.5,
      hook: [12,15,17,18,19,0,17,15], reply: [22,19,17,15,12,10,12,0] },
    { title: "Moonmaze", bpm: 126, root: 47, color: "#becaff", groove: "breaks",
      harmony: [0, 5, 8, 7], minor: true, bell: 2.8,
      hook: [12,0,19,22,17,0,15,14], reply: [24,22,0,19,15,17,14,12] },
    { title: "Spectrum Shatter", bpm: 162, root: 48, color: "#ff9ed9", groove: "dance",
      harmony: [0, 5, 9, 7], minor: false, bell: 2.2,
      hook: [12,19,16,24,21,19,0,16], reply: [28,26,24,19,21,16,14,19] },
    { title: "Critical Geometry", bpm: 174, root: 38, color: "#ffffff", groove: "breaks",
      harmony: [0, 8, 5, 7], minor: true, bell: 1.7,
      hook: [12,0,13,12,19,18,15,12], reply: [24,22,19,18,19,15,13,12] },
    {"title": "Undertow Overture", "bpm": 128, "root": 43, "color": "#7ee4e1", "groove": "breaks", "harmony": [0, 5, 8, 3], "minor": true, "bell": 2.7, "hook": [12, 19, 0, 22, 19, 15, 17, 0], "reply": [24, 19, 22, 17, 15, 12, 10, 14]},
    {"title": "Tick Tock Takedown", "bpm": 136, "root": 46, "color": "#f3ce83", "groove": "stomp", "harmony": [0, 7, 3, 8], "minor": true, "bell": 1.9, "hook": [12, 0, 19, 0, 15, 14, 12, 19], "reply": [24, 0, 22, 19, 18, 15, 14, 12]},
    {"title": "Verdant Voltage", "bpm": 140, "root": 48, "color": "#94e68d", "groove": "dance", "harmony": [0, 5, 7, 9], "minor": false, "bell": 1.2, "hook": [12, 16, 0, 19, 21, 24, 19, 16], "reply": [28, 24, 21, 0, 19, 16, 14, 12]},
    {"title": "Black Glass Beat", "bpm": 152, "root": 37, "color": "#ec9166", "groove": "stomp", "harmony": [0, 8, 7, 5], "minor": true, "bell": 1.6, "hook": [12, 13, 0, 19, 18, 0, 15, 12], "reply": [24, 19, 18, 15, 13, 12, 0, 7]},
    {"title": "Polar Parallax", "bpm": 130, "root": 51, "color": "#9ef2dc", "groove": "breaks", "harmony": [0, 3, 8, 10], "minor": true, "bell": 3.2, "hook": [24, 19, 0, 27, 22, 0, 19, 17], "reply": [31, 27, 24, 22, 0, 19, 15, 12]},
    {"title": "Chromatic Overdrive", "bpm": 168, "root": 42, "color": "#fc91da", "groove": "dance", "harmony": [0, 10, 8, 7], "minor": true, "bell": 1.4, "hook": [12, 19, 12, 22, 19, 24, 22, 19], "reply": [27, 24, 22, 19, 18, 19, 15, 12]},
    {"title": "Pages Below", "bpm": 122, "root": 45, "color": "#93c5ee", "groove": "breaks", "harmony": [0, 5, 3, 7], "minor": true, "bell": 2.9, "hook": [12, 0, 15, 22, 0, 19, 17, 14], "reply": [24, 22, 17, 0, 19, 15, 14, 10]},
    {"title": "Gilded Illusion", "bpm": 146, "root": 41, "color": "#e8cc9b", "groove": "dance", "harmony": [0, 8, 7, 0], "minor": true, "bell": 2.3, "hook": [12, 13, 16, 19, 0, 20, 19, 16], "reply": [24, 25, 24, 20, 19, 16, 13, 12]},
    {"title": "Hymn of the Hollow", "bpm": 144, "root": 36, "color": "#c0a7f5", "groove": "stomp", "harmony": [0, 3, 8, 5], "minor": true, "bell": 2.6, "hook": [12, 0, 19, 15, 0, 22, 18, 12], "reply": [24, 27, 22, 19, 18, 15, 12, 0]},
    {"title": "Crowned in Infinity", "bpm": 178, "root": 43, "color": "#ffe5a6", "groove": "breaks", "harmony": [0, 8, 3, 7], "minor": true, "bell": 2.1, "hook": [12, 19, 24, 22, 19, 15, 18, 19], "reply": [31, 27, 24, 22, 19, 18, 15, 12]},
  ].map((track, i) => Object.freeze({ ...track, id: `geomayhem_level_${i + 1}`, level: i + 1 }));

  function composeGeomayhem(track, sampleRate, notes) {
    const beat = 60 / track.bpm, duration = 128 * beat;
    const out = new Float32Array(Math.round(duration * sampleRate));
    const cache = new Map();
    function voice(pitch, start, length, gain, kind) {
      const key = `${pitch}:${length}:${kind}`;
      if (!cache.has(key)) {
        const data = new Float32Array(Math.ceil(length * sampleRate));
        const hz = 440 * 2 ** ((pitch - 69) / 12);
        for (let i = 0; i < data.length; i++) {
          const t = i / sampleRate, phase = 2 * Math.PI * hz * t;
          const envelope = Math.max(0, Math.min(1, t / .008, (length - t) / .045));
          // Rounded FM keys, warm pads and a firm sub bass; no pulse oscillators.
          const wave = kind === "bass" ? Math.sin(phase) + .22 * Math.sin(2 * phase)
            : kind === "pad" ? (Math.sin(phase) + .3 * Math.sin(phase * 1.003)) * .55
            : Math.sin(phase + track.bell * Math.exp(-t * 8) * Math.sin(phase * 2));
          data[i] = wave * envelope * (kind === "lead" ? Math.exp(-t * 3) : 1);
        }
        cache.set(key, data);
      }
      const data = cache.get(key), offset = Math.round(start * sampleRate);
      for (let i = 0; i < data.length && offset + i < out.length; i++) out[offset + i] += data[i] * gain;
      if (kind === "lead") notes.push({ start, duration: length });
    }
    let seed = 4739 + track.level;
    function drum(start, kind, gain = 1) {
      const length = kind === "hat" ? .045 : .19, offset = Math.round(start * sampleRate);
      let last = 0;
      for (let i = 0; i < length * sampleRate && offset + i < out.length; i++) {
        const t = i / sampleRate;
        seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0;
        const noise = seed / 2147483648 - 1;
        const wave = kind === "kick" ? Math.sin(2 * Math.PI * (48 * t + 3 * (1 - Math.exp(-t * 38))))
          : kind === "hat" ? (noise - last) * .2 : noise * .5 + Math.sin(2 * Math.PI * 180 * t) * .2;
        out[offset + i] += wave * Math.min(1, t / .002) * Math.exp(-t / length * 6) * gain * .4;
        last = noise;
      }
    }
    for (let bar = 0; bar < 32; bar++) {
      const start = bar * 4 * beat, breakdown = bar >= 16 && bar < 20;
      const root = track.root + track.harmony[bar % 4];
      const third = track.minor ? 3 : 4;
      for (const interval of [0, third, 7]) voice(root + 12 + interval, start, beat * 3.9, .045, "pad");
      const motif = bar % 8 < 4 ? track.hook : track.reply;
      motif.forEach((n, i) => {
        if (!n || (bar < 4 && i % 2) || (breakdown && i % 2)) return;
        const pitch = track.root + n + (bar >= 24 ? 12 : 0);
        voice(pitch, start + i * beat / 2, beat * .65, .2, "lead");
        // Quiet dotted-eighth echoes add space without obscuring the hook.
        voice(pitch, start + (i / 2 + .75) * beat, beat * .45, .045, "echo");
      });
      for (let i = 0; i < 8; i++) {
        voice(root + (i % 4 === 3 ? 7 : 0), start + i * beat / 2, beat * .38, breakdown ? .09 : .18, "bass");
        if (!breakdown) drum(start + i * beat / 2, "hat", i % 2 ? .5 : .3);
      }
      const kicks = breakdown ? [0] : track.groove === "dance" ? [0,1,2,3]
        : track.groove === "stomp" ? [0,.75,2,2.5] : [0,1.5,2.75];
      kicks.forEach(n => drum(start + n * beat, "kick"));
      if (!breakdown) {
        [1,3].forEach(n => drum(start + n * beat, "snare", .7));
        if (bar % 8 === 7) [3.25,3.5,3.75].forEach(n => drum(start + n * beat, "snare", .35));
      }
    }
    let peak = .82;
    for (const value of out) peak = Math.max(peak, Math.abs(value));
    for (let i = 0; i < out.length; i++) out[i] *= .82 / peak
      * Math.min(1, i / (sampleRate * .008), (out.length - 1 - i) / (sampleRate * .015));
    return out;
  }
  // New arcade originals: eight-bar themes return before the lifted reprise.
  const arcadeExpansion = [
    ["starlight_soda", "Starlight Soda", 132, "C Am F G C Em F G", [
      "E5 G5 - C6 B5 G5 E5 -", "A5 E5 C5 E5 G5 A5 C6 -",
      "F5 A5 C6 A5 G5 F5 E5 C5", "D5 G5 B5 D6 C6 B5 G5 -",
      "C6 - G5 E5 D5 E5 G5 A5", "B5 G5 E5 - F#5 G5 B5 -",
      "A5 C6 D6 C6 A5 G5 F5 -", "G5 B5 D6 B5 A5 G5 C6 -",
    ], {groove:"skip", swing:.1, lead:"triangle"}],
    ["comet_courier", "Comet Courier", 172, "Em C G D Em Am B Em", [
      "E5 B5 G5 E5 F#5 G5 B5 E6", "G5 E5 C5 D5 E5 G5 C6 B5",
      "D6 B5 G5 A5 B5 D6 G6 D6", "F#5 A5 D6 C6 A5 F#5 E5 D5",
      "E5 G5 B5 E6 D6 B5 G5 F#5", "A5 E5 A5 C6 B5 A5 G5 E5",
      "F#5 B5 D#6 B5 A5 F#5 D#5 B4", "E5 F#5 G5 B5 E6 B5 E5 -",
    ], {groove:"drive", gate:.85}],
    ["lavender_lobby", "Lavender Lobby", 88, "Fmaj7 Am Dm Bb Gm C Fmaj7 C", [
      "A4 - C5 E5 - C5 A4 -", "E5 - C5 - B4 A4 C5 -",
      "F5 E5 D5 - A4 - D5 -", "D5 F5 - A5 F5 D5 C5 -",
      "Bb4 - D5 G5 - F5 D5 -", "E5 G5 - C6 B5 G5 E5 -",
      "A5 G5 E5 C5 - A4 C5 -", "G4 - C5 E5 D5 - C5 -",
    ], {groove:"hush", lead:"triangle", gate:1.2, bassOctave:3}],
    ["copper_carousel", "Copper Carousel", 120, "Dm A7 Dm Gm Bb F A7 Dm", [
      "D5 F5 A5 F5 E5 D5 C#5 E5", "C#5 E5 G5 A5 G5 E5 C#5 -",
      "A5 F5 D5 F5 A5 C6 A5 F5", "G5 Bb5 D6 Bb5 A5 G5 F5 D5",
      "F5 Bb5 A5 F5 D5 F5 Bb5 -", "A5 G5 F5 C5 F5 A5 C6 -",
      "E5 G5 A5 C#6 A5 G5 E5 C#5", "D5 A5 F5 E5 D5 - D6 -",
    ], {groove:"skip", swing:.16}],
    ["laser_lemonade", "Laser Lemonade", 148, "A D F#m E A Bm D E", [
      "A5 E5 C#5 E5 A5 - B5 C#6", "D6 A5 F#5 A5 G#5 F#5 E5 -",
      "C#6 A5 F#5 C#5 F#5 A5 C#6 E6", "B5 G#5 E5 G#5 B5 A5 G#5 E5",
      "E6 C#6 A5 E5 F#5 G#5 A5 -", "F#5 B5 D6 B5 A5 F#5 D5 -",
      "A5 D6 C#6 A5 F#5 E5 D5 F#5", "G#5 B5 E6 D6 B5 G#5 A5 -",
    ], {groove:"drive", gate:.9}],
    ["cloudsave_cruise", "Cloudsave Cruise", 104, "Gmaj7 Em C D Gmaj7 Bm Am D", [
      "B4 D5 F#5 - A5 F#5 D5 -", "G5 E5 B4 - D5 E5 G5 -",
      "E5 G5 C6 - B5 G5 E5 -", "F#5 A5 D6 C6 A5 F#5 E5 D5",
      "D5 G5 B5 A5 F#5 D5 B4 -", "F#5 D5 B4 D5 F#5 A5 B5 -",
      "C6 B5 A5 G5 E5 C5 A4 -", "A4 D5 F#5 A5 G5 F#5 G5 -",
    ], {groove:"hush", lead:"triangle", gate:1.1}],
    ["midnight_pinball", "Midnight Pinball", 158, "Cm Fm Ab G Cm Eb Fm G", [
      "C5 G5 Eb5 G5 Bb5 G5 Eb5 D5", "F5 C6 Ab5 F5 G5 Ab5 C6 -",
      "Ab5 C6 Eb6 C6 Bb5 Ab5 G5 Eb5", "B4 D5 G5 B5 D6 B5 G5 F5",
      "C6 Bb5 G5 Eb5 D5 Eb5 G5 C6", "G5 Bb5 Eb6 D6 Bb5 G5 F5 Eb5",
      "Ab5 G5 F5 C5 F5 Ab5 G5 F5", "D5 G5 B5 D6 B5 G5 C6 -",
    ], {groove:"drive", pulse:"narrow", gate:.8}],
    ["prism_picnic", "Prism Picnic", 116, "Bb F Gm Eb Bb Dm Cm F", [
      "D5 F5 Bb5 A5 F5 D5 C5 -", "A4 C5 F5 G5 A5 G5 F5 -",
      "Bb5 G5 D5 G5 A5 Bb5 D6 -", "G5 Eb5 Bb4 Eb5 G5 Bb5 C6 Bb5",
      "F5 Bb5 D6 C6 Bb5 A5 F5 D5", "A5 F5 D5 E5 F5 A5 C6 -",
      "Eb5 G5 C6 Bb5 G5 Eb5 D5 C5", "C5 F5 A5 C6 Bb5 A5 Bb5 -",
    ], {groove:"skip", lead:"triangle", swing:.08}],
    ["bonus_round_boulevard", "Bonus Round Boulevard", 140, "D Bm G A D F#m Em A", [
      "F#5 A5 D6 - C#6 A5 F#5 E5", "D5 F#5 B5 A5 F#5 D5 B4 -",
      "B4 D5 G5 A5 B5 D6 B5 G5", "C#5 E5 A5 B5 C#6 B5 A5 -",
      "D6 A5 F#5 D5 E5 F#5 A5 D6", "C#6 A5 F#5 E5 F#5 A5 C#6 -",
      "G5 B5 E6 D6 B5 G5 F#5 E5", "E5 A5 C#6 E6 D6 C#6 D6 -",
    ], {groove:"classic", gate:1.05}],
    ["aurora_afterparty", "Aurora Afterparty", 126, "Am F C G Am Dm F E7", [
      "A4 E5 A5 - C6 B5 A5 E5", "F5 C6 A5 G5 F5 E5 C5 -",
      "G5 E5 C5 E5 G5 C6 B5 G5", "B5 A5 G5 D5 E5 G5 B5 -",
      "C6 E6 C6 A5 G5 E5 C5 A4", "A5 D6 F6 E6 D6 A5 F5 -",
      "C6 A5 F5 A5 G5 F5 E5 C5", "B4 E5 G#5 B5 A5 G#5 A5 -",
    ], {groove:"skip", swing:.12, lead:"triangle"}],
  ];
  for (const [id, title, bpm, progression, bars, options] of arcadeExpansion) {
    scores[id] = song(title, bpm, `${progression} ${progression}`, [...bars, ...bars], options);
  }
  // Sixteen authored bars per piece: opening motif, answer, contrast, resolution.
  // song() adds a second chorus with the existing answering voice and octave lift.
  const arcadeJourneys = [
    ["neon_daybreak", "Neon Daybreak", 136, "E B C#m A E G#m F#m B C#m A E B F#m A B E", [
      "E5 G#5 B5 - F#5 E5 B4 -", "D#5 F#5 B5 A5 F#5 D#5 B4 -",
      "E5 G#5 C#6 B5 G#5 E5 D#5 -", "C#5 E5 A5 B5 C#6 A5 E5 -",
      "B5 G#5 E5 F#5 G#5 B5 E6 -", "D#6 B5 G#5 F#5 D#5 B4 D#5 -",
      "F#5 A5 C#6 E6 C#6 A5 G#5 F#5", "D#5 F#5 A5 B5 D#6 B5 F#5 -",
      "C#6 G#5 E5 G#5 B5 C#6 E6 -", "E6 C#6 A5 G#5 E5 C#5 E5 -",
      "G#5 B5 E6 F#6 E6 B5 G#5 -", "F#6 D#6 B5 A5 F#5 D#5 B4 -",
      "A5 C#6 E6 C#6 A5 G#5 F#5 -", "E5 A5 C#6 B5 A5 E5 C#5 -",
      "D#5 F#5 B5 D#6 F#6 E6 D#6 B5", "G#5 F#5 E5 B4 E5 - E6 -",
    ], {groove:"drive", lead:"triangle", gate:.85, swing:.04}],
    ["compass_rose", "Compass Rose", 124, "D G Bm A D F#m G A Bm G Em A G D A D", [
      "D5 - A5 F#5 E5 - F#5 A5", "B5 A5 G5 - D5 G5 A5 -",
      "F#5 B5 D6 B5 A5 F#5 E5 D5", "C#5 E5 A5 - G5 E5 C#5 -",
      "F#5 A5 D6 - A5 F#5 E5 D5", "C#5 F#5 A5 C#6 B5 A5 F#5 -",
      "G5 A5 B5 D6 B5 A5 G5 -", "E5 F#5 E5 C#5 A4 - A5 -",
      "B4 D5 F#5 - A5 F#5 D5 B4", "D5 G5 B5 - A5 G5 D5 -",
      "E5 G5 B5 D6 E6 D6 B5 G5", "A5 C#6 E6 - D6 C#6 B5 A5",
      "G5 B5 D6 B5 A5 G5 F#5 E5", "F#5 E5 D5 A4 D5 F#5 A5 -",
      "E5 A5 C#6 B5 A5 G5 E5 C#5", "D5 F#5 A5 D6 A5 - D5 -",
    ], {groove:"classic", gate:1.05}],
    ["jellyfish_jam", "Jellyfish Jam", 96, "Dm7 Gm7 C Fmaj7 Bb Gm A7 Dm Dm7 Am Bb F Gm Dm A7 Dm", [
      "D5 - F5 - A5 G5 F5 -", "G5 - D5 F5 - Bb5 A5 -",
      "G5 E5 - C5 E5 - G5 -", "A5 - G5 E5 C5 - A4 -",
      "D5 F5 - Bb5 A5 F5 - D5", "Bb4 - D5 G5 F5 - D5 -",
      "C#5 E5 - G5 A5 - G5 E5", "F5 E5 D5 - A4 - D5 -",
      "A5 C6 - A5 F5 E5 D5 -", "E5 - A5 C6 B5 - A5 -",
      "F5 Bb5 D6 - C6 Bb5 A5 F5", "E5 - F5 A5 C6 - A5 -",
      "D6 Bb5 G5 - F5 D5 Bb4 -", "A4 D5 F5 A5 G5 - F5 -",
      "E5 G5 C#6 - B5 A5 G5 E5", "D5 - A5 - F5 E5 D5 -",
    ], {groove:"hush", lead:"triangle", gate:1.25, bassOctave:3}],
    ["kite_runner", "Kite Runner", 164, "G D Em C G Bm C D Em C Am D C G D G", [
      "G5 D5 G5 A5 B5 - D6 B5", "A5 F#5 D5 F#5 A5 B5 A5 -",
      "G5 B5 E6 D6 B5 G5 E5 -", "E5 G5 C6 B5 A5 G5 E5 C5",
      "D5 G5 B5 D6 G6 D6 B5 A5", "F#5 B5 D6 C6 B5 A5 F#5 -",
      "G5 C6 E6 D6 C6 B5 A5 G5", "F#5 A5 D6 A5 F#5 E5 D5 -",
      "E5 - G5 B5 E6 B5 G5 E5", "C5 E5 G5 C6 B5 A5 G5 -",
      "A5 C6 E6 C6 B5 A5 G5 E5", "F#5 A5 C6 D6 C6 A5 F#5 -",
      "E6 D6 C6 G5 E5 G5 C6 -", "D6 B5 G5 D5 E5 G5 B5 -",
      "A5 D6 C6 A5 F#5 A5 D6 F#6", "G6 D6 B5 G5 A5 F#5 G5 -",
    ], {groove:"drive", lead:"triangle", gate:.82}],
    ["sands_of_time", "Sands of Time", 112, "Am E7 Am Dm F C Dm E7 Am G F E7 Dm Am E7 Am", [
      "A4 - E5 - A4 B4 C5 -", "B4 - G#4 - E5 D5 B4 -",
      "C5 E5 A5 - G5 E5 C5 -", "D5 F5 A5 F5 E5 D5 C5 -",
      "F5 - C5 A4 C5 F5 G5 A5", "G5 E5 C5 - B4 C5 E5 -",
      "A5 F5 D5 A4 D5 F5 E5 D5", "B4 D5 E5 G#5 B5 A5 G#5 -",
      "E5 A5 C6 B5 A5 - E5 -", "D5 G5 B5 A5 G5 - D5 -",
      "C5 F5 A5 G5 F5 - C5 -", "B4 E5 G#5 A5 B5 - G#5 -",
      "D6 A5 F5 D5 E5 F5 A5 -", "C6 B5 A5 E5 C5 B4 A4 -",
      "G#4 B4 D5 E5 G#5 B5 E6 -", "A5 E5 C5 B4 A4 - A4 -",
    ], {groove:"classic", pulse:"narrow", gate:.72, bassGate:.26}],
    ["tape_deck_daydream", "Tape Deck Daydream", 84, "Ebmaj7 Cm Abmaj7 Bb Ebmaj7 Gm Fm Bb Cm Gm Abmaj7 Eb Fm Ab Bb Ebmaj7", [
      "G4 - Bb4 D5 - Bb4 G4 -", "Eb5 - D5 C5 G4 - Bb4 -",
      "C5 Eb5 G5 - Eb5 C5 Bb4 -", "D5 - F5 D5 C5 Bb4 - -",
      "Bb4 G4 Bb4 D5 F5 - D5 -", "D5 Bb4 G4 - A4 Bb4 D5 -",
      "Ab4 C5 Eb5 G5 F5 - Eb5 C5", "D5 F5 Bb5 - A5 F5 D5 -",
      "G5 Eb5 C5 - Bb4 G4 C5 -", "Bb4 D5 G5 F5 D5 - Bb4 -",
      "C5 - Eb5 G5 Bb5 G5 Eb5 -", "G5 F5 Eb5 Bb4 G4 - Bb4 -",
      "Ab4 C5 F5 Ab5 G5 F5 Eb5 -", "G5 Eb5 C5 Bb4 Ab4 - C5 -",
      "D5 F5 Ab5 F5 D5 C5 Bb4 -", "G4 Bb4 Eb5 - D5 Bb4 Eb5 -",
    ], {groove:"hush", swing:.18, lead:"triangle", gate:1.18, bassOctave:3}],
    ["mushroom_meadow", "Mushroom Meadow", 108, "F C Dm Bb F Am Gm C Bb F Gm A7 Dm Bb C F", [
      "F5 A5 - G5 F5 - C5 -", "E5 G5 - E5 D5 C5 E5 -",
      "F5 A5 D6 - C6 A5 F5 -", "Bb5 A5 F5 D5 F5 - Bb5 -",
      "A5 G5 F5 - C5 F5 A5 -", "E5 A5 C6 B5 A5 - G5 E5",
      "G5 Bb5 A5 G5 F5 D5 Bb4 -", "C5 E5 G5 - F5 E5 C5 -",
      "D5 F5 Bb5 - A5 G5 F5 D5", "C5 F5 A5 C6 A5 G5 F5 -",
      "Bb5 A5 G5 D5 G5 Bb5 D6 -", "C#6 A5 G5 E5 C#5 E5 A5 -",
      "D6 C6 A5 F5 D5 - F5 A5", "Bb5 F5 D5 F5 A5 - Bb5 -",
      "G5 E5 C5 D5 E5 G5 C6 Bb5", "A5 G5 F5 C5 A4 C5 F5 -",
    ], {groove:"skip", swing:.2, lead:"triangle", gate:.95}],
    ["last_train_to_neon", "Last Train to Neon", 176, "F#m D A E F#m Bm D C#7 F#m A D E Bm D C#7 F#m", [
      "F#4 C#5 F#4 A4 C#5 A4 F#4 C#5", "D5 A4 D5 F#5 A5 F#5 E5 D5",
      "E5 A5 C#6 B5 A5 E5 C#5 E5", "G#5 B5 E6 D6 B5 G#5 E5 -",
      "F#5 C#6 A5 F#5 G#5 A5 C#6 E6", "D6 B5 F#5 D5 F#5 B5 D6 -",
      "A5 F#5 D5 A4 D5 F#5 A5 D6", "E#5 G#5 B5 C#6 B5 G#5 E#5 -",
      "F#5 - C#6 A5 F#5 E5 C#5 -", "E5 A5 C#6 E6 C#6 B5 A5 -",
      "F#5 A5 D6 F#6 E6 D6 A5 F#5", "G#5 B5 E6 F#6 E6 D6 B5 G#5",
      "B5 A5 F#5 D5 B4 D5 F#5 B5", "A5 F#5 D5 E5 F#5 A5 D6 -",
      "C#6 B5 G#5 E#5 C#5 E#5 G#5 B5", "A5 G#5 F#5 C#5 F#5 - F#4 -",
    ], {groove:"pursuit", pulse:"narrow", gate:.78, bassGate:.2}],
    ["snowglobe_shuffle", "Snowglobe Shuffle", 118, "Cmaj7 Fmaj7 Em Am Dm G C G Am Em F C Dm F G Cmaj7", [
      "E5 - G5 B5 G5 - E5 -", "A5 G5 E5 C5 F5 - A5 -",
      "B5 G5 E5 - D5 E5 G5 -", "C6 B5 A5 E5 C5 - E5 -",
      "F5 A5 D6 C6 A5 F5 E5 -", "D5 G5 B5 - A5 G5 D5 -",
      "E5 G5 C6 G5 E5 D5 C5 -", "B4 D5 G5 A5 B5 - D6 -",
      "E6 C6 A5 - G5 E5 C5 -", "B5 G5 E5 D5 E5 - G5 -",
      "A5 C6 E6 D6 C6 A5 G5 F5", "G5 E5 C5 E5 G5 B5 C6 -",
      "D6 C6 A5 F5 E5 D5 A4 -", "C5 F5 A5 C6 A5 G5 F5 -",
      "B5 A5 G5 D5 F5 E5 D5 B4", "C5 E5 G5 B5 C6 - C5 -",
    ], {groove:"skip", swing:.14, lead:"triangle", gate:.8}],
    ["anchor_point", "Anchor Point", 100, "Cm Ab Eb Bb Cm Fm G Cm Ab Eb Fm G Cm Ab G Cm", [
      "C4 - G4 - C5 Eb5 G5 -", "Ab4 C5 Eb5 - C5 Ab4 G4 -",
      "G4 Bb4 Eb5 G5 F5 Eb5 Bb4 -", "F4 Bb4 D5 F5 Eb5 D5 Bb4 -",
      "C5 G4 Eb4 G4 C5 - Eb5 -", "F4 C5 Ab5 G5 F5 Eb5 C5 -",
      "B4 D5 G5 - F5 D5 B4 G4", "C5 Eb5 G5 Eb5 D5 C5 G4 -",
      "Ab5 G5 Eb5 C5 Ab4 - C5 -", "G5 F5 Eb5 Bb4 G4 Bb4 Eb5 -",
      "Ab4 C5 F5 Ab5 G5 F5 Eb5 C5", "D5 G5 B5 D6 C6 B5 G5 -",
      "Eb5 G5 C6 Bb5 G5 Eb5 D5 C5", "C5 Eb5 Ab5 G5 Eb5 C5 Ab4 -",
      "B4 D5 F5 G5 B5 G5 D5 B4", "C5 G4 Eb4 G4 C5 - C4 -",
    ], {groove:"classic", lead:"triangle", gate:1.3, bassGate:.65}],
    ["butterfly_byte", "Butterfly Byte", 152, "A E F#m D A C#m Bm E F#m D Bm E D A E A", [
      "A5 - C#6 B5 A5 E5 - C#5", "B5 G#5 - E5 F#5 G#5 B5 -",
      "C#6 A5 F#5 - A5 C#6 E6 C#6", "D6 A5 - F#5 G#5 A5 D6 -",
      "C#6 E6 A6 E6 C#6 B5 A5 -", "G#5 E5 C#5 E5 G#5 B5 C#6 -",
      "F#5 B5 D6 - C#6 B5 A5 F#5", "G#5 B5 E6 D6 B5 G#5 E5 -",
      "F#5 A5 - C#6 A5 F#5 E5 -", "D5 F#5 A5 D6 C#6 A5 F#5 -",
      "B5 D6 F#6 E6 D6 B5 A5 F#5", "G#5 B5 D6 E6 F#6 E6 B5 -",
      "A5 D6 F#6 D6 A5 F#5 E5 D5", "C#5 E5 A5 C#6 B5 A5 E5 -",
      "B5 G#5 E5 G#5 B5 D6 C#6 B5", "A5 C#6 E6 C#6 B5 G#5 A5 -",
    ], {groove:"skip", swing:.06, gate:.75}],
  ];
  arcadeJourneys.push(
    ["treasure_trove","Treasure Trove — Gilded Tides",112,"Dm C Bb A Dm F C A Gm Dm Bb A Dm C A Dm",[
      "D5 - F5 A5 A5 - G5 F5","E5 G5 - E5 C5 - G4 -",
      "D5 F5 Bb5 - A5 F5 D5 -","C#5 E5 A5 - G5 E5 C#5 -",
      "D5 - A4 D5 F5 - A5 C6","A5 F5 - C5 F5 A5 G5 -",
      "G5 E5 C5 - E5 G5 C6 -","Bb5 A5 G5 E5 C#5 - A4 -",
      "G5 - Bb5 D6 C6 Bb5 A5 -","F5 A5 D6 - A5 F5 E5 D5",
      "F5 - D5 F5 Bb5 A5 F5 -","E5 C#5 E5 G5 A5 - C#6 -",
      "D6 - A5 F5 D5 F5 A5 -","G5 E5 C5 G4 C5 E5 G5 -",
      "A5 G5 E5 C#5 E5 - A4 -","D5 - F5 E5 D5 - - -"
    ],{groove:"skip",lead:"triangle",swing:.12,gate:.85}],
    ["creepy_cascade","Creepy Cascade",104,"Dm Bb Gm A Dm F Edim A Bb Gm Dm A Gm Edim A Dm",[
      "D5 - A5 F5 E5 - D5 -","Bb4 F5 A5 - G5 F5 E5 -",
      "G5 D5 Bb4 - D5 F5 E5 D5","C#5 - E5 G5 A5 - G5 E5",
      "D6 A5 F5 E5 D5 - A4 -","F5 A5 C6 - A5 G5 F5 -",
      "E5 G5 Bb5 G5 E5 - Bb4 -","C#5 E5 A5 Bb5 A5 - E5 -",
      "Bb5 - A5 F5 D5 F5 A5 -","G5 F5 D5 Bb4 G4 - D5 -",
      "A5 F5 E5 D5 A4 D5 F5 -","E5 G5 A5 C#6 Bb5 A5 E5 -",
      "G5 - Bb5 A5 F5 D5 Bb4 -","E5 Bb5 G5 E5 Bb4 G4 E5 -",
      "C#5 E5 G5 Bb5 A5 G5 E5 -","D5 - A4 D5 F5 E5 D5 -"
    ],{groove:"hush",lead:"triangle",gate:.8,swing:.1}],
    ["forged_dove","Forged Dove",132,"Em C G D Em Am B Em C G Am B Em C B Em",[
      "E5 - B5 G5 E5 G5 A5 B5","C6 B5 G5 E5 C5 - E5 G5",
      "G5 B5 D6 B5 A5 G5 D5 -","F#5 A5 D6 - C6 A5 F#5 -",
      "E5 G5 B5 E6 D6 B5 G5 -","A5 C6 E6 C6 B5 A5 E5 -",
      "D#5 F#5 B5 D#6 C6 B5 F#5 -","E6 B5 G5 E5 F#5 G5 E5 -",
      "G5 C6 E6 G6 E6 D6 C6 -","B5 D6 G6 D6 B5 A5 G5 -",
      "A5 E6 C6 A5 G5 E5 A5 -","F#5 B5 D#6 F#6 E6 D#6 B5 -",
      "E6 D6 B5 G5 E5 G5 B5 -","C6 G5 E5 C5 E5 G5 C6 -",
      "B5 D#6 F#6 D#6 B5 A5 F#5 -","E5 G5 B5 E6 B5 G5 E5 -"
    ],{groove:"drive",lead:"sawtooth",gate:.9}],
    ["jungle_greatness","Jungle Greatness",146,"Am G F E Am Dm G C F G Am E Dm F E Am",[
      "A5 - C6 E6 - C6 A5 G5","B5 D6 - G5 A5 B5 D6 -",
      "A5 C6 F6 - E6 C6 A5 -","G#5 B5 E6 D6 B5 - G#5 -",
      "A5 E5 A5 C6 - E6 C6 A5","D6 A5 F5 A5 C6 D6 - F6",
      "G5 B5 D6 G6 - D6 B5 -","E6 D6 C6 G5 E5 - G5 C6",
      "F6 E6 C6 A5 C6 - F6 -","G6 D6 B5 G5 A5 B5 D6 -",
      "A5 C6 E6 A6 G6 E6 C6 -","G#5 B5 D6 E6 B5 G#5 E5 -",
      "D6 F6 A6 F6 D6 C6 A5 -","C6 A5 F5 A5 C6 F6 - E6",
      "B5 E6 G#6 E6 D6 B5 G#5 -","A5 - E6 C6 A5 G5 A5 -"
    ],{groove:"skip",lead:"triangle",swing:.16,gate:.7}]
  );
  for (const [id, title, bpm, progression, bars, options] of arcadeJourneys) {
    scores[id] = song(title, bpm, progression, bars, options);
  }
  const loopThemes = ["news_broadcast", "treasure_trove", "cubie_hello", "chaos_carnival", "core_aftermath", "pumpkin", "singularity", "keyrush", "hangman",
    ...dodgeTracks.map(track => track.id), ...bossTracks.map(track => track.id),
    ...geomayhemTracks.map(track => track.id)];
  const tracks = Object.freeze(Object.entries(scores).filter(([id]) => !loopThemes.includes(id))
    .map(([id, score]) => Object.freeze({ id, title: score.title, bpm: score.bpm, credit: score.credit || "Original composition" })));
  const grooves = {
    classic: { bass: [0, .5, 1, 1.5, 2, 2.5, 3, 3.5], kicks: [0, 2], hats: 8 },
    drive: { bass: [0, .5, 1, 1.5, 2, 2.5, 3, 3.5], kicks: [0, 1.5, 2, 2.75], hats: 16 },
    skip: { bass: [0, .75, 1.5, 2, 2.75, 3.5], kicks: [0, 1.5, 2.5], hats: 8 },
    hush: { bass: [0, 2, 3.5], kicks: [0, 2.5], hats: 4 },
    pursuit: { bass: Array.from({ length: 16 }, (_, index) => index / 4),
      kicks: [0, .5, 1.5, 2, 2.5, 3.5], hats: 16 },
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
  // Original chamber-pop dances. Additive/decaying instrument voices instead
  // of pulse waves; no borrowed recordings or transcribed reference melodies.
  const chamberTracks = [
    { id: "chaos_carnival", title: "Chaos Carnival", bpm: 148, bars: 48, root: 48, playful: true,
      chords: [[0,4,7,9],[5,9,12,14],[2,6,9,12],[7,11,14,17]],
      motifs: [[12,19,16,19,24,23,24,19],[17,21,24,21,19,17,16,14],
        [14,18,21,26,25,26,21,18],[19,14,11,14,17,16,14,12]] },
    { id: "dragon_dance", title: "Dragon Dance", bpm: 128, bars: 80, root: 50,
      chords: [[0,4,7,11],[9,12,16,19],[5,9,12,16],[7,11,14,17]],
      motifs: [[12,16,19,16,14,12,9,11],[12,14,16,21,19,16,14,11],
        [21,19,16,14,16,12,11,9],[17,16,14,11,12,16,19,24]] },
    { id: "lantern_market", title: "Lantern Market", bpm: 116, bars: 40, root: 48,
      chords: [[0,3,7,10],[5,8,12,15],[8,12,15,19],[7,11,14,17]],
      motifs: [[12,15,19,22,19,15,14,12],[15,14,12,10,12,15,17,19],
        [24,22,19,17,15,14,12,10],[19,17,14,11,14,17,19,23]] },
    { id: "rain_on_glass", title: "Rain on Glass", bpm: 92, bars: 32, root: 53,
      chords: [[0,4,7,11],[4,7,11,14],[9,12,16,19],[5,9,12,16]],
      motifs: [[19,16,14,12,16,11,12,14],[16,19,23,21,19,16,14,11],
        [21,19,16,12,9,12,16,19],[17,16,12,9,12,14,16,12]] },
    { id: "sunwheel_parade", title: "Sunwheel Parade", bpm: 138, bars: 40, root: 55,
      chords: [[0,4,7,9],[5,9,12,16],[2,5,9,12],[7,11,14,17]],
      motifs: [[12,12,16,19,21,19,16,14],[17,21,24,21,19,17,16,12],
        [14,17,21,19,17,14,12,9],[19,23,26,23,21,19,16,14]] },
  ];
  function composeChamber(song, sampleRate, notes) {
    const beat = 60 / song.bpm, end = song.bars * 4 * beat;
    const out = new Float32Array(Math.ceil((end + (song.playful ? 0 : 2)) * sampleRate));
    const cache = new Map();
    function instrument(pitch, start, length, gain, kind) {
      const frequency = 440 * 2 ** ((pitch - 69) / 12);
      const key = `${pitch}:${length}:${kind}`;
      if (!cache.has(key)) {
        const data = new Float32Array(Math.ceil(length * sampleRate));
        for (let i = 0; i < data.length; i++) {
          const t = i / sampleRate, phase = 2 * Math.PI * frequency * t;
          const attack = kind === 'flute' ? .045 : .008;
          const env = Math.min(1, t / attack, (length - t) / .08);
          let value = 0;
          for (let h = 1; h <= 6 && frequency * h < sampleRate * .45; h++) {
            const weight = kind === 'flute' ? (h === 1 ? 1 : .12 / h)
              : kind === 'bass' ? 1 / h ** 2.5 : 1 / h ** 1.5;
            const decay = kind === 'flute' ? .4 : kind === 'piano' ? 2 + h * .7 : 4 + h;
            value += Math.sin(phase * h + (kind === 'flute' ? .025 * Math.sin(t * 32) : 0))
              * weight * Math.exp(-t * decay);
          }
          data[i] = value * Math.max(0, env);
        }
        cache.set(key, data);
      }
      const offset = Math.round(start * sampleRate), data = cache.get(key);
      for (let i = 0; i < data.length && offset + i < out.length; i++) out[offset + i] += data[i] * gain;
      if (kind === 'flute') notes.push({ start, duration: length });
    }
    let seed = song.root;
    function drum(start, kick, gain) {
      const length = kick ? .22 : .09, offset = Math.round(start * sampleRate);
      let phase = 0;
      for (let i = 0; i < length * sampleRate && offset + i < out.length; i++) {
        const t = i / sampleRate;
        seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0;
        phase += 2 * Math.PI * (48 + 90 * Math.exp(-t * 35)) / sampleRate;
        out[offset + i] += (kick ? Math.sin(phase) : (seed / 2147483648 - 1))
          * Math.exp(-t * (kick ? 22 : 65)) * Math.min(1, t / .003) * gain;
      }
    }
    for (let bar = 0; bar < song.bars; bar++) {
      const start = bar * 4 * beat, section = Math.floor(bar / 8);
      const intro = bar < (song.playful ? 2 : 4), bridge = song.playful ? section === 2 : section === 4 || section === 5;
      const reprise = section >= (song.playful ? 4 : 7), closing = !song.playful && bar >= song.bars - 4;
      const chord = song.chords[Math.floor(bar / 2) % 4];
      const motif = song.motifs[(Math.floor(bar / 2) + (bridge ? 2 : 0)) % 4];
      for (let k = 0; k < 8; k++) {
        const human = k % 2 ? (song.playful ? beat * .14 : .012) : 0;
        instrument(song.root + chord[k % 4] + 12, start + k * beat / 2 + human,
          beat * 1.2, .085 * (k % 2 ? .8 : 1), 'pluck');
        if (!intro && !closing && (!bridge || k % 2 === 0)) {
          const pitch = song.root + motif[k] + (bar % 4 === 3 && k === 7 ? -2 : 0);
          instrument(pitch, start + k * beat / 2 + human, beat * (bridge ? .88 : song.playful ? .32 : .46), .19, 'flute');
          if (song.playful && k % 2 === 1) instrument(pitch + 12, start + k * beat / 2 + human, beat * .25, .07, 'pluck');
          if (reprise && k % 2 === 0) instrument(pitch - 12, start + k * beat / 2,
            beat * .65, .055, 'piano');
        }
      }
      for (const k of (song.playful ? [1, 3] : [0, 1.5, 2.5])) for (const note of chord)
        instrument(song.root + note + (bridge ? 12 : 0), start + k * beat, beat * (song.playful ? .45 : 1.3), .055, 'piano');
      for (const k of [0, 2]) instrument(song.root + chord[0] - 12 + (song.playful && k === 2 ? 7 : 0),
        start + k * beat, beat * (song.playful ? .7 : 1.8), .24, 'bass');
      if (!intro && !bridge && !closing) {
        for (const k of [0, 2]) drum(start + k * beat, true, .22);
        for (let k = 0; k < 8; k++) drum(start + (k / 2 + .02) * beat, false, k % 2 ? .045 : .025);
        if (bar % 8 === 7) for (const k of [3, 3.25, 3.5, 3.75]) drum(start + k * beat, false, .07);
      }
    }
    // Short room reflections retain rhythmic definition; gentle headroom and
    // a release tail avoid abrupt endings when the jukebox repeats the piece.
    const delay = Math.round(.071 * sampleRate);
    for (let i = out.length - 1; i >= delay; i--) out[i] += out[i - delay] * .13;
    let peak = 0;
    for (let i = 0; i < out.length; i++) {
      out[i] *= Math.max(0, Math.min(1, i / (sampleRate * .025), (out.length - 1 - i) / (sampleRate * (song.playful ? .025 : 1.5))));
      peak = Math.max(peak, Math.abs(out[i]));
    }
    const scale = .82 / Math.max(.82, peak);
    for (let i = 0; i < out.length; i++) out[i] *= scale;
    return out;
  }
  function trackDuration(id) {
    if(id === "tearesseract_prelude")return 64*60/112/4;
    if(id === "gaster_signal")return 6.66;
    if (id === "tearesseract") return 70 * 4 * 60 / 172;
    if (id === "singularity") return 48 * 4 * 60 / 78;
    const arena = geomayhemTracks.find(track => track.id === id);
    if (arena) return 128 * 60 / arena.bpm;
    const chamber = chamberTracks.find(track => track.id === id);
    if (chamber) return chamber.bars * 4 * 60 / chamber.bpm + (chamber.playful ? 0 : 2);
    const rock = [...rockTracks, ...bossTracks, impossibleRemix].find(track => track.id === id);
    if (rock) return 128 * 60 / rock.bpm + (rock.loop ? 0 : 1.2);
    const score = scores[id];
    return score.roots.length * 4 * 60 / score.bpm;
  }
  const jukeboxTracks = Object.freeze([
    {id:"tearesseract", title:"Tearesseract — Containment Is Not Optional", bpm:172, category:"Boss theme"},
    ...Object.entries(scores).map(([id, score]) => ({ id, title: score.title, bpm: score.bpm,
      category: loopThemes.includes(id) ? "Game theme" : "Arcade soundtrack" })),
    { id: "singularity", title: "Singularity Core", bpm: 78, category: "Game theme" },
    { ...impossibleRemix, category: "Turtle Dodge" },
    ...bossTracks.map(track => ({ ...track, category: "Boss Crush" })),
    ...geomayhemTracks.map(track => ({ ...track, category: "Geomayhem" })),
    ...rockTracks.map(track => ({ ...track, category: "Rock" })),
    ...chamberTracks.map(track => ({ ...track, category: track.playful ? "Turtle Dodge" : "Instrumental dance" })),
    ...(archive?.tracks||[]),
    {id:'tearesseract_prelude',title:'Tearesseract — Pre-fight Motif',bpm:112,category:'Game theme'},
    {id:'gaster_signal',title:'Gaster — Signal Encounter',bpm:0,category:'Secret encounter'},
  ].map(({ id, title, bpm, category, duration = trackDuration(id) }) => Object.freeze({ id, title, bpm, category, duration })));
  function composeRock(track, sampleRate, notes) {
    const beat = 60 / track.bpm, duration = 32 * 4 * beat + (track.loop ? 0 : 1.2);
    const samples = new Float32Array(Math.round(duration * sampleRate));
    let seed = 9317 + track.bpm;
    function noise() {
      seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0;
      return seed / 2147483648 - 1;
    }
    function guitar(pitch, start, length, amplitude, lead = false) {
      if (lead) notes.push({ start, duration: length });
      const frequency = 440 * 2 ** ((pitch - 69) / 12);
      const offset = Math.round(start * sampleRate);
      for (let i = 0; i < length * sampleRate && offset + i < samples.length; i++) {
        const t = i / sampleRate;
        const phase = 2 * Math.PI * (frequency * t + (lead ? .035 * Math.sin(t * 32) : 0));
        const string = Math.sin(phase) + .5 * Math.sin(phase * 2) + .25 * Math.sin(phase * 3);
        const wave = Math.tanh(string * (track.drive || 2.4)) + .15 * Math.sin(phase * 1.003);
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
      if (bar === 31 && !track.loop) {
        // A resolved, sustained ending rather than cutting off a looping riff.
        for (const interval of [0, 7, 12]) guitar(track.roots[0] + interval, start, 4 * beat + 1, .085);
        guitar(track.roots[0] + 36, start, 4 * beat, .13, true);
        bass(track.roots[0] - 12, start, 4 * beat);
        drum(start, "kick"); drum(start, "crash");
        continue;
      }
      const chugs = track.chugs || 8;
      for (let n = 0; n < chugs; n++) {
        const when = start + n * 4 * beat / chugs;
        if (!bridge || n % 2 === 0)
          for (const [string, interval] of [0, 7, 12].entries())
            guitar(root + interval, when + string * .006,
              beat * (track.palmMute || (chorus ? .7 : .36)), chorus ? .075 : .06);
        bass(root - 12 + (n % 4 === 3 ? 7 : 0), when, beat * (chugs === 16 ? .21 : .43));
      }
      for (let n = 0; n < (track.hats || 8); n++)
        drum(start + n * 4 * beat / (track.hats || 8), "hat", n % 2 ? .65 : 1);
      if (bar >= (track.loop ? 0 : 4)) {
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
    let previousInput = 0, previousOutput = 0, peak = 0;
    const dcPole = Math.exp(-2 * Math.PI * 12 / sampleRate);
    for (let i = 0; i < samples.length; i++) {
      const fade = Math.min(1, i / (sampleRate * .005),
        (samples.length - 1 - i) / (sampleRate * (track.loop ? .008 : .25)));
      let value = .8 * Math.tanh(samples[i] / .8);
      if (track.loop) {
        // Dense palm-muted riffs need DC removal without thinning the audible bass.
        const filtered = value - previousInput + dcPole * previousOutput;
        previousInput = value;
        previousOutput = filtered;
        value = filtered;
      }
      samples[i] = value * fade;
      peak = Math.max(peak, Math.abs(samples[i]));
    }
    if (track.loop && peak > .8)
      for (let i = 0; i < samples.length; i++) samples[i] *= .8 / peak;
    samples[0] = 0;
    samples[samples.length - 1] = 0;
    return samples;
  }
  function composeCinematicCore(sampleRate, melodyEvents) {
    // A slow, original orchestral/synth cue: bowed low strings, legato brass,
    // vowel-like choir, resonant ensemble drums, and a diffuse reverb tail.
    const beat = 60 / 78, barLength = beat * 4;
    const samples = new Float32Array(Math.round(barLength * 48 * sampleRate));
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
      if (kind === "brass") melodyEvents.push({ start, duration });
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
    function bassDrum(start, level) {
      const offset = Math.round(start * sampleRate), duration = .48;
      for (let i = 0; i < duration * sampleRate && offset + i < samples.length; i++) {
        const t = i / sampleRate;
        // A fast pitch fall lands at 48 Hz; a short upper body keeps the kick
        // audible on phone speakers without a long, muddy sub-bass tail.
        const phase = 2 * Math.PI * (48 * t + 3.2 * (1 - Math.exp(-t * 32)));
        const body = Math.sin(phase) * Math.exp(-t * 9)
          + .28 * Math.sin(phase * 2) * Math.exp(-t * 19);
        const attack = Math.sin(2 * Math.PI * 1350 * t) * Math.exp(-t * 150) * .1;
        const envelope = Math.min(1, t / .003) * Math.min(1, (duration - t) / .025);
        samples[offset + i] += (body + attack) * envelope * level;
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
    function percussion(start, level, snare = false) {
      const offset = Math.round(start * sampleRate), duration = snare ? .34 : .09;
      let low = 0;
      for (let i = 0; i < duration * sampleRate && offset + i < samples.length; i++) {
        const t = i / sampleRate, white = noise();
        low += .16 * (white - low);
        const body = snare ? .6 * Math.sin(2 * Math.PI * 178 * t) * Math.exp(-t * 24) : 0;
        const snap = (white - low) * Math.exp(-t * (snare ? 16 : 55));
        samples[offset + i] += (body + snap) * Math.min(1, t / .002) * level;
      }
    }
    function riser(start, duration) {
      const offset = Math.round(start * sampleRate);
      let low = 0, phase = 0;
      for (let i = 0; i < duration * sampleRate && offset + i < samples.length; i++) {
        const p = i / (duration * sampleRate), white = noise();
        low += (.02 + .35 * p) * (white - low);
        phase += Math.min(sampleRate * .35, 180 * 2 ** (p * 3)) / sampleRate;
        samples[offset + i] += (low * .2 + Math.sin(phase * Math.PI * 2) * .035)
          * p ** 2 * Math.min(1, (1 - p) * duration / .02);
      }
    }
    // 0–11: original cinematic opening. 12–15: build. 16–23: first drop.
    // 24–27: weightless interlude. 28–31: rebuild. 32–43: expanded final drop.
    // 44–47: dissolve back into the opening's low strings for the loop.
    for (let bar = 0; bar < 48; bar++) {
      const phrase = bar % 16;
      const start = bar * barLength, root = bar >= 44 ? [43, 34, 45, 38][bar - 44] : roots[phrase];
      const drop = bar >= 16 && bar < 24 || bar >= 32 && bar < 44;
      const build = bar >= 12 && bar < 16 || bar >= 28 && bar < 32;
      const interlude = bar >= 24 && bar < 28;
      const outro = bar >= 44;
      const chord = [0, [45, 41, 36, 34].includes(root) ? 4 : 3, 7];
      const intensity = drop ? (bar >= 32 ? 1.28 : 1.16) : interlude ? .48 : outro ? .75 - (bar - 44) * .12
        : bar < 4 ? .52 : bar < 8 ? .74 : 1;
      if (!drop) voice(root - 12, start, barLength + .55, .21 * intensity, 'bass', .14, .75);
      chord.forEach((interval, i) => {
        voice(root + 12 + interval, start, barLength + .7, (drop ? .095 : .12) * intensity, 'strings', .55, .95);
        if (bar >= 8) voice(root + 24 + interval, start + .08 * i, barLength + .5,
          .065 * intensity, 'choir', .8, 1.1);
      });
      if (bar >= 4 && !drop && !interlude && !outro) {
        for (let n = 0; n < 4; n++) voice(root + 12 + [0, 7, 12, 7][n], start + n * beat,
          beat * .72, .14 * intensity, 'strings', .045, .27);
        melody[phrase].forEach((pitch, i) => voice(pitch, start + i * beat * 2,
          beat * 2.25, .15 * intensity, 'brass', .25, .5));
      }
      if (drop) {
        // Double-time drums give the drop a 156 BPM pulse over the cinematic motif.
        for (const hit of [0, 1, 2, 2.75, 3]) {
          drum(start + hit * beat, hit === 0 ? .60 : .36);
          bassDrum(start + hit * beat, (hit === 0 ? .48 : .36) * (bar >= 32 ? 1.15 : 1));
          voice(root - 12, start + hit * beat, beat * .72, .40, 'bass', .012, .15);
          voice(root, start + hit * beat + .04, beat * .45, .12, 'brass', .025, .13);
        }
        for (const hit of [.5, 1.5, 2.5, 3.5])
          percussion(start + hit * beat, bar >= 32 ? .29 : .25, true);
        // Alternating sixteenth-note hats, quiet ghost snares, and extra final-drop rolls.
        for (let n = 0; n < 16; n++) {
          percussion(start + n * beat / 4, n % 4 === 2 ? .105 : n % 2 ? .045 : .065);
          if (bar >= 32 && n >= 12)
            percussion(start + (n / 4 + .125) * beat, .035);
        }
        for (const hit of [1.25, 3.25]) percussion(start + hit * beat, .055, true);
        for (let n = 0; n < 8; n++) {
          voice(root + 24 + [0, 7, 12, 7, chord[1], 7, 14, 12][n], start + n * beat / 2,
            beat * .36, bar >= 32 ? .12 : .09, 'strings', .015, .14);
          if (bar >= 32) {
            voice(root + 36 + [7, 0, chord[1], 7][n % 4], start + (n / 2 + .25) * beat,
              beat * .2, .045, 'strings', .012, .09);
          }
        }
        const lead = melody[(phrase + 8) % 16];
        [0, 1.5, 2.5, 3.25].forEach((hit, n) => {
          const pitch = lead[n % 2] + (n === 3 ? 7 : 0);
          voice(pitch, start + hit * beat, beat * (n === 0 ? 1.3 : .65), .23, 'brass', .06, .2);
          if (bar >= 32) voice(pitch + 12, start + hit * beat, beat * .75, .085, 'choir', .08, .2);
        });
        if (bar % 4 === 3) {
          for (let n = 0; n < 4; n++) percussion(start + (3 + n / 4) * beat, .07 + n * .025, true);
        }
      } else if (!interlude && !outro) {
        drum(start, .36 * intensity);
        if (bar >= 4) drum(start + beat * 2, .24 * intensity);
        if (bar >= 8) drum(start + beat * 3.5, .16 * intensity);
      }
      if (interlude || outro) {
        voice(melody[phrase][0] + 12, start + beat, beat * 2.8, .07, 'choir', .6, .8);
        if (bar % 2 === 0) drum(start, .10);
      }
      if (build) {
        const step = bar % 4, count = [4, 8, 8, 16][step];
        for (let n = 0; n < count; n++) percussion(start + n * barLength / count,
          .045 + step * .022 + n / count * .025, true);
        if (step === 0) riser(start, barLength * 4 - beat * .5);
      }
      if (bar % 4 === 3 && !interlude && !outro) {
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
      // A brief vacuum cuts even the reverb before each impact. Ramp both
      // edges to avoid clicks; the drop itself remains on the exact downbeat.
      const t = i / sampleRate;
      let vacuum = 1;
      for (const bar of [16, 32]) {
        const until = bar * barLength - t;
        if (until > 0 && until < beat * .5) vacuum = Math.max(0, 1 - (beat * .5 - until) / .035);
        else if (until <= 0 && until > -.008) vacuum = -until / .008;
      }
      // Lift the whole post-drop mix, growing toward each section's end.
      // Ease out over the last half beat so the quieter interlude stays smooth.
      let dropGain = 1;
      for (const [first, last, lift] of [[16, 24, .35], [32, 44, .48]]) {
        const start = first * barLength, end = last * barLength;
        if (t >= start && t < end) {
          const progress = (t - start) / (end - start);
          dropGain += (lift + .18 * progress) * Math.min(1, (t - start) / .015, (end - t) / (beat * .5));
        }
      }
      samples[i] = Math.tanh(samples[i] * 1.35 * dropGain) * .82 * fade * vacuum;
    }
    samples[0] = samples[samples.length - 1] = 0;
    return samples;
  }
  // A / B / A / B-drop / C / D / E-short / B-reprise / F-cinematic.
  // One arrangement shared by the boss and jukebox.
  function composeTearesseract(rate, notes, prelude = false) {
    const movements=[
      {name:'A',phrase:0,bars:8}, {name:'B',phrase:1,bars:8},
      {name:'A',phrase:0,bars:8}, {name:'B-drop',phrase:1,bars:8},
      {name:'C',phrase:2,bars:8}, {name:'D',phrase:3,bars:8},
      {name:'E-short',phrase:4,bars:2}, {name:'B-reprise',phrase:1,bars:8},
      {name:'F-cinematic',phrase:5,bars:12}
    ];
    let end=0;for(const movement of movements){movement.start=end;end+=movement.bars*16;movement.end=end;}
    const step=60/(prelude?112:172)/4, steps=prelude?64:end,
      out=new Float32Array(Math.ceil(steps*step*rate));
    // A two-bar question and answer; onset, pitch above E4, held sixteenths.
    // The pre-fight loop states the same hook at a slower tempo.
    const phrases=[
      [[0,0,5],[6,3,2],[8,7,6],[15,10,1],[16,9,3],[20,7,2],[23,3,3],[28,2,3]],
      [[0,12,5.5],[6,10,1.8],[8,7,4.8],[13,10,2.6],[16,9,3.5],[20,10,2.5],[23,7,5],[29,5,2.5]],
      [[0,7,7],[8,14,3],[12,12,3],[16,10,6],[24,9,3],[28,7,3]],
      [[0,0,3],[4,3,2],[7,7,5],[14,6,1],[16,7,7],[24,3,3],[28,0,3]],
      [[0,12,9],[12,10,5],[20,7,7]],
      [[0,0,6],[8,3,6],[16,7,7],[24,12,7]]
    ];

    const smooth=value=>{const x=Math.max(0,Math.min(1,value));return x*x*(3-2*x);};
    let seed=719;
    const hall=new Float32Array(out.length);
    function voice(pitch,start,len,amp,kind, expression = {}) {
      let f=440*2**((pitch-69)/12), off=Math.floor(start*rate), filtered=0, guitarPhase=0, cabinet=0;
      const inDrop=!prelude&&start/step>=384&&start/step<512;
      // Drop-only emphasis; the existing entrance envelope still ramps these gains.
      if(inDrop&&['timpani','tom','snare','kick','rim','cymbal','noise'].includes(kind))amp*=2;
      const afterDrop=!prelude&&((start/step>=512&&start/step<768)||(start/step>=800&&start/step<928));
      if(afterDrop&&['timpani','tom','snare','kick','rim','cymbal','noise','clap','hat'].includes(kind))amp*=1.75;
      if(["timpani","tom","snare","kick","rim"].includes(kind)){
        amp*=1.4;
        if(!prelude){
          const onset=start/step,m=movements.find(m=>onset<m.end)||movements.at(-1),index=movements.indexOf(m),next=movements[index+1];
          const entry=Math.min(1,Math.max(0,(onset-m.start)/8)),exit=Math.min(1,Math.max(0,(m.end-onset)/16));
          // Ease into new grooves; pull the busy layers back before sparse passages.
          if(m.name!=='B-drop')amp*=.72+.28*entry;
          if(next)amp*=(next.name==='E-short'||next.name==='F-cinematic'?.45:.78)+(next.name==='E-short'||next.name==='F-cinematic'?.55:.22)*exit;
        }
      }
      if(!prelude&&!['guitar','guitarlead'].includes(kind)){
        const onset=start/step;
        // Fade the outgoing accompaniment under the solo, then bloom into B.
        if(onset>=376&&onset<384)amp*=.4+.6*smooth((384-onset)/8);
        if(onset>=384&&onset<400)amp*=.22+.78*smooth((onset-384)/16);
      }
      const orchestral=['strings','horn','choir'].includes(kind); // Keep percussion dry and punchy.
      const attack=expression.naturalHorn?.035:expression.sharp?.002:['kick','snare','tom','rim'].includes(kind)?.0007:kind==='strings'?.012:kind==='horn'?.007:kind==='choir'?.16:kind==='pad'?.045:.003;
      for(let i=0;i<len*rate&&off+i<out.length;i++) {
        let t=i/rate, env=Math.min(1,t/attack)*Math.pow(Math.max(0,1-t/len),['pad','strings','horn','choir','guitarlead','bass808'].includes(kind)?.65:2),v;
        if(expression.naturalHorn){const release=Math.min(.14,len*.25);env=Math.min(1,t/attack)*Math.min(1,Math.max(0,(len-t)/release))*(.87+.13*Math.sin(Math.PI*t/len));}
        if(expression.hold)env=Math.min(1,t/attack);
        if(expression.swell)env=Math.sin(Math.PI*Math.min(1,t/len))**2;
        seed=(Math.imul(seed,1664525)+1013904223)>>>0;
        const random=seed/2147483648-1;
        if(kind==='bass808'){
          const glide=(expression.slide||0)*Math.exp(-t*14);
          guitarPhase+=2*Math.PI*f*2**(glide/12)/rate;
          const sub=Math.sin(guitarPhase)+.22*Math.sin(guitarPhase*2);
          v=Math.tanh(sub*2.1)*.78*(.35+.65*Math.min(1,t/.04));
        }else if(kind==='cowbell'){
          const phase=2*Math.PI*f*t;
          const metal=Math.tanh(Math.sin(phase)*3)+.65*Math.tanh(Math.sin(phase*1.483)*3);
          filtered+=(1-Math.exp(-2*Math.PI*4200/rate))*(metal-filtered);
          v=filtered*.5*Math.exp(-t*7);
        }else if(kind==='clap'){
          filtered+=(1-Math.exp(-2*Math.PI*1300/rate))*(random-filtered);
          const bursts=Math.exp(-t*95)+(t>.012?Math.exp(-(t-.012)*110):0)+(t>.026?Math.exp(-(t-.026)*28):0);
          v=(random-filtered)*bursts*.65;
        }else if(kind==='hat'){
          filtered+=(1-Math.exp(-2*Math.PI*5800/rate))*(random-filtered);
          v=(random-filtered)*.8*Math.exp(-t*35);
        }else if(kind==='swell'){filtered+=.08*(random-filtered);v=filtered*.8+Math.sin(2*Math.PI*f*t)*.15;}else if(kind==='strings'){
          const phase=2*Math.PI*f*(t+.00035*Math.sin(t*31));
          v=(Math.sin(phase)+.38*Math.sin(phase*2.002)+.2*Math.sin(phase*3.001)+.1*Math.sin(phase*4.003))*.62;
        }else if(kind==='horn'&&expression.naturalHorn){
          // Breath-shaped brass: a tiny pitch scoop, delayed vibrato and a blooming bell.
          const vibrato=.055*Math.sin(2*Math.PI*5.2*t)*Math.min(1,t/.24);
          const scoop=-.12*Math.exp(-t*22);
          guitarPhase+=2*Math.PI*f*2**((vibrato+scoop)/12)/rate;
          const phase=guitarPhase,bloom=.45+.55*(1-Math.exp(-t*14));
          filtered+=(1-Math.exp(-2*Math.PI*1100/rate))*(random-filtered);
          const bell=Math.sin(phase)+.56*bloom*Math.sin(phase*2)+.34*bloom*Math.sin(phase*3)+.19*bloom*Math.sin(phase*4)+.09*bloom*Math.sin(phase*5);
          v=bell*.55+filtered*.035*(1+Math.exp(-t*30));
        }else if(kind==='horn'){
          const phase=2*Math.PI*f*t, bloom=.65+.35*Math.min(1,t/.025);
          v=(Math.sin(phase)+.58*bloom*Math.sin(phase*2)+.34*bloom*Math.sin(phase*3)+.18*Math.sin(phase*4)+.08*Math.sin(phase*5)+(expression.sharp?.12*Math.sin(phase*6):0))*.65;
         }else if(kind==='guitar'||kind==='guitarlead'){
          const lead=kind==='guitarlead', progress=Math.min(1,t/Math.max(.025,len*.45));
          const bend=(expression.bend||0)*Math.sin(progress*Math.PI/2);
          const slide=(expression.slide||0)*Math.exp(-t*32);
          const vibrato=lead?Math.sin(t*2*Math.PI*6.1)*.22*Math.min(1,t/.13):.025*Math.sin(t*29);
          guitarPhase+=2*Math.PI*f*2**((bend+slide+vibrato)/12)/rate;
          const phase=guitarPhase;
          const brightness=Math.exp(-t*(lead?1.3:5));
          const string=Math.sin(phase)+.55*Math.sin(phase*2)+brightness*(.34*Math.sin(phase*3)+.18*Math.sin(phase*4)+.12*Math.sin(phase*5));
          const harmonic=expression.squeal?Math.sin(phase*4)*Math.min(1,t/.05)*.65:0;
          const pick=random*Math.exp(-t*110)*.32;
          const driven=Math.tanh((string+harmonic+pick)*(lead?3.4:2.6));
          filtered+=(1-Math.exp(-2*Math.PI*(lead?(expression.sharp?4200:3400):2600)/rate))*(driven-filtered);
          cabinet+=(1-Math.exp(-2*Math.PI*95/rate))*(filtered-cabinet);
          v=(filtered-cabinet)*Math.exp(-t*(lead?.35:3.8));
        }else if(kind==='rim'){
          v=(Math.sin(2*Math.PI*1720*t)+.55*Math.sin(2*Math.PI*2381*t))*Math.exp(-t*85)+random*.2*Math.exp(-t*110);
        }else if(kind==='tom'){
          const phase=2*Math.PI*f*(t+.003*(1-Math.exp(-t*45)));
          v=Math.sin(phase)*Math.exp(-t*7)+.35*Math.sin(phase*1.59)*Math.exp(-t*14)+.16*Math.sin(phase*2.13)*Math.exp(-t*25)+random*.22*Math.exp(-t*95);
        }else if(kind==='choir'){
          const phase=2*Math.PI*f*(t+.0002*Math.sin(t*27));
          v=(Math.sin(phase)+.23*Math.sin(phase*3)+.13*Math.sin(phase*5)+.09*Math.sin(phase*7))*.65;
        }else if(kind==='timpani'){
          const phase=2*Math.PI*f*(t+.002*(1-Math.exp(-t*35)));
          filtered+=.08*(random-filtered);
          v=(Math.sin(phase)+.38*Math.sin(phase*1.48)+.17*Math.sin(phase*2.08))*Math.exp(-t*4)+filtered*.25*Math.exp(-t*35);
        }else if(kind==='snare'){
          filtered+=(1-Math.exp(-2*Math.PI*1800/rate))*(random-filtered);
          const wires=(random-filtered)*.78*Math.exp(-t*16);
          const shell=Math.sin(2*Math.PI*185*t)*.48*Math.exp(-t*26)+Math.sin(2*Math.PI*330*t)*.23*Math.exp(-t*40);
          v=wires+shell+random*.24*Math.exp(-t*160);
        }else if(kind==='cymbal'){
          filtered+=(1-Math.exp(-2*Math.PI*2400/rate))*(random-filtered);
          const metal=(Math.sin(t*2*Math.PI*3119)+Math.sin(t*2*Math.PI*4373)+Math.sin(t*2*Math.PI*5741))*.085;
          v=((random-filtered)*.5+metal)*Math.exp(-t*4);
        }else if(kind==='noise')v=(seed/2147483648-1)*Math.exp(-t*28);
        else if(kind==='kick')v=Math.sin(2*Math.PI*(43*t+6*(1-Math.exp(-t*28))))*Math.exp(-t*5)+random*.25*Math.exp(-t*190)+Math.sin(2*Math.PI*125*t)*.15*Math.exp(-t*40);
        else if(kind==='pad')v=(Math.sin(2*Math.PI*f*t)+Math.sin(2*Math.PI*f*1.004*t))/2;
        else v=Math.tanh(1.5*(Math.sin(2*Math.PI*f*t)+.4*Math.sin(4*Math.PI*f*t)+.2*Math.sin(6*Math.PI*f*1.002*t)));
        const sample=v*amp*env;out[off+i]+=sample;if(orchestral)hall[off+i]+=sample;
      }
    }
    for(let i=0;i<steps;i++) {
      const movement=prelude?movements[0]:movements.find(m=>i<m.end), local=i-movement.start,
        section=movement.phrase, bar=Math.floor(local/16), at=i*step,
        drop=movement.name==='B-drop', reprise=movement.name==='B-reprise',
        bridge=section===4, finale=section===5,
        phonkActive=!prelude&&i>=384&&section!==4&&section!==5,
        root=(finale?[40,36,43,35,36,40]:[40,40,36,39])[Math.floor(bar/2)%(finale?6:4)];
      // The guitar overlaps a full-bar gradual entrance into the drop.
      const intake=drop&&local<8;
      // The returning A hands off to a two-bar riff, then an exposed guitar pickup.
      const preDrop=!prelude&&((movement.start===256&&local>=96)||(drop&&local<16));
      if(preDrop){
        const riffTime=drop?32+local:local-96;
        const riff=[[0,40,2],[3,40,1],[6,47,2],[8,43,3],[12,40,2],[15,46,1],
          [16,40,2],[19,40,1],[22,50,2],[24,47,3],[28,46,2],[31,43,1],
          [32,40,2],[35,47,1],[37,46,1],[38,40,1]];
        const pick=riff.find(([onset])=>onset===riffTime);
        if(pick){for(const [interval,gain] of [[0,.32],[7,.18],[12,.12]])voice(pick[1]+interval,at,step*pick[2]*.92,gain,'guitar');}
        // Lead answers the chugging power chords, climbing into a bent pinch harmonic.
        const solo=[[0,64,5,{slide:-5}],[6,67,2,{}],[8,69,5,{bend:2}],
          [14,67,2,{}],[16,71,4,{slide:-3}],[20,74,2,{}],[22,76,2,{}],
          [24,74,6,{bend:2}],[30,71,2,{}],[32,76,15.5,{bend:3,squeal:true}]];
        const lead=solo.find(([onset])=>onset===riffTime);
        if(lead){voice(lead[1],at,step*lead[2],.37,'guitarlead',lead[3]);
          voice(lead[1],at+step*1.5,step*lead[2],.085,'guitarlead',lead[3]);}

      }
      const melodyTime=finale?local%64/2:local%32;
      const event=phrases[section].find(([onset])=>onset===melodyTime);
      if(event){const [,pitch,held]=event,
          duration=step*held*(finale?1.9:.94),
          melodyPitch=52+pitch+(reprise&&bar>=4?12:0);
        voice(melodyPitch,at,duration,prelude?.28:drop?.74:bridge?.58:finale?.45:.50,prelude?'strings':'horn',{sharp:drop,naturalHorn:bridge});
        // The guitar doubles the actual tune, not just the pre-drop solo.
        // Small slides and delayed vibrato add articulation without obscuring pitch.
        if(!prelude)voice(melodyPitch+(melodyPitch<64?12:0),at+.006,duration*.98,
          preDrop?.09:drop?.38:bridge?.10:finale?.22:section===1?.25:.20,'guitarlead',
          {slide:local%16===0?-.6:0,sharp:drop});
        notes.push({start:at,duration,pitch:melodyPitch,section:movement.name,guitar:!prelude});
        if(!prelude&&(section===1||section===3||finale))voice(melodyPitch+12,at+step*.12,duration*.85,finale?.19:.14,'strings');
        if(reprise)voice(melodyPitch-12,at+step*1.5,duration*.65,.10,'choir');
        if(!prelude){
          // A diatonic third follows the tune; a low octave anchors the lead.
          const minor=[0,2,3,5,7,8,10],pc=((pitch%12)+12)%12;
          const degree=minor.indexOf(pc), third=degree<0?3:minor[(degree+2)%7]+(degree+2>=7?12:0)-pc;
          voice(melodyPitch+third,at+.012,duration*.9,preDrop?.07:finale?.18:.15,'strings');
          voice(melodyPitch-12,at,duration*.8,finale?.15:.11,'horn',{naturalHorn:bridge});
        }
      }
      if(!prelude&&!intake&&!bridge&&!finale&&!preDrop){
        // Independent answering line enters between the main phrase's accents.
        const answer=[[5,7,3],[13,3,3],[22,2,4],[27,0,4]].find(([onset])=>onset===local%32);
        if(answer)voice(64+answer[1]+(section===2?5:0),at,step*answer[2],reprise?.17:.12,'strings');
      }
      if(prelude){if(i%16===0)for(const interval of [0,3,7])voice(root+12+interval,at,step*15,.065,'choir');if(i%8===0)voice(root,at,step*5,.12,'pad');continue;}
      // Crisp background sticks and short snare taps keep the pulse audible.
      if(!bridge&&(!finale||bar<10)){
        const sharpLevel=finale?.065:.09;
        if(local%4===2)voice(78,at,.045,sharpLevel,'rim');
        if(local%8===7)voice(48,at+step*.45,.075,sharpLevel*.85,'snare');
      }
      if(bridge){if(local===0)for(const interval of [0,7,14])voice(52+interval,at,step*30,.13,'choir');if(local>=24&&local%2===0)voice(80,at,.12,.04+(local-24)*.015,'noise');continue;}
      if(finale){
        // A prominent bass drum anchors the half-time cinematic finale.
        if(bar<10&&local%8===0)voice(28,at,.58,.90,'kick');
        if(local===160)voice(28,at,.95,1.05,'kick');
        // Half-time choir and brass-like octaves widen into a sustained resolution.
        if(local%32===0){for(const interval of [0,3,7,14])voice(root+12+interval,at,step*31,.14,'choir');voice(root-12,at,step*28,.20,'strings');voice(28,at,1.2,.65,'timpani');voice(90,at,2,.12,'cymbal');}
        if(bar>=4&&bar<10&&[6,14].includes(local%16))voice(40,at,.45,.28,'tom');
        if(bar>=4&&bar<10&&local%8===0){for(let roll=0;roll<3;roll++)voice(60+roll*3,at+step*roll*4/3,.17,.14,'tom');}
        if(local%16===8&&bar<10)voice(48,at,.3,.36,'snare');
        if(bar>=4&&bar<10&&local%4===0)voice(root+24+[0,7,12,15][local/4%4],at,step*3,.12,'strings');
        if(local===160){for(const interval of [0,7,12,15,19])voice(40+interval,at,step*32,.16,'choir',{hold:true});voice(28,at,3,.3,'timpani');}
        continue;
      }
      if(section===1||phonkActive){
        const beat=local%16;
        if(phonkActive){
          // Phonk carries from the drop through C, D and the B reprise; E and F stay orchestral.
          if(beat%4===0||beat===14)voice(30,at,.25,.58,'kick');
          if(beat===4||beat===12){voice(48,at,.22,.49,'snare');voice(78,at+.012,.18,.28,'clap');}
          const sub=[[0,0,5.5],[6,0,1.8],[8,0,5.5],[14,7,1.8]].find(([onset])=>onset===beat);
          if(sub)voice(root-12+sub[1],at,step*sub[2],.47,'bass808',{slide:beat===14?5:beat===0?-2:0});
          const bell=[[0,7,2],[3,10,1.5],[6,7,1.5],[8,3,2.5],[11,2,1.5],[14,0,1],[15,3,1]].find(([onset])=>onset===beat);
          if(bell)voice(76+bell[1],at,step*bell[2],beat===0||beat===8?.16:.12,'cowbell');
          // One subdivision grid keeps the swung ticks and triplet rolls together.
          if(beat%2===0)voice(92,at+step*(beat%4===2?.16:0),.065,.14,'hat');
          if(beat===7||beat===15)for(let roll=0;roll<3;roll++)voice(92,at+step*roll/3,.04,.085+roll*.015,'hat');
          if(beat===0){for(const interval of [0,3,7])voice(root+12+interval,at,step*15,.075,'choir');voice(90,at,1.1,.10,'cymbal');}
          if(beat===6||beat===14)voice(55,at,.17,.16,'tom');
          continue;
        }
        // Plain B and its reprise retain their steady rock foundation.
        if(beat%4===0){voice(30,at,.25,drop?.58:.43,'kick');voice(root-5,at,.5,.32,'timpani');}
        if(beat===4||beat===12){voice(48,at,.22,drop?.49:.37,'snare');voice(78,at,.055,.10,'rim');}
        if(beat%2===0){
          voice(root,at,step*1.8,drop?.23:.17,'bass');
          voice(90,at,.13,beat%4===0?.10:.07,'cymbal');
          voice(root+24+[0,7,12,7][beat/2%4],at+step*.5,step*.7,reprise?.045:.025,'arp');
        }
        if(beat===2||beat===10)voice(55,at,.19,.16,'tom');
        if(beat===6||beat===14)voice(62,at,.13,.12,'tom');
        if(beat===0){for(const interval of [0,3,7,14])voice(root+12+interval,at,step*15,reprise?.12:.08,'choir');}
        if(drop&&beat%8===0)voice(root-12,at,step*5,.28,'pad');
        if(beat%4===0)voice(root+12,at,step*2.5,.15,'strings');
        continue;
      }
      // Low drum ostinato, displaced accents and quiet snare doubles drive the background.
      const drumBeat=local%16;
      // Every layer resolves to the same bar: straight pulse, 3+3+2 low drums,
      // triplet high toms and sixteenth snare doubles, with deliberate accents.
      if(!intake){
        if([0,6,12].includes(drumBeat))voice(26+(drumBeat===6?5:0),at,.62,.25,'timpani');
        if(drumBeat%4===0){
          const accent=drumBeat===0?1:.7;
          for(let triplet=0;triplet<3;triplet++)voice(62+(triplet%2)*5,at+step*triplet*4/3,.13,(triplet===0?.16:.10)*accent,'tom');
        }
        if([1,4,7,9,12,15].includes(drumBeat))voice(78,at+step*.04,.055,drumBeat%4===0?.15:.085,'rim');
        if((drop||reprise||section===3)&&drumBeat%4===3){voice(48,at+step*.5,.10,.11,'snare');voice(48,at+step*.75,.075,.075,'snare');}
      }
      if(!intake){
        // Interlocking toms and tight ride accents sit above the low drum ostinato.
        if([2,5,9,13].includes(drumBeat))voice([43,48,40,46][Math.floor(drumBeat/4)],at+step*.08,.24,.23,'tom');
        if(drumBeat%4===2)voice(90,at,.18,.105,'cymbal');
        if((drop||reprise)&&drumBeat>=12)voice(48-(drumBeat-12)*3,at+step*.5,.22,.25,'tom');
        if([0,3,6,8,11,14].includes(drumBeat))voice(root-5+(drumBeat===6||drumBeat===14?7:0),at,drumBeat%8===0?.7:.36,drumBeat%8===0?.48:.28,'timpani');
        if([3,7,10,15].includes(drumBeat))voice(48,at+step*.12,.12,.12,'snare');
        if(bar%4===3&&drumBeat>=12)voice(48,at+step*.5,.11,.13+(drumBeat-12)*.035,'snare');
        if(local%32===0)voice(90,at,1.5,.16,'cymbal');
        if(local%4===0||local%8===3)voice(root+12+(local%8===3?7:0),at,step*2.5,.15,'strings');
      }
      if(intake){if(local%2===0)voice(88,at,.12,.04+local*.012,'noise');continue;}
      if(local%2===0){voice(root+(local%8===6?12:0),at,step*1.8,drop?.23:.17,'bass');voice(root+24+[0,7,12,15][local%4],at+step*.5,step*.7,reprise?.045:.025,'arp');}
      if(drop&&local%8===0)voice(root-12,at,step*5,.28,'pad');
      if((section===1||section===3)&&local%32>=28&&local%2===0)voice(64+[7,3][local%4/2],at,step*1.4,.075,'strings');
      if(local%16===0)for(const interval of [0,3,7,14])voice(root+12+interval,at,step*15,reprise?.12:.08,'choir');
      if(local%4===0||((drop||reprise)&&local%16===14))voice(30,at,.25,drop?.58:.43,'kick');
      if(local%8===4){voice(48,at,.22,drop?.49:.37,'snare');voice(50,at,.1,.12,'pad');}
      voice(90,at,local%2?.035:.065,local%2?.033:.055,'noise');
    }
    if(!prelude){
      for(let index=1;index<movements.length;index++){
        const incoming=movements[index],boundary=incoming.start*step;
        const gentle=['E-short','F-cinematic'].includes(incoming.name);
        // Common E/B tones overlap the bar line and bind the changing arrangements.
        for(const pitch of [52,59])voice(pitch,boundary-step*8,step*18,gentle?.10:.065,'choir',{swell:true});
        voice(76,boundary-step*12,step*16,gentle?.045:.07,'swell',{swell:true});
        if(incoming.name!=='B-drop'){
          for(let beat=0;beat<4;beat++)voice(55-beat*5,boundary-step*(4-beat),.24,gentle?.085:.13,'tom');
          voice(90,boundary,1.1,gentle?.055:.085,'cymbal');
        }
      }
    }
    // Rhythmic delay and soft saturation retain headroom at the louder mix.
    // Short hall reflections blend orchestral layers; restrained delay keeps a cybernetic edge.
    for(const [seconds,gain] of [[.071,.10],[.113,.075],[.181,.05],[.293,.03]]){
      const offset=Math.floor(seconds*rate);for(let i=offset;i<out.length;i++)out[i]+=hall[i-offset]*gain;
    }
    const delay=Math.floor(step*3*rate);
    for(let i=out.length-1;i>=delay;i--)out[i]+=out[i-delay]*.055;
    // The boss track ends exactly on the final bar: no fade and no release-tail silence.
    // The quieter prelude retains its short loop-edge envelope.
    for(let i=0;i<out.length;i++)out[i]=Math.tanh(out[i]*1.5)*.9*Math.min(1,i/(rate*.01),prelude?(out.length-i)/(rate*.02):1);
    return out;
  }
  function compose(track, sampleRate = 22050, notes = []) {
    if(track === "gaster_signal")return composeGaster(sampleRate);
    if (track === "tearesseract_prelude") return composeTearesseract(sampleRate, notes, true);
    if (track === "tearesseract") return composeTearesseract(sampleRate, notes);
    const arena = geomayhemTracks.find(song => song.id === track);
    if (arena) return composeGeomayhem(arena, sampleRate, notes);
    const chamber = chamberTracks.find(song => song.id === track);
    if (chamber) return composeChamber(chamber, sampleRate, notes);
    if (track === "singularity") return composeCinematicCore(sampleRate, notes);
    const rock = rockTracks.find(song => song.id === track) || bossTracks.find(song => song.id === track) || (track === impossibleRemix.id ? impossibleRemix : null);
    if (rock) return composeRock(rock, sampleRate, notes);
    const score = scores[track];
    if (!score) throw new Error(`Unknown music theme: ${track}`);
    const beat = 60 / score.bpm;
    const samples = new Float32Array(Math.round(score.roots.length * 4 * beat * sampleRate));
    const groove = grooves[score.groove || "classic"];
    const tones = new Map();
    function tone(pitch, start, duration, amplitude, voice) {
      if (!pitch) return;
      if (voice === "lead") notes.push({ start, duration });
      const offset = Math.round(start * sampleRate);
      const key = `${pitch}:${duration}:${amplitude}:${voice}`;
      if (!tones.has(key)) {
        const frequency = 440 * 2 ** ((pitch - 69) / 12);
        const data = new Float32Array(Math.floor(duration * sampleRate));
        const triangle = voice === "pad" || voice === "bass" || (voice === "lead" && score.lead === "triangle");
        const table = triangle ? null : pulseWave(score.pulse === "narrow", frequency, sampleRate);
        for (let i = 0; i < data.length; i++) {
          const t = i / sampleRate;
          const envelope = voice === "pad" && track === "core_aftermath"
            ? Math.min(1, t / .35, (duration - t) / .55)
            : Math.min(1, t / .004, (duration - t) / .018);
          const phase = (t * frequency) % 1;
          const wave = track === "christmas_99" && (voice === "lead" || voice === "pad")
            ? (Math.sin(t * frequency * Math.PI * 2) + .3 * Math.sin(t * frequency * Math.PI * 5.52)) * Math.exp(-t * 4)
            : triangle ? 1 - 4 * Math.abs(phase - .5) : table[Math.floor(phase * table.length)];
          if(track==='news_broadcast') {
            // Glassy FM electric keys distinguish this melody from Treasure Trove's reeds.
            if(voice==='lead'||voice==='answer'){
              const phase=2*Math.PI*frequency*t,index=1.5*Math.exp(-t*8);
              const keys=Math.sin(phase+index*Math.sin(phase*2))+.16*Math.sin(phase*3)*Math.exp(-t*10);
              const envelope=Math.max(0,Math.min(1,t/.006,(duration-t)/.045))*Math.exp(-t*1.3);
              data[i]=keys*amplitude*envelope*1.35;continue;
            }
            const brass=voice==='lead'||voice==='answer',bass=voice==='bass';
            const vibrato=brass?.0028*Math.sin(t*2*Math.PI*5.2)*(1-Math.exp(-t*15)):0;
            const fundamental=2*Math.PI*frequency*t+vibrato*frequency;
            let acoustic=0;
            for(let h=1;h<=8;h++){
              if(frequency*h>sampleRate*.46)break;
              const partial=brass?Math.pow(h,-1.25)*Math.exp(-t*h*.55):bass?Math.exp(-t*(3+h))/Math.pow(h,1.7):Math.exp(-t*(2.2+h*.8))/Math.pow(h,1.55);
              acoustic+=Math.sin(fundamental*h*(brass||bass?1:1+h*h*.00009))*partial;
            }
            const envelope=Math.max(0,Math.min(1,t/(brass?.022:bass?.006:.003),(duration-t)/(brass?.05:.035)));
            data[i]=acoustic*amplitude*envelope*(brass?.9:1.1);continue;
          }
          if(track==='treasure_trove') {
            // Bowed strings, mandolin harmonics, double bass and reed chords; no pulse oscillator.
            const bowed=voice==='lead'||voice==='answer',plucked=voice==='arp',bass=voice==='bass';
            const vibrato=bowed?.0035*Math.sin(t*Math.PI*2*5.4)*(1-Math.exp(-t*18)):0;
            const phase=Math.PI*2*frequency*t+vibrato*frequency;
            let acoustic=0;
            for(let harmonic=1;harmonic<=(bass?4:8);harmonic++){
              const body=bowed?Math.pow(harmonic,-1.35)*(harmonic===3?1.3:1):plucked?Math.exp(-t*(3+harmonic*1.5))/harmonic:bass?Math.exp(-t*2.8)/harmonic**1.8:(harmonic%2?1:.35)/harmonic**1.3;
              acoustic+=Math.sin(phase*harmonic*(plucked?1+harmonic*harmonic*.00013:1))*body;
            }
            const attack=bowed?.035:plucked?.002:bass?.012:.055,release=bowed?.055:.04;
            const naturalEnvelope=Math.max(0,Math.min(1,t/attack,(duration-t)/release));
            data[i]=acoustic*amplitude*naturalEnvelope*(bowed?.8:1);continue;
          }
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
      const duration = track === "news_broadcast" ? (kind === "kick" ? .25 : kind === "snare" ? .18 : .055) : track === "treasure_trove" ? (kind === "kick" ? .38 : .14) : kind === "hat" ? .035 : .13;
      const offset = Math.round(start * sampleRate);
      let previousNoise = 0;
      for (let i = 0; i < duration * sampleRate && offset + i < samples.length; i++) {
        const t = i / sampleRate;
        seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0;
        const noise = seed / 2147483648 - 1;
        const envelope = Math.min(1, t / .002) * (1 - t / duration) ** 3;
        const wave = kind === "kick" ? Math.sin(2 * Math.PI * (58 * t + 5 * (1 - Math.exp(-t * 35))))
          : kind === "hat" ? (noise - previousNoise) * .18 : noise * .5;
        const deck=kind==='kick'?(Math.sin(2*Math.PI*(72*t+1.4*(1-Math.exp(-t*22))))+.35*Math.sin(2*Math.PI*117*t)+.2*Math.sin(2*Math.PI*186*t))*Math.exp(-t*5):kind==='snare'?.35*noise*Math.exp(-t*24)+.45*Math.sin(2*Math.PI*310*t)*Math.exp(-t*35):.3*Math.sin(2*Math.PI*1350*t)*Math.exp(-t*65)+.1*noise;
        const studio=kind==='kick'?Math.sin(2*Math.PI*(48*t+1.7*(1-Math.exp(-t*30))))*Math.exp(-t*9):kind==='snare'?(noise*.48+Math.sin(2*Math.PI*185*t)*.35*Math.exp(-t*35)):(noise-previousNoise)*.18;
        samples[offset + i] += (track==='news_broadcast'?studio:track==='treasure_trove'?deck:wave) * envelope * (kind === "kick" ? .3 : .2) * volume;
        previousNoise = noise;
      }
    }
    for (let bar = 0; bar < score.roots.length; bar++) {
      const root = score.roots[bar], chord = score.chords[bar];
      const start = bar * 4 * beat;
      if (track === "core_aftermath") {
        // Broad sustained strings, octave brass and rolling low percussion.
        for (const interval of chord) {
          tone(root + 12 + interval, start, beat * 3.95, .13, "pad");
          tone(root + 24 + interval, start + beat * 2, beat * 1.95, .07, "pad");
        }
        for (const position of [0, .5, 2, 2.5, 3.5]) drum(start + position * beat, "kick", 1.8);
      }
      if (track === "christmas_99") {
        for (let n = 0; n < 8; n++) tone(root + 48 + chord[n % chord.length], start + n * beat / 2, beat * .3, .06, "pad");
      }
      const swing = n => n + (n % 2 ? score.swing || 0 : 0);
      const melodyStep = 4 * beat / score.melody[bar].length;
      score.melody[bar].forEach((pitch, n) => tone(pitch, start + swing(n) * melodyStep,
        melodyStep * .84 * (score.gate || 1), .21, "lead"));
      groove.bass.forEach((position, n) => tone(root + (n % 4 === 3 ? 12 : n % 2 ? 7 : 0),
        start + position * beat, beat * (score.bassGate || (score.groove === "hush" ? .85 : .4)), .24, "bass"));
      for (let n = 0; n < groove.hats; n++)
        drum(start + (n + (n % 2 ? score.swing || 0 : 0)) * 4 * beat / groove.hats, "hat", score.groove === "hush" ? .55 : 1);
      for (let n = 0; n < (['treasure_trove','news_broadcast'].includes(track)?8:16); n++)
        tone(root + 24 + chord[[0, 1, 2, chord.length === 4 ? 3 : 1][n % 4]], start + n * beat / (['treasure_trove','news_broadcast'].includes(track)?2:4), beat * (track==='news_broadcast'?.65:track==='treasure_trove'?.8:.18), track==='treasure_trove'?.09:.065, "arp");
      if(track==='news_broadcast')for(const position of [.5,2.5])for(const interval of chord)tone(root+24+interval,start+position*beat,beat*.7,.065,'pad');
      if(track==='treasure_trove')for(const position of [1,3])for(const interval of chord)tone(root+24+interval,start+position*beat,beat*.8,.045,'pad');
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
    if(track==='news_broadcast'){
      const dry=samples.slice();
      for(const [delay,level] of [[.037,.12],[.079,.075],[.127,.04]]){
        const offset=Math.round(delay*sampleRate);for(let i=offset;i<samples.length;i++)samples[i]+=dry[i-offset]*level;
      }
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
      this.pendingBuffers=new Map();this.loadingTrack=null;this.loadError=null;
      this.melodyNotes = new Map();
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
      if(archive?.has(theme)&&!this.buffers.has(theme)){
        if(!this.pendingBuffers.has(theme)){
          const pending=archive.render(theme).then(buffer=>{
            this.buffers.set(theme,buffer);this.pendingBuffers.delete(theme);
            const cached=[...this.buffers.keys()].filter(id=>archive.has(id));
            while(cached.length>12){const oldest=cached.shift();if(oldest!==this.track)this.buffers.delete(oldest);}
            return buffer;
          },error=>{this.pendingBuffers.delete(theme);throw error;});
          this.pendingBuffers.set(theme,pending);
        }
        return this.pendingBuffers.get(theme);
      }
      if (!this.buffers.has(theme)) {
        const notes = [];
        const data = compose(theme, 22050, notes);
        this.melodyNotes.set(theme, notes.sort((a, b) => a.start - b.start));
        const buffer = this.context.createBuffer(1, data.length, 22050);
        buffer.copyToChannel(data, 0);
        this.buffers.set(theme, buffer);
      }
      return this.buffers.get(theme);
    }
    melodyPulse() {
      if (!this.playing || !this.current || this.context.state === "suspended") return 0;
      const voice = this.current;
      const elapsed = voice.offset + this.context.currentTime - voice.started;
      const time = voice.source.loop ? elapsed % voice.source.buffer.duration : elapsed;
      const notes = this.melodyNotes.get(voice.track) || [];
      // Binary search follows the audio clock, including pauses and loop wraps.
      let lo = 0, hi = notes.length;
      while (lo < hi) {
        const mid = (lo + hi) >>> 1;
        if (notes[mid].start <= time) lo = mid + 1;
        else hi = mid;
      }
      const note = notes[lo - 1];
      if (!note) return 0;
      // Compress the visual envelope by 1.5 without changing note timing.
      const age = (time - note.start) * 1.5;
      const length = Math.min(.4, note.duration);
      return age < length ? Math.sin(Math.PI * Math.min(1, age / .035) / 2) * (1 - age / length) ** 2 : 0;
    }
    retire(voice, fade) {
      const now = this.context.currentTime;
      if (voice.stopAt && voice.stopAt <= now + fade) return;
      voice.stopAt = now + fade;
      if (voice.gain.gain.cancelAndHoldAtTime) voice.gain.gain.cancelAndHoldAtTime(now);
      else { voice.gain.gain.cancelScheduledValues(now); voice.gain.gain.setValueAtTime(voice.gain.gain.value, now); }
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
      const jukebox = theme.startsWith("jukebox:");
      if (jukebox ? !jukeboxTracks.some(track => track.id === theme.slice(8))
        : theme !== "arcade" && !loopThemes.includes(theme)) throw new Error(`Unknown music theme: ${theme}`);
      if (jukebox) {
        this.oneShot = null;
        this.interruptedArcade = null;
      }
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
        this.onPlaybackChange?.();
        return;
      }
      if (this.current) return;
      this.start();
    }
    start() {
      if (!this.track) this.track = this.theme.startsWith("jukebox:") ? this.theme.slice(8)
        : this.oneShot || (loopThemes.includes(this.theme) ? this.theme : this.nextTrack());
      const buffer=this.buffer(this.track);
      if(buffer&&typeof buffer.then==='function'){
        const track=this.track,theme=this.theme;
        if(this.loadingTrack!==track){this.loadingTrack=track;this.loadError=null;this.onPlaybackChange?.();
          buffer.then(()=>{if(this.loadingTrack===track)this.loadingTrack=null;if(this.track===track&&this.theme===theme&&this.playing&&!this.current)this.start();this.onPlaybackChange?.();},error=>{if(this.track===track){this.loadingTrack=null;this.loadError=error.message;this.onPlaybackChange?.();}});
        }return;
      }
      this.loadingTrack=null;this.loadError=null;
      const source = this.context.createBufferSource();
      const gain = this.context.createGain();
      source.buffer = buffer;
      source.loop = this.theme.startsWith("jukebox:") || loopThemes.includes(this.theme);
      gain.gain.setValueAtTime(0, this.context.currentTime);
      gain.gain.linearRampToValueAtTime(this.track === "news_broadcast" ? .34 : this.track === "core_aftermath" ? .36 : .22, this.context.currentTime + .18);
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
      this.onPlaybackChange?.();
    }
  }
  return { compose, composeGaster, gasterDuration, Player, geomayhemTracks, tracks, arcadeTracks: tracks, dodgeTracks, bossTracks, rockTracks, pickRockTrack, jukeboxTracks };
})();
if (typeof module !== "undefined") module.exports = ArcadeMusic;
