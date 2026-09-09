# Coding standards

## Project structure

```
src/
  app/                     App Router routes. Each page/page.tsx is a thin wrapper:
                            metadata export + render one <FeatureApp /> component.
    api/                   Route Handlers -- see Data fetching below.
    fonts.ts                next/font/google definitions, one export per family.
    globals.css              Tailwind v4 theme tokens (@theme) + the handful of things
                            Tailwind utilities can't reach.
  components/
    <feature>/              One folder per page/feature: leaderboard/, riseTracker/,
                            poaTracker/, almanac/, home/. Contains that feature's
                            "<Feature>App" orchestrator plus its presentational pieces.
    nav/                    SiteNav -- the shared header, used by every page except home.
    shared/                 Cross-feature pieces with no page affinity (DisclaimerModal,
                            ScanlineOverlay).
  lib/
    data/                   The fetch layer that talks to the live external data source.
    <feature>/               Pure business logic + data hooks for that feature, no JSX.
  types/                   One file per feature: the TypeScript shapes for whatever
                            JSON/CSV that feature reads.
  data/                    Static content committed to the repo (not fetched at runtime).
```

Component and hook files are named for what they export (`SignedFlow.tsx` exports
`SignedFlow`, `useNftData.ts` exports `useNftData`). One primary export per file.

## Data fetching

Every page's data comes from `rise-underground.github.io` -- a live external site whose own
pipeline keeps producing fresh CSV/JSON. Nothing from it is copied into this repo except the
almanac's feature-archive content (`src/data/almanac-archive.json`, static/hand-maintained, not
pipeline output) and NFT mint images, which are linked to directly rather than mirrored.

`src/lib/data/source.ts` is the one place that knows the external base URL and every fixed
filename/folder read from it:
- `SOURCE_PATHS` -- every old-site filename and folder this app reads (leaderboard CSVs, dashboard
  JSON, NFT data, transcript folder names). If the old site's pipeline ever renames a file, or this
  project merges with the old one, this object is the only thing that needs to change -- never
  hardcode one of these strings at a call site, import it from here instead.
- `fetchSourceFile(path)` -- server-side fetch with a revalidate window, returns text + response
  headers (some pages need the real `Last-Modified` header, not just fetch time).
- `oldSiteAssetUrl(path)` -- builds an absolute URL for things rendered directly in the browser
  (`<img src>`), not proxied through this app.
- `OLD_SITE_BASE` -- the raw base URL, exported for the one caller (the almanac manifest route)
  that needs to build its own URLs for HEAD requests rather than going through the two helpers
  above.

From there, two patterns depending on the data:

**Server Component fetches, passes props to a Client Component.** Use this when the data is
small and/or has SEO value. `leaderboard/page.tsx` is the model: an async Server Component calls
a typed fetcher in `src/lib/data/`, passes the result as props into `LeaderboardApp`
(`"use client"`), which owns all interactivity.

**Route Handler + client-side fetch.** Use this when the data is large and only feeds client-side
rendering (charts, full-text search over megabytes of transcript) with no SEO value -- fetching it
server-side and passing it through props would just bloat the page's initial payload.
`src/app/api/<name>/route.ts` calls `fetchSourceFile` and passes the response through; a client
hook in `src/lib/<feature>/` (e.g. `useDashboardData`, `useAlmanacTranscripts`) fetches that
same-origin route. Route Handlers are also where it's worth doing expensive work server-side and
caching it via `export const revalidate = <seconds>` -- see `api/almanac/manifest/route.ts`, which
parallelizes and caches an otherwise-slow discovery probe so no visitor's browser has to repeat it.

Pick server-props for small/SEO-relevant data (the default -- most pages should start here),
client-fetch-via-route only once the data genuinely is large and chart-or-search-only. POA
tracker originally used the route pattern by default, copying RISE tracker without re-checking
whether it applied -- its actual data is ~60KB of real content (item names, odds, images), not
megabytes of chart-only numbers, so it was moved to the server-props pattern instead
(`src/lib/data/poaTracker.ts`).

**Split, when one page has both.** RISE tracker's stat grid (hero numbers, chain flow windows,
migration, circulating supply -- all real content, all small) used to sit behind the same client
fetch as its 3 charts (which need a multi-year time series, ~2MB, genuinely chart-only). That
meant real numbers were stuck behind a loading state for no reason other than sharing a component
with the charts. Split into two independent fetches of the *same* underlying files:
`src/lib/data/riseTracker.ts`'s `fetchRiseTrackerSummary()` re-derives just the small summary
numbers server-side (still only reading the same cached source, so no extra load), passed as page
props so the stat grid renders with no loading state at all; `useDashboardData.ts` still
client-fetches the full series for the charts only, exactly as before. When a page mixes real
content with genuinely large chart/search-only data, don't let the large part's fetch strategy
dictate the small part's -- split them.

## Component conventions

