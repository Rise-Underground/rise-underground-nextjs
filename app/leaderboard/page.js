'use client';

import { useEffect, useRef } from 'react';

// ------------------------------------------------------------------
// Ported near-verbatim from the original leaderboard.html <script>
// block. Only functional change vs. the original: the two CSV fetches
// are now absolute paths ('/ir_leaderboard_...csv') instead of relative
// ones, because this page now lives at /leaderboard/ instead of the
// site root.
// ------------------------------------------------------------------

function buildStandings(placements) {
  const byPlayer = new Map();
  for (const p of placements) {
    if (!byPlayer.has(p.player)) byPlayer.set(p.player, { name: p.player, points: 0, placements: [] });
    const entry = byPlayer.get(p.player);
    entry.points += p.points;
    entry.placements.push({ board: p.board, rank: p.rank });
  }
  const standings = Array.from(byPlayer.values());
  standings.forEach(s => s.placements.sort((a, b) => a.rank - b.rank));
  standings.sort((a, b) => b.points - a.points);
  return standings; // full field, not just top 10 — callers slice as needed
}

// ------------------------------------------------------------------
// Competition window + countdown clock.
//
// TEST_MODE hardcodes the window to Sun Aug 16 - Sat Aug 22 for testing.
// Currently OFF -- using the real "2nd Sunday of month" rule below.
//
// Clock visibility:
//   - more than 7 days before start: hidden
//   - 7 days before start, up to start: VISIBLE, counting down to start
//   - during the competition (start -> end): hidden
//   - after the competition ends: hidden, until the next 7-day-before
//     window opens
// ------------------------------------------------------------------
const TEST_MODE = false;
const TEST_WINDOW_START = new Date(Date.UTC(2026, 7, 16, 0, 0, 0, 0));   // Aug is month index 7
const TEST_WINDOW_END = new Date(Date.UTC(2026, 7, 22, 23, 59, 59, 999));

function getSecondSundayWindow(year, monthIndex) {
  const firstOfMonth = new Date(Date.UTC(year, monthIndex, 1));
  const daysToFirstSunday = (7 - firstOfMonth.getUTCDay()) % 7;
  const firstSunday = new Date(Date.UTC(year, monthIndex, 1 + daysToFirstSunday));
  const start = new Date(firstSunday);
  start.setUTCDate(firstSunday.getUTCDate() + 7);
  start.setUTCHours(0, 0, 0, 0);
  const end = new Date(start);
  end.setUTCDate(start.getUTCDate() + 6);
  end.setUTCHours(23, 59, 59, 999);
  return { start, end };
}

function computeCompetitionWindow(now) {
  if (TEST_MODE) return { start: TEST_WINDOW_START, end: TEST_WINDOW_END };
  let { start, end } = getSecondSundayWindow(now.getUTCFullYear(), now.getUTCMonth());
  if (now > end) {
    let nextMonth = now.getUTCMonth() + 1, nextYear = now.getUTCFullYear();
    if (nextMonth > 11) { nextMonth = 0; nextYear += 1; }
    ({ start, end } = getSecondSundayWindow(nextYear, nextMonth));
  }
  return { start, end };
}

