const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { createHash } = require('node:crypto');
const { PGlite } = require('@electric-sql/pglite');

const first = 'a'.repeat(32);
const second = 'b'.repeat(32);
const hash = visitor => createHash('sha256').update(`mm-usage-v1:${visitor}`).digest('hex');

async function setup(t) {
  const db = new PGlite(); t.after(() => db.close());
  await db.exec(`create role anon; create role authenticated; create role service_role;
    create schema auth; create table auth.users(id uuid primary key);
    create function auth.uid() returns uuid language sql as $$ select nullif(current_setting('request.jwt.claim.sub',true),'')::uuid $$;`);
  for (const filename of fs.readdirSync(path.resolve(__dirname, '../../supabase/migrations')).filter(f => f.endsWith('.sql')).sort())
    await db.exec(fs.readFileSync(path.resolve(__dirname, '../../supabase/migrations', filename), 'utf8'));
  const role = async name => { await db.exec('reset role'); if (name) await db.exec(`set role ${name}`); };
  const record = async (visitor, events, scope = 'guest') => {
    await role('anon');
    return (await db.query('select public.record_usage($1,$2,$3) as accepted',
      [visitor, scope, JSON.stringify(events)])).rows[0].accepted;
  };
  const rows = async (table, order = '1,2,3') => {
    await role();
    return (await db.query(`select * from stats_private.${table} order by ${order}`)).rows;
  };
  const players = async () => (await rows('daily_players', '1,2')).map(row =>
    ({ visitor: row.visitor_hash, scope: row.scope, events: Number(row.events) }));
  const events = async () => (await rows('daily_events', '2,3,4,5')).map(row =>
    [row.kind, row.game, row.difficulty, row.outcome, Number(row.tally)]);
  return { db, role, record, players, events, rows };
}

test('usage counters accept browser writes and refuse every browser read', async t => {
  const { db, role, record } = await setup(t);
  assert.equal(await record(first, [{ kind: 'visit' }]), 1);
  for (const name of ['anon', 'authenticated']) {
    await role(name);
    for (const table of ['daily_events', 'daily_players', 'call_limits'])
      await assert.rejects(db.exec(`select * from stats_private.${table}`), { code: '42501' });
    await assert.rejects(db.query('select public.prune_usage(30)'), { code: '42501' });
  }
});

test('one browser per day aggregates counters and keeps an upgraded scope', async t => {
  const { record, players, events } = await setup(t);
  await record(first, [{ kind: 'visit' }]);
  await record(first, [{ kind: 'play', game: 'hangman', difficulty: 'easy' },
    { kind: 'finish', game: 'hangman', difficulty: 'easy', outcome: 'win' }]);
  await record(second, [{ kind: 'visit' }]);
  await record(first, [{ kind: 'login' }], 'account');
  // Signing out again must not downgrade the day's attribution.
  await record(first, [{ kind: 'finish', game: 'dodge', difficulty: 'chaos', outcome: 'loss' }]);
  assert.deepEqual(await events(), [
    ['finish', 'dodge', 'chaos', 'loss', 1],
    ['finish', 'hangman', 'easy', 'win', 1],
    ['login', '', '', '', 1],
    ['play', 'hangman', 'easy', '', 1],
    ['visit', '', '', '', 2],
  ]);
  assert.deepEqual(await players(), [
    { visitor: hash(second), scope: 'guest', events: 1 },
    { visitor: hash(first), scope: 'account', events: 5 },
  ].sort((a, b) => a.visitor.localeCompare(b.visitor)));
});

test('the stored visitor key is an opaque hash, never the reported id', async t => {
  const { record, players } = await setup(t);
  await record(first.toUpperCase(), [{ kind: 'visit' }]);
  await record(first, [{ kind: 'visit' }]);
  const stored = await players();
  assert.equal(stored.length, 1); // Case variants of one browser are one player.
  assert.equal(stored[0].visitor, hash(first));
  assert.ok(!stored[0].visitor.includes(first.slice(0, 8)));
});

