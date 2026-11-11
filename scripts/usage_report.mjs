// Read-only usage report for the operator. Aggregates only; never prints
// provider responses, identifiers, or secrets. Requires .env.supabase.
// The numbers come from public.usage_report(), the same document the operator
// dashboard renders, so the two readers cannot disagree.
import { pathToFileURL } from 'node:url';
import { query } from './hosted_accounts_admin.mjs';

export const USAGE_MISSING = 'Usage counters are not deployed yet. Run: npm run accounts:migrate';
export const percent = (part, whole) => Number(whole)
  ? `${Math.round((Number(part) / Number(whole)) * 100)}%` : '—';
export const integer = value => Number(value ?? 0).toLocaleString('en-US');

export function printTable(title, columns, rows, out = console.log) {
  const cells = rows.map(row => columns.map((_, index) => String(row[index] ?? '')));
  const widths = columns.map((name, index) =>
    Math.max(name.length, ...cells.map(row => row[index].length)));
  const line = values => values.map((value, index) =>
    (index === 0 ? value : value.padStart(widths[index])).padEnd(widths[index])).join('  ').trimEnd();
  out(`\n${title}`);
  if (!rows.length) return out('  (no rows)');
  out(`  ${line(columns)}`);
  out(`  ${widths.map(width => '-'.repeat(width)).join('  ')}`);
  for (const row of cells) out(`  ${line(row)}`);
}

// Every block is a title, its columns, and how to read them out of the document.
export function reportBlocks(document) {
  const days = document.days || [];
  const games = document.games || [];
  const runs = document.account_runs || [];
  const accounts = document.accounts || {};
  const totals = document.totals || {};
  return [
    { title: `Visits and players per day, UTC (last ${document.window_days} days)`,
      columns: ['day', 'visits', 'players', 'accounts', 'guests', 'logins', 'registers',
        'plays', 'finishes', 'wins'],
      rows: days.map(day => [day.day, integer(day.visits), integer(day.players),
        integer(day.accounts), integer(day.guests), integer(day.logins), integer(day.registers),
        integer(day.plays), integer(day.finishes), integer(day.wins)]) },
    { title: `Games (last ${document.window_days} days)`,
      columns: ['game', 'plays', 'days_played', 'finishes', 'wins', 'losses', 'exits',
        'interrupted', 'finish_rate', 'win_rate'],
      rows: games.map(game => [game.game, integer(game.plays), integer(game.days_played),
        integer(game.finishes), integer(game.wins), integer(game.losses), integer(game.exits),
        integer(game.interrupted), percent(game.finishes, game.plays),
        percent(game.wins, game.finishes)]) },
    { title: `Signed-in players with synced runs, authoritative (last ${document.window_days} days)`,
      columns: ['day', 'players', 'runs', 'wins'],
      rows: runs.map(run => [run.day, integer(run.players), integer(run.runs), integer(run.wins)]) },
    { title: 'Accounts',
      columns: ['active_handles', 'new_handles', 'accounts', 'new_accounts',
        'signed_in_recently', 'anonymous_users', 'deleted_accounts'],
      rows: [[integer(accounts.active_handles), integer(accounts.new_handles),
        integer(accounts.accounts), integer(accounts.new_accounts),
        integer(accounts.signed_in_recently), integer(accounts.anonymous_users),
        integer(accounts.deleted_accounts)]] },
    { title: 'Totals since collection began',
      columns: ['since', 'unique_browsers', 'browsers_signed_in', 'visits', 'plays',
        'finishes', 'leaderboard_rows'],
      rows: [[totals.since || '—', integer(totals.unique_browsers),
        integer(totals.browsers_signed_in), integer(totals.visits), integer(totals.plays),
        integer(totals.finishes), integer(totals.leaderboard_rows)]] },
  ];
}

export async function fetchReport(days = 30, run = query) {
  if (!Number.isSafeInteger(days) || days < 1 || days > 365)
    throw new Error('Use --days with a whole number of days between 1 and 365.');
  // The Management API reports a bare HTTP 400 without the Postgres error text, so
  // probe for the schema instead of guessing from a failure message.
  const [probe] = await run("select to_regclass('stats_private.daily_events') as counters");
  if (!probe?.counters) throw new Error(USAGE_MISSING);
  const [row] = await run(`select public.usage_report(${days}) as report`);
  const document = typeof row?.report === 'string' ? JSON.parse(row.report) : row?.report;
  if (!document || typeof document !== 'object') throw new Error('The usage report came back empty.');
  return document;
}

export async function report(days = 30, { run = query, json = false, out = console.log } = {}) {
  const document = await fetchReport(days, run);
  if (json) { out(JSON.stringify(document, null, 2)); return document; }
  for (const block of reportBlocks(document))
    printTable(block.title, block.columns, block.rows, out);
  const totals = document.totals || {};
  out(`\nUnique browsers since ${totals.since || '—'}: ${integer(totals.unique_browsers)} `
    + `(${integer(totals.browsers_signed_in)} signed in at least once). `
    + 'Aggregates only — see docs/usage-analytics.md.');
  out(`Generated ${document.generated_at} for ${document.window_start} to ${document.window_end} UTC.`);
  return document;
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const args = process.argv.slice(2);
  const daysIndex = args.indexOf('--days');
  try {
    await report(daysIndex === -1 ? 30 : Number(args[daysIndex + 1]),
      { json: args.includes('--json') });
  } catch (error) { console.error(error.message); process.exitCode = 1; }
}
