"use client";

// ─────────────────────────────────────────────────────────────────────────
// 🎛️ TWEAK HERE
// ─────────────────────────────────────────────────────────────────────────
const CONFIG = {
  BG: "#0a0a0a", // panel background — stays dark throughout, no color flip

  // ── Modular grid ─────────────────────────────────────────────────────
  // The vertical rules are NO LONGER a fixed-px repeating gradient — they're
  // drawn from the SAME 24-column CSS grid the content is laid out on, so
  // labels/cards/copy always land exactly on a line at every viewport width.
  GRID_COLUMNS: 24,
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
  CARD_PADDING: "24px 22px",

  // ── Section spacing ─────────────────────────────────────────────────
  SECTION_PADDING_X: 40, // px, horizontal padding (edge margin, outside the lines)
  SECTION_PADDING_TOP: 104, // px, clears the fixed header so the headline sits under it
  SECTION_PADDING_BOTTOM: 56, // px
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

const lerp = (a: number, b: number, t: number) => a + (b - a) * t;

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

  // NOTE: the lower-block reveal (GRID_REVEAL_*) is intentionally disabled for
  // now — the services block renders statically until the design is locked.
  void stepsProgress;

  const COLS = CONFIG.GRID_COLUMNS;
  const line = `1px solid ${CONFIG.GRID_LINE_COLOR}`;
  // Base (mobile): labels/copy full width, cards 2-up. md+ : everything snaps
  // onto the 24-column track so it lines up with the vertical rules.
  const gridCss = `
    .hww-lines { display: grid; grid-template-columns: repeat(${COLS}, minmax(0, 1fr)); grid-template-rows: 1fr; height: 100%; border-right: ${line}; }
    .hww-lines > span { border-left: ${line}; }
    .hww-grid { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); column-gap: 16px; row-gap: ${CONFIG.LOWER_LABEL_GAP}px; }
    .hww-a, .hww-b, .hww-copy { grid-column: 1 / -1; }
    @media (min-width: 768px) {
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
      .hww-a { grid-column: 1 / span 8; grid-row: 1; }
      .hww-b { grid-column: 19 / span 6; grid-row: 1; }
      .hww-copy { grid-column: 19 / span 6; grid-row: 2; }
      .hww-card-1 { grid-column: 1 / span 3; grid-row: 2; }
      .hww-card-2 { grid-column: 5 / span 3; grid-row: 2; }
      .hww-card-3 { grid-column: 9 / span 3; grid-row: 2; }
      .hww-card-4 { grid-column: 13 / span 3; grid-row: 2; }
      /* Cards fill the content row's height; copy flows from the top. */
      .hww-card-1, .hww-card-2, .hww-card-3, .hww-card-4 { height: 100%; }
      .hww-copy { align-self: start; }
    }
  `;

  return (
    <div
      className="absolute inset-0 z-20 overflow-hidden"
      style={{
        // The page is full-bleed now (no padding on <main>), so the panel
        // simply covers the whole sticky viewport via inset-0. (It used to
        // carry negative -40 insets to cancel a px-[40px]/py-10 padding on
        // page.tsx — that padding is gone, so those insets are removed.)
        backgroundColor: CONFIG.BG,
        // ⚠️ Scroll-driven: no CSS transition on transform, or it'll lag
        // behind the scrollbar instead of tracking it 1:1.
        transform: `translateX(${translateX}%)`,
        pointerEvents: progress > CONFIG.INTERACTIVE_THRESHOLD ? "auto" : "none",
      }}
    >
      {/* Modular grid + responsive column placement. Kept in one <style>
          tag (driven by CONFIG) so the vertical rules and the content can
          share the EXACT same 24-column track and stay aligned at every
          width — a fixed-px repeating gradient can't do that. */}
      <style>{gridCss}</style>

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
        {/* Headline — plain static white text, no scroll-scrub color.
            Uses the project's PPMori (font-sans) at SemiBold, not Anton.
            justify-between on the column pushes the headline to the top and
            the lower block to the bottom, so the two together fill the whole
            screen height. textIndent pushes only the FIRST line in (per the
            reference), landing on a grid line since the indent is a % of the
            track. */}
        <h2
          className="font-sans font-semibold leading-[1.1] tracking-[-0.01em] text-white"
          style={{
            fontSize: CONFIG.HEADLINE_FONT,
            textIndent: CONFIG.FIRST_LINE_INDENT,
          }}
        >
          {HEADLINE}
        </h2>

        {/* Services block — fixed height (LOWER_HEIGHT). Reveal animation is
            intentionally OFF for now (static), per current design pass. */}
        <div className="hww-grid">
          {/* Column labels — each sits directly above the column it names:
              "Our Services" over the cards, "Est. 2008©" over the right copy. */}
          <span className="hww-a font-sans text-sm" style={{ color: CONFIG.LABEL_COLOR }}>
            Our Services
          </span>
          <span className="hww-b font-sans text-sm" style={{ color: CONFIG.LABEL_COLOR }}>
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
                backgroundColor: CONFIG.CARD_BG,
                border: `1px solid ${CONFIG.CARD_BORDER}`,
                padding: CONFIG.CARD_PADDING,
              }}
            >
              <h3 className="font-sans text-sm font-normal leading-snug text-white/90">
                {service.title}
              </h3>
            </div>
          ))}

          {/* Right copy column — narrower and pushed right, sitting on the
              last columns of the track with a grid-aligned gutter. */}
          <div className="hww-copy">
            <p className="mb-3 text-sm leading-relaxed" style={{ color: CONFIG.BODY_COLOR }}>
              Every eCommerce is already in motion. Processes, people,
              numbers, decisions. Our job isn&apos;t to sit on top of it.{" "}
              <strong className="text-white">It&apos;s to step inside.</strong>
            </p>
            <p className="mb-3 text-sm leading-relaxed" style={{ color: CONFIG.BODY_COLOR }}>
              We work alongside teams, read the business, identify where
              energy is being lost and where it needs to be amplified. We
              don&apos;t operate in silos:{" "}
              <strong className="text-white">
                design, technology and marketing move together
              </strong>
              , because that&apos;s how growth becomes sustainable.
            </p>
            <p className="text-sm leading-relaxed" style={{ color: CONFIG.BODY_COLOR }}>
              With in-house teams collaborating in real time, we reduce
              friction, align decisions and turn complexity into
              structure. We don&apos;t add noise.{" "}
              <strong className="text-white">We bring direction.</strong>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}