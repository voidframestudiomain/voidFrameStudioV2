"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";

// `accent` gives each project its own palette hue, painted as a bar along
// the bottom of its card. Four different hues, never repeating — same rule
// the reference site follows for adjacent color blocks.
const projects = [
  { id: "01", name: "Arclight Studio", category: "Brand & Web", year: "2024", link: "arclightstudio.com", accent: "var(--color-green)", description: "A full brand identity and headless site rebuild for a boutique lighting studio.", image: "https://lemansclassic.richardmille.com/.netlify/images?w=3456&h=2160&fm=webp&url=%2Fmedias%2Fchapters%2Fdeparture%2Fi0.jpg" },
  { id: "02", name: "Meridian Capital", category: "Web & Motion", year: "2024", link: "meridiancapital.com", accent: "var(--color-yellow)", description: "Scroll-driven storytelling and motion design for a private investment firm.", image: "https://lemansclassic.richardmille.com/.netlify/images?w=3456&fm=webp&url=%2Fmedias%2Fchapters%2Fdeparture%2Fi1.jpg" },
  { id: "03", name: "Forma Objects", category: "E-commerce", year: "2025", link: "formaobjects.com", accent: "var(--color-orange)", description: "A custom Shopify build for a minimalist furniture and object design house.", image: "https://lemansclassic.richardmille.com/.netlify/images?w=3456&h=2160&fm=webp&url=%2Fmedias%2Fchapters%2Fcurtain%2Fi1.jpg" },
  { id: "04", name: "Dusk Collective", category: "Brand Identity", year: "2025", link: "duskcollective.com", accent: "var(--color-pink)", description: "Naming, identity, and visual system for an emerging fashion collective.", image: "https://lemansclassic.richardmille.com/.netlify/images?w=3456&h=2160&fm=webp&url=%2Fmedias%2Fchapters%2Fcurtain%2Fi2.png" },
];

// ─────────────────────────────────────────────────────────────────────────
// 🎛️ TWEAK EVERYTHING HERE. Nothing below this block needs to change for
// normal sizing/spacing/timing adjustments.
// ─────────────────────────────────────────────────────────────────────────
const CONFIG = {
  // Left/right page-edge inset, both collapsed and expanded states.
  EDGE_MARGIN_X: 0,

  // Gap between the top of the expanded row and the "( Selected Projects )"
  // heading that sits above it.
  HEADING_GAP: 24,

  // Fixed distance from the bottom of the screen to the info bar
  // (name/category/link). The row is vertically CENTERED independently of
  // this, so the two can never collide regardless of EXPANDED_HEIGHT.
  INFO_MARGIN_Y: 10,

  // Fixed distance from the bottom of the screen to the thumbnail row
  // while COLLAPSED (start of scroll). Kept separate from INFO_MARGIN_Y
  // (which is much smaller) so the collapsed thumbnails have real
  // breathing room instead of sitting flush against the screen edge.
  COLLAPSED_BOTTOM_MARGIN: 80,

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
  const sectionRef = useRef<HTMLDivElement>(null);

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

  // The row's bottom edge is interpolated between two anchors as `progress`
  // goes 0 -> 1:
  //   - collapsed (progress 0): anchored a fixed distance from the bottom
  //     of the screen (CONFIG.INFO_MARGIN_Y), so thumbnails sit at the
  //     bottom of the viewport at the start of the scroll.
  //   - expanded (progress 1): anchored to dead-center (50% - half its own
  //     height), so it grows outward from the middle of the screen.
  // Both anchors are blended in a single CSS calc() that mixes a
  // percentage term (for the center anchor) with a px term (for the fixed
  // bottom-margin anchor), so the row smoothly rises from the bottom edge
  // to dead-center as you scroll, instead of always being centered.
  const rowBottomPercent = progress * 50;
  const rowBottomPxPart =
    (1 - progress) * CONFIG.COLLAPSED_BOTTOM_MARGIN - progress * (rowHeight / 2);
  const rowBottom = `calc(${rowBottomPercent}% + ${rowBottomPxPart}px)`;

  // Heading sits just above the row's (interpolated) top edge, tracking it
  // as the row grows and moves — always clear of the row no matter its
  // height or current bottom anchor.
  const headingBottomPxPart = rowBottomPxPart + rowHeight + CONFIG.HEADING_GAP;
  const headingBottom = `calc(${rowBottomPercent}% + ${headingBottomPxPart}px)`;

  return (
    <div ref={sectionRef} style={{ height: `${CONFIG.SECTION_HEIGHT_VH}vh` }} className="relative">
      <div className="sticky top-0 h-screen w-full overflow-hidden">
        {/* ── Heading: tracks the row's (centered) top edge, fades in once mostly expanded ── */}
        <div
          className="absolute inset-x-0 z-10 flex"
          style={{
            bottom: headingBottom,
            left: rowLeft,
            width: rowWidth,
            justifyContent: progress > 0.5 ? "center" : "flex-end",
            opacity: headingOpacity,
            transform: `translateY(${lerp(12, 0, headingOpacity)}px)`,
          }}
        >
          <span className="vf-pill vf-pill--green whitespace-nowrap text-xs!">
            Selected Projects
          </span>
        </div>

        {/* ── Thumbnail row: scroll-driven size/position, no CSS transition.
            Starts anchored to the bottom of the viewport, then rises to
            dead-center as it expands, via the interpolated rowBottom. ── */}
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
                className="vf-hard relative h-full min-w-0 shrink-0 basis-0 cursor-pointer overflow-hidden rounded-lg border-2 border-outline transition-[flex-grow] duration-500 ease-out"
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
                  className="absolute inset-0 bg-linear-to-t from-ink/70 via-ink/10 to-transparent"
                  style={{ opacity: progress }}
                />
                {/* Accent bar: sweeps in from the left as the row expands,
                    and goes full-height-thick on the active card. */}
                <div
                  className="absolute bottom-0 left-0 origin-left transition-[height] duration-500 ease-out"
                  style={{
                    background: project.accent,
                    width: `${progress * 100}%`,
                    height: isActive ? 8 : 4,
                  }}
                />
                <span
                  className="absolute left-3 top-3 text-[10px] tracking-widest text-beige/80"
                  style={{ opacity: progress }}
                >
                  {project.id}
                </span>
              </div>
            );
          })}
        </div>

        {/* ── Info bar: name/category bottom-left, live link bottom-right.
            Fixed a constant distance from the bottom of the screen —
            completely independent of the row now, so it can never overlap
            it regardless of EXPANDED_HEIGHT or viewport size. ── */}
        <div
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
              <p className="font-display text-4xl uppercase tracking-tight vf-text-hard-sm">{active.name}</p>
              <p className="text-xs uppercase tracking-widest text-ink/60">
                {active.category} — {active.year}
              </p>
            </div>
            <p className="font-mono text-xs leading-relaxed text-ink/50">
              <ScrambleText text={active.description} />
            </p>
          </div>

          {/* Bottom-right: live link */}
          <a
            href={`https://${active.link}`}
            target="_blank"
            rel="noopener noreferrer"
            className="pointer-events-auto whitespace-nowrap text-xs uppercase tracking-widest text-ink/60 underline decoration-ink/40 underline-offset-4 transition-colors hover:text-green hover:decoration-green"
          >
            {active.link} ↗
          </a>
        </div>
      </div>
    </div>
  );
}