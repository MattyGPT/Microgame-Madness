"use strict";

// All profile effects and their retry records share a single IndexedDB transaction.
const AccountStore = (() => {
  const clone = value => value === undefined ? undefined : JSON.parse(JSON.stringify(value));
  const id = () => globalThis.crypto?.randomUUID?.() || `local-${Date.now().toString(36)}-${Math.random().toString(36).slice(2)}`;
  function fault(code, message) { return Object.assign(new Error(message), { code }); }
  class MemoryDatabase {
    constructor() { this.records = new Map(); this.queue = Promise.resolve(); }
    mutate(key, change) {
      const next = this.queue.then(() => {
        const result = change(clone(this.records.get(key)));
        if (result === undefined) this.records.delete(key); else this.records.set(key, clone(result));
        return clone(result);
      });
      this.queue = next.catch(() => {});
      return next;
    }
    async get(key) { await this.queue; return clone(this.records.get(key)); }
  }
  class Store {
    constructor({ indexedDB, name = 'microgame-madness.accounts.v1', rules = globalThis.AccountRules,
      memory, now = Date.now, uuid = id, BroadcastChannel: Channel = globalThis.BroadcastChannel } = {}) {
      try { this.indexedDB = indexedDB === undefined ? globalThis.indexedDB : indexedDB; }
      catch { this.indexedDB = null; }
      this.name = name; this.rules = rules; this.now = now; this.uuid = uuid;
      this.memory = memory || new MemoryDatabase(); this.durable = false; this.reason = null;
      this.listeners = new Set(); this.opening = null; this.db = null;
      this.channel = Channel ? new Channel(name) : null;
      this.channel?.unref?.();
      if (this.channel) this.channel.onmessage = event => this.notify(event.data?.owner, true);
    }
    subscribe(listener) { this.listeners.add(listener); return () => this.listeners.delete(listener); }
    notify(owner, external = false) {
      if (!external) this.channel?.postMessage({ owner });
      for (const listener of this.listeners) listener({ owner, external, durable: this.durable, reason: this.reason });
    }
    async open() {
      if (this.opening) return this.opening;
      this.opening = new Promise(resolve => {
        if (!this.indexedDB) { this.reason = 'unavailable'; resolve(this); return; }
        let request, settled = false;
        const done = () => { if (!settled) { settled = true; resolve(this); } };
        try { request = this.indexedDB.open(this.name, 1); }
        catch { this.reason = 'unavailable'; done(); return; }
        request.onupgradeneeded = () => {
          if (!request.result.objectStoreNames.contains('profiles')) request.result.createObjectStore('profiles', { keyPath: 'owner' });
        };
        request.onerror = () => { this.reason = 'unavailable'; done(); };
        request.onblocked = () => { this.reason = 'upgrade_blocked'; done(); };
        request.onsuccess = () => {
          if (settled) { request.result.close(); return; }
          this.db = request.result; this.durable = true; this.reason = null;
          this.db.onversionchange = () => {
            this.db.close(); this.db = null; this.durable = false; this.reason = 'upgrade_required'; this.notify(null);
          };
          done();
        };
      });
      return this.opening;
    }
    async get(owner) {
      await this.open();
      if (this.reason === 'upgrade_required') throw fault('upgrade_required', 'Reload the arcade to continue saving.');
      if (!this.db) return this.memory.get(owner);
      return new Promise((resolve, reject) => {
        const tx = this.db.transaction('profiles', 'readonly');
        const request = tx.objectStore('profiles').get(owner);
        request.onsuccess = () => resolve(clone(request.result));
        request.onerror = () => reject(request.error);
      });
    }
    async mutate(owner, change) {
      await this.open();
      if (typeof owner !== 'string' || !owner) throw fault('invalid_owner', 'A profile owner is required.');
      if (this.reason === 'upgrade_required') throw fault('upgrade_required', 'Reload the arcade to continue saving.');
      let result;
      if (!this.db) result = await this.memory.mutate(owner, change);
      else result = await new Promise((resolve, reject) => {
        const tx = this.db.transaction('profiles', 'readwrite');
        const store = tx.objectStore('profiles'); const request = store.get(owner);
        let changed, error;
        request.onsuccess = () => {
          try {
            changed = change(clone(request.result));
            if (changed === undefined) store.delete(owner); else store.put(changed);
          } catch (caught) { error = caught; tx.abort(); }
        };
        tx.oncomplete = () => resolve(clone(changed));
        tx.onabort = tx.onerror = () => reject(error || tx.error || fault('storage', 'Could not save progress on this device.'));
      }).catch(error => {
        if (error.name === 'QuotaExceededError') { this.reason = 'quota'; this.notify(owner); }
        throw error;
      });
      this.notify(owner); return result;
    }
    empty(owner, state) {
      const initial = clone(state ? (state.schema === 1 ? state : this.rules.sanitizeLegacy(state)) : this.rules.initial());
      const streamId = this.uuid();
      // Moving the existing device save into IndexedDB is not an account import.
      // Preserve its local streak chain; an explicit cloud import still resets it.
      if (owner === 'guest' && state && state.schema !== 1) {
        const stream = initial.streams[streamId] ||= {};
        for (const key of ['bossCleanStreak', 'bossSovereignStreak', 'bossRunActive', 'bossSovereignRunActive']) {
          const value = state.achievements?.stats?.[key];
          if (Number.isSafeInteger(value) && value >= 0 && value <= 1000000000) {
            stream[key] = value; initial.achievements.stats[key] = value;
          }
        }
      }
      return { owner, version: 1, confirmed: initial, optimistic: clone(initial), revision: 0,
        pending: [], rejected: [], receipts: [], nextSequence: 1, streamId, backups: [], updatedAt: this.now() };
    }
    ensure(owner, initial) { return this.mutate(owner, record => record || this.empty(owner, initial)); }
    async claimStream(owner, tabId) {
      if (typeof tabId !== 'string' || !/^[A-Za-z0-9_-]{1,128}$/.test(tabId)) throw fault('invalid_tab', 'A stable tab identifier is required.');
      const record = await this.mutate(owner, record => {
        record ||= this.empty(owner);
        record.streamClaims ||= {};
        if (!record.streamClaims[tabId]) record.streamClaims[tabId] = Object.keys(record.streamClaims).length ? this.uuid() : record.streamId;
        return record;
      });
      return record.streamClaims[tabId];
    }
    apply(state, operation) { return this.rules.apply(state, operation, { now: this.now(), local: true }).state; }
    rebase(record) {
      let state = clone(record.confirmed);
      record.blocked = [];
      const failed = new Set(record.rejected.map(item => item.operation.id));
      const known = new Set([...record.receipts, ...record.pending.map(item => item.id)]);
      for (const operation of record.pending) {
        if ((operation.dependsOn || []).some(id => failed.has(id) || !known.has(id))) {
          failed.add(operation.id);
          record.blocked.push({ id: operation.id, code: 'dependency_failed', message: 'An earlier action must be resolved before this progress can sync.' });
          continue;
        }
        try { state = this.apply(state, operation); }
        catch (error) { failed.add(operation.id); record.blocked.push({ id: operation.id, code: error.code || 'invalid', message: error.message }); }
      }
      record.optimistic = state; record.updatedAt = this.now(); return record;
    }
    append(owner, kind, payload = {}, options = {}) {
      return this.mutate(owner, record => {
        record ||= this.empty(owner);
        if (record.boundTo) throw fault('bound_profile', 'This guest profile has moved to an account. Reload before continuing.');
        const operation = { id: options.id || this.uuid(), version: 1, kind, occurredAt: options.occurredAt ?? this.now(),
          streamId: options.streamId || record.streamId, sequence: record.nextSequence,
          payload: clone(payload) };
        if (options.runId) operation.runId = options.runId;
        const prior = options.runId ? record.pending.filter(item => item.runId === options.runId).at(-1) : null;
        const dependencies = [...new Set([...(options.dependsOn || []), ...(prior ? [prior.id] : [])])];
        if (dependencies.length) operation.dependsOn = clone(dependencies);
        if (record.pending.some(item => item.id === operation.id) || record.receipts.includes(operation.id) || record.rejected.some(item => item.operation.id === operation.id))
          throw fault('duplicate_operation', 'This operation ID has already been used.');
        const next = this.apply(record.optimistic, operation); // Validate before persisting either effect.
        record.nextSequence++; record.pending.push(operation); record.optimistic = next;
        record.updatedAt = this.now(); return record;
      });
    }
    prependImport(owner, profile, { names, baseline = true } = {}) {
      return this.mutate(owner, record => {
        if (!record) throw fault('missing_profile', 'Profile is unavailable on this device.');
        if (!record.importRequired) throw fault('import_not_pending', 'This profile does not have a pending guest conversion.');
        const operation = { id: this.uuid(), version: 1, kind: 'import', occurredAt: this.now(), streamId: this.uuid(), sequence: 1,
          payload: { profile: clone(profile), baseline, ...(names ? { names: clone(names) } : {}) } };
        record.backups.push({ id: operation.id, createdAt: this.now(), source: clone(profile), manifest: { baseline, names } });
        for (const pending of record.pending) if (!pending.dependsOn?.length) pending.dependsOn = [operation.id];
        record.pending.unshift(operation); record.importRequired = false;
        return this.rebase(record);
      });
    }
    acknowledge(owner, response) {
      return this.mutate(owner, record => {
        if (!record) throw fault('missing_profile', 'Profile is unavailable on this device.');
        const receipts = response.receipts || [];
        const pendingIds = new Set(record.pending.map(op => op.id));
        const completed = new Set();
        for (const receipt of receipts) {
          if (!pendingIds.has(receipt.id)) continue;
          if (!['applied', 'duplicate', 'rejected'].includes(receipt.status)) continue;
          completed.add(receipt.id);
          if (receipt.status === 'rejected') record.rejected.push({ operation: record.pending.find(op => op.id === receipt.id), error: clone(receipt.error) });
          else record.receipts.push(receipt.id);
        }
        if (response.state && Number.isSafeInteger(response.revision) && response.revision >= record.revision) {
          record.confirmed = clone(response.state); record.revision = response.revision;
        } else if (completed.size) throw fault('stale_acknowledgement', 'The server reply is older than this device’s confirmed save. Retry synchronization.');
        record.pending = record.pending.filter(op => !completed.has(op.id));
        if (response.public_id) record.publicId = response.public_id;
        record.lastSyncedAt = this.now();
        return this.rebase(record);
      });
    }
    backup(owner, source, manifest = {}) {
      return this.mutate(owner, record => {
        record ||= this.empty(owner);
        record.backups.push({ id: this.uuid(), createdAt: this.now(), source: clone(source), manifest: clone(manifest) });
        return record;
      });
    }
    async bind(sourceOwner, destinationOwner, { allowExisting = false, snapshot } = {}) {
      await this.open();
      if (sourceOwner === destinationOwner) return this.get(sourceOwner);
      const transform = (source, target) => {
        if (!source) throw fault('missing_profile', 'The guest save is unavailable.');
        if (source.boundTo && source.boundTo !== destinationOwner) throw fault('already_bound', 'This guest profile belongs to another account.');
        if (target?.boundFrom === sourceOwner) return { source, target };
        if (target && !allowExisting && (target.pending.length || target.revision || target.boundFrom))
          throw fault('existing_account', 'Keep this guest profile separate or review its legacy import.');
        const migrated = clone(source); migrated.owner = destinationOwner; migrated.boundFrom = sourceOwner;
        migrated.boundTo = null;
        if (snapshot) {
          if (!snapshot.state || !Number.isSafeInteger(snapshot.revision)) throw fault('invalid_response', 'A confirmed account snapshot is required for conversion.');
          migrated.importRequired = true; migrated.importSource = clone(source.confirmed);
          migrated.confirmed = clone(snapshot.state); migrated.revision = snapshot.revision;
          migrated.lastSyncedAt = this.now(); this.rebase(migrated);
        }
        source.boundTo = destinationOwner;
        return { source, target: migrated };
      };
      let result;
      if (!this.db) {
        // Memory fallback still serializes the entire two-record binding.
        const run = this.memory.queue.then(() => {
          const next = transform(clone(this.memory.records.get(sourceOwner)), clone(this.memory.records.get(destinationOwner)));
          this.memory.records.set(sourceOwner, next.source); this.memory.records.set(destinationOwner, next.target);
          return clone(next.target);
        });
        this.memory.queue = run.catch(() => {}); result = await run;
      } else result = await new Promise((resolve, reject) => {
        const tx = this.db.transaction('profiles', 'readwrite'), db = tx.objectStore('profiles');
        const sourceRequest = db.get(sourceOwner), targetRequest = db.get(destinationOwner);
        let result, caught;
        const finish = () => {
          if (sourceRequest.readyState !== 'done' || targetRequest.readyState !== 'done') return;
          try { result = transform(sourceRequest.result, targetRequest.result); db.put(result.source); db.put(result.target); }
          catch (error) { caught = error; tx.abort(); }
        };
        sourceRequest.onsuccess = targetRequest.onsuccess = finish;
        tx.oncomplete = () => resolve(clone(result.target));
        tx.onabort = tx.onerror = () => reject(caught || tx.error);
      });
      this.notify(sourceOwner); this.notify(destinationOwner); return result;
    }
    async cancelBinding(owner) {
      const record = await this.get(owner);
      if (!record?.importRequired || !record.boundFrom) return;
      await this.mutate(record.boundFrom, source => {
        if (source?.boundTo === owner) source.boundTo = null;
        return source;
      });
      await this.remove(owner, { discardPending: true });
    }
    async export(owner) {
      const record = await this.get(owner);
      if (!record) throw fault('missing_profile', 'No saved profile to export.');
      return { version: 1, exported_at: new Date(this.now()).toISOString(), profile: clone(record.optimistic),
        confirmed: clone(record.confirmed), pending: clone(record.pending), rejected: clone(record.rejected), revision: record.revision };
    }
    async remove(owner, { discardPending = false } = {}) {
      return this.mutate(owner, record => {
        if (record?.pending.length && !discardPending) throw fault('pending_operations', 'Sync or explicitly discard pending work before removing this profile.');
        return undefined;
      });
    }
    async clearAll() {
      await this.open();
      if (!this.db) {
        await this.memory.queue;
        this.memory.records.clear();
      } else await new Promise((resolve, reject) => {
        const tx = this.db.transaction('profiles', 'readwrite');
        tx.objectStore('profiles').clear();
        tx.oncomplete = resolve;
        tx.onabort = tx.onerror = () => reject(tx.error);
      });
      this.notify(null);
    }
    close() { this.db?.close(); this.channel?.close(); this.listeners.clear(); }
  }
  return { Store, MemoryDatabase, clone, uuid: id };
})();
if (typeof module !== 'undefined') module.exports = AccountStore;
globalThis.AccountStore = AccountStore;
