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
//
// NOTE: SECTION_HEIGHT_VH used to live here — it's been REMOVED because
// this component no longer owns its own scroll-height wrapper or scroll
// listener. It's now a CONTROLLED component: the parent (page.tsx) tracks
// one combined scroll track for RecentProjects + HowWeWork together, and
// passes this component its own `progress` (0–1) and `containerWidth` as
// props every tick.
// ─────────────────────────────────────────────────────────────────────────
const CONFIG = {
  // Horizontal breathing room: COLLAPSED_PADDING_X keeps the initial
  // thumbnail strip off the right edge; EXPANDED_PADDING_X insets the
  // fully-expanded row (and therefore the carousel) from both edges.
  // *_MOBILE variants apply below MOBILE_BREAKPOINT.
  MOBILE_BREAKPOINT: 768,
  COLLAPSED_PADDING_X: 24,
  COLLAPSED_PADDING_X_MOBILE: 16,
  EXPANDED_PADDING_X: 24,
  EXPANDED_PADDING_X_MOBILE: 12,
  HEADING_GAP: 24,
  INFO_MARGIN_Y: 40,
  COLLAPSED_BOTTOM_MARGIN: 80,
  COLLAPSED_THUMB_SIZE: 96,
  COLLAPSED_THUMB_SIZE_MOBILE: 56,
  THUMB_GAP: 8,
  EXPANDED_HEIGHT: 440,
  EXPANDED_HEIGHT_MOBILE: 320,
  // On phones only 2 cards fit at a readable size — the rest sit in the
  // carousel overflow and drift/swipe in.
  VISIBLE_CARDS_MOBILE: 2,
  HEADING_FADE_START: 0.35,
  HEADING_FADE_END: 0.65,
  INFO_FADE_START: 0.6,
  INFO_FADE_END: 1.0,
  INFO_MARGIN_X: 0,
  // Infinite-carousel behavior once the row is fully expanded:
  // drift speed in px/sec, and how quickly it eases between drifting and
  // paused (higher = snappier response to hover).
  CAROUSEL_SPEED: 60,
  CAROUSEL_EASE: 6,
  // How much the hovered carousel card widens (1.5 = 150% of base width),
  // pushing its neighbors aside.
  HOVER_CARD_SCALE: 1.5,
  // Inertial swipe: friction controls how quickly a flick's velocity
  // bleeds back down to the base drift speed (lower = longer glide);
  // MAX_SWIPE_SPEED caps flick velocity in px/sec.
  SWIPE_FRICTION: 2.5,
  MAX_SWIPE_SPEED: 2500,
};
// ─────────────────────────────────────────────────────────────────────────

const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
const clamp01 = (n: number) => Math.min(1, Math.max(0, n));
const remap = (t: number, start: number, end: number) =>
  clamp01((t - start) / (end - start));

