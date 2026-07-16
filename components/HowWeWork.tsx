"use client";

import { useCallback, useEffect, useRef, useSyncExternalStore } from "react";

// ─────────────────────────────────────────────────────────────────────────
// 🎛️ TWEAK HERE
// ─────────────────────────────────────────────────────────────────────────
const CONFIG = {
  BG: "#0a0a0a", // panel background — dark base layer
  YELLOW: "#FFE500", // reveal layer shown through the cursor blob

  // ── Cursor ink trail (sidewave.it-style) ────────────────────────────
  // Moving the cursor STAMPS small ink blots along its path; each blot
  // spreads slightly and evaporates over INK_LIFE seconds, so motion
  // paints a dissipating stroke of yellow through the black rather than
  // a circle glued to the pointer. A stationary cursor leaves nothing.
  // The blots live in an SVG mask and get their ragged ink edge from
  // feTurbulence + feDisplacementMap.
  INK_STAMP_RADIUS: 20, // px, base blot radius at birth
  INK_STAMP_SPACING: 10, // px of cursor travel between stamps — lower = denser stroke
  INK_LIFE: 1.6, // seconds a blot takes to spread + evaporate (goo threshold eats ~the last half)
  INK_POOL: 64, // max simultaneous blots (ring buffer, oldest reused)
  // Goo fusion: blur melts overlapping blots together, then the alpha
  // threshold re-hardens the merged silhouette into ONE smooth liquid
  // stroke — this is what kills the "powdery separate specks" look.
  INK_GOO_BLUR: 9, // px — bigger = blobs fuse from further apart
  INK_GOO_CONTRAST: 18, // alpha multiplier of the threshold step
  INK_GOO_OFFSET: -7, // alpha offset — with contrast, cuts in around 40% alpha
  INK_ROUGHNESS: 0.015, // feTurbulence baseFrequency — lower = longer smooth undulations
  INK_DISPLACEMENT: 30, // feDisplacementMap scale — gentle organic wobble on the merged edge

  // ── Modular grid ─────────────────────────────────────────────────────
  // The vertical rules are NO LONGER a fixed-px repeating gradient — they're
  // drawn from the SAME CSS grid the content is laid out on, so
  // labels/cards/copy always land exactly on a line at every viewport width.
  // 48 columns = double the original line density; all the md+ column
  // placements below are expressed on this track (2× the old 24-col spans).
  GRID_COLUMNS: 48,
  GRID_LINE_COLOR: "rgba(255,255,255,0.10)", // a touch brighter than before

  LABEL_COLOR: "rgba(255,255,255,0.92)", // "Our Services" / "Est. 2008©"
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
  // Fluid: phones get compact cards (the 2×2 grid has to share one screen
  // with the headline), desktop keeps the original 24/22.
  CARD_PADDING: "clamp(14px, 2vw, 24px) clamp(12px, 1.8vw, 22px)",

  // ── Section spacing ─────────────────────────────────────────────────
  // Horizontal edge padding — fluid so the panel breathes on phones
  // (16px) and keeps the original 40px on desktop.
  SECTION_PADDING_X: "clamp(16px, 4vw, 40px)",
  // Vertical padding is fluid too: the whole panel must fit a ~660px
  // phone viewport without falling back to inner scrolling.
  SECTION_PADDING_TOP: "clamp(76px, 11svh, 104px)", // clears the fixed header
  SECTION_PADDING_BOTTOM: "clamp(28px, 5svh, 56px)",
  FIRST_LINE_INDENT: "12.5%", // indent on the headline's first line (per ref)

  // ── Lower (services) block ──────────────────────────────────────────
  HEADLINE_TO_SERVICES_GAP: 34, // px, gap between the headline and the lower block
  LOWER_HEIGHT: 311, // px, fixed height of the whole lower block (labels + cards/copy)
  LOWER_LABEL_GAP: 20, // px, gap between the "Our Services" labels row and the cards

  // Headline is sized with a viewport-relative clamp (not a fixed px), so
  // it always lands around the top half and leaves the bottom half for the
  // cards + copy — the whole section fits in one screen like the reference.
  // min / preferred(vw) / max.
  HEADLINE_FONT: "clamp(1.5rem, 2.6vw, 2.5rem)",
};
// ─────────────────────────────────────────────────────────────────────────

