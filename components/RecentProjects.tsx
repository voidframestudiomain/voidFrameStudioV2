"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";

const projects = [
  { id: "01", name: "Arclight Studio", category: "Brand & Web", year: "2024", link: "arclightstudio.com", description: "A full brand identity and headless site rebuild for a boutique lighting studio.", image: "https://lemansclassic.richardmille.com/.netlify/images?w=3456&h=2160&fm=webp&url=%2Fmedias%2Fchapters%2Fdeparture%2Fi0.jpg" },
  { id: "02", name: "Meridian Capital", category: "Web & Motion", year: "2024", link: "meridiancapital.com", description: "Scroll-driven storytelling and motion design for a private investment firm.", image: "https://lemansclassic.richardmille.com/.netlify/images?w=3456&fm=webp&url=%2Fmedias%2Fchapters%2Fdeparture%2Fi1.jpg" },
  { id: "03", name: "Forma Objects", category: "E-commerce", year: "2025", link: "formaobjects.com", description: "A custom Shopify build for a minimalist furniture and object design house.", image: "https://lemansclassic.richardmille.com/.netlify/images?w=3456&h=2160&fm=webp&url=%2Fmedias%2Fchapters%2Fcurtain%2Fi1.jpg" },
  { id: "04", name: "Dusk Collective", category: "Brand Identity", year: "2025", link: "duskcollective.com", description: "Naming, identity, and visual system for an emerging fashion collective.", image: "https://lemansclassic.richardmille.com/.netlify/images?w=3456&h=2160&fm=webp&url=%2Fmedias%2Fchapters%2Fcurtain%2Fi2.png" },
];

// ─────────────────────────────────────────────────────────────────────────
// 🎛️ TWEAK EVERYTHING HERE. Nothing below this block needs to change for
// normal sizing/spacing/timing adjustments.
// ─────────────────────────────────────────────────────────────────────────
const CONFIG = {
  // Left/right page-edge inset, both collapsed and expanded states.
  EDGE_MARGIN_X: 0,

  // Bottom offset for the COLLAPSED thumbnail row only. Tune this freely —
  // it no longer affects the info bar, so shrinking it to fix "cropped"
  // collapsed thumbnails won't cause overlap later.
  COLLAPSED_MARGIN_Y: 80,

  // Bottom offset for the info bar (name/category/link). Fixed — it never
  // moves with scroll progress. Independent of COLLAPSED_MARGIN_Y.
  INFO_MARGIN_Y: 90,

  // Minimum breathing room between the bottom of the expanded row and the
  // top of the info bar's (measured) content. This is the ONLY manual
  // number left — the actual offset is computed from real content height.
  ROW_INFO_GAP: 32,

  // Size of each thumbnail in the COLLAPSED (start of scroll) state.
  COLLAPSED_THUMB_SIZE: 96,

  // Gap between thumbnails, in both collapsed and expanded states.
  THUMB_GAP: 8,

  // Height of the row once fully EXPANDED (end of scroll).
  EXPANDED_HEIGHT: 440,

  // Scroll progress (0–1) at which the "( Selected Projects )" heading
  // starts/finishes fading in. Must happen AFTER the row is mostly expanded.
  HEADING_FADE_START: 0.35,
  HEADING_FADE_END: 0.65,

  // Scroll progress (0–1) at which the bottom info bar (project name +
  // category / live link) starts/finishes fading in.
  INFO_FADE_START: 0.6,
  INFO_FADE_END: 1.0,

  // Horizontal inset for the info bar's left/right columns, relative to
  // the row's own left/width. Kept at 0 so it's flush with the row edges —
  // x-axis spacing is already handled by the parent page.tsx.
  INFO_MARGIN_X: 0,

  // How much taller the hovered card grows relative to its neighbors,
  // expressed as flex-grow ratios. Bigger HOVERED number = more dramatic
  // expansion on hover.
  FLEX_GROW_DEFAULT: 1, // all cards, no hover
  FLEX_GROW_HOVERED: 2.4, // the card under the cursor
  FLEX_GROW_SIBLING: 0.6, // the other cards while one is hovered

  // Total scroll-able height of this section, in viewport-heights (vh).
  // Bigger = slower / longer scroll-driven animation.
  SECTION_HEIGHT_VH: 160,
};
// ─────────────────────────────────────────────────────────────────────────

const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
const clamp01 = (n: number) => Math.min(1, Math.max(0, n));
// Remaps t from [start, end] -> [0, 1], clamped. Used for the fade-in ranges above.
const remap = (t: number, start: number, end: number) =>
  clamp01((t - start) / (end - start));

// ─────────────────────────────────────────────────────────────────────────
// Scramble/decrypt text effect: on every change of `text`, cycles random
// characters and progressively locks in the real ones left -> right, like
// a terminal "decrypting" reveal. Runs on mount too, so the first project's
// description scrambles in the same way as subsequent switches.
// ─────────────────────────────────────────────────────────────────────────
const SCRAMBLE_CHARS = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz#%&*+=-/\\";
const SCRAMBLE_DURATION_MS = 500;

