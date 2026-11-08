"use strict";

const AccountSession = (() => {
  const error = (code, message, status) => Object.assign(new Error(message), { code, status });
  class Client {
    constructor(config = {}, { fetch = globalThis.fetch, storage, now = Date.now, events = globalThis } = {}) {
      this.url = (config.url || '').replace(/\/$/, ''); this.key = config.key || '';
      this.configured = Boolean(this.url && this.key); this.fetch = fetch?.bind(globalThis); this.now = now;
      try { this.storage = storage === undefined ? globalThis.localStorage : storage; } catch { this.storage = null; }
      this.storageKey = `microgame-madness.leaderboard.v1:${this.url}.session`;
      this.registrationKey = `${this.storageKey}.registration`;
      this.listeners = new Set(); this.generation = 0; this.refreshing = null; this.creating = null; this.requiresSignIn = false;
      this.credentialEpoch = 0; this.session = this.read(); this.durable = Boolean(this.storage);
      if (this.session) this.persist(); // Scrub legacy provider identifiers from the cached projection.
      this.events = events; this.onStorage = event => {
        if (event.key !== this.storageKey && event.key !== null) return;
        const previousOwner = this.session?.user_id || null;
        this.session = this.read(); this.credentialEpoch++;
        if ((this.session?.user_id || null) !== previousOwner) this.generation++;
        this.requiresSignIn = false; this.emit();
      };
      events?.addEventListener?.('storage', this.onStorage);
    }
    read() {
      try {
        const data = JSON.parse(this.storage?.getItem(this.storageKey) || 'null');
        return data && typeof data.access_token === 'string' && typeof data.refresh_token === 'string'
          && typeof data.user_id === 'string' && Number.isFinite(data.expires_at)
          ? { access_token: data.access_token, refresh_token: data.refresh_token, expires_at: data.expires_at,
            user_id: data.user_id, user: this.projectUser({ ...data.user, id: data.user_id }) } : null;
      } catch { return null; }
    }
    projectUser(user, fallbackHandle = null) {
      const handle = user.handle || user.app_metadata?.handle || fallbackHandle;
      return { id: user.id, is_anonymous: user.is_anonymous === true,
        handle: typeof handle === 'string' && /^[a-z0-9_]{3,24}$/.test(handle) ? handle : null };
    }
    pendingRegistration() {
      try {
        const value = JSON.parse(this.storage?.getItem(this.registrationKey) || 'null');
        return value && typeof value.owner === 'string' && /^[a-z0-9_]{3,24}$/.test(value.handle) ? value : null;
      } catch { return null; }
    }
    completeRegistration(owner) {
      if (this.pendingRegistration()?.owner === owner) {
        try { this.storage?.removeItem(this.registrationKey); } catch { /* Retrying a confirmed binding remains safe. */ }
      }
    }
    snapshot() {
      return { configured: this.configured, generation: this.generation, requiresSignIn: this.requiresSignIn,
        durable: this.durable, user: this.session ? { ...this.session.user, id: this.session.user_id } : null };
    }
    subscribe(listener) { this.listeners.add(listener); return () => this.listeners.delete(listener); }
    emit() { for (const listener of this.listeners) listener(this.snapshot()); }
    persist() {
      try {
        if (!this.storage) { this.durable = false; return; }
        if (this.session) this.storage.setItem(this.storageKey, JSON.stringify(this.session));
        else this.storage.removeItem(this.storageKey);
        this.durable = true;
      } catch { this.durable = false; }
    }
    save(data, { expectedGeneration = this.generation, expectedUser } = {}) {
      if (expectedGeneration !== this.generation) throw error('stale_session', 'The active account changed.');
      if (!data?.access_token || !data.refresh_token || !data.user?.id || !Number.isFinite(data.expires_in))
        throw error('invalid_session', 'Sign-in did not return a usable session.');
      if (expectedUser && data.user.id !== expectedUser) throw error('identity_changed', 'This sign-in did not preserve the current player.');
      const user = data.user;
      this.session = { access_token: data.access_token, refresh_token: data.refresh_token,
        expires_at: Number.isFinite(data.expires_at) ? data.expires_at : this.now() / 1000 + data.expires_in,
        user_id: user.id, user: this.projectUser(user, this.session?.user_id === user.id ? this.session.user?.handle : null) };
      this.requiresSignIn = false; this.persist(); this.emit(); return this.snapshot();
    }
    async request(path, { method = 'POST', body, token, identity = false } = {}) {
      if (!this.configured) throw error('not_configured', 'Cloud saves are not connected yet. Guest play is available.');
      const headers = { apikey: this.key, 'Content-Type': 'application/json' };
      if (token) headers.Authorization = `Bearer ${token}`;
      let response;
      try { response = await this.fetch(identity ? `${this.url}/functions/v1/identity` : `${this.url}/auth/v1/${path}`, {
        method, headers, ...(body === undefined ? {} : { body: JSON.stringify(body) }), signal: AbortSignal.timeout(12000),
      }); } catch { throw error('network', 'Could not reach sign-in. Your local progress is retained.'); }
      let data = null;
      try { data = await response.json(); } catch { /* Successful logout has no JSON body. */ }
      if (!response.ok) {
        const message = response.status === 429 ? 'Too many requests. Please wait before trying again.'
          : response.status >= 500 ? 'Sign-in is temporarily unavailable. Try again shortly.'
            : identity ? String(data?.error?.message || 'Invalid credentials or this request could not be completed.').slice(0, 250)
            : 'Sign-in could not be completed. Please sign in again.';
        throw error(data?.error?.code || data?.error_code || data?.code || 'auth_error', message, response.status);
      }
      return data;
    }
    async token() {
      if (!this.session) throw error('sign_in_required', 'Sign in to sync this profile.');
      if (this.session.expires_at > this.now() / 1000 + 30) return this.session.access_token;
      if (this.refreshing) return this.refreshing;
      const generation = this.generation, original = this.session;
      this.refreshing = (async () => {
        try {
          const data = await this.request('token?grant_type=refresh_token', { body: { refresh_token: original.refresh_token } });
          if (generation === this.generation && this.session?.user_id === original.user_id
              && this.session.refresh_token !== original.refresh_token && this.session.expires_at > this.now() / 1000 + 30)
            return this.session.access_token;
          this.save(data, { expectedGeneration: generation, expectedUser: original.user_id });
          return this.session.access_token;
        } catch (caught) {
          if (generation === this.generation && this.session?.user_id === original.user_id
              && this.session.refresh_token !== original.refresh_token && this.session.expires_at > this.now() / 1000 + 30)
            return this.session.access_token;
          if (generation === this.generation && [400, 401, 403].includes(caught.status)) {
            this.requiresSignIn = true; this.emit();
          }
          throw caught;
        }
      })();
      try { return await this.refreshing; } finally { this.refreshing = null; }
    }
    async getUser() {
      const generation = this.generation, expectedUser = this.session?.user_id;
      const token = await this.token();
      const user = await this.request('user', { method: 'GET', token });
      if (generation !== this.generation || user?.id !== expectedUser || this.session?.access_token !== token) throw error('stale_session', 'The active account changed.');
      this.session.user = this.projectUser(user, this.session.user?.handle);
      this.persist(); this.emit(); return this.snapshot().user;
    }
    async ensureAnonymous() {
      if (this.session) return this.getUser(); // Never replace an expired identity.
      if (this.creating) return this.creating;
      const generation = this.generation;
      const creating = (async () => {
        const data = await this.request('signup', { body: {} });
        this.save(data, { expectedGeneration: generation }); return this.getUser();
      })();
      this.creating = creating;
      try { return await creating; } finally { if (this.creating === creating) this.creating = null; }
    }
    handle(value) {
      const normalized = String(value || '').trim().toLowerCase();
      if (!/^[a-z0-9_]{3,24}$/.test(normalized))
        throw error('invalid_handle', 'Use 3–24 letters, numbers, or underscores for your handle.');
      return normalized;
    }
    password(value) {
      if (typeof value !== 'string' || value.length < 12 || new TextEncoder().encode(value).length > 72)
        throw error('invalid_password', 'Use at least 12 characters and no more than 72 UTF-8 bytes for your password.');
      return value;
    }
    credentialFence() {
      const epoch = ++this.credentialEpoch, generation = this.generation;
      return () => {
        if (epoch !== this.credentialEpoch || generation !== this.generation)
          throw error('stale_session', 'The active account changed. Please try again.');
      };
    }
    async register(handle, password) {
      handle = this.handle(handle); password = this.password(password);
      const assertCurrent = this.credentialFence();
      const pending = this.pendingRegistration(), cached = this.session;
      const retrying = pending?.owner === cached?.user_id && pending?.handle === handle;
      // Provider conversion can revoke the original guest token before its reply arrives.
      // On a recorded retry, the server proves handle/password and the returned UUID
      // must still match this original owner; the stale token is never trusted locally.
      const user = retrying ? this.snapshot().user : await this.ensureAnonymous(); assertCurrent();
      if (!user.is_anonymous && (pending?.owner !== user.id || pending?.handle !== handle))
        throw error('already_registered', 'This player already has an account.');
      // This intent contains no credential and survives a lost conversion reply or reload.
      // Refuse conversion if it cannot be recorded: otherwise the original guest wallet
      // could be stranded after the provider has permanently upgraded its owner.
      try {
        if (!this.storage) throw new Error('Storage unavailable');
        this.storage.setItem(this.registrationKey, JSON.stringify({ owner: user.id, handle }));
      } catch { throw error('storage_unavailable', 'Account creation needs device storage to preserve your guest progress. Enable storage or export your progress first.'); }
      const token = retrying ? cached.access_token : await this.token(); assertCurrent();
      const data = await this.request('', { identity: true, token, body: { action: 'register', handle, password } });
      assertCurrent();
      if (data?.session?.user?.is_anonymous !== false)
        throw error('invalid_session', 'Account creation did not finish. Your guest progress is retained.');
      this.save(data.session, { expectedUser: user.id });
      return { user: this.snapshot().user, recoveryCode: data.recoveryCode };
    }
    async login(handle, password) {
      handle = this.handle(handle); password = this.password(password);
      const assertCurrent = this.credentialFence();
      const data = await this.request('', { identity: true, body: { action: 'login', handle, password } });
      assertCurrent();
      // Validate before advancing the owner generation, including malformed success responses.
      this.validatePermanentSession(data?.session);
      this.generation++; this.save(data.session);
      return this.snapshot().user;
    }
    validatePermanentSession(data) {
      if (!data?.access_token || !data.refresh_token || !data.user?.id || !Number.isFinite(data.expires_in)
          || data.user.is_anonymous !== false)
        throw error('invalid_session', 'Sign-in did not return a usable account session.');
    }
    async recover(handle, recoveryCode, newPassword) {
      handle = this.handle(handle); newPassword = this.password(newPassword);
      if (typeof recoveryCode !== 'string' || !recoveryCode.trim() || recoveryCode.length > 256)
        throw error('invalid_recovery', 'Enter your saved recovery code.');
      const assertCurrent = this.credentialFence();
      const data = await this.request('', { identity: true, body: {
        action: 'recover', handle, recoveryCode: recoveryCode.trim(), newPassword,
      } });
      assertCurrent(); this.validatePermanentSession(data?.session);
      this.generation++; this.save(data.session);
      return { user: this.snapshot().user, recoveryCode: data.recoveryCode };
    }
    async accountCredential(action, password, newPassword) {
      password = this.password(password);
      if (newPassword !== undefined) newPassword = this.password(newPassword);
      const assertCurrent = this.credentialFence(), owner = this.session?.user_id;
      if (!owner || this.session.user?.is_anonymous) throw error('sign_in_required', 'Sign in to manage your account.');
      const token = await this.token(); assertCurrent();
      const data = await this.request('', { identity: true, token, body: {
        action, password, ...(newPassword === undefined ? {} : { newPassword }),
      } });
      assertCurrent();
      // Recovery rotation may retain the existing session; password replacement returns a fresh one.
      if (data?.session) {
        this.validatePermanentSession(data.session);
        this.save(data.session, { expectedUser: owner });
      } else if (action === 'change_password') throw error('invalid_session', 'Sign in again with your new password.');
      return { user: this.snapshot().user, recoveryCode: data?.recoveryCode };
    }
    changePassword(password, newPassword) { return this.accountCredential('change_password', password, newPassword); }
    rotateRecovery(password) { return this.accountCredential('rotate_recovery', password); }
    async signOut() {
      const token = this.session?.access_token;
      this.generation++; this.credentialEpoch++; this.session = null; this.requiresSignIn = false;
      this.persist(); this.emit();
      if (!token || !this.configured) return { local: true, remote: true };
      try { await this.request('logout?scope=local', { token }); return { local: true, remote: true }; }
      catch { return { local: true, remote: false }; }
    }
    close() { this.generation++; this.credentialEpoch++; this.events?.removeEventListener?.('storage', this.onStorage); this.listeners.clear(); }
  }
  return { Client };
})();
if (typeof module !== 'undefined') module.exports = AccountSession;
globalThis.AccountSession = AccountSession;
