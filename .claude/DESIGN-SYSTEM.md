# Design system

Dark, gold/crimson "vault" aesthetic, consistent across all 5 pages: same header, same scanline
texture, same badge/panel/card language -- each data-heavy page (leaderboard, RISE tracker) also
carries its own accent palette on top, kept distinct rather than flattened into one universal
theme (see "Page accent palettes" below).

All tokens are defined once in `src/app/globals.css`'s `@theme` block. **Always reference a color
by its token** (`text-gold`, `bg-panel`) -- never a raw hex value in a className.

## Site-wide tokens

| Token | Hex | Use |
|---|---|---|
| `--color-void` | `#0a0908` | Base page background (home, POA tracker, almanac) |
| `--color-void-deep` | `#050403` | Deepest black accent (e.g. range-slider thumb border) |
| `--color-panel` | `#14120f` | Card/panel background |
| `--color-panel-2` | `#1c1712` | Nested/secondary panel background |
| `--color-line` | `#2a241c` | Default border color, incl. the shared `SiteNav` header |
| `--color-ink` | `#ede6d6` | Primary text color, everywhere |
| `--color-dim` | `#8a8175` | Secondary/muted text |
| `--color-dimmer` | `#564f43` | Faintest text (captions, placeholders) |
| `--color-gold` | `#d9a441` | Primary accent -- active nav state, headings, emphasis |
| `--color-gold-bright` | `#f2c057` | Brighter gold for hover states and high emphasis |
| `--color-crimson` | `#c81e1e` | Secondary accent; also POA tracker's "Cardano" gauge color |
| `--color-crimson-dim` | `#7a1414` | Subtle crimson (underlines, dim accents) |
| `--color-base-chain` | `#6f8fc4` | POA tracker's "Base" gauge color |

## Almanac citation colors

One color per citation source series, used only by `CitationChip`/`ArchiveItem`:

| Token | Hex | Source |
|---|---|---|
| `--color-cite-cr` | `#c8503a` | Cafe Rise / Copi Cafe |
| `--color-cite-op` | `#4a90d9` | Origin Point |
| `--color-cite-ama` | `#9b6fd6` | Ask Me Anything |
| `--color-cite-tdoc` | `#d9a441` | Tokenomics Document |
| `--color-cite-dgc` | `#3fb8a3` | Discord General Chat |
| `--color-cite-default` | `#8a8378` | Unrecognized citation prefix |

## Page accent palettes

Leaderboard and RISE Tracker each carry their own background/accent system, layered on top of the
site-wide tokens above rather than replacing them (their content areas use these; their header
still uses the site-wide tokens via `SiteNav`).

**Leaderboard** (asphalt + medal colors):
`--color-asphalt` `#0a0a0b`, `--color-asphalt-2` `#131315`, `--color-asphalt-panel` `#18181b`,
`--color-hairline` `#29292c` (this page's own border color), `--color-steel` `#8f8d8a` (muted
text), `--color-silver` `#c9ccd1` and `--color-bronze` `#cd7f32` (rank 2/3 medal colors -- rank 1
uses `--color-gold-bright`).

**RISE Tracker** (chain-dashboard palette):
`--color-tracker-bg` `#090b10`, `--color-tracker-surface` `#12151c`,
`--color-tracker-surface-2` `#171b24`, `--color-tracker-border` `#232838`,
`--color-tracker-muted` `#7c8494` (muted text), `--color-ember` `#ff7a29` (primary accent),
`--color-ice` `#8fa8ff`, `--color-violet` `#b98aff`, `--color-violet-2` `#5fe0d0` (chart series
colors), `--color-tracker-green` `#35d07f` / `--color-tracker-red` `#ff5468` (signed-value
coloring -- see `SignedFlow`).

## Typography

Three roles, six loaded families (`src/app/fonts.ts`, all via `next/font/google`):