function tickCountdown() {
  const strip = document.getElementById('countdownStrip');
  const labelEl = document.getElementById('countdownLabel');
  const clockEl = document.getElementById('countdownClock');
  const now = new Date();
  const { start, end } = computeCompetitionWindow(now);
  const oneWeekBefore = new Date(start.getTime() - 7 * 24 * 60 * 60 * 1000);

  let target = null;
  let label = '';

  if (now >= oneWeekBefore && now < start) {
    target = start;
    label = 'COMPETITION STARTS IN';
  } else if (now >= start && now <= end) {
    target = end;
    label = 'COMPETITION ENDS IN';
  }

  if (!target) {
    strip.style.display = 'none';
    return;
  }
  strip.style.display = '';
  labelEl.textContent = label;

  const diffMs = target - now;
  const totalSeconds = Math.max(0, Math.floor(diffMs / 1000));
  const days = Math.floor(totalSeconds / 86400);
  const hours = Math.floor((totalSeconds % 86400) / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  const pad = (n) => String(n).padStart(2, '0');

  clockEl.innerHTML =
    `${days}<span class="unit-label">D</span>` +
    `${pad(hours)}<span class="unit-label">H</span>` +
    `${pad(minutes)}<span class="unit-label">M</span>` +
    `${pad(seconds)}<span class="unit-label">S</span>`;
}

// ------------------------------------------------------------------
// "Competition ended" banner.
//
// Shows from the moment the competition ends until the next "starts in"
// countdown takes over (7 days before the next window) -- so there's
// never a gap or overlap between the two states.
//
// TEST_MODE has a fixed one-off window with no "next" cycle, so the
// banner just stays up once TEST_WINDOW_END passes.
// ------------------------------------------------------------------
function tickEndedBanner() {
  const banner = document.getElementById('endedBanner');
  const now = new Date();

  if (TEST_MODE) {
    banner.style.display = (now > TEST_WINDOW_END) ? '' : 'none';
    return;
  }

  const currentWindow = getSecondSundayWindow(now.getUTCFullYear(), now.getUTCMonth());
  if (now <= currentWindow.end) {
    banner.style.display = 'none';
    return;
  }

  const { start: nextStart } = computeCompetitionWindow(now); // auto-rolls to next window once past end
  const oneWeekBeforeNext = new Date(nextStart.getTime() - 7 * 24 * 60 * 60 * 1000);
  banner.style.display = (now < oneWeekBeforeNext) ? '' : 'none';
}

// ------------------------------------------------------------------
// Build a small SVG rank gauge. rank 1 = near-full arc, rank 10 = sliver.
// ------------------------------------------------------------------
function gaugeSVG(rank) {
  const size = 76, stroke = 7, r = (size - stroke) / 2;
  const circumference = 2 * Math.PI * r;
  const pct = (11 - rank) / 10;
  const offset = circumference * (1 - pct);
  const color = rank <= 3 ? 'var(--crimson)' : 'var(--gold)';
  return `
    <svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">
      <circle cx="${size / 2}" cy="${size / 2}" r="${r}" fill="none" stroke="#2a2e34" stroke-width="${stroke}"/>
      <circle cx="${size / 2}" cy="${size / 2}" r="${r}" fill="none" stroke="${color}" stroke-width="${stroke}"
        stroke-linecap="round" stroke-dasharray="${circumference}" stroke-dashoffset="${offset}"
        transform="rotate(-90 ${size / 2} ${size / 2})"/>
      <text x="50%" y="52%" text-anchor="middle" dominant-baseline="middle" class="rank-num">#${rank}</text>
    </svg>`;
}

// ------------------------------------------------------------------
// Deep link out to the matching leaderboard tab on infinityrising.com,
// scoped to the Weekly timeframe. Confirmed real URL pattern (tested
// on Aero Trails: infinityrising.com/leaderboards/aero-trails?timeframe=Weekly).
// Address bar doesn't change per Course/Track/Vehicle filter — those
// are client-side only — so this links to the right CATEGORY page at
// the Weekly view, not the exact filtered board. Good enough to get
// someone to the right tab already set to Weekly; they still pick the
// specific course/track/vehicle filter themselves.
// ------------------------------------------------------------------
function boardUrl(boardName) {
  if (boardName.startsWith('Aero Trails')) {
    return 'https://infinityrising.com/leaderboards/aero-trails?timeframe=Weekly';
  }
  if (boardName.startsWith('Calido')) {
    return 'https://infinityrising.com/leaderboards/calido-valley-raceway?timeframe=Weekly';
  }
  if (boardName === 'Holocache') {
    return 'https://infinityrising.com/leaderboards/holocache?timeframe=Weekly';
  }
  return null; // unrecognized board name — no link rather than a guess
}

function escapeHtml(str) {
  return String(str).replace(/[&<>"']/g, c => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
  }[c]));
}

