"use client";

import { useEffect, useMemo, useState } from "react";
import { Arc, Bolt, Dot, Sunset, Triangle, Zigzag } from "./Memphis";

interface HeroProps {
  // 0–1 scroll progress of the RecentProjects section below. Pass this
  // straight through from its onProgress callback (wired up in page.tsx).
  // Once it crosses HIDE_THRESHOLD, the hero plays its reveal animation
  // in reverse to hide itself.
  projectsProgress?: number;
}

const HEADING = "Design In Motion";

// Letters from this index on render in the accent hue, so the headline
// lands on a colored word instead of reading as one flat block of ink.
const ACCENT_FROM = HEADING.indexOf("Motion");

const DESCRIPTION =
  "VoidFrame is a small studio working at the edge of design and code. We partner with ambitious brands to build interfaces that feel as good as they look — no templates, no filler.";

// Groups the description into chunks of 2–3 words each, so the reveal
// animates phrase-by-phrase instead of word-by-word or letter-by-letter.
function chunkWords(text: string, size: number): string[] {
  const words = text.split(" ");
  const chunks: string[] = [];
  for (let i = 0; i < words.length; i += size) {
    chunks.push(words.slice(i, i + size).join(" "));
  }
  return chunks;
}

// ─────────────────────────────────────────────────────────────────────────
// 🎛️ Tweak the feel of the reveal/hide here.
// ─────────────────────────────────────────────────────────────────────────
// How far into the RecentProjects scroll (0–1) before the hero starts
// hiding. Kept low/early — the hero should be gone as soon as the user
// commits to scrolling, not linger while the row expands.
const HIDE_THRESHOLD = 0.05;

// How long each individual piece (letter or word-chunk) takes to animate.
const DURATION_MS = 650;

// Stagger between successive HEADING letters, in ms.
const LETTER_STAGGER_MS = 26;

// Stagger between successive DESCRIPTION chunks, in ms — bigger since
// each piece is a whole phrase rather than a single character.
const CHUNK_STAGGER_MS = 90;

// Extra delay before the description starts, so it follows the heading's
// reveal rather than animating in at the same time.
const DESCRIPTION_START_DELAY_MS = 300;

// Word-group size for the description reveal (2–3 words per chunk).
const CHUNK_SIZE = 3;

const EASE = "cubic-bezier(0.16, 1, 0.3, 1)";

// Floating Memphis geometry for the landing screen. Positions deliberately
// avoid two zones: bottom-LEFT (the headline) and bottom-RIGHT (the
// collapsed RecentProjects thumbnail row, which sits ~80px off the bottom
// edge). Everything else is fair game.
const DECOR = [
  { Shape: Arc, id: "d1", hue: "pink", size: 190, rotate: 12, top: "16%", left: "6%", delay: 120 },
  { Shape: Dot, id: "d2", hue: "orange", size: 130, rotate: 0, top: "18%", left: "76%", delay: 220 },
  { Shape: Zigzag, id: "d3", hue: "blue", size: 165, rotate: -8, top: "44%", left: "86%", delay: 320 },
  { Shape: Bolt, id: "d4", hue: "yellow", size: 120, rotate: -14, top: "50%", left: "2%", delay: 420 },
  { Shape: Triangle, id: "d5", hue: "green", size: 105, rotate: 18, top: "8%", left: "44%", delay: 520 },
] as const;
// ─────────────────────────────────────────────────────────────────────────

