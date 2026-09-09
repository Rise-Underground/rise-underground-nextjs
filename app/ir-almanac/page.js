'use client';

import { useEffect, useRef } from 'react';

// ------------------------------------------------------------------
// Ported near-verbatim from the original ir_almanac.html <script>
// blocks. Two functional changes vs. the original:
//   1. All fetch paths (transcripts/..., archive data) are now absolute
//      ('/transcripts/...') instead of relative, because this page now
//      lives at /ir-almanac/ instead of the site root.
//   2. ARCHIVE_DATA (a ~400KB inline array in the original file) is now
//      fetched from /archive_data.json instead of being embedded as a
//      JS literal, to keep this file a sane size. Content is identical,
//      byte-for-byte extracted from the original.
// ------------------------------------------------------------------

const CONTEXT_STEP = 6; // lines shown before/after on first expand, and per "show more" click

let episodes = []; // { title, url, slug, lines: [{start, duration, text}] }
let allLines = [];  // flattened: { epIndex, lineIndex, start, text }
let ARCHIVE_DATA = [];

async function tryLoad(path) {
  try {
    const res = await fetch(path);
    if (!res.ok) return null;
    return await res.json();
  } catch (e) {
    return null;
  }
}

// Numbered series get scanned upward (Episode 1, 2, 3...) until a run of
// misses. AMAs have no numbering, so they're read from a manifest instead.
const SERIES_CONFIG = {
  cafe_rise: { label: 'Cafe Rise', folder: '/transcripts/Cafe_Rise', filenameFor: n => `Cafe Rise Episode ${n}.json` },
  origin_point: { label: 'Origin Point', folder: '/transcripts/Origin Point', filenameFor: n => `Origin Point Episode ${n}.json` },
  ama: { label: 'AMAs', folder: '/transcripts/AMAs' },
};

function addEpisode(data, fallbackTitle, series, number) {
  const epIndex = episodes.length;
  episodes.push({
    title: data.title || fallbackTitle,
    url: data.url || '',
    series,
    number, // episode number for numbered series, null for AMAs
    lines: data.transcript || []
  });
  (data.transcript || []).forEach((line, lineIndex) => {
    allLines.push({ epIndex, lineIndex, start: line.start, text: line.text });
  });
}

async function loadNumberedSeries(seriesKey) {
  const cfg = SERIES_CONFIG[seriesKey];
  let found = 0, misses = 0, i = 1;
  const MAX_MISSES = 5, MAX_TRY = 300;

  while (misses < MAX_MISSES && i <= MAX_TRY) {
    // try the plain filename first
    const plain = await tryLoad(`${cfg.folder}/${cfg.filenameFor(i)}`);
    if (plain) {
      addEpisode(plain, `${cfg.label} ${i}`, seriesKey, i);
      found++;
      misses = 0;
      i++;
      continue;
    }

    // fall back to "part 1" / "part 2" (and beyond, just in case) variants
    let partFound = false;
    let part = 1;
    while (true) {
      const partName = cfg.filenameFor(i).replace(/\.json$/, ` part ${part}.json`);
      const data = await tryLoad(`${cfg.folder}/${partName}`);
      if (!data) break;
      addEpisode(data, `${cfg.label} ${i} Part ${part}`, seriesKey, i);
      found++;
      partFound = true;
      part++;
    }

    if (partFound) {
      misses = 0;
    } else {
      misses++;
    }
    i++;
  }
  return found;
}

async function loadAmas() {
  const cfg = SERIES_CONFIG.ama;
  const index = await tryLoad(`${cfg.folder}/index.json`);
  if (!index || !Array.isArray(index.files)) return 0;

  let found = 0;
  for (const filename of index.files) {
    const data = await tryLoad(`${cfg.folder}/${filename}`);
    if (data) {
      addEpisode(data, filename.replace(/\.json$/i, ''), 'ama', null);
      found++;
    }
  }
  return found;
}

