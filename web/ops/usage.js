"use strict";

// Operator usage dashboard. Pure view-model and SVG builders first, DOM wiring last,
// so the chart maths is testable in Node without a browser. Data arrives as the
// document built by public.usage_report(); this file never queries the database.
// Chart marks use two validated colors on the dark surface (amber #fbbf24 and teal
// #5eead4 pass the contrast and colorblind checks as a pair) plus dash patterns,
// direct labels, and a data table, so nothing is encoded by color alone.
const UsageDashboard = (() => {
  const COLORS = Object.freeze({
    primary: "#fbbf24", secondary: "#5eead4", bar: "#c6f783",
    ink: "#f1f3e9", muted: "#a4aba7", grid: "#2a3032", panel: "#191d20", line: "#343a3c",
  });
  const TOKEN_KEY = "microgame-madness.usage-dashboard.v1.token";
  const WINDOWS = Object.freeze([7, 30, 90]);

  const escapeText = value => String(value ?? "").replace(/[&<>"']/g, character =>
    ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[character]);
  const number = value => Number(value ?? 0).toLocaleString("en-US");
  const percent = (part, whole) => Number(whole)
    ? `${Math.round((Number(part) / Number(whole)) * 100)}%` : "—";
  const shortDay = day => String(day).slice(5).replace("-", "/");

  // Even "nice" steps keep gridlines readable and the axis max above the data.
  function niceTicks(max, count = 4) {
    if (!(Number(max) > 0)) return [0, 1];
    const rough = Number(max) / count;
    const magnitude = Math.pow(10, Math.floor(Math.log10(rough)));
    const normalized = rough / magnitude;
    const step = (normalized <= 1 ? 1 : normalized <= 2 ? 2 : normalized <= 5 ? 5 : 10) * magnitude;
    const ticks = [];
    for (let value = 0; value <= Number(max) + step / 2; value += step) ticks.push(Math.round(value * 1e6) / 1e6);
    if (ticks.at(-1) < Number(max)) ticks.push(ticks.at(-1) + step);
    return ticks;
  }

  const scale = (domainMax, rangeMax) => value => domainMax
    ? (Number(value) / domainMax) * rangeMax : 0;

  function linePath(points) {
    return points.map(([x, y], index) => `${index ? "L" : "M"}${x.toFixed(2)} ${y.toFixed(2)}`).join(" ");
  }

  const MARKER_LIMIT = 45; // Beyond this, markers become noise rather than detail.

  // Label a subset of days: every step, plus the final day when it is far enough
  // from the previous label to stay legible.
  function labeledIndexes(points, target = 8) {
    const step = Math.max(1, Math.ceil(points / target));
    const indexes = [];
    for (let index = 0; index < points; index += step) indexes.push(index);
    const gap = points - 1 - indexes.at(-1);
    if (gap >= Math.ceil(step * 0.6)) indexes.push(points - 1);
    return indexes;
  }

  // Two series maximum: the amber/teal pair is the validated combination, and a
  // third hue would need more secondary encoding than the chart has room for.
  function lineChart({ days, series, width = 780, height = 300, yLabel = "", summary = "" }) {
    const margin = { top: 18, right: 152, bottom: 34, left: 52 };
    const plotWidth = width - margin.left - margin.right;
    const plotHeight = height - margin.top - margin.bottom;
    const points = days.length;
    const max = Math.max(0, ...series.flatMap(item => days.map(day => Number(day[item.key] ?? 0))));
    const ticks = niceTicks(max);
    const axisMax = ticks.at(-1);
    const y = scale(axisMax, plotHeight);
    const x = index => points > 1 ? (index / (points - 1)) * plotWidth : plotWidth / 2;
    const labeled = new Set(labeledIndexes(points));
    const marks = series.map((item, seriesIndex) => {
      const path = linePath(days.map((day, index) =>
        [margin.left + x(index), margin.top + plotHeight - y(Number(day[item.key] ?? 0))]));
      const markers = points <= MARKER_LIMIT
        ? days.map((day, index) => {
          const value = Number(day[item.key] ?? 0);
          const cx = margin.left + x(index), cy = margin.top + plotHeight - y(value);
          const shape = seriesIndex === 0
            ? `<circle cx="${cx.toFixed(2)}" cy="${cy.toFixed(2)}" r="2.6"/>`
            : `<rect x="${(cx - 2.3).toFixed(2)}" y="${(cy - 2.3).toFixed(2)}" width="4.6" height="4.6"/>`;
          return `<g class="mark" data-series="${escapeText(item.label)}" data-day="${escapeText(day.day)}" data-value="${value}">${shape}<title>${escapeText(item.label)} · ${escapeText(day.day)} · ${number(value)}</title></g>`;
        }).join("")
        : "";
      const last = Number(days.at(-1)?.[item.key] ?? 0);
      const lastY = margin.top + plotHeight - y(last);
      return `<g class="series" data-series="${escapeText(item.label)}">
        <path d="${path}" fill="none" stroke="${item.color}" stroke-width="2"
          ${item.dash ? `stroke-dasharray="${item.dash}"` : ""} stroke-linejoin="round"/>
        ${markers}
        <text class="end-label" x="${width - margin.right + 10}" y="${(lastY + 4).toFixed(2)}" fill="${item.color}">${escapeText(item.label)} · ${number(last)}</text>
      </g>`;
    }).join("");
    const grid = ticks.map(value => {
      const gy = margin.top + plotHeight - y(value);
      return `<g class="gridline"><line x1="${margin.left}" y1="${gy.toFixed(2)}" x2="${margin.left + plotWidth}" y2="${gy.toFixed(2)}"/>
        <text class="axis" x="${margin.left - 8}" y="${(gy + 4).toFixed(2)}" text-anchor="end">${number(value)}</text></g>`;
    }).join("");
    const xLabels = days.map((day, index) => labeled.has(index)
      ? `<text class="axis" x="${(margin.left + x(index)).toFixed(2)}" y="${height - margin.bottom + 18}" text-anchor="middle">${escapeText(shortDay(day.day))}</text>`
      : "").join("");
    return `<svg viewBox="0 0 ${width} ${height}" role="img" aria-label="${escapeText(summary)}" preserveAspectRatio="xMidYMid meet">
      ${grid}
      <line class="baseline" x1="${margin.left}" y1="${margin.top + plotHeight}" x2="${margin.left + plotWidth}" y2="${margin.top + plotHeight}"/>
      ${marks}${xLabels}
      <text class="axis-title" x="${margin.left}" y="12">${escapeText(yLabel)}</text>
    </svg>`;
  }

  // Part-to-whole with two parts only: signed-in versus guest browsers per day.
  // The guest segment is striped as well as colored, so the split survives
  // grayscale and colorblind viewing.
  function stackedColumns({ days, stacks, width = 780, height = 300, yLabel = "", summary = "" }) {
    const margin = { top: 18, right: 24, bottom: 34, left: 52 };
    const plotWidth = width - margin.left - margin.right;
    const plotHeight = height - margin.top - margin.bottom;
    const totals = days.map(day => stacks.reduce((sum, stack) => sum + Number(day[stack.key] ?? 0), 0));
    const ticks = niceTicks(Math.max(0, ...totals));
    const axisMax = ticks.at(-1);
    const y = scale(axisMax, plotHeight);
    const slot = days.length ? plotWidth / days.length : plotWidth;
    const barWidth = Math.max(1.5, Math.min(22, slot * 0.68));
    const labeled = new Set(labeledIndexes(days.length));
    const hatched = stacks.filter(stack => stack.hatch);
    const defs = hatched.length ? `<defs>${hatched.map(stack => `<pattern id="hatch-${escapeText(stack.hatch)}"
        width="6" height="6" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
        <rect width="6" height="6" fill="${stack.color}"/>
        <line x1="0" y1="0" x2="0" y2="6" stroke="${COLORS.panel}" stroke-width="2.6"/>
      </pattern>`).join("")}</defs>` : "";
    const columns = days.map((day, index) => {
      const centerX = margin.left + slot * index + slot / 2;
      let offset = 0;
      const parts = stacks.map(stack => {
        const value = Number(day[stack.key] ?? 0);
        const barHeight = y(value);
        offset += barHeight;
        return `<g class="mark" data-series="${escapeText(stack.label)}" data-day="${escapeText(day.day)}" data-value="${value}">
          <rect x="${(centerX - barWidth / 2).toFixed(2)}" y="${(margin.top + plotHeight - offset).toFixed(2)}"
            width="${barWidth.toFixed(2)}" height="${Math.max(0, barHeight).toFixed(2)}"
            fill="${stack.hatch ? `url(#hatch-${escapeText(stack.hatch)})` : stack.color}"/>
          <title>${escapeText(stack.label)} · ${escapeText(day.day)} · ${number(value)}</title></g>`;
      }).join("");
      const label = labeled.has(index)
        ? `<text class="axis" x="${centerX.toFixed(2)}" y="${height - margin.bottom + 18}" text-anchor="middle">${escapeText(shortDay(day.day))}</text>` : "";
      return `${parts}${label}`;
    }).join("");
    const grid = ticks.map(value => {
      const gy = margin.top + plotHeight - y(value);
      return `<g class="gridline"><line x1="${margin.left}" y1="${gy.toFixed(2)}" x2="${margin.left + plotWidth}" y2="${gy.toFixed(2)}"/>
        <text class="axis" x="${margin.left - 8}" y="${(gy + 4).toFixed(2)}" text-anchor="end">${number(value)}</text></g>`;
    }).join("");
    return `<svg viewBox="0 0 ${width} ${height}" role="img" aria-label="${escapeText(summary)}" preserveAspectRatio="xMidYMid meet">
      ${defs}${grid}
      <line class="baseline" x1="${margin.left}" y1="${margin.top + plotHeight}" x2="${margin.left + plotWidth}" y2="${margin.top + plotHeight}"/>
      ${columns}
      <text class="axis-title" x="${margin.left}" y="12">${escapeText(yLabel)}</text>
    </svg>`;
  }

  // Swatch plus label, matching the texture used in the chart it describes.
  function legend(stacks) {
    return `<ul class="legend">${stacks.map(stack => `<li>
      <span class="swatch${stack.hatch ? ` swatch-${escapeText(stack.hatch)}` : ""}"
        style="--swatch:${stack.color}"></span>${escapeText(stack.label)}</li>`).join("")}</ul>`;
  }

  // Ranked horizontal bars: the clearest form for comparing categories.
  function barChart({ rows, width = 780, color = COLORS.bar, format = number, axisMax = null,
      summary = "", xLabel = "" }) {
    if (!rows.length) return `<p class="empty">No data in this window.</p>`;
    const rowHeight = 30;
    const margin = { top: 14, right: 92, bottom: 30, left: 132 };
    const height = margin.top + margin.bottom + rows.length * rowHeight;
    const plotWidth = width - margin.left - margin.right;
    const max = axisMax ?? Math.max(0, ...rows.map(row => Number(row.value)));
    const ticks = axisMax ? niceTicks(axisMax, 4) : niceTicks(max);
    const top = ticks.at(-1) || 1;
    const x = scale(top, plotWidth);
    const grid = ticks.map(value => `<g class="gridline">
        <line x1="${(margin.left + x(value)).toFixed(2)}" y1="${margin.top}" x2="${(margin.left + x(value)).toFixed(2)}" y2="${margin.top + rows.length * rowHeight}"/>
        <text class="axis" x="${(margin.left + x(value)).toFixed(2)}" y="${height - margin.bottom + 16}" text-anchor="middle">${axisMax ? `${value}%` : number(value)}</text>
      </g>`).join("");
    const bars = rows.map((row, index) => {
      const y = margin.top + index * rowHeight + 5;
      const barHeight = rowHeight - 12;
      const width_ = Math.max(Number(row.value) > 0 ? 1.5 : 0, x(Number(row.value)));
      return `<g class="mark" data-label="${escapeText(row.label)}" data-value="${escapeText(row.value)}">
        <text class="bar-label" x="${margin.left - 10}" y="${y + barHeight - 3}" text-anchor="end">${escapeText(row.label)}</text>
        <rect x="${margin.left}" y="${y}" width="${width_.toFixed(2)}" height="${barHeight}" fill="${color}" rx="2"/>
        <text class="bar-value" x="${(margin.left + width_ + 8).toFixed(2)}" y="${y + barHeight - 3}">${escapeText(format(row.value, row))}${row.note ? ` · ${escapeText(row.note)}` : ""}</text>
        <title>${escapeText(row.label)} · ${escapeText(format(row.value, row))}${row.note ? ` · ${escapeText(row.note)}` : ""}</title>
      </g>`;
    }).join("");
    return `<svg viewBox="0 0 ${width} ${height}" role="img" aria-label="${escapeText(summary)}" preserveAspectRatio="xMidYMid meet">
      ${grid}${bars}
      <line class="baseline" x1="${margin.left}" y1="${margin.top}" x2="${margin.left}" y2="${margin.top + rows.length * rowHeight}"/>
      <text class="axis-title" x="${margin.left}" y="${height - 2}">${escapeText(xLabel)}</text>
    </svg>`;
  }

  // Headline numbers stay a compact labeled strip with their window and denominator
  // attached, not decorative cards.
  function statStrip({ report, activeDays }) {
    const totals = report.totals || {};
    const accounts = report.accounts || {};
    const windowDays = Number(report.window_days) || 1;
    const windowPlays = (report.days || []).reduce((sum, day) => sum + Number(day.plays ?? 0), 0);
    const windowFinishes = (report.days || []).reduce((sum, day) => sum + Number(day.finishes ?? 0), 0);
    const windowVisits = (report.days || []).reduce((sum, day) => sum + Number(day.visits ?? 0), 0);
    const stats = [
      { label: "Visits in window", value: number(windowVisits),
        note: `${number(Math.round(windowVisits / windowDays))}/day average · ${windowDays} days` },
      { label: "Distinct browsers, lifetime", value: number(totals.unique_browsers),
        note: `${number(totals.browsers_signed_in)} signed in at least once` },
      { label: "Active days in window", value: number(activeDays),
        note: `of ${windowDays} days · ${percent(activeDays, windowDays)} coverage` },
      { label: "Plays in window", value: number(windowPlays),
        note: `${number(windowFinishes)} finished · ${percent(windowFinishes, windowPlays)} finish rate` },
      { label: "Accounts", value: number(accounts.accounts),
        note: `${number(accounts.new_accounts)} new · ${number(accounts.signed_in_recently)} signed in during window` },
      { label: "Sign-ins in window", value: number((report.days || []).reduce((sum, day) => sum + Number(day.logins ?? 0), 0)),
        note: `${number((report.days || []).reduce((sum, day) => sum + Number(day.registers ?? 0), 0))} registrations` },
    ];
    return `<dl class="stats">${stats.map(stat => `<div class="stat">
        <dt>${escapeText(stat.label)}</dt><dd>${escapeText(stat.value)}</dd>
        <dd class="stat-note">${escapeText(stat.note)}</dd></div>`).join("")}</dl>`;
  }

  function dailyTable(days) {
    const columns = [["day", "Day (UTC)"], ["visits", "Visits"], ["players", "Players"],
      ["accounts", "Signed in"], ["guests", "Guests"], ["logins", "Logins"],
      ["registers", "Registrations"], ["plays", "Plays"], ["finishes", "Finishes"],
      ["wins", "Wins"], ["losses", "Losses"], ["exits", "Exits"], ["interrupted", "Abandoned"]];
    return `<div class="table-scroll"><table>
      <caption>Daily counters behind every chart above. Quiet days are real zeros, not gaps.</caption>
      <thead><tr>${columns.map(([key, label]) => `<th scope="col"${key === "day" ? "" : ' class="num"'}>${escapeText(label)}</th>`).join("")}</tr></thead>
      <tbody>${days.map(day => `<tr>${columns.map(([key]) => key === "day"
        ? `<th scope="row">${escapeText(day.day)}</th>`
        : `<td class="num">${number(day[key])}</td>`).join("")}</tr>`).join("")}</tbody>
    </table></div>`;
  }

  function gameTable(games) {
    return `<div class="table-scroll"><table>
      <caption>Per-game totals for the window, with denominators shown for every rate.</caption>
      <thead><tr><th scope="col">Game</th><th scope="col" class="num">Plays</th>
        <th scope="col" class="num">Days played</th><th scope="col" class="num">Finishes</th>
        <th scope="col" class="num">Finish rate</th><th scope="col" class="num">Wins</th>
        <th scope="col" class="num">Win rate</th><th scope="col" class="num">Losses</th>
        <th scope="col" class="num">Exits</th><th scope="col" class="num">Abandoned</th></tr></thead>
      <tbody>${games.map(game => `<tr><th scope="row">${escapeText(game.game)}</th>
        <td class="num">${number(game.plays)}</td><td class="num">${number(game.days_played)}</td>
        <td class="num">${number(game.finishes)}</td><td class="num">${percent(game.finishes, game.plays)}</td>
        <td class="num">${number(game.wins)}</td><td class="num">${percent(game.wins, game.finishes)}</td>
        <td class="num">${number(game.losses)}</td><td class="num">${number(game.exits)}</td>
        <td class="num">${number(game.interrupted)}</td></tr>`).join("")}</tbody>
    </table></div>`;
  }

  function accountRunTable(runs) {
    if (!runs.length) return `<p class="empty">No synced account runs in this window.</p>`;
    return `<div class="table-scroll"><table>
      <caption>Server-side truth for signed-in play. Compare against the counters above: a wide gap means beacons are being blocked or the window predates collection.</caption>
      <thead><tr><th scope="col">Day (UTC)</th><th scope="col" class="num">Signed-in players</th>
        <th scope="col" class="num">Synced runs</th><th scope="col" class="num">Wins</th></tr></thead>
      <tbody>${runs.map(run => `<tr><th scope="row">${escapeText(run.day)}</th>
        <td class="num">${number(run.players)}</td><td class="num">${number(run.runs)}</td>
        <td class="num">${number(run.wins)}</td></tr>`).join("")}</tbody>
    </table></div>`;
  }

  function views(report) {
    // The RPC returns newest-first; sort so the charts never depend on source order.
    const days = [...(report.days || [])].sort((a, b) => String(a.day).localeCompare(String(b.day)));
    const games = report.games || [];
    const playerStacks = [{ key: "accounts", label: "Signed in", color: COLORS.secondary },
      { key: "guests", label: "Guest", color: COLORS.primary, hatch: "amber" }];
    const activeDays = (report.days || []).filter(day => Number(day.visits) > 0
      || Number(day.players) > 0 || Number(day.plays) > 0).length;
    const busiest = [...(report.days || [])].sort((a, b) => Number(b.players) - Number(a.players))[0];
    const topGame = games[0];
    const trendSummary = `Daily page loads and distinct browsers over ${report.window_days} days. `
      + (busiest
        ? `Busiest day was ${busiest.day} with ${number(busiest.players)} distinct browsers and ${number(busiest.visits)} loads.`
        : "No activity recorded in this window.");
    return {
      stats: statStrip({ report, activeDays }),
      traffic: lineChart({ days, yLabel: "Count per day", summary: trendSummary,
        series: [{ key: "visits", label: "Visits", color: COLORS.primary },
          { key: "players", label: "Distinct browsers", color: COLORS.secondary, dash: "6 4" }] }),
      trafficFinding: trendSummary,
      players: stackedColumns({ days, yLabel: "Distinct browsers per day",
        summary: `Distinct browsers per day split by whether the player was signed in, over ${report.window_days} days.`,
        stacks: playerStacks }),
      playersLegend: legend(playerStacks),
      signins: lineChart({ days, yLabel: "Events per day",
        summary: `Credential sign-ins and new registrations per day over ${report.window_days} days.`,
        series: [{ key: "logins", label: "Logins", color: COLORS.primary },
          { key: "registers", label: "Registrations", color: COLORS.secondary, dash: "6 4" }] }),
      plays: barChart({ summary: `Plays per game over ${report.window_days} days, most played first.`,
        xLabel: "Plays in window", color: COLORS.bar,
        rows: games.map(game => ({ label: game.game, value: Number(game.plays),
          note: `${number(game.days_played)}d` })) }),
      winRate: barChart({ summary: `Win share of finished rounds per game over ${report.window_days} days.`,
        xLabel: "Win rate (finished rounds only)", color: COLORS.secondary, axisMax: 100,
        format: value => `${Math.round(Number(value))}%`,
        rows: [...games].filter(game => Number(game.finishes) > 0)
          .map(game => ({ label: game.game, value: Math.round((Number(game.wins) / Number(game.finishes)) * 100),
            note: `${number(game.finishes)} finishes` }))
          .sort((a, b) => b.value - a.value || a.label.localeCompare(b.label)) }),
      topGame: topGame ? `${topGame.game} leads with ${number(topGame.plays)} plays` : "No plays recorded yet",
      dailyTable: dailyTable([...(report.days || [])]),
      gameTable: gameTable(games),
      accountRunTable: accountRunTable(report.account_runs || []),
      activeDays,
    };
  }

  const api = { COLORS, TOKEN_KEY, WINDOWS, escapeText, number, percent, shortDay,
    niceTicks, scale, linePath, labeledIndexes, lineChart, stackedColumns, legend, barChart,
    statStrip, dailyTable, gameTable, accountRunTable, views };

  // ---- Browser wiring -------------------------------------------------------
  function start({ document: doc = globalThis.document, storage = globalThis.localStorage,
      fetch: transport = globalThis.fetch } = {}) {
    const $ = id => doc.getElementById(id);
    const state = { url: "", token: "", days: 30, loading: false, configLoaded: false };
    const show = (id, visible) => { const node = $(id); if (node) node.hidden = !visible; };
    const setStatus = (text, kind = "info") => {
      const node = $("status");
      if (!node) return;
      node.textContent = text;
      node.dataset.kind = kind;
    };
    const readToken = () => { try { return storage.getItem(TOKEN_KEY) || ""; } catch { return ""; } };
    const writeToken = value => {
      try { if (value) storage.setItem(TOKEN_KEY, value); else storage.removeItem(TOKEN_KEY); }
      catch { /* Without storage the token lasts for this page only. */ }
    };

    async function loadConfig() {
      if (state.configLoaded) return;
      state.configLoaded = true;
      try {
        const response = await transport("../leaderboard-config.json", { cache: "no-store" });
        const config = response.ok ? await response.json() : {};
        state.url = String(config.url || "").replace(/\/$/, "");
      } catch { state.url = ""; }
      if (!state.url) setStatus("This build is not connected to a project, so there is nothing to read.", "error");
    }

    function render(report) {
      const model = views(report);
      $("stats").innerHTML = model.stats;
      $("traffic-chart").innerHTML = model.traffic;
      $("traffic-finding").textContent = model.trafficFinding;
      $("players-chart").innerHTML = model.players;
      $("players-legend").innerHTML = model.playersLegend;
      $("signins-chart").innerHTML = model.signins;
      $("plays-chart").innerHTML = model.plays;
      $("winrate-chart").innerHTML = model.winRate;
      $("plays-finding").textContent = model.topGame;
      $("daily-table").innerHTML = model.dailyTable;
      $("game-table").innerHTML = model.gameTable;
      $("runs-table").innerHTML = model.accountRunTable;
      $("provenance").textContent = `Generated ${report.generated_at} · window ${report.window_start} to ${report.window_end} UTC · ${model.activeDays} of ${report.window_days} days with activity`;
      $("window-label").textContent = `${report.window_days} days`;
    }

    async function refresh() {
      await loadConfig();
      if (!state.url) return;
      if (!state.token) {
        show("gate", true); show("dashboard", false);
        setStatus("Enter the operator token to load the counters.");
        return;
      }
      show("gate", false); show("dashboard", true);
      if (state.loading) return;
      state.loading = true;
      setStatus("Loading counters…");
      try {
        const response = await transport(`${state.url}/functions/v1/usage?days=${state.days}`, {
          headers: { Authorization: `Bearer ${state.token}` }, signal: AbortSignal.timeout(20000),
        });
        const data = await response.json().catch(() => null);
        if (response.status === 401) {
          writeToken(""); state.token = "";
          show("gate", true); show("dashboard", false);
          setStatus("That token was rejected. Paste the current operator token.", "error");
          return;
        }
        if (!response.ok || !data || data.error)
          throw new Error(data?.error?.message || `The counters could not be read (HTTP ${response.status}).`);
        render(data);
        setStatus(`Showing ${data.window_days} days of aggregate counters.`);
      } catch (error) {
        setStatus(error.message || "The usage service is unavailable.", "error");
      } finally { state.loading = false; }
    }

    function bind() {
      const form = $("token-form");
      if (form) form.addEventListener("submit", event => {
        event.preventDefault();
        const value = String($("token-input").value || "").trim();
        if (!value) { setStatus("Enter the operator token.", "error"); return; }
        state.token = value; writeToken(value);
        $("token-input").value = "";
        refresh();
      });
      $("window-select")?.addEventListener("change", event => {
        const days = Number(event.target.value);
        state.days = WINDOWS.includes(days) ? days : 30;
        refresh();
      });
      $("refresh")?.addEventListener("click", () => refresh());
      $("forget")?.addEventListener("click", () => {
        writeToken(""); state.token = "";
        show("gate", true); show("dashboard", false);
        setStatus("Token cleared from this browser.");
      });
    }

    bind();
    state.token = readToken();
    loadConfig().then(refresh);
    return { state, refresh, render };
  }

  if (typeof globalThis.document !== "undefined" && globalThis.document.getElementById)
    globalThis.addEventListener?.("DOMContentLoaded", () => start());

  return Object.assign(api, { start });
})();
if (typeof module !== "undefined") module.exports = UsageDashboard;
globalThis.UsageDashboard = UsageDashboard;
