"use client";

import { useEffect, useMemo, useState } from "react";

interface HeroProps {
  // 0–1 scroll progress of the RecentProjects section below. Pass this
  // straight through from its onProgress callback (wired up in page.tsx).
  // Once it crosses HIDE_THRESHOLD, the hero plays its reveal animation
  // in reverse to hide itself.
  projectsProgress?: number;
}

const HEADING = "Design In Motion";

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
    <div className="absolute bottom-8 left-5 right-5 max-w-xl md:bottom-10 md:left-10 md:right-auto">
      <h1 className="flex flex-wrap text-4xl font-bold uppercase leading-none tracking-tighter text-black sm:text-5xl md:text-6xl">
        {letters.map((letter, i) => {
          // Reveal sweeps left -> right (index order). Hide sweeps in the
          // same visual direction reversed (last letter first), so it
          // reads as the same motion undoing itself rather than a
          // mirror-image animation.
          const delayIndex = visible ? i : letters.length - 1 - i;

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
      <p className="mt-1 flex flex-wrap gap-x-1.5 text-sm leading-none text-black/70">
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
  );
}