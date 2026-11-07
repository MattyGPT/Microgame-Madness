"use strict";

const AccountSession = (() => {
  const error = (code, message, status) => Object.assign(new Error(message), { code, status });
  class Client {
    constructor(config = {}, { fetch = globalThis.fetch, storage, now = Date.now, events = globalThis } = {}) {
      this.url = (config.url || '').replace(/\/$/, ''); this.key = config.key || '';
      this.configured = Boolean(this.url && this.key); this.fetch = fetch?.bind(globalThis); this.now = now;
      try { this.storage = storage === undefined ? globalThis.localStorage : storage; } catch { this.storage = null; }
      this.storageKey = `microgame-madness.leaderboard.v1:${this.url}.session`;
      this.listeners = new Set(); this.generation = 0; this.refreshing = null; this.creating = null; this.requiresSignIn = false;
      this.session = this.read(); this.durable = Boolean(this.storage); this.pendingEmail = null;
      this.events = events; this.onStorage = event => {
        if (event.key !== this.storageKey && event.key !== null) return;
        const previousOwner = this.session?.user_id || null;
        this.session = this.read();
        if ((this.session?.user_id || null) !== previousOwner) { this.generation++; this.pendingEmail = null; }
        this.requiresSignIn = false; this.emit();
      };
      events?.addEventListener?.('storage', this.onStorage);
    }
    read() {
      try {
        const data = JSON.parse(this.storage?.getItem(this.storageKey) || 'null');
        return data && typeof data.access_token === 'string' && typeof data.refresh_token === 'string'
          && typeof data.user_id === 'string' && Number.isFinite(data.expires_at) ? data : null;
      } catch { return null; }
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
        user_id: user.id, user: { id: user.id, email: user.email || null, is_anonymous: user.is_anonymous === true,
          email_confirmed_at: user.email_confirmed_at || null, last_sign_in_at: user.last_sign_in_at || null } };
      this.requiresSignIn = false; this.persist(); this.emit(); return this.snapshot();
    }
    async request(path, { method = 'POST', body, token } = {}) {
      if (!this.configured) throw error('not_configured', 'Cloud saves are not connected yet. Guest play is available.');
      const headers = { apikey: this.key, 'Content-Type': 'application/json' };
      if (token) headers.Authorization = `Bearer ${token}`;
      let response;
      try { response = await this.fetch(`${this.url}/auth/v1/${path}`, {
        method, headers, ...(body === undefined ? {} : { body: JSON.stringify(body) }), signal: AbortSignal.timeout(12000),
      }); } catch { throw error('network', 'Could not reach sign-in. Your local progress is retained.'); }
      let data = null;
      try { data = await response.json(); } catch { /* Successful logout has no JSON body. */ }
      if (!response.ok) {
        const message = response.status === 429 ? 'Too many requests. Wait before asking for another code.'
          : response.status >= 500 ? 'Sign-in is temporarily unavailable. Try again shortly.'
            : String(data?.msg || data?.message || data?.error_description || 'Sign-in could not be completed.').slice(0, 250);
        throw error(data?.error_code || data?.code || 'auth_error', message, response.status);
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
      if (generation !== this.generation || user?.id !== expectedUser) throw error('stale_session', 'The active account changed.');
      this.session.user = { id: user.id, email: user.email || null, is_anonymous: user.is_anonymous === true,
        email_confirmed_at: user.email_confirmed_at || null, last_sign_in_at: user.last_sign_in_at || null };
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
    email(value) {
      const normalized = String(value || '').trim();
      if (normalized.length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalized)) throw error('invalid_email', 'Enter a valid email address.');
      return normalized;
    }
    async requestCode(value, { upgrade = false } = {}) {
      const email = this.email(value);
      if (upgrade) {
        const user = await this.ensureAnonymous();
        if (!user.is_anonymous) throw error('already_registered', 'This player already has an account.');
        const token = await this.token();
        await this.request('user', { method: 'PUT', token, body: { email } });
        this.pendingEmail = { email, upgrade: true, userId: user.id, generation: this.generation };
      } else {
        await this.request('otp', { body: { email, create_user: false } });
        this.pendingEmail = { email, upgrade: false, generation: this.generation };
      }
      return { email, upgrade };
    }
    async verifyCode(value, code, { upgrade = false } = {}) {
      const email = this.email(value), token = String(code || '').trim();
      if (!/^\d{6,10}$/.test(token)) throw error('invalid_code', 'Enter the numeric code from your email.');
      const pending = this.pendingEmail;
      if (!pending || pending.email !== email || pending.upgrade !== upgrade || pending.generation !== this.generation)
        throw error('code_request_required', 'Request a new code in this tab before continuing.');
      const generation = this.generation;
      const data = await this.request('verify', { body: { email, token, type: upgrade ? 'email_change' : 'email' } });
      if (data?.access_token) {
        if (!upgrade) this.generation++;
        this.save(data, { expectedGeneration: upgrade ? generation : generation + 1, expectedUser: upgrade ? pending.userId : undefined });
      } else if (!upgrade) throw error('invalid_session', 'The code did not create a usable session.');
      const user = await this.getUser();
      if (upgrade && (user.id !== pending.userId || user.is_anonymous || !user.email_confirmed_at))
        throw error('confirmation_pending', 'Email confirmation is not complete. Follow the confirmation instructions and try again.');
      this.pendingEmail = null; return user;
    }
    async signOut() {
      const token = this.session?.access_token;
      this.generation++; this.session = null; this.pendingEmail = null; this.requiresSignIn = false;
      this.persist(); this.emit();
      if (!token || !this.configured) return { local: true, remote: true };
      try { await this.request('logout?scope=local', { token }); return { local: true, remote: true }; }
      catch { return { local: true, remote: false }; }
    }
    close() { this.events?.removeEventListener?.('storage', this.onStorage); this.listeners.clear(); }
  }
  return { Client };
})();
if (typeof module !== 'undefined') module.exports = AccountSession;
globalThis.AccountSession = AccountSession;