- Each feature's `<Feature>App` component is the orchestrator: owns state, calls data hooks,
  composes presentational children. It's the only component in a feature folder that needs to
  know how everything fits together.
- Presentational components take plain props and render markup -- no data fetching inside them.
- **Business logic lives in `src/lib/<feature>/`, not in components.** Competition-window math,
  standings aggregation, archive text parsing, flow-series math -- all plain TypeScript functions,
  independently readable and (if it ever comes to it) testable, that components just call.
- Small formatting/presentation helpers that get reused (e.g. `SignedFlow`, coloring a value green
  or red by sign) are their own component, not inline logic repeated at every call site.

## TypeScript

- Types for a feature's data shapes live in `src/types/<feature>.ts`.
- Importing a local JSON file typed against a hand-written interface needs the double cast
  (`data as unknown as ArchiveCategory[]`) -- TypeScript's inferred literal type from the JSON
  won't structurally match a hand-written one.
- Guard optional/inconsistent fields defensively (`item.citationLinks?.[c]`) rather than assuming
  every record is complete -- real data has gaps the types should acknowledge, not paper over.

## React / state patterns

- Files that use hooks or handle interaction start with `"use client"`. Presentational children
  of a client component don't need their own directive -- they inherit the client boundary.
- **Ticking values (clocks, countdowns, "N minutes ago" text) initialize state directly in
  `useState(() => ...)`, never inside a `useEffect` body** -- the `react-hooks/set-state-in-effect`
  lint rule flags a synchronous `setState` as the first thing an effect does. The effect's only
  job is to `setInterval`/subscribe. See `CountdownClock.tsx`, `LastUpdatedClock.tsx`,
  `useCountUp.ts` for the pattern.
- Because a ticking value's initial render differs between server and client, give the specific
  text node that shows it `suppressHydrationWarning` rather than fighting the mismatch.
- A read from a browser-only API (`localStorage`, etc.) that can't run during SSR genuinely does
  belong in an effect -- see `DisclaimerModal.tsx`'s `eslint-disable-next-line` with a comment
  explaining why that one is the real exception.

## Styling

- Tailwind v4. Theme tokens (colors, fonts) are defined once in `globals.css`'s `@theme` block --
  see DESIGN-SYSTEM.md for the full token list. **Colors always go through a named token**
  (`text-crimson`, `bg-panel`) -- never a raw hex value in a className. Arbitrary-value utilities
  (`text-[13px]`, `top-[27px]`) are used freely for one-off sizing/spacing to match an exact
  design, that's fine.
- Reach for plain CSS in `globals.css` only for what Tailwind utilities genuinely can't express --
  `::-webkit-slider-thumb`/`::-moz-range-thumb` pseudo-elements, `@keyframes`. Comment why it's
  there.
- Use `min-h-screen` (not `min-h-full`) for anything that needs to fill at least the viewport
  height -- `min-h-full` depends on the entire `html`/`body` percentage-height chain resolving
  correctly, which is easy to get subtly wrong; `min-h-screen` doesn't depend on any ancestor.
- A fixed-height reserved slot (rendered whether or not its content is present) is the fix when
  optional content would otherwise shift a layout around it -- see `SiteNav`'s `right` slot.

## Feature-specific notes

Things worth knowing before touching a given feature that aren't obvious from the code alone.

**Leaderboard**: competition-window math (`competitionWindow.ts`) has to stay in sync with
whatever external process decides the actual competition schedule -- if that schedule logic moves
or changes, this is the other half that needs updating. No dev-only way to preview the
countdown/opportunities-panel UI outside a real competition window currently exists; add one
(a query param or env flag) if that becomes a recurring need.

