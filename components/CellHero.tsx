"use client";

import { useEffect, useRef, useState } from "react";

/**
 * CellHero
 * ---------------------------------------------------------------
 * Hero section built around two layered renders of a single cell:
 *  - cell-outer.avif  → the wireframe membrane/shell (back layer)
 *  - cell-inner.avif  → the glowing internal structure (front layer)
 *
 * Both renders sit on pure black, so they're composited with
 * `mix-blend-mode: screen` — no manual masking needed, the black
 * simply disappears into the section's own dark background.
 *
 * Scroll produces a soft parallax: the outer shell drifts slower
 * than the inner structure, giving the two layers a sense of
 * depth/rotation as the section moves through the viewport.
 *
 * Only 3 colors drive the whole palette (see CSS vars below):
 *   --void   near-black background
 *   --cell   teal/cyan glow, taken from the renders themselves
 *   --mist   desaturated off-white for text
 *
 * Drop cell-inner.avif / cell-outer.avif into /public/images/
 * (paths already point there) or update IMG_INNER / IMG_OUTER.
 * ---------------------------------------------------------------
 */

const IMG_OUTER = "/images/cell-outer.avif";
const IMG_INNER = "/images/cell-inner.avif";

export default function CellHero() {
  const sectionRef = useRef<HTMLElement | null>(null);
  const [progress, setProgress] = useState(0); // -1 → 1 across the viewport
  const [reduceMotion, setReduceMotion] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    setReduceMotion(mq.matches);
    const onChange = () => setReduceMotion(mq.matches);
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, []);

  useEffect(() => {
    if (reduceMotion) return;
    let ticking = false;

    const update = () => {
      ticking = false;
      const el = sectionRef.current;
      if (!el) return;
      const rect = el.getBoundingClientRect();
      const vh = window.innerHeight || 1;
      // 0 when section top is at viewport top, moves to ~1 as it scrolls past
      const raw = (vh - rect.top) / (vh + rect.height);
      setProgress(Math.min(Math.max(raw * 2 - 1, -1), 1));
    };

    const onScroll = () => {
      if (!ticking) {
        ticking = true;
        requestAnimationFrame(update);
      }
    };

    update();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
    };
  }, [reduceMotion]);

  const outerShift = reduceMotion ? 0 : progress * 26;
  const innerShift = reduceMotion ? 0 : progress * 64;
  const outerRotate = reduceMotion ? 0 : progress * 6;

  return (
    <section
      ref={sectionRef}
      style={
        {
          /* Warmed to sit inside the Field Guide palette: the void picks up
             the same olive cast as --color-ink and the mist is manila, so
             this dark section reads as the same print job as the rest of
             the page rather than a borrowed cyber-mint hero. The accent
             stays in the cool range because the cell AVIFs are tinted that
             way — recoloring the glow alone would fight the artwork. */
          "--void": "#080a07",
          "--cell": "#52ecd0",
          "--mist": "#f6f1df",
        } as React.CSSProperties
      }
      className="relative isolate min-h-screen w-full overflow-hidden bg-[color:var(--void)] text-[color:var(--mist)]"
    >
      {/* ambient glow, seeded from the single accent color */}
      <div
        aria-hidden
        className="pointer-events-none absolute left-1/2 top-1/2 h-[70vmax] w-[70vmax] -translate-x-1/2 -translate-y-1/2 rounded-full opacity-[0.14] blur-3xl"
        style={{
          background:
            "radial-gradient(circle, var(--cell) 0%, transparent 65%)",
        }}
      />

      <div className="mx-auto flex min-h-screen w-full max-w-7xl items-center gap-16 px-6 py-28 sm:px-10  lg:items-center lg:gap-8 lg:py-32">
        {/* copy */}
       
        {/* layered cell visual */}
        <div className="relative z-0 flex w-full items-center justify-center lg:w-1/2">
          <div className="relative aspect-square w-full max-w-[560px]">
            {/* outer shell — slower parallax, subtle rotation */}
            <img
              src={IMG_OUTER}
              alt=""
              aria-hidden
              draggable={false}
              className="absolute bottom-[-100px] inset-0 h-full w-full select-none object-contain mix-blend-screen will-change-transform"
              style={{
                transform: `translateY(${outerShift}px) rotate(${outerRotate}deg)`,
                transition: reduceMotion
                  ? undefined
                  : "transform 120ms linear",
              }}
            />
            {/* inner structure — faster parallax, sits in front */}
            {/* inner structure — smaller and anchored to bottom */}
<img
  src={IMG_INNER}
  alt="Internal structure of a single cell, rendered in cross-section"
  draggable={false}
  className="absolute bottom-0 left-1/2 h-auto w-full -translate-x-1/2 select-none object-contain mix-blend-screen will-change-transform animate-[cell-breathe_7s_ease-in-out_infinite]"
  style={{
    transform: ` translateY(${innerShift}px) scale(0.6)`,
    transformOrigin: "bottom center",
    transition: reduceMotion
      ? undefined
      : "transform 120ms linear",
  }}
/>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes cell-breathe {
          0%, 100% { filter: brightness(1) saturate(1); }
          50% { filter: brightness(1.08) saturate(1.12); }
        }
        @media (prefers-reduced-motion: reduce) {
          .animate-\\[cell-breathe_7s_ease-in-out_infinite\\] { animation: none; }
        }
      `}</style>
    </section>
  );
}