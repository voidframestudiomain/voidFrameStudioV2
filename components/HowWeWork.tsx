"use client";

import { useState } from "react";

const steps = [
  {
    id: "01",
    title: "Discover",
    description: "We dig into your brand, audience, and goals before touching a single pixel.",
  },
  {
    id: "02",
    title: "Design",
    description: "Concepts, iteration, and a system that scales — not just a pretty homepage.",
  },
  {
    id: "03",
    title: "Build",
    description: "Motion-first, performance-obsessed development from design to deploy.",
  },
  {
    id: "04",
    title: "Launch",
    description: "Ship it, measure it, refine it. We stick around after go-live.",
  },
];

// ─────────────────────────────────────────────────────────────────────────
// 🎛️ TWEAK HERE
// ─────────────────────────────────────────────────────────────────────────
const CONFIG = {
  PANEL_BG: "#0a0a0a", // starting (black) background while the panel is still sliding in
  ACCENT: "#ffe500", // ⚠️ PLACEHOLDER — swap for your actual yellow hex from the rest of the site

  // ⚠️ PLACEHOLDER — one poppy cover color per strap, picked to punch
  // against ACCENT without fighting it. Order matches `steps`.
  STRAP_COLORS: ["#FF3B5C", "#2F6BFF", "#FF8A00", "#9B30FF"],

  // How far past 0 progress must get before the panel starts accepting
  // clicks/hovers. Keeps it from swallowing interactions with
  // RecentProjects while still sitting off-screen at translateX(100%).
  INTERACTIVE_THRESHOLD: 0.05,

  // The color flip (black bg/white text -> yellow bg/black text) happens
  // over this sliver of `progress` (the slide-in phase), right at the END
  // of the slide — i.e. "once it hits the screen fully", not gradually
  // the whole way in.
  COLOR_FLIP_START: 0.85,
  COLOR_FLIP_END: 1.0,

  // Height of each strap (row). All 4 stack to fill the available space.
  STRAP_HEIGHT: 130,

  // Thickness of the divider between straps.
  STRAP_BORDER_WIDTH: 3,

  // Extra tear progress added on hover, on top of whatever scroll gave it.
  // Purely a "reactive peel" nudge — doesn't replace the scroll-driven value.
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
  // black->yellow color flip at its tail end. 0–1.
  progress: number;

  // Drives the per-strap cover reveal, AFTER progress has already reached
  // 1 (panel fully in place, colors fully flipped). Internally split into
  // 4 equal chunks, one per step, so straps reveal one at a time
  // top-to-bottom as this climbs 0 -> 1.
  stepsProgress: number;
}

