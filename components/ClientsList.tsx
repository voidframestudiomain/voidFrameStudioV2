"use client";

import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import Image from "next/image";

// ─────────────────────────────────────────────────────────────────────────
// 🎛️ TWEAK HERE
// ─────────────────────────────────────────────────────────────────────────
const CONFIG = {
  BG: "#0a0a0a",
  ACCENT: "#FFE500", // hover strip where the row crosses the image

  // Same modular grid as the other dark sections, so the vertical rules
  // read as one continuous grid running down the page.
  GRID_COLUMNS: 48,
  GRID_LINE_COLOR: "rgba(255,255,255,0.10)",
  SECTION_PADDING_X: "clamp(16px, 4vw, 40px)",

  LABEL: "( Selected Clients )",

  // Central image column, expressed on the 48-col track (starts on the
  // 17th rule, spans 16 columns) so its edges land exactly on grid lines.
  IMAGE_LEFT: "35.333%", // 16 / 48
  IMAGE_WIDTH: "30.333%", // 16 / 48
  // Shorter than the list and vertically centered on it.
  IMAGE_HEIGHT: "90%",

  // Hover highlight heights — both slim bars centered on the row, NOT the
  // full row height: the white band behind the text, and the accent strip
  // where it crosses the image.
  ROW_BAND_HEIGHT: 30, // px, white band
  STRIP_HEIGHT: 30, // px, accent strip over the image — matches the white band

  // The reveal: a new image wipes open from the vertical centerline of
  // the previous one (clip-path inset), with a slight settle-zoom.
  REVEAL_MS: 700,
  REVEAL_EASE: "cubic-bezier(0.16, 1, 0.3, 1)",
};
// ─────────────────────────────────────────────────────────────────────────

// Reuses the four project images already whitelisted for next/image —
// swap per-client artwork in whenever it exists.
const IMAGES = [
  "https://lemansclassic.richardmille.com/.netlify/images?w=3456&h=2160&fm=webp&url=%2Fmedias%2Fchapters%2Fdeparture%2Fi0.jpg",
  "https://lemansclassic.richardmille.com/.netlify/images?w=3456&fm=webp&url=%2Fmedias%2Fchapters%2Fdeparture%2Fi1.jpg",
  "https://lemansclassic.richardmille.com/.netlify/images?w=3456&h=2160&fm=webp&url=%2Fmedias%2Fchapters%2Fcurtain%2Fi1.jpg",
  "https://lemansclassic.richardmille.com/.netlify/images?w=3456&h=2160&fm=webp&url=%2Fmedias%2Fchapters%2Fcurtain%2Fi2.png",
];

const clients = [
  { name: "Arclight Studio", platform: "Shopify Plus", services: "UX/UI, Dev (B2C)" },
  { name: "Meridian Capital", platform: "Custom", services: "Interaction, Dev" },
  { name: "Forma Objects", platform: "Shopify", services: "E-commerce" },
  { name: "Dusk Collective", platform: "Shopify Plus", services: "Brand, Web" },
  { name: "Kairos", platform: "Next.js", services: "UX/UI, Motion" },
  { name: "Nocturne", platform: "Shopify Headless", services: "UX/UI, Dev (B2B)" },
  { name: "Atlas & Co", platform: "Shopify Plus", services: "E-commerce, CRO" },
  { name: "Velvet Lab", platform: "Laravel", services: "Web, Dev" },
  { name: "Orbit Supply", platform: "Shopify", services: "UX/UI" },
  { name: "Paper & Pixel", platform: "Sanity", services: "Brand, Editorial" },
  { name: "Halcyon", platform: "Shopify App", services: "Dev, Integration" },
  { name: "Mono Goods", platform: "Shopify Plus", services: "UX/UI, Dev (B2C)" },
].map((c, i) => ({ ...c, letter: `(${String.fromCharCode(97 + i)}.)`, image: IMAGES[i % IMAGES.length] }));

