# VoidFrame — Design System

The single source of truth for every visual, typographic, spatial, and motion
decision on the site. All values below are extracted from the live code —
file references point at where each token is actually defined. When code and
this document disagree, fix one of them; never let them drift.

> **Brand in one line:** black is the canvas ("the Void"), one yellow is the
> signal, a 48-column grid is the frame, and motion is the voice. Nothing
> snaps, nothing floats, nothing is decorated that doesn't direct attention.

---

## 1. Brand principles

| # | Principle | Meaning | Token |
|---|-----------|---------|-------|
| a | **The Void** | Black is not empty — it's the canvas where attention lives. Start from darkness and add only what earns its place. | `#0A0A0A` |
| b | **The Signal** | One yellow, used like ink: the reveal, the highlight, the cursor's trace. Never decoration — always direction. | `#FFE500` |
| c | **The Frame** | A 48-column grid runs through every dark section. Nothing floats; every edge lands on a line. Structure is the brand. | `48 COL` |
| d | **The Motion** | Nothing snaps. Ink bleeds, images bloom from center, panels ease under. Movement is how VoidFrame speaks. | `cubic-bezier(0.16, 1, 0.3, 1)` |

Source: `components/BrandIdentity.tsx` (the principles are canon even while
the section itself is unmounted).

---

## 2. Color

### 2.1 Core palette

| Token | Value | Name | Role |
|-------|-------|------|------|
| `--color-bg` | `#FFE500` | Signal Yellow | Page background, selection highlight, accent strips, active-card underline. The ONE accent — never introduce a second. |
| `--color-void` | `#0A0A0A` | Void Black | Dark section background (HowWeWork, BridgeText, ClientsList, footer fallback) |
| `--color-surface` | `#111111` | Surface | Reserved elevated-surface tone on dark |
| `--color-border` | `#1F1F1F` | Border | Hard borders on dark, scrollbar thumb |
| `--color-muted` | `#71717A` | Muted | Reserved muted foreground |
| `--color-accent` | `#E8E0D0` | Bone | Body text color on `<body>` (dark contexts) |
| — | `#FFFFFF` | Frame White | Text and rules on dark, hover band fill |

Defined in `app/globals.css` under `@theme` — reference as Tailwind classes
(`bg-bg`, `text-bg`) or `var(--color-*)`. Never hardcode `#ffe500` elsewhere.

### 2.2 Alpha ramps (the real workhorses)

On dark (`white/α`):

| Alpha | Usage |
|-------|-------|
| `0.035` | Card fill (`CARD_BG`, HowWeWork services) |
| `0.06` | Card border (`CARD_BORDER`) |
| `0.10` | **Grid rules** (`GRID_LINE_COLOR`) — identical in every dark section |
| `0.15` / `0.20` | Input borders, CTA outline (`border-white/25`) |
| `0.40` | Placeholder text, underline decoration at rest |
| `0.60` | Labels, meta, section markers (`text-white/60`) |
| `0.70` / `0.72` | Secondary row text, body copy (`BODY_COLOR`) |
| `0.80` | Footer body text |
| `0.92` | Emphasized labels (`LABEL_COLOR`) |
| `1.00` | Headlines, `<strong>`, active text |

On yellow (`black/α`):

| Alpha | Usage |
|-------|-------|
| `0.14` | Grid rules on yellow (inverted panel theme) |
| `0.40` | Underline decoration |
| `0.50` | Scramble description, scroll cue |
| `0.60` | Category/meta text, links |
| `0.70` | Hero description |
| `0.92` | Labels on yellow |
| `1.00` | Headings, primary text |

### 2.3 Theme inversion

Dark panels have an exact yellow mirror (`THEMES.dark` / `THEMES.yellow` in
`components/HowWeWork.tsx`). Inversion is a *true palette swap* — same
markup, every color re-mapped — not a background swap. The header inverts
pills the same way: sections carry `data-header-theme="dark"` and the header
flips `bg-black text-white` ⇄ `bg-white text-black` when one covers its
midline (`components/Header.tsx`).

### 2.4 Imagery treatment

Project imagery sits under a bottom-up scrim: `bg-linear-to-t from-black/70
via-black/10 to-transparent`, faded in with scroll progress. Footer footage
sits under a flat scrim `rgba(0,0,0,0.55)` (`SCRIM_OPACITY`).

---

## 3. Typography

### 3.1 Families