async function loadEpisodes() {
  const statusEl = document.getElementById('status');

  const [cafeRiseCount, originPointCount, amaCount] = await Promise.all([
    loadNumberedSeries('cafe_rise'),
    loadNumberedSeries('origin_point'),
    loadAmas(),
  ]);

  const found = cafeRiseCount + originPointCount + amaCount;
  statusEl.textContent = found > 0
    ? `${found} episode${found === 1 ? '' : 's'} loaded (${cafeRiseCount} Cafe Rise, ${originPointCount} Origin Point, ${amaCount} AMA) — ${allLines.length} lines indexed`
    : `no episodes found — check that this file sits next to a "transcripts" folder, and that you're running a local server (not opening the file directly)`;

  setupRangeSlider();
}

// Project-specific "related terms" groups, built from actual word
// co-occurrence in the Cafe Rise transcripts (not generic synonyms).
// A search for any word in a group also matches other words in that
// same group, surfaced separately as "related" results.
const SYNONYM_GROUPS = [
  // Matched as substrings (not whole words), so multi-word mis-transcriptions
  // work fine here. Deliberately excludes bare "copius" -- that's also a real
  // English word ("copious sized land plots") and would false-positive.
  ['cornucopias', 'cornucopia', 'cornuc', 'cornic', 'corn copius', 'corner copiu', 'corny copius', 'corn and copious'],
  ['copi', 'kopi', 'copy'],
  ['staking', 'stake', 'stakers', 'node', 'nodes', 'reward', 'rewards', 'pool', 'pools'],
  ['land', 'plot', 'plots', 'dome', 'domes', 'apartment', 'apartments', 'property', 'islands', 'solace', 'realm'],
  ['nft', 'nfts', 'cnft', 'mint', 'minting', 'minted', 'rarity', 'rarities', 'holder', 'holders', 'bundle', 'bundles', 'marketplace'],
  ['cardano', 'base', 'ethereum', 'bnb', 'bridge', 'bridging', 'chainport', 'migration', 'migrate', 'swap'],
  ['token', 'tokens', 'tokenomics', 'tokconomics', 'utility', 'supply', 'economy', 'distribution', 'allocation', 'listing', 'exchange'],
  ['racing', 'race', 'vehicle', 'vehicles', 'car', 'cars', 'track', 'tracks', 'jet', 'jetpack', 'drone'],
  ['engine', 'unreal', 'graphics', 'alpha', 'beta', 'testnet', 'mainnet', 'launch', 'launcher', 'metaverse'],
  ['community', 'discord', 'team', 'partnership', 'partners'],
];

const SYNONYM_LOOKUP = {};
SYNONYM_GROUPS.forEach(group => {
  group.forEach(word => { SYNONYM_LOOKUP[word] = group; });
});

function expandWord(word) {
  return SYNONYM_LOOKUP[word] || [word];
}

function escapeHtml(s) {
  return s.replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}

function fmtTime(sec) {
  sec = Math.floor(sec);
  const h = Math.floor(sec / 3600);
  const m = Math.floor((sec % 3600) / 60);
  const s = sec % 60;
  const mm = String(m).padStart(h ? 2 : 1, '0');
  const ss = String(s).padStart(2, '0');
  return h ? `${h}:${mm}:${ss}` : `${m}:${ss}`;
}

function highlight(text, q) {
  const idx = text.toLowerCase().indexOf(q.toLowerCase());
  if (idx === -1) return escapeHtml(text);
  return escapeHtml(text.slice(0, idx)) +
    '<mark>' + escapeHtml(text.slice(idx, idx + q.length)) + '</mark>' +
    escapeHtml(text.slice(idx + q.length));
}

// For related matches, the literal query word may not appear in the line at
// all -- highlight whichever term from the expanded synonym set actually did.
function highlightAny(text, terms) {
  const lower = text.toLowerCase();
  let bestIdx = -1, bestTerm = '';
  terms.forEach(term => {
    const idx = lower.indexOf(term);
    if (idx !== -1 && (bestIdx === -1 || idx < bestIdx)) {
      bestIdx = idx;
      bestTerm = term;
    }
  });
  if (bestIdx === -1) return escapeHtml(text);
  return escapeHtml(text.slice(0, bestIdx)) +
    '<mark>' + escapeHtml(text.slice(bestIdx, bestIdx + bestTerm.length)) + '</mark>' +
    escapeHtml(text.slice(bestIdx + bestTerm.length));
}

