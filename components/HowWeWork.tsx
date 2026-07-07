"use client";

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

  // Torn-edge look on each strap's cover. TEETH = how many zigzag points
  // down the height of one strap (more = finer tear). JAG = how far the
  // zigzag punches in, in % of the strap's own width (bigger = rougher/
  // more dramatic tear).
  TEETH: 10,
  JAG: 3,
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

// Builds a clip-path polygon with a jagged LEFT edge and a clean straight
// RIGHT edge. Used on each strap's "cover" div: the cover sits on top of
// the strap's real content, colored the same as the current background,
// and is scaled horizontally from a fixed RIGHT anchor — so as it shrinks,
// the jagged left edge is the one doing the "tearing", while the right
// edge stays pinned in place. That reads as a strip being ripped away
// left-to-right rather than a plain rectangle sliding off.
function tornLeftEdgeClipPath(teeth: number, jag: number): string {
  const points: string[] = [];
  for (let i = 0; i <= teeth; i++) {
    const y = (i / teeth) * 100;
    const x = i % 2 === 0 ? 0 : jag;
    points.push(`${x}% ${y}%`);
  }
  points.push("100% 100%", "100% 0%");
  return `polygon(${points.join(", ")})`;
}

interface HowWeWorkProps {
  // Drives the slide-in (off-screen -> covering the viewport) AND the
  // black->yellow color flip at its tail end. 0–1.
  progress: number;

  // Drives the per-strap "torn cover peels away" reveal, AFTER progress
  // has already reached 1 (panel fully in place, colors fully flipped).
  // Internally split into 4 equal chunks, one per step, so straps reveal
  // one at a time top-to-bottom as this climbs 0 -> 1.
  stepsProgress: number;
}

export default function HowWeWork({ progress, stepsProgress }: HowWeWorkProps) {
  const translateX = lerp(100, 0, progress); // 100% (off-screen right) -> 0% (covering viewport)

  const colorT = remap(progress, CONFIG.COLOR_FLIP_START, CONFIG.COLOR_FLIP_END);

  const bgColor = lerpColor(CONFIG.PANEL_BG, CONFIG.ACCENT, colorT);
  const textColor = lerpColor("#ffffff", "#000000", colorT);
  const mutedTextColor = lerpColor("#a3a3a3", "#000000", colorT);
  const dimTextColor = lerpColor("#737373", "#000000", colorT);
  const borderColor = lerpColor("#ffffff", "#000000", colorT);

  const clipPath = tornLeftEdgeClipPath(CONFIG.TEETH, CONFIG.JAG);

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
          const strapReveal = remap(stepsProgress, i / steps.length, (i + 1) / steps.length);

          return (
            <div
              key={step.id}
              className="relative flex items-center gap-8 overflow-hidden"
              style={{
                height: CONFIG.STRAP_HEIGHT,
                borderTop: i === 0 ? `${CONFIG.STRAP_BORDER_WIDTH}px solid ${borderColor}` : undefined,
                borderBottom: `${CONFIG.STRAP_BORDER_WIDTH}px solid ${borderColor}`,
              }}
            >
              {/* Real content — sits underneath the cover, revealed as the
                  cover tears away. */}
              <span className="font-mono text-sm shrink-0 w-12" style={{ color: dimTextColor }}>
                {step.id}
              </span>
              <h3
                className="font-display text-3xl font-black uppercase shrink-0 w-64"
                style={{ color: textColor }}
              >
                {step.title}
              </h3>
              <p className="text-sm leading-relaxed max-w-md" style={{ color: mutedTextColor }}>
                {step.description}
              </p>

              {/* The torn cover. Same color as the panel's current
                  background, anchored to the RIGHT edge, scaled down from
                  the left as strapReveal climbs — the jagged clip-path
                  edge is what actually appears to "tear". */}
              <div
                className="absolute inset-0 z-10"
                style={{
                  backgroundColor: bgColor,
                  clipPath,
                  transform: `scaleX(${1 - strapReveal})`,
                  transformOrigin: "right center",
                }}
              />
            </div>
          );
        })}
      </div>
    </div>
  );
}