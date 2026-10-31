'use strict';

const $ = id => document.getElementById(id);
const modes = {
  hangman: {title: 'Hangman', category: '01 / WORDPLAY', art: 'A _ C', heading: 'Every letter counts.', copy: 'Find the hidden word before your guesses run out.', accent: '#c6f783', controls: 'Type a letter or use the buttons below.', difficulties: {easy: ['Easy', '10 wrong guesses. A friendly start.'], medium: ['Medium', '7 wrong guesses. A little more brainwork.'], hard: ['Hard', '5 wrong guesses. Make every one count.']}},
  keyboard: {title: 'Key Rush', category: '02 / QUICK THINKING', art: '[ A S D ]', heading: 'Ready, set, type.', copy: 'Beat the clock. Wrong keys cost half a second.', accent: '#b9a5f5', controls: 'Case matters. No Enter needed. Esc ends the challenge.', difficulties: {progressive: ['Progressive', 'Each round adds a little more speed and complexity.']}},
  dodge: {title: 'Turtle Dodge', category: '03 / SURVIVAL', art: '▟  ▚  ▙', heading: 'Stay small. Stay alive.', copy: 'Weave between falling blocks and keep your turtle safe.', accent: '#88dce7', controls: 'Arrows move · D pauses · Esc returns to the menu', difficulties: {easy: ['Easy', 'Classic falling blocks. Find your rhythm.'], normal: ['Normal', 'Faster blocks with unpredictable speeds.'], hard: ['Hard', 'Fast yellow blocks that sway side to side.'], merciless: ['Merciless', 'Deadly edges, a smaller arena, and no pausing.']}},
  boss: {title: 'Boss Crush', category: '04 / BOSS BATTLE', art: '▪ ▰ ▪', heading: 'Pick on someone bigger.', copy: 'Dodge the patterns. Hold F to fire back.', accent: '#f29d9e', controls: 'Arrows move · F shoots · D pauses · Esc exits', difficulties: {mean: ['Mean', 'Fans and aimed bursts. 3 HP.'], cruel: ['Cruel', 'Faster volleys and rotating rings. 3 HP.'], nightmare: ['Nightmare', 'Dense, fast patterns. Keep moving. 3 HP.'], impossible: ['Impossible', 'Blue: stay still. Orange: move. Green + heals. 5 HP.']}},
  pumpkin: {title: 'Pumpkin King', category: '05 / THE FINAL BOSS', art: '◈', heading: 'An audience with the king.', copy: 'Survive the awakening. Learn six attacks. Claim the crown.', accent: '#f8b36b', controls: 'Arrows move · F shoots after intro · C counters · D pauses', difficulties: {phase2: ['Impossible Phase 2', '5 HP. Blue: stay still. Orange: move. Tap C just before magenta fingers hit.']}}
};
let selected = 'hangman';
let ready = false;
let active = false;
let snapshot = null;
let handle = null;
let lastFrame = 0;
let roundSaved = false;
let currentPlayer = 'Player';
const keys = new Set();
const storageKey = 'microgame-madness.v1';
let saved = {player: 'Player', scores: {}};
let storageAvailable = true;
try {
  const value = JSON.parse(localStorage.getItem(storageKey));
  if (value && typeof value === 'object') {
    if (typeof value.player === 'string') saved.player = value.player.slice(0, 24);
    if (value.scores && typeof value.scores === 'object' && !Array.isArray(value.scores)) saved.scores = value.scores;
  }
} catch { storageAvailable = false; }
$('player').value = saved.player;
function persist() {
  try { localStorage.setItem(storageKey, JSON.stringify(saved)); }
  catch { storageAvailable = false; }
  if (!storageAvailable) $('storage-note').textContent = 'Storage is unavailable. Scores last for this visit only.';
}
function scoreKey() { return `${selected}:${$('difficulty').value}`; }
function rankings() {
  const entries = saved.scores[scoreKey()];
  if (!Array.isArray(entries)) return [];
  return entries.filter(item => item && typeof item.player === 'string' && Number.isFinite(item.score) && item.score >= 0);
}
function showScores() {
  const scores = rankings().sort((a,b) => b.score-a.score || a.player.localeCompare(b.player));
  const player = $('player').value.trim() || 'Player';
  $('best').textContent = scores.find(item => item.player === player)?.score ?? '—';
  $('scores-list').replaceChildren();
  if (!scores.length) {
    const row = document.createElement('li'); row.textContent = 'Your name could be first.'; $('scores-list').append(row);
  }
  scores.slice(0, 5).forEach((entry, index) => {
    const row = document.createElement('li');
    const name = document.createElement('span'); name.textContent = `${String(index+1).padStart(2,'0')}  ${entry.player}`;
    const score = document.createElement('strong'); score.textContent = entry.score;
    row.append(name, score); $('scores-list').append(row);
  });
}
function saveRound() {
  if (roundSaved || !snapshot) return;
  roundSaved = true;
  const list = rankings();
  const previous = list.find(entry => entry.player === currentPlayer);
  if (previous) previous.score = Math.max(previous.score, snapshot.score);
  else list.push({player: currentPlayer, score: snapshot.score});
  saved.scores[scoreKey()] = list;
  persist(); showScores();
}
function send(action, extra = {}) {
  return JSON.parse(handle(JSON.stringify({action, now: performance.now()/1000, ...extra})));
}
function clearKeys() {
  keys.clear();
  document.querySelectorAll('[data-key]').forEach(button => button.classList.remove('pressed'));
}
function setLocked(value) { $('player').disabled = value; $('difficulty').disabled = value; }
function selectGame(mode) {
  if (active && selected === 'keyboard') saveRound();
  active = false; snapshot = null; clearKeys(); selected = mode;
  const config = modes[mode];
  document.documentElement.style.setProperty('--accent', config.accent);
  document.querySelectorAll('[data-game]').forEach(button => {
    const chosen = button.dataset.game === mode;
    button.classList.toggle('selected', chosen); button.setAttribute('aria-pressed', String(chosen));
  });
  $('game-title').textContent = config.title; $('game-category').textContent = config.category;
  $('welcome-art').textContent = config.art; $('welcome-title').textContent = config.heading; $('welcome-copy').textContent = config.copy;
  $('game-instruction').textContent = config.controls;
  $('difficulty').replaceChildren(...Object.entries(config.difficulties).map(([value,[label]]) => new Option(label,value)));
  ['hangman-game','keyboard-game','game-canvas','overlay','pause','exit','touch-controls'].forEach(id => $(id).hidden = true);
  $('welcome').hidden = false; $('metric').textContent = '—'; $('score').textContent = '0';
  $('metric-label').textContent = mode === 'hangman' ? 'Guesses left' : mode === 'keyboard' ? 'Time left' : mode === 'dodge' ? 'Survived' : 'Your HP';
  setLocked(false); updateDifficulty();
}
function updateDifficulty() {
  $('difficulty-note').textContent = modes[selected].difficulties[$('difficulty').value][1]; showScores();
}
function startGame() {
  if (!ready) return;
  currentPlayer = $('player').value.trim() || 'Player'; $('player').value = currentPlayer;
  saved.player = currentPlayer; persist(); roundSaved = false; clearKeys();
  try { snapshot = send('start', {mode:selected, difficulty:$('difficulty').value}); }
  catch (error) { fail(error); return; }
  active = true; lastFrame = performance.now();
  $('welcome').hidden = true; $('overlay').hidden = true; $('exit').hidden = false;
  $('hangman-game').hidden = selected !== 'hangman'; $('keyboard-game').hidden = selected !== 'keyboard';
  const arcade = ['dodge','boss','pumpkin'].includes(selected);
  $('game-canvas').hidden = !arcade;
  $('touch-controls').hidden = !arcade || !matchMedia('(pointer: coarse)').matches;
  $('touch-fire').hidden = selected === 'dodge'; $('touch-counter').hidden = selected !== 'pumpkin';
  setLocked(true); render();
  if (selected === 'keyboard' && matchMedia('(pointer: coarse)').matches) $('typing-input').focus();
  else $('arena').focus({preventScroll:true});
}
function showOverlay(title, copy, button, kicker) {
  $('overlay-title').textContent = title; $('overlay-copy').textContent = copy;
  $('overlay-action').textContent = button; $('overlay-kicker').textContent = kicker; $('overlay').hidden = false;
}
function render() {
  const s = snapshot;
  $('score').textContent = s.score;
  $('pause').hidden = !s.can_pause || s.over;
  $('pause').textContent = s.paused ? 'Resume · D' : 'Pause · D';
  if (selected === 'hangman') {
    $('hangman-picture').textContent = s.picture; $('word').textContent = s.word;
    $('guess-feedback').textContent = s.message || `${s.remaining} wrong guesses left.`;
    $('metric').textContent = s.remaining;
    document.querySelectorAll('#alphabet button').forEach(button => button.disabled = s.over || s.guessed.includes(button.dataset.letter));
  } else if (selected === 'keyboard') {
    $('typing-level').textContent = `ROUND ${s.level}`;
    $('sequence').replaceChildren(...[...s.sequence].map((letter,index) => {
      const span = document.createElement('span'); span.textContent = letter;
      if (index < s.matched) span.className = 'matched'; else if (index === s.matched) span.className = 'next';
      return span;
    }));
    $('typing-feedback').textContent = `${s.mistakes} mistakes · ${s.score} rounds completed`;
    $('metric').textContent = `${s.remaining.toFixed(1)}s`;
    $('timer-bar').style.width = `${Math.max(0, Math.min(100, s.remaining / Math.max(4, 8-(s.level-1)*.25)*100))}%`;
  } else {
    draw(s); $('metric').textContent = selected === 'dodge' ? `${s.elapsed}s` : `${s.lives} / ${s.max_lives}`;
    $('game-instruction').textContent = s.label || modes[selected].controls;
    for (const event of s.sounds) playSound(event);
  }
  if (s.over) {
    active = false; clearKeys(); setLocked(false); saveRound(); $('pause').hidden = true;
    let title = s.won ? 'You did it!' : 'One more try?';
    let copy = `Score: ${s.score}. Your personal best is saved.`;
    if (selected === 'hangman') copy = `The word was ${s.word.replaceAll(' ', '')}. Score: ${s.score}.`;
    if (selected === 'keyboard') {title = "Time’s up!"; copy = `${s.score} rounds completed. Your fingers earned a rematch.`;}
    showOverlay(title, copy, 'Play again ↗', s.won ? 'ROUND COMPLETE' : 'GOOD GAME');
  } else if (s.paused) showOverlay('Take a breather.', 'Your game will be right here.', 'Resume game', 'PAUSED');
  else $('overlay').hidden = true;
}
const ctx = $('game-canvas').getContext('2d');
function draw(s) {
  ctx.clearRect(0,0,680,560);
  ctx.save(); ctx.translate(340,280);
  const [left,right,bottom,top] = s.bounds;
  ctx.fillStyle = '#111827'; ctx.fillRect(left,-top,right-left,top-bottom);
  ctx.save(); ctx.beginPath(); ctx.rect(left,-top,right-left,top-bottom); ctx.clip();
  for (const command of s.commands) {
    const c = command.coords;
    ctx.beginPath(); ctx.fillStyle = command.fill || 'transparent'; ctx.strokeStyle = command.outline || 'transparent'; ctx.lineWidth = command.width || 1;
    if (command.kind === 'rectangle') ctx.rect(c[0],c[1],c[2]-c[0],c[3]-c[1]);
    else if (command.kind === 'polygon') {ctx.moveTo(c[0],c[1]); for(let i=2;i<c.length;i+=2) ctx.lineTo(c[i],c[i+1]); ctx.closePath();}
    else if (command.kind === 'oval') ctx.ellipse((c[0]+c[2])/2,(c[1]+c[3])/2,Math.abs(c[2]-c[0])/2,Math.abs(c[3]-c[1])/2,0,0,Math.PI*2);
    else if (command.kind === 'text') {ctx.font = `bold ${command.font?.[1] || 18}px Arial`;ctx.textAlign='center';ctx.textBaseline='middle';ctx.fillText(command.text,c[0],c[1]);continue;}
    if (command.fill) ctx.fill(); if (command.outline) ctx.stroke();
  }
  ctx.restore();
  ctx.strokeStyle = selected === 'dodge' && s.difficulty === 'merciless' ? '#ff4565' : '#45534b';ctx.lineWidth=2;ctx.strokeRect(left,-top,right-left,top-bottom);
  if (s.hp !== null) {
    ctx.fillStyle='#344039';ctx.fillRect(-110,-264,220,6);ctx.fillStyle=modes[selected].accent;ctx.fillRect(-110,-264,220*s.hp/s.max_hp,6);
    ctx.fillStyle='#d8dfd7';ctx.font='10px monospace';ctx.textAlign='center';ctx.fillText(`BOSS ${s.hp} / ${s.max_hp}`,0,-270);
  }
  ctx.restore();
}
function guess(letter) {
  if (!active || selected !== 'hangman') return;
  snapshot = send('guess',{key:letter}); render();
}
function type(key) {
  if (!active || selected !== 'keyboard') return;
  snapshot = send('key',{key}); render();
}
function pause() {
  if (!active || !snapshot?.can_pause) return;
  clearKeys(); snapshot = send('pause'); render(); lastFrame = performance.now();
}
function exitGame() { if (selected === 'keyboard' && active) saveRound(); selectGame(selected); }
function fail(error) {
  console.error(error); active = false; ready = false; clearKeys(); setLocked(false);
  $('runtime-status').textContent = 'Unable to load games. Check your connection and reload.';
  $('start').textContent = 'Reload arcade'; $('start').disabled = false;
  $('start').onclick = () => location.reload();
  showOverlay('The arcade needs a restart.', 'Check your internet connection, then reload to try again.', 'Reload arcade', 'LOADING PROBLEM');
  $('overlay-action').onclick = () => location.reload();
}
function frame(now) {
  if (active && selected !== 'hangman') {
    try { snapshot = send('tick',{dt:(now-lastFrame)/1000,keys:[...keys]}); render(); }
    catch(error) { fail(error); }
  }
  lastFrame = now; requestAnimationFrame(frame);
}
for(const letter of 'abcdefghijklmnopqrstuvwxyz') {
  const button = document.createElement('button');button.textContent=letter.toUpperCase();button.dataset.letter=letter;
  button.setAttribute('aria-label',`Guess ${letter.toUpperCase()}`);button.onclick=()=>guess(letter);$('alphabet').append(button);
}
document.querySelectorAll('[data-game]').forEach(button => button.onclick=()=>selectGame(button.dataset.game));
$('difficulty').onchange=updateDifficulty;$('player').oninput=showScores;$('start').onclick=startGame;$('exit').onclick=exitGame;$('pause').onclick=pause;
$('overlay-action').onclick=()=>snapshot?.paused ? pause() : startGame();
const arrowMap={ArrowUp:'Up',ArrowDown:'Down',ArrowLeft:'Left',ArrowRight:'Right'};
window.addEventListener('keydown',event=>{
  const input = event.target.closest('input,select,textarea');
  if (input && event.target !== $('typing-input')) return;
  if (event.ctrlKey || event.metaKey || event.altKey) return;
  if (event.key === 'Escape') {if(active || snapshot) {event.preventDefault();exitGame();}return;}
  if (selected === 'hangman' && active && /^[a-z]$/i.test(event.key)) {event.preventDefault();guess(event.key);return;}
  if (selected === 'keyboard' && active && event.key.length === 1 && event.target !== $('typing-input')) {event.preventDefault();type(event.key);return;}
  if (['dodge','boss','pumpkin'].includes(selected)) {
    if (event.key === ' ' && !active && ready && event.target.tagName !== 'BUTTON') {event.preventDefault();startGame();return;}
    if (!active) return;
    if (event.key.toLowerCase()==='d' && !event.repeat) {event.preventDefault();pause();return;}
    const key=arrowMap[event.key] || event.key.toLowerCase();
    if (['Up','Down','Left','Right','f','c'].includes(key)) {event.preventDefault();keys.add(key);}
  }
});
window.addEventListener('keyup',event=>keys.delete(arrowMap[event.key] || event.key.toLowerCase()));
window.addEventListener('blur',()=>{clearKeys();if(active && snapshot?.can_pause && !snapshot.paused) pause();});
document.addEventListener('visibilitychange',()=>{if(document.hidden){clearKeys();if(active && snapshot?.can_pause && !snapshot.paused)pause();}});
$('typing-input').addEventListener('input',event=>{for(const char of event.target.value) type(char); event.target.value='';});
document.querySelectorAll('[data-key]').forEach(button=>{
  button.addEventListener('pointerdown',event=>{event.preventDefault();button.setPointerCapture(event.pointerId);keys.add(button.dataset.key);button.classList.add('pressed');});
  const release=()=>{keys.delete(button.dataset.key);button.classList.remove('pressed');};
  button.addEventListener('pointerup',release);button.addEventListener('pointercancel',release);button.addEventListener('lostpointercapture',release);
});
let soundOn=false;
let audioContext;
$('sound').onclick=()=>{
  soundOn=!soundOn;$('sound').textContent=soundOn?'Sound on':'Sound off';$('sound').setAttribute('aria-pressed',String(soundOn));
  if(soundOn){try{audioContext ??= new AudioContext();audioContext.resume().catch(()=>{});}catch{soundOn=false;$('sound').textContent='Sound unavailable';$('sound').setAttribute('aria-pressed','false');}}
};
function playSound(event){
  if(!soundOn || !audioContext)return;
  const oscillator=audioContext.createOscillator(),gain=audioContext.createGain(),now=audioContext.currentTime;
  oscillator.type='sawtooth';oscillator.frequency.setValueAtTime(event==='slam'?65:95,now);oscillator.frequency.exponentialRampToValueAtTime(30,now+.3);
  gain.gain.setValueAtTime(.06,now);gain.gain.exponentialRampToValueAtTime(.001,now+.35);
  oscillator.connect(gain);gain.connect(audioContext.destination);oscillator.start(now);oscillator.stop(now+.36);
}
async function initialize(){
  try{
    const pyodide=await loadPyodide({indexURL:'https://cdn.jsdelivr.net/pyodide/v0.29.3/full/'});
    const manifest=await fetch('./python-files.json');if(!manifest.ok)throw new Error('Missing Python manifest');
    const files=await manifest.json();pyodide.FS.mkdir('/game');
    await Promise.all(files.map(async name=>{const response=await fetch(`./python/${name}`);if(!response.ok)throw new Error(`Missing ${name}`);pyodide.FS.writeFile(`/game/${name}`,await response.text());}));
    pyodide.runPython("import sys\nsys.path.insert(0, '/game')\nfrom bridge import handle");
    handle=pyodide.globals.get('handle');ready=true;$('runtime-status').textContent='● All games ready';$('start').disabled=false;$('start').textContent='Let’s play ↗';
  }catch(error){fail(error);}
}
selectGame('hangman');if(!storageAvailable)$('storage-note').textContent='Storage is unavailable. Scores last for this visit only.';
requestAnimationFrame(frame);initialize();