function buildResultCard(m, snippetHtml, isRelated) {
  const ep = episodes[m.epIndex];
  const card = document.createElement('div');
  card.className = 'result' + (isRelated ? ' related' : '');

  const seriesLabel = SERIES_CONFIG[ep.series] ? SERIES_CONFIG[ep.series].label : ep.series;

  const head = document.createElement('div');
  head.className = 'result-head';
  head.innerHTML = `<span><span class="series-tag">${escapeHtml(seriesLabel)}</span><span class="ep-title">${escapeHtml(ep.title)}</span></span>` +
    `<span class="timestamp">${isRelated ? '<span class="related-tag">related</span> ' : ''}${fmtTime(m.start)}</span>`;

  const snippet = document.createElement('div');
  snippet.className = 'snippet';
  snippet.innerHTML = snippetHtml;

  const context = document.createElement('div');
  context.className = 'context';
  let before = CONTEXT_STEP, after = CONTEXT_STEP;

  function renderContext() {
    const startIdx = Math.max(0, m.lineIndex - before);
    const endIdx = Math.min(ep.lines.length - 1, m.lineIndex + after);
    let html = '';
    for (let idx = startIdx; idx <= endIdx; idx++) {
      const line = ep.lines[idx];
      const isHit = idx === m.lineIndex;
      html += `<div class="ctx-line ${isHit ? 'hit' : ''}"><span class="t">${fmtTime(line.start)}</span>${escapeHtml(line.text)}</div>`;
    }
    const ytLink = ep.url ? `<a class="yt-link" target="_blank" href="${ep.url}&t=${Math.floor(m.start)}s">watch on youtube ↗</a>` : '<span></span>';
    html += `<div class="ctx-controls">
      <button data-dir="before" ${startIdx === 0 ? 'disabled' : ''}>← more before</button>
      ${ytLink}
      <button data-dir="after" ${endIdx === ep.lines.length - 1 ? 'disabled' : ''}>more after →</button>
    </div>`;
    context.innerHTML = html;
    context.querySelectorAll('button[data-dir]').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        if (btn.dataset.dir === 'before') before += CONTEXT_STEP;
        else after += CONTEXT_STEP;
        renderContext();
      });
    });
  }

  head.addEventListener('click', () => {
    const isOpen = context.classList.contains('open');
    if (!isOpen && context.innerHTML === '') {
      renderContext();
    }
    context.classList.toggle('open');
  });

  card.appendChild(head);
  card.appendChild(snippet);
  card.appendChild(context);
  return card;
}

// ---- Series filter + episode-range slider ----

let currentSeries = 'all';
let seriesRanges = {}; // { cafe_rise: {min,max}, origin_point: {min,max} } from loaded episodes
let currentQuery = '';

function computeSeriesRanges() {
  ['cafe_rise', 'origin_point'].forEach(key => {
    const nums = episodes.filter(e => e.series === key && e.number != null).map(e => e.number);
    if (nums.length) {
      seriesRanges[key] = { min: Math.min(...nums), max: Math.max(...nums) };
    }
  });
}

function setupRangeSlider() {
  computeSeriesRanges();

  document.querySelectorAll('.filter-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      currentSeries = btn.dataset.series;
      applySeriesToSlider();
      runSearch(currentQuery);
    });
  });

  const rangeMinEl = document.getElementById('rangeMin');
  const rangeMaxEl = document.getElementById('rangeMax');
  [rangeMinEl, rangeMaxEl].forEach(el => {
    el.addEventListener('input', () => {
      if (parseInt(rangeMinEl.value) > parseInt(rangeMaxEl.value)) {
        if (el === rangeMinEl) rangeMaxEl.value = rangeMinEl.value;
        else rangeMinEl.value = rangeMaxEl.value;
      }
      updateRangeVisuals();
      runSearch(currentQuery);
    });
  });

  applySeriesToSlider();
}