// ------------------------------------------------------------------
// CSV parsing for the long-format placements file:
// player,board,rank,points (one row per placement; a player can have
// several rows)
// ------------------------------------------------------------------
function parseCSV(text) {
  const rows = [];
  let row = [], field = '', inQuotes = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i], next = text[i + 1];
    if (inQuotes) {
      if (c === '"' && next === '"') { field += '"'; i++; }
      else if (c === '"') { inQuotes = false; }
      else { field += c; }
    } else {
      if (c === '"') { inQuotes = true; }
      else if (c === ',') { row.push(field); field = ''; }
      else if (c === '\n' || c === '\r') {
        if (field !== '' || row.length) { row.push(field); rows.push(row); }
        field = ''; row = [];
        if (c === '\r' && next === '\n') i++;
      } else { field += c; }
    }
  }
  if (field !== '' || row.length) { row.push(field); rows.push(row); }
  return rows.filter(r => r.length && r.some(v => v !== ''));
}

function csvToPlacements(text) {
  const rows = parseCSV(text);
  const header = rows[0].map(h => h.trim());
  const idx = (name) => header.findIndex(h => h.toLowerCase() === name.toLowerCase());

  const iPlayer = idx('player');
  const iBoard = idx('board');
  const iRank = idx('rank');
  const iPoints = idx('points');
  const iRawTime = idx('raw_time');

  return rows.slice(1).map(r => ({
    player: r[iPlayer],
    board: r[iBoard],
    rank: parseInt(r[iRank], 10),
    points: parseInt(r[iPoints], 10) || 0,
    rawTime: iRawTime >= 0 && r[iRawTime] !== '' ? parseFloat(r[iRawTime]) : null,
  }));
}

function csvToBoards(text) {
  const rows = parseCSV(text);
  const header = rows[0].map(h => h.trim());
  const idx = (name) => header.findIndex(h => h.toLowerCase() === name.toLowerCase());
  const iBoard = idx('board');
  const iCount = idx('placements_count');
  return rows.slice(1).map(r => ({
    board: r[iBoard],
    count: parseInt(r[iCount], 10) || 0,
  }));
}

// ------------------------------------------------------------------
// "Last updated" clock -- shows how long it's been since the placements
// CSV file itself was actually modified (its real Last-Modified HTTP
// header, not just when this page happened to fetch it). Same
// active-competition-only gating as the opportunities box.
// ------------------------------------------------------------------
let placementsLastModified = null;