test('a malformed report is rejected and leaves counters untouched', async t => {
  const { record, events, players } = await setup(t);
  await record(first, [{ kind: 'visit' }]);
  const invalid = [
    ['not-a-hex-id', [{ kind: 'visit' }], 'guest'],
    [first, [], 'guest'],
    [first, Array.from({ length: 33 }, () => ({ kind: 'visit' })), 'guest'],
    [first, [{ kind: 'purchase' }], 'guest'],
    [first, [{ kind: 'play', game: 'tetris', difficulty: 'easy' }], 'guest'],
    [first, [{ kind: 'play', game: 'hangman', difficulty: 'Hard Mode!' }], 'guest'],
    [first, [{ kind: 'finish', game: 'hangman', difficulty: 'easy', outcome: 'crash' }], 'guest'],
    [first, [{ kind: 'finish', game: 'hangman', difficulty: 'easy' }], 'guest'],
    [first, [{ kind: 'play', game: 'hangman', difficulty: 'easy', outcome: 'win' }], 'guest'],
    [first, [{ kind: 'visit', game: 'hangman' }], 'guest'],
    [first, [{ kind: 'visit', player: 'Cubie' }], 'guest'],
    [first, [{ kind: 'visit', password: 'hunter2hunter2' }], 'guest'],
    [first, 'not-an-array', 'guest'],
  ];
  for (const [visitor, payload, scope] of invalid)
    await assert.rejects(record(visitor, payload, scope), /invalid_visitor|invalid_events|invalid_event/);
  // An unrecognized scope is not an error; it is recorded as a guest.
  assert.equal(await record(first, [{ kind: 'visit' }], 'admin'), 1);
  assert.deepEqual(await events(), [['visit', '', '', '', 2]]);
  assert.deepEqual((await players()).map(row => row.scope), ['guest']);
});

test('difficulty is optional while the game and outcome are not', async t => {
  const { record, events } = await setup(t);
  assert.equal(await record(first, [{ kind: 'finish', game: 'keyboard', outcome: 'loss' }]), 1);
  assert.deepEqual(await events(), [['finish', 'keyboard', '', 'loss', 1]]);
});

test('a browser reporting far beyond a real session is throttled alone', async t => {
  const { record } = await setup(t);
  for (let index = 0; index < 12; index++) assert.equal(await record(first, [{ kind: 'visit' }]), 1);
  await assert.rejects(record(first, [{ kind: 'visit' }]), /rate_limited/);
  assert.equal(await record(second, [{ kind: 'visit' }]), 1);
});

test('every event the client can emit is accepted by the server', async t => {
  const { record } = await setup(t);
  const { KINDS, GAMES, OUTCOMES } = require('../usage.js');
  // One visitor per call: the abuse limiter is per reported browser.
  let visitor = 0;
  const id = () => (++visitor).toString(16).padStart(32, '0');
  for (const kind of KINDS.filter(value => !['play', 'finish'].includes(value)))
    assert.equal(await record(id(), [{ kind }]), 1, `kind ${kind} must be accepted`);
  for (const game of GAMES) {
    assert.equal(await record(id(), [{ kind: 'play', game }]), 1, `play ${game} must be accepted`);
    for (const outcome of OUTCOMES)
      assert.equal(await record(id(), [{ kind: 'finish', game, outcome }]), 1,
        `finish ${game}/${outcome} must be accepted`);
  }
});

test('pruning is operator-only and removes just the days past retention', async t => {
  const { db, role, record } = await setup(t);
  await record(first, [{ kind: 'visit' }]);
  await role();
  await db.exec(`insert into stats_private.daily_events(day,kind,tally) values
    ((now() at time zone 'utc')::date - 91, 'visit', 7),
    ((now() at time zone 'utc')::date - 89, 'visit', 5);
    insert into stats_private.daily_players(day,visitor_hash,events) values
    ((now() at time zone 'utc')::date - 91, '${'c'.repeat(64)}', 3);`);
  const remaining = async () => {
    await role();
    return (await db.query("select ((now() at time zone 'utc')::date - day) as days_ago, tally"
      + ' from stats_private.daily_events order by days_ago desc')).rows
      .map(row => [row.days_ago, Number(row.tally)]);
  };
  await role('service_role');
  const pruned = (await db.query('select public.prune_usage(90) as removed')).rows[0].removed;
  assert.deepEqual({ events: Number(pruned.events), players: Number(pruned.players) },
    { events: 1, players: 1 });
  await assert.rejects(db.query('select public.prune_usage(0)'), /invalid_retention/);
  await assert.rejects(db.query('select public.prune_usage(null)'), /invalid_retention/);
  // The 91-day-old counters are gone; the 89-day-old and today's rows stay.
  assert.deepEqual(await remaining(), [[89, 5], [0, 1]]);
});