function applySeriesToSlider() {
  const rangeRow = document.getElementById('rangeRow');
  const range = seriesRanges[currentSeries];

  if (!range || range.min === range.max) {
    rangeRow.style.display = 'none';
    return;
  }

  rangeRow.style.display = 'flex';
  const rangeMinEl = document.getElementById('rangeMin');
  const rangeMaxEl = document.getElementById('rangeMax');
  rangeMinEl.min = range.min; rangeMinEl.max = range.max; rangeMinEl.value = range.min;
  rangeMaxEl.min = range.min; rangeMaxEl.max = range.max; rangeMaxEl.value = range.max;
  document.getElementById('rangeCaption').textContent = `${SERIES_CONFIG[currentSeries].label} episode range`;
  updateRangeVisuals();
}

function updateRangeVisuals() {
  const rangeMinEl = document.getElementById('rangeMin');
  const rangeMaxEl = document.getElementById('rangeMax');
  const min = parseInt(rangeMinEl.min), max = parseInt(rangeMinEl.max);
  const lo = parseInt(rangeMinEl.value), hi = parseInt(rangeMaxEl.value);

  document.getElementById('rangeMinLabel').textContent = lo;
  document.getElementById('rangeMaxLabel').textContent = hi;

  const span = max - min || 1;
  const leftPct = ((lo - min) / span) * 100;
  const rightPct = ((hi - min) / span) * 100;
  document.getElementById('rangeFill').style.left = leftPct + '%';
  document.getElementById('rangeFill').style.right = (100 - rightPct) + '%';
}

function lineMatchesFilter(l) {
  const ep = episodes[l.epIndex];
  if (currentSeries === 'all') return true;
  if (ep.series !== currentSeries) return false;

  const range = seriesRanges[currentSeries];
  if (!range || ep.number == null) return true; // AMAs (or ungauged series) always pass

  const rangeRow = document.getElementById('rangeRow');
  if (rangeRow.style.display === 'none') return true;

  const lo = parseInt(document.getElementById('rangeMin').value);
  const hi = parseInt(document.getElementById('rangeMax').value);
  return ep.number >= lo && ep.number <= hi;
}

function runSearch(q) {
  currentQuery = q;
  const resultsEl = document.getElementById('results');
  const countEl = document.getElementById('count');
  resultsEl.innerHTML = '';

  const trimmed = q.trim();
  if (!trimmed) {
    resultsEl.innerHTML = '<div id="empty"></div>';
    countEl.textContent = '';
    return;
  }

  const qLower = trimmed.toLowerCase();
  const queryWords = qLower.split(/\s+/).filter(Boolean);

  const candidateLines = allLines.filter(lineMatchesFilter);

  // Tier 1: exact literal phrase match, same behavior as before.
  const exactMatches = candidateLines.filter(l => l.text.toLowerCase().includes(qLower));
  const exactSet = new Set(exactMatches);

  // Tier 2: related matches -- every query word present, but each word may
  // match either itself or one of its related terms (AND across words,
  // OR within each word's group). Only shown when it adds something the
  // exact match didn't already cover.
  const expandedPerWord = queryWords.map(expandWord);
  const relatedMatches = candidateLines.filter(l => {
    if (exactSet.has(l)) return false;
    const lower = l.text.toLowerCase();
    return expandedPerWord.every(options => options.some(opt => lower.includes(opt)));
  });

  // Higher epIndex = later episode/part (episodes load in ascending order,
  // 1, 2, 3...), so sorting descending by epIndex puts the most recent
  // episode's hits first. Ties (multiple hits within the same episode)
  // keep their natural in-episode order (earliest timestamp first).
  const byRecency = (a, b) => b.epIndex - a.epIndex || a.lineIndex - b.lineIndex;
  exactMatches.sort(byRecency);
  relatedMatches.sort(byRecency);

  const totalCount = exactMatches.length + relatedMatches.length;
  countEl.textContent = `${exactMatches.length} match${exactMatches.length === 1 ? '' : 'es'}` +
    (relatedMatches.length ? ` · ${relatedMatches.length} related` : '');

  if (totalCount === 0) {
    resultsEl.innerHTML = '<div id="empty">no matches</div>';
    return;
  }

  const CAP = 300;
  exactMatches.slice(0, CAP).forEach(m => {
    resultsEl.appendChild(buildResultCard(m, highlight(m.text, trimmed), false));
  });

  if (exactMatches.length > CAP) {
    const note = document.createElement('div');
    note.id = 'empty';
    note.textContent = `showing first ${CAP} of ${exactMatches.length} matches — narrow your search`;
    resultsEl.appendChild(note);
  } else if (relatedMatches.length) {
    const remaining = CAP - exactMatches.length;
    const divider = document.createElement('div');
    divider.className = 'related-divider';
    divider.textContent = `related — matched on connected terms, not "${trimmed}" itself`;
    resultsEl.appendChild(divider);

    const flatTerms = [...new Set(expandedPerWord.flat())];
    relatedMatches.slice(0, remaining).forEach(m => {
      resultsEl.appendChild(buildResultCard(m, highlightAny(m.text, flatTerms), true));
    });
    if (relatedMatches.length > remaining) {
      const note = document.createElement('div');
      note.id = 'empty';
      note.textContent = `+ ${relatedMatches.length - remaining} more related matches — narrow your search`;
      resultsEl.appendChild(note);
    }
  }
}

