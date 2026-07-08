"use client";

import { useState } from "react";

const steps = [
  {
    id: "01",
    title: "Discover",
    description:
      "We dig into your brand, audience, and goals before touching a single pixel.",
  },
  {
    id: "02",
    title: "Design",
    description:
      "Concepts, iteration, and a system that scales — not just a pretty homepage.",
  },
  {
    id: "03",
    title: "Build",
    description:
      "Motion-first, performance-obsessed development from design to deploy.",
  },
  {
    id: "04",
    title: "Launch",
    description:
      "Ship it, measure it, refine it. We stick around after go-live.",
  },
];

// ─────────────────────────────────────────────────────────────────────────
// 🎛️ TWEAK HERE
// ─────────────────────────────────────────────────────────────────────────
const CONFIG = {
  PANEL_BG: "#0a0a0a", // starting (black) background while the panel is still sliding in

  // ⚠️ PLACEHOLDER — final panel background once fully slid in. Cream/paper
  // tone to match the reference, not your site's yellow. Swap freely.
  ACCENT: "#F4EFE3",

  // ⚠️ PLACEHOLDER — headline + number/title accent color once revealed.
  INK: "#C23B22",

  // Text on the real (bottom) layer of each card — title + description.
  // Set to solid black per your request; kept separate from INK so the
  // label dot/number can still use INK elsewhere if you want it back.
  TEXT_COLOR: "#000000",

  // Cards themselves are always plain white, regardless of ACCENT — this
  // is what makes them pop off the cream background.
  CARD_BG: "#FFFFFF",

  // ⚠️ PLACEHOLDER — one poppy cover color per card (the "torn strap" that
  // peels back to reveal the white card). Order = reading order: top-left,
  // top-right, bottom-left, bottom-right.
  STRAP_COLORS: ["#FF3B5C", "#2F6BFF", "#FF8A00", "#9B30FF"],

  // How far past 0 progress must get before the panel starts accepting
  // clicks/hovers. Keeps it from swallowing interactions with whatever
  // sits behind it while still off-screen at translateX(100%).
  INTERACTIVE_THRESHOLD: 0.05,

  // The color flip (black bg/white text -> cream bg/ink text) happens over
  // this sliver of `progress` (the slide-in phase), right at the END of
  // the slide — i.e. once it hits the screen fully, not gradually the
  // whole way in.
  COLOR_FLIP_START: 0.85,
  COLOR_FLIP_END: 1.0,

  // Gap between grid cards, and each card's height.
  GRID_GAP: 24,
  CARD_HEIGHT: 320,

  // Extra reveal progress added on hover, on top of whatever scroll gave
  // it. Purely a reactive nudge — doesn't replace the scroll-driven value.
  HOVER_PEEL_BOOST: 0.18,
};
// ─────────────────────────────────────────────────────────────────────────

const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
const clamp01 = (n: number) => Math.min(1, Math.max(0, n));
const remap = (t: number, start: number, end: number) =>
  clamp01((t - start) / (end - start));

// Converts "#rrggbb" -> [r,g,b] so we can lerp between two hex colors
// channel-by-channel. Needed because CSS can't interpolate between two
// arbitrary hex strings on its own — we drive it manually from `progress`
// every tick, same as every other scroll-linked value in this project.
function hexToRgb(hex: string): [number, number, number] {
  const clean = hex.replace("#", "");
  const r = parseInt(clean.substring(0, 2), 16);
  const g = parseInt(clean.substring(2, 4), 16);
  const b = parseInt(clean.substring(4, 6), 16);
  return [r, g, b];
}

function lerpColor(hexA: string, hexB: string, t: number): string {
  const [r1, g1, b1] = hexToRgb(hexA);
  const [r2, g2, b2] = hexToRgb(hexB);
  const r = Math.round(lerp(r1, r2, t));
  const g = Math.round(lerp(g1, g2, t));
  const b = Math.round(lerp(b1, b2, t));
  return `rgb(${r}, ${g}, ${b})`;
}

interface HowWeWorkProps {
  // Drives the slide-in (off-screen -> covering the viewport) AND the
  // black->cream color flip at its tail end. 0–1.
  progress: number;

  // Drives the per-card cover reveal, AFTER progress has already reached 1
  // (panel fully in place, colors fully flipped). Internally split into 4
  // equal chunks, one per step, revealing in reading order: top-left,
  // top-right, bottom-left, bottom-right — matching the 01–04 numbering.
  stepsProgress: number;
}

