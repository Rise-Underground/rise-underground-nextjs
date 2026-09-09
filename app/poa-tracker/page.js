'use client';

import { useEffect, useRef, useState } from 'react';
import Script from 'next/script';
import SiteNav from '../components/SiteNav';
import PageHero from '../components/PageHero';

// ------------------------------------------------------------------
// Ported near-verbatim from the original poa_tracker.html <script>
// blocks. All the rarity/odds/needle math runs in export_nft_json.py
// against NFT_Ledger.db -- this page only reads the finished numbers
// and draws them. See that script for the calculations behind each
// field.
//
// Only functional change vs. the original: FILES paths and the local
// image fallback prefix are now absolute ('/NFT_Data/...') instead of
// relative, because this page now lives at /poa-tracker/ instead of
// the site root.
// ------------------------------------------------------------------

const FILES = {
  nftData: '/NFT_Data/nft_data.json',
  mintStatus: '/NFT_Data/nft_mint_status.csv',
};

let NFT_ITEMS = [];
let BUNDLE_SUMMARIES = {}; // bundle name -> {name, needle, verdict}

const AFFILIATE_PARAM = 'alc=duLb64P7HB';
function affiliateUrl(baseUrl) {
  if (!baseUrl) return null;
  return baseUrl + (baseUrl.includes('?') ? '&' : '?') + AFFILIATE_PARAM;
}

let ITEM_URLS = {}; // key -> store URL, populated from nft_mint_status.csv
let ITEM_ORDER = new Map(); // key -> row index in nft_mint_status.csv, i.e. store listing order

function loadCSV(path) {
  return new Promise((resolve) => {
    window.Papa.parse(path, {
      download: true, header: true, dynamicTyping: true, skipEmptyLines: true,
      complete: (res) => resolve(res.data || []),
      error: () => resolve(null),
    });
  });
}

async function loadOpenMintKeys() {
  const rows = await loadCSV(FILES.mintStatus);
  const openKeys = new Set();
  if (!rows) return openKeys; // file missing -- caller falls back to showing everything
  // Row order here is the store's own listing order (nft_mint_status.csv is
  // built straight off store_items_for_sale.csv, which is itself scraped in
  // listing order) -- index 0 = top of the store = position 1 on this page.
  rows.forEach((r, i) => {
    const isOpen = r.open === true || String(r.open).trim().toLowerCase() === 'true';
    if (r.key && r.url) ITEM_URLS[String(r.key).trim()] = String(r.url).trim();
    if (r.key) ITEM_ORDER.set(String(r.key).trim(), i);
    if (isOpen && r.key) openKeys.add(String(r.key).trim());
  });
  return openKeys;
}

async function loadNftItems() {
  try {
    const res = await fetch(FILES.nftData);
    if (!res.ok) return { items: [], bundleSummaries: {}, recentMints: [], generatedAt: null };
    const data = await res.json();
    const items = Array.isArray(data.items) ? data.items : [];
    const recentMints = Array.isArray(data.recent_mints) ? data.recent_mints : [];
    const bundleSummaries = {};
    (Array.isArray(data.bundle_summaries) ? data.bundle_summaries : []).forEach(b => {
      bundleSummaries[b.name] = b;
    });
    return { items, bundleSummaries, recentMints, generatedAt: data.generated_at || null };
  } catch (e) {
    return { items: [], bundleSummaries: {}, recentMints: [], generatedAt: null };
  }
}

// "Last updated" clock -- reads generated_at from nft_data.json (set by
// unified_nft_updater.py's Step 5 export) and counts up in real time
// rather than re-fetching, so it keeps ticking between hourly refreshes.
let LAST_UPDATED_DT = null;
function formatAgo(seconds) {
  if (seconds < 60) return 'just now';
  const mins = Math.floor(seconds / 60);
  if (mins < 60) return `${mins} minute${mins === 1 ? '' : 's'} ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours} hour${hours === 1 ? '' : 's'} ago`;
  const days = Math.floor(hours / 24);
  return `${days} day${days === 1 ? '' : 's'} ago`;
}
function tickLastUpdated() {
  const el = document.getElementById('lastUpdated');
  if (!el || !LAST_UPDATED_DT) return;
  const seconds = Math.floor((Date.now() - LAST_UPDATED_DT.getTime()) / 1000);
  el.innerHTML = `<span class="dot"></span>Last updated ${formatAgo(Math.max(seconds, 0))}`;
}
function initLastUpdated(generatedAt) {
  if (!generatedAt) return; // field missing (old export) -- leave hidden
  const dt = new Date(generatedAt);
  if (isNaN(dt.getTime())) return;
  LAST_UPDATED_DT = dt;
  const el = document.getElementById('lastUpdated');
  if (el) el.style.display = '';
  tickLastUpdated();
  setInterval(tickLastUpdated, 30000);
}