export default function HowWeWork({ progress, stepsProgress }: HowWeWorkProps) {
  const [hoveredStep, setHoveredStep] = useState<number | null>(null);

  const translateX = lerp(100, 0, progress); // 100% (off-screen right) -> 0% (covering viewport)

  const colorT = remap(progress, CONFIG.COLOR_FLIP_START, CONFIG.COLOR_FLIP_END);

  const bgColor = lerpColor(CONFIG.PANEL_BG, CONFIG.ACCENT, colorT);
  const textColor = lerpColor("#ffffff", "#000000", colorT);
  const mutedTextColor = lerpColor("#a3a3a3", "#000000", colorT);
  const dimTextColor = lerpColor("#737373", "#000000", colorT);
  const borderColor = lerpColor("#ffffff", "#000000", colorT);

  return (
    <div
      className="absolute z-20 flex flex-col justify-center px-[40px]"
      style={{
        // Negative insets equal to main's own px-[40px] py-10 padding —
        // lets the panel bleed to the real viewport edges instead of
        // stopping at the padded box RecentProjects still lives inside.
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
        className="mb-8 text-xs uppercase tracking-[0.2em]"
        style={{ color: mutedTextColor }}
      >
        ( How We Work )
      </span>

      <div className="flex flex-col">
        {steps.map((step, i) => {
          // Each strap gets an equal 1/4 slice of stepsProgress. Strap 0
          // reveals first, strap 3 last — same top-to-bottom order they're
          // stacked in.
          const scrollReveal = remap(stepsProgress, i / steps.length, (i + 1) / steps.length);

          // Hover adds a bit of extra peel on top of the scroll value —
          // doesn't override it, so scrolling further always still wins.
          const strapReveal = clamp01(
            scrollReveal + (hoveredStep === i ? CONFIG.HOVER_PEEL_BOOST : 0)
          );

          // The cover's own bg warms from its unique color into ACCENT as
          // it goes — by the time it's fully gone, it would've been
          // indistinguishable from the yellow underneath anyway.
          const strapColor = CONFIG.STRAP_COLORS[i % CONFIG.STRAP_COLORS.length];
          const coverBg = lerpColor(strapColor, CONFIG.ACCENT, strapReveal);

          // Description lives only on the revealed layer, so it naturally
          // doesn't show until the cover has mostly gone.
          const descriptionOpacity = remap(strapReveal, 0.75, 1);

          // Alternate wipe direction per strap: even straps' cover is
          // anchored right and collapses toward the right, so the reveal
          // sweeps left -> right, ending with the LAST remaining sliver of
          // cover on the right — so the heading sits there, at the "end"
          // of that motion. Odd straps do the mirror: anchored left,
          // sweep right -> left, heading on the left.
          const sweepsLeftToRight = i % 2 === 0;
          const titleOnRight = sweepsLeftToRight;

          // Shared layout for the id + title row — used identically on
          // both the real (bottom) layer and the cover (top) layer, so
          // the two copies land in EXACTLY the same spot. That's what
          // sells the "reveal", not a duplicate: as the cover's black
          // copy retracts, the real layer's copy underneath is already
          // sitting there pixel-for-pixel, so nothing jumps or ghosts.
          const headingRow = (color: string) => (
            <div
              className="flex items-center gap-8"
              style={{ flexDirection: titleOnRight ? "row-reverse" : "row" }}
            >
              <h3
                className="font-display text-3xl font-black uppercase shrink-0"
                style={{ color }}
              >
                {step.title}
              </h3>
            </div>
          );

          return (
            <div
              key={step.id}
              className="relative flex items-center overflow-hidden"
              onMouseEnter={() => setHoveredStep(i)}
              onMouseLeave={() => setHoveredStep((prev) => (prev === i ? null : prev))}
              style={{
                height: CONFIG.STRAP_HEIGHT,
                borderTop: i === 0 ? `${CONFIG.STRAP_BORDER_WIDTH}px solid ${borderColor}` : undefined,
                borderBottom: `${CONFIG.STRAP_BORDER_WIDTH}px solid ${borderColor}`,
              }}
            >
              {/* Real (bottom) layer — id pinned left, title/description
                  swap sides via flex row-reverse so title always lands at
                  the trailing edge of that strap's sweep direction. */}
              <span className="shrink-0 w-12 font-mono text-sm" style={{ color: dimTextColor }}>
                {step.id}
              </span>
              <div
                className="flex flex-1 items-center gap-8"
                style={{
                  flexDirection: titleOnRight ? "row-reverse" : "row",
                  justifyContent: "space-between",
                }}
              >
                <h3
                  className="font-display text-3xl font-black uppercase shrink-0"
                  style={{ color: textColor }}
                >
                  {step.title}
                </h3>
                <p
                  className="text-sm leading-relaxed max-w-md transition-opacity duration-300"
                  style={{ color: mutedTextColor, opacity: descriptionOpacity }}
                >
                  {step.description}
                </p>
              </div>

              {/* The cover — the poppy colored plate, now carrying its own
                  copy of the id + title in solid black, laid out via the
                  exact same flex structure as the real layer above. As it
                  scaleX's away, the black title on the cover slides off
                  together with the color, and the real title underneath
                  is revealed already in place — reads as one label peeling
                  off, not two texts crossfading. */}
              <div
                className="absolute inset-0 z-10 flex items-center overflow-hidden"
                style={{
                  backgroundColor: coverBg,
                  transform: `scaleX(${1 - strapReveal})`,
                  transformOrigin: sweepsLeftToRight ? "right center" : "left center",
                }}
              >
                <span className="shrink-0 w-12 font-mono text-sm" style={{ color: "#000000", opacity: 0.6 }}>
                  {step.id}
                </span>
                <div
                  className="flex flex-1 items-center gap-8"
                  style={{
                    flexDirection: titleOnRight ? "row-reverse" : "row",
                    justifyContent: "space-between",
                  }}
                >
                  <h3
                    className="font-display text-3xl font-black uppercase shrink-0"
                    style={{ color: "#000000" }}
                  >
                    {step.title}
                  </h3>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}