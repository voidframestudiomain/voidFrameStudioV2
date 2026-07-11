"use client";

// ─────────────────────────────────────────────────────────────────────────
// 🎛️ TWEAK HERE
// ─────────────────────────────────────────────────────────────────────────
const CONFIG = {
  BG: "#0a0a0a",
  ACCENT: "#FFE500",

  GRID_COLUMNS: 48,
  GRID_LINE_COLOR: "rgba(255,255,255,0.10)",
  SECTION_PADDING_X: "clamp(16px, 4vw, 40px)",

  LABEL: "( Brand Identity )",
  INDEX: "VF — 2026",

  // The wordmark: VOID hollow (the empty canvas), FRAME solid signal
  // yellow (the structure made visible) — the name IS the identity.
  WORDMARK_FONT: "clamp(3.5rem, 12vw, 11rem)",

  TAGLINE: "Structure in the dark. Signal in yellow. Motion as the voice.",
};
// ─────────────────────────────────────────────────────────────────────────

// The four principles distilled from how the site already behaves —
// each one names a raw material of the brand and its token.
const principles = [
  {
    letter: "(a.)",
    title: "The Void",
    body: "Black is not empty — it's the canvas where attention lives. We start from darkness and add only what earns its place.",
    token: "#0A0A0A",
  },
  {
    letter: "(b.)",
    title: "The Signal",
    body: "One yellow, used like ink: the reveal, the highlight, the cursor's trace. Never decoration — always direction.",
    token: "#FFE500",
  },
  {
    letter: "(c.)",
    title: "The Frame",
    body: "A 48-column grid runs through every section. Nothing floats; every edge lands on a line. Structure is the brand.",
    token: "48 COL",
  },
  {
    letter: "(d.)",
    title: "The Motion",
    body: "Nothing snaps. Ink bleeds, images bloom from center, panels ease under. Movement is how VoidFrame speaks.",
    token: "0.16, 1, 0.3, 1",
  },
];

const swatches = [
  { name: "Void Black", hex: "#0A0A0A", fg: "rgba(255,255,255,0.9)", border: true },
  { name: "Signal Yellow", hex: "#FFE500", fg: "#0a0a0a", border: false },
  { name: "Frame White", hex: "#FFFFFF", fg: "#0a0a0a", border: false },
];