export default function Hero({ projectsProgress = 0 }: HeroProps) {
  // Starts false so the very first paint is the "hidden" state — then we
  // flip it a tick later to trigger the CSS transition into view. If we
  // started true, the browser could paint the visible state immediately
  // and skip the animation entirely.
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const raf = requestAnimationFrame(() => setMounted(true));
    return () => cancelAnimationFrame(raf);
  }, []);

  const letters = useMemo(() => HEADING.split(""), []);
  const chunks = useMemo(() => chunkWords(DESCRIPTION, CHUNK_SIZE), []);

  const isHiddenByScroll = projectsProgress > HIDE_THRESHOLD;
  const visible = mounted && !isHiddenByScroll;

  return (
    <>
      {/* ── Decorative layer ──────────────────────────────────────────────
          Grid backdrop + floating geometry. Sits at z-0 so the
          RecentProjects thumbnails (z-5) always paint above it, and fades
          on the same `visible` flag as the headline so the whole landing
          screen clears as one gesture. ------------------------------- */}
      <div
        className="vf-grid pointer-events-none absolute left-0 top-0 z-0 h-screen w-screen overflow-hidden"
        style={{
          opacity: visible ? 1 : 0,
          transition: `opacity ${DURATION_MS}ms ${EASE}`,
        }}
      >
        {/* Retro sun, bled off the right edge behind everything else. */}
        <div className="absolute -right-24 top-1/2 -translate-y-1/2">
          <Sunset size={420} hue="orange" />
        </div>

        {DECOR.map(({ Shape, id, hue, size, rotate, top, left, delay }) => (
          <div
            key={id}
            className="absolute will-change-transform"
            style={{
              top,
              left,
              opacity: visible ? 1 : 0,
              transform: visible ? "translateY(0) scale(1)" : "translateY(28px) scale(0.9)",
              transitionProperty: "transform, opacity",
              transitionDuration: `${DURATION_MS}ms`,
              transitionTimingFunction: EASE,
              transitionDelay: `${visible ? delay : 0}ms`,
            }}
          >
            <Shape id={id} hue={hue} size={size} rotate={rotate} />
          </div>
        ))}
      </div>

      <div className="absolute bottom-10 left-10 z-20 max-w-4xl">
        {/* Anton, tight leading, hard black shadow — the display treatment
            the whole style is built around. */}
        {/* -masked variant: the per-letter overflow-hidden wrappers clip a
            text-shadow, so the shadow here is a drop-shadow filter applied
            to the composited glyphs after masking. */}
        <h1 className="font-display flex flex-wrap text-[clamp(3.5rem,9vw,8rem)] uppercase leading-[0.85] tracking-tight vf-text-hard-masked">
        {letters.map((letter, i) => {
          // Reveal sweeps left -> right (index order). Hide sweeps in the
          // same visual direction reversed (last letter first), so it
          // reads as the same motion undoing itself rather than a
          // mirror-image animation.
          const delayIndex = visible ? i : letters.length - 1 - i;

          return (
            <span key={i} className="inline-block overflow-hidden">
              <span
                className={`inline-block will-change-transform ${
                  i >= ACCENT_FROM ? "text-green" : ""
                }`}
                style={{
                  transform: visible ? "translateY(0%)" : "translateY(110%)",
                  opacity: visible ? 1 : 0,
                  transitionProperty: "transform, opacity",
                  transitionDuration: `${DURATION_MS}ms`,
                  transitionTimingFunction: EASE,
                  transitionDelay: `${delayIndex * LETTER_STAGGER_MS}ms`,
                }}
              >
                {letter === " " ? "\u00A0" : letter}
              </span>
            </span>
          );
        })}
      </h1>

      {/* Description: same reveal/hide motion as the heading, just applied
          per 2–3 word chunk instead of per letter, and starting a beat
          after the heading finishes. */}
      <p className="mt-5 flex max-w-xl flex-wrap gap-x-1.5 gap-y-1 text-sm leading-snug text-ink">
        {chunks.map((chunk, i) => {
          const delayIndex = visible ? i : chunks.length - 1 - i;
          const baseDelay = visible ? DESCRIPTION_START_DELAY_MS : 0;

          return (
            <span key={i} className="inline-block overflow-hidden">
              <span
                className="inline-block will-change-transform"
                style={{
                  transform: visible ? "translateY(0%)" : "translateY(110%)",
                  opacity: visible ? 1 : 0,
                  transitionProperty: "transform, opacity",
                  transitionDuration: `${DURATION_MS}ms`,
                  transitionTimingFunction: EASE,
                  transitionDelay: `${baseDelay + delayIndex * CHUNK_STAGGER_MS}ms`,
                }}
              >
                {chunk}
              </span>
            </span>
          );
        })}
      </p>
      </div>
    </>
  );
}