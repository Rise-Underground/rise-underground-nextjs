# RISE Underground -- project docs

Next.js 16 / React / TypeScript / Tailwind v4 site for RISE Underground. App Router, 5 pages:
home, leaderboard, RISE tracker, POA tracker, almanac.

- **[CODING-STANDARDS.md](CODING-STANDARDS.md)** -- project structure, data-fetching patterns,
  component conventions, TypeScript/React patterns, styling rules, and per-feature implementation
  notes worth knowing before touching that feature.
- **[DESIGN-SYSTEM.md](DESIGN-SYSTEM.md)** -- color tokens, typography, layout/component patterns,
  motion, icons.
- **[/SETUP.md](../SETUP.md)** (repo root) -- plain-language setup/run/deploy guide, written for
  the non-technical site owner, not just other developers.

## Keep these current

**Update the relevant doc whenever you ship a feature or make a structural/architectural change**
-- new page, new data source, new shared pattern, a convention you deviated from. Keep them
describing what's actually in the codebase right now, not a history of how it got there -- no
changelog entries, no "previously X, now Y." If something in here turns out to be wrong or stale,
fix or remove it rather than leaving it for the next reader to discover the hard way.

## Orientation

- `src/app/` -- routes (App Router). Each page's `page.tsx` is a thin wrapper that renders one
  `<PageName>App>` component from `src/components/<feature>/`.
- `src/components/` -- one folder per feature (`leaderboard/`, `riseTracker/`, `poaTracker/`,
  `almanac/`), plus `nav/` and `shared/` for cross-page pieces.
- `src/lib/` -- data fetching (`lib/data/`) and pure business logic, one folder per feature.
- `src/types/` -- TypeScript types, one file per feature.
- `src/data/` -- static content committed to this repo (currently just the almanac's feature
  archive).

Most page data is fetched live, at request or build time, from `rise-underground.github.io` (an
external site with its own data pipeline, which is being retired). See CODING-STANDARDS.md's Data
fetching section for how and why -- when that site goes away, the fetch layer in `src/lib/data/`
and each feature's data hook/route is what needs to change.
