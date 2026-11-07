const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { PGlite } = require('@electric-sql/pglite');
const { difficulties } = require('../../leaderboards.js');

test('PostgreSQL enforces mode isolation, best scores, ownership, and public read-only rankings', async t => {
  const db = new PGlite();
  t.after(() => db.close());
  await db.exec(`
    create role anon;
    create role authenticated;
    create schema auth;
    create table auth.users(id uuid primary key);
    create function auth.uid() returns uuid language sql as $$
      select nullif(current_setting('request.jwt.claim.sub', true), '')::uuid;
    $$;
  `);
  const migrations = path.resolve(__dirname, '../../../supabase/migrations');
  for (const file of fs.readdirSync(migrations).filter(file => file.endsWith('.sql')).sort())
    await db.exec(fs.readFileSync(path.join(migrations, file), 'utf8'));
  const first = '00000000-0000-0000-0000-000000000001';
  const second = '00000000-0000-0000-0000-000000000002';
  await db.query('insert into auth.users values ($1), ($2)', [first, second]);
  async function as(role, identity = '') {
    await db.exec('reset role');
    await db.query("select set_config('request.jwt.claim.sub', $1, false)", [identity]);
    await db.exec(`set role ${role}`);
  }
  const submit = (mode, difficulty, player, score) => db.query('select public.submit_leaderboard_score($1, $2, $3, $4) as best', [mode, difficulty, player, score]);
  const list = (mode, difficulty) => db.query('select * from public.get_leaderboard($1, $2)', [mode, difficulty]);
  await as('authenticated', first);
  for (const [mode, values] of Object.entries(difficulties)) for (const difficulty of values) {
    assert.equal((await submit(mode, difficulty, 'Cubie', 1)).rows[0].best, 1);
    assert.equal((await list(mode, difficulty)).rows.length, 1);
  }
  assert.equal((await submit('hangman', 'easy', '  Cubie  ', 7)).rows[0].best, 7);
  assert.equal((await submit('hangman', 'easy', 'Renamed', 3)).rows[0].best, 7);
  assert.equal((await list('hangman', 'hard')).rows[0].score, 1);
  await as('authenticated', second);
  await submit('hangman', 'easy', 'Renamed', 9); // Nicknames do not identify owners.
  const own = (await list('hangman', 'easy')).rows;
  assert.deepEqual(own.map(row => [row.player, row.score, row.is_you]), [['Renamed', 9, true], ['Renamed', 7, false]]);
  assert.deepEqual(Object.keys(own[0]).sort(), ['is_you', 'player', 'rank', 'score']);
  await assert.rejects(db.exec('update leaderboard_private.scores set score = 999'), { code: '42501' });
  for (const values of [['hangman', 'hard', 'Cubie', 6], ['hangman', 'easy', '', 1],
    ['hangman', 'easy', 'Bad\nname', 1], ['boss', 'mean', 'Cubie', -1], ['boss', 'unknown', 'Cubie', 1],
    ['unknown', 'easy', 'Cubie', 1], [null, null, 'Cubie', 1], ['boss', 'mean', null, 1], ['boss', 'mean', 'Cubie', null]])
    await assert.rejects(submit(...values), { code: '22023' });
  await assert.rejects(list('boss', 'unknown'), { code: '22023' });
  await as('authenticated');
  await assert.rejects(submit('boss', 'mean', 'Cubie', 1), { code: '42501' });
  await as('anon');
  const publicRows = (await list('hangman', 'easy')).rows;
  assert.deepEqual(publicRows.map(row => [Number(row.rank), row.score, row.is_you]), [[1, 9, false], [2, 7, false]]);
  await assert.rejects(submit('hangman', 'easy', 'Impostor', 10), { code: '42501' });
  await assert.rejects(db.exec('select * from leaderboard_private.scores'), { code: '42501' });
  await as('postgres');
  for (let i = 3; i < 15; i++) {
    const id = `00000000-0000-0000-0000-${String(i).padStart(12, '0')}`;
    await db.query('insert into auth.users values ($1)', [id]);
    await as('authenticated', id);
    await submit('dodge', 'merciless', `Player ${i}`, i * 100);
    await as('postgres');
  }
  await as('anon');
  const top = (await list('dodge', 'merciless')).rows;
  assert.equal(top.length, 10);
  assert.deepEqual(top.map(row => row.score), [1400, 1300, 1200, 1100, 1000, 900, 800, 700, 600, 500]);
  assert.equal((await list('dodge', 'easy')).rows.length, 1);
});
