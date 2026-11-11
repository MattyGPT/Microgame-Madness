const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { PGlite } = require('@electric-sql/pglite');

const account = '00000000-0000-0000-0000-000000000001';
const other = '00000000-0000-0000-0000-000000000002';
const anonymous = '00000000-0000-0000-0000-000000000003';
const today = () => new Date().toISOString().slice(0, 10);
const daysAgo = n => new Date(Date.now() - n * 86400000).toISOString().slice(0, 10);

async function seeded(t) {
  const db = new PGlite(); t.after(() => db.close());
  await db.exec(`create role anon; create role authenticated; create role service_role;
    create schema auth;
    create table auth.users(id uuid primary key, is_anonymous boolean default false,
      created_at timestamptz default now(), last_sign_in_at timestamptz, deleted_at timestamptz);
    create function auth.uid() returns uuid language sql as $$ select nullif(current_setting('request.jwt.claim.sub',true),'')::uuid $$;`);
  for (const filename of fs.readdirSync(path.resolve(__dirname, '../../supabase/migrations')).filter(f => f.endsWith('.sql')).sort())
    await db.exec(fs.readFileSync(path.resolve(__dirname, '../../supabase/migrations', filename), 'utf8'));
  await db.exec(`
    insert into auth.users(id, is_anonymous, last_sign_in_at) values
      ('${account}', false, now()), ('${other}', false, now() - interval '200 days'),
      ('${anonymous}', true, now());
    insert into accounts_private.profiles(owner, state) values
      ('${account}', '{}'), ('${other}', '{}');
    insert into accounts_private.identities(owner, handle, provider_identifier, active) values
      ('${account}', 'cubie', '${'a'.repeat(64)}@accounts.invalid', true);
    insert into accounts_private.deleted_accounts(owner) values ('${anonymous}');
    insert into accounts_private.runs(owner, run_id, mode, difficulty, outcome, score, rules_version, eligible, data) values
      ('${account}', 'run-1', 'hangman', 'easy', 'win', 7, '1', true, '{}'),
      ('${account}', 'run-2', 'hangman', 'easy', 'loss', 3, '1', true, '{}'),
      ('${other}', 'run-3', 'dodge', 'chaos', 'loss', 120, '1', true, '{}');
    insert into leaderboard_private.scores(player_id, mode, difficulty, player, score) values
      ('${anonymous}', 'hangman', 'easy', 'Guest', 5);
    insert into stats_private.daily_players(day, visitor_hash, scope, events) values
      ((now() at time zone 'utc')::date, '${'1'.repeat(64)}', 'account', 6),
      ((now() at time zone 'utc')::date, '${'2'.repeat(64)}', 'guest', 2),
      ((now() at time zone 'utc')::date - 3, '${'2'.repeat(64)}', 'guest', 1);
    insert into stats_private.daily_events(day, kind, game, difficulty, outcome, tally) values
      ((now() at time zone 'utc')::date, 'visit', '', '', '', 2),
      ((now() at time zone 'utc')::date, 'login', '', '', '', 1),
      ((now() at time zone 'utc')::date, 'register', '', '', '', 1),
      ((now() at time zone 'utc')::date, 'play', 'hangman', 'easy', '', 2),
      ((now() at time zone 'utc')::date, 'finish', 'hangman', 'easy', 'win', 1),
      ((now() at time zone 'utc')::date, 'finish', 'hangman', 'easy', 'loss', 1),
      ((now() at time zone 'utc')::date - 3, 'visit', '', '', '', 1),
      ((now() at time zone 'utc')::date - 10, 'play', 'dodge', 'chaos', '', 5),
      ((now() at time zone 'utc')::date - 10, 'visit', '', '', '', 4);`);
  const call = async (role, days) => {
    await db.exec('reset role');
    if (role) await db.exec(`set role ${role}`);
    const rows = (await db.query(`select public.usage_report(${days}) as report`)).rows;
    return typeof rows[0].report === 'string' ? JSON.parse(rows[0].report) : rows[0].report;
  };
  return { db, call };
}

