"use client";

import { useEffect, useRef, useState } from "react";

// ─────────────────────────────────────────────────────────────────────────
// 🎛️ TWEAK HERE
// ─────────────────────────────────────────────────────────────────────────
const CONFIG = {
  // Frame sequence — same numbering convention as your main scroll build:
  // frame-001.webp ... frame-045.webp
  FRAME_BASE_URL:
    "https://offportercdn.fra1.cdn.digitaloceanspaces.com/madein/media/img/sequence/desktop/frame-",
  FRAME_COUNT: 45,
  FRAME_PAD: 3, // "001", "002" ... width

  BG_FALLBACK: "#0a0a0a",

  // Dark scrim over the frames so text stays readable — 0 = no scrim,
  // 1 = fully opaque bg color.
  SCRIM_OPACITY: 0.55,

  // Scrub range: this footer isn't pinned, so the sequence just plays
  // once as the section enters from the bottom of the viewport. progress
  // 0 = footer top just touching the bottom of the viewport, progress 1
  // = footer top has reached the top of the viewport (fully scrolled
  // past). Tune the divisor below if you want it to finish earlier/later
  // relative to how much of the footer has actually entered.
  SCRUB_DISTANCE_VH: 1, // 1 = takes one full viewport height of scroll to go 0->1

  HEADLINE: "Let's make an impact together.",
  EMAIL: "hello@madeinevolve.com",

  NAV_COLUMNS: [
    {
      label: "(a.) CONTACT",
      content: (
        <>
          <p>hello@madeinevolve.com</p>
          <p>Via Rosalba Carriera, 26 |</p>
          <p>41126 Modena (Italy)</p>
        </>
      ),
      links: [{ label: "Privacy Data Removal", href: "#" }],
    },
    {
      label: "(b.) LEGAL",
      content: (
        <>
          <p>©2008-2026 Made in Evolve S.r.l.</p>
          <p>P.IVA IT03497200364 // REA MO392876</p>
          <p>Capitale Sociale: 12.000 Eur</p>
        </>
      ),
      links: [
        { label: "Privacy Policy", href: "#" },
        { label: "Other Policies", href: "#" },
      ],
    },
    {
      label: "(c.) NEWSLETTER",
      content: (
        <>
          <p>Get eCommerce insights in your inbox.</p>
          <p>No spam, just relevant stories.</p>
        </>
      ),
      // Newsletter column renders its own input + button below, not links.
      links: [],
    },
    {
      label: "(d.) PRESS",
      content: null,
      links: [
        { label: "Forbes", href: "#" },
        { label: "Pambianco News", href: "#" },
        { label: "Pambianco News", href: "#" },
        { label: "Forbes", href: "#" },
      ],
      // Second stacked group under the same column, matches the ref image
      // (Instagram / Linkedin sit below Press with a gap).
      secondaryLinks: [
        { label: "Instagram", href: "#" },
        { label: "Linkedin", href: "#" },
      ],
    },
  ],
};
// ─────────────────────────────────────────────────────────────────────────

const clamp01 = (n: number) => Math.min(1, Math.max(0, n));

function frameUrl(index: number) {
  // index is 1-based to match frame-001 ... frame-045
  const padded = String(index).padStart(CONFIG.FRAME_PAD, "0");
  return `${CONFIG.FRAME_BASE_URL}${padded}.webp`;
}