| Stack | Font | Weights | Loaded via | Role |
|-------|------|---------|-----------|------|
| `font-sans` (`--font-pp-mori`) | **PP Mori** (local) | 200, 400, 600 (+ italics) | `next/font/local`, `app/layout.tsx` | Everything by default: headlines, body, UI |
| `font-display` (`--font-anton`) | **Anton** (Google) | 400 | `next/font/google` | Display accents only — currently the active-project name in the carousel info bar |
| `font-mono` | Tailwind default mono stack | — | — | Data voice: labels, client rows, scramble text, footer nav labels, captions |
| — | NibPro (`app/fonts/NibPro-Regular.woff2`) | 400 | **not loaded** | Available on disk, unused. Load through `next/font/local` before referencing. |

`font-weight: 400` is the body default (`app/globals.css`). `font-bold`
(700) on the hero resolves to PP Mori SemiBold 600 — the heaviest cut we ship.

### 3.2 The three voices

1. **Statement voice** — PP Mori SemiBold, uppercase, tight leading
   (0.92–1.1), tracking −1% to tighter. Hero, HowWeWork headline, BridgeText.
2. **Display voice** — Anton, uppercase, `font-black`. Used sparingly for a
   single loud word or name.
3. **Data voice** — mono, uppercase, wide tracking (`0.15em`–`0.25em`),
   small sizes, often wrapped in parentheses: `( Selected Projects )`,
   `(a.) CONTACT`. This parenthesis convention marks every section label and
   index on the site — keep it.

### 3.3 Type scale (as shipped)

| Style | Mobile (<768px) | Desktop (≥768px) | Weight / case / tracking | Where |
|-------|-----------------|------------------|--------------------------|-------|
| Hero heading | `17vw`, lh `0.92`, one word per line | `text-6xl` (60px), lh 1, words in a row | bold(600), uppercase, `tracking-tighter` | `Hero.tsx` |
| BridgeText statement | `clamp(2rem, 9.5vw, 3.5rem)` | `clamp(1.75rem, 5vw, 4.75rem)` | semibold, uppercase, lh `0.98`, ls `-0.01em` | `BridgeText.tsx` (`.brdg-copy`) |
| HowWeWork headline | `clamp(1.0625rem, 4.6vw, 1.5rem)` | `clamp(1.5rem, 2.6vw, 2.5rem)` | semibold, sentence case, lh `1.1`, ls `-0.01em`, first-line indent `12.5%` | `HowWeWork.tsx` (`.hww-headline`) |
| Project name (info bar) | `text-xl` | `text-3xl` | Anton, `font-black`, uppercase | `RecentProjects.tsx` |
| Footer email CTA | `text-xl` | `text-2xl`/`text-3xl` | medium, underline offset 8 | `Footer.tsx` |
| Body copy | `text-sm leading-relaxed` | same | regular 400 | HowWeWork copy, footer columns |
| Section label | `text-xs`, uppercase, `tracking-[0.2em]`–`[0.25em]` | same | mono or sans, `/60` alpha | all sections |
| Row text (clients) | `text-sm`, mono, uppercase, `tracking-wider` | same | — | `ClientsList.tsx` |
| Micro | `text-[9px]`–`text-[11px]`, `tracking-widest`/`wider` | same | card indices, mobile card names, preview captions | various |

**Never go below 16px (`text-base`) on form inputs** — smaller triggers iOS
focus zoom (`Footer.tsx` newsletter input: `text-base md:text-sm`).

---

## 4. Layout & grid

### 4.1 The 48-column frame

Every dark section draws its own vertical rules from the **same spec** so
they read as one continuous grid running down the page:

```css
GRID_COLUMNS: 48
GRID_LINE_COLOR: rgba(255,255,255,0.10)   /* rgba(0,0,0,0.14) on yellow */
/* pattern: a 48-col CSS grid of <span>s, border-left each + border-right on the track */
```

Content in these sections is placed **on the same track** (`grid-column: X /
span N`) so card edges, labels, and copy always land on a line. Never
position content in a ruled section with arbitrary margins — put it on the
track. (See `.hww-grid`, `.cl-row`, `.bi-principles`.)

### 4.2 Section edge padding

```css
SECTION_PADDING_X: clamp(16px, 4vw, 40px)   /* identical in every section */
```

### 4.3 Viewport & scroll architecture

- Pinned sections: `position: sticky; top: 0` inside a tall scroll track,
  height **`h-dvh`** (never `h-screen` — mobile URL-bar collapse would crop
  or gap the panel).
- Scroll tracks: combined Projects+HowWeWork track `280vh` with phase splits
  `RECENT_END 0.4 → HOLD_END 0.62 → SLIDE_END 0.92` (`app/page.tsx`);
  BridgeText `200vh`.
- Scroll math always derives progress from `getBoundingClientRect()` against
  `window.innerHeight`, rAF-throttled, passive listeners.
- Smooth scroll: Lenis, `duration: 1.2`, easing `1.001 - 2^(-10t)`, wheel
  only (touch stays native) — `components/LenisProvider.tsx`.