async function init() {
  const [{ items, bundleSummaries, recentMints, generatedAt }, openKeys] = await Promise.all([loadNftItems(), loadOpenMintKeys()]);
  initLastUpdated(generatedAt);
  NFT_ITEMS = (openKeys.size > 0) ? items.filter(it => openKeys.has(it.key)) : items;
  // else: nft_mint_status.csv missing/empty -- show everything rather than an empty page

  // Order by store listing position (top of store = position 1). Items
  // with no ITEM_ORDER entry (mint_status.csv missing/incomplete for that
  // key) sort to the end, in whatever order they arrived in, rather than
  // disappearing or breaking the sort.
  NFT_ITEMS = NFT_ITEMS
    .map((it, i) => ({ it, i, order: ITEM_ORDER.has(it.key) ? ITEM_ORDER.get(it.key) : Infinity }))
    .sort((a, b) => a.order - b.order || a.i - b.i)
    .map(x => x.it);

  BUNDLE_SUMMARIES = bundleSummaries;
  renderRecentMintsTicker(recentMints);
  renderNftPage();
  initNftSearch();
}

function renderNftPage() {
  if (NFT_ITEMS.length === 0) {
    document.getElementById('nftEmptyState').style.display = '';
    document.getElementById('nftCardsContainer').innerHTML = '';
    document.getElementById('nftBundleContainer').innerHTML = '';
    return;
  }
  document.getElementById('nftEmptyState').style.display = 'none';

  renderTopMintsHeader(NFT_ITEMS);

  const soloContainer = document.getElementById('nftCardsContainer');
  const bundleContainer = document.getElementById('nftBundleContainer');
  const rendered = new Set();
  const soloBlocks = [];
  const bundleBlocks = [];
  NFT_ITEMS.forEach(it => {
    if (rendered.has(it.key)) return;
    if (it.bundle) {
      const members = NFT_ITEMS.filter(x => x.bundle === it.bundle);
      members.forEach(m => rendered.add(m.key));
      bundleBlocks.push(bundleCardHtml(it.bundle, members));
      // Not exclusive to the bundle AND actually live for solo sale right
      // now -- otherwise the only real way to get it is via the bundle,
      // and a standalone "Mint Now" card would be misleading.
      members.filter(m => m.bundle_exclusive === false && m.solo_sale).forEach(m => {
        soloBlocks.push(cardHtml(m.key));
      });
    } else {
      rendered.add(it.key);
      soloBlocks.push(cardHtml(it.key));
    }
  });
  soloContainer.innerHTML = soloBlocks.join('');
  bundleContainer.innerHTML = bundleBlocks.join('');

  NFT_ITEMS.forEach(item => {
    if (!item.bundle || (item.bundle_exclusive === false && item.solo_sale)) {
      renderNftCard(item, item.key);
    }
    if (item.bundle) {
      renderNftCard(item, (item.bundle_exclusive === false && item.solo_sale) ? `${item.key}--bundle` : item.key);
    }
  });
  Object.keys(BUNDLE_SUMMARIES).forEach(renderBundleSummary);
}

function setNftMode(mode) {
  const solo = mode !== 'bundles';
  document.getElementById('nftCardsContainer').style.display = solo ? '' : 'none';
  document.getElementById('nftBundleContainer').style.display = solo ? 'none' : '';
  document.getElementById('nftTabSolo').classList.toggle('active', solo);
  document.getElementById('nftTabBundles').classList.toggle('active', !solo);
}

