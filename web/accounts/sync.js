"use strict";

const AccountSync = (() => {
  const clone = value => value === undefined ? undefined : JSON.parse(JSON.stringify(value));
  const fault = (code, message, status) => Object.assign(new Error(message), { code, status });
  class Controller {
    constructor({ config = {}, store, session, rules = globalThis.AccountRules, fetch = globalThis.fetch,
      now = Date.now, events = globalThis, online = () => globalThis.navigator?.onLine !== false } = {}) {
      this.config = config; this.store = store; this.session = session; this.rules = rules;
      this.fetch = fetch?.bind(globalThis); this.now = now; this.online = online; this.events = events;
      this.owner = 'guest'; this.record = null; this.status = 'loading'; this.error = null;
      this.listeners = new Set(); this.generation = 0; this.flushing = null; this.retryTimer = null;
      this.retryDelay = 1000; this.disposed = false; this.working = Promise.resolve();
      this.sessionGeneration = session?.generation || 0;
      this.unsubStore = store.subscribe(change => {
        if (change.external && (change.owner === this.owner || !change.owner)) this.refreshLocal().catch(caught => this.fail(caught));
      });
      this.unsubSession = session.subscribe(value => {
        if (value.generation !== this.sessionGeneration) {
          this.sessionGeneration = value.generation; this.generation++; this.cancelRetry();
        }
        if (this.owner !== 'guest' && value.user?.id !== this.owner) {
          this.status = 'sign_in_required'; this.record = null; this.emit();
        } else if (value.requiresSignIn) { this.status = 'sign_in_required'; this.emit(); }
      });
      this.onOnline = () => { this.cancelRetry(); this.flush().catch(() => {}); };
      this.onFocus = () => { if (this.owner !== 'guest') this.pull().catch(() => {}); };
      events?.addEventListener?.('online', this.onOnline);
      events?.addEventListener?.('focus', this.onFocus);
    }
    get streamId() { return this.claimedStream || this.record?.streamId || null; }
    subscribe(listener) { this.listeners.add(listener); return () => this.listeners.delete(listener); }
    state() {
      return { owner: this.owner, streamId: this.streamId, profile: clone(this.record?.optimistic || this.rules.initial()),
        confirmed: clone(this.record?.confirmed || this.rules.initial()), pending: this.record?.pending.length || 0,
        rejected: clone(this.record?.rejected || []), blocked: clone(this.record?.blocked || []),
        status: this.status, durable: this.store.durable, storageReason: this.store.reason,
        lastSyncedAt: this.record?.lastSyncedAt || null, publicId: this.record?.publicId || null,
        importRequired: this.record?.importRequired === true, importProfile: clone(this.record?.importSource),
        error: this.error ? { code: this.error.code, message: this.error.message } : null };
    }
    emit() { if (!this.disposed) for (const listener of this.listeners) listener(this.state()); }
    localStatus() {
      if (this.owner === 'guest') return 'guest';
      if (this.record?.importRequired) return 'import_required';
      if (!this.session.snapshot().user || this.session.requiresSignIn) return 'sign_in_required';
      if (this.record?.rejected.length || this.record?.blocked?.length) return 'attention';
      if (!this.online()) return 'offline';
      return this.record?.pending.length ? 'pending' : 'saved';
    }
    async initialize(legacyProfile) {
      await this.store.open();
      this.record = await this.store.ensure('guest', legacyProfile || this.rules.initial());
      this.status = 'guest'; this.emit();
      if (this.session.snapshot().user) {
        let user;
        try {
          user = await this.session.getUser();
        } catch (caught) {
          const cached = this.session.snapshot().user;
          const record = cached?.is_anonymous === false ? await this.store.get(cached.id) : null;
          if (record && (record.lastSyncedAt || record.revision > 0 || record.pending.length || record.importRequired)) {
            this.owner = cached.id; this.record = record;
            this.fail(caught);
          } else { this.error = caught; this.emit(); }
        }
        if (user && !user.is_anonymous) {
          // activate owns rollback; do not replace its restored guest with an
          // empty account when the first cloud snapshot could not be loaded.
          try {
            const existing = await this.store.get(user.id);
            await this.activate(user.id, { bindGuest: this.session.pendingRegistration?.()?.owner === user.id || existing?.importRequired === true });
          } catch { /* Error is exposed by activate. */ }
        }
      }
      if (this.owner === 'guest' && this.record?.boundTo) await this.activate('guest');
      return this.state();
    }
    async refreshLocal() {
      const generation = this.generation, owner = this.owner;
      const record = await this.store.get(owner);
      if (generation !== this.generation || owner !== this.owner) return;
      this.record = record; this.status = this.localStatus(); this.emit();
    }
    serialize(task) {
      const run = this.working.then(task); this.working = run.catch(() => {}); return run;
    }
    async claimStream(tabId) {
      const owner = this.owner, generation = this.generation;
      const streamId = await this.store.claimStream(owner, tabId);
      if (generation !== this.generation || owner !== this.owner) throw fault('stale_session', 'The active profile changed.');
      this.tabId = tabId; this.claimedStream = streamId; await this.refreshLocal(); return streamId;
    }
    async activate(owner, { bindGuest = false } = {}) {
      bindGuest ||= owner !== 'guest' && this.session.pendingRegistration?.()?.owner === owner;
      if (owner !== 'guest' && this.session.snapshot().user?.id !== owner)
        throw fault('wrong_owner', 'Sign in to that account before loading its progress.');
      const previous = { owner: this.owner, record: this.record, claimedStream: this.claimedStream };
      this.generation++; const generation = this.generation; this.cancelRetry();
      this.owner = owner; this.claimedStream = null; this.record = null; this.status = 'loading'; this.error = null; this.emit();
      try {
        if (bindGuest && owner !== 'guest') {
          const response = await this.request('snapshot');
          if (generation !== this.generation) throw fault('stale_session', 'The active account changed.');
          if (!response.state || !Number.isSafeInteger(response.revision)) throw fault('invalid_response', 'The save service did not return a profile.');
          const source = await this.store.get('guest');
          if (source?.boundTo === owner) {
            // A previous conversion already committed locally before a reload.
            this.session.completeRegistration?.(owner);
          } else if (response.revision > 0) throw fault('existing_account', 'This account already has progress. Keep the guest profile separate or import selected records.');
          // Source fencing, destination copy, and import hold are one transaction.
          if (source?.boundTo !== owner) await this.store.bind('guest', owner, { snapshot: response });
          this.session.completeRegistration?.(owner);
        } else {
          if (owner === 'guest') {
            await this.store.mutate('guest', record => record?.boundTo ? this.store.empty('guest') : record || this.store.empty('guest'));
          } else { await this.store.cancelBinding(owner); await this.store.ensure(owner); }
        }
        if (generation !== this.generation) throw fault('stale_session', 'The active account changed.');
        await this.refreshLocal();
        if (this.tabId) await this.claimStream(this.tabId);
        if (owner !== 'guest' && !this.record.importRequired) {
          try { await this.pull(); }
          catch (caught) {
            // Existing acknowledged saves work offline. A first load must not
            // replace unknown cloud progress with an apparently empty account.
            if (!this.record.lastSyncedAt && !this.record.pending.length && this.record.revision === 0) throw caught;
            this.fail(caught);
          }
          this.flush().catch(() => {});
        }
        return this.state();
      } catch (caught) {
        if (generation === this.generation) {
          const target = await this.store.get(owner).catch(() => null);
          if (target?.importRequired && this.session.snapshot().user?.id === owner) {
            // Conversion committed before a later local error. Keep its hold
            // visible so neither copied guest nor account writes can proceed.
            this.record = target; this.status = 'import_required';
          } else if (previous.owner === 'guest' || this.session.snapshot().user?.id === previous.owner) {
            this.owner = previous.owner; this.record = await this.store.get(previous.owner).catch(() => previous.record);
            this.claimedStream = previous.claimedStream;
            this.status = this.localStatus();
          } else {
            this.owner = 'guest'; this.claimedStream = null;
            this.record = await this.store.mutate('guest', record => record?.boundTo ? this.store.empty('guest') : record || this.store.empty('guest'));
            if (this.tabId) this.claimedStream = await this.store.claimStream('guest', this.tabId);
            this.status = 'guest';
          }
          this.error = caught; this.emit();
        }
        throw caught;
      }
    }
    async enqueue(kind, payload = {}, options = {}) {
      const owner = this.owner, generation = this.generation;
      const enqueueOptions = { ...options, streamId: options.streamId || this.streamId };
      return this.serialize(async () => {
        if (generation !== this.generation || owner !== this.owner) throw fault('stale_session', 'The active profile changed before saving this action.');
        if (owner !== 'guest' && this.session.snapshot().user?.id !== owner) throw fault('sign_in_required', 'Sign in to the original account before saving more progress.');
        if (kind === 'purchase' && owner !== 'guest') {
          if (!this.online()) throw fault('offline_purchase', 'Connect before purchasing with an account.');
          const current = await this.store.get(owner);
          if (current.pending.some(op => op.kind === 'purchase')) throw fault('purchase_pending', 'Wait for your previous purchase to finish syncing.');
          const item = this.rules.catalog.find(item => item.id === payload.itemId && item.price);
          if (item && !current.confirmed.shop.owned.includes(item.id) && current.confirmed.shop.units < item.price * 1000)
            throw fault('unconfirmed_balance', 'Sync your earnings before spending this Cash.');
        }
        const record = await this.store.append(owner, kind, payload, enqueueOptions);
        if (generation === this.generation && owner === this.owner) {
          this.record = record; this.error = null; this.status = this.localStatus(); this.emit();
          if (owner !== 'guest' && !record.importRequired) this.flush().catch(() => {});
        }
        return this.state();
      });
    }
    async request(action, parameters = {}, { owner = this.owner, generation = this.generation, authenticated = true } = {}) {
      if (!this.session.configured) throw fault('not_configured', 'Cloud saves are not connected yet.');
      if (authenticated && (owner === 'guest' || this.session.snapshot().user?.id !== owner))
        throw fault('sign_in_required', 'Sign in to sync this profile.');
      const token = authenticated ? await this.session.token() : null;
      if (generation !== this.generation || owner !== this.owner) throw fault('stale_session', 'The active account changed.');
      let response;
      try {
        response = await this.fetch(`${this.session.url}/functions/v1/accounts`, {
          method: 'POST', headers: { apikey: this.session.key, 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
          body: JSON.stringify({ action, ...parameters }), signal: AbortSignal.timeout(15000),
        });
      } catch { throw fault('network', 'Connection interrupted. Your pending progress is retained.'); }
      let body; try { body = await response.json(); } catch { throw fault('invalid_response', 'The save service returned an unreadable reply.'); }
      if (generation !== this.generation || owner !== this.owner) throw fault('stale_session', 'The active account changed.');
      if (!response.ok) throw fault(body?.error?.code || body?.code || 'service_error', body?.error?.message || body?.message || 'The save service could not complete this request.', response.status);
      return body;
    }
    async pull() {
      if (this.owner === 'guest' || this.record?.importRequired) return this.state();
      const owner = this.owner, generation = this.generation;
      const response = await this.request('snapshot', {}, { owner, generation });
      if (!response.state || !Number.isSafeInteger(response.revision)) throw fault('invalid_response', 'The save service did not return a profile.');
      const record = await this.store.acknowledge(owner, { ...response, receipts: [] });
      if (generation !== this.generation || owner !== this.owner) return this.state();
      this.record = record; this.error = null; this.status = this.localStatus(); this.emit(); return this.state();
    }
    fail(caught) {
      if (caught.code === 'stale_session') return;
      this.error = caught;
      if (caught.status === 401 || caught.code === 'sign_in_required') this.status = 'sign_in_required';
      else if (caught.code === 'account_deleted') { this.status = 'deleted'; this.cancelRetry(); }
      else if (caught.code === 'network' || !this.online()) this.status = 'offline';
      else this.status = 'attention';
      this.emit();
    }
    cancelRetry() { if (this.retryTimer) clearTimeout(this.retryTimer); this.retryTimer = null; }
    scheduleRetry() {
      if (this.retryTimer || this.disposed || this.owner === 'guest') return;
      this.retryTimer = setTimeout(() => { this.retryTimer = null; this.flush().catch(() => {}); }, this.retryDelay + Math.random() * 300);
      this.retryTimer?.unref?.(); this.retryDelay = Math.min(60000, this.retryDelay * 2);
    }
    async flush() {
      if (this.owner === 'guest' || this.record?.importRequired || !this.session.configured) return this.state();
      if (this.flushing && this.flushGeneration === this.generation) return this.flushing;
      if (!this.online()) { this.status = 'offline'; this.emit(); return this.state(); }
      const owner = this.owner, generation = this.generation;
      this.flushGeneration = generation;
      const work = (async () => {
        try {
          while (generation === this.generation && owner === this.owner) {
            const record = await this.store.get(owner);
            if (!record?.pending.length || record.importRequired) break;
            const rejected = new Set(record.rejected.map(item => item.operation.id));
            const pending = new Set(record.pending.map(item => item.id));
            const blocked = new Set((record.blocked || []).filter(item => item.code === 'dependency_failed').map(item => item.id));
            // Only send commands whose prerequisite receipts have arrived. This
            // prevents a rejected start from consuming its queued checkpoints.
            const operations = record.pending.filter(op => !blocked.has(op.id)
              && !(op.dependsOn || []).some(id => rejected.has(id) || pending.has(id))).slice(0, 25);
            if (!operations.length) break;
            this.status = 'syncing'; this.emit();
            const response = await this.request('operations', { operations }, { owner, generation });
            if (!Array.isArray(response.receipts) || !response.state || !Number.isSafeInteger(response.revision))
              throw fault('invalid_response', 'The save service did not acknowledge the submitted operations.');
            const terminal = response.receipts.filter(receipt => operations.some(op => op.id === receipt.id) && ['applied', 'duplicate', 'rejected'].includes(receipt.status));
            if (!terminal.length) {
              const blockedReceipt = response.receipts.find(receipt => receipt.status === 'blocked' && operations.some(op => op.id === receipt.id));
              if (blockedReceipt) {
                this.error = fault(blockedReceipt.error?.code || 'dependency_pending', blockedReceipt.error?.message || 'Resolve the earlier pending change before syncing this progress.');
                this.status = 'attention'; this.emit(); return this.state();
              }
              throw fault('invalid_response', 'The save service did not acknowledge any submitted operations.');
            }
            const updated = await this.store.acknowledge(owner, response);
            if (generation !== this.generation || owner !== this.owner) break;
            this.record = updated; this.error = null; this.retryDelay = 1000; this.emit();
          }
          if (generation === this.generation && owner === this.owner) await this.refreshLocal();
          return this.state();
        } catch (caught) {
          if (generation === this.generation && owner === this.owner) {
            this.fail(caught);
            if (caught.code === 'network' || caught.code === 'busy' || caught.status >= 500 || caught.status === 429) this.scheduleRetry();
          }
          throw caught;
        }
      })();
      this.flushing = work;
      try { return await work; } finally { if (this.flushing === work) this.flushing = null; }
    }
    prepareImport(profile, { names, baseline = false } = {}) {
      const selected = this.rules.sanitizeLegacy(profile || {}, { names });
      return { profile: selected, baseline, names: names || [...new Set(Object.values(selected.scores || {}).flat().map(score => score?.player).filter(Boolean))],
        summary: { achievements: Object.keys(selected.achievements?.unlocked || {}).length,
          cash: Math.floor((selected.shop?.units || 0) / 1000), items: selected.shop?.owned?.length || 0,
          sharedProfile: true, importsBalance: baseline } };
    }
    async importProfile(profile, { names, baseline = false } = {}) {
      const owner = this.owner, generation = this.generation, importRequired = this.record?.importRequired;
      const assertCurrent = () => {
        if (owner !== this.owner || generation !== this.generation)
          throw fault('stale_session', 'The active profile changed before importing this backup.');
      };
      const preview = this.prepareImport(profile, { names, baseline });
      if (importRequired) {
        await this.store.backup(owner, profile, { names, baseline, original: true });
        assertCurrent();
        const record = await this.store.prependImport(owner, preview.profile, { names, baseline });
        assertCurrent(); this.record = record;
        this.status = this.localStatus(); this.emit(); await this.flush(); return this.state();
      }
      await this.store.backup(owner, profile, { names, baseline });
      assertCurrent();
      return this.enqueue('import', { profile: preview.profile, names: preview.names, baseline });
    }
    async history(filters = {}) {
      if (this.owner !== 'guest') {
        try { return await this.request('history', filters); }
        catch (caught) { if (caught.code !== 'network' && this.online()) throw caught; }
      }
      const runs = Object.values(this.record?.optimistic?.runs || {}).filter(run => run.outcome || run.finished);
      return { runs: runs.filter(run => (!filters.mode || run.mode === filters.mode)
        && (!filters.difficulty || run.difficulty === filters.difficulty) && (!filters.outcome || run.outcome === filters.outcome))
        .sort((a, b) => String(b.endedAt || b.finishedAt || '').localeCompare(String(a.endedAt || a.finishedAt || ''))).slice(0, filters.limit || 20), next_cursor: null };
    }
    async export() {
      if (this.owner === 'guest') return this.store.export(this.owner);
      return { ...(await this.request('export')), device: await this.store.export(this.owner) };
    }
    async signOut({ retainPending = true } = {}) {
      const owner = this.owner;
      this.generation++; this.cancelRetry();
      await this.working;
      const record = await this.store.get(owner);
      const result = await this.session.signOut();
      if (owner !== 'guest' && (!record?.pending.length || !retainPending)) await this.store.remove(owner, { discardPending: !retainPending });
      this.owner = 'guest'; this.record = await this.store.ensure('guest');
      if (this.record.boundTo) {
        // A converted guest never becomes a free copy of the account wallet.
        await this.store.remove('guest', { discardPending: true }); this.record = await this.store.ensure('guest');
      }
      this.claimedStream = null;
      if (this.tabId) await this.claimStream(this.tabId);
      this.status = 'guest'; this.error = null; this.emit(); return result;
    }
    async deleteAccount(password) {
      const owner = this.owner;
      if (owner === 'guest') throw fault('sign_in_required', 'Sign in before deleting an account.');
      this.cancelRetry();
      await this.request('delete', { confirmation: 'DELETE', password });
      this.generation++; await this.session.signOut();
      await this.store.remove(owner, { discardPending: true });
      const guest = await this.store.get('guest');
      if (guest?.boundTo === owner) await this.store.remove('guest', { discardPending: true });
      this.owner = 'guest'; this.record = await this.store.ensure('guest'); this.claimedStream = null;
      if (this.tabId) await this.claimStream(this.tabId);
      this.status = 'guest'; this.emit();
      return { deleted: true };
    }
    close() {
      this.disposed = true; this.generation++; this.cancelRetry(); this.unsubStore?.(); this.unsubSession?.();
      this.events?.removeEventListener?.('online', this.onOnline); this.events?.removeEventListener?.('focus', this.onFocus);
      this.listeners.clear();
    }
  }
  return { Controller };
})();
if (typeof module !== 'undefined') module.exports = AccountSync;
globalThis.AccountSync = AccountSync;