function ScrambleText({ text }: { text: string }) {
  const [display, setDisplay] = useState(text);

  useEffect(() => {
    let frameId = 0;
    const startTime = performance.now();

    const tick = (now: number) => {
      const elapsed = now - startTime;
      const t = clamp01(elapsed / SCRAMBLE_DURATION_MS);
      const revealCount = Math.floor(t * text.length);

      let next = "";
      for (let i = 0; i < text.length; i++) {
        if (text[i] === " ") {
          next += " ";
        } else if (i < revealCount) {
          next += text[i];
        } else {
          next += SCRAMBLE_CHARS[Math.floor(Math.random() * SCRAMBLE_CHARS.length)];
        }
      }
      setDisplay(next);

      if (t < 1) {
        frameId = requestAnimationFrame(tick);
      } else {
        setDisplay(text); // lock the exact final string, no stray random tail
      }
    };

    frameId = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frameId);
  }, [text]);

  return <>{display}</>;
}

interface RecentProjectsProps {
  // Fires on every scroll tick with the same 0–1 progress value that
  // drives the row's own expansion. Lets siblings (e.g. Hero) sync their
  // own animations to this section without each maintaining a separate
  // scroll listener / getBoundingClientRect calculation.
  onProgress?: (progress: number) => void;
}

export default function RecentProjects({ onProgress }: RecentProjectsProps = {}) {
  const [hoveredId, setHoveredId] = useState<string | null>(null);
  // Tracks which project's info should be shown in the bottom bar. Unlike
  // hoveredId (which drives the card-grow effect and resets to null on
  // mouse-leave), this only ever moves FORWARD to whatever was last
  // hovered — it starts on the first project and simply stays there until
  // the user hovers a different card.
  const [activeId, setActiveId] = useState<string>(projects[0].id);
  const [progress, setProgress] = useState(0); // 0 = top of section, 1 = fully scrolled through
  const [containerWidth, setContainerWidth] = useState(0);
  const [infoHeight, setInfoHeight] = useState(0);
  const sectionRef = useRef<HTMLDivElement>(null);
  const infoRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Measure the SECTION's own width, not window.innerWidth.
    // window.innerWidth includes the scrollbar gutter, which makes the row
    // think it has more horizontal room than it actually does — that's what
    // was clipping the last card against the real edge.
    const measure = () => {
      if (sectionRef.current) setContainerWidth(sectionRef.current.clientWidth);
    };
    measure();
    window.addEventListener("resize", measure);

    let raf = 0;
    const onScroll = () => {
      if (raf) return;
      raf = requestAnimationFrame(() => {
        raf = 0;
        const el = sectionRef.current;
        if (!el) return;
        const rect = el.getBoundingClientRect();
        const scrollableDistance = rect.height - window.innerHeight;
        const next = clamp01(-rect.top / scrollableDistance);
        setProgress(next);
        onProgress?.(next);
      });
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();

    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", measure);
      if (raf) cancelAnimationFrame(raf);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Track the info bar's REAL rendered height (it changes as the active
  // project's name/description length changes and wraps differently), so
  // the expanded row can always leave exactly enough clearance for it —
  // no more hardcoded EXPANDED_BOTTOM_OFFSET guesswork.
  useEffect(() => {
    const el = infoRef.current;
    if (!el) return;
    const ro = new ResizeObserver((entries) => {
      const h = entries[0]?.contentRect.height ?? 0;
      setInfoHeight(h);
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  if (!containerWidth) {
    return <div ref={sectionRef} style={{ height: `${CONFIG.SECTION_HEIGHT_VH}vh` }} />;
  }

  const active = projects.find((p) => p.id === activeId) ?? projects[0];

  const headingOpacity = remap(progress, CONFIG.HEADING_FADE_START, CONFIG.HEADING_FADE_END);
  const infoOpacity = remap(progress, CONFIG.INFO_FADE_START, CONFIG.INFO_FADE_END);

  const collapsedWidth =
    projects.length * CONFIG.COLLAPSED_THUMB_SIZE +
    (projects.length - 1) * CONFIG.THUMB_GAP;
  const expandedWidth = containerWidth - CONFIG.EDGE_MARGIN_X * 2;

  // Expanded bottom offset = however far the info bar sits from the page
  // bottom, plus its actual measured height, plus a breathing gap. This is
  // what guarantees no overlap regardless of description length/wrapping.
  const expandedBottomOffset = CONFIG.INFO_MARGIN_Y + infoHeight + CONFIG.ROW_INFO_GAP;

  // ⚠️ Everything below is scroll-driven (recalculated every scroll tick),
  // so these stay as plain inline styles with NO CSS transition attached.
  // If you add a `transition` to width/height/left/bottom, every scroll
  // event retargets the transition mid-flight and the row appears stuck
  // instead of smoothly expanding — that was the original bug.
  const rowWidth = Math.round(lerp(collapsedWidth, expandedWidth, progress));
  const rowHeight = Math.round(lerp(CONFIG.COLLAPSED_THUMB_SIZE, CONFIG.EXPANDED_HEIGHT, progress));
  const rowLeft = Math.round(
    lerp(containerWidth - CONFIG.EDGE_MARGIN_X - collapsedWidth, CONFIG.EDGE_MARGIN_X, progress)
  );
  const rowBottom = Math.round(lerp(CONFIG.COLLAPSED_MARGIN_Y, expandedBottomOffset, progress));

  return (
    <div ref={sectionRef} style={{ height: `${CONFIG.SECTION_HEIGHT_VH}vh` }} className="relative">
      <div className="sticky top-0 h-screen w-full overflow-hidden">
        {/* ── Heading: tracks the row's top edge, fades in once mostly expanded ── */}
        <div
          className="absolute inset-x-0 z-10 flex"
          style={{
            bottom: rowBottom + rowHeight + 24,
            left: rowLeft,
            width: rowWidth,
            justifyContent: progress > 0.5 ? "center" : "flex-end",
            opacity: headingOpacity,
            transform: `translateY(${lerp(12, 0, headingOpacity)}px)`,
          }}
        >
          <span className="whitespace-nowrap text-xs uppercase tracking-[0.2em] text-black">
            ( Selected Projects )
          </span>
        </div>

        {/* ── Thumbnail row: scroll-driven size/position, no CSS transition ── */}
        <div
          className="absolute z-[5] flex gap-2"
          style={{ left: rowLeft, width: rowWidth, height: rowHeight, bottom: rowBottom }}
        >
          {projects.map((project) => {
            const isHovered = hoveredId === project.id;
            const isActive = activeId === project.id;
            const flexGrow =
              progress < 0.05
                ? CONFIG.FLEX_GROW_DEFAULT // ignore hover/active while still fully collapsed
                : isActive
                ? CONFIG.FLEX_GROW_HOVERED
                : CONFIG.FLEX_GROW_SIBLING;

            return (
              <div
                key={project.id}
                onMouseEnter={() => {
                  setHoveredId(project.id);
                  setActiveId(project.id);
                }}
                onMouseLeave={() => setHoveredId(null)}
                // flex-grow IS allowed a transition — it only changes on
                // discrete hover events, not on every scroll tick.
                className="relative h-full min-w-0 shrink-0 basis-0 cursor-pointer overflow-hidden rounded transition-[flex-grow] duration-500 ease-out"
                style={{ flexGrow }}
              >
                <Image
                  src={project.image}
                  alt={project.name}
                  fill
                  sizes="(max-width: 768px) 50vw, 25vw"
                  className={`object-cover transition-transform duration-500 ease-out ${
                    isHovered ? "scale-105" : "scale-100"
                  }`}
                />
                {/* darkening gradient fades in as the row expands */}
                <div
                  className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-transparent"
                  style={{ opacity: progress }}
                />
                <span
                  className="absolute left-3 top-3 text-[10px] tracking-widest text-white/70"
                  style={{ opacity: progress }}
                >
                  {project.id}
                </span>
              </div>
            );
          })}
        </div>

        {/* ── Info bar: name/category bottom-left, live link bottom-right ──
            Positioned/sized to track the row's own left edge + width so it
            stays aligned with the expanded row at any viewport size. Its
            own height is measured (infoRef) and fed back into the row's
            expanded bottom offset above, so the two can never overlap. */}
        <div
          ref={infoRef}
          className="pointer-events-none absolute flex items-end justify-between "
          style={{
            left: rowLeft + CONFIG.INFO_MARGIN_X,
            width: Math.max(rowWidth - CONFIG.INFO_MARGIN_X * 2, 0),
            bottom: CONFIG.INFO_MARGIN_Y,
            opacity: infoOpacity,
            transform: `translateY(${lerp(20, 0, infoOpacity)}px)`,
          }}
        >
          {/* Bottom-left: project name + category + a scramble-revealed blurb */}
          <div className="flex max-w-xl flex-col gap-1 ">
            <div className="flex items-baseline gap-4">
              <p className="font-display text-3xl font-black uppercase text-black">{active.name}</p>
              <p className="text-xs uppercase tracking-widest text-black/60">
                {active.category} — {active.year}
              </p>
            </div>
            <p className="font-mono text-xs leading-relaxed text-black/50">
              <ScrambleText text={active.description} />
            </p>
          </div>

          {/* Bottom-right: live link */}
          <a
            href={`https://${active.link}`}
            target="_blank"
            rel="noopener noreferrer"
            className="pointer-events-auto whitespace-nowrap text-xs uppercase tracking-widest text-black/60 underline decoration-black/40 underline-offset-4 transition-colors hover:text-black hover:decoration-black"
          >
            {active.link} ↗
          </a>
        </div>
      </div>
    </div>
  );
}