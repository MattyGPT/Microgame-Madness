"use strict";

const Leaderboards = (() => {
  const difficulties = Object.freeze({
    hangman: ['easy', 'medium', 'hard'], keyboard: ['progressive'],
    dodge: ['easy', 'normal', 'hard', 'merciless', 'impossible', 'chaos'],
    boss: ['mean', 'cruel', 'nightmare', 'impossible'],
    pumpkin: ['come_on', 'baby', 'coward', 'phase2'],
    wrath: ['color_memory', 'bone_gauntlet', 'rotating_rings', 'magenta_fingers', 'chaos', 'royal_slams', 'haunted_quadrants', 'random_order'].flatMap(attack => [attack, `${attack}__easy`, `${attack}__hard`]),
  });
  const multipliers = Object.freeze({
    hangman: { easy: 1, medium: 2.5, hard: 4 },
    keyboard: { progressive: 1 },
    dodge: { easy: 1, normal: 1.75, chaos: 2.5, hard: 3.5, merciless: 4.75, impossible: 5.5 },
    boss: { mean: 1, cruel: 2.25, nightmare: 3.75, impossible: 5.75 },
    pumpkin: { come_on: 1, baby: 1.75, coward: 2.5, phase2: 3.5 },
    wrath: Object.fromEntries(difficulties.wrath.map(attack => [attack, attack.endsWith("__easy") ? .5 : attack.endsWith("__hard") ? 2 : 1])),
  });
  function valid(entry) {
    return difficulties[entry.mode]?.includes(entry.difficulty)
      && typeof entry.player === 'string' && entry.player.trim().length >= 1
      && entry.player.length <= 24 && !/[\x00-\x1f\x7f]/.test(entry.player)
      && Number.isSafeInteger(entry.score) && entry.score >= 0 && entry.score <= 1000000000
      && (entry.mode !== 'hangman' || entry.score <= ({ easy: 10, medium: 7, hard: 5 })[entry.difficulty]);
  }
  class Client {
    constructor(config = {}, { storage, fetch = globalThis.fetch, now = Date.now } = {}) {
      this.url = (config.url || '').replace(/\/$/, '');
      this.key = config.key || '';
      this.configured = Boolean(this.url && this.key);
      try { this.storage = storage === undefined ? globalThis.localStorage : storage; }
      catch { this.storage = null; }
      this.fetch = fetch.bind(globalThis);
      this.now = now;
      this.storageKey = `microgame-madness.leaderboard.v1:${this.url}`;
      this.session = this.read('session') || null;
      this.pending = Object.fromEntries(Object.entries(this.read('pending') || {})
        .filter(([key, entry]) => entry && valid(entry) && (key === entry.runId || key === `${entry.mode}:${entry.difficulty}`))
        .map(([key, entry]) => [key, { ...entry, legacy: !entry.runId }]));
      this.pendingOwner = this.read('pending-owner') || this.session?.user_id || null;
      this.authenticating = null;
      this.flushing = null;
    }
    read(suffix) {
      try { return JSON.parse(this.storage?.getItem(`${this.storageKey}.${suffix}`) || 'null'); }
      catch { return null; }
    }
    write(suffix, value) {
      try { this.storage?.setItem(`${this.storageKey}.${suffix}`, JSON.stringify(value)); }
      catch { /* Local gameplay and this visit's session still work. */ }
    }
    async request(path, body, token) {
      const headers = { apikey: this.key, 'Content-Type': 'application/json' };
      if (token) headers.Authorization = `Bearer ${token}`;
      let response;
      try {
        response = await this.fetch(`${this.url}${path}`, {
          method: 'POST', headers, body: JSON.stringify(body), signal: AbortSignal.timeout(8000),
        });
      } catch {
        throw new Error('Global leaderboard unavailable. Your local scores are saved.');
      }
      if (!response.ok) {
        const error = new Error('Global leaderboard unavailable. Your local scores are saved.');
        error.status = response.status;
        throw error;
      }
      try { return await response.json(); }
      catch { throw new Error('Global rankings could not be loaded. Please try again.'); }
    }
    async token() {
      if (this.accountSession) {
        await this.accountSession.ensureAnonymous();
        return this.accountSession.token();
      }
      if (this.session?.access_token && this.session.expires_at > this.now() / 1000 + 30)
        return this.session.access_token;
      if (this.authenticating) return this.authenticating;
      this.authenticating = (async () => {
        // Refresh the same identity; never silently replace an existing profile.
        const refreshing = Boolean(this.session?.refresh_token);
        const data = await this.request(refreshing ? '/auth/v1/token?grant_type=refresh_token' : '/auth/v1/signup',
          refreshing ? { refresh_token: this.session.refresh_token } : {});
        if (!data.access_token || !data.refresh_token || !Number.isFinite(data.expires_in) || !data.user?.id)
          throw new Error('Could not connect your leaderboard profile. Your local scores are saved.');
        this.session = { access_token: data.access_token, refresh_token: data.refresh_token,
          expires_at: this.now() / 1000 + data.expires_in, user_id: data.user.id };
        this.write('session', this.session);
        return this.session.access_token;
      })();
      try { return await this.authenticating; }
      finally { this.authenticating = null; }
    }
    async list(mode, difficulty) {
      if (!this.configured) throw new Error('Global rankings aren’t connected yet. Your local scores are saved.');
      if (!difficulties[mode]?.includes(difficulty)) throw new Error('Unknown game or difficulty');
      const token = this.session?.expires_at > this.now() / 1000 + 30 ? this.session.access_token : undefined;
      const rows = await this.request('/rest/v1/rpc/get_leaderboard', { p_mode: mode, p_difficulty: difficulty }, token);
      if (!Array.isArray(rows) || rows.some(row => !Number.isSafeInteger(Number(row.rank))
          || Number(row.rank) < 1 || typeof row.player !== 'string' || !Number.isSafeInteger(row.score) || row.score < 0))
        throw new Error('Global rankings could not be loaded. Please try again.');
      return rows.slice(0, 10);
    }
    async listPage(mode, difficulty, { offset = 0, season = null, aroundMe = false } = {}) {
      if (!this.configured) throw new Error('Global rankings aren’t connected yet. Your local scores are saved.');
      let token;
      if (this.accountSession?.snapshot().user) {
        try { token = await this.accountSession.token(); } catch { /* Public browsing remains available. */ }
      }
      try {
        const rows = await this.request('/rest/v1/rpc/get_account_leaderboard', {
          p_mode: mode, p_difficulty: difficulty, p_season: season,
          p_offset: offset, p_limit: 10, p_around_me: aroundMe,
        }, token);
        if (!Array.isArray(rows) || rows.some(row => !Number.isSafeInteger(Number(row.rank))
            || Number(row.rank) < 1 || typeof row.player !== 'string' || !Number.isSafeInteger(row.score)))
          throw new Error('Global rankings could not be loaded. Please try again.');
        return rows;
      } catch (error) {
        if ((error.status === 404 || error.status === 400) && !season && !aroundMe && !offset)
          return this.list(mode, difficulty);
        throw error;
      }
    }
    async listGame(mode, { offset = 0, season = null, aroundMe = false } = {}) {
      if (!this.configured) throw new Error('Global rankings aren’t connected yet. Your local scores are saved.');
      if (!Object.hasOwn(multipliers, mode)) throw new Error('Unknown game');
      let token;
      if (this.accountSession?.snapshot().user) {
        try { token = await this.accountSession.token(); } catch { /* Public browsing remains available. */ }
      }
      const rows = await this.request('/rest/v1/rpc/get_game_leaderboard', {
        p_mode: mode, p_season: season, p_offset: offset, p_limit: 10, p_around_me: aroundMe,
      }, token);
      if (!Array.isArray(rows) || rows.some(row => !Number.isSafeInteger(Number(row.rank))
          || Number(row.rank) < 1 || typeof row.player !== 'string' || !Number.isSafeInteger(row.score) || row.score < 0))
        throw new Error('Global rankings could not be loaded. Please try again.');
      return rows;
    }
    async seasons() {
      if (!this.configured) return [];
      try {
        const rows = await this.request('/rest/v1/rpc/get_account_seasons', {});
        return Array.isArray(rows) ? rows : [];
      } catch { return []; }
    }
    async pendingLock(callback) {
      if (globalThis.navigator?.locks?.request)
        return navigator.locks.request(`${this.storageKey}.queue`, async () => {
          const stored = this.read('pending');
          if (stored) this.pending = stored;
          this.pendingOwner = this.read('pending-owner') || this.pendingOwner;
          return callback();
        });
      return callback();
    }
    async submit(entry, { defer = false } = {}) {
      if (!valid(entry)) throw new Error('Invalid leaderboard score');
      if (!this.configured) return false;
      await this.pendingLock(async () => {
        const current = this.accountSession?.snapshot().user;
        if (this.accountSession && current && !current.is_anonymous) throw new Error('Account results use account synchronization.');
        if (Object.keys(this.pending).length && this.pendingOwner && current && this.pendingOwner !== current.id)
          throw new Error('Earlier leaderboard submissions belong to another guest identity.');
        if (!Object.keys(this.pending).length) this.pendingOwner = current?.id || this.session?.user_id || null;
        const runId = entry.runId || globalThis.crypto.randomUUID();
        this.pending[runId] = { ...entry, runId, player: entry.player.trim() };
        this.write('pending-owner', this.pendingOwner);
        this.write('pending', this.pending);
      });
      if (!defer) await this.flush();
      return true;
    }
    async flush() {
      if (!this.configured) return;
      if (this.flushing) return this.flushing;
      this.flushing = this.pendingLock(async () => {
        while (Object.keys(this.pending).length) {
          const [key, entry] = Object.entries(this.pending)[0];
          await this.beforeFlush?.();
          const token = await this.token();
          const current = this.accountSession?.snapshot().user;
          if (this.accountSession && (!current || !current.is_anonymous)) throw new Error('Account results use account synchronization.');
          const owner = current?.id || this.session?.user_id;
          if (this.pendingOwner && owner !== this.pendingOwner) throw new Error('Earlier leaderboard submissions belong to another guest identity.');
          this.pendingOwner = owner; this.write('pending-owner', owner);
          const best = await this.request(entry.runId ? '/rest/v1/rpc/submit_leaderboard_run' : '/rest/v1/rpc/submit_leaderboard_score', {
            ...(entry.runId ? { p_run_id: entry.runId } : {}),
            p_mode: entry.mode, p_difficulty: entry.difficulty, p_player: entry.player, p_score: entry.score,
          }, token);
          if (!Number.isSafeInteger(best) || best < entry.score) throw new Error('Your score is saved locally. Global submission needs another try.');
          if (this.pending[key] === entry) delete this.pending[key];
          this.write('pending', this.pending);
        }
      });
      try { await this.flushing; }
      finally { this.flushing = null; }
    }
  }
  return { Client, difficulties, multipliers, valid };
})();
if (typeof module !== 'undefined') module.exports = Leaderboards;