function bundleSummaryHtml(bundleName) {
  const bundleId = slugifyForBundle(bundleName);
  return `
  <div class="bundle-summary-block" id="bundleblock-${bundleId}">
    <div class="bundle-summary-title-row">
      <span class="bundle-summary-title">${bundleName}</span>
      <a class="mint-now-btn" id="bundlemintnow-${bundleId}" href="#" target="_blank" rel="noopener" style="display:none;">Mint Now</a>
    </div>
    <svg viewBox="0 0 300 190" width="100%" style="max-width:220px;display:block;margin:0 auto;">
      <text x="20" y="24" class="meter-chain-label left" fill="var(--ada-chain)">ADA</text>
      <text x="280" y="24" class="meter-chain-label right" fill="var(--base-chain)" text-anchor="end">BASE</text>
      <path d="M 30 150 A 120 120 0 0 1 270 150" fill="none" stroke="var(--line)" stroke-width="14" stroke-linecap="round"/>
      <path id="bundlearc-${bundleId}" d="M 30 150 A 120 120 0 0 1 270 150" fill="none" stroke="var(--dimmer)" stroke-width="14" stroke-linecap="round" stroke-dasharray="377" stroke-dashoffset="377"/>
      <line id="bundleneedle-${bundleId}" x1="150" y1="150" x2="150" y2="45" stroke="var(--text)" stroke-width="3" stroke-linecap="round" transform="rotate(0 150 150)"/>
      <circle cx="150" cy="150" r="7" fill="var(--text)"/>
    </svg>
    <div class="meter-verdict" id="bundleverdict-${bundleId}"></div>
  </div>`;
}

function slugifyForBundle(name) {
  return String(name).toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_+|_+$/g, '');
}

function renderBundleSummary(bundleName) {
  const summary = BUNDLE_SUMMARIES[bundleName];
  if (!summary) return;
  const bundleId = slugifyForBundle(bundleName);
  const { angle, arc_pct } = summary.needle;

  const arcEl = document.getElementById(`bundlearc-${bundleId}`);
  const needleEl = document.getElementById(`bundleneedle-${bundleId}`);
  const verdictEl = document.getElementById(`bundleverdict-${bundleId}`);
  if (!arcEl || !needleEl || !verdictEl) return; // summary computed but this bundle has no rendered box on the page

  needleEl.setAttribute('transform', `rotate(${angle} 150 150)`);
  arcEl.setAttribute('stroke-dashoffset', String(377 - arc_pct));

  if (summary.verdict.mode === 'even') {
    verdictEl.innerHTML = `Roughly even right now`;
  } else if (summary.verdict.mode === 'base') {
    verdictEl.innerHTML = `<span class="chainname base">Base</span> currently favors minting (combined)`;
  } else {
    verdictEl.innerHTML = `<span class="chainname ada">Cardano</span> currently favors minting (combined)`;
  }

  // One Mint Now button for the whole bundle -- any member's URL works,
  // since bundle-exclusive members' store link already points at the
  // bundle's own page (see store_full_audit.py).
  const mintNowEl = document.getElementById(`bundlemintnow-${bundleId}`);
  if (mintNowEl) {
    const members = NFT_ITEMS.filter(it => it.bundle === bundleName);
    const storeUrl = members.map(m => ITEM_URLS[m.key]).find(Boolean);
    if (storeUrl) {
      mintNowEl.href = affiliateUrl(storeUrl);
      mintNowEl.style.display = '';
    } else {
      mintNowEl.style.display = 'none';
    }
  }
}

