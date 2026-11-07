const { test, expect, openGame } = require('./fixtures/game.cjs');

// Keep unrelated score assertions independent of the randomly selected song.
test.use({ deterministicMusic: true });

test("arcade music shuffles the full song catalog automatically before repeating", async ({ page }) => {
  await openGame(page);
  const errors = [];
  page.on("pageerror", error => errors.push(error.message));
  await page.locator('h1').click();
  await expect.poll(() => page.evaluate(() => audioContext?.state)).toBe("running");
  const heard = [];
  const totalTracks = await page.evaluate(() => ArcadeMusic.tracks.length);
  for (let i = 0; i < totalTracks; i++) {
    const track = await page.evaluate(() => musicPlayer.track);
    heard.push(track);
    expect(await page.evaluate(() => musicPlayer.current.source.loop)).toBe(false);
    // Exercise real Web Audio natural-end events without waiting ten minutes.
    await page.evaluate(() => musicPlayer.current.source.playbackRate.setValueAtTime(1000, audioContext.currentTime));
    await expect.poll(() => page.evaluate(() => musicPlayer.track)).not.toBe(track);
    await expect.poll(() => page.evaluate(() => musicPlayer.voices.size)).toBe(1);
  }
  expect([...heard].sort()).toEqual(await page.evaluate(() => ArcadeMusic.tracks.map(track => track.id).sort()));
  expect(new Set(heard).size).toBe(totalTracks);
  expect(errors).toEqual([]);
});

test('Boss Crush difficulties play increasingly heavy rock themes and return to arcade music after combat', async ({ page }) => {
  const errors = [];
  page.on('pageerror', error => errors.push(error.message));
  await page.route('**/app.js*', async route => {
    const response = await route.fetch();
    await route.fulfill({ response, body: (await response.text()).replace('const pyodide = await loadPyodide(',
      'const pyodide = window.testBossMusicRuntime = await loadPyodide(') });
  });
  await page.route('**/python/bridge.py', async route => {
    const response = await route.fetch();
    await route.fulfill({ response, body: (await response.text()).replace('self.game = BossCrush(difficulty)',
      'self.game = BossCrush(difficulty)\n            self.game.invulnerable = 1000000') });
  });
  await openGame(page);
  await page.evaluate(() => testBossMusicRuntime.runPython('from bridge import session\nfrom boss_crush import Projectile'));
  const heard = [];
  for (const difficulty of ['mean', 'cruel', 'nightmare', 'impossible']) {
    await page.locator('[data-game="boss"]').click();
    await page.locator(`[data-difficulty="${difficulty}"]`).click();
    expect(await page.evaluate(() => musicPlayer.theme)).toBe(`boss_${difficulty}`);
    expect(await page.evaluate(() => musicPlayer.current.source.loop)).toBe(true);
    heard.push(await page.evaluate(() => musicPlayer.track));
    await expect.poll(() => page.evaluate(() => musicPlayer.voices.size)).toBe(1);
    await page.evaluate(() => {
      window.bossMusicVoice = musicPlayer.current;
      window.bossMusicProbe = audioContext.createAnalyser();
      audioMaster.connect(window.bossMusicProbe);
    });
    await expect.poll(() => page.evaluate(() => {
      const samples = new Float32Array(window.bossMusicProbe.fftSize);
      window.bossMusicProbe.getFloatTimeDomainData(samples);
      return Math.max(...samples.map(Math.abs));
    })).toBeGreaterThan(.001);
    await page.keyboard.press('f');
    expect(await page.evaluate(() => musicPlayer.current === window.bossMusicVoice)).toBe(true);
    await page.locator('#pause').click();
    await expect.poll(() => page.evaluate(() => musicPlayer.voices.size)).toBe(0);
    const offset = await page.evaluate(() => musicPlayer.offset);
    await page.locator('#overlay-action').click();
    expect(await page.evaluate(() => musicPlayer.current.offset)).toBe(offset);
    await page.locator('#sound').click();
    await expect.poll(() => page.evaluate(() => musicPlayer.voices.size)).toBe(0);
    const mutedOffset = await page.evaluate(() => musicPlayer.offset);
    await page.locator('#sound').click();
    expect(await page.evaluate(() => musicPlayer.current.offset)).toBe(mutedOffset);
    await page.evaluate(() => {
      Object.defineProperty(document, 'hidden', { configurable: true, value: true });
      document.dispatchEvent(new Event('visibilitychange'));
    });
    await expect.poll(() => page.evaluate(() => musicPlayer.voices.size)).toBe(0);
    const hiddenOffset = await page.evaluate(() => musicPlayer.offset);
    await page.evaluate(() => {
      delete document.hidden;
      document.dispatchEvent(new Event('visibilitychange'));
    });
    await page.locator('#overlay-action').click();
    expect(await page.evaluate(() => musicPlayer.current.offset)).toBe(hiddenOffset);
    await page.evaluate(() => {
      testBossMusicRuntime.runPython('session.game.hp = 5\nsession.game.shots = [Projectile(session.game.boss_x, session.game.boss_y, 0, 520)]');
      snapshot = send('tick', { dt: .001 });
      render();
    });
    await expect(page.locator('#overlay-title')).toHaveText('You did it!');
    expect(await page.evaluate(() => musicPlayer.theme)).toBe('arcade');
    await expect.poll(() => page.evaluate(() => musicPlayer.voices.size)).toBe(1);
  }
  expect(new Set(heard).size).toBe(4);
  await page.locator('#overlay-action').click();
  await page.locator('[data-difficulty="mean"]').click();
  await page.evaluate(() => {
    testBossMusicRuntime.runPython('session.game.alive = False\nsession.game.lives = 0');
    snapshot = send('tick', { dt: 0 });
    render();
  });
  // The boss theme remains through the death animation, then returns to arcade.
  await expect(page.locator('#overlay-title')).toHaveText('One more try?');
  expect(await page.evaluate(() => musicPlayer.theme)).toBe('arcade');
  await page.locator('#overlay-action').click();
  await page.locator('[data-difficulty="mean"]').click();
  await page.locator('#exit').click();
  expect(await page.evaluate(() => musicPlayer.theme)).toBe('arcade');
  expect(errors).toEqual([]);
});