// ------------------------------------------------------------------
// Feature Archive
// ------------------------------------------------------------------

function archiveStatusClass(status) {
  const s = (status || '').toLowerCase();
  if (s === 'complete') return 'status-complete';
  if (s === 'wip') return 'status-wip';
  if (s.startsWith('partial')) return 'status-partial';
  if (s === 'pivoted' || s.startsWith('cancelled')) return 'status-pivoted';
  return 'status-wip';
}

// Cancelled/Scrapped is merged into Pivoted for display purposes.
function archiveStatusLabel(status) {
  const s = (status || '').toLowerCase();
  if (s.startsWith('cancelled')) return 'Pivoted';
  return status;
}

// Splits a description into timeline rows wherever an inline citation
// grouping like "(CR62)" or "(CR75, CR83)" appears mid-text. A final
// citation group that only repeats citations already used earlier is
// treated as a redundant summary and dropped rather than shown as its
// own row.
function parseDescGroups(desc) {
  const pattern = /\(((?:CR\d+|CC\d+|OP\d+|AMA\w*|T-Doc|DGC\w*)(?:,\s*(?:CR\d+|CC\d+|OP\d+|AMA\w*|T-Doc|DGC\w*))*)\)/g;
  let match;
  const groups = [];
  while ((match = pattern.exec(desc)) !== null) {
    const ccs = match[1].split(',').map(s => s.trim());
    groups.push({ start: match.index, end: match.index + match[0].length, ccs });
  }
  return groups;
}

// Returns null if there's only a single citation group total (nothing to
// split - render as a plain paragraph instead).
function splitDescIntoBullets(desc) {
  const groups = parseDescGroups(desc);
  if (groups.length < 2) return null;

  const last = groups[groups.length - 1];
  const unionBefore = new Set(groups.slice(0, -1).flatMap(g => g.ccs));
  const lastIsSubset = last.ccs.every(c => unionBefore.has(c));
  const trailingText = desc.slice(last.end).trim();
  let usableGroups = groups;
  if (lastIsSubset && trailingText === '') {
    usableGroups = groups.slice(0, -1);
  }
  if (usableGroups.length < 2) return null;

  const bullets = [];
  let cursor = 0;
  usableGroups.forEach(g => {
    let segment = desc.slice(cursor, g.start).trim();
    segment = segment.replace(/^[;,.\s\u2014-]+/, '').trim();
    if (segment) {
      if (/^[a-z]/.test(segment)) segment = segment[0].toUpperCase() + segment.slice(1);
      if (!/[.!?]$/.test(segment)) segment += '.';
      bullets.push({ text: segment, cr: g.ccs });
    }
    cursor = g.end;
  });
  let leftover = desc.slice(cursor).trim().replace(/^[;,.\s\u2014-]+/, '').trim();
  if (leftover) {
    if (!/[.!?]$/.test(leftover)) leftover += '.';
    bullets.push({ text: leftover, cr: [] });
  }
  return bullets.length > 1 ? bullets : null;
}

