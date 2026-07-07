"use client";

import { useEffect, useState } from "react";
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
//
// NOTE: SECTION_HEIGHT_VH used to live here — it's been REMOVED because
// this component no longer owns its own scroll-height wrapper or scroll
// listener. It's now a CONTROLLED component: the parent (page.tsx) tracks
// one combined scroll track for RecentProjects + HowWeWork together, and
// passes this component its own `progress` (0–1) and `containerWidth` as
// props every tick.
// ─────────────────────────────────────────────────────────────────────────
const CONFIG = {
  EDGE_MARGIN_X: 0,
  HEADING_GAP: 24,
  INFO_MARGIN_Y: 40,
  COLLAPSED_BOTTOM_MARGIN: 80,
  COLLAPSED_THUMB_SIZE: 96,
  THUMB_GAP: 8,
  EXPANDED_HEIGHT: 440,
  HEADING_FADE_START: 0.35,
  HEADING_FADE_END: 0.65,
  INFO_FADE_START: 0.6,
  INFO_FADE_END: 1.0,
  INFO_MARGIN_X: 0,
  FLEX_GROW_DEFAULT: 1,
  FLEX_GROW_HOVERED: 2.4,
  FLEX_GROW_SIBLING: 0.6,
};
// ─────────────────────────────────────────────────────────────────────────

const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
const clamp01 = (n: number) => Math.min(1, Math.max(0, n));
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
  // Driven by the PARENT now (page.tsx), which owns one combined scroll
  // track for RecentProjects + HowWeWork. 0 = fully collapsed thumbnails,
  // 1 = fully expanded row. The parent freezes this at 1 once it moves on
  // to animating HowWeWork's slide-in.
  progress: number;

  // The parent measures its own sticky container's width (not
  // window.innerWidth, which includes the scrollbar gutter) and passes it
  // down, since this component no longer has its own ref to measure from.
  containerWidth: number;
}

export default function RecentProjects({ progress, containerWidth }: RecentProjectsProps) {
  const [hoveredId, setHoveredId] = useState<string | null>(null);
  // Tracks which project's info should be shown in the bottom bar. Unlike
  // hoveredId (which drives the card-grow effect and resets to null on
  // mouse-leave), this only ever moves FORWARD to whatever was last
  // hovered — it starts on the first project and simply stays there until
  // the user hovers a different card.
  const [activeId, setActiveId] = useState<string>(projects[0].id);

  if (!containerWidth) return null;

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
    <>
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
        <span className="whitespace-nowrap text-xs uppercase tracking-[0.2em] text-black">
          ( Selected Projects )
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
    </>
  );
}