"use strict";

const Leaderboards = (() => {
  const difficulties = Object.freeze({
    hangman: ['easy', 'medium', 'hard'], keyboard: ['progressive'],
    dodge: ['easy', 'normal', 'hard', 'merciless'],
    boss: ['mean', 'cruel', 'nightmare', 'impossible'],
    pumpkin: ['come_on', 'baby', 'coward', 'phase2'],
    wrath: ['color_memory', 'bone_gauntlet', 'rotating_rings', 'magenta_fingers', 'chaos', 'royal_slams', 'haunted_quadrants', 'random_order'],
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
        .filter(([key, entry]) => entry && valid(entry) && key === `${entry.mode}:${entry.difficulty}`));
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
    async submit(entry) {
      if (!valid(entry)) throw new Error('Invalid leaderboard score');
      if (!this.configured) return false;
      const key = `${entry.mode}:${entry.difficulty}`;
      this.pending[key] = { ...entry, player: entry.player.trim(), score: Math.max(entry.score, this.pending[key]?.score || 0) };
      this.write('pending', this.pending);
      await this.flush();
      return true;
    }
    async flush() {
      if (!this.configured) return;
      if (this.flushing) return this.flushing;
      this.flushing = (async () => {
        while (Object.keys(this.pending).length) {
          const [key, entry] = Object.entries(this.pending)[0];
          const token = await this.token();
          const best = await this.request('/rest/v1/rpc/submit_leaderboard_score', {
            p_mode: entry.mode, p_difficulty: entry.difficulty, p_player: entry.player, p_score: entry.score,
          }, token);
          if (!Number.isSafeInteger(best) || best < entry.score) throw new Error('Your score is saved locally. Global submission needs another try.');
          if (this.pending[key] === entry) delete this.pending[key];
          this.write('pending', this.pending);
        }
      })();
      try { await this.flushing; }
      finally { this.flushing = null; }
    }
  }
  return { Client, difficulties, valid };
})();
if (typeof module !== 'undefined') module.exports = Leaderboards;