function bundleMemberCardHtml(key, domKey) {
  return `
  <div class="bundle-member-block" id="cardblock-${domKey}">
    <div class="bundle-member-layout">
      <div class="bundle-member-image-col">
        <div class="bundle-member-title-row">
          <span class="bundle-member-title" id="title-${domKey}">Loading&hellip;</span>
        </div>
        <img id="img-${domKey}" class="meter-rarity-img-large" style="display:none;" alt="Highest-rarity mint so far">
        <div id="imgEmpty-${domKey}" class="meter-rarity-img-empty">No image captured yet</div>
      </div>
      <div class="bundle-member-gauge-col">
        <div class="bundle-col-label">Optimal Chain for Minting</div>
        <svg viewBox="0 0 300 190" width="100%" style="max-width:250px;">
          <text x="20" y="24" class="meter-chain-label left" fill="var(--ada-chain)">ADA</text>
          <text x="280" y="24" class="meter-chain-label right" fill="var(--base-chain)" text-anchor="end">BASE</text>
          <path d="M 30 150 A 120 120 0 0 1 270 150" fill="none" stroke="var(--line)" stroke-width="14" stroke-linecap="round"/>
          <path id="arc-${domKey}" d="M 30 150 A 120 120 0 0 1 270 150" fill="none" stroke="var(--dimmer)" stroke-width="14" stroke-linecap="round" stroke-dasharray="377" stroke-dashoffset="377"/>
          <line id="needle-${domKey}" x1="150" y1="150" x2="150" y2="45" stroke="var(--text)" stroke-width="3" stroke-linecap="round" transform="rotate(0 150 150)"/>
          <circle cx="150" cy="150" r="7" fill="var(--text)"/>
        </svg>
        <div class="meter-verdict" id="verdict-${domKey}">Loading&hellip;</div>
      </div>
      <div class="nft-stat-grid" id="statgrid-${domKey}"></div>
      <div class="bundle-member-odds-col">
        <div class="bundle-col-label">Odds Breakdown</div>
        <div class="odds-breakdown-body" id="oddsbreak-${domKey}"></div>
      </div>
    </div>
  </div>`;
}

function bundleCardHtml(bundleName, members) {
  return `
  ${bundleSummaryHtml(bundleName)}
  <div class="bundle-group-box">
    ${members.map(m => bundleMemberCardHtml(m.key, (m.bundle_exclusive === false && m.solo_sale) ? `${m.key}--bundle` : m.key)).join('')}
  </div>`;
}

function cardHtml(key) {
  return `
  <div class="nft-card-block" id="cardblock-${key}">
    <div class="nft-card-title-row">
      <span class="nft-card-title" id="title-${key}">Loading&hellip;</span>
      <a class="mint-now-btn" id="mintnow-${key}" href="#" target="_blank" rel="noopener" style="display:none;">Mint Now</a>
    </div>
    <div class="nft-top-row">
      <div class="meter-panel image-panel">
        <div class="panel-head meter-panel-head"></div>
        <div class="meter-body">
          <img id="img-${key}" class="meter-rarity-img-large" style="display:none;" alt="Highest-rarity mint so far">
          <div id="imgEmpty-${key}" class="meter-rarity-img-empty">No image captured yet</div>
        </div>
      </div>
      <div class="meter-panel">
        <div class="panel-head meter-panel-head"><h2>Optimal Chain for Minting</h2></div>
        <div class="meter-body">
          <svg viewBox="0 0 300 190" width="100%" style="max-width:330px;">
            <text x="20" y="24" class="meter-chain-label left" fill="var(--ada-chain)">ADA</text>
            <text x="280" y="24" class="meter-chain-label right" fill="var(--base-chain)" text-anchor="end">BASE</text>
            <path d="M 30 150 A 120 120 0 0 1 270 150" fill="none" stroke="var(--line)" stroke-width="14" stroke-linecap="round"/>
            <path id="arc-${key}" d="M 30 150 A 120 120 0 0 1 270 150" fill="none" stroke="var(--dimmer)" stroke-width="14" stroke-linecap="round" stroke-dasharray="377" stroke-dashoffset="377"/>
            <line id="needle-${key}" x1="150" y1="150" x2="150" y2="45" stroke="var(--text)" stroke-width="3" stroke-linecap="round" transform="rotate(0 150 150)"/>
            <circle cx="150" cy="150" r="7" fill="var(--text)"/>
          </svg>
          <div class="meter-verdict" id="verdict-${key}">Loading&hellip;</div>
        </div>
      </div>
      <div class="nft-stat-grid" id="statgrid-${key}"></div>
      <div class="meter-panel">
        <div class="panel-head meter-panel-head"><h2>Odds Breakdown</h2></div>
        <div class="meter-body odds-breakdown-body" id="oddsbreak-${key}"></div>
      </div>
    </div>
  </div>`;
}