- ⚠️ Scroll-driven inline styles must have **no CSS transition** attached —
  a transition retargeting every scroll tick reads as "stuck" (documented
  bug in `RecentProjects.tsx`).

### 4.4 Z-index scale

| z | Layer |
|---|-------|
| `z-80` | Fixed header |
| `z-40` | Floating mobile preview card (clients) |
| `z-20` | HowWeWork sliding panel; clients accent strip |
| `z-10` | Section headings, clients center image, footer content |
| `z-5` | Carousel row |
| `z-[1]` / `z-0` | Grid rules over scrims / canvas backdrops |

### 4.5 Spacing constants (px)

| Token | Value | Where |
|-------|-------|-------|
| `THUMB_GAP` | 8 | Carousel card gap |
| `HEADING_GAP` | 24 | Heading ↔ row |
| `INFO_MARGIN_Y` | 40 | Info bar from viewport bottom |
| `COLLAPSED_BOTTOM_MARGIN` | 80 | Thumb strip from bottom |
| `LOWER_LABEL_GAP` | 20 | Labels ↔ cards (HowWeWork) |
| `LOWER_HEIGHT` | 311 | Fixed lower block height (desktop HowWeWork) |
| Card padding | `clamp(14px,2vw,24px) clamp(12px,1.8vw,22px)` | Service cards |
| Panel padding-top | `clamp(76px,11svh,104px)` | Clears fixed header |
| Panel padding-bottom | `clamp(28px,5svh,56px)` | — |

### 4.6 Radii

| Radius | Usage |
|--------|-------|
| `rounded-full` | Pills/CTAs (header, contact button) |
| `rounded` (4px) | Carousel image cards |
| **none** | Everything on the dark grid: service cards, inputs, buttons, preview card — dark sections are sharp-cornered |

---

## 5. Motion

### 5.1 The ease

```css
--ease-brand: cubic-bezier(0.16, 1, 0.3, 1)   /* expo-out; THE curve */
```

Used by: hero letter/chunk reveals, image center-wipes, clip reveals,
floating preview card. Simple color/opacity hovers use default `ease` at
fast durations. Lenis handles scroll feel.

### 5.2 Duration scale

| ms | Usage |
|----|-------|
| 150 | Hover bands, row text color flips |
| 300 | Header theme flip, canvas fade-in |
| 350 | Floating preview card in/out |
| 500 | Scramble text lock-in; carousel card width on hover |
| 650–700 | Hero letter reveal (650); image center-wipe + settle-zoom (700); clients image open/shut (650) |

### 5.3 Stagger scale

| Value | Usage |
|-------|-------|
| 26ms/letter | Hero heading sweep |
| 90ms/chunk | Hero description (3-word chunks) |
| 300ms | Delay before description follows heading |

Reveals sweep left→right; hides run the same sweep reversed (last letter
first) — an undo, not a mirror.

### 5.4 Physics constants

| Constant | Value | Meaning |
|----------|-------|---------|
| `CAROUSEL_SPEED` | 60 px/s | Infinite drift |
| `CAROUSEL_EASE` | 6 | Velocity ease toward target |
| `SWIPE_FRICTION` | 2.5 | Flick decay (lower = longer glide) |
| `MAX_SWIPE_SPEED` | 2500 px/s | Flick cap |
| `HOVER_CARD_SCALE` | 1.5 | Hovered card width multiplier |
| Ink: stamp radius 20, spacing 10px, life 1.6s, pool 64 | — | Cursor ink trail |

### 5.5 Signature moves (the brand's motion vocabulary)

1. **Letter-sweep reveal** — per-letter y-mask reveal with linear stagger (hero).
2. **Scramble/decrypt** — random chars locking in left→right over 500ms (project descriptions).
3. **Ink trail** — cursor stamps goo-fused, turbulence-displaced yellow blots through black (`#hww-ink-mask`). **Desktop/mouse only** — the SVG filter pipeline is skipped entirely on touch (it flickers on mobile GPUs; an autonomous-reveal variant was tried and removed).
4. **Center-wipe** — images bloom from their center line: `clip-path inset(50% …) → inset(0)` + settle-zoom from `scale(1.18)`.
5. **Word-fill** — BridgeText words brighten `0.2 → 1.0` alpha as a scroll-driven head sweeps past, `SPREAD: 5` words of soft edge.
6. **Panel slide-under** — HowWeWork translates X `100% → 0` over the pinned viewport; interactive only past `progress 0.05`.
7. **Frame-scrub** — footer canvas scrubs 45 webp frames over one viewport of entrance scroll.

---

## 6. Interaction doctrine (desktop vs touch)