// The two color treatments the panel renders in. `dark` is the base layer;
// `yellow` is the copy revealed through the cursor blob.
const THEMES = {
  dark: {
    bg: CONFIG.BG,
    line: CONFIG.GRID_LINE_COLOR,
    label: CONFIG.LABEL_COLOR,
    body: CONFIG.BODY_COLOR,
    cardBg: CONFIG.CARD_BG,
    cardBorder: CONFIG.CARD_BORDER,
    text: "#ffffff",
    strong: "#ffffff",
  },
  yellow: {
    bg: CONFIG.YELLOW,
    line: "rgba(0,0,0,0.14)",
    label: "rgba(0,0,0,0.92)",
    body: "rgba(0,0,0,0.72)",
    cardBg: "rgba(0,0,0,0.05)",
    cardBorder: "rgba(0,0,0,0.12)",
    text: "#0a0a0a",
    strong: "#0a0a0a",
  },
};
type Theme = (typeof THEMES)["dark"];

const lerp = (a: number, b: number, t: number) => a + (b - a) * t;

// One ink blot stamped along the cursor's path.
interface InkStamp {
  x: number;
  y: number;
  base: number; // birth radius (randomized a touch for organic variance)
  born: number; // performance.now() timestamp
}

const HEADLINE =
  "We are an eCommerce agency. Not just execution, not isolated services. We provide brand direction, advanced tech, performance marketing and system integration as one connected approach. An end-to-end ecosystem designed to scale, perform and integrate seamlessly with existing platforms.";

const services = [
  { id: "01", title: "Brand Direction" },
  { id: "02", title: "Advanced Tech" },
  { id: "03", title: "Performance Marketing" },
  { id: "04", title: "Merchant of Records" },
];