// Resolve the size set for the current viewport width. Shared by the
// render pass and the carousel wrap-length effect so the two can never
// disagree about geometry.
function layoutFor(containerWidth: number) {
  const isMobile = containerWidth < CONFIG.MOBILE_BREAKPOINT;
  const thumbSize = isMobile ? CONFIG.COLLAPSED_THUMB_SIZE_MOBILE : CONFIG.COLLAPSED_THUMB_SIZE;
  const expandedHeight = isMobile ? CONFIG.EXPANDED_HEIGHT_MOBILE : CONFIG.EXPANDED_HEIGHT;
  const visibleCards = isMobile ? CONFIG.VISIBLE_CARDS_MOBILE : projects.length;
  const collapsedPad = isMobile ? CONFIG.COLLAPSED_PADDING_X_MOBILE : CONFIG.COLLAPSED_PADDING_X;
  const expandedPad = isMobile ? CONFIG.EXPANDED_PADDING_X_MOBILE : CONFIG.EXPANDED_PADDING_X;
  const expandedWidth = containerWidth - expandedPad * 2;
  const expandedCardWidth =
    (expandedWidth - (visibleCards - 1) * CONFIG.THUMB_GAP) / visibleCards;
  return {
    isMobile,
    thumbSize,
    expandedHeight,
    visibleCards,
    collapsedPad,
    expandedPad,
    expandedWidth,
    expandedCardWidth,
  };
}

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
  // hoveredId (which drives the image-zoom effect and resets to null on
  // mouse-leave), this only ever moves FORWARD to whatever was last
  // hovered — it starts on the first project and simply stays there until
  // the user hovers a different card.
  const [activeId, setActiveId] = useState<string>(projects[0].id);

  // ── Infinite carousel (kicks in only once fully expanded) ──
  // Once `progress` hits 1 the row starts drifting left forever: the card
  // list is rendered twice and the track's translateX wraps modulo one
  // set-width, so the loop is seamless. The offset lives in refs and is
  // written straight to the track's style inside a rAF loop — no React
  // re-render per frame.
  const carouselActive = progress >= 0.999;
  const trackRef = useRef<HTMLDivElement>(null);
  const offsetRef = useRef(0);
  const velocityRef = useRef(0);
  const pausedRef = useRef(false);
  // Inertial swipe state. While dragging, pointermove writes the offset
  // directly and samples the pointer's velocity; on release that velocity
  // is handed to the rAF loop, which bleeds it back down to the base
  // drift speed (SWIPE_FRICTION), giving the flick its glide.
  const draggingRef = useRef(false);
  const lastPointerXRef = useRef(0);
  const lastPointerTRef = useRef(0);
  const flickVelocityRef = useRef(0);
  // Distance the track must travel before the layout repeats (one full
  // card set including its trailing gap). Kept in a ref so the rAF loop
  // always wraps against the latest measured width after a resize.
  const setWidthRef = useRef(0);

  useEffect(() => {
    // Wrap length at FULL expansion — the only state in which the track
    // ever drifts — recomputed whenever the parent remeasures on resize.
    const { expandedCardWidth } = layoutFor(containerWidth);
    setWidthRef.current = projects.length * (expandedCardWidth + CONFIG.THUMB_GAP);
  }, [containerWidth]);

  useEffect(() => {
    if (!carouselActive) {
      // Scrolled back below fully-expanded: park the track at its origin
      // so the scroll-driven layout takes over exactly where it left off.
      offsetRef.current = 0;
      velocityRef.current = 0;
      draggingRef.current = false;
      if (trackRef.current) trackRef.current.style.transform = "translate3d(0,0,0)";
      return;
    }

    let frameId = 0;
    let last = performance.now();

    const tick = (now: number) => {
      const dt = Math.min((now - last) / 1000, 0.1); // clamp tab-switch gaps
      last = now;

      // While the pointer is dragging, pointermove owns the offset — the
      // loop only keeps painting the transform.
      if (!draggingRef.current) {
        // Ease the velocity toward its target (0 while a card is hovered,
        // base drift speed otherwise) instead of snapping — this one rule
        // covers hover-pause, resume, AND post-flick glide. A flick just
        // means velocity starts far from target: while it's still beyond
        // drift speed, decay with the gentler SWIPE_FRICTION so the glide
        // lasts; once it's back in hover/drift range, use CAROUSEL_EASE.
        const targetSpeed = pausedRef.current ? 0 : CONFIG.CAROUSEL_SPEED;
        const ease =
          Math.abs(velocityRef.current) > CONFIG.CAROUSEL_SPEED * 1.5
            ? CONFIG.SWIPE_FRICTION
            : CONFIG.CAROUSEL_EASE;
        velocityRef.current += (targetSpeed - velocityRef.current) * Math.min(1, dt * ease);
        offsetRef.current += velocityRef.current * dt;
      }

      const setWidth = setWidthRef.current;
      if (setWidth > 0) {
        // Wrap into [0, setWidth) — the double-mod keeps negative offsets
        // (rightward swipes) wrapping correctly too.
        offsetRef.current = ((offsetRef.current % setWidth) + setWidth) % setWidth;
        if (trackRef.current) {
          trackRef.current.style.transform = `translate3d(${-offsetRef.current}px,0,0)`;
        }
      }
      frameId = requestAnimationFrame(tick);
    };

    frameId = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frameId);
  }, [carouselActive]);

  if (!containerWidth) return null;

  const active = projects.find((p) => p.id === activeId) ?? projects[0];

  const headingOpacity = remap(progress, CONFIG.HEADING_FADE_START, CONFIG.HEADING_FADE_END);
  const infoOpacity = remap(progress, CONFIG.INFO_FADE_START, CONFIG.INFO_FADE_END);

  const layout = layoutFor(containerWidth);
  const collapsedWidth =
    projects.length * layout.thumbSize + (projects.length - 1) * CONFIG.THUMB_GAP;
  const expandedWidth = layout.expandedWidth;

  // ⚠️ Everything below is scroll-driven (recalculated every scroll tick),
  // so these stay as plain inline styles with NO CSS transition attached.
  // If you add a `transition` to width/height/left/bottom, every scroll
  // event retargets the transition mid-flight and the row appears stuck
  // instead of smoothly expanding — that was the original bug.
  const rowWidth = Math.round(lerp(collapsedWidth, expandedWidth, progress));
  const rowHeight = Math.round(lerp(layout.thumbSize, layout.expandedHeight, progress));

  // Equal per-card width, interpolated from collapsed thumbnail to the
  // expanded carousel card — so the expand -> carousel handoff is
  // pixel-identical. On mobile only VISIBLE_CARDS_MOBILE fit the row; the
  // remaining cards sit clipped in the overflow until the carousel drifts
  // or a swipe brings them in.
  const cardWidth = lerp(layout.thumbSize, layout.expandedCardWidth, progress);
  const rowLeft = Math.round(
    lerp(containerWidth - layout.collapsedPad - collapsedWidth, layout.expandedPad, progress)
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
          dead-center as it expands, via the interpolated rowBottom.
          Cards get explicit equal pixel widths (not flex-grow) so that the
          moment expansion completes, the identical layout can start
          drifting as an infinite carousel: the set renders twice and the
          track wraps every `cardSetWidth` px. overflow-hidden clips the
          duplicate set, which sits offscreen right until it drifts in. ── */}
      <div
        className={`absolute z-[5] select-none overflow-hidden ${
          carouselActive ? "cursor-grab active:cursor-grabbing" : ""
        }`}
        style={{
          left: rowLeft,
          width: rowWidth,
          height: rowHeight,
          bottom: rowBottom,
          // Let vertical touch gestures keep scrolling the page; only
          // horizontal swipes are claimed by the carousel.
          touchAction: "pan-y",
        }}
        onPointerDown={(e) => {
          if (!carouselActive) return;
          draggingRef.current = true;
          lastPointerXRef.current = e.clientX;
          lastPointerTRef.current = performance.now();
          flickVelocityRef.current = 0;
          velocityRef.current = 0;
          // Grabbing the track shouldn't leave a card stuck expanded.
          setHoveredId(null);
          pausedRef.current = false;
          e.currentTarget.setPointerCapture(e.pointerId);
        }}
        onPointerMove={(e) => {
          if (!draggingRef.current) return;
          const now = performance.now();
          const dx = e.clientX - lastPointerXRef.current;
          const dt = (now - lastPointerTRef.current) / 1000;
          lastPointerXRef.current = e.clientX;
          lastPointerTRef.current = now;
          // Dragging right (dx > 0) pulls earlier cards back into view,
          // i.e. decreases the offset.
          offsetRef.current -= dx;
          if (dt > 0) {
            // Exponential smoothing over move samples so one jittery
            // event doesn't dictate the whole flick.
            const sample = -dx / dt;
            flickVelocityRef.current = flickVelocityRef.current * 0.2 + sample * 0.8;
          }
        }}
        onPointerUp={(e) => {
          if (!draggingRef.current) return;
          draggingRef.current = false;
          velocityRef.current = Math.max(
            -CONFIG.MAX_SWIPE_SPEED,
            Math.min(CONFIG.MAX_SWIPE_SPEED, flickVelocityRef.current)
          );
          e.currentTarget.releasePointerCapture(e.pointerId);
        }}
        onPointerCancel={() => {
          draggingRef.current = false;
          velocityRef.current = 0;
        }}
      >
        <div ref={trackRef} className="flex h-full will-change-transform" style={{ gap: CONFIG.THUMB_GAP }}>
          {(carouselActive ? [...projects, ...projects] : projects).map((project, i) => {
            const isHovered = hoveredId === project.id;

            return (
              <div
                key={`${project.id}-${i >= projects.length ? "b" : "a"}`}
                onMouseEnter={() => {
                  setHoveredId(project.id);
                  setActiveId(project.id);
                  pausedRef.current = true; // hovering pauses the drift
                }}
                onMouseLeave={() => {
                  setHoveredId(null);
                  pausedRef.current = false;
                }}
                // The width transition is ONLY attached in carousel mode:
                // during the scroll-driven expansion widths change every
                // scroll tick, and a transition there retargets mid-flight
                // and makes the row look stuck (the original bug).
                className={`relative h-full shrink-0 cursor-pointer overflow-hidden rounded ${
                  carouselActive ? "transition-[width] duration-500 ease-out" : ""
                }`}
                style={{
                  width:
                    carouselActive && isHovered
                      ? cardWidth * CONFIG.HOVER_CARD_SCALE
                      : cardWidth,
                }}
              >
                <Image
                  src={project.image}
                  alt={project.name}
                  fill
                  draggable={false}
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
      </div>

      {/* ── Info bar: name/category bottom-left, live link bottom-right.
          Fixed a constant distance from the bottom of the screen —
          completely independent of the row now, so it can never overlap
          it regardless of EXPANDED_HEIGHT or viewport size. ── */}
      <div
        className="pointer-events-none absolute flex flex-wrap items-end justify-between gap-3"
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
          <div className="flex flex-wrap items-baseline gap-2 md:gap-4">
            <p className="font-display text-xl font-black uppercase text-black md:text-3xl">{active.name}</p>
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