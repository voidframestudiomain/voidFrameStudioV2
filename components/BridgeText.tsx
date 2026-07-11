"use client";

import { useEffect, useRef, useState } from "react";

// ─────────────────────────────────────────────────────────────────────────
// 🎛️ TWEAK HERE
// ─────────────────────────────────────────────────────────────────────────
const CONFIG = {
  BG: "#0a0a0a",

  // Same modular grid as the sections above, so the vertical rules read as
  // one continuous grid running down the page.
  GRID_COLUMNS: 48,
  GRID_LINE_COLOR: "rgba(255,255,255,0.10)",
  SECTION_PADDING_X: "clamp(16px, 4vw, 40px)", // fluid, matches the other sections' edge padding

  // Big uppercase statement. Stored in normal case, rendered uppercase via
  // CSS so it's easy to edit.
  TEXT:
    "Innovation is connection. We bridge the gap between complex infrastructure and human experience to turn vision into momentum.",

  FONT: "clamp(1.75rem, 5vw, 4.75rem)", // min / preferred(vw) / max — big, fills the section
  // Width cap lives on the <p> as `md:max-w-[64%]` — full width on phones,
  // tall + narrow like the reference from md up.
  LEADING: 0.98, // tight, so the uppercase block stays compact and fits

  // Vertical breathing room inside the pinned viewport. TOP clears the fixed
  // header; the text is centred in whatever's left between the two.
  SECTION_PADDING_TOP: 88, // px
  SECTION_PADDING_BOTTOM: 64, // px

  // Scroll-driven colour fill: each word interpolates from DIM -> BRIGHT as
  // you scroll. SPREAD = how many words sit mid-transition at once (the soft
  // band). Higher = softer/longer gradient edge.
  DIM_ALPHA: 0.2,
  BRIGHT_ALPHA: 1,
  SPREAD: 5,

  // Total section height in viewport-heights. The inner pins for
  // (SCROLL_VH - 100)vh of scroll, which is the window the fill plays over.
  SCROLL_VH: 200,
};
// ─────────────────────────────────────────────────────────────────────────

const clamp01 = (n: number) => Math.min(1, Math.max(0, n));
const lerp = (a: number, b: number, t: number) => a + (b - a) * t;

export default function BridgeText() {
  const [progress, setProgress] = useState(0);
  const sectionRef = useRef<HTMLElement>(null);

  useEffect(() => {
    let raf = 0;
    const onScroll = () => {
      if (raf) return;
      raf = requestAnimationFrame(() => {
        raf = 0;
        const el = sectionRef.current;
        if (!el) return;
        const rect = el.getBoundingClientRect();
        const scrollableDistance = rect.height - window.innerHeight;
        setProgress(clamp01(-rect.top / scrollableDistance));
      });
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
    return () => {
      window.removeEventListener("scroll", onScroll);
      if (raf) cancelAnimationFrame(raf);
    };
  }, []);

  const words = CONFIG.TEXT.split(" ");
  const N = words.length;

  const line = `1px solid ${CONFIG.GRID_LINE_COLOR}`;
  const gridCss = `
    .brdg-lines { display: grid; grid-template-columns: repeat(${CONFIG.GRID_COLUMNS}, minmax(0, 1fr)); grid-template-rows: 1fr; height: 100%; border-right: ${line}; }
    .brdg-lines > span { border-left: ${line}; }
  `;

  return (
    <section
      ref={sectionRef}
      data-header-theme="dark"
      style={{ height: `${CONFIG.SCROLL_VH}vh` }}
      className="relative"
    >
      <div
        className="sticky top-0 h-screen w-full overflow-hidden"
        style={{ backgroundColor: CONFIG.BG }}
      >
        {/* Continuous vertical rules */}
        <style>{gridCss}</style>
        <div
          className="pointer-events-none absolute inset-0"
          style={{ paddingLeft: CONFIG.SECTION_PADDING_X, paddingRight: CONFIG.SECTION_PADDING_X }}
        >
          <div className="brdg-lines">
            {Array.from({ length: CONFIG.GRID_COLUMNS }).map((_, i) => (
              <span key={i} />
            ))}
          </div>
        </div>

        {/* The statement — each word's colour is driven by scroll progress.
            Centred vertically between the top/bottom padding so it clears the
            fixed header and never crops. */}
        <div
          className="relative flex h-full flex-col justify-center"
          style={{
            paddingLeft: CONFIG.SECTION_PADDING_X,
            paddingRight: CONFIG.SECTION_PADDING_X,
            paddingTop: CONFIG.SECTION_PADDING_TOP,
            paddingBottom: CONFIG.SECTION_PADDING_BOTTOM,
          }}
        >
          {/* Paragraph on the left, Contact CTA on the right — items-end
              bottom-aligns the button with the last line of the paragraph. */}
          <div className="flex flex-col items-start gap-8 md:flex-row md:items-end md:justify-between md:gap-10">
            <p
              className="font-sans font-semibold uppercase md:max-w-[64%]"
              style={{
                fontSize: CONFIG.FONT,
                lineHeight: CONFIG.LEADING,
                letterSpacing: "-0.01em",
              }}
            >
              {words.map((word, i) => {
                // head sweeps 0 -> N+SPREAD across the scroll; a word lights as
                // head passes it, ramping over SPREAD words for a soft edge.
                const t = clamp01((progress * (N + CONFIG.SPREAD) - i) / CONFIG.SPREAD);
                const alpha = lerp(CONFIG.DIM_ALPHA, CONFIG.BRIGHT_ALPHA, t);
                return (
                  <span key={i} style={{ color: `rgba(255,255,255,${alpha})` }}>
                    {word}
                    {i < N - 1 ? " " : ""}
                  </span>
                );
              })}
            </p>

            <a
              href="mailto:hello@madeinevolve.com"
              className="shrink-0 whitespace-nowrap rounded-full border border-white/25 px-6 py-3 text-sm text-white transition-colors hover:bg-white hover:text-black"
            >
              Contact Us
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}
