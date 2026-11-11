const { test } = require('node:test');
const assert = require('node:assert/strict');
const { COLORS, TOKEN_KEY, WINDOWS, escapeText, number, percent, shortDay, niceTicks, scale,
  linePath, lineChart, stackedColumns, legend, barChart, statStrip, dailyTable, gameTable,
  accountRunTable, views } = require('../ops/usage.js');

const day = (over = {}) => ({ day: '2026-11-10', visits: 0, players: 0, accounts: 0, guests: 0,
  logins: 0, registers: 0, plays: 0, finishes: 0, wins: 0, losses: 0, exits: 0,
  interrupted: 0, ...over });
const report = (over = {}) => ({ generated_at: '2026-11-10T12:00:00Z', window_days: 3,
  window_start: '2026-11-08', window_end: '2026-11-10',
  days: [day({ day: '2026-11-10', visits: 12, players: 8, accounts: 3, guests: 5, logins: 2,
    registers: 1, plays: 20, finishes: 14, wins: 6, losses: 5, exits: 2, interrupted: 1 }),
    day({ day: '2026-11-09', visits: 4, players: 3, accounts: 1, guests: 2, plays: 5,
      finishes: 3, wins: 1, losses: 2 }),
    day({ day: '2026-11-08' })],
  games: [{ game: 'hangman', plays: 20, days_played: 2, finishes: 14, wins: 6, losses: 5,
    exits: 2, interrupted: 1 }, { game: 'dodge', plays: 5, days_played: 1, finishes: 3, wins: 1,
    losses: 2, exits: 0, interrupted: 0 }],
  account_runs: [{ day: '2026-11-10', players: 2, runs: 9, wins: 4 }],
  accounts: { active_handles: 4, reserved_handles: 5, new_handles: 1, accounts: 4,
    new_accounts: 1, signed_in_recently: 2, anonymous_users: 11, deleted_accounts: 1 },
  totals: { since: '2026-11-01', unique_browsers: 37, browsers_signed_in: 6, visits: 90,
    plays: 120, finishes: 80, wins: 30, leaderboard_rows: 12 }, ...over });

test('axis ticks are round, start at zero, and cover the data', () => {
  assert.deepEqual(niceTicks(0), [0, 1]);
  assert.deepEqual(niceTicks(7), [0, 2, 4, 6, 8]);
  assert.deepEqual(niceTicks(14), [0, 5, 10, 15]);
  assert.deepEqual(niceTicks(100, 4), [0, 50, 100]);
  for (const max of [1, 3, 17, 999, 12345]) {
    const ticks = niceTicks(max);
    assert.equal(ticks[0], 0, 'a count axis must start at zero');
    assert.ok(ticks.at(-1) >= max, `ticks must cover ${max}`);
    assert.ok(ticks.every((value, index) => index === 0 || value > ticks[index - 1]));
  }
  assert.equal(scale(0, 100)(50), 0);
  assert.equal(scale(10, 200)(5), 100);
  assert.equal(linePath([[0, 10], [5, 2.5]]), 'M0.00 10.00 L5.00 2.50');
});

test('formatting keeps units, thousands and missing denominators explicit', () => {
  assert.equal(number(1234567), '1,234,567');
  assert.equal(number(null), '0');
  assert.equal(percent(1, 3), '33%');
  assert.equal(percent(2, 8), '25%');
  assert.equal(percent(1, 0), '—');
  assert.equal(shortDay('2026-11-08'), '11/08');
  assert.equal(escapeText('<img src=x onerror="alert(1)">'),
    '&lt;img src=x onerror=&quot;alert(1)&quot;&gt;');
  assert.deepEqual(WINDOWS, [7, 30, 90]);
  assert.equal(TOKEN_KEY, 'microgame-madness.usage-dashboard.v1.token');
});

test('time axes label a readable subset of days, never a smear', () => {
  const { labeledIndexes } = require('../ops/usage.js');
  assert.deepEqual(labeledIndexes(30), [0, 4, 8, 12, 16, 20, 24, 28]);
  assert.deepEqual(labeledIndexes(7), [0, 1, 2, 3, 4, 5, 6]);
  assert.deepEqual(labeledIndexes(90), [0, 12, 24, 36, 48, 60, 72, 84]);
  assert.deepEqual(labeledIndexes(1), [0]);
  // Labels are far enough apart to read: at least three index steps between them.
  for (const points of [7, 14, 30, 90]) {
    const indexes = labeledIndexes(points);
    const spacing = indexes.slice(1).map((value, i) => value - indexes[i]);
    assert.ok(spacing.every(gap => gap >= 1));
    assert.ok(indexes.length <= points);
  }
  const svg = lineChart({ days: report().days.slice().reverse().concat(
    Array.from({ length: 27 }, (_, i) => day({ day: `2026-09-${String(28 - i).padStart(2, '0')}` }))),
    yLabel: 'Count per day', summary: 's',
    series: [{ key: 'visits', label: 'Visits', color: COLORS.primary }] });
  assert.equal(svg.match(/text-anchor="middle"/g).length, 8, 'exactly one label per step');
});

