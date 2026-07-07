"use client";

import { useEffect, useRef, useState } from "react";
import Header from "@/components/Header";
import Hero from "@/components/Hero";
import RecentProjects from "@/components/RecentProjects";
import HowWeWork from "@/components/HowWeWork";

const clamp01 = (n: number) => Math.min(1, Math.max(0, n));
const remap = (t: number, start: number, end: number) =>
  clamp01((t - start) / (end - start));

// ─────────────────────────────────────────────────────────────────────────
// 🎛️ TWEAK HERE
//
// RecentProjects and HowWeWork now share ONE scroll track and ONE sticky
// viewport, instead of each owning its own height + sticky wrapper. This
// is what makes HowWeWork feel like it's sliding IN OVER RecentProjects
// (still pinned, still visible) rather than appearing as a separate
// section after you scroll past it.
//
// RECENT_END: fraction (0–1) of the combined scroll track spent on the
// RecentProjects row expanding.
//
// HOLD_END: fraction where the "hold" ends. Between RECENT_END and
// HOLD_END, recentProgress is already pinned at 1 (fully expanded) AND
// slideProgress is still pinned at 0 — nothing moves, giving the user a
// beat to see the fully-expanded row before HowWeWork starts sliding in.
//
// SLIDE_END: fraction where the slide-in + black->yellow color flip (both
// handled inside HowWeWork from its own `progress` prop) finish. Between
// HOLD_END and SLIDE_END, slideProgress climbs 0 -> 1.
//
// Past SLIDE_END, stepsProgress climbs 0 -> 1 across the rest of the
// track. HowWeWork splits that internally into 4 equal chunks — one per
// strap — so each step's torn cover peels away in sequence as you keep
// scrolling, instead of all 4 appearing at once.
//
// TOTAL_SCROLL_VH: total scrollable height (in viewport-heights) for ALL
// FOUR phases combined. Bumped up from before since there's now a whole
// extra reveal phase — narrower and the 4 straps will feel rushed.
const RECENT_END = 0.35;
const HOLD_END = 0.45;
const SLIDE_END = 0.55;
const TOTAL_SCROLL_VH = 320;
// ─────────────────────────────────────────────────────────────────────────

export default function Home() {
  const [rawProgress, setRawProgress] = useState(0);
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
        setRawProgress(next);
      });
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();

    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", measure);
      if (raf) cancelAnimationFrame(raf);
    };
  }, []);

  // Split the single combined scroll progress into four phases:
  // - recentProgress: 0 -> 1 across the first RECENT_END fraction, then
  //   pinned at 1 (row stays fully expanded).
  // - between RECENT_END and HOLD_END: nothing moves — the pause that lets
  //   the fully-expanded row register before the slide-in starts.
  // - slideProgress: 0 -> 1 between HOLD_END and SLIDE_END. Drives
  //   HowWeWork's translateX AND its internal black->yellow color flip.
  // - stepsProgress: 0 -> 1 across the rest of the track (SLIDE_END -> 1).
  //   HowWeWork uses this to peel back each strap's torn cover in
  //   sequence, one at a time.
  const recentProgress = remap(rawProgress, 0, RECENT_END);
  const slideProgress = remap(rawProgress, HOLD_END, SLIDE_END);
  const stepsProgress = remap(rawProgress, SLIDE_END, 1);

  return (
    <main className="min-h-screen flex flex-col px-[40px] py-10">
      <Header />
      {/* Hero still syncs its own hide animation to the RecentProjects
          expansion phase specifically, so it gets recentProgress, not the
          raw combined value. */}
      <Hero projectsProgress={recentProgress} />

      <div ref={sectionRef} style={{ height: `${TOTAL_SCROLL_VH}vh` }} className="relative">
        <div className="sticky top-0 h-screen w-full">
          <RecentProjects progress={recentProgress} containerWidth={containerWidth} />
          <HowWeWork progress={slideProgress} stepsProgress={stepsProgress} />
        </div>
      </div>
    </main>
  );
}