**RISE tracker**: data fetching is split (see Data fetching's "Split, when one page has both"). The
stat grid comes from `fetchRiseTrackerSummary()` (server props, `RiseTrackerApp`'s `summary`/
`flowWindows`/`volumeWindows`/`error`/`poolError` props); the 3 charts still use `useDashboardData()`
(client-fetched `chartData`/`chartPoolData` inside the same component). `pool_summary.json` failing
is non-fatal in both halves -- the trading-volume/Minswap sections show "N/A", chart-side the
Minswap line just doesn't draw -- while the main dashboard dataset failing is fatal for whichever
half it broke. Keep that non-fatal split if you touch either fetcher; don't make one data source's
failure take down sections that don't need it. Chart.js is registered once, globally, in
`chartSetup.ts` -- import from there rather than calling `Chart.register()` again in a new chart
component.

**POA tracker**: fetched server-side (`src/lib/data/poaTracker.ts`'s `fetchPoaTrackerData()`,
called from `poa-tracker/page.tsx`) -- same pattern as the leaderboard, not RISE tracker's
client-fetch-via-route pattern; see the Data fetching section above for why. NFT mint images are
linked to directly (`GatewayImage.tsx`, via `oldSiteAssetUrl()` or an IPFS gateway) rather than
mirrored into this repo -- one source of truth, no sync step to forget if the image set changes.
Search (`PoaSearchBox.tsx`) indexes solo-sale items and bundle names, not individual
bundle-exclusive members -- those are still visible inside their bundle's card, just not a
distinct search target. Widen that if per-member search turns out to matter.

**Almanac**: two datasets, handled differently.
- Episode transcripts are fetched client-side, straight from the external site
  (`useAlmanacTranscripts.ts`) -- full-text search needs everything in memory, so there's no way
  around that. Which episodes exist is discovered by `api/almanac/manifest/route.ts`
  (`export const revalidate = 3600`), which parallelizes the discovery probe and caches the result
  so it only actually re-runs once an hour, not on every visit.
- The feature archive (`src/data/almanac-archive.json`, 706 items / 22 categories) is
  hand-maintained content, not pipeline output, and isn't fetched live -- it's a point-in-time file
  committed to this repo. There's no script that regenerates it yet; if it needs to be edited
  going forward, either hand-edit the JSON directly (each item: `name`, `desc`, `status`,
  `citationLinks`) or write a small script once the source of truth for this content is decided.
  Known gap: the schema supports categories split into `subs` (nested sub-groups) as well as flat
  `items`; nothing currently uses `subs`, so `ArchiveCategory.tsx` doesn't render them -- add that
  case back in if a future category needs it.

## Adding a page or feature

1. Add/extend a typed fetcher (or Route Handler + client hook, per the Data fetching patterns
   above) in `src/lib/data/` or `src/lib/<feature>/`, and the matching types in `src/types/`.
2. Build the route under `src/app/<page>/page.tsx` (thin wrapper) plus a `<Feature>App` component
   in `src/components/<feature>/`, using `SiteNav` and the existing Tailwind tokens.
3. Only add new tokens to `globals.css` if the feature genuinely needs its own accent system (as
   RISE tracker and leaderboard do) -- default to the existing site-wide tokens otherwise.
4. Give the page a `metadata.openGraph` block (see SEO below) and add its path to `sitemap.ts`.
5. Update DESIGN-SYSTEM.md and this file if the feature introduces a new pattern worth reusing.

## SEO

- `src/lib/siteConfig.ts` holds `SITE_URL` (used as `metadataBase` in the root layout, so every
  relative OG/image path resolves to an absolute URL) and `SITE_NAME`. Not deployed yet, so
  `SITE_URL` falls back to a placeholder -- set the `NEXT_PUBLIC_SITE_URL` env var once a real
  domain exists; nothing else needs to change.
- Every page sets its own `metadata.openGraph` (type, siteName, title, description, url, images) --
  Next.js metadata doesn't deep-merge `openGraph` from a parent layout, so a page that skips this
  silently falls back to the root layout's (the home page's) OG data instead of its own. `twitter`
  is the one exception left to inherit from the root layout, since every page uses the same
  `summary_large_image` card and no page sets its own `twitter:title`/`twitter:image` -- Next fills
  those in from `openGraph` automatically when absent.
- Per-page OG images live in `public/assets/` (`Index.jpg`, `leaderboards.jpg`, `almanac.jpg`,
  `poa_tracker.jpg`, `rise_tracker.jpg`) -- mirrored into this repo rather than linked to the old
  site, since a social-media crawler fetching a card image has no reason to depend on that site
  staying up.
- `src/app/sitemap.ts` and `src/app/robots.ts` are Next's file-convention metadata routes -- they
  generate `/sitemap.xml` and `/robots.txt` from `SITE_URL`, no static files to hand-maintain. Add
  a page's path to `sitemap.ts`'s `ROUTES` array when adding a page.
- The full favicon set (`favicon.ico`, `favicon-16x16.png`, `favicon-32x32.png`,
  `apple-touch-icon.png`, `android-chrome-*.png`, `site.webmanifest`) lives in `public/` with the
  filenames a favicon generator produces. Next's file-convention auto-detection only fires for
  files named exactly `icon.*`/`apple-icon.*` inside `src/app/`, not these names in `public/`, so
  the root layout's `metadata.icons`/`metadata.manifest` reference them explicitly instead. If this
  set is ever regenerated, keep the filenames as-is (or update the layout's references to match).
  `site.webmanifest`'s `name`/`short_name`/`theme_color`/`background_color` were hand-edited after
  generation to match the site's actual name and dark palette -- a regenerated manifest will reset
  those to generic placeholders, so re-apply them.

## Checking your work

```bash
npm run build     # production build + typecheck
npx eslint .       # lint
```

See `/SETUP.md` if you hit environment-specific issues (e.g. running on a WSL-backed drive on
Windows).

## Deployment

Not deployed yet -- no GitHub remote or Vercel project configured (local git repo only, on
`main`). Planned: push to GitHub, connect a Vercel project to it for auto-deploy on push. See
`/SETUP.md` for the walkthrough once that's set up.