// ─────────────────────────────────────────────────────────────────────────
// The panel's full inner content (grid rules + headline + services block),
// rendered once per theme. Every color comes from the theme so the yellow
// copy is a true inversion, not just a background swap.
// ─────────────────────────────────────────────────────────────────────────
function PanelInner({ theme }: { theme: Theme }) {
  return (
    <div
      className="absolute inset-0"
      style={{ backgroundColor: theme.bg, "--hww-line": theme.line } as React.CSSProperties}
    >
      {/* Vertical rules — drawn FROM the same 24-col track as the content,
          inside the same horizontal padding, so every card/label edge lands
          on a line. Spans the full panel height. */}
      <div
        className="pointer-events-none absolute inset-0"
        style={{ paddingLeft: CONFIG.SECTION_PADDING_X, paddingRight: CONFIG.SECTION_PADDING_X }}
      >
        <div className="hww-lines">
          {Array.from({ length: CONFIG.GRID_COLUMNS }).map((_, i) => (
            <span key={i} />
          ))}
        </div>
      </div>

      <div
        className="relative flex h-full flex-col justify-between overflow-y-auto"
        style={{
          paddingLeft: CONFIG.SECTION_PADDING_X,
          paddingRight: CONFIG.SECTION_PADDING_X,
          paddingTop: CONFIG.SECTION_PADDING_TOP,
          paddingBottom: CONFIG.SECTION_PADDING_BOTTOM,
        }}
      >
        {/* Headline — plain static text, no scroll-scrub color.
            Uses the project's PPMori (font-sans) at SemiBold, not Anton.
            justify-between on the column pushes the headline to the top and
            the lower block to the bottom, so the two together fill the whole
            screen height. textIndent pushes only the FIRST line in (per the
            reference), landing on a grid line since the indent is a % of the
            track. */}
        <h2
          className="hww-headline font-sans font-semibold leading-[1.1] tracking-[-0.01em]"
          style={{
            textIndent: CONFIG.FIRST_LINE_INDENT,
            color: theme.text,
          }}
        >
          {HEADLINE}
        </h2>

        {/* Services block — fixed height (LOWER_HEIGHT). Reveal animation is
            intentionally OFF for now (static), per current design pass. */}
        <div className="hww-grid">
          {/* Column labels — each sits directly above the column it names:
              "Our Services" over the cards, "Est. 2008©" over the right copy. */}
          <span className="hww-a font-sans text-sm" style={{ color: theme.label }}>
            Our Services
          </span>
          <span className="hww-b font-sans text-sm" style={{ color: theme.label }}>
            Est. 2008©
          </span>

          {/* Cards — title only, top-left, tall empty body below (per ref).
              Each card is placed on its own 3-col slot of the master track,
              with the empty column between slots forming the gutter, so card
              edges sit on grid lines. */}
          {services.map((service, i) => (
            <div
              key={service.id}
              className={`hww-card hww-card-${i + 1}`}
              style={{
                backgroundColor: theme.cardBg,
                border: `1px solid ${theme.cardBorder}`,
                padding: CONFIG.CARD_PADDING,
              }}
            >
              <h3
                className="font-sans text-sm font-normal leading-snug"
                style={{ color: theme.label }}
              >
                {service.title}
              </h3>
            </div>
          ))}

          {/* Right copy column — narrower and pushed right, sitting on the
              last columns of the track with a grid-aligned gutter. */}
          <div className="hww-copy">
            <p className="mb-3 text-sm leading-relaxed" style={{ color: theme.body }}>
              Every eCommerce is already in motion. Processes, people,
              numbers, decisions. Our job isn&apos;t to sit on top of it.{" "}
              <strong style={{ color: theme.strong }}>It&apos;s to step inside.</strong>
            </p>
            {/* Phones get the one paragraph that matters — the rest of the
                copy would push the panel past one screen and force inner
                scrolling inside the pinned section. */}
            <p className="mb-3 hidden text-sm leading-relaxed md:block" style={{ color: theme.body }}>
              We work alongside teams, read the business, identify where
              energy is being lost and where it needs to be amplified. We
              don&apos;t operate in silos:{" "}
              <strong style={{ color: theme.strong }}>
                design, technology and marketing move together
              </strong>
              , because that&apos;s how growth becomes sustainable.
            </p>
            <p className="hidden text-sm leading-relaxed md:block" style={{ color: theme.body }}>
              With in-house teams collaborating in real time, we reduce
              friction, align decisions and turn complexity into
              structure. We don&apos;t add noise.{" "}
              <strong style={{ color: theme.strong }}>We bring direction.</strong>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

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

  // NOTE: the lower-block reveal (GRID_REVEAL_*) is intentionally disabled for
  // now — the services block renders statically until the design is locked.
  void stepsProgress;

  // ── Cursor ink state ──
  // Pointer movement stamps blots into a fixed ring buffer (oldest slot
  // reused — no DOM churn); the rAF loop ages every live blot each frame:
  // it spreads a little and its opacity evaporates to nothing over
  // INK_LIFE. All updates are attribute writes on pooled <circle>s inside
  // the SVG mask — no React re-render per mouse move, and the ink edge
  // comes from the turbulence filter.
  const panelRef = useRef<HTMLDivElement>(null);
  const circlesRef = useRef<(SVGCircleElement | null)[]>([]);
  const stampsRef = useRef<(InkStamp | null)[]>(Array(CONFIG.INK_POOL).fill(null));
  const headRef = useRef(0); // next ring-buffer slot to write
  const lastStampRef = useRef<{ x: number; y: number } | null>(null);

  // Walk the segment from the last stamp point to (x, y), dropping a blot
  // every INK_STAMP_SPACING px — shared by the mouse trail AND the
  // autonomous touch-device brush below, so both paint identical strokes.
  const stampPath = useCallback((x: number, y: number) => {
    // First call just seeds the trail origin — no blot, so a stroke
    // doesn't splat until the brush actually travels.
    const last = lastStampRef.current;
    if (!last) {
      lastStampRef.current = { x, y };
      return;
    }

    let dx = x - last.x;
    let dy = y - last.y;
    let dist = Math.hypot(dx, dy);
    const now = performance.now();
    while (dist >= CONFIG.INK_STAMP_SPACING) {
      const step = CONFIG.INK_STAMP_SPACING / dist;
      last.x += dx * step;
      last.y += dy * step;
      stampsRef.current[headRef.current] = {
        x: last.x,
        y: last.y,
        // ±20% size jitter keeps the stroke from reading as a tube
        base: CONFIG.INK_STAMP_RADIUS * (0.8 + Math.random() * 0.4),
        born: now,
      };
      headRef.current = (headRef.current + 1) % CONFIG.INK_POOL;
      dx = x - last.x;
      dy = y - last.y;
      dist = Math.hypot(dx, dy);
    }
  }, []);

  // The ink reveal is cursor-driven, so it's a no-op on touch devices —
  // there the panel simply stays black, and the whole yellow layer + SVG
  // mask pipeline is skipped (rendering it just burns mobile GPU time; an
  // earlier autonomous-reveal experiment flickered and wasn't worth it).
  const isTouch = useSyncExternalStore(
    (onChange) => {
      const mq = window.matchMedia("(hover: none)");
      mq.addEventListener("change", onChange);
      return () => mq.removeEventListener("change", onChange);
    },
    () => window.matchMedia("(hover: none)").matches,
    () => false // SSR: assume hover until the client says otherwise
  );

  useEffect(() => {
    let frameId = 0;

    const tick = (now: number) => {
      const stamps = stampsRef.current;
      for (let i = 0; i < stamps.length; i++) {
        const circle = circlesRef.current[i];
        if (!circle) continue;
        const stamp = stamps[i];
        const t = stamp ? (now - stamp.born) / (CONFIG.INK_LIFE * 1000) : 1;
        if (!stamp || t >= 1) {
          if (circle.getAttribute("r") !== "0") circle.setAttribute("r", "0");
          continue;
        }
        // Ink physics, cheap version: the blot spreads as it dries
        // (radius grows ~50%) while its density evaporates. The ease-out
        // power on opacity keeps it vivid early, ghostly late.
        const r = stamp.base * (0.75 + 0.55 * t);
        const opacity = Math.pow(1 - t, 1.6);
        circle.setAttribute("cx", String(stamp.x));
        circle.setAttribute("cy", String(stamp.y));
        circle.setAttribute("r", String(r));
        circle.setAttribute("fill-opacity", String(opacity));
      }
      frameId = requestAnimationFrame(tick);
    };

    frameId = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frameId);
  }, []);

  const COLS = CONFIG.GRID_COLUMNS;
  // Base (mobile): labels/copy full width, cards 2-up. md+ : everything snaps
  // onto the 24-column track so it lines up with the vertical rules.
  // Line color comes from --hww-line, set per theme layer, so the dark and
  // yellow copies of the panel share this one stylesheet.
  const gridCss = `
    .hww-lines { display: grid; grid-template-columns: repeat(${COLS}, minmax(0, 1fr)); grid-template-rows: 1fr; height: 100%; border-right: 1px solid var(--hww-line); }
    .hww-lines > span { border-left: 1px solid var(--hww-line); }
    /* Headline: fluid on phones (must share one screen with the 2x2 card
       grid + copy), original clamp from md up. */
    .hww-headline { font-size: clamp(1.0625rem, 4.6vw, 1.5rem); }
    .hww-grid { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); column-gap: 12px; row-gap: 12px; }
    /* Phones: the two labels share one row (left / right ends), cards flow
       2-up underneath, copy spans full width below. */
    .hww-a { grid-column: 1; }
    .hww-b { grid-column: 2; text-align: right; }
    .hww-copy { grid-column: 1 / -1; margin-top: 8px; }
    .hww-card { min-height: 74px; }
    @media (min-width: 768px) {
      .hww-headline { font-size: ${CONFIG.HEADLINE_FONT}; }
      .hww-b { text-align: left; }
      .hww-copy { margin-top: 0; }
      .hww-card { min-height: 0; }
      /* Fixed-height lower block: a labels row (auto) + a content row (fills
         the rest). Cards & copy live in the content row and are pinned to
         its top (align-items:start) so cards no longer STRETCH to the tall
         copy column — they take the content-row height instead. */
      .hww-grid {
        grid-template-columns: repeat(${COLS}, minmax(0, 1fr));
        grid-template-rows: auto minmax(0, 1fr);
        column-gap: 0;
        row-gap: ${CONFIG.LOWER_LABEL_GAP}px;
        height: ${CONFIG.LOWER_HEIGHT}px;
      }
      .hww-a { grid-column: 1 / span 16; grid-row: 1; }
      .hww-b { grid-column: 37 / span 12; grid-row: 1; }
      .hww-copy { grid-column: 37 / span 12; grid-row: 2; }
      .hww-card-1 { grid-column: 1 / span 6; grid-row: 2; }
      .hww-card-2 { grid-column: 9 / span 6; grid-row: 2; }
      .hww-card-3 { grid-column: 17 / span 6; grid-row: 2; }
      .hww-card-4 { grid-column: 25 / span 6; grid-row: 2; }
      /* Cards fill the content row's height; copy flows from the top. */
      .hww-card-1, .hww-card-2, .hww-card-3, .hww-card-4 { height: 100%; }
      .hww-copy { align-self: start; }
    }
  `;

  return (
    <div
      ref={panelRef}
      data-header-theme="dark"
      className="absolute inset-0 z-20 overflow-hidden"
      style={{
        // The page is full-bleed now (no padding on <main>), so the panel
        // simply covers the whole sticky viewport via inset-0. (It used to
        // carry negative -40 insets to cancel a px-[40px]/py-10 padding on
        // page.tsx — that padding is gone, so those insets are removed.)
        // ⚠️ Scroll-driven: no CSS transition on transform, or it'll lag
        // behind the scrollbar instead of tracking it 1:1.
        transform: `translateX(${translateX}%)`,
        pointerEvents: progress > CONFIG.INTERACTIVE_THRESHOLD ? "auto" : "none",
      }}
      onPointerMove={(e) => {
        // Mouse only — on touch there's no meaningful "cursor" for the ink
        // to trail behind, and a tap would just flash a blot under the finger.
        if (e.pointerType !== "mouse") return;
        const panel = panelRef.current;
        if (!panel) return;
        const rect = panel.getBoundingClientRect();
        // Stamp blots along the segment the cursor covered since the
        // previous event, so fast flicks paint a continuous stroke
        // instead of scattered dots.
        stampPath(e.clientX - rect.left, e.clientY - rect.top);
      }}
      onPointerLeave={() => {
        // Re-seed on next entry — otherwise re-entering on the far side
        // of the panel would paint a streak straight across it.
        lastStampRef.current = null;
      }}
    >
      {/* Modular grid + responsive column placement. Kept in one <style>
          tag (driven by CONFIG) so the vertical rules and the content can
          share the EXACT same 24-column track and stay aligned at every
          width — a fixed-px repeating gradient can't do that. */}
      <style>{gridCss}</style>

      {/* Ink mask plumbing: hard-edged circles (the cursor chain) pushed
          through fractal-noise displacement, turning clean geometry into a
          ragged ink splash. The <mask> starts all-black (circles at r=0),
          so the yellow layer is invisible until the cursor moves.
          Mouse-only — on touch the whole SVG pipeline is skipped (see the
          spotlight walker above for why). */}
      {!isTouch && (
      <svg aria-hidden className="absolute h-0 w-0">
        <defs>
          <filter id="hww-ink-filter" x="-60%" y="-60%" width="220%" height="220%">
            {/* 1. Fuse: heavy blur melts the individual stamps into one
                   soft cloud… */}
            <feGaussianBlur in="SourceGraphic" stdDeviation={CONFIG.INK_GOO_BLUR} result="blurred" />
            {/* 2. …and the alpha threshold re-hardens that cloud into a
                   single crisp liquid silhouette (metaball/goo trick).
                   Fading blots slip under the threshold and evaporate by
                   shrinking, like ink drying — no powdery residue. */}
            <feColorMatrix
              in="blurred"
              type="matrix"
              values={`1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 ${CONFIG.INK_GOO_CONTRAST} ${CONFIG.INK_GOO_OFFSET}`}
              result="goo"
            />
            {/* 3. Wobble the merged edge organically — gentle, not torn. */}
            <feTurbulence
              type="fractalNoise"
              baseFrequency={CONFIG.INK_ROUGHNESS}
              numOctaves={2}
              seed={7}
              result="noise"
            />
            <feDisplacementMap
              in="goo"
              in2="noise"
              scale={CONFIG.INK_DISPLACEMENT}
              xChannelSelector="R"
              yChannelSelector="G"
            />
          </filter>
          {/* ⚠️ Region must be absolute px, not percentages: with
              maskUnits="userSpaceOnUse", %-values resolve against THIS
              svg's viewport — which is 0×0 — collapsing the mask region
              to nothing (the "yellow never shows" bug). The generous
              fixed box covers any viewport + displacement overshoot. */}
          <mask
            id="hww-ink-mask"
            maskUnits="userSpaceOnUse"
            x="-500"
            y="-500"
            width="8000"
            height="8000"
          >
            <g filter="url(#hww-ink-filter)">
              {Array.from({ length: CONFIG.INK_POOL }).map((_, i) => (
                <circle
                  key={i}
                  ref={(el) => {
                    circlesRef.current[i] = el;
                  }}
                  cx={-999}
                  cy={-999}
                  r={0}
                  fill="#fff"
                />
              ))}
            </g>
          </mask>
        </defs>
      </svg>
      )}

      {/* Dark base layer */}
      <PanelInner theme={THEMES.dark} />

      {/* Yellow reveal layer — identical content, inverted palette, masked
          by the ink splash. pointer-events-none so the dark layer keeps
          handling all interaction. Mouse-only, like the mask that drives it. */}
      {!isTouch && (
        <div
          className="pointer-events-none absolute inset-0"
          style={{ mask: "url(#hww-ink-mask)", WebkitMask: "url(#hww-ink-mask)" }}
        >
          <PanelInner theme={THEMES.yellow} />
        </div>
      )}
    </div>
  );
}