| Role | Family | Tailwind class | Where |
|---|---|---|---|
| Display (vault pages) | Oswald | `font-oswald` | Home, POA tracker, almanac headings/labels/badges |
| Display (dashboard pages) | Rajdhani | `font-rajdhani` | Leaderboard headings, `SiteNav` link labels site-wide |
| Display (RISE tracker) | Space Grotesk | `font-space-grotesk` | RISE tracker headings, stat numbers |
| Mono (dashboard pages) | JetBrains Mono | `font-jetbrains-mono` | Leaderboard + RISE tracker labels, data, timestamps |
| Mono (vault pages) | IBM Plex Mono | `font-ibm-plex-mono` | POA tracker + almanac labels, data, timestamps |
| Body/reading | Tailwind's default `font-serif` stack | `font-serif` | Almanac archive item names/descriptions -- a deliberate Georgia-esque reading face, not a loaded custom font |

**Known gap:** Inter is loaded (`font-inter`) but not currently applied anywhere -- general body
copy renders in Tailwind's default sans stack instead. Apply `font-inter` where body copy needs a
deliberate face, or drop the unused font load, next time this is touched.

Headings/labels are almost always `uppercase` with letter-spacing (`tracking-[0.05em]` to
`tracking-[0.35em]` depending on size) -- that tracked-uppercase treatment is a big part of the
site's voice; don't set a heading in normal case without a specific reason.

## Layout & components

- **Header**: `SiteNav` is the one shared header, used by every page except home (which has its
  own full-bleed hero instead). Structure: logo + brand title/tagline lockup (left) -- nav links
  (right, vertically centered with the logo) -- mobile hamburger button. A page-specific extra
  (season tag, last-updated text) goes in the optional `right` prop, rendered in its own row
  *below* the main bar in a fixed-height slot that's always reserved -- so the main bar never
  shifts between pages whether or not `right` is passed. Sticky (`sticky top-0`), translucent
  background with `backdrop-blur-sm`.
- **Page containers**: each page wraps its content in a `max-w-[...]` container sized to that
  page's content (`880px` leaderboard, `900px` almanac search, `1400px` POA tracker,
  `2200px` RISE tracker) -- there's no single global content width, each page picks what fits.
- **Cards/panels**: `rounded-*` + `border border-line` (or page-specific border token) +
  `bg-panel`/`bg-tracker-surface`/etc. Nest a second, slightly different panel shade
  (`bg-panel-2`) for content inside a card, not a second border.
- **Badges/chips**: small, `rounded-[2px]`–`rounded-md`, bordered, uppercase mono or display text,
  colored via a token. Used for status labels (`ArchiveItem`'s Complete/WIP/Partial/Pivoted),
  citations (`CitationChip`), rank medals, chain labels.
- **Reserved-space slots**: when optional content would otherwise shift a layout if present vs.
  absent, reserve fixed height for it always (see `SiteNav`'s `right` slot) rather than letting
  layout jump between pages/states.
- **Responsive**: Tailwind's `sm`/`md` breakpoints for most things; a few custom arbitrary
  breakpoints (`min-[701px]`, `min-[1300px]`, `min-[1500px]`) where a component's own content
  (not the general site grid) dictates where it should reflow.

## Motion

- `rise-in` keyframe (`globals.css`): opacity+translateY reveal, used for the home page's
  staggered logo -> tagline -> menu -> footer sequence via different `animation-delay`s. Respects
  `motion-reduce:` (Tailwind variant) to disable for users who ask for less motion.
- Count-up animation (`useCountUp`): eases a number from 0 to its target over ~1.1s using
  `requestAnimationFrame`, used for RISE tracker's hero stats.
- Recent-mints marquee (`RecentMintsTicker`): continuous `requestAnimationFrame`-driven scroll,
  not CSS `@keyframes` -- needed so it can be interrupted for dragging. Draggable via Pointer
  Events (mouse + touch), pauses on hover or while dragging, resumes from wherever it was left.
- Ticking clocks (`CountdownClock`, `LastUpdatedClock`, `LastUpdatedText`) update on an interval,
  not an animation -- see CODING-STANDARDS.md for the state pattern.

## Icons

No icon library -- every icon is a small inline `<svg>` with `stroke="currentColor"` (or
`fill="currentColor"` for solid marks like the X/Twitter logo), sized directly in the markup.
Keep new icons the same way: inline, minimal, colored via `currentColor` so they pick up whatever
text color context they're placed in.
