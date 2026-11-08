"use strict";

// Read before app.js creates its first local save. Existing players can replay
// the guide from their profile without being interrupted on every visit.
const ArcadeWelcome = (() => {
  const key = 'microgame-madness.welcome.v1';
  let firstVisit = true;
  try { firstVisit = !localStorage.getItem(key) && !localStorage.getItem('microgame-madness.v1'); }
  catch { /* The dialog still works when storage is unavailable. */ }
  const games = [
    { id:'hangman', title:'Hangman', line:'Let’s uncover a mystery word together!', help:'Choose letters with the alphabet buttons. Each wrong guess costs an attempt; reveal the whole word to win.' },
    { id:'keyboard', title:'Key Rush', line:'Ready to put those fingers to work?', help:'Type the sequence in order before the timer runs out. Use your keyboard or the on-screen keys on mobile. Watch for capitals and symbols!' },
    { id:'dodge', title:'Turtle Dodge', line:'Keep your little turtle out of trouble!', help:'Move with the arrow keys or touch controls to dodge falling blocks. Try the different difficulties, and visit Block Guide to learn the Chaos blocks.' },
    { id:'boss', title:'Boss Crush', line:'They’re big. You’re quick. Let’s do this!', help:'Move with arrows or touch controls, and hold F or the fire button to shoot. Dodge the boss’s volleys and watch your hearts.' },
    { id:'pumpkin', title:'The Pumpkin King', line:'This King has a few tricks up their sleeves.', help:'Move, shoot, and read each attack’s colors. Press E or Counter just before a magenta finger hits. Learn the patterns one at a time.' },
    { id:'wrath', title:'The King’s Wrath', line:'Want to practice a tricky royal attack?', help:'Choose a Pumpkin King attack to repeat, or choose Random Order. Use the countdown to get ready. Move with arrows or touch controls.' },
    { id:'geomayhem', title:'Geomayhem', line:'One Cubie, a whole lot of mayhem!', help:'Choose your starting weapon, move and aim, then fire at incoming shapes. Collect experience, pick upgrades, and build your weapon collection.' },
  ];
  class Guide {
    constructor(app) {
      this.app = app; this.step = 0; this.game = 0; this.busy = false;
      this.build();
      this.ready = app.ready.then(async () => {
        // An explicit off choice has a revision and is never changed here.
        const profile = app.controller?.state().profile;
        const defaults = {};
        for (const field of ['leaderboard', 'publicProfile'])
          if (profile && !profile.preferenceRevisions?.[field] && profile.privacy?.[field] === false) defaults[field] = true;
        if (Object.keys(defaults).length) {
          try { await app.setting(defaults); } catch { /* Saved locally; sync can retry later. */ }
        }
        if (firstVisit) this.open();
      });
    }
    $(id) { return this.dialog.querySelector(`#welcome-${id}`); }
    build() {
      const dialog = document.createElement('dialog'); this.dialog = dialog;
      dialog.id = 'welcome-dialog'; dialog.className = 'account-dialog welcome-dialog';
      dialog.setAttribute('aria-labelledby', 'welcome-dialog-title');
      dialog.innerHTML = `
        <div class="welcome-top"><span id="welcome-progress">YOUR ARCADE STARTS HERE</span><button id="welcome-close" type="button" aria-label="Skip setup and start playing">Set up later ×</button></div>
        <div class="welcome-host"><div id="welcome-cubie" aria-hidden="true"></div><div class="welcome-speech"><span class="welcome-speaker">CUBIE</span><h2 id="welcome-dialog-title" tabindex="-1"></h2><p id="welcome-line"></p></div></div>
        <ol class="welcome-steps" aria-label="Setup steps"><li>Hello</li><li>Account</li><li>Preferences</li><li>Game tour</li></ol>
        <div id="welcome-hello"><p>I’m your arcade buddy. I’ll cheer you on, celebrate your wins, and keep you company between games.</p><p>First, let’s decide how to save your progress and make the arcade feel right for you. Then I’ll show you around!</p></div>
        <div id="welcome-account" hidden>
          <p>Create an account with your email to save your progress across devices, or keep playing here as a guest.</p>
          <p id="welcome-cloud-note" class="welcome-note"></p>
          <form id="welcome-email-form"><label>Email address<input id="welcome-email" type="email" autocomplete="email" maxlength="254" required placeholder="you@example.com"></label>
            <div class="welcome-auth-actions"><button id="welcome-create" type="submit" class="welcome-primary">Create account & keep my progress</button><button id="welcome-login" type="button">I already have an account</button></div>
          </form>
          <form id="welcome-code-form" hidden><label>Your email code<input id="welcome-code" inputmode="numeric" autocomplete="one-time-code" pattern="[0-9]{6,12}" minlength="6" maxlength="12" required></label><div class="welcome-auth-actions"><button class="welcome-primary" type="submit">Confirm my email</button><button id="welcome-resend" type="button">Send another code</button><button id="welcome-change-email" type="button">Change email</button></div></form>
          <p id="welcome-account-success" hidden>Your account is ready. Let’s choose your preferences!</p>
        </div>
        <form id="welcome-preferences" hidden>
          <label>What should I call you?<input id="welcome-name" maxlength="24" autocomplete="nickname" placeholder="Player"></label>
          <label class="welcome-option"><input id="welcome-sound" type="checkbox" checked><span><strong>Sound & music</strong><small>Hear the arcade’s music and game effects.</small></span></label>
          <label class="welcome-option"><input id="welcome-motion" type="checkbox"><span><strong>Reduce motion</strong><small>Keep decorative animation still and pause tour videos until you press Play.</small></span></label>
          <label class="welcome-option"><input id="welcome-sharing" type="checkbox" checked><span><strong>Share my leaderboard scores</strong><small>On by default. Shares your display name and best scores, never your email. You can switch it off here.</small></span></label>
          <label class="welcome-option"><input id="welcome-public" type="checkbox" checked><span><strong>Public arcade profile</strong><small>On by default. Let other players view your arcade profile. Switch this off if you want it private.</small></span></label>
          <p class="welcome-note">You can change these anytime in Your arcade profile.</p>
        </form>
        <div id="welcome-tour" hidden><div class="welcome-video-frame"><video id="welcome-video" controls muted playsinline loop preload="metadata" aria-label="Gameplay preview"></video></div><p id="welcome-game-help"></p><div id="welcome-game-dots" class="welcome-game-dots" aria-label="Choose a game introduction"></div><p id="welcome-video-error" class="welcome-note" hidden>The video couldn’t load. You can still read the controls above or skip ahead.</p></div>
        <p id="welcome-message" role="status" aria-live="polite"></p>
        <div class="welcome-footer"><button id="welcome-back" type="button">Back</button><button id="welcome-skip-tour" type="button" hidden>Skip tour & play</button><button id="welcome-next" type="button" class="welcome-primary">Let’s go!</button></div>`;
      document.body.append(dialog);
      this.$('cubie').innerHTML = CubieCustoms.svg(CubieCustoms.catalog.find(c => c.id === 'classic'));
      this.$('close').onclick = () => this.finish();
      dialog.addEventListener('cancel', e => { e.preventDefault(); if (!this.busy) this.finish(); });
      dialog.addEventListener('close', () => { window.dispatchEvent(new Event('arcade-welcome-change')); this.$('video').pause(); document.getElementById('account-open')?.focus({preventScroll:true}); });
      this.$('next').onclick = () => this.next();
      this.$('back').onclick = () => { if (this.step === 3 && this.game > 0) this.game--; else this.step--; this.render(); };
      this.$('skip-tour').onclick = () => this.finish();
      this.$('preferences').onsubmit = e => { e.preventDefault(); this.next(); };
      this.$('email-form').onsubmit = e => { e.preventDefault(); this.sendCode(true); };
      this.$('login').onclick = () => this.sendCode(false);
      this.$('resend').onclick = () => this.sendCode(this.upgrade);
      this.$('change-email').onclick = () => { this.$('code-form').hidden = true; this.$('email-form').hidden = false; this.$('email').focus(); };
      this.$('code-form').onsubmit = e => { e.preventDefault(); this.verifyCode(); };
      this.$('video').addEventListener('error', () => { this.$('video-error').hidden = false; });
      games.forEach((game, i) => {
        const button = document.createElement('button'); button.type = 'button'; button.textContent = game.title;
        button.onclick = () => { this.game = i; this.render(); }; this.$('game-dots').append(button);
      });
      const replay = document.createElement('button'); replay.id = 'account-welcome'; replay.type = 'button'; replay.textContent = 'Meet Cubie & replay the game tour';
      replay.onclick = () => { this.app.nodes.panel.close(); this.open(); };
      this.app.nodes.panel.append(replay);
    }
    open() {
      if (this.app.isPlaying() || this.dialog.open) return;
      this.step = 0; this.game = 0;
      const p = this.app.controller?.state().profile || this.app.getProfile();
      this.$('name').value = p.player === 'Player' ? '' : p.player || '';
      this.$('sound').checked = p.preferences?.soundOn !== false;
      this.$('motion').checked = !!p.preferences?.reducedMotion || matchMedia('(prefers-reduced-motion: reduce)').matches;
      this.$('sharing').checked = p.privacy?.leaderboard !== false;
      this.$('public').checked = p.privacy?.publicProfile !== false;
      this.dialog.showModal(); this.render(); window.dispatchEvent(new Event('arcade-welcome-change')); 
    }
    render() {
      this.$('video').pause(); this.$('message').textContent = '';
      ['hello','account','preferences','tour'].forEach((id, i) => { this.$(id).hidden = this.step !== i; });
      [...this.dialog.querySelectorAll('.welcome-steps li')].forEach((li,i) => { li.toggleAttribute('data-current', i === this.step); if(i === this.step) li.setAttribute('aria-current','step'); else li.removeAttribute('aria-current'); });
      this.$('progress').textContent = `STEP ${this.step+1} OF 4 · ${this.step===3 ? `GAME ${this.game+1} OF ${games.length}` : 'LET’S MAKE THIS YOUR ARCADE'}`;
      const titles = ['Hi! I’m Cubie.','Want to keep your progress?','Let’s make you comfortable.',games[this.game].title];
      const lines = ['You can call me they/them or it/its. I’m happy you’re here!','An email account is optional. I’m happy to play either way.','Choose what works for you. We can always change it later.',games[this.game].line];
      this.$('dialog-title').textContent = titles[this.step]; this.$('line').textContent = lines[this.step];
      this.$('back').hidden = this.step === 0;
      this.$('skip-tour').hidden = this.step !== 3;
      this.$('next').textContent = this.step === 0 ? 'Let’s go!' : this.step === 1 ? (this.app.signedIn ? 'Choose my preferences' : 'Continue as a guest') : this.step === 2 ? 'Save & show me the games' : this.game === games.length-1 ? 'Let’s play!' : 'Next game →';
      if (this.step === 1) {
        const configured = this.app.session?.configured;
        this.$('create').disabled = !configured || this.app.accountBound;
        this.$('login').disabled = !configured;
        this.$('cloud-note').textContent = configured ? 'I’ll send you a sign-in code. No password to remember!' : 'Email accounts aren’t connected on this preview. You can still choose your preferences and play as a guest.';
        if(this.app.signedIn) { this.$('email-form').hidden = true; this.$('code-form').hidden = true; this.$('account-success').hidden = false; }
      }
      if (this.step === 3) {
        const game = games[this.game], video = this.$('video');
        video.poster = `./accounts/tours/${game.id}.webp`; video.src = `./accounts/tours/${game.id}.webm`; video.load();
        video.setAttribute('aria-label', `${game.title} gameplay video`);
        this.$('game-help').textContent = game.help; this.$('video-error').hidden = true;
        [...this.$('game-dots').children].forEach((button,i) => button.setAttribute('aria-pressed', String(i === this.game)));
        if (!this.$('motion').checked && !matchMedia('(prefers-reduced-motion: reduce)').matches) video.play().catch(() => {});
      }
      this.$('dialog-title').focus({preventScroll:true}); this.dialog.scrollTop = 0;
    }
    async work(callback) {
      if (this.busy) return;
      this.busy = true; this.app.busy = true; this.dialog.setAttribute('aria-busy','true');
      const enabled = [...this.dialog.querySelectorAll('button,input')].filter(el => !el.disabled);
      enabled.forEach(el => { el.disabled = true; }); this.$('message').textContent = '';
      try { await this.app.ready; await this.app.settle(); await callback(); }
      catch(error) { this.$('message').textContent = error.message || 'Something didn’t save. Please try again, or continue as a guest.'; }
      finally { enabled.forEach(el => { el.disabled = false; }); this.busy = false; this.app.busy = false; this.dialog.removeAttribute('aria-busy'); this.app.render(); }
    }
    sendCode(upgrade) {
      if (!this.$('email').reportValidity()) return;
      this.work(async () => {
        this.email = this.$('email').value.trim(); this.upgrade = upgrade;
        await this.app.session.requestCode(this.email, {upgrade});
        this.$('email-form').hidden = true; this.$('code-form').hidden = false;
        this.$('message').textContent = 'Check your email! Enter the code here to finish.';
      }).then(() => { if(!this.$('code-form').hidden) this.$('code').focus(); });
    }
    verifyCode() {
      if(!this.$('code').reportValidity()) return;
      this.work(async () => {
        await this.app.session.verifyCode(this.email, this.$('code').value.trim(), {upgrade:this.upgrade});
        await this.app.controller.activate(this.app.session.snapshot().user.id, {bindGuest:this.upgrade});
        const state = this.app.controller.state();
        if(this.upgrade && state.importRequired) await this.app.controller.importProfile(state.importProfile, {baseline:true});
        this.app.applyCurrent(); this.$('code').value = ''; this.render();
      });
    }
    next() {
      if(this.busy) return;
      if(this.step === 2) return this.work(async () => {
        const desired = {player:this.$('name').value.trim() || 'Player', soundOn:this.$('sound').checked,
          reducedMotion:this.$('motion').checked, leaderboard:this.$('sharing').checked, publicProfile:this.$('public').checked};
        try { await this.app.setting(desired); }
        catch(error) {
          const p = this.app.controller?.state().profile;
          // Offline visibility sync may fail after the local preferences save.
          if(!p || p.player!==desired.player || p.preferences?.soundOn!==desired.soundOn || p.preferences?.reducedMotion!==desired.reducedMotion || p.privacy?.leaderboard!==desired.leaderboard || p.privacy?.publicProfile!==desired.publicProfile) throw error;
        }
        this.step = 3; this.game = 0; this.render();
      });
      if(this.step === 3) { if(this.game === games.length-1) return this.finish(); this.game++; }
      else this.step++;
      this.render();
    }
    finish() {
      if(this.busy) return;
      try { localStorage.setItem(key, 'complete'); } catch { /* Memory-only visit. */ }
      firstVisit = false; this.dialog.close();
    }
  }
  return {Guide, games};
})();