function renderRecentMintsTicker(recentMints) {
  const el = document.getElementById('nftRecentMintsTicker');
  if (!recentMints || recentMints.length === 0) {
    el.style.display = 'none';
    el.innerHTML = '';
    return;
  }
  el.style.display = '';

  const entryHtml = (m, i, copy) => `
    <div class="recent-mint-entry">
      <span class="recent-mint-rank">${i + 1}.</span>
      <img class="recent-mint-thumb" id="mintthumb-${copy}-${i}" style="display:none;" alt="">
      <div class="recent-mint-thumb-empty" id="mintthumbEmpty-${copy}-${i}"></div>
      <span class="recent-mint-name">${escapeHtml(m.name)}</span>
      <span class="recent-mint-chain ${m.chain === 'base' ? 'base' : 'ada'}">${m.chain === 'base' ? 'BASE' : 'ADA'}</span>
    </div>`;

  // Rendered twice back-to-back, animated to translateX(-50%) on a loop --
  // by the time the first copy has scrolled fully offscreen, the second
  // copy is sitting exactly where the first one started, so the loop
  // never shows a visible seam/jump.
  const oneSet = recentMints.map((m, i) => entryHtml(m, i, 'a')).join('');
  const twoSets = recentMints.map((m, i) => entryHtml(m, i, 'b')).join('');
  el.innerHTML = `<div class="recent-mints-track">${oneSet}${twoSets}</div>`;

  const wireUpImage = (m, i, copy) => {
    const imgEl = document.getElementById(`mintthumb-${copy}-${i}`);
    const emptyEl = document.getElementById(`mintthumbEmpty-${copy}-${i}`);
    if (!m.image) {
      imgEl.style.display = 'none';
      emptyEl.style.display = '';
      return;
    }
    const cid = ipfsCid(m.image);
    let gatewayIndex = 0;
    imgEl.onload = () => { imgEl.style.display = ''; emptyEl.style.display = 'none'; };
    imgEl.onerror = () => {
      if (cid && gatewayIndex < IPFS_GATEWAYS.length - 1) {
        gatewayIndex++;
        imgEl.src = ipfsToHttp(m.image, gatewayIndex);
      } else {
        imgEl.style.display = 'none';
        emptyEl.style.display = '';
      }
    };
    imgEl.src = ipfsToHttp(m.image, gatewayIndex);
  };

  recentMints.forEach((m, i) => { wireUpImage(m, i, 'a'); wireUpImage(m, i, 'b'); });
}

function renderTopMintsHeader(items) {
  const el = document.getElementById('nftTopMintsHeader');
  const ranked = items
    .filter(it => it.best_mythic && it.best_mythic.pct > 0)
    .sort((a, b) => b.best_mythic.pct - a.best_mythic.pct)
    .slice(0, 3);

  if (ranked.length === 0) {
    el.style.display = 'none';
    el.innerHTML = '';
    return;
  }
  el.style.display = '';
  el.innerHTML = `
    <div class="panel-head"><h2>Best Mythic Odds Right Now</h2></div>
    <div class="top-mints-row">
      ${ranked.map((it, i) => `
        <div class="top-mint-item">
          <span class="top-mint-rank">#${i + 1}</span>
          <span class="top-mint-name">${it.name}</span>
          <span class="top-mint-chain">${it.best_mythic.chain}</span>
          <span class="top-mint-pct">${it.best_mythic.pct.toFixed(1)}%</span>
        </div>`).join('')}
    </div>`;
}

// ipfs.io alone is best-effort with no SLA and known to rate-limit or block
// hotlinked <img> requests -- try a few public gateways in order and fall
// back automatically if one fails, instead of giving up after one try.
const IPFS_GATEWAYS = [
  'https://ipfs.io/ipfs/',
  'https://dweb.link/ipfs/',
  'https://nftstorage.link/ipfs/',
  'https://cloudflare-ipfs.com/ipfs/',
];

function ipfsCid(url) {
  if (url && url.startsWith('ipfs://')) return url.slice('ipfs://'.length);
  return null;
}

function ipfsToHttp(url, gatewayIndex) {
  const cid = ipfsCid(url);
  if (cid) return IPFS_GATEWAYS[gatewayIndex] + cid;
  if (url && (url.startsWith('http://') || url.startsWith('https://'))) return url;
  // A local path like "images/foo.png" is relative to NFT_Data/ (where
  // nft_data.json itself lives) -- prefix with the absolute /NFT_Data/
  // root so it resolves regardless of which route this page is served at.
  return url ? '/NFT_Data/' + url : url;
}