// Maps a citation code to its source series, so each series can render in
// its own color (CR = Cafe Rise/Copi Cafe, OP = Origin Point, AMA = Ask Me
// Anything, T-Doc = Tokenomics Document, DGC = Discord General Chat).
function citeSourceVar(citation) {
  if (/^CR\d/i.test(citation)) return 'var(--cite-cr)';
  if (/^OP\d/i.test(citation)) return 'var(--cite-op)';
  if (/AMA/i.test(citation)) return 'var(--cite-ama)';
  if (/^T-Doc/i.test(citation)) return 'var(--cite-tdoc)';
  if (/^DGC/i.test(citation)) return 'var(--cite-dgc)';
  return 'var(--cite-default)';
}

function renderCiteTag(citation, citationLinks) {
  const entry = citationLinks && citationLinks[citation];
  const url = entry ? (typeof entry === 'string' ? entry : entry.url) : null;
  const verified = !!(entry && typeof entry === 'object' && entry.verified === true);

  const statusClass = verified ? 'archive-cite-verified' : 'archive-cite-unverified';
  const icon = verified ? '✓ ' : '';
  const titleText = verified
    ? 'Verified — a human confirmed this links to the right moment'
    : (url ? 'Not yet verified by a human' : 'Not yet linked or verified');
  const colorStyle = `style="--cite-color:${citeSourceVar(citation)}"`;

  if (url) {
    return `<a class="archive-cite archive-cite-linked ${statusClass}" href="${url}" target="_blank" rel="noopener" title="${titleText}" ${colorStyle}>${icon}${citation}</a>`;
  }
  return `<span class="archive-cite ${statusClass}" title="${titleText}" ${colorStyle}>${icon}${citation}</span>`;
}

function buildArchiveItem(item) {
  const el = document.createElement('div');
  el.className = 'archive-item';

  const head = document.createElement('div');
  head.className = 'archive-item-head';
  head.innerHTML = `<span class="archive-item-name">${item.name}</span>
    <span class="archive-status ${archiveStatusClass(item.status)}">${archiveStatusLabel(item.status)}</span>`;
  head.addEventListener('click', () => el.classList.toggle('open'));

  const detail = document.createElement('div');
  detail.className = 'archive-item-detail';

  const bullets = splitDescIntoBullets(item.desc);
  if (bullets) {
    const rows = bullets.map(b => {
      const cites = b.cr.map(c => renderCiteTag(c, item.citationLinks)).join('');
      return `<li class="archive-tl-row"><span class="archive-tl-text">${b.text}</span><span class="archive-tl-cites">${cites}</span></li>`;
    }).join('');
    detail.innerHTML = `<ul class="archive-timeline">${rows}</ul>`;
  } else {
    const groups = parseDescGroups(item.desc);
    const allCites = [...new Set(groups.flatMap(g => g.ccs))];
    const plainText = groups.length
      ? item.desc.slice(0, groups[groups.length - 1].start).trim()
      : item.desc;
    const cites = allCites.map(c => renderCiteTag(c, item.citationLinks)).join('');
    detail.innerHTML = `<div class="archive-item-desc">${plainText}</div>
      <div class="archive-cite-row">${cites}</div>`;
  }

  el.appendChild(head);
  el.appendChild(detail);
  return el;
}

function buildArchiveSub(sub) {
  const el = document.createElement('div');
  el.className = 'archive-sub';

  const head = document.createElement('div');
  head.className = 'archive-sub-head';
  head.innerHTML = `<span class="archive-sub-name">${sub.label}</span>
    <span class="archive-caret">▸ ${sub.items.length}</span>`;
  head.addEventListener('click', () => el.classList.toggle('open'));

  const body = document.createElement('div');
  body.className = 'archive-sub-body';
  sub.items.forEach(item => body.appendChild(buildArchiveItem(item)));

  el.appendChild(head);
  el.appendChild(body);
  return el;
}

