"use strict";

// Aggregate usage counters only. A random per-browser id is hashed server-side and
// stored with daily totals; no IP address, handle, score, or credential is sent.
// Nothing here may throw into gameplay: analytics failures are dropped silently.
// See docs/usage-analytics.md for what is collected, and how to read and prune it.
const Usage = (() => {
  const VISITOR_KEY = "microgame-madness.usage.v1.visitor";
  const KINDS = Object.freeze(["visit", "login", "register", "play", "finish"]);
  const GAMES = Object.freeze(["hangman", "keyboard", "dodge", "boss", "pumpkin",
    "wrath", "singularity", "core_practice", "geomayhem"]);
  const OUTCOMES = Object.freeze(["win", "loss", "exit", "interrupted"]);
  const MAX_BATCH = 32; // Server cap per call.
  const MAX_BUFFER = 96; // Oldest events are dropped rather than retried forever.
  const FLUSH_DELAY = 20000;

  function optedOut(navigator) {
    return navigator?.doNotTrack === "1" || navigator?.doNotTrack === "yes"
      || navigator?.msDoNotTrack === "1" || navigator?.globalPrivacyControl === true;
  }

  class Client {
    constructor(config = {}, { fetch = globalThis.fetch, storage,
        navigator = globalThis.navigator, document: view = globalThis.document,
        events = globalThis, setTimeout: delay = globalThis.setTimeout,
        clearTimeout: cancelDelay = globalThis.clearTimeout } = {}) {
      this.url = (config.url || "").replace(/\/$/, "");
      this.key = config.key || "";
      this.configured = Boolean(this.url && this.key);
      this.fetch = fetch?.bind(globalThis);
      // Window methods throw "Illegal invocation" when called unbound.
      this.setTimeout = typeof delay === "function" ? delay.bind(globalThis) : null;
      this.clearTimeout = typeof cancelDelay === "function" ? cancelDelay.bind(globalThis) : null;
      this.events = events;
      this.buffer = [];
      this.flushing = null;
      this.timer = null;
      this.session = null;
      this.unsubscribe = null;
      this.lastOwner = null;
      this.anonymousOwner = null;
      this.enabled = !optedOut(navigator);
      try { this.storage = storage === undefined ? globalThis.localStorage : storage; }
      catch { this.storage = null; }
      this.visitor = this.enabled ? this.readVisitor() : null;
      if (!this.enabled || !this.configured) return;
      this.onHide = () => { this.flush(); };
      this.onVisibility = () => { if (view?.visibilityState === "hidden") this.flush(); };
      events?.addEventListener?.("pagehide", this.onHide);
      events?.addEventListener?.("visibilitychange", this.onVisibility);
      events?.addEventListener?.("online", this.onHide);
    }
    // A per-browser random id, never derived from an account or device fingerprint.
    readVisitor() {
      try {
        const stored = this.storage?.getItem(VISITOR_KEY);
        if (/^[0-9a-f]{32,64}$/.test(stored || "")) return stored;
      } catch { /* Storage failure still allows a memory-only id for this visit. */ }
      const bytes = new Uint8Array(16);
      crypto.getRandomValues(bytes);
      const id = Array.from(bytes, byte => byte.toString(16).padStart(2, "0")).join("");
      try { this.storage?.setItem(VISITOR_KEY, id); } catch { /* This visit still counts. */ }
      return id;
    }
    attach(session) {
      if (!this.enabled || !this.configured || !session?.subscribe || this.session) return this;
      this.session = session;
      // A cached session restored at page load is not a fresh credential sign-in;
      // the daily account-scope row already counts that browser.
      const current = session.snapshot?.().user || null;
      this.lastOwner = current && current.is_anonymous !== true ? current.id : null;
      this.anonymousOwner = current?.is_anonymous === true ? current.id : null;
      this.unsubscribe = session.subscribe(snapshot => this.observeIdentity(snapshot?.user || null));
      return this;
    }
    // Registration converts the same anonymous owner; a login brings a different one.
    observeIdentity(user) {
      if (!user) { this.lastOwner = null; this.anonymousOwner = null; return; }
      if (user.is_anonymous === true) { this.anonymousOwner = user.id; return; }
      if (user.id === this.lastOwner) return;
      this.event(user.id === this.anonymousOwner ? "register" : "login");
      this.lastOwner = user.id;
      this.anonymousOwner = null;
    }
    get signedIn() {
      const user = this.session?.snapshot?.().user;
      return Boolean(user && user.is_anonymous !== true);
    }
    event(kind, fields = {}) {
      if (!this.enabled || !this.configured || !KINDS.includes(kind)) return;
      const event = { kind };
      if (GAMES.includes(fields.game)) event.game = fields.game;
      const difficulty = String(fields.difficulty ?? "").toLowerCase().slice(0, 32);
      if (/^[a-z0-9_]{1,32}$/.test(difficulty)) event.difficulty = difficulty;
      if (OUTCOMES.includes(fields.outcome)) event.outcome = fields.outcome;
      // Match the server's per-kind rules so a rejected batch cannot discard good events.
      if ((kind === "play" || kind === "finish") && !event.game) return;
      if (kind === "finish" && !event.outcome) return;
      this.buffer.push(event);
      if (this.buffer.length > MAX_BUFFER) this.buffer.splice(0, this.buffer.length - MAX_BUFFER);
      if (this.buffer.length >= MAX_BATCH) this.flush();
      else this.schedule();
    }
    visit() {
      if (!this.enabled || !this.configured) return undefined;
      this.event("visit");
      return this.flush(); // Count a bounce that never starts a game.
    }
    play(game, difficulty) { this.event("play", { game, difficulty }); }
    finish(game, difficulty, outcome) { this.event("finish", { game, difficulty, outcome }); }
    schedule() {
      if (this.timer || !this.setTimeout) return;
      // A missing timer only costs the interval flush; pagehide still sends.
      try { this.timer = this.setTimeout(() => { this.timer = null; this.flush(); }, FLUSH_DELAY); }
      catch { this.timer = null; }
    }
    async flush() {
      if (!this.enabled || !this.configured || !this.visitor || !this.buffer.length) return;
      if (this.flushing) return this.flushing;
      if (this.timer && this.clearTimeout) { this.clearTimeout(this.timer); this.timer = null; }
      const events = this.buffer.splice(0, MAX_BATCH);
      // Assigned before the body can settle, so a synchronous failure cannot leave
      // this.flushing set and block every later report.
      this.flushing = this.send(events).finally(() => { this.flushing = null; });
      return this.flushing;
    }
    async send(events) {
      try {
        const response = await this.fetch(`${this.url}/rest/v1/rpc/record_usage`, {
          method: "POST",
          headers: { apikey: this.key, "Content-Type": "application/json" },
          body: JSON.stringify({ p_visitor: this.visitor,
            p_scope: this.signedIn ? "account" : "guest", p_events: events }),
          signal: AbortSignal.timeout(8000),
          keepalive: true,
        });
        if (!response.ok) this.requeue(events);
        else if (this.buffer.length) this.schedule();
      } catch { this.requeue(events); }
    }
    requeue(events) {
      this.buffer.unshift(...events);
      if (this.buffer.length > MAX_BUFFER) this.buffer.length = MAX_BUFFER;
    }
    close() {
      this.unsubscribe?.();
      this.unsubscribe = null;
      this.events?.removeEventListener?.("pagehide", this.onHide);
      this.events?.removeEventListener?.("visibilitychange", this.onVisibility);
      this.events?.removeEventListener?.("online", this.onHide);
      if (this.timer && this.clearTimeout) { this.clearTimeout(this.timer); this.timer = null; }
      this.buffer.length = 0;
    }
  }
  return { Client, optedOut, VISITOR_KEY, KINDS, GAMES, OUTCOMES };
})();
if (typeof module !== "undefined") module.exports = Usage;
globalThis.Usage = Usage;