function renderNftCard(item, domKey) {
  const key = domKey;
  document.getElementById(`title-${key}`).textContent = item.name;

  const mintNowEl = document.getElementById(`mintnow-${key}`);
  if (mintNowEl) {
    const storeUrl = ITEM_URLS[item.key];
    if (storeUrl) {
      mintNowEl.href = affiliateUrl(storeUrl);
      mintNowEl.style.display = '';
    } else {
      mintNowEl.style.display = 'none';
    }
  }

  const imgEl = document.getElementById(`img-${key}`);
  const imgEmptyEl = document.getElementById(`imgEmpty-${key}`);
  if (item.image) {
    const cid = ipfsCid(item.image);
    let gatewayIndex = 0;
    imgEl.onload = () => { imgEl.style.display = ''; imgEmptyEl.style.display = 'none'; };
    imgEl.onerror = () => {
      if (cid && gatewayIndex < IPFS_GATEWAYS.length - 1) {
        gatewayIndex++;
        imgEl.src = ipfsToHttp(item.image, gatewayIndex);
      } else {
        imgEl.style.display = 'none';
        imgEmptyEl.style.display = 'flex';
      }
    };
    imgEl.src = ipfsToHttp(item.image, gatewayIndex);
  } else {
    imgEl.style.display = 'none';
    imgEmptyEl.style.display = 'flex';
  }

  renderNftMeter(item, domKey);
}

function renderNftMeter(item, domKey) {
  const key = domKey;
  const { score, angle, arc_pct } = item.needle;

  document.getElementById(`needle-${key}`).setAttribute('transform', `rotate(${angle} 150 150)`);
  document.getElementById(`arc-${key}`).setAttribute('stroke-dashoffset', String(377 - arc_pct));

  const verdictEl = document.getElementById(`verdict-${key}`);
  if (item.verdict.mode === 'even') {
    verdictEl.innerHTML = `Roughly even right now`;
  } else if (item.verdict.mode === 'base') {
    verdictEl.innerHTML = `<span class="chainname base">Base</span> currently favors minting`;
  } else {
    verdictEl.innerHTML = `<span class="chainname ada">Cardano</span> currently favors minting`;
  }

  const goldVal = pct => `<span style="font-weight:700;color:#f2c057;text-shadow:0 0 8px rgba(242,192,87,0.5);">${pct.toFixed(1)}%</span>`;
  const oddsRow = (label, color, pct) => `
    <div class="nft-stat-row">
      <span class="tier"${color ? ` style="color:${color}"` : ''}>${label}</span>
      <span class="val">${goldVal(pct)}</span>
    </div>`;
  const oddsCol = (heading, deckOdds) => `
    <div class="nft-stat-col">
      <h3>${heading}</h3>
      ${oddsRow('Mythic', '#EB724D', deckOdds.Mythic)}
      ${oddsRow('Legendary', '#9633B3', deckOdds.Legendary)}
      ${oddsRow('Legendary or higher', '#9633B3', deckOdds.Legendary + deckOdds.Mythic)}
      ${oddsRow('Rare or higher', '#4EDFE7', deckOdds.Rare + deckOdds.Legendary + deckOdds.Mythic)}
    </div>`;
  document.getElementById(`oddsbreak-${key}`).innerHTML =
    oddsCol('Base', item.odds_breakdown.base) + oddsCol('Cardano', item.odds_breakdown.cardano);

  const TIER_COLOR = {
    Common: null,
    Uncommon: '#7ADE83',
    Rare: '#4EDFE7',
    Legendary: '#9633B3',
    Mythic: '#EB724D',
  };
  const TIERS = ['Common', 'Uncommon', 'Rare', 'Legendary', 'Mythic'];

  const col = (heading, dist) => {
    const total = TIERS.reduce((s, t) => s + dist.counts[t], 0);
    return `
    <div class="nft-stat-col">
      <h3>${heading}</h3>
      ${TIERS.map(tier => `
        <div class="nft-stat-row">
          <span class="tier"${TIER_COLOR[tier] ? ` style="color:${TIER_COLOR[tier]}"` : ''}>${tier}</span>
          <span class="val">${dist.counts[tier]} <span class="exp">(exp ${Math.round((dist.odds[tier] || 0) * total)})</span></span>
        </div>`).join('')}
    </div>`;
  };
  document.getElementById(`statgrid-${key}`).innerHTML =
    col('Base &mdash; Minted NFT Distribution', item.distribution.base) +
    col('Cardano &mdash; Minted NFT Distribution', item.distribution.cardano);
}