function formatElapsed(ms) {
  const totalSeconds = Math.floor(ms / 1000);
  const days = Math.floor(totalSeconds / 86400);
  const hours = Math.floor((totalSeconds % 86400) / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  if (days > 0) return `${days}d ${hours}h ${minutes}m`;
  if (hours > 0) return `${hours}h ${minutes}m ${seconds}s`;
  if (minutes > 0) return `${minutes}m ${seconds}s`;
  return `${seconds}s`;
}

function renderLastUpdatedClock() {
  const box = document.getElementById('lastUpdatedBox');

  const now = new Date();
  const { start, end } = computeCompetitionWindow(now);
  const isActive = TEST_MODE ? (now >= TEST_WINDOW_START && now <= TEST_WINDOW_END) : (now >= start && now <= end);

  if (!isActive || !placementsLastModified) {
    box.style.display = 'none';
    return;
  }
  box.style.display = '';

  const elapsedMs = now - placementsLastModified;
  document.getElementById('lastUpdatedElapsed').textContent = formatElapsed(elapsedMs);
  document.getElementById('lastUpdatedCaption').textContent =
    'as of ' + placementsLastModified.toUTCString().replace(' GMT', ' UTC');
}

// ------------------------------------------------------------------
// "Best places to score" opportunities box.
//
// Priority cascade (evaluated globally across ALL boards):
//   1. Any board with 0 placements -> those are the best opportunities
//      (open boards, nobody's claimed them yet).
//   2. Else (every board has at least 1 placement) -> the boards with
//      the FEWEST placements (easiest to crack the top 10).
//   3. Else (every board already has a full 10) -> the boards with the
//      LARGEST % time gap between 1st and 10th place (a weak 10th
//      place time means it's easy to leapfrog in).
// ------------------------------------------------------------------
function computeOpportunities(placements, boards) {
  // Board list: prefer the full catalog from boards.csv (includes
  // 0-placement boards); fall back to deriving from placements alone
  // if boards.csv didn't load.
  let boardCounts;
  if (boards) {
    boardCounts = boards.map(b => ({ board: b.board, count: b.count }));
  } else {
    const counts = {};
    placements.forEach(p => { counts[p.board] = (counts[p.board] || 0) + 0; });
    // still need counts — derive from distinct ranks per board
    const rankSets = {};
    placements.forEach(p => {
      if (!rankSets[p.board]) rankSets[p.board] = new Set();
      rankSets[p.board].add(p.rank);
    });
    boardCounts = Object.keys(rankSets).map(board => ({ board, count: rankSets[board].size }));
  }

  if (boardCounts.length === 0) return { tier: null, items: [] };

  const zeroBoards = boardCounts.filter(b => b.count === 0);
  if (zeroBoards.length > 0) {
    return {
      tier: 'open',
      items: zeroBoards.slice(0, 5).map(b => ({ board: b.board, detail: 'Open — be first!' })),
    };
  }

  const allFull = boardCounts.every(b => b.count >= 10);
  if (!allFull) {
    const sorted = [...boardCounts].sort((a, b) => a.count - b.count);
    return {
      tier: 'fewest',
      items: sorted.slice(0, 5).map(b => ({ board: b.board, detail: `${b.count} racer${b.count === 1 ? '' : 's'}` })),
    };
  }

  // All boards full — rank by % gap between 1st and 10th place time.
  const byBoard = {};
  placements.forEach(p => {
    if (!byBoard[p.board]) byBoard[p.board] = {};
    if (p.rank === 1 || p.rank === 10) byBoard[p.board][p.rank] = p.rawTime;
  });

  const gaps = [];
  Object.keys(byBoard).forEach(board => {
    const t1 = byBoard[board][1];
    const t10 = byBoard[board][10];
    if (t1 != null && t10 != null && t1 > 0) {
      const gapPct = ((t10 - t1) / t1) * 100;
      gaps.push({ board, gapPct });
    }
  });
  gaps.sort((a, b) => b.gapPct - a.gapPct);
  return {
    tier: 'gap',
    items: gaps.slice(0, 5).map(g => ({ board: g.board, detail: `${g.gapPct.toFixed(1)}% gap` })),
  };
}

function renderOpportunities(placements, boards) {
  const box = document.getElementById('opportunitiesBox');
  const list = document.getElementById('opportunitiesList');

  // Only show during an ACTIVE competition (start <= now <= end) -- not
  // before it starts, and not after it ends.
  const now = new Date();
  const { start, end } = computeCompetitionWindow(now);
  const isActive = TEST_MODE ? (now >= TEST_WINDOW_START && now <= TEST_WINDOW_END) : (now >= start && now <= end);
  if (!isActive) {
    box.style.display = 'none';
    return;
  }

  const { tier, items } = computeOpportunities(placements, boards);

  if (!items.length) {
    box.style.display = 'none';
    return;
  }
  box.style.display = '';

  const tierLabels = {
    open: 'Wide open boards',
    fewest: 'Fewest racers',
    gap: 'Easiest to crack top 10',
  };
  document.getElementById('opportunitiesSubhead').textContent = tierLabels[tier] || '';

  list.innerHTML = items.map((item, i) => `
    <div class="opp-row">
      <div class="opp-rank">${i + 1}</div>
      <div class="opp-board">${item.board}</div>
      <div class="opp-detail">${item.detail}</div>
    </div>
  `).join('');
}

function renderEmptyState(list, message) {
  list.innerHTML = `
    <div style="padding: 48px 24px; text-align:center; color: var(--steel); font-family:'JetBrains Mono', monospace; font-size:13px;">
      ${message}
    </div>`;
}

function initLeaderboard() {
  // ------------------------------------------------------------------
  // Header label: current month
  // ------------------------------------------------------------------
  (function setLabels() {
    const now = new Date();
    const monthFmt = new Intl.DateTimeFormat('en-US', { month: 'long', year: 'numeric', timeZone: 'UTC' });
    document.getElementById('seasonTag').textContent = monthFmt.format(now).toUpperCase();
  })();

  tickCountdown();
  setInterval(tickCountdown, 1000);

  tickEndedBanner();
  setInterval(tickEndedBanner, 1000);

  const list = document.getElementById('standings');
  const drawer = document.getElementById('boardDrawer');
  const drawerBackdrop = document.getElementById('drawerBackdrop');
  const drawerRank = document.getElementById('drawerRank');
  const drawerName = document.getElementById('drawerName');
  const drawerPoints = document.getElementById('drawerPoints');
  const drawerSubhead = document.getElementById('drawerSubhead');
  const drawerGauges = document.getElementById('drawerGauges');

  function openDrawer(racer, rank, rowEl) {
    document.querySelectorAll('.row.open').forEach(r => { r.classList.remove('open'); r.setAttribute('aria-expanded', 'false'); });
    rowEl.classList.add('open');
    rowEl.setAttribute('aria-expanded', 'true');

    drawerRank.textContent = `RANK #${rank}`;
    drawerName.textContent = racer.name;
    drawerPoints.textContent = `${racer.points} PTS TOTAL`;
    const n = racer.placements.length;
    drawerSubhead.textContent = `${n} board${n === 1 ? '' : 's'}`;
    drawerGauges.innerHTML = racer.placements.map(p => {
      const href = boardUrl(p.board);
      const tag = href ? 'a' : 'div';
      const linkAttrs = href ? `href="${href}" target="_blank" rel="noopener noreferrer" aria-label="Open ${p.board} leaderboard"` : '';
      return `<${tag} class="gauge" ${linkAttrs}>${gaugeSVG(p.rank)}<div class="board-name">${p.board}</div></${tag}>`;
    }).join('');

    drawer.classList.add('open');
    drawer.setAttribute('aria-hidden', 'false');
    drawerBackdrop.classList.add('open');
  }

  function closeDrawer() {
    drawer.classList.remove('open');
    drawer.setAttribute('aria-hidden', 'true');
    drawerBackdrop.classList.remove('open');
    document.querySelectorAll('.row.open').forEach(r => { r.classList.remove('open'); r.setAttribute('aria-expanded', 'false'); });
  }

  document.getElementById('drawerClose').addEventListener('click', closeDrawer);
  drawerBackdrop.addEventListener('click', closeDrawer);
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape') closeDrawer(); });

  function renderStandings(standings) {
    list.innerHTML = '';
    standings.forEach((racer, i) => {
      const rank = i + 1;
      const row = document.createElement('div');
      row.className = `row n${rank <= 3 ? rank : ''}`;
      row.setAttribute('role', 'listitem');
      const n = racer.placements.length;
      row.innerHTML = `
        <div class="rank">${String(rank).padStart(2, '0')}</div>
        <div class="who">
          <div class="name name-trigger" tabindex="0" role="button">${racer.name}</div>
          <div class="sub">Placed on ${n} board${n === 1 ? '' : 's'}</div>
        </div>
        <div class="points"><div class="num">${racer.points}</div><div class="lbl">PTS</div></div>
        <svg class="chev" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
          <path d="M6 9l6 6 6-6"/>
        </svg>
      `;

      const nameEl = row.querySelector('.name-trigger');
      nameEl.addEventListener('click', (e) => { e.stopPropagation(); openDrawer(racer, rank, row); });
      nameEl.addEventListener('keydown', (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); openDrawer(racer, rank, row); } });

      list.appendChild(row);
    });
  }

  let fullStandings = []; // every player, sorted by points — not just the visible top 10

  const searchInput = document.getElementById('playerSearch');
  const searchResults = document.getElementById('searchResults');

  function renderSearchResults(query) {
    const q = query.trim().toLowerCase();
    if (!q) {
      searchResults.classList.remove('open');
      searchResults.innerHTML = '';
      return;
    }

    const matches = fullStandings
      .map((s, i) => ({ ...s, rank: i + 1 }))
      .filter(s => s.name.toLowerCase().includes(q))
      .slice(0, 8);

    if (!matches.length) {
      searchResults.innerHTML = `<div class="search-empty">No racer matches "${escapeHtml(query)}"</div>`;
      searchResults.classList.add('open');
      return;
    }

    searchResults.innerHTML = matches.map(m => `
      <div class="search-row">
        <span class="search-rank">#${m.rank}</span>
        <span class="search-name">${escapeHtml(m.name)}</span>
        <span class="search-pts">${m.points} PTS</span>
      </div>
    `).join('');
    searchResults.classList.add('open');
  }

  searchInput.addEventListener('input', (e) => renderSearchResults(e.target.value));
  searchInput.addEventListener('focus', (e) => { if (e.target.value) renderSearchResults(e.target.value); });
  document.addEventListener('click', (e) => {
    if (!e.target.closest('.search-wrap')) searchResults.classList.remove('open');
  });

  renderEmptyState(list, 'No standings loaded.');

  // This page only auto-loads — there's no manual file picker. It fetches
  // ir_leaderboard_placements.csv and ir_leaderboard_boards.csv from the
  // site root automatically, which only works when served over http(s)
  // (e.g. `python -m http.server` from this folder, or the deployed site).
  // Opening the file directly (file://) blocks fetch() entirely, so
  // nothing loads that way.
  if (location.protocol !== 'file:') {
    Promise.all([
      fetch('/ir_leaderboard_placements.csv?t=' + Date.now(), { cache: 'no-store' }).then(r => {
        if (!r.ok) return Promise.reject();
        // capture the file's actual last-modified time (GitHub Pages sets
        // this automatically) before consuming the body as text
        const lastModifiedHeader = r.headers.get('Last-Modified');
        placementsLastModified = lastModifiedHeader ? new Date(lastModifiedHeader) : null;
        return r.text();
      }),
      fetch('/ir_leaderboard_boards.csv?t=' + Date.now(), { cache: 'no-store' }).then(r => r.ok ? r.text() : null).catch(() => null),
    ])
      .then(([placementsText, boardsText]) => {
        const placements = csvToPlacements(placementsText);
        fullStandings = buildStandings(placements);
        renderStandings(fullStandings.slice(0, 10));

        const boards = boardsText ? csvToBoards(boardsText) : null;
        renderOpportunities(placements, boards);
        renderLastUpdatedClock();
        setInterval(renderLastUpdatedClock, 1000);
      })
      .catch(() => {
        renderEmptyState(list, 'ir_leaderboard_placements.csv not found in this folder yet.');
      });
  } else {
    renderEmptyState(list, 'Open this page via a local server (not by double-clicking the file) to auto-load standings.');
  }
}

