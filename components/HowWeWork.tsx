"use client";

// ─────────────────────────────────────────────────────────────────────────
// 🎛️ TWEAK HERE
// ─────────────────────────────────────────────────────────────────────────
const CONFIG = {
  BG: "#0a0a0a", // panel background — stays dark throughout, no color flip

  GRID_LINE_COLOR: "rgba(255,255,255,0.06)",
  GRID_COLUMN_WIDTH: 96, // px between vertical grid lines

  EYEBROW_COLOR: "rgba(255,255,255,0.55)",
  BODY_COLOR: "rgba(255,255,255,0.72)",

  // How far past 0 progress must get before the panel starts accepting
  // clicks/hovers — keeps it from swallowing interactions while still
  // off-screen at translateX(100%).
  INTERACTIVE_THRESHOLD: 0.05,

  // The services grid (columns + right copy) fades/slides in over this
  // slice of stepsProgress, AFTER the headline has already started
  // filling in — gives a staggered "text first, then grid" reveal.
  GRID_REVEAL_START: 0.55,
  GRID_REVEAL_END: 0.85,

  // ── Service cards ────────────────────────────────────────────────────
  CARD_BG: "rgba(255,255,255,0.035)",
  CARD_BORDER: "rgba(255,255,255,0.06)",
  CARD_PADDING: "32px 28px",
  CARD_MIN_HEIGHT: 460, // gives the tall, empty-below-title look from the ref
  CARD_GAP: 4, // gutter between cards — bg shows through here

  // ── Section spacing ─────────────────────────────────────────────────
  SECTION_PADDING_X: 64, // px, desktop horizontal padding
  SECTION_PADDING_Y: 80, // px, desktop vertical padding
  HEADLINE_TO_SERVICES_GAP: 140, // px, space between headline block and "Our Services" bar
};
// ─────────────────────────────────────────────────────────────────────────

const clamp01 = (n: number) => Math.min(1, Math.max(0, n));
const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
const remap = (t: number, start: number, end: number) =>
  clamp01((t - start) / (end - start));

const HEADLINE =
  "We are an eCommerce agency. Not just execution, not isolated services. We provide brand direction, advanced tech, performance marketing and system integration as one connected approach. An end-to-end ecosystem designed to scale, perform and integrate seamlessly with existing platforms.";

const services = [
  { id: "01", title: "Brand Direction" },
  { id: "02", title: "Advanced Tech" },
  { id: "03", title: "Performance Marketing" },
  { id: "04", title: "Merchant of Records" },
];

interface HowWeWorkProps {
  // Drives the slide-in: off-screen right (translateX 100%) -> fully
  // covering the viewport (translateX 0%). 0–1.
  progress: number;

  // Drives the in-panel reveal AFTER progress has reached 1 (panel fully
  // in place): the services grid fades/slides in once this crosses
  // GRID_REVEAL_START. 0–1.
  stepsProgress: number;
}

export default function HowWeWork({ progress, stepsProgress }: HowWeWorkProps) {
  const translateX = lerp(100, 0, progress); // 100% off-screen -> 0% covering viewport

  const gridT = remap(stepsProgress, CONFIG.GRID_REVEAL_START, CONFIG.GRID_REVEAL_END);

  return (
    <div
      className="absolute z-20 overflow-hidden"
      style={{
        // Negative insets equal to the surrounding layout's own padding —
        // lets the panel bleed to the real viewport edges instead of
        // stopping at whatever padded box it lives inside.
        top: -40,
        bottom: -40,
        left: -40,
        right: -40,
        backgroundColor: CONFIG.BG,
        // ⚠️ Scroll-driven: no CSS transition on transform, or it'll lag
        // behind the scrollbar instead of tracking it 1:1.
        transform: `translateX(${translateX}%)`,
        pointerEvents: progress > CONFIG.INTERACTIVE_THRESHOLD ? "auto" : "none",
      }}
    >
      {/* Grid lines — repeating vertical rules spanning the whole panel. */}
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          backgroundImage: `repeating-linear-gradient(90deg, ${CONFIG.GRID_LINE_COLOR} 0, ${CONFIG.GRID_LINE_COLOR} 1px, transparent 1px, transparent ${CONFIG.GRID_COLUMN_WIDTH}px)`,
        }}
      />

      <div
        className="relative flex h-full flex-col justify-center overflow-y-auto"
        style={{
          paddingLeft: CONFIG.SECTION_PADDING_X,
          paddingRight: CONFIG.SECTION_PADDING_X,
          paddingTop: CONFIG.SECTION_PADDING_Y,
          paddingBottom: CONFIG.SECTION_PADDING_Y,
        }}
      >
        {/* Headline — plain static white text, no scroll-scrub color. */}
        <h2
          className="font-display max-w-5xl text-3xl font-black leading-[1.15] text-white md:text-5xl lg:text-6xl"
          style={{ marginBottom: CONFIG.HEADLINE_TO_SERVICES_GAP }}
        >
          {HEADLINE}
        </h2>

        {/* Services grid — fades and lifts in after the headline is
            mostly read, via GRID_REVEAL_START/END. */}
        <div
          style={{
            opacity: gridT,
            transform: `translateY(${lerp(24, 0, gridT)}px)`,
          }}
        >
          <div className="mb-10 flex items-baseline justify-between border-b border-white/10 pb-6">
            <span
              className="text-xs uppercase tracking-[0.2em]"
              style={{ color: CONFIG.EYEBROW_COLOR }}
            >
              Our Services
            </span>
            <span
              className="text-xs uppercase tracking-[0.2em]"
              style={{ color: CONFIG.EYEBROW_COLOR }}
            >
              Est. 2008©
            </span>
          </div>

          <div className="grid grid-cols-1 gap-10 md:grid-cols-5">
            <div
              className="grid grid-cols-2 md:col-span-3 md:grid-cols-4"
              style={{ gap: CONFIG.CARD_GAP }}
            >
              {services.map((service) => (
                <div
                  key={service.id}
                  style={{
                    backgroundColor: CONFIG.CARD_BG,
                    border: `1px solid ${CONFIG.CARD_BORDER}`,
                    padding: CONFIG.CARD_PADDING,
                    minHeight: CONFIG.CARD_MIN_HEIGHT,
                  }}
                >
                  <span className="mb-6 block font-mono text-sm text-white/40">
                    {service.id}
                  </span>
                  <h3 className="font-display mb-3 text-xl font-black text-white">
                    {service.title}
                  </h3>
                </div>
              ))}
            </div>

            <div className="md:col-span-2 md:pl-8">
              <p className="mb-6 text-base leading-relaxed" style={{ color: CONFIG.BODY_COLOR }}>
                Every eCommerce is already in motion. Processes, people,
                numbers, decisions. Our job isn't to sit on top of it.{" "}
                <strong className="text-white">It's to step inside.</strong>
              </p>
              <p className="mb-6 text-base leading-relaxed" style={{ color: CONFIG.BODY_COLOR }}>
                We work alongside teams, read the business, identify where
                energy is being lost and where it needs to be amplified. We
                don't operate in silos:{" "}
                <strong className="text-white">
                  design, technology and marketing move together
                </strong>
                , because that's how growth becomes sustainable.
              </p>
              <p className="text-base leading-relaxed" style={{ color: CONFIG.BODY_COLOR }}>
                With in-house teams collaborating in real time, we reduce
                friction, align decisions and turn complexity into
                structure. We don't add noise.{" "}
                <strong className="text-white">We bring direction.</strong>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}