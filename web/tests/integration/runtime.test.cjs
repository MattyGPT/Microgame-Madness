const { test } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const { loadPyodide } = require("pyodide");

test("packaged Python runs in WebAssembly without desktop dependencies", async () => {
  const py = await loadPyodide();
  py.FS.mkdir("/game");
  const root = path.resolve(__dirname, "../../../dist");
  for (const file of JSON.parse(
    fs.readFileSync(path.join(root, "python-files.json")),
  )) {
    py.FS.writeFile(
      `/game/${file}`,
      fs.readFileSync(path.join(root, "python", file)),
    );
  }
  py.runPython(
    "import sys\nsys.path.insert(0, '/game')\nfrom bridge import handle",
  );
  const handle = py.globals.get("handle");
  const practice = JSON.parse(handle(JSON.stringify({ action: "core_practice_options" })));
  assert.equal(practice.attacks.length, 15);
  for (const [mode, difficulty] of [
    ["hangman", "easy"],
    ["geomayhem", "level_1"],
    ["geomayhem", "level_10"],
    ["keyboard", "progressive"],
    ["keyboard", "endurance"],
    ["dodge", "merciless"],
    ["dodge", "impossible"],
    ["boss", "impossible"],
    ["pumpkin", "phase2"],
    ["pumpkin", "coward"],
    ["pumpkin", "baby"],
    ["pumpkin", "come_on"],
    ["singularity", "gravitron"],
    ...practice.attacks.map(attack => ["core_practice", attack.id]),
    ...['color_memory', 'bone_gauntlet', 'rotating_rings', 'magenta_fingers', 'chaos', 'royal_slams', 'haunted_quadrants', 'random_order']
      .map(attack => ['wrath', attack]),
  ]) {
    let state = JSON.parse(
      handle(JSON.stringify({ action: "start", mode, difficulty, now: 0, ...(mode === "geomayhem" ? { campaign: { cleared: 9, unlocked_level: 10 } } : {}) })),
    );
    assert.equal(state.mode, mode);
    if (mode === "pumpkin") {
      const hp = { phase2: 5, coward: 10, baby: 15, come_on: 23 }[difficulty];
      assert.equal(state.lives, hp);
      assert.equal(state.max_lives, hp);
    }
    for (let frame = 0; frame < 90; frame++) {
      state = JSON.parse(
        handle(
          JSON.stringify({
            action: "tick",
            dt: 1 / 60,
            now: frame / 60,
            keys: ["Left", "f"],
          }),
        ),
      );
      assert.equal(typeof state.score, "number");
    }
    if (["dodge", "boss", "pumpkin", "wrath", "singularity", "core_practice"].includes(mode))
      assert.ok(state.commands.length);
  }
  assert.equal(
    py.runPython("'tkinter' in sys.modules or 'turtle' in sys.modules"),
    false,
  );
  handle.destroy();
});