export default function BrandIdentity() {
  const css = `
    .bi-lines { display: grid; grid-template-columns: repeat(${CONFIG.GRID_COLUMNS}, minmax(0, 1fr)); grid-template-rows: 1fr; height: 100%; border-right: 1px solid ${CONFIG.GRID_LINE_COLOR}; }
    .bi-lines > span { border-left: 1px solid ${CONFIG.GRID_LINE_COLOR}; }

    /* Hollow wordmark half — the "void": stroke only, no fill. */
    .bi-hollow { color: transparent; -webkit-text-stroke: 1.5px rgba(255,255,255,0.85); }

    /* Principles on the master track (md+), 2-up on phones-to-tablet. */
    .bi-principles { display: grid; grid-template-columns: 1fr; row-gap: 8px; }
    @media (min-width: 640px) { .bi-principles { grid-template-columns: 1fr 1fr; column-gap: 8px; } }
    @media (min-width: 768px) {
      .bi-principles { grid-template-columns: repeat(${CONFIG.GRID_COLUMNS}, minmax(0, 1fr)); column-gap: 0; }
      .bi-p-1 { grid-column: 1 / span 11; }
      .bi-p-2 { grid-column: 13 / span 11; }
      .bi-p-3 { grid-column: 25 / span 11; }
      .bi-p-4 { grid-column: 37 / span 12; }
    }
  `;

  return (
    <section
      data-header-theme="dark"
      className="relative overflow-hidden"
      style={{ backgroundColor: CONFIG.BG }}
    >
      <style>{css}</style>

      {/* Continuous vertical rules */}
      <div
        className="pointer-events-none absolute inset-0"
        style={{ paddingLeft: CONFIG.SECTION_PADDING_X, paddingRight: CONFIG.SECTION_PADDING_X }}
      >
        <div className="bi-lines">
          {Array.from({ length: CONFIG.GRID_COLUMNS }).map((_, i) => (
            <span key={i} />
          ))}
        </div>
      </div>

      <div
        className="relative py-20 md:py-28"
        style={{ paddingLeft: CONFIG.SECTION_PADDING_X, paddingRight: CONFIG.SECTION_PADDING_X }}
      >
        {/* Top meta row */}
        <div className="flex items-baseline justify-between font-mono text-xs uppercase tracking-[0.2em] text-white/60">
          <span>{CONFIG.LABEL}</span>
          <span>{CONFIG.INDEX}</span>
        </div>

        {/* Wordmark — VOID hollow, FRAME in signal yellow */}
        <h2
          className="mt-12 font-sans font-semibold uppercase leading-[0.92] tracking-[-0.02em]"
          style={{ fontSize: CONFIG.WORDMARK_FONT }}
        >
          <span className="bi-hollow">Void</span>
          <span style={{ color: CONFIG.ACCENT }}>Frame</span>
        </h2>

        <p className="mt-6 max-w-md font-mono text-xs uppercase leading-relaxed tracking-[0.15em] text-white/60">
          {CONFIG.TAGLINE}
        </p>

        {/* Principles — hover inverts a card to signal yellow, the same
            ink-flip gesture used everywhere else on the site. */}
        <div className="bi-principles mt-16 md:mt-24">
          {principles.map((p, i) => (
            <div
              key={p.title}
              className={`bi-p-${i + 1} group relative isolate cursor-default border p-5 transition-colors duration-300 md:p-6`}
              style={{ borderColor: "rgba(255,255,255,0.12)" }}
            >
              <div className="flex items-baseline justify-between font-mono text-xs uppercase tracking-widest text-white/50 transition-colors duration-300 group-hover:text-black/60">
                <span>{p.letter}</span>
                <span>{p.token}</span>
              </div>
              <h3 className="mt-10 font-sans text-lg font-semibold text-white transition-colors duration-300 group-hover:text-black md:mt-14">
                {p.title}
              </h3>
              <p className="mt-2 text-sm leading-relaxed text-white/60 transition-colors duration-300 group-hover:text-black/70">
                {p.body}
              </p>
              {/* Yellow ink fill behind everything on hover */}
              <span
                className="pointer-events-none absolute inset-0 -z-10 opacity-0 transition-opacity duration-300 group-hover:opacity-100"
                style={{ backgroundColor: CONFIG.ACCENT }}
              />
            </div>
          ))}
        </div>

        {/* Tokens: color swatches + type specimens */}
        <div className="mt-20 grid grid-cols-1 gap-8 md:mt-28 md:grid-cols-2">
          {/* Colors */}
          <div>
            <span className="font-mono text-xs uppercase tracking-[0.2em] text-white/60">
              ( Color )
            </span>
            <div className="mt-4 grid grid-cols-3 gap-2">
              {swatches.map((s) => (
                <div
                  key={s.hex}
                  className="flex aspect-square flex-col justify-between p-3"
                  style={{
                    backgroundColor: s.hex,
                    color: s.fg,
                    border: s.border ? `1px solid ${CONFIG.GRID_LINE_COLOR}` : "none",
                  }}
                >
                  <span className="font-mono text-[10px] uppercase tracking-widest">{s.name}</span>
                  <span className="font-mono text-[10px] tracking-widest">{s.hex}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Type */}
          <div>
            <span className="font-mono text-xs uppercase tracking-[0.2em] text-white/60">
              ( Type )
            </span>
            <div className="mt-4 flex flex-col gap-2">
              <div
                className="flex items-baseline justify-between border p-3"
                style={{ borderColor: "rgba(255,255,255,0.12)" }}
              >
                <span className="font-sans text-3xl font-semibold text-white">Aa</span>
                <span className="font-mono text-[10px] uppercase tracking-widest text-white/60">
                  PP Mori — Statements
                </span>
              </div>
              <div
                className="flex items-baseline justify-between border p-3"
                style={{ borderColor: "rgba(255,255,255,0.12)" }}
              >
                <span className="font-mono text-3xl text-white">Aa</span>
                <span className="font-mono text-[10px] uppercase tracking-widest text-white/60">
                  Mono — Metadata ( a. )
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