// ------------------------------------------------------------------
// NFT name search -- typing filters a dropdown of matching items;
// picking one (click or Enter) smooth-scrolls to that card and gives
// it a brief highlight flash so it's obvious which one matched.
// ------------------------------------------------------------------
function escapeHtml(str) {
  return String(str).replace(/[&<>"']/g, c => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
  }[c]));
}

function scrollToNftCard(target) {
  setNftMode(target.isBundle || target.inBundle ? 'bundles' : 'solo');
  const el = document.getElementById(target.isBundle ? `bundleblock-${target.bundleId}` : `cardblock-${target.key}`);
  if (!el) return;
  el.scrollIntoView({ behavior: 'smooth', block: 'center' });
  el.classList.remove('nft-highlight');
  // restart the animation even if the same card is picked twice in a row
  void el.offsetWidth;
  el.classList.add('nft-highlight');
}

function initNftSearch() {
  const input = document.getElementById('nftSearchInput');
  const results = document.getElementById('nftSearchResults');
  let activeIndex = -1;
  let currentMatches = [];

  function buildSearchCorpus() {
    // Individual items, plus one entry per unique bundle name (so typing
    // "founders" finds the bundle itself, not just its member items).
    const items = NFT_ITEMS.map(it => ({ key: it.key, name: it.name, isBundle: false, inBundle: !!it.bundle && !(it.bundle_exclusive === false && it.solo_sale) }));
    const seenBundles = new Set();
    const bundles = [];
    NFT_ITEMS.forEach(it => {
      if (it.bundle && !seenBundles.has(it.bundle)) {
        seenBundles.add(it.bundle);
        bundles.push({ bundleId: slugifyForBundle(it.bundle), name: it.bundle, isBundle: true });
      }
    });
    return [...bundles, ...items];
  }

  function renderResults(query) {
    const q = query.trim().toLowerCase();
    if (!q) {
      results.classList.remove('open');
      results.innerHTML = '';
      currentMatches = [];
      activeIndex = -1;
      return;
    }
    currentMatches = buildSearchCorpus().filter(it => it.name.toLowerCase().includes(q)).slice(0, 10);
    activeIndex = -1;

    if (!currentMatches.length) {
      results.innerHTML = `<div class="nft-search-empty">No NFT matches "${escapeHtml(query)}"</div>`;
      results.classList.add('open');
      return;
    }
    results.innerHTML = currentMatches.map((m, i) => `
      <div class="nft-search-row" data-idx="${i}">${escapeHtml(m.name)}${m.isBundle ? ' <span style="color:var(--dimmer);">(Bundle)</span>' : ''}</div>
    `).join('');
    results.classList.add('open');
  }

  input.addEventListener('input', (e) => renderResults(e.target.value));
  input.addEventListener('focus', (e) => { if (e.target.value) renderResults(e.target.value); });

  input.addEventListener('keydown', (e) => {
    if (!currentMatches.length) return;
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      activeIndex = Math.min(activeIndex + 1, currentMatches.length - 1);
      updateActiveRow();
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      activeIndex = Math.max(activeIndex - 1, 0);
      updateActiveRow();
    } else if (e.key === 'Enter') {
      e.preventDefault();
      const pick = currentMatches[activeIndex >= 0 ? activeIndex : 0];
      if (pick) {
        scrollToNftCard(pick);
        results.classList.remove('open');
      }
    } else if (e.key === 'Escape') {
      results.classList.remove('open');
    }
  });

  function updateActiveRow() {
    results.querySelectorAll('.nft-search-row').forEach(row => {
      row.classList.toggle('active', Number(row.dataset.idx) === activeIndex);
    });
  }

  results.addEventListener('click', (e) => {
    const row = e.target.closest('.nft-search-row');
    if (!row) return;
    const pick = currentMatches[Number(row.dataset.idx)];
    if (pick) scrollToNftCard(pick);
    results.classList.remove('open');
    input.value = '';
  });

  document.addEventListener('click', (e) => {
    if (!e.target.closest('.nft-search-wrap')) results.classList.remove('open');
  });
}