test('the report document covers the window and matches the seeded counters', async t => {
  const { call } = await seeded(t);
  const report = await call('service_role', 7);
  assert.equal(report.window_days, 7);
  assert.equal(report.window_start, daysAgo(6));
  assert.equal(report.window_end, today());
  assert.match(report.generated_at, /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}Z$/);

  // Every day in the window is present, so a quiet day reads as zero, not a gap.
  assert.equal(report.days.length, 7);
  assert.deepEqual(report.days.map(day => day.day), [0, 1, 2, 3, 4, 5, 6].map(daysAgo));
  assert.deepEqual(report.days[0], { day: today(), visits: 2, players: 2, accounts: 1,
    guests: 1, logins: 1, registers: 1, plays: 2, finishes: 2, wins: 1, losses: 1,
    exits: 0, interrupted: 0 });
  assert.deepEqual(report.days[3], { day: daysAgo(3), visits: 1, players: 1, accounts: 0,
    guests: 1, logins: 0, registers: 0, plays: 0, finishes: 0, wins: 0, losses: 0,
    exits: 0, interrupted: 0 });
  assert.deepEqual(report.days[1], { day: daysAgo(1), visits: 0, players: 0, accounts: 0,
    guests: 0, logins: 0, registers: 0, plays: 0, finishes: 0, wins: 0, losses: 0,
    exits: 0, interrupted: 0 });

  assert.deepEqual(report.games, [{ game: 'hangman', plays: 2, days_played: 1, finishes: 2,
    wins: 1, losses: 1, exits: 0, interrupted: 0 }]);
  assert.deepEqual(report.account_runs[0], { day: today(), players: 2, runs: 3, wins: 1 });
  assert.deepEqual(report.accounts, { active_handles: 1, reserved_handles: 1, new_handles: 1,
    accounts: 2, new_accounts: 2, signed_in_recently: 1, anonymous_users: 1,
    deleted_accounts: 1 });
  assert.deepEqual(report.totals, { since: daysAgo(3), unique_browsers: 2,
    browsers_signed_in: 1, visits: 7, plays: 7, finishes: 2, wins: 1, leaderboard_rows: 1 });
});

test('the report leaks no identifier and stays closed to browser roles', async t => {
  const { call } = await seeded(t);
  const text = JSON.stringify(await call('service_role', 30));
  for (const forbidden of [account, other, anonymous, '1'.repeat(64), 'cubie', 'Guest',
      'visitor_hash'])
    assert.ok(!text.includes(forbidden), `report must not contain ${forbidden}`);
  for (const role of ['anon', 'authenticated'])
    await assert.rejects(call(role, 30), { code: '42501' });
  await assert.rejects(call('service_role', 0), /invalid_window/);
  await assert.rejects(call('service_role', 366), /invalid_window/);
});

test('the command line renders the same document as readable tables', async t => {
  const { call } = await seeded(t);
  const { reportBlocks, printTable, percent, integer } = await import('../../scripts/usage_report.mjs');
  const report = await call('service_role', 7);
  const blocks = reportBlocks(report);
  assert.deepEqual(blocks.map(block => block.title.slice(0, 6)),
    ['Visits', 'Games ', 'Signed', 'Accoun', 'Totals']);
  for (const block of blocks)
    assert.ok(block.rows.every(row => row.length === block.columns.length),
      `${block.title} rows must match their columns`);

  assert.deepEqual(blocks[0].rows[0], [today(), '2', '2', '1', '1', '1', '1', '2', '2', '1']);
  assert.deepEqual(blocks[1].rows[0], ['hangman', '2', '1', '2', '1', '1', '0', '0',
    '100%', '50%']);
  assert.deepEqual(blocks[3].rows[0], ['1', '1', '2', '2', '1', '1', '1']);
  assert.deepEqual(blocks[4].rows[0], [daysAgo(3), '2', '1', '7', '7', '2', '1']);

  // The window bounds the per-day and per-game blocks; lifetime totals ignore it.
  assert.deepEqual(blocks[1].rows.map(row => row[0]), ['hangman']);
  const month = reportBlocks(await call('service_role', 30));
  assert.deepEqual(month[1].rows.map(row => [row[0], row[1]]), [['dodge', '5'], ['hangman', '2']]);
  assert.equal(month[4].rows[0][3], blocks[4].rows[0][3]);

  const lines = [];
  const out = line => lines.push(line);
  printTable('Heading', ['day', 'visits'], [['2026-11-10', '12']], out);
  assert.deepEqual(lines, ['\nHeading', '  day         visits', '  ----------  ------',
    '  2026-11-10      12']);
  printTable('Empty', ['a'], [], out);
  assert.equal(lines.at(-1), '  (no rows)');
  assert.equal(percent(1, 3), '33%');
  assert.equal(percent(1, 0), '—');
  assert.equal(integer(12345), '12,345');
  assert.equal(integer(null), '0');
});

test('a project without the counters explains how to deploy them', async t => {
  const { report, USAGE_MISSING } = await import('../../scripts/usage_report.mjs');
  const silent = [];
  const out = line => silent.push(line);
  await assert.rejects(report(30, { run: async () => [{ counters: null }], out }),
    { message: USAGE_MISSING });
  await assert.rejects(report(30, { run: async () => [], out }), { message: USAGE_MISSING });
  // Once the counters exist, a real query failure is reported as-is rather than
  // disguised as a missing deployment.
  await assert.rejects(report(30, { out, run: async sql => {
    if (sql.includes('to_regclass')) return [{ counters: 'stats_private.daily_events' }];
    throw new Error('Management POST database/query returned HTTP 400.');
  } }), /HTTP 400/);
  // A bad window is rejected before any query runs.
  let queried = 0;
  for (const days of [0, 366, 1.5, Number('7 days')])
    await assert.rejects(report(days, { run: async () => { queried++; return []; }, out }),
      /--days/);
  assert.equal(queried, 0);
  assert.deepEqual(silent, []);
});