test('each Turtle Dodge difficulty has its own looping theme with mute, pause, hidden tabs, and game-over transitions', async ({ page }) => {
  const errors = [];
  page.on('pageerror', error => errors.push(error.message));
  await page.route('**/app.js*', async route => {
    const response = await route.fetch();
    await route.fulfill({ response, body: (await response.text()).replace('const pyodide = await loadPyodide(',
      'const pyodide = window.testDodgeAudioRuntime = await loadPyodide(') });
  });
  // Transport checks should not depend on dodging random spawns while clicking controls.
  await page.route('**/python/bridge.py', async route => {
    const response = await route.fetch();
    await route.fulfill({ response, body: (await response.text()).replace('self.game = DodgeGame(difficulty=difficulty)',
      'self.game = DodgeGame(difficulty=difficulty)\n            self.game.spawn_in = 1000000') });
  });
  await openGame(page);
  await page.evaluate(() => testDodgeAudioRuntime.runPython('from bridge import session\nfrom dodge_model import Block'));
  const heard = [];
  for (const mode of ['easy', 'normal', 'hard', 'merciless']) {
    await page.locator('[data-game="dodge"]').click();
    expect(await page.evaluate(() => musicPlayer.theme)).toBe('arcade');
    await page.locator(`[data-difficulty="${mode}"]`).click();
    expect(await page.evaluate(() => musicPlayer.theme)).toBe(`dodge_${mode}`);
    expect(await page.evaluate(() => musicPlayer.current.source.loop)).toBe(true);
    heard.push(await page.evaluate(() => musicPlayer.track));
    await expect.poll(() => page.evaluate(() => musicPlayer.voices.size)).toBe(1);
    await page.evaluate(() => {
      window.dodgeMusicProbe = audioContext.createAnalyser();
      audioMaster.connect(window.dodgeMusicProbe);
    });
    await expect.poll(() => page.evaluate(() => {
      const samples = new Float32Array(window.dodgeMusicProbe.fftSize);
      window.dodgeMusicProbe.getFloatTimeDomainData(samples);
      return Math.max(...samples.map(Math.abs));
    })).toBeGreaterThan(.001);
    await page.locator('#sound').click();
    await expect.poll(() => page.evaluate(() => musicPlayer.voices.size)).toBe(0);
    const mutedOffset = await page.evaluate(() => musicPlayer.offset);
    await page.locator('#sound').click();
    expect(await page.evaluate(() => musicPlayer.current.offset)).toBe(mutedOffset);
    if (mode !== 'merciless') {
      await page.locator('#pause').click();
      await expect.poll(() => page.evaluate(() => musicPlayer.voices.size)).toBe(0);
      const pausedOffset = await page.evaluate(() => musicPlayer.offset);
      await page.locator('#overlay-action').click();
      expect(await page.evaluate(() => musicPlayer.current.offset)).toBe(pausedOffset);
    } else await expect(page.locator('#pause')).toBeHidden();
    await page.evaluate(() => {
      Object.defineProperty(document, 'hidden', { configurable: true, value: true });
      document.dispatchEvent(new Event('visibilitychange'));
    });
    await expect.poll(() => page.evaluate(() => musicPlayer.voices.size)).toBe(0);
    const hiddenOffset = await page.evaluate(() => musicPlayer.offset);
    await page.evaluate(() => {
      delete document.hidden;
      document.dispatchEvent(new Event('visibilitychange'));
    });
    if (mode !== 'merciless') await page.locator('#overlay-action').click();
    expect(await page.evaluate(() => musicPlayer.current.offset)).toBe(hiddenOffset);
    expect(await page.evaluate(() => musicPlayer.theme)).toBe(`dodge_${mode}`);
    await page.evaluate(() => {
      testDodgeAudioRuntime.runPython("session.game.blocks = [Block(session.game.x, session.game.y, ((0, 0),), session.game.rules.color or '#48d9ef')]");
      snapshot = send('tick', { dt: .001 });
      render();
    });
    await expect(page.locator('#overlay')).toBeVisible();
    expect(await page.evaluate(() => musicPlayer.theme)).toBe('arcade');
    await expect.poll(() => page.evaluate(() => musicPlayer.voices.size)).toBe(1);
  }
  expect(new Set(heard).size).toBe(4);
  await page.locator('#overlay-action').click();
  await page.locator('[data-difficulty="easy"]').click();
  await page.locator('#exit').click();
  expect(await page.evaluate(() => musicPlayer.theme)).toBe('arcade');
  await expect.poll(() => page.evaluate(() => musicPlayer.voices.size)).toBe(1);
  expect(errors).toEqual([]);
});

test('Hangman plays its own theme in all difficulties, survives mute and hidden tabs, and stops on wins, losses, and exit', async ({ page }) => {
  const errors = [];
  page.on('pageerror', error => errors.push(error.message));
  await page.route('**/python/bridge.py', async route => {
    const response = await route.fetch();
    await route.fulfill({ response, body: (await response.text()).replace('random.choice(rules["words"])', '"cat"') });
  });
  await openGame(page);
  for (const difficulty of ['easy', 'medium', 'hard']) {
    await page.locator('[data-game="hangman"]').click();
    expect(await page.evaluate(() => musicPlayer.theme)).toBe('arcade');
    await page.locator(`[data-difficulty="${difficulty}"]`).click();
    expect(await page.evaluate(() => ({ theme: musicPlayer.theme, track: musicPlayer.track,
      loop: musicPlayer.current.source.loop, duration: musicPlayer.current.source.buffer.duration })))
      .toEqual({ theme: 'hangman', track: 'hangman', loop: true, duration: 64 });
    await expect.poll(() => page.evaluate(() => musicPlayer.voices.size)).toBe(1);
    if (difficulty === 'easy') {
      await page.evaluate(() => {
        window.hangmanVoice = musicPlayer.current;
        window.hangmanProbe = audioContext.createAnalyser();
        audioMaster.connect(window.hangmanProbe);
      });
      await expect.poll(() => page.evaluate(() => {
        const samples = new Float32Array(window.hangmanProbe.fftSize);
        window.hangmanProbe.getFloatTimeDomainData(samples);
        return Math.max(...samples.map(Math.abs));
      })).toBeGreaterThan(.001);
      await page.getByRole('button', { name: 'Guess Z', exact: true }).click();
      expect(await page.evaluate(() => musicPlayer.current === window.hangmanVoice)).toBe(true);
      await page.locator('#sound').click();
      await expect.poll(() => page.evaluate(() => musicPlayer.voices.size)).toBe(0);
      const mutedOffset = await page.evaluate(() => musicPlayer.offset);
      await page.locator('#sound').click();
      expect(await page.evaluate(() => musicPlayer.current.offset)).toBe(mutedOffset);
      await page.evaluate(() => {
        Object.defineProperty(document, 'hidden', { configurable: true, value: true });
        document.dispatchEvent(new Event('visibilitychange'));
      });
      await expect.poll(() => page.evaluate(() => musicPlayer.voices.size)).toBe(0);
      const hiddenOffset = await page.evaluate(() => musicPlayer.offset);
      await page.evaluate(() => {
        delete document.hidden;
        document.dispatchEvent(new Event('visibilitychange'));
      });
      expect(await page.evaluate(() => musicPlayer.current.offset)).toBe(hiddenOffset);
      expect(await page.evaluate(() => musicPlayer.theme)).toBe('hangman');
    }
    const letters = difficulty === 'medium' ? 'BDEFGHIJKLMNOPQRSUVWXYZ' : 'CAT';
    for (const letter of letters) {
      if (await page.locator('#overlay').isVisible()) break;
      await page.getByRole('button', { name: `Guess ${letter}`, exact: true }).click();
    }
    await expect(page.locator('#overlay')).toBeVisible();
    expect(await page.evaluate(() => musicPlayer.theme)).toBe('arcade');
    await expect.poll(() => page.evaluate(() => musicPlayer.voices.size)).toBe(1);
  }
  await page.locator('#overlay-action').click();
  await page.locator('[data-difficulty="easy"]').click();
  expect(await page.evaluate(() => musicPlayer.theme)).toBe('hangman');
  await page.locator('#exit').click();
  expect(await page.evaluate(() => musicPlayer.theme)).toBe('arcade');
  await expect.poll(() => page.evaluate(() => musicPlayer.voices.size)).toBe(1);
  expect(errors).toEqual([]);
});