Hover is a *desktop-only* enhancement. Every hover behavior has a named
touch replacement — never ship a hover-only feature:

| Desktop (hover/cursor) | Touch replacement | File |
|---|---|---|
| Hover card → widen + pause drift + select | **Tap-to-select** (≤10px travel, ≤400ms); names printed on cards; yellow underline on active | `RecentProjects.tsx` |
| Cursor ink trail reveals yellow layer | Nothing — panel stays black (reveal is skipped wholesale) | `HowWeWork.tsx` |
| Row hover → white band + center image | **Scanline**: row crossing viewport center self-highlights + floating preview card (bottom-right, above safe area) | `ClientsList.tsx` |
| — | `( Scroll )` cue on the hero | `Hero.tsx` |

Rules:

- Detect touch with `matchMedia("(hover: none)")` via `useSyncExternalStore`
  (SSR snapshot: `false`).
- **Guard every `onMouseEnter/Leave`** with the touch flag — mobile browsers
  fire emulated mouse events after taps (an unguarded enter froze the
  carousel drift permanently).
- Horizontal gestures on the carousel use `touch-action: pan-y` + pointer
  capture; vertical scroll always stays native.
- Animation loops write refs/DOM attributes inside rAF — no React re-render
  per frame, ring buffers over DOM churn.

---

## 7. Component recipes

### Pills / CTAs
`rounded-full px-4 py-2 text-sm font-semibold` (md: `px-6 py-2 text-base`).
Light context: `bg-black text-white`; dark context: inverted. Outline
variant (dark sections): `border border-white/25 px-6 py-3 text-sm
hover:bg-white hover:text-black`.

### Section label
`text-xs uppercase tracking-[0.2em]` at `/60` alpha, parenthesized:
`( Selected Clients )`. Indexed items use `(a.)`, `(b.)` … or `01`, `02` ….

### Service card (dark grid)
Fill `white/0.035`, border `white/0.06`, sharp corners, title top-left in
`text-sm`, tall empty body. Sits on 6 columns of the 48-track with 2-column
gutters (desktop) or 2-up (mobile, min-height 74px).

### Hover band (list rows)
30px-tall white band centered on the row (not full row height), text flips
to black; where the band crosses an image, a Signal Yellow strip of the same
height continues it.

### Links
`underline decoration-white/40 underline-offset-4..8, hover:decoration-white`
(mirror alphas on yellow). External links append `↗`.

### Buttons (dark, footer)
Sharp `border border-white/30 px-4 py-2 text-xs font-bold uppercase
tracking-wide hover:bg-white hover:text-black`.

### Scrollbar & selection
4px scrollbar, `#0a0a0a` track / `#1f1f1f` thumb. Selection: Signal Yellow
background, black text.

---

## 8. Foundations checklist (already wired — don't regress)

- `viewport` export: `width=device-width, initialScale 1, viewportFit
  cover, themeColor #ffe500` (`app/layout.tsx`).
- Pinned sections `h-dvh`; safe-area clearance via
  `env(safe-area-inset-bottom)` (footer nav, floating preview card).
- `-webkit-tap-highlight-color: transparent`, `-webkit-text-size-adjust:
  100%`, `scroll-behavior: smooth` (`app/globals.css`).
- `overflow-x-hidden` on body; images via `next/image` with explicit
  `sizes`.
- Remote imagery + footer frame sequence are placeholder CDN assets
  (Richard Mille Le Mans / madeinevolve) — replace before launch.

---

## 9. Token source map

| Domain | File |
|--------|------|
| Color tokens, fonts, scrollbar, selection | `app/globals.css` (`@theme`) |
| Font loading | `app/layout.tsx` |
| Scroll phase choreography | `app/page.tsx` (`RECENT_END`, `HOLD_END`, `SLIDE_END`, `TOTAL_SCROLL_VH`) |
| Hero reveal timings | `components/Hero.tsx` (top constants) |
| Carousel geometry + physics | `components/RecentProjects.tsx` (`CONFIG`) |
| Panel grid, ink, panel spacing | `components/HowWeWork.tsx` (`CONFIG`, `THEMES`) |
| Statement type + word-fill | `components/BridgeText.tsx` (`CONFIG`) |
| Clients grid + reveal | `components/ClientsList.tsx` (`CONFIG`) |
| Footer frames + nav | `components/Footer.tsx` (`CONFIG`) |
| Brand principles + wordmark | `components/BrandIdentity.tsx` (unmounted) |
| Smooth scroll | `components/LenisProvider.tsx` |

Every component exposes its knobs in a `CONFIG` block under a
`🎛️ TWEAK HERE` banner at the top of the file — tune there, not inline.