function buildArchiveCategory(cat) {
  const el = document.createElement('div');
  el.className = 'archive-cat' + (cat.ready ? '' : ' locked');

  const head = document.createElement('div');
  head.className = 'archive-cat-head';
  head.innerHTML = `<span class="archive-cat-name">${cat.label}</span>
    <span class="archive-caret">▸</span>`;
  head.addEventListener('click', () => el.classList.toggle('open'));

  const body = document.createElement('div');
  body.className = 'archive-cat-body';

  if (!cat.ready) {
    body.innerHTML = `<div class="archive-soon">coming soon</div>`;
  } else if (cat.subs) {
    cat.subs.forEach(sub => body.appendChild(buildArchiveSub(sub)));
  } else if (cat.items) {
    cat.items.forEach(item => body.appendChild(buildArchiveItem(item)));
  }

  el.appendChild(head);
  el.appendChild(body);
  return el;
}

// --- Almanac summary stats (computed from ready categories only, i.e.
// everything actually reviewed so far) ---
function computeAlmanacStats() {
  const counts = { Complete: 0, WIP: 0, 'Partial Completion': 0, Pivoted: 0, Other: 0 };
  function tally(items) {
    items.forEach(it => {
      let s = it.status || '';
      if (/^cancelled/i.test(s)) s = 'Pivoted';
      if (counts.hasOwnProperty(s)) counts[s]++;
      else counts.Other++;
    });
  }
  ARCHIVE_DATA.forEach(cat => {
    if (!cat.ready) return;
    if (cat.items) tally(cat.items);
    if (cat.subs) cat.subs.forEach(sub => tally(sub.items));
  });
  return counts;
}

function animateCount(el, target, duration) {
  if (!el) return;
  const start = 0;
  const startTime = performance.now();
  function step(now) {
    const progress = Math.min((now - startTime) / duration, 1);
    const eased = 1 - Math.pow(1 - progress, 3);
    el.textContent = Math.round(start + (target - start) * eased);
    if (progress < 1) requestAnimationFrame(step);
    else el.textContent = target;
  }
  requestAnimationFrame(step);
}

function initAlmanacStats() {
  const counts = computeAlmanacStats();
  animateCount(document.getElementById('almanacCompleteNum'), counts['Complete'], 1100);
  animateCount(document.getElementById('almanacWipNum'), counts['WIP'], 900);
  animateCount(document.getElementById('almanacPartialNum'), counts['Partial Completion'], 900);
  animateCount(document.getElementById('almanacPivotedNum'), counts['Pivoted'], 900);
}

function renderArchive() {
  const archiveRoot = document.getElementById('archiveRoot');
  archiveRoot.classList.add('archive-two-col');
  const archiveColLeft = document.createElement('div');
  archiveColLeft.className = 'archive-col';
  const archiveColRight = document.createElement('div');
  archiveColRight.className = 'archive-col';
  ARCHIVE_DATA.forEach((cat, i) => {
    const target = (i % 2 === 0) ? archiveColLeft : archiveColRight;
    target.appendChild(buildArchiveCategory(cat));
  });
  archiveRoot.appendChild(archiveColLeft);
  archiveRoot.appendChild(archiveColRight);
}

async function initAlmanac() {
  const res = await fetch('/archive_data.json');
  ARCHIVE_DATA = res.ok ? await res.json() : [];
  initAlmanacStats();
  renderArchive();

  document.getElementById('q').addEventListener('input', (e) => {
    clearTimeout(initAlmanac._debounce);
    initAlmanac._debounce = setTimeout(() => runSearch(e.target.value), 120);
  });

  loadEpisodes();
}