// ------------------------------------------------------------------
// React shell
// ------------------------------------------------------------------
export default function Leaderboard() {
  const initedRef = useRef(false);

  useEffect(() => {
    if (initedRef.current) return;
    initedRef.current = true;
    initLeaderboard();
  }, []);

  return (
    <>
    <div className="wrap">

      <div className="opportunities-box" id="opportunitiesBox" style={{ display: 'none' }}>
        <div className="opp-title">Best Places to Score</div>
        <div className="opp-subhead" id="opportunitiesSubhead"></div>
        <div id="opportunitiesList"></div>
      </div>

      <div className="last-updated-box" id="lastUpdatedBox" style={{ display: 'none' }}>
        <div className="lu-title">Last Updated</div>
        <div className="lu-elapsed" id="lastUpdatedElapsed">&mdash;</div>
        <div className="lu-caption" id="lastUpdatedCaption"></div>
      </div>

      <header>
        <div className="brand-block">
          <img
            src="/RISE_UG_LOGO_Transparent.png"
            alt="Rise Underground"
            className="brand-logo"
            onError={(e) => {
              e.currentTarget.style.display = 'none';
              const fb = document.getElementById('brandFallback');
              if (fb) fb.style.display = 'block';
            }}
          />
          <div className="brand-fallback" id="brandFallback" style={{ display: 'none' }}>Rise Underground</div>
          <div className="tagline">Operating in the shadows</div>
        </div>
        <div className="header-right">
          <nav className="top-nav">
            <a className="nav-link" href="/">Home</a>
            <a className="nav-link" href="/poa-tracker/">POA Tracker</a>
            <a className="nav-link" href="/ir-almanac/">IR Almanac</a>
            <a className="nav-link current" href="/leaderboard/">Leaderboards</a>
            <a className="nav-link" href="/rise-tracker/">Rise Tracker</a>
          </nav>
          <div className="season-tag" id="seasonTag">MONTH · &mdash;</div>
        </div>
      </header>

      <section className="hero">
        <img
          src="/RISE_UG_LOGO_Transparent.png"
          alt=""
          className="hero-watermark"
          onError={(e) => { e.currentTarget.style.display = 'none'; }}
        />
        <p className="eyebrow">Rise Underground presents</p>
        <h1>Leaders<span>of the Leaderboards</span></h1>
        <p className="dek">
          Points stack across every tracked leaderboard — every Calido Valley Raceway
          track/vehicle combo, every Aero Trails course, and Holocache.
        </p>
        <div className="countdown-strip" id="countdownStrip">
          <div className="countdown-label" id="countdownLabel">COMPETITION STARTS IN</div>
          <div className="countdown-clock" id="countdownClock">&mdash;</div>
        </div>
        <div className="ended-banner" id="endedBanner" style={{ display: 'none' }}>
          🏆 Congrats to the winners! Practice and get ready for next month&apos;s Leader of the Leaderboards.
        </div>
      </section>

      <div className="board-head">
        <h2>Top 10</h2>
        <div className="search-wrap">
          <input type="text" id="playerSearch" placeholder="Find a competitor&hellip;" autoComplete="off" aria-label="Search competitors by name" />
          <div className="search-results" id="searchResults"></div>
        </div>
      </div>

      <div className="standings" id="standings" role="list"></div>

      <footer>
        <a className="social-link" href="https://x.com/RiseUGX" target="_blank" rel="noopener noreferrer" aria-label="RISE Underground on X">
          <svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
            <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
          </svg>
        </a>
        <span>RISE UNDERGROUND · RISEUGX</span>
      </footer>

    </div>

    <div className="drawer-backdrop" id="drawerBackdrop"></div>
    <div className="board-drawer" id="boardDrawer" role="dialog" aria-label="Board placements" aria-hidden="true">
      <button className="drawer-close" id="drawerClose" aria-label="Close">&times;</button>
      <div className="drawer-header">
        <div className="drawer-rank" id="drawerRank">&mdash;</div>
        <div className="drawer-name" id="drawerName">&mdash;</div>
        <div className="drawer-points" id="drawerPoints">&mdash;</div>
      </div>
      <p className="drawer-subhead" id="drawerSubhead">Boards</p>
      <div className="drawer-gauges" id="drawerGauges"></div>
    </div>
    </>
  );
}
