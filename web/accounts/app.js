"use strict";

// Account presentation and integration. Gameplay stays local; only semantic
// operations enter the durable queue. Never upload the mutable game save.
const AccountApp = (() => {
  const copy = value => JSON.parse(JSON.stringify(value));
  const snapshotKeys = ['mode', 'difficulty', 'over', 'won', 'shielded', 'score', 'mistakes',
    'remaining', 'damage_taken', 'attacks_completed', 'counter_hits', 'shots_fired', 'fight_elapsed',
    'healing_collected', 'near_misses', 'elapsed', 'lives', 'max_lives', 'hp', 'max_hp',
    'death_cause', 'attack_survivals'];
  function compactSnapshot(snapshot) {
    return Object.fromEntries(snapshotKeys.filter(key => snapshot[key] !== undefined && snapshot[key] !== null)
      .map(key => [key, copy(snapshot[key])]));
  }
  class App {
    constructor({ getProfile, applyProfile, isPlaying, config, onCode, onIdentityLoss }) {
      this.getProfile = getProfile;
      this.applyProfile = applyProfile;
      this.isPlaying = isPlaying;
      this.configPromise = Promise.resolve(config);
      this.onCode = onCode;
      this.onIdentityLoss = onIdentityLoss;
      this.initialized = false;
      this.chain = Promise.resolve();
      this.currentRun = null;
      this.importSource = null;
      this.busy = false;
      this.buildUI();
      this.ready = this.initialize();
    }
    async tabIdentity() {
      let id;
      try { id = sessionStorage.getItem('microgame-madness.account-tab'); } catch { /* Memory-only identity. */ }
      if (!id) id = crypto.randomUUID();
      const remember = () => { try { sessionStorage.setItem('microgame-madness.account-tab', id); } catch { /* Storage status is reported separately. */ } };
      // Duplicate Tab can copy sessionStorage. A live document must own its ID.
      if (navigator.locks?.request) await new Promise(resolve => {
        const claim = () => navigator.locks.request(`microgame-account-tab:${id}`, { ifAvailable: true }, async lock => {
          if (!lock) { id = crypto.randomUUID(); return claim(); }
          remember(); resolve();
          await new Promise(release => {
            window.addEventListener('pagehide', event => { if (!event.persisted) release(); }, { once: true });
          });
        }).catch(() => { remember(); resolve(); });
        claim();
      });
      else remember();
      return id;
    }
    async initialize() {
      try {
        this.config = await this.configPromise;
        this.session = new AccountSession.Client(this.config);
        this.store = new AccountStore.Store({ rules: AccountRules });
        this.controller = new AccountSync.Controller({ config: this.config, store: this.store,
          session: this.session, rules: AccountRules });
        await this.controller.initialize(copy(this.getProfile()));
        await this.controller.claimStream(await this.tabIdentity());
        this.controller.subscribe(state => {
          this.render();
          if (this.isolateChangedIdentity()) return;
          if (state.lastSyncedAt && state.lastSyncedAt !== this.lastAppliedSync) {
            this.lastAppliedSync = state.lastSyncedAt;
            const owner = state.owner;
            this.chain.then(() => {
              if (owner === this.controller.state().owner && !this.controller.state().pending) this.applyCurrent();
            }).catch(error => this.message(error.message));
          }
        });
        this.applyCurrent();
        this.render();
        // Interrupted runs retain checkpoint progress but cannot produce a win.
        const state = this.controller.state();
        for (const [id, run] of Object.entries(state.profile?.runs || {})) {
          if (!run.finished && run.streamId === this.controller.state().streamId)
            await this.controller.enqueue('run.finish', { snapshot: run.snapshot || { mode: run.mode,
              difficulty: run.difficulty, score: 0 }, outcome: 'interrupted' }, { runId: id });
        }
        this.initialized = true;
        this.applyCurrent();
      } catch (error) {
        this.initialized = true;
        this.message(error.message || 'Accounts are unavailable. Local play still works.');
      }
      return this;
    }
    get signedIn() {
      const user = this.session?.snapshot()?.user;
      return !!user && user.is_anonymous !== true && this.controller?.state().owner !== 'guest';
    }
    get accountBound() { return this.controller?.state().owner !== undefined && this.controller.state().owner !== 'guest'; }
    isolateChangedIdentity() {
      const owner = this.controller?.state().owner;
      if (!owner || owner === 'guest' || this.session.snapshot().user?.id === owner || this.isolating || this.busy) return false;
      this.isolating = true;
      this.currentRun = null;
      this.onIdentityLoss?.();
      this.controller.activate('guest').then(async () => { this.applyCurrent(); this.render(true); await this.loadHistory(); }).catch(error => this.message(error.message))
        .finally(() => { this.isolating = false; });
      return true;
    }
    get blocked() { return !this.initialized || !!this.controller?.state()?.importRequired; }
    enqueue(kind, payload, options = {}) {
      const immutable = copy(payload);
      options = { occurredAt: Date.now(), ...options };
      const generation = this.controller?.generation;
      const task = this.chain.then(async () => {
        await this.ready;
        if (!this.controller) return;
        if (generation !== undefined && generation !== this.controller.generation) throw new Error('The active profile changed before saving this action.');
        return this.controller.enqueue(kind, immutable, options);
      });
      this.chain = task.catch(error => this.message(error.message));
      return task;
    }
    startRun(mode, difficulty) {
      if (difficulty === 'final_cutscene') return;
      this.currentRun = { id: crypto.randomUUID(), mode, difficulty, last: null, signature: '' };
      this.enqueue('run.start', { mode, difficulty }, { runId: this.currentRun.id }).catch(() => {});
    }
    observe(snapshot, changed, occurredAt = Date.now()) {
      const run = this.currentRun;
      if (!run || snapshot.dying) return;
      run.last = compactSnapshot(snapshot);
      if (snapshot.over) { this.finish(snapshot, snapshot.won ? 'win' : 'loss', occurredAt); return; }
      if (!changed) return;
      const signature = JSON.stringify(run.last);
      if (signature === run.signature) return;
      run.signature = signature;
      this.enqueue('run.checkpoint', { snapshot: run.last }, { runId: run.id, occurredAt }).catch(() => {});
    }
    finish(snapshot, outcome = 'interrupted', occurredAt = Date.now()) {
      const run = this.currentRun;
      if (!run) return;
      this.currentRun = null;
      const data = snapshot ? compactSnapshot(snapshot) : run.last || { mode: run.mode, difficulty: run.difficulty, score: 0 };
      this.enqueue('run.finish', { snapshot: data, outcome }, { runId: run.id, occurredAt }).catch(() => {});
    }
    arcade(event, payload = {}, options = {}) { this.enqueue('arcade', { event, ...payload }, options).catch(() => {}); }
    preferences(profile) {
      if (!this.initialized || !this.controller) return;
      const generation = this.controller.generation;
      const desired = { player: profile.player, cubieCustom: profile.cubieCustom || 'classic',
        turtleTrail: profile.turtleTrail || null };
      this.chain = this.chain.then(async () => {
        this.checkIdentity(generation);
        const current = this.controller.state().profile;
        const changes = Object.fromEntries(Object.entries(desired).filter(([key, value]) => current[key] !== value));
        if (Object.keys(changes).length) await this.controller.enqueue('settings', {
          changes, baseRevisions: current.preferenceRevisions || {},
        });
      }).catch(error => this.message(error.message));
    }
    async setting(changes) {
      const generation = this.controller.generation;
      await this.chain;
      this.checkIdentity(generation);
      const current = this.controller.state().profile;
      await this.controller.enqueue('settings', { changes, baseRevisions: current.preferenceRevisions || {} });
      this.applyCurrent();
      if (Object.hasOwn(changes, 'leaderboard')) {
        try { await this.onVisibilityChange?.(); }
        catch { throw new Error('Preferences saved on this device. Leaderboard visibility will update when you reconnect.'); }
      }
    }
    checkIdentity(generation) {
      if (generation !== this.controller.generation) throw new Error('The active profile changed before saving this action.');
    }
    async purchase(itemId) {
      const generation = this.controller.generation;
      await this.chain;
      this.checkIdentity(generation);
      if (this.signedIn) {
        await this.controller.flush();
        this.checkIdentity(generation);
        if (this.controller.state().pending) throw new Error('Connect and sync your earnings before purchasing.');
        if (!navigator.onLine) throw new Error('Connect to purchase with your account.');
      }
      await this.controller.enqueue('purchase', { itemId });
      if (this.signedIn) await this.controller.flush();
      this.checkIdentity(generation);
      this.applyCurrent();
      if (!this.controller.state().profile.shop.owned.includes(itemId))
        throw new Error('The purchase was not accepted. Your balance has been refreshed.');
    }
    applyCurrent() {
      if (!this.controller || this.isPlaying() || this.controller.state().importRequired) return;
      this.applyProfile(copy(this.controller.state().profile));
    }
    message(value) { this.nodes.message.textContent = value || ''; }
    async action(callback) {
      if (this.busy) return;
      this.busy = true;
      this.nodes.panel.setAttribute('aria-busy', 'true');
      this.message('');
      try { await this.ready; await this.chain; await callback(); }
      catch (error) { this.message(error.message || 'That change could not be saved. Please try again.'); }
      finally { this.busy = false; this.nodes.panel.removeAttribute('aria-busy'); this.isolateChangedIdentity(); this.render(); }
    }
    buildUI() {
      const container = document.createElement('section');
      container.className = 'account-entry';
      container.innerHTML = '<button type="button" id="account-open" class="quiet-button">Your arcade profile</button>'
        + '<p id="account-summary" role="status">Saved on this device</p>';
      document.querySelector('.sidebar .setup').after(container);
      const dialog = document.createElement('dialog');
      dialog.id = 'account-dialog'; dialog.className = 'account-dialog';
      dialog.setAttribute('aria-labelledby', 'account-heading');
      dialog.innerHTML = `
        <div class="account-header"><h2 id="account-heading">Your arcade profile</h2><button type="button" id="account-close" aria-label="Close profile">×</button></div>
        <p id="account-status" role="status"></p><p id="account-message" role="status" aria-live="polite"></p>
        <section id="account-auth"><h3>Keep your progress</h3><p>Sign in to save across devices. Playing as a guest stays available.</p>
          <label>Email <input id="account-email" type="email" autocomplete="email" maxlength="254"></label>
          <div class="account-actions"><button type="button" id="account-create">Save my progress</button><button type="button" id="account-login">Sign in</button></div>
          <div id="account-code-step" hidden><label>Email code <input id="account-code" inputmode="numeric" autocomplete="one-time-code" maxlength="12"></label><button type="button" id="account-verify">Confirm code</button></div>
        </section>
        <section id="account-import" hidden><h3>Bring your guest progress</h3><p id="account-import-summary"></p>
          <p>Achievements, Cash, and purchases in an old save belong to this shared browser profile. They cannot be split by player name.</p>
          <fieldset id="account-import-names"><legend>Score names to include</legend></fieldset>
          <div class="account-actions"><button type="button" id="account-import-confirm">Import this progress</button><button type="button" id="account-import-skip">Keep guest progress separate</button></div>
        </section>
        <section><h3>Preferences</h3><label>Display name <input id="account-name" maxlength="24" autocomplete="nickname"></label>
          <label class="account-check"><input id="account-sound" type="checkbox"> Sound enabled</label>
          <label class="account-check"><input id="account-motion" type="checkbox"> Reduce motion</label>
          <label class="account-check"><input id="account-ranking" type="checkbox"> Share my name and best scores on casual leaderboards</label>
          <label class="account-check"><input id="account-public" type="checkbox"> Make my arcade profile public</label>
          <button type="button" id="account-save-settings">Save preferences</button>
        </section>
        <section><h3>Recent games</h3><div class="account-history-filters"><label>Game <select id="account-history-game"><option value="">All games</option></select></label>
          <label>Difficulty <select id="account-history-difficulty"><option value="">All difficulties</option></select></label><label>Outcome <select id="account-history-outcome"><option value="">All outcomes</option><option value="win">Wins</option><option value="loss">Losses</option><option value="exit">Exited</option><option value="interrupted">Interrupted</option></select></label></div>
          <p id="account-history-summary"></p><ol id="account-history"></ol><button type="button" id="account-history-more" hidden>More results</button>
        </section>
        <section><h3>Your data</h3><div class="account-actions"><button type="button" id="account-sync">Sync now</button><button type="button" id="account-export">Export progress</button></div>
          <label>Review a saved backup <input id="account-file" type="file" accept="application/json,.json"></label>
          <div id="account-user-actions" hidden><p>Signing out keeps unsynced work on this device for this account. Other signed-in players cannot use it.</p>
            <button type="button" id="account-signout">Sign out</button>
            <details><summary>Delete account</summary><p>This removes your cloud history, progress, purchases, and public records. Sign in again first if your session is older than ten minutes. Backup copies expire under the service retention policy.</p>
              <label>Type DELETE to confirm <input id="account-delete-confirm" autocomplete="off"></label><button type="button" id="account-delete">Delete my account</button></details>
          </div>
        </section>`;
      document.body.append(dialog);
      this.nodes = { panel: dialog, message: dialog.querySelector('#account-message') };
      const $ = id => document.getElementById(id);
      this.$ = $;
      $('account-open').onclick = () => {
        if (this.isPlaying()) { $('account-summary').textContent = 'Finish or leave this round to open your profile.'; return; }
        dialog.showModal(); this.render(true); this.action(() => this.loadHistory());
      };
      $('account-close').onclick = () => dialog.close();
      dialog.addEventListener('close', () => $('account-open').focus());
      $('account-create').onclick = () => this.action(() => this.requestCode(true));
      $('account-login').onclick = () => this.action(() => this.requestCode(false));
      $('account-verify').onclick = () => this.action(async () => {
        await this.session.verifyCode(this.authEmail, $('account-code').value.trim(), { upgrade: this.upgrade });
        const user = this.session.snapshot().user;
        await this.controller.activate(user.id, { bindGuest: this.upgrade });
        $('account-code').value = '';
        $('account-code-step').hidden = true;
        this.applyCurrent(); this.render(true); await this.loadHistory();
      });
      $('account-save-settings').onclick = () => this.action(async () => {
        await this.setting({ player: $('account-name').value.trim() || 'Player', soundOn: $('account-sound').checked,
          reducedMotion: $('account-motion').checked, leaderboard: $('account-ranking').checked,
          publicProfile: $('account-public').checked });
        this.message('Preferences saved.');
      });
      $('account-sync').onclick = () => this.action(async () => {
        await this.controller.flush(); await this.controller.pull(); this.applyCurrent(); await this.loadHistory();
      });
      $('account-signout').onclick = () => this.action(async () => {
        await this.controller.signOut({ retainPending: true }); this.applyCurrent(); this.render(true); await this.loadHistory();
      });
      $('account-delete').onclick = () => this.action(async () => {
        if ($('account-delete-confirm').value !== 'DELETE') throw new Error('Type DELETE to confirm account deletion.');
        await this.controller.deleteAccount(); $('account-delete-confirm').value = '';
        this.applyCurrent(); this.render(true); await this.loadHistory(); this.message('Your account was deleted. Guest play is available.');
      });
      $('account-export').onclick = () => this.action(async () => {
        const archive = await this.controller.export();
        const url = URL.createObjectURL(new Blob([JSON.stringify(archive, null, 2)], { type: 'application/json' }));
        const a = document.createElement('a'); a.href = url; a.download = 'microgame-madness-progress.json';
        a.click(); setTimeout(() => URL.revokeObjectURL(url), 1000);
      });
      $('account-file').onchange = () => this.action(async () => {
        const file = $('account-file').files[0]; if (!file) return;
        if (file.size > 5 * 1024 * 1024) throw new Error('Choose a progress file smaller than 5 MB.');
        const archive = JSON.parse(await file.text());
        const profile = archive.state || archive.profile || archive;
        if (!profile || typeof profile !== 'object' || !profile.achievements)
          throw new Error('That file is not an arcade progress backup.');
        this.importSource = { profile, baseline: false };
        this.renderImport(profile, false);
      });
      $('account-import-confirm').onclick = () => this.action(async () => {
        const state = this.controller.state();
        const source = this.importSource || { profile: state.importProfile, baseline: true };
        const names = [...$('account-import-names').querySelectorAll('input:checked')].map(input => input.value);
        await this.controller.importProfile(source.profile, { names, baseline: source.baseline });
        this.importSource = null; this.applyCurrent(); this.render(true); await this.loadHistory();
        this.message('Progress import saved. The original local backup is retained.');
      });
      $('account-import-skip').onclick = () => this.action(async () => {
        this.importSource = null;
        if (this.controller.state().importRequired) await this.controller.activate(this.session.snapshot().user.id, { bindGuest: false });
        this.applyCurrent(); this.render(true);
      });
      for (const id of ['account-history-game', 'account-history-difficulty', 'account-history-outcome'])
        $(id).onchange = () => this.action(async () => {
          if (id === 'account-history-game') {
            const all = document.createElement('option'); all.value = ''; all.textContent = 'All difficulties';
            $('account-history-difficulty').replaceChildren(all);
            for (const difficulty of AccountRules.modes[$('account-history-game').value] || []) {
              const option = document.createElement('option'); option.value = difficulty; option.textContent = difficulty.replaceAll('_', ' ');
              $('account-history-difficulty').append(option);
            }
          }
          await this.loadHistory();
        });
      $('account-history-more').onclick = () => this.action(() => this.loadHistory(true));
      for (const [id, name] of Object.entries({ hangman: 'Hangman', keyboard: 'Key Rush', dodge: 'Turtle Dodge',
        boss: 'Boss Crush', pumpkin: 'Pumpkin King', wrath: "King’s Wrath", singularity: 'Singularity Core', core_practice: 'Core practice' })) {
        const option = document.createElement('option'); option.value = id; option.textContent = name;
        $('account-history-game').append(option);
      }
    }
    async requestCode(upgrade) {
      if (!this.config?.url || !this.config?.key) throw new Error('Cloud accounts are not connected on this deployment. You can keep playing and export a local backup.');
      if (!this.$('account-email').reportValidity() || !this.$('account-email').value.trim())
        throw new Error('Enter your email address.');
      this.upgrade = upgrade; this.authEmail = this.$('account-email').value.trim();
      if (upgrade) await this.session.ensureAnonymous();
      await this.session.requestCode(this.authEmail, { upgrade });
      this.$('account-code-step').hidden = false; this.$('account-code').focus();
      this.message('Check your email for a code. You can request another code if it expires.');
    }
    render(force = false) {
      if (!this.controller) return;
      const state = this.controller.state(), profile = state.profile || {};
      if (this.displayOwner !== state.owner) {
        this.displayOwner = state.owner;
        this.importSource = null; this.importManifest = null; this.historyCursor = null;
        this.$('account-history').replaceChildren(); this.$('account-history-summary').textContent = '';
        this.$('account-history-more').hidden = true;
        for (const id of ['account-email', 'account-code', 'account-file', 'account-delete-confirm']) this.$(id).value = '';
        this.message(''); force = true;
      }
      const labels = { saved: 'Saved', synced: 'Saved', syncing: 'Syncing…', offline: 'Offline · Saved on this device',
        guest: 'Guest · Saved on this device', local: 'Guest · Saved on this device',
        sign_in_required: 'Sign in again to sync', attention: 'Progress needs attention', import_required: 'Review your guest progress', loading: 'Loading profile…',
        auth_required: 'Sign in again to sync', error: 'Progress needs attention', pending: 'Saved on this device · Sync pending' };
      let status = labels[state.status] || (this.signedIn ? state.status || 'Saved' : 'Guest · Saved on this device');
      if (!state.durable) status = 'Storage unavailable · Progress lasts for this visit unless saved online';
      else if (state.pending && this.signedIn) status = `${state.pending} changes waiting to sync`;
      if (state.importRequired) status = 'Review your guest progress to finish saving your account';
      this.$('account-summary').textContent = status;
      this.$('account-status').textContent = status;
      this.$('account-auth').hidden = this.signedIn;
      this.$('account-user-actions').hidden = !this.signedIn;
      this.$('account-sync').disabled = !this.signedIn || state.importRequired;
      const configured = !!(this.config?.url && this.config?.key);
      this.$('account-create').disabled = !configured; this.$('account-login').disabled = !configured;
      if (!configured) this.$('account-status').textContent += ' · Cloud accounts are not connected yet';
      if (force || !this.nodes.panel.open) {
        this.$('account-name').value = profile.player || 'Player';
        this.$('account-sound').checked = profile.preferences?.soundOn !== false;
        this.$('account-motion').checked = !!profile.preferences?.reducedMotion;
        this.$('account-ranking').checked = !!profile.privacy?.leaderboard;
        this.$('account-public').checked = !!profile.privacy?.publicProfile;
      }
      if (state.importRequired) this.renderImport(state.importProfile, true);
      else if (!this.importSource) this.$('account-import').hidden = true;
      if (state.rejected?.length) this.message(`${state.rejected.length} changes need review. ${state.rejected[0]?.error?.message || 'Export your progress before clearing local data.'}`);
    }
    renderImport(raw, baseline) {
      const profile = AccountRules.sanitizeLegacy(raw);
      this.$('account-import').hidden = false;
      this.$('account-import-summary').textContent = baseline
        ? `${Object.keys(profile.achievements.unlocked).length} achievements · ${Math.floor(profile.shop.units / 1000)} Cash · ${profile.shop.owned.length} purchased items. This becomes your account’s initial progress.`
        : `${Object.keys(profile.achievements.unlocked).length} achievements and eligible personal bests/unlocks can be imported. Additional Cash, counters, and streaks stay in the backup.`;
      if (baseline && this.controller.state().pending)
        this.$('account-import-summary').textContent += ` ${this.controller.state().pending} pending gameplay changes will also sync.`;
      const manifest = JSON.stringify([baseline, profile]);
      if (this.importManifest === manifest) return;
      this.importManifest = manifest;
      const names = new Set(Object.values(profile.scores).flat().map(row => row.player));
      const fieldset = this.$('account-import-names');
      fieldset.querySelectorAll('label').forEach(label => label.remove());
      for (const name of names) {
        const label = document.createElement('label'); label.className = 'account-check';
        const input = document.createElement('input'); input.type = 'checkbox'; input.value = name; input.checked = true;
        label.append(input, document.createTextNode(name)); fieldset.append(label);
      }
    }
    async loadHistory(more = false) {
      const filters = { limit: 20, mode: this.$('account-history-game').value || undefined,
        outcome: this.$('account-history-outcome').value || undefined, difficulty: this.$('account-history-difficulty').value || undefined };
      if (more && this.historyCursor) filters.cursor = this.historyCursor;
      const data = await this.controller.history(filters);
      const list = this.$('account-history');
      if (!more) list.replaceChildren();
      for (const run of data.runs || []) {
        const li = document.createElement('li');
        const time = run.finishedAt || run.finished_at;
        li.textContent = `${run.mode} · ${run.difficulty} · ${run.outcome} · ${run.score || 0} pts${time ? ` · ${new Date(time).toLocaleString()}` : ''}`;
        list.append(li);
      }
      if (!list.children.length) { const li = document.createElement('li'); li.textContent = 'Your next game starts your history. Older bests remain in Scores.'; list.append(li); }
      const results = data.runs || [];
      this.$('account-history-summary').textContent = `${results.length} results on this page · ${results.filter(run => run.outcome === 'win').length} wins · ${results.filter(run => run.outcome === 'loss').length} losses`;
      this.historyCursor = data.next_cursor;
      this.$('account-history-more').hidden = !this.historyCursor;
    }
  }
  return { App, compactSnapshot };
})();
if (typeof module !== 'undefined') module.exports = AccountApp;