// ------------------------------------------------------------------
// Disclaimer modal -- shows once, then stays dismissed for a week
// (localStorage), same as the original.
// ------------------------------------------------------------------
function initDisclaimer() {
  const STORAGE_KEY = 'riseDisclaimerDismissedAt';
  const WEEK_MS = 7 * 24 * 60 * 60 * 1000;
  const overlay = document.getElementById('disclaimer-overlay');
  const dismissBtn = document.getElementById('disclaimer-dismiss');

  function shouldShow() {
    const last = localStorage.getItem(STORAGE_KEY);
    if (!last) return true;
    const elapsed = Date.now() - parseInt(last, 10);
    return isNaN(elapsed) || elapsed >= WEEK_MS;
  }

  if (shouldShow()) {
    overlay.classList.remove('hidden');
  }

  dismissBtn.addEventListener('click', function () {
    localStorage.setItem(STORAGE_KEY, Date.now().toString());
    overlay.classList.add('hidden');
  });
}

// ------------------------------------------------------------------
// React shell
// ------------------------------------------------------------------
export default function PoaTracker() {
  const [papaReady, setPapaReady] = useState(false);
  const initedRef = useRef(false);

  useEffect(() => {
    if (!papaReady || initedRef.current) return;
    initedRef.current = true;
    if (typeof window !== 'undefined') window.setNftMode = setNftMode;
    init();
    initDisclaimer();
  }, [papaReady]);

  return (
    <>
      <Script
        src="https://cdnjs.cloudflare.com/ajax/libs/PapaParse/5.4.1/papaparse.min.js"
        strategy="afterInteractive"
        onLoad={() => setPapaReady(true)}
      />

      <div id="disclaimer-overlay" className="hidden">
        <div id="disclaimer-modal">
          <h2>A Note On This Data</h2>
          <p>This tracker updates hourly and reflects our current understanding of how Infinity Rising&apos;s mint distribution and rarity system works. While we believe it to be accurate, gaps in our understanding or errors — either in how the team originally distributed rarity or in how this tracker calculates it — are possible. This tool is provided for informational purposes only, to give the community insight into the current state of open mints, and should not be considered financial advice.</p>
          <button id="disclaimer-dismiss">Got it</button>
        </div>
      </div>

      <SiteNav current="poa" />
      <div className="last-updated-bar">
        <div className="last-updated" id="lastUpdated" style={{ display: 'none' }}></div>
      </div>

      <PageHero
        eyebrow="Infinity Rising"
        title="POA Tracker"
        subtitle="Mint Favorability Meter — know your odds before you mint."
      />

      <div className="nft-page" id="nftPage">
        <div className="nft-search-wrap">
          <input type="text" className="nft-search-input" id="nftSearchInput" placeholder="Find an NFT by name&hellip;" autoComplete="off" />
          <div className="nft-search-results" id="nftSearchResults"></div>
        </div>
        <div className="recent-mints-ticker" id="nftRecentMintsTicker"></div>
        <div className="top-mints-panel" id="nftTopMintsHeader"></div>
        <div className="nft-mode-tabs">
          <button type="button" className="nft-mode-tab active" id="nftTabSolo" onClick={() => window.setNftMode('solo')}>Solo Items</button>
          <button type="button" className="nft-mode-tab" id="nftTabBundles" onClick={() => window.setNftMode('bundles')}>Bundles</button>
        </div>
        <div id="nftCardsContainer"></div>
        <div id="nftBundleContainer" style={{ display: 'none' }}></div>
        <div className="empty-state" id="nftEmptyState">
          <div className="big">No collection data yet</div>
          <div className="small">Run <code>python export_nft_json.py</code> to generate <code>NFT_Data/nft_data.json</code> from <code>NFT_Ledger.db</code> &mdash; cards populate automatically once it&apos;s present, sorted by most recent mint.</div>
        </div>
      </div>

      <footer><a href="https://x.com/RiseUGX" target="_blank" rel="noopener noreferrer" style={{ color: 'var(--dim)', textDecoration: 'none' }}>x.com/RiseUGX</a></footer>
    </>
  );
}