// ------------------------------------------------------------------
// React shell
// ------------------------------------------------------------------
export default function IrAlmanac() {
  const initedRef = useRef(false);

  useEffect(() => {
    if (initedRef.current) return;
    initedRef.current = true;
    initAlmanac();
  }, []);

  return (
    <>
      <nav className="topnav" aria-label="Site">
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
        <div className="nav-links">
          <a href="/">Home</a>
          <a href="/poa-tracker/">POA Tracker</a>
          <a href="/ir-almanac/" className="current">IR Almanac</a>
          <a href="/leaderboard/">Leaderboards</a>
          <a href="/rise-tracker/">Rise Tracker</a>
        </div>
      </nav>

      <header>
        <div className="eyebrow">Rise Underground</div>
        <h1><span>Infinity Rising Almanac</span></h1>
      </header>

      <div className="almanac-stats">
        <div className="almanac-hero">
          <div className="almanac-hero-num" id="almanacCompleteNum">0</div>
          <div className="almanac-hero-label">Completed &amp; Shipped</div>
        </div>
        <div className="almanac-mini-row">
          <div className="almanac-mini">
            <div className="almanac-mini-num" id="almanacWipNum">0</div>
            <div className="almanac-mini-label">In Progress</div>
          </div>
          <div className="almanac-mini">
            <div className="almanac-mini-num" id="almanacPartialNum">0</div>
            <div className="almanac-mini-label">Partially Complete</div>
          </div>
          <div className="almanac-mini">
            <div className="almanac-mini-num" id="almanacPivotedNum">0</div>
            <div className="almanac-mini-label">Pivoted</div>
          </div>
        </div>
      </div>

      <div id="status">loading episodes&hellip;</div>

      <div className="search-wrap">
        <input id="q" type="text" placeholder="search a word or phrase&hellip;" autoComplete="off" />

        <div className="filter-row" id="seriesFilter">
          <button type="button" className="filter-btn active" data-series="all">All</button>
          <button type="button" className="filter-btn" data-series="cafe_rise">Cafe Rise</button>
          <button type="button" className="filter-btn" data-series="origin_point">Origin Point</button>
          <button type="button" className="filter-btn" data-series="ama">AMAs</button>
        </div>

        <div className="range-row" id="rangeRow" style={{ display: 'none' }}>
          <span className="range-label" id="rangeMinLabel">1</span>
          <div className="range-slider">
            <div className="range-track"></div>
            <div className="range-fill" id="rangeFill"></div>
            <input type="range" id="rangeMin" min="1" max="1" defaultValue="1" />
            <input type="range" id="rangeMax" min="1" max="1" defaultValue="1" />
          </div>
          <span className="range-label" id="rangeMaxLabel">1</span>
          <span className="range-caption" id="rangeCaption">episode range</span>
        </div>

        <div id="count"></div>
      </div>

      <main id="results">
        <div id="empty"></div>
      </main>

      <section className="archive-section">
        <div className="archive-heading">Feature Archive</div>
        <p className="archive-sub-heading">Every feature the team has talked about on-air, organized by category. Click a category to open it up.</p>
        <p className="archive-feedback">If you see any inaccuracies, let us know by posting on X <a href="https://x.com/RiseUGX" target="_blank" rel="noopener">@RiseUGX</a>.</p>

        <div className="citation-index">
          <div className="citation-index-title">Citation Key</div>
          <div className="citation-index-row">
            <span className="citation-index-entry"><span className="citation-index-key" style={{ '--cite-color': 'var(--cite-cr)' }}>CR#</span>Cafe Rise / Copi Cafe</span>
            <span className="citation-index-entry"><span className="citation-index-key" style={{ '--cite-color': 'var(--cite-op)' }}>OP#</span>Origin Point</span>
            <span className="citation-index-entry"><span className="citation-index-key" style={{ '--cite-color': 'var(--cite-ama)' }}>AMA</span>Ask Me Anything</span>
            <span className="citation-index-entry"><span className="citation-index-key" style={{ '--cite-color': 'var(--cite-tdoc)' }}>T-Doc</span>Tokenomics Document</span>
            <span className="citation-index-entry"><span className="citation-index-key" style={{ '--cite-color': 'var(--cite-dgc)' }}>DGC</span>Discord General Chat</span>
          </div>
        </div>
        <div id="archiveRoot"></div>
      </section>
    </>
  );
}
