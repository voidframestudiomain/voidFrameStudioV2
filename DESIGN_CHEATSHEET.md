# VoidFrame — Design Cheat Sheet

The 2-minute version. Full detail lives in [DESIGN_SYSTEM.md](DESIGN_SYSTEM.md).

---

## Colors (only 3 that matter)

```
YELLOW   #FFE500   page background + the one accent (highlights, strips, selection)
BLACK    #0A0A0A   dark sections (HowWeWork, BridgeText, Clients, Footer)
WHITE    #FFFFFF   text and grid lines on black
```

- Faded text on black → white at 60% opacity (`text-white/60`)
- Faded text on yellow → black at 60–70% (`text-black/60`)
- Grid lines → white at 10% (`white/0.10`)
- **Never add a second accent color. Yellow is it.**

## Fonts (3 jobs)

```
PP Mori   (font-sans)     everything — headings + body
Anton     (font-display)  one loud word only (project names)
Mono      (font-mono)     small labels & data, UPPERCASE, wide spacing
```

- Big headings: UPPERCASE, tight line-height, PP Mori SemiBold
- Labels always look like this: `( Selected Projects )` — parentheses, tiny, spaced out
- Body text: `text-sm leading-relaxed`
- Inputs: never smaller than 16px on mobile (iOS zooms)

## Layout

```
Grid:      48 thin vertical lines on every black section — content snaps to them
Padding:   clamp(16px, 4vw, 40px) left/right, every section, always
Corners:   rounded-full for pills · 4px for photos · SHARP for everything on black
Screens:   pinned sections use h-dvh (never h-screen)
```

## Motion (one curve, a few speeds)

```
Ease:     cubic-bezier(0.16, 1, 0.3, 1)   ← use this for everything
Fast:     150ms   hovers
Medium:   350ms   show/hide
Slow:     650ms   big reveals (letters, image wipes)
```

- Things reveal from the center or sweep left→right, letter by letter
- Scroll-driven styles get **NO css transition** (they lag and look stuck)

## Desktop vs phone (the golden rule)

Hover doesn't exist on phones. Every hover effect needs a touch version:

| Desktop | Phone |
|---|---|
| hover a project card | tap it (names are printed on cards) |
| cursor paints yellow ink on the black panel | nothing — panel stays black |
| hover a client row → image appears | scroll — the centered row lights up + floating preview card |

Detect phones with `matchMedia("(hover: none)")`, and always ignore
`onMouseEnter` on touch (phones fake mouse events after taps).

## Where to change things

Every component has a `🎛️ TWEAK HERE` config block at the top of its file.
Change numbers there — never inline.