export default function ClientsList() {
  // Image stack: at most 2 layers — the settled one underneath and the
  // incoming one wiping open from its centerline on top. Keys are unique
  // per push so re-hovering the same artwork later still re-animates.
  const [layers, setLayers] = useState(() => [{ src: clients[0].image, id: 0 }]);
  const nextIdRef = useRef(1);

  // Whether any row is currently hovered. The image container's height
  // eases open from the center line when true, and eases shut when the
  // pointer leaves the list — no image at rest.
  const [hovering, setHovering] = useState(false);

  // ── Touch "scanline" ──
  // Phones have no hover, so the list highlights itself: as you scroll,
  // the row crossing the viewport's vertical center lights up (same band
  // treatment as desktop hover) and drives a floating preview card pinned
  // to the bottom corner. Desktop behavior is untouched.
  const isTouch = useSyncExternalStore(
    (onChange) => {
      const mq = window.matchMedia("(hover: none)");
      mq.addEventListener("change", onChange);
      return () => mq.removeEventListener("change", onChange);
    },
    () => window.matchMedia("(hover: none)").matches,
    () => false // SSR: assume hover until the client says otherwise
  );
  const [activeIdx, setActiveIdx] = useState<number | null>(null);
  const rowRefs = useRef<(HTMLDivElement | null)[]>([]);

  useEffect(() => {
    if (!isTouch) return;

    let raf = 0;
    const check = () => {
      raf = 0;
      const scanY = window.innerHeight * 0.5;
      let best: number | null = null;
      let bestDist = Infinity;
      rowRefs.current.forEach((row, i) => {
        if (!row) return;
        const r = row.getBoundingClientRect();
        // Only rows actually crossing the middle band count — when the
        // list is off screen, nothing is active and the card hides.
        if (r.bottom < scanY - r.height || r.top > scanY + r.height) return;
        const dist = Math.abs((r.top + r.bottom) / 2 - scanY);
        if (dist < bestDist) {
          bestDist = dist;
          best = i;
        }
      });
      setActiveIdx(best);
    };
    const onScroll = () => {
      if (!raf) raf = requestAnimationFrame(check);
    };
    check();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
      if (raf) cancelAnimationFrame(raf);
    };
  }, [isTouch]);

  const showImage = (src: string) => {
    setLayers((prev) => {
      if (prev[prev.length - 1].src === src) return prev; // same artwork — no wipe
      return [...prev.slice(-1), { src, id: nextIdRef.current++ }];
    });
  };

  // The scanline drives the same image stack the desktop hover uses, so
  // the floating card gets the center-wipe reveal for free.
  useEffect(() => {
    if (activeIdx === null) return;
    showImage(clients[activeIdx].image);
  }, [activeIdx]);

  const css = `
    .cl-lines { display: grid; grid-template-columns: repeat(${CONFIG.GRID_COLUMNS}, minmax(0, 1fr)); grid-template-rows: 1fr; height: 100%; border-right: 1px solid ${CONFIG.GRID_LINE_COLOR}; }
    .cl-lines > span { border-left: 1px solid ${CONFIG.GRID_LINE_COLOR}; }

    /* The center wipe: new image opens from the dead center of the
       previous one outward to all four corners, with a slight settle-zoom
       so it feels like it's arriving, not just unclipping. */
    @keyframes cl-reveal-kf { from { clip-path: inset(50% 50% 50% 50%); } to { clip-path: inset(0 0 0 0); } }
    @keyframes cl-zoom-kf { from { transform: scale(1.18); } to { transform: scale(1); } }
    .cl-reveal { animation: cl-reveal-kf ${CONFIG.REVEAL_MS}ms ${CONFIG.REVEAL_EASE} both; }
    .cl-zoom { animation: cl-zoom-kf ${CONFIG.REVEAL_MS}ms ${CONFIG.REVEAL_EASE} both; }

    /* Rows on the master 48-col track (md+) so every column edge sits on
       a grid line; phones collapse to name | platform. */
    .cl-row { display: grid; grid-template-columns: 1fr auto; column-gap: 16px; align-items: baseline; }
    .cl-letter, .cl-services { display: none; }
    @media (min-width: 768px) {
      .cl-row { grid-template-columns: repeat(${CONFIG.GRID_COLUMNS}, minmax(0, 1fr)); column-gap: 0; }
      .cl-name { grid-column: 1 / span 10; }
      .cl-platform { grid-column: 11 / span 8; }
      .cl-letter { display: block; grid-column: 35 / span 4; }
      .cl-services { display: block; grid-column: 39 / span 10; text-align: right; }
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
        <div className="cl-lines">
          {Array.from({ length: CONFIG.GRID_COLUMNS }).map((_, i) => (
            <span key={i} />
          ))}
        </div>
      </div>

      <div
        className="relative py-20 md:py-28"
        style={{ paddingLeft: CONFIG.SECTION_PADDING_X, paddingRight: CONFIG.SECTION_PADDING_X }}
      >
        <span className="font-mono text-xs uppercase tracking-[0.2em] text-white/60">
          {CONFIG.LABEL}
        </span>

        {/* Rows + the central image that floats over their middle columns */}
        <div className="relative mt-10" onMouseLeave={() => setHovering(false)}>
          {/* Central image stack — vertically centered on the list,
              hidden on phones where it would smother the text. */}
          <div
            className="pointer-events-none absolute top-1/2 z-10 hidden -translate-y-1/2 md:block"
            style={{
              left: CONFIG.IMAGE_LEFT,
              width: CONFIG.IMAGE_WIDTH,
              height: CONFIG.IMAGE_HEIGHT,
              // Height eases open from the center line while a row is
              // hovered, and eases shut to nothing at rest — clip-path,
              // so the artwork never stretches while growing.
              clipPath: hovering ? "inset(0 0 0 0)" : "inset(50% 0 50% 0)",
              transition: `clip-path 650ms ${CONFIG.REVEAL_EASE}`,
            }}
          >
            {layers.map((layer) => (
              <div key={layer.id} className="cl-reveal absolute inset-0 overflow-hidden">
                <Image
                  src={layer.src}
                  alt=""
                  fill
                  sizes="21vw"
                  className="cl-zoom object-cover"
                />
              </div>
            ))}
          </div>

          {clients.map((client, i) => {
            const isActive = isTouch && activeIdx === i;
            return (
            <div
              key={client.name}
              ref={(el) => {
                rowRefs.current[i] = el;
              }}
              onMouseEnter={() => {
                if (isTouch) return; // scanline owns the highlight on touch
                setHovering(true);
                showImage(client.image);
              }}
              className="group relative cursor-pointer py-4"
            >
              {/* Slim white band centered on the row — the hover highlight
                  behind the text, kept well under the row's full height.
                  On touch the scanline (isActive) drives it instead. */}
              <span
                className={`pointer-events-none absolute inset-x-0 top-1/2 -translate-y-1/2 bg-white transition-opacity duration-150 group-hover:opacity-100 ${
                  isActive ? "opacity-100" : "opacity-0"
                }`}
                style={{ height: CONFIG.ROW_BAND_HEIGHT }}
              />
              {/* Accent strip continuing the hover highlight ACROSS the
                  image (which sits at z-10 above the row's white bg). */}
              <span
                className="pointer-events-none absolute top-1/2 z-20 hidden -translate-y-1/2 opacity-0 transition-opacity duration-150 group-hover:opacity-90 md:block"
                style={{
                  left: CONFIG.IMAGE_LEFT,
                  width: CONFIG.IMAGE_WIDTH,
                  height: CONFIG.STRIP_HEIGHT,
                  backgroundColor: CONFIG.ACCENT,
                }}
              />

              <div className="cl-row relative font-mono text-sm uppercase tracking-wider">
                <span
                  className={`cl-name transition-colors duration-150 group-hover:text-black ${
                    isActive ? "text-black" : "text-white"
                  }`}
                >
                  {client.name}
                </span>
                <span
                  className={`cl-platform transition-colors duration-150 group-hover:text-black ${
                    isActive ? "text-black" : "text-white/70"
                  }`}
                >
                  {client.platform}
                </span>
                <span className="cl-letter text-white/70 transition-colors duration-150 group-hover:text-black">
                  {client.letter}
                </span>
                <span className="cl-services text-white/70 transition-colors duration-150 group-hover:text-black">
                  {client.services}
                </span>
              </div>
            </div>
            );
          })}
        </div>
      </div>

      {/* Floating preview card — the touch counterpart of the desktop
          center image. Pinned to the bottom corner (clear of the home
          indicator), it wipes between artworks as the scanline moves and
          slips away once the list leaves the viewport. */}
      {isTouch && (
        <div
          className="pointer-events-none fixed right-4 z-40 w-40 md:hidden"
          style={{
            bottom: "calc(1.25rem + env(safe-area-inset-bottom))",
            opacity: activeIdx !== null ? 1 : 0,
            transform: activeIdx !== null ? "translateY(0)" : "translateY(12px)",
            transition: `opacity 350ms ${CONFIG.REVEAL_EASE}, transform 350ms ${CONFIG.REVEAL_EASE}`,
          }}
        >
          <div className="relative aspect-4/3 overflow-hidden border border-white/15">
            {layers.map((layer) => (
              <div key={layer.id} className="cl-reveal absolute inset-0 overflow-hidden">
                <Image src={layer.src} alt="" fill sizes="160px" className="cl-zoom object-cover" />
              </div>
            ))}
          </div>
          {activeIdx !== null && (
            <div
              className="flex items-baseline justify-between gap-2 px-2 py-1.5 font-mono text-[9px] uppercase tracking-wider text-black"
              style={{ backgroundColor: CONFIG.ACCENT }}
            >
              <span className="truncate">{clients[activeIdx].name}</span>
              <span className="shrink-0 opacity-70">{clients[activeIdx].services}</span>
            </div>
          )}
        </div>
      )}
    </section>
  );
}