export default function HowWeWork({ progress, stepsProgress }: HowWeWorkProps) {
  const [hoveredStep, setHoveredStep] = useState<number | null>(null);

  const translateX = lerp(100, 0, progress); // 100% (off-screen right) -> 0% (covering viewport)

  const colorT = remap(progress, CONFIG.COLOR_FLIP_START, CONFIG.COLOR_FLIP_END);

  const bgColor = lerpColor(CONFIG.PANEL_BG, CONFIG.ACCENT, colorT);
  const headlineColor = lerpColor("#ffffff", CONFIG.INK, colorT);
  const labelColor = lerpColor("#a3a3a3", CONFIG.INK, colorT);

  return (
    <div
      className="absolute z-20 flex flex-col justify-center px-[40px] py-10 overflow-hidden"
      style={{
        // Negative insets equal to the surrounding layout's own padding —
        // lets the panel bleed to the real viewport edges instead of
        // stopping at whatever padded box it lives inside.
        top: -40,
        bottom: -40,
        left: -40,
        right: -40,
        backgroundColor: bgColor,
        // ⚠️ Scroll-driven: no CSS transition on transform/backgroundColor,
        // or they'll lag behind the scrollbar instead of tracking it 1:1.
        transform: `translateX(${translateX}%)`,
        pointerEvents: progress > CONFIG.INTERACTIVE_THRESHOLD ? "auto" : "none",
      }}
    >
      <span
        className="mb-4 text-xs uppercase tracking-[0.2em]"
        style={{ color: labelColor }}
      >
        ( How We Work )
      </span>

      {/* font-display: your site's own display font class — no inline
          fontFamily override, so this inherits whatever the rest of the
          site uses for headings. */}
      <h2
        className="font-display mb-10 text-5xl md:text-6xl font-black leading-[1.05]"
        style={{ color: headlineColor }}
      >
        Turning process
        <br />
        into momentum.
      </h2>

      {/* 4-column track spanning the full width, but each card only ever
          occupies 1 of those 4 columns — cards 0,1 sit in cols 1-2 (left
          half of the screen, row 1), cards 2,3 sit in cols 3-4 (right
          half, row 2). That's what staggers the two pairs instead of a
          plain 2x2 that spans the whole width. */}
      <div
        className="grid grid-cols-4"
        style={{ gap: CONFIG.GRID_GAP }}
      >
        {steps.map((step, i) => {
          // Each card gets an equal 1/4 slice of stepsProgress, revealing
          // in reading order — top-left, top-right, bottom-left,
          // bottom-right — same order as the 01–04 labels.
          const scrollReveal = remap(stepsProgress, i / steps.length, (i + 1) / steps.length);

          // Hover adds a bit of extra peel on top of the scroll value —
          // doesn't override it, so scrolling further always still wins.
          const strapReveal = clamp01(
            scrollReveal + (hoveredStep === i ? CONFIG.HOVER_PEEL_BOOST : 0)
          );

          // The cover's own bg warms from its poppy color into pure white
          // as it goes — by full reveal it matches the card underneath
          // exactly, so there's no visible seam when it's fully gone.
          const strapColor = CONFIG.STRAP_COLORS[i % CONFIG.STRAP_COLORS.length];
          const coverBg = lerpColor(strapColor, CONFIG.CARD_BG, strapReveal);

          // Description only shows once the cover's mostly torn away.
          const descriptionOpacity = remap(strapReveal, 0.75, 1);

          // Alternate wipe direction per card, left<->right, purely for
          // visual variety — title position stays fixed bottom-left on
          // every card, so nothing needs to reflow when the direction
          // flips.
          const sweepsLeftToRight = i % 2 === 0;

          // Explicit grid placement: index -> column (1,2,3,4 across the
          // 4-col track), row 1 for the first pair / row 2 for the
          // second pair.
          const colStart = i + 1;
          const rowStart = i < 2 ? 1 : 2;

          return (
            <div
              key={step.id}
              className="relative overflow-hidden"
              onMouseEnter={() => setHoveredStep(i)}
              onMouseLeave={() => setHoveredStep((prev) => (prev === i ? null : prev))}
              style={{
                height: CONFIG.CARD_HEIGHT,
                borderRadius: 28,
                backgroundColor: CONFIG.CARD_BG,
                gridColumn: `${colStart} / ${colStart + 1}`,
                gridRow: rowStart,
              }}
            >
              {/* Real (bottom) layer — number top-left, title + description
                  bottom-left. Only place this text ever actually renders;
                  the cover just uncovers it. font-display used again for
                  the title to match your site's headings. */}
              <div className="relative z-0 flex h-full flex-col justify-between p-8">
                <span
                  className="font-mono text-sm"
                  style={{ color: CONFIG.TEXT_COLOR, opacity: 0.7 }}
                >
                  {step.id}
                </span>
                <div>
                  <h3
                    className="font-display mb-2 text-3xl font-black"
                    style={{ color: CONFIG.TEXT_COLOR }}
                  >
                    {step.title}
                  </h3>
                  <p
                    className="max-w-xs text-sm leading-relaxed transition-opacity duration-300"
                    style={{ color: CONFIG.TEXT_COLOR, opacity: descriptionOpacity * 0.85 }}
                  >
                    {step.description}
                  </p>
                </div>
              </div>

              {/* The cover — poppy colored plate carrying its own copy of
                  the number + title in solid black, laid out identically
                  to the real layer so the two land pixel-for-pixel. As it
                  scaleX's away, the black copy retreats together with the
                  color and the black-text version underneath is already
                  sitting there — reads as one label peeling off. */}
              <div
                className="absolute inset-0 z-10 flex h-full flex-col justify-between overflow-hidden p-8"
                style={{
                  backgroundColor: coverBg,
                  transform: `scaleX(${1 - strapReveal})`,
                  transformOrigin: sweepsLeftToRight ? "right center" : "left center",
                }}
              >
                <span className="font-mono text-sm" style={{ color: "#000000", opacity: 0.6 }}>
                  {step.id}
                </span>
                <h3 className="font-display text-3xl font-black" style={{ color: "#000000" }}>
                  {step.title}
                </h3>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}