export default function Footer() {
  const emailRef = useRef<HTMLInputElement>(null);
  const footerRef = useRef<HTMLElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Loaded <img> elements, indexed 0..FRAME_COUNT-1. Populated as each
  // frame finishes loading — draw loop just uses whatever's newest that's
  // actually ready, same "don't block on the whole set" approach as the
  // main sequence.
  const framesRef = useRef<(HTMLImageElement | null)[]>(
    new Array(CONFIG.FRAME_COUNT).fill(null)
  );

  // Scroll-derived progress, written by the scroll listener and read by
  // the rAF draw loop — kept in a ref (not state) so scrolling doesn't
  // trigger a React re-render on every tick.
  const progressRef = useRef(0);
  const lastDrawnFrameRef = useRef(-1);

  const [framesReady, setFramesReady] = useState(false);

  // Preload all 45 frames once on mount.
  useEffect(() => {
    let cancelled = false;
    let loadedCount = 0;

    for (let i = 0; i < CONFIG.FRAME_COUNT; i++) {
      const img = new Image();
      img.src = frameUrl(i + 1);
      img.onload = () => {
        if (cancelled) return;
        framesRef.current[i] = img;
        loadedCount += 1;
        // Consider it "ready enough" once the first frame is in, so the
        // canvas can start painting immediately rather than waiting on
        // all 45.
        if (loadedCount === 1) setFramesReady(true);
      };
    }

    return () => {
      cancelled = true;
    };
  }, []);

  // Scroll listener — computes 0..1 progress based on the footer's
  // position relative to the viewport, entrance-style (not pinned).
  useEffect(() => {
    const handleScroll = () => {
      const el = footerRef.current;
      if (!el) return;
      const rect = el.getBoundingClientRect();
      const vh = window.innerHeight;
      const scrubPx = vh * CONFIG.SCRUB_DISTANCE_VH;

      // rect.top goes from vh (footer just below the fold) toward 0 as
      // it scrolls up into view. Map that to 0->1 over `scrubPx`.
      const raw = (vh - rect.top) / scrubPx;
      progressRef.current = clamp01(raw);
    };

    handleScroll();
    window.addEventListener("scroll", handleScroll, { passive: true });
    window.addEventListener("resize", handleScroll);
    return () => {
      window.removeEventListener("scroll", handleScroll);
      window.removeEventListener("resize", handleScroll);
    };
  }, []);

  // Canvas sizing — matches its container box, scaled for devicePixelRatio
  // so frames stay sharp on retina screens.
  useEffect(() => {
    const canvas = canvasRef.current;
    const container = footerRef.current;
    if (!canvas || !container) return;

    const resizeCanvas = () => {
      const dpr = window.devicePixelRatio || 1;
      const rect = container.getBoundingClientRect();
      canvas.width = rect.width * dpr;
      canvas.height = rect.height * dpr;
      canvas.style.width = `${rect.width}px`;
      canvas.style.height = `${rect.height}px`;
      const ctx = canvas.getContext("2d");
      ctx?.setTransform(dpr, 0, 0, dpr, 0, 0);
    };

    resizeCanvas();
    window.addEventListener("resize", resizeCanvas);
    return () => window.removeEventListener("resize", resizeCanvas);
  }, []);

  // rAF draw loop — reads progress + frame cache each tick, only actually
  // draws when the target frame index has changed since last paint.
  useEffect(() => {
    let rafId: number;

    const draw = () => {
      rafId = requestAnimationFrame(draw);

      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext("2d");
      if (!ctx) return;

      const targetIndex = Math.min(
        CONFIG.FRAME_COUNT - 1,
        Math.floor(progressRef.current * CONFIG.FRAME_COUNT)
      );

      if (targetIndex === lastDrawnFrameRef.current) return;

      // Walk backward from the target frame to the nearest one that's
      // actually loaded yet, so early scroll doesn't flash a blank canvas
      // while later frames are still downloading.
      let frame: HTMLImageElement | null = null;
      for (let i = targetIndex; i >= 0; i--) {
        if (framesRef.current[i]) {
          frame = framesRef.current[i];
          break;
        }
      }
      if (!frame) return;

      const dpr = window.devicePixelRatio || 1;
      const cw = canvas.width / dpr;
      const ch = canvas.height / dpr;

      // cover-fit: scale image to fill the canvas box, cropping overflow,
      // same visual behavior as CSS object-fit: cover.
      const imgRatio = frame.width / frame.height;
      const boxRatio = cw / ch;
      let drawW = cw;
      let drawH = ch;
      if (imgRatio > boxRatio) {
        drawH = ch;
        drawW = ch * imgRatio;
      } else {
        drawW = cw;
        drawH = cw / imgRatio;
      }
      const offsetX = (cw - drawW) / 2;
      const offsetY = (ch - drawH) / 2;

      ctx.clearRect(0, 0, cw, ch);
      ctx.drawImage(frame, offsetX, offsetY, drawW, drawH);
      lastDrawnFrameRef.current = targetIndex;
    };

    rafId = requestAnimationFrame(draw);
    return () => cancelAnimationFrame(rafId);
  }, []);

  const handleJoin = () => {
    const value = emailRef.current?.value?.trim();
    if (!value) return;
    // TODO: wire up to your actual newsletter endpoint
    console.log("newsletter signup:", value);
  };

  // Vertical grid rules — same 24-column track, color and edge padding as
  // the HowWeWork section, so the lines read as one continuous grid running
  // straight down through the footer.
  const GRID_COLUMNS = 48;
  const GRID_LINE_COLOR = "rgba(255,255,255,0.10)";
  const GRID_PADDING_X = "clamp(16px, 4vw, 40px)";
  const line = `1px solid ${GRID_LINE_COLOR}`;
  const gridCss = `
    .ftr-lines { display: grid; grid-template-columns: repeat(${GRID_COLUMNS}, minmax(0, 1fr)); grid-template-rows: 1fr; height: 100%; border-right: ${line}; }
    .ftr-lines > span { border-left: ${line}; }
  `;

  return (
    <footer
      ref={footerRef}
      data-header-theme="dark"
      className="relative min-h-[720px] w-full overflow-hidden text-white"
    >
      {/* Background frame sequence — canvas painted by the rAF loop above,
          scrubbing frame-001..045 as the footer scrolls into view. */}
      <div
        className="absolute inset-0 z-0"
        style={{ backgroundColor: CONFIG.BG_FALLBACK }}
      >
        <canvas
          ref={canvasRef}
          className="h-full w-full transition-opacity duration-300"
          style={{ opacity: framesReady ? 1 : 0 }}
        />
        {/* Scrim for text contrast over the footage */}
        <div
          className="absolute inset-0"
          style={{ backgroundColor: `rgba(0,0,0,${CONFIG.SCRIM_OPACITY})` }}
        />
      </div>

      {/* Vertical grid rules — sit above the scrim (z-[1]) but below the
          content (z-10), spanning the full footer height. */}
      <style>{gridCss}</style>
      <div
        className="pointer-events-none absolute inset-0 z-[1]"
        style={{ paddingLeft: GRID_PADDING_X, paddingRight: GRID_PADDING_X }}
      >
        <div className="ftr-lines">
          {Array.from({ length: GRID_COLUMNS }).map((_, i) => (
            <span key={i} />
          ))}
        </div>
      </div>

      {/* Center CTA — deliberately minimal: a small tracked label and the
          email, letting the frame-scrub footage carry the moment instead
          of display type shouting over it. */}
      <div className="relative z-10 flex min-h-[560px] flex-col items-center justify-center gap-4 px-6 text-center">
        <p className="text-xs uppercase tracking-[0.25em] text-white/60">
          ( {CONFIG.HEADLINE} )
        </p>
        <a
          href={`mailto:${CONFIG.EMAIL}`}
          className="max-w-full wrap-break-word text-xl font-medium tracking-tight underline decoration-white/40 underline-offset-8 transition-colors hover:decoration-white sm:text-2xl md:text-3xl"
        >
          {CONFIG.EMAIL}
        </a>
      </div>

      {/* Bottom nav — 4 columns, no vertical grid lines. Bottom padding
          clears the iOS home indicator. */}
      <div className="relative z-10 grid grid-cols-1 gap-10 px-6 pb-[calc(3rem+env(safe-area-inset-bottom))] pt-8 sm:grid-cols-2 lg:grid-cols-4 lg:px-16">
        {CONFIG.NAV_COLUMNS.map((col) => (
          <div key={col.label} className="flex flex-col gap-4">
            <span className="font-mono text-xs uppercase tracking-[0.15em] text-white/60">
              {col.label}
            </span>

            {col.content && (
              <div className="space-y-0.5 text-sm leading-relaxed text-white/80">
                {col.content}
              </div>
            )}

            {col.label === "(c.) NEWSLETTER" && (
              <div className="mt-1 flex flex-col gap-3">
                <input
                  ref={emailRef}
                  type="email"
                  placeholder="enter your email"
                  className="w-full max-w-xs border border-white/20 bg-transparent px-3 py-2 text-base text-white placeholder-white/40 outline-none focus:border-white/50 md:text-sm"
                />
                <button
                  onClick={handleJoin}
                  className="w-fit border border-white/30 px-4 py-2 text-xs font-bold uppercase tracking-wide transition-colors hover:bg-white hover:text-black"
                >
                  Join Now
                </button>
              </div>
            )}

            {col.links.length > 0 && (
              <div className="flex flex-col gap-0.5 text-sm text-white/80">
                {col.links.map((link, idx) => (
                  <a
                    key={`${link.label}-${idx}`}
                    href={link.href}
                    className="w-fit transition-opacity hover:opacity-70"
                  >
                    {link.label}
                  </a>
                ))}
              </div>
            )}

            {"secondaryLinks" in col && col.secondaryLinks && col.secondaryLinks.length > 0 && (
              <div className="mt-2 flex flex-col gap-0.5 text-sm text-white/80">
                {col.secondaryLinks.map((link, idx) => (
                  <a
                    key={`${link.label}-${idx}`}
                    href={link.href}
                    className="w-fit transition-opacity hover:opacity-70"
                  >
                    {link.label}
                  </a>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>
    </footer>
  );
}