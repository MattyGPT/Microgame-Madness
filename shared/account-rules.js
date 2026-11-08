"use strict";

// Pure account operations. Browser gameplay and trusted server commands use the
// same catalogs and achievement tracker; the database owns operation receipts.
const AccountRules = (() => {
  const isNode = typeof module !== 'undefined' && module.exports;
  const achievements = isNode ? require('../web/achievements.js') : globalThis.Achievements;
  const shop = isNode ? require('../web/shop.js') : globalThis.CubieShop;
  const customs = isNode ? require('../web/customs.js') : globalThis.CubieCustoms;
  const trails = isNode ? require('../web/trails.js') : globalThis.TurtleTrails;
  const catalog = [...customs.catalog, ...trails.catalog];
  const modes = Object.fromEntries(Object.entries(shop.rates).map(([mode, rate]) => [mode, Object.keys(rate.modes)]));
  modes.core_practice = achievements.attackRewards.filter(a => a.family === 'core').map(a => a.key);
  modes.geomayhem = Array.from({length:10}, (_,i) => `level_${i+1}`);
  const clone = value => JSON.parse(JSON.stringify(value));
  const object = value => value !== null && typeof value === 'object' && !Array.isArray(value)
    && (Object.getPrototypeOf(value) === Object.prototype || Object.getPrototypeOf(value) === null);
  const integer = (value, max = 1000000000) => Number.isSafeInteger(value) && value >= 0 && value <= max;
  const identifier = value => typeof value === 'string' && /^[A-Za-z0-9_-]{1,128}$/.test(value)
    && value !== 'prototype' && !Object.hasOwn(Object.prototype, value);
  const streakKeys = ['bossCleanStreak', 'bossSovereignStreak', 'bossRunActive', 'bossSovereignRunActive'];
  const numericSnapshot = ['score', 'mistakes', 'remaining', 'damage_taken', 'attacks_completed', 'counter_hits',
    'shots_fired', 'fight_elapsed', 'healing_collected', 'near_misses', 'elapsed', 'lives', 'max_lives', 'hp', 'max_hp', 'geo_level', 'geo_kills', 'geo_waves', 'geo_rank', 'geo_weapon_count', 'geo_max_stars', 'geo_five_star_count', 'geo_relic_count'];
  const booleanSnapshot = ['over', 'won', 'shielded'];
  const cumulative = ['damage_taken', 'attacks_completed', 'counter_hits', 'shots_fired', 'fight_elapsed',
    'healing_collected', 'near_misses', 'elapsed', 'mistakes', 'geo_kills', 'geo_waves', 'geo_rank'];
  const secretNames = new Set(['dingdong','cube','cubie','boo','starlight','rocknroy','pixel','1up','codexisthebest','high score','gravitron']);
  const settingsKeys = new Set(['player','cubieCustom','turtleTrail','soundOn','reducedMotion','leaderboard','publicProfile']);

  function fail(code, message) { const error = new Error(message); error.code = code; throw error; }
  function requireValue(condition, message) { if (!condition) fail('invalid', message); }
  function playerName(value) {
    requireValue(typeof value === 'string', 'Player name must be text.');
    const text = value.trim();
    requireValue(text.length >= 1 && text.length <= 24 && !/[\x00-\x1f\x7f]/.test(text), 'Use a player name between 1 and 24 characters.');
    return text;
  }
  function initial() {
    return { schema: 1, player: 'Player', scores: {}, achievements: new achievements.Tracker().data,
      shop: { units: 0, owned: [] }, cubieCustom: 'classic', turtleTrail: null,
      unlocks: { singularity: false }, minigamesCompleted: 0, cubieHintShown: false, testerTon618: false,
      preferences: { soundOn: true, reducedMotion: false }, privacy: { leaderboard: true, publicProfile: true },
      preferenceRevisions: {}, streams: {}, runs: {}, timeIntervals: [], baselineClosed: false };
  }
  function validMode(mode, difficulty) { return Object.hasOwn(modes, mode) && modes[mode].includes(difficulty); }
  function scoreValid(mode, difficulty, score) {
    return integer(score) && (mode !== 'hangman' || score <= ({ easy: 10, medium: 7, hard: 5 })[difficulty]);
  }
  function sanitizeLegacy(raw = {}, options = {}) {
    const value = object(raw) ? raw : {};
    const clean = initial();
    try { clean.player = playerName(value.player); } catch { /* Keep safe default. */ }
    clean.achievements = new achievements.Tracker(value.achievements).data;
    for (const key of streakKeys) clean.achievements.stats[key] = 0;
    clean.shop = shop.restore(value.shop, catalog);
    clean.unlocks.singularity = value.unlocks?.singularity === true;
    clean.testerTon618 = value.testerTon618 === true;
    clean.minigamesCompleted = integer(value.minigamesCompleted) ? Math.min(20, value.minigamesCompleted) : 0;
    clean.cubieHintShown = value.cubieHintShown === true;
    clean.cubieCustom = customs.selected(value.cubieCustom, clean.achievements.unlocked, clean.shop.owned, clean.testerTon618).id;
    clean.turtleTrail = trails.selected(value.turtleTrail, clean.shop.owned)?.id || null;
    if (object(value.preferences)) for (const key of ['soundOn', 'reducedMotion'])
      if (typeof value.preferences[key] === 'boolean') clean.preferences[key] = value.preferences[key];
    // Preserve an explicit choice in legacy local saves when adopting defaults.
    if (object(value.privacy)) for (const key of ['leaderboard', 'publicProfile'])
      if (typeof value.privacy[key] === 'boolean') clean.privacy[key] = value.privacy[key];
    if (object(value.scores)) for (const [key, entries] of Object.entries(value.scores)) {
      const [mode, difficulty] = key.split(':');
      if (key !== `${mode}:${difficulty}` || !validMode(mode, difficulty) || mode === 'core_practice' || !Array.isArray(entries)) continue;
      const byName = new Map();
      for (const row of entries.slice(0, 1000)) {
        if (!object(row) || !scoreValid(mode, difficulty, row.score)) continue;
        let name;
        try { name = playerName(row.player); } catch { continue; }
        if (Array.isArray(options.names) && !options.names.includes(name)) continue;
        byName.set(name, Math.max(byName.get(name) || 0, row.score));
      }
      clean.scores[key] = [...byName].map(([player, score]) => ({ player, score }));
    }
    return clean;
  }
  function validate(operation) {
    requireValue(object(operation), 'Operation must be an object.');
    if ((operation.schema ?? 1) !== 1 || (operation.version ?? 1) !== 1) fail('unsupported_version', 'Update the arcade to sync this operation.');
    requireValue(identifier(operation.id), 'Operation ID is missing or invalid.');
    if (operation.occurredAt !== undefined) {
      const occurred = typeof operation.occurredAt === 'number' ? operation.occurredAt
        : typeof operation.occurredAt === 'string' ? Date.parse(operation.occurredAt) : NaN;
      requireValue(Number.isSafeInteger(occurred) && occurred >= 0 && occurred <= 8640000000000000, 'Invalid occurrence timestamp.');
    }
    requireValue(identifier(operation.stream_id ?? operation.streamId), 'Stream ID is missing or invalid.');
    requireValue(['run.start','run.checkpoint','run.finish','arcade','purchase','settings','import','onboarding.complete'].includes(operation.kind), 'Unknown operation kind.');
    requireValue(object(operation.payload), 'Operation payload must be an object.');
    requireValue(operation.dependsOn === undefined || (Array.isArray(operation.dependsOn) && operation.dependsOn.length <= 32
      && operation.dependsOn.every(id => identifier(id) && id !== operation.id)), 'Invalid operation dependencies.');
    requireValue(JSON.stringify(operation).length <= 262144, 'Operation is too large.');
    if (operation.kind.startsWith('run.')) requireValue(identifier(operation.run_id ?? operation.runId), 'Run ID is missing or invalid.');
    return true;
  }
  function snapshot(raw, run) {
    requireValue(object(raw), 'Run snapshot is missing.');
    requireValue((raw.mode ?? run.mode) === run.mode && (raw.difficulty ?? run.difficulty) === run.difficulty, 'Snapshot belongs to a different game.');
    const clean = { mode: run.mode, difficulty: run.difficulty };
    for (const key of numericSnapshot) {
      const value = raw[key];
      if (value === undefined || value === null) continue;
      requireValue(typeof value === 'number' && Number.isFinite(value) && value >= 0 && value <= 1000000000, `Invalid ${key}.`);
      if (['score','mistakes','attacks_completed','counter_hits','shots_fired','healing_collected','near_misses'].includes(key))
        requireValue(Number.isSafeInteger(value), `Invalid ${key}.`);
      clean[key] = value;
    }
    for (const key of booleanSnapshot) if (raw[key] !== undefined) {
      requireValue(typeof raw[key] === 'boolean', `Invalid ${key}.`);
      clean[key] = raw[key];
    }
    if (raw.death_cause !== undefined && raw.death_cause !== null) {
      requireValue(typeof raw.death_cause === 'string' && raw.death_cause.length <= 64, 'Invalid death cause.');
      clean.death_cause = raw.death_cause;
    }
    if (raw.attack_survivals !== undefined) {
      const length = ['singularity','core_practice'].includes(run.mode) ? 15 : ['pumpkin','wrath'].includes(run.mode) ? 7 : 0;
      requireValue(Array.isArray(raw.attack_survivals) && raw.attack_survivals.length === length
        && raw.attack_survivals.every(n => integer(n)), 'Invalid attack survival counts.');
      clean.attack_survivals = raw.attack_survivals.slice();
    }
    if (run.mode === 'geomayhem') {
      for (const [key,max] of Object.entries({geo_level:10,geo_kills:1000000,geo_waves:20,geo_rank:10000,
        geo_weapon_count:4,geo_max_stars:5,geo_five_star_count:4,geo_relic_count:3}))
        if (clean[key] !== undefined) requireValue(integer(clean[key],max), `Invalid ${key}.`);
      if (clean.geo_level !== undefined) requireValue(run.difficulty === `level_${clean.geo_level}`, 'Arena does not match the run.');
      if (clean.won === true) requireValue(clean.geo_waves === 20, 'An arena victory requires 20 cleared waves.');
      if (clean.geo_five_star_count !== undefined && clean.geo_weapon_count !== undefined)
        requireValue(clean.geo_five_star_count <= clean.geo_weapon_count, 'Too many evolved weapons.');
    }
    if (clean.score !== undefined) requireValue(scoreValid(run.mode, run.difficulty, clean.score), 'Invalid game score.');
    for (const key of cumulative) if (clean[key] !== undefined && run.snapshot?.[key] !== undefined)
      requireValue(clean[key] >= run.snapshot[key], `The ${key} counter cannot move backward.`);
    if (clean.attack_survivals && run.snapshot?.attack_survivals)
      requireValue(clean.attack_survivals.every((n, i) => n >= run.snapshot.attack_survivals[i]), 'Attack survival counts cannot move backward.');
    return { ...run.snapshot, ...clean };
  }
  function trackerFor(state, stream) {
    const tracker = new achievements.Tracker(state.achievements);
    for (const key of streakKeys) tracker.data.stats[key] = stream[key] || 0;
    return tracker;
  }
  function saveTracker(state, stream, tracker, now, result) {
    const previous = state.achievements.unlocked;
    for (const [id] of Object.entries(tracker.data.unlocked)) if (!previous[id]) {
      tracker.data.unlocked[id] = now;
      result.earned.push(id);
    }
    for (const key of streakKeys) stream[key] = tracker.data.stats[key] || 0;
    state.achievements = tracker.data;
    for (const key of streakKeys) state.achievements.stats[key] = Math.max(0, ...Object.values(state.streams).map(s => s[key] || 0));
  }
  function addBest(state, mode, difficulty, player, score) {
    const key = `${mode}:${difficulty}`;
    const entries = state.scores[key] || [];
    const previous = entries.find(row => row.player === player);
    if (previous) previous.score = Math.max(previous.score, score);
    else entries.push({ player, score });
    state.scores[key] = entries;
  }
  function timeCredit(state, start, end) {
    requireValue(Number.isSafeInteger(start) && Number.isSafeInteger(end) && start >= 0 && end > start && end - start <= 60000, 'Time intervals must contain at most sixty seconds.');
    const all = [...state.timeIntervals, [start, end]].sort((a,b) => a[0]-b[0]);
    const before = state.timeIntervals.reduce((sum, [a,b]) => sum+b-a, 0);
    const merged = [];
    for (const [a,b] of all) {
      const last = merged.at(-1);
      if (last && a <= last[1]) last[1] = Math.max(last[1], b);
      else merged.push([a,b]);
    }
    state.timeIntervals = merged;
    return Math.max(0, Math.floor(merged.reduce((sum,[a,b]) => sum+b-a,0)/1000)-Math.floor(before/1000));
  }
  function apply(rawState, operation, context = {}) {
    validate(operation);
    const state = rawState ? clone(rawState) : initial();
    requireValue(state.schema === 1 && object(state.achievements) && object(state.shop), 'Unsupported account state.');
    const payload = operation.payload;
    const streamId = operation.stream_id ?? operation.streamId;
    const runId = operation.run_id ?? operation.runId;
    const timestamp = context.now ?? Date.now();
    const now = new Date(timestamp).toISOString();
    // Occurrence time describes private history and earned dates. Receipt/season time stays server-owned.
    // A bad device clock must not discard otherwise valid earnings; normalize implausible dates.
    const reported = operation.occurredAt === undefined ? Date.parse(now)
      : typeof operation.occurredAt === 'number' ? operation.occurredAt : Date.parse(operation.occurredAt);
    const clockAdjusted = reported < Date.UTC(2000, 0, 1) || reported > Date.parse(now) + 300000;
    const occurredAt = new Date(clockAdjusted ? Date.parse(now) : reported).toISOString();
    const timeSource = operation.occurredAt === undefined || clockAdjusted ? 'server-received' : 'client-reported';
    const result = { earned: [], cashUnits: 0 };
    if (!Object.hasOwn(state.streams, streamId)) state.streams[streamId] = {};
    const stream = state.streams[streamId];
    const tracker = trackerFor(state, stream);
    const beforeUnits = state.shop.units;
    let finishedRun;
    if (operation.kind === 'run.start') {
      requireValue(validMode(payload.mode, payload.difficulty), 'Unknown game or difficulty.');
      const existing = Object.hasOwn(state.runs, runId) ? state.runs[runId] : null;
      if (existing) {
        if (existing.streamId !== streamId || existing.mode !== payload.mode || existing.difficulty !== payload.difficulty)
          fail('conflict', 'Run ID already belongs to another run.');
        return { state, result: { ...result, duplicate: true } };
      }
      if (stream.activeRun && !state.runs[stream.activeRun]?.finished)
        fail('conflict', 'Finish or interrupt the previous run before starting another.');
      tracker.start(payload.mode, payload.difficulty);
      state.runs[runId] = { id: runId, streamId, mode: payload.mode, difficulty: payload.difficulty,
        player: state.player, startedAt: occurredAt, timeSource, timeAdjusted: clockAdjusted, finished: false, round: clone(tracker.round), snapshot: {}, rulesVersion: 1 };
      stream.activeRun = runId;
      state.baselineClosed = true;
    } else if (operation.kind === 'run.checkpoint' || operation.kind === 'run.finish') {
      const run = Object.hasOwn(state.runs, runId) ? state.runs[runId] : null;
      requireValue(run && run.streamId === streamId, 'Run does not belong to this stream.');
      if (run.finished) {
        if (operation.kind === 'run.finish' && (run.outcome !== payload.outcome
          || (payload.snapshot?.score !== undefined && payload.snapshot.score !== run.score)))
          fail('conflict', 'The completed result cannot be changed.');
        return { state, result: { ...result, duplicate: true } };
      }
      tracker.round = clone(run.round);
      const observation = snapshot(payload.snapshot, run);
      const final = operation.kind === 'run.finish';
      if (!final) {
        requireValue(observation.over !== true, 'Use a final result for a completed run.');
        observation.over = false;
        observation.won = false;
      } else {
        requireValue(['win','loss','exit','interrupted'].includes(payload.outcome), 'Invalid run outcome.');
        const completed = ['win','loss'].includes(payload.outcome);
        requireValue(scoreValid(run.mode, run.difficulty, observation.score ?? 0), 'Invalid final score.');
        if (completed) {
          requireValue(observation.over === true && observation.won === (payload.outcome === 'win'), 'Outcome does not match the result.');
          requireValue(payload.outcome !== 'win' || !['dodge','keyboard','core_practice'].includes(run.mode), 'This mode cannot report a victory.');
        } else {
          requireValue(observation.over !== true, 'A completed result cannot be submitted as an exit.');
          observation.over = false;
          observation.won = false;
        }
      }
      tracker.observe(observation);
      run.snapshot = observation;
      run.round = clone(tracker.round);
      if (final) {
        const completed = ['win','loss'].includes(payload.outcome);
        if (!completed) tracker.abandon();
        const eligible = !['core_practice','geomayhem'].includes(run.mode) && (completed || (run.mode === 'keyboard' && payload.outcome === 'exit'));
        const score = observation.score || 0;
        if (eligible) {
          shop.reward(state.shop, run.mode, run.difficulty, score);
          addBest(state, run.mode, run.difficulty, run.player, score);
        }
        if (completed && !['core_practice','geomayhem'].includes(run.mode)) state.minigamesCompleted = Math.min(20, state.minigamesCompleted+1);
        const finishedAt = new Date(Math.max(Date.parse(run.startedAt), Date.parse(occurredAt))).toISOString();
        Object.assign(run, { finished: true, outcome: payload.outcome, score, finishedAt,
          timeAdjusted: run.timeAdjusted || clockAdjusted || Date.parse(occurredAt) < Date.parse(run.startedAt),
          timeSource: run.timeSource === 'client-reported' && timeSource === 'client-reported' ? 'client-reported' : 'server-received',
          duration: observation.fight_elapsed ?? observation.elapsed ?? Math.max(0,(Date.parse(finishedAt)-Date.parse(run.startedAt))/1000),
          eligible: eligible && run.mode !== 'singularity', provenance: 'client-reported' });
        run.round = clone(tracker.round);
        stream.activeRun = null;
        finishedRun = { id: run.id, mode: run.mode, difficulty: run.difficulty, outcome: run.outcome, score: run.score,
          startedAt: run.startedAt, finishedAt: run.finishedAt, duration: run.duration, rulesVersion: run.rulesVersion,
          eligible: run.eligible, provenance: run.provenance, timeSource: run.timeSource, timeAdjusted: run.timeAdjusted };
      }
    } else if (operation.kind === 'arcade') {
      if (payload.event === 'visit') {
        tracker.visit();
      } else if (payload.event === 'secret') {
        requireValue(typeof payload.name === 'string' && secretNames.has(payload.name.toLowerCase()), 'Unknown arcade event.');
        const name = payload.name.toLowerCase();
        tracker.secret(name);
        if (name === 'gravitron') state.unlocks.singularity = true;
      } else if (payload.event === 'music') {
        requireValue(typeof payload.track === 'string' && payload.track.length <= 128 && typeof payload.audible === 'boolean', 'Invalid music event.');
        tracker.hearMusic(payload.track, state.cubieCustom, payload.audible);
      } else if (payload.event === 'slots') {
        requireValue(Array.isArray(payload.symbols) && payload.symbols.length === 3
          && payload.symbols.every(n => Number.isInteger(n) && n >= 0 && n < 5)
          && typeof payload.visible === 'boolean', 'Invalid slot result.');
        tracker.slotResult(payload.symbols, state.cubieCustom, payload.visible);
      } else if (payload.event === 'gaster') tracker.completeGaster();
      else if (payload.event === 'time') {
        requireValue(Number.isSafeInteger(payload.end) && payload.end <= Date.parse(now)+300000, 'Time interval is ahead of the current clock.');
        if (tracker.data.stats.websiteSeconds < 36000) tracker.spendTime(timeCredit(state, payload.start, payload.end));
      } else if (payload.event === 'hint') state.cubieHintShown = true;
      else fail('invalid', 'Unknown arcade event.');
    } else if (operation.kind === 'purchase') {
      requireValue(typeof payload.itemId === 'string', 'Item ID is missing.');
      const item = catalog.find(row => row.id === payload.itemId && row.price);
      requireValue(item, 'Unknown shop item.');
      if (state.shop.owned.includes(item.id)) result.alreadyOwned = true;
      else if (!shop.buy(state.shop, item)) fail('insufficient_funds', 'Not enough confirmed Cubie Cash.');
    } else if (operation.kind === 'settings') {
      requireValue(object(payload.changes) && Object.keys(payload.changes).length > 0 && object(payload.baseRevisions ?? {}), 'Settings changes are missing.');
      for (const [key, value] of Object.entries(payload.changes)) {
        requireValue(settingsKeys.has(key), 'Unknown preference.');
        requireValue(integer(payload.baseRevisions?.[key] ?? 0), 'Invalid preference revision.');
        if ((payload.baseRevisions?.[key] ?? 0) !== (state.preferenceRevisions[key] || 0))
          fail('conflict', `The ${key} setting changed on another device.`);
        if (key === 'player') state.player = playerName(value);
        else if (key === 'cubieCustom') {
          const item = customs.catalog.find(row => row.id === value);
          if (!item || !customs.unlocked(item, state.achievements.unlocked, state.shop.owned, state.testerTon618))
            fail('not_owned', 'This Custom is not unlocked.');
          state.cubieCustom = value;
        } else if (key === 'turtleTrail') {
          if (value !== null && !trails.selected(value, state.shop.owned)) fail('not_owned', 'This trail is not owned.');
          state.turtleTrail = value;
        } else {
          requireValue(typeof value === 'boolean', 'Preference must be true or false.');
          if (key === 'leaderboard' || key === 'publicProfile') state.privacy[key] = value;
          else state.preferences[key] = value;
        }
        state.preferenceRevisions[key] = (state.preferenceRevisions[key] || 0)+1;
      }
    } else if (operation.kind === 'import') {
      requireValue(object(payload.profile), 'Import profile is missing.');
      requireValue(payload.names === undefined || (Array.isArray(payload.names) && payload.names.length <= 1000 && payload.names.every(n => typeof n === 'string')), 'Invalid imported score names.');
      const imported = sanitizeLegacy(payload.profile, { names: payload.names });
      if (payload.baseline === true) {
        if (state.baselineClosed) fail('conflict', 'The initial progress import has already closed.');
        const preserved = { privacy: state.privacy, preferenceRevisions: state.preferenceRevisions };
        Object.assign(state, imported, preserved, { baselineClosed: true });
        result.imported = 'baseline';
      } else {
        for (const [id,date] of Object.entries(imported.achievements.unlocked))
          if (!state.achievements.unlocked[id] || date < state.achievements.unlocked[id]) state.achievements.unlocked[id] = date;
        state.shop.owned = [...new Set([...state.shop.owned, ...imported.shop.owned])];
        state.unlocks.singularity ||= imported.unlocks.singularity;
        state.testerTon618 ||= imported.testerTon618;
        for (const [key,entries] of Object.entries(imported.scores)) {
          const [mode,difficulty] = key.split(':');
          for (const row of entries) addBest(state, mode, difficulty, row.player, row.score);
        }
        state.baselineClosed = true;
        result.imported = 'unlocks-and-bests';
      }
      const importedTracker = new achievements.Tracker(state.achievements);
      const importedUnlocks = { ...importedTracker.data.unlocked };
      importedTracker.update(() => {});
      for (const id of Object.keys(importedTracker.data.unlocked))
        if (!importedUnlocks[id]) importedTracker.data.unlocked[id] = occurredAt;
      state.achievements = importedTracker.data;
      result.cashUnits = state.shop.units-beforeUnits;
      result.profilePoints = importedTracker.score;
      return { state, result };
    } else if (operation.kind === 'onboarding.complete') state.baselineClosed = true;
    saveTracker(state, stream, tracker, occurredAt, result);
    result.cashUnits = state.shop.units-beforeUnits;
    result.profilePoints = new achievements.Tracker(state.achievements).score;
    return { state, result, ...(finishedRun ? { run: finishedRun } : {}) };
  }
  return { initial, sanitizeLegacy, apply, validate, validMode, modes, catalog, schema: 1 };
})();
if (typeof module !== 'undefined') module.exports = AccountRules;
if (typeof globalThis !== 'undefined') globalThis.AccountRules = AccountRules;