test('Key Rush plays its own theme through typing rounds, mute, and hidden tabs, then returns to arcade music', async ({ page }, testInfo) => {
  const errors = [];
  page.on('pageerror', error => errors.push(error.message));
  // Keep audio checks independent of how quickly the test types a sequence.
  await page.route('**/python/bridge.py', async route => {
    const response = await route.fetch();
    await route.fulfill({ response, body: (await response.text()).replace('KeyboardRound(sequence, seconds, now)', 'KeyboardRound(sequence, 600, now)') });
  });
  await openGame(page);
  await page.locator('[data-game="keyboard"]').click();
  expect(await page.evaluate(() => musicPlayer.theme)).toBe('arcade');
  await page.locator('[data-difficulty="progressive"]').click();
  expect(await page.evaluate(() => ({ theme: musicPlayer.theme, track: musicPlayer.track,
    loop: musicPlayer.current.source.loop, duration: musicPlayer.current.source.buffer.duration })))
    .toEqual({ theme: 'keyrush', track: 'keyrush', loop: true, duration: 48 });
  await expect.poll(() => page.evaluate(() => musicPlayer.voices.size)).toBe(1);
  await page.evaluate(() => {
    window.keyrushVoice = musicPlayer.current;
    window.keyrushProbe = audioContext.createAnalyser();
    audioMaster.connect(window.keyrushProbe);
  });
  await expect.poll(() => page.evaluate(() => {
    const samples = new Float32Array(window.keyrushProbe.fftSize);
    window.keyrushProbe.getFloatTimeDomainData(samples);
    return Math.max(...samples.map(Math.abs));
  })).toBeGreaterThan(.001);
  const sequence = await page.locator('#sequence').textContent();
  if (testInfo.project.name === 'mobile') {
    await page.locator('.typing-device summary').click();
    await page.locator('#typing-input').fill(sequence);
  }
  else await page.keyboard.type(sequence);
  await expect(page.locator('#score')).toHaveText('1');
  expect(await page.evaluate(() => musicPlayer.current === window.keyrushVoice)).toBe(true);
  await page.locator('#sound').click();
  await expect.poll(() => page.evaluate(() => musicPlayer.voices.size)).toBe(0);
  const mutedOffset = await page.evaluate(() => musicPlayer.offset);
  await page.locator('#sound').click();
  expect(await page.evaluate(() => musicPlayer.current.offset)).toBe(mutedOffset);
  await page.evaluate(() => {
    Object.defineProperty(document, 'hidden', { configurable: true, value: true });
    document.dispatchEvent(new Event('visibilitychange'));
  });
  await expect.poll(() => page.evaluate(() => musicPlayer.voices.size)).toBe(0);
  const hiddenOffset = await page.evaluate(() => musicPlayer.offset);
  await page.evaluate(() => {
    delete document.hidden;
    document.dispatchEvent(new Event('visibilitychange'));
  });
  expect(await page.evaluate(() => musicPlayer.current.offset)).toBe(hiddenOffset);
  expect(await page.evaluate(() => musicPlayer.theme)).toBe('keyrush');
  await page.locator('#exit').click();
  expect(await page.evaluate(() => musicPlayer.theme)).toBe('arcade');
  await expect.poll(() => page.evaluate(() => musicPlayer.voices.size)).toBe(1);
  await page.locator('[data-difficulty="progressive"]').click();
  expect(await page.evaluate(() => musicPlayer.theme)).toBe('keyrush');
  await page.evaluate(() => { snapshot = send('tick', { now: 1e9 }); render(); });
  await expect(page.locator('#overlay-title')).toHaveText('Time’s up!');
  expect(await page.evaluate(() => musicPlayer.theme)).toBe('arcade');
  await expect.poll(() => page.evaluate(() => musicPlayer.voices.size)).toBe(1);
  expect(errors).toEqual([]);
});