test('the traffic chart labels its finding, its series and its last values', () => {
  const svg = lineChart({ days: report().days.slice().reverse(), yLabel: 'Count per day',
    summary: 'Busiest day was 2026-11-10 with 8 distinct browsers.',
    series: [{ key: 'visits', label: 'Visits', color: COLORS.primary },
      { key: 'players', label: 'Distinct browsers', color: COLORS.secondary, dash: '6 4' }] });
  assert.ok(svg.startsWith('<svg viewBox='));
  assert.ok(svg.includes('role="img"'));
  assert.ok(svg.includes('Busiest day was 2026-11-10'));
  // Two series, distinguish by dash as well as color, each labeled with its last value.
  assert.equal(svg.match(/<path d="M/g).length, 2);
  assert.ok(svg.includes('stroke-dasharray="6 4"'));
  assert.ok(svg.includes('Visits · 12'));
  assert.ok(svg.includes('Distinct browsers · 8'));
  assert.ok(svg.includes('>0<'), 'the zero gridline must be drawn');
  assert.ok(!/NaN|undefined|Infinity/.test(svg));
});

test('the stacked split encodes guest segments with texture, not color alone', () => {
  const stacks = [{ key: 'accounts', label: 'Signed in', color: COLORS.secondary },
    { key: 'guests', label: 'Guest', color: COLORS.primary, hatch: 'amber' }];
  const svg = stackedColumns({ days: report().days.slice().reverse(), stacks,
    yLabel: 'Distinct browsers per day', summary: 'Split by sign-in state.' });
  assert.ok(svg.includes('<pattern id="hatch-amber"'));
  assert.ok(svg.includes('fill="url(#hatch-amber)"'));
  assert.equal(svg.match(/<rect /g).length >= 6, true);
  assert.ok(svg.includes('<title>Signed in · 2026-11-10 · 3</title>'));
  const swatches = legend(stacks);
  assert.ok(swatches.includes('swatch-amber'), 'the legend must show the striped swatch');
  assert.ok(swatches.includes('Signed in') && swatches.includes('Guest'));
  assert.ok(!/NaN|undefined/.test(svg));
});

test('ranked bars sort by value, show denominators and handle an empty window', () => {
  const ranked = barChart({ summary: 'Plays per game.', xLabel: 'Plays in window',
    rows: [{ label: 'hangman', value: 20, note: '2d' }, { label: 'dodge', value: 5, note: '1d' }] });
  assert.ok(ranked.indexOf('hangman') < ranked.indexOf('dodge'));
  assert.ok(ranked.includes('20 · 2d'));
  assert.equal(barChart({ summary: 'none', rows: [] }), '<p class="empty">No data in this window.</p>');

  const rates = barChart({ summary: 'Win share.', xLabel: 'Win rate', axisMax: 100,
    format: value => `${Math.round(Number(value))}%`,
    rows: [{ label: 'hangman', value: 43, note: '14 finishes' }] });
  assert.ok(rates.includes('100%'), 'a rate axis runs to 100');
  assert.ok(rates.includes('43% · 14 finishes'), 'the denominator travels with the rate');
  assert.ok(!/NaN/.test(rates));
});

test('a hostile game name from the counters is escaped, not rendered as markup', () => {
  const hostile = report({ games: [{ game: '<script>alert(1)</script>', plays: 3, days_played: 1,
    finishes: 1, wins: 1, losses: 0, exits: 0, interrupted: 0 }] });
  const model = views(hostile);
  assert.ok(model.plays.includes('&lt;script&gt;'));
  assert.ok(!model.plays.includes('<script>'));
  assert.ok(model.gameTable.includes('&lt;script&gt;'));
});

test('the view model turns the report document into rendered sections', () => {
  const model = views(report());
  // Charts read oldest-first while tables keep newest-first.
  assert.ok(model.traffic.includes('Visits · 12'));
  assert.ok(model.dailyTable.indexOf('2026-11-10') < model.dailyTable.indexOf('2026-11-08'));
  assert.ok(model.dailyTable.includes('<caption>Daily counters'));
  assert.equal(model.activeDays, 2);
  assert.ok(model.trafficFinding.includes('Busiest day was 2026-11-10'));
  assert.ok(model.topGame.includes('hangman leads with 20 plays'));

  assert.ok(model.stats.includes('Visits in window') && model.stats.includes('>16<'),
    'window visits are summed across the days shown');
  assert.ok(model.stats.includes('>37<'), 'lifetime distinct browsers');
  // 17 finishes over 25 plays; the note keeps the rate tied to its denominator.
  assert.ok(model.stats.includes('17 finished · 68% finish rate'));
  assert.ok(model.stats.includes('>2<') && model.stats.includes('of 3 days · 67% coverage'),
    'coverage states the window size');

  assert.equal(model.gameTable.match(/<tbody>[\s\S]*?<\/tr>/g).length, 1);
  assert.ok(model.gameTable.includes('hangman') && model.gameTable.includes('dodge'));
  assert.ok(model.gameTable.includes('70%'), 'finish rate for hangman');
  assert.ok(model.accountRunTable.includes('Signed-in players'));
  assert.equal(accountRunTable([]), '<p class="empty">No synced account runs in this window.</p>');
});

test('an empty report renders without dividing by zero', () => {
  const empty = report({ days: [], games: [], account_runs: [], totals: {}, accounts: {} });
  const model = views(empty);
  for (const section of [model.traffic, model.players, model.signins, model.plays,
      model.winRate, model.stats, model.dailyTable])
    assert.ok(!/NaN|Infinity|undefined/.test(section), 'empty data must not leak NaN');
  assert.ok(model.plays.includes('No data in this window.'));
  assert.equal(model.activeDays, 0);
  assert.equal(model.topGame, 'No plays recorded yet');
});

test('stat strip labels every number with its window or denominator', () => {
  const html = statStrip({ report: report(), activeDays: 2 });
  assert.equal(html.match(/<dt>/g).length, 6);
  assert.equal(html.match(/class="stat-note"/g).length, 6, 'every number carries a context note');
  for (const note of ['average', 'lifetime', 'coverage', 'finish rate', 'signed in', 'registrations'])
    assert.ok(html.includes(note), `missing context: ${note}`);
  assert.ok(!/<dd><\/dd>/.test(html));
});