test("chiptune audio switches for every Pumpkin mode and obeys pause, mute, and visibility", async ({ page }) => {
  await openGame(page);
  const errors = [];
  page.on("pageerror", error => errors.push(error.message));
  await expect(page.locator("#sound")).toHaveAttribute("aria-pressed", "true");
  expect(await page.evaluate(() => typeof audioContext)).toBe("undefined");
  await page.locator('[data-game="pumpkin"]').click();
  await expect.poll(() => page.evaluate(() => audioContext.state)).toBe("running");
  expect(await page.evaluate(() => musicPlayer.theme)).toBe("arcade");
  await page.evaluate(() => {
    window.musicProbe = audioContext.createAnalyser();
    audioMaster.connect(window.musicProbe);
  });
  const level = () => page.evaluate(() => {
    const samples = new Float32Array(window.musicProbe.fftSize);
    window.musicProbe.getFloatTimeDomainData(samples);
    return Math.sqrt(samples.reduce((sum, sample) => sum + sample * sample, 0) / samples.length);
  });
  await expect.poll(level).toBeGreaterThan(.001);
  for (const mode of ["phase2", "coward", "baby", "come_on"]) {
    await page.locator(`[data-difficulty="${mode}"]`).click();
    expect(await page.evaluate(() => musicPlayer.theme)).toBe("pumpkin");
    await expect.poll(() => page.evaluate(() => musicPlayer.voices.size)).toBe(1);
    expect(await page.evaluate(() => musicPlayer.current.source.loop)).toBe(true);
    await page.locator("#pause").click();
    await expect.poll(() => page.evaluate(() => musicPlayer.voices.size)).toBe(0);
    expect(await page.evaluate(() => musicPlayer.offset)).toBeGreaterThan(0);
    await page.locator("#overlay-action").click();
    expect(await page.evaluate(() => musicPlayer.current.offset)).toBeGreaterThan(0);
    await page.locator("#sound").click();
    await expect.poll(() => page.evaluate(() => musicPlayer.voices.size)).toBe(0);
    await expect.poll(level).toBe(0);
    await page.locator("#sound").click();
    await expect.poll(level).toBeGreaterThan(.001);
    expect(await page.evaluate(() => musicPlayer.theme)).toBe("pumpkin");
    await page.locator("#exit").click();
    expect(await page.evaluate(() => musicPlayer.theme)).toBe("arcade");
  }
  // Losing the fight returns to the arcade score, without leaving two loops.
  await page.locator('[data-difficulty="phase2"]').click();
  await page.keyboard.down("ArrowUp");
  await expect(page.locator("#overlay")).toBeVisible();
  await page.keyboard.up("ArrowUp");
  expect(await page.evaluate(() => musicPlayer.theme)).toBe("arcade");
  await expect.poll(() => page.evaluate(() => musicPlayer.voices.size)).toBe(1);
  // Simulate the browser visibility event: hidden tabs are silent.
  await page.evaluate(() => {
    Object.defineProperty(document, "hidden", { configurable: true, value: true });
    document.dispatchEvent(new Event("visibilitychange"));
  });
  await expect.poll(() => page.evaluate(() => musicPlayer.voices.size)).toBe(0);
  await page.evaluate(() => {
    delete document.hidden;
    document.dispatchEvent(new Event("visibilitychange"));
  });
  await expect.poll(level).toBeGreaterThan(.001);
  await page.locator('[data-game="hangman"]').click();
  await page.locator('[data-difficulty="easy"]').click();
  expect(await page.evaluate(() => musicPlayer.theme)).toBe("hangman");
  expect(errors).toEqual([]);
});

test("games remain playable when browser audio is unavailable", async ({ page }) => {
  const errors = [];
  page.on("pageerror", error => errors.push(error.message));
  await page.addInitScript(() => {
    window.AudioContext = class { constructor() { throw new Error("Audio disabled"); } };
  });
  await openGame(page);
  await page.locator('[data-difficulty="easy"]').click();
  await expect(page.locator("#sound")).toHaveText("Sound unavailable");
  await expect(page.locator("#hangman-game")).toBeVisible();
  await page.getByRole("button", { name: "Guess A", exact: true }).click();
  await expect(page.getByRole("button", { name: "Guess A", exact: true })).toBeDisabled();
  expect(errors).toEqual([]);
});

