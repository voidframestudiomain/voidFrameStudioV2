"use client";

import { useEffect, useRef, useState } from "react";
import { Bolt, Dot, Triangle } from "./Memphis";

/**
 * THE PROCESS™
 * ---------------------------------------------------------------------
 * Every agency site has the same diagram: four tidy steps and an arrow.
 * This is ours instead — the real process as a physics pit. The steps
 * (BRIEF, PANIC, COFFEE, DEADLINE…) are rigid bodies you can drag and
 * throw around a beige "whiteboard". One button assembles them into a
 * neat professional row… which holds for ~2 seconds before gravity
 * returns and the whole methodology collapses. Infinitely replayable.
 *
 * Physics is deliberately homemade: AABB bodies, gravity, wall bounces,
 * pair separation, pointer-capture dragging with throw velocity. All
 * per-frame values live in refs and write straight to style.transform —
 * React only re-renders for captions/attempts.
 * --------------------------------------------------------------------- */

const rand = (a: number, b: number) => a + Math.random() * (b - a);
const clamp = (v: number, a: number, b: number) => Math.min(b, Math.max(a, v));

// ── The methodology, in canonical order ───────────────────────────────
// Staging arranges them in THIS order, so the "organized" row reads as
// its own joke, left to right.
interface BodySpec {
  label?: string;
  cls?: string;
  shape?: "dot" | "bolt" | "tri";
}

const SPECS: BodySpec[] = [
  { label: "BRIEF", cls: "bg-beige" },
  { label: "MOODBOARD", cls: "bg-pink" },
  { label: "DOUBT", cls: "bg-blue" },
  { label: "COFFEE", cls: "bg-orange" },
  { shape: "dot" },
  { label: "PANIC", cls: "bg-pink" },
  { label: "DEADLINE", cls: "bg-yellow" },
  { shape: "bolt" },
  { label: "EUREKA", cls: "bg-green text-beige" },
  { label: "REVISION_47", cls: "bg-beige font-mono normal-case" },
  { label: "SCOPE CREEP", cls: "bg-orange" },
  { shape: "tri" },
  { label: "GENIUS", cls: "bg-yellow" },
  { label: "SHIP IT", cls: "bg-green text-beige" },
];

interface Body {
  x: number; // center, pit coords
  y: number;
  vx: number;
  vy: number;
  w: number;
  h: number;
  rot: number;
  squash: number;
  delay: number; // entrance-rain stagger (ms)
  tx: number; // staged slot target
  ty: number;
}

const IDLE_CAPTION = "drag the chaos · throw things · it's therapeutic";

const STAGED_CAPTIONS = [
  "Behold: The Process™. So professional.",
  "Again? It didn't hold the first time.",
  "Your faith in systems is adorable.",
  "Even the pills look tired.",
  "Same thing, expecting different results…",
];

const COLLAPSED_CAPTIONS = [
  "Aaand it's gone.",
  "Physics 2 — Process 0.",
  "Gravity remains undefeated.",
  "Chaos wins. Chaos always wins.",
  "See? The real process. Every time.",
];

const GRAVITY = 2600; // px/s²
const FLOOR_REST = 0.38;
const WALL_REST = 0.55;

export default function ProcessPit() {
  const sectionRef = useRef<HTMLElement>(null);
  const pitRef = useRef<HTMLDivElement>(null);
  const elsRef = useRef<(HTMLDivElement | null)[]>([]);
  const bodiesRef = useRef<Body[] | null>(null);
  // 'free' = physics on · 'staged' = spring to slots, collisions off.
  const modeRef = useRef<"free" | "staged">("free");
  const dragRef = useRef<{
    idx: number;
    dx: number;
    dy: number;
    px: number;
    py: number;
    samples: { x: number; y: number; t: number }[];
    // Set on pointer-up; the physics loop consumes it as the throw.
    released?: { vx: number; vy: number };
  } | null>(null);
  // Handlers never touch the bodies directly (they're owned by the
  // effect) — they post a request here and the loop executes it.
  const stageRequestRef = useRef<"stage" | "collapse" | null>(null);
  const stageTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const [ready, setReady] = useState(false);
  const [staged, setStaged] = useState(false);
  const [attempts, setAttempts] = useState(0);
  const [caption, setCaption] = useState({ n: 0, text: IDLE_CAPTION });

  // ── Physics loop ────────────────────────────────────────────────────
  useEffect(() => {
    const pit = pitRef.current;
    if (!pit) return;

    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    // Measure the rendered pills, then scatter them above the pit so
    // they rain in when the section first scrolls into view.
    const measure = () => {
      const W = pit.clientWidth;
      bodiesRef.current = SPECS.map((_, i) => {
        const el = elsRef.current[i];
        const w = el?.offsetWidth ?? 90;
        const h = el?.offsetHeight ?? 40;
        return {
          x: rand(w, Math.max(w + 1, W - w)),
          y: reduceMotion ? pit.clientHeight - h / 2 - 2 : -rand(80, 700) - i * 60,
          vx: rand(-40, 40),
          vy: 0,
          w,
          h,
          rot: 0,
          squash: 1,
          delay: reduceMotion ? 0 : i * 80,
          tx: 0,
          ty: 0,
        };
      });
    };
    if (!bodiesRef.current) measure();
    setReady(true);

    const ro = new ResizeObserver(() => {
      const bodies = bodiesRef.current;
      if (!bodies) return;
      const W = pit.clientWidth;
      const H = pit.clientHeight;
      for (const b of bodies) {
        b.x = clamp(b.x, b.w / 2, Math.max(b.w / 2, W - b.w / 2));
        b.y = Math.min(b.y, H - b.h / 2);
      }
    });
    ro.observe(pit);

    let active = false;
    let started = 0; // timestamp of first activation, drives entrance stagger
    let raf = 0;
    let last = 0;

    const io = new IntersectionObserver(
      ([entry]) => {
        const was = active;
        active = entry.isIntersecting;
        if (active && !was) {
          last = 0;
          raf = requestAnimationFrame(tick);
        }
      },
      { rootMargin: "80px" }
    );
    if (sectionRef.current) io.observe(sectionRef.current);

    const tick = (now: number) => {
      if (!active) return;
      raf = requestAnimationFrame(tick);
      const bodies = bodiesRef.current;
      if (!bodies) return;
      if (!started) started = now;
      const dt = clamp(last ? (now - last) / 1000 : 0.016, 0.001, 1 / 30);
      last = now;

      const W = pit.clientWidth;
      const H = pit.clientHeight;

      // Execute pending requests from the event handlers.
      const req = stageRequestRef.current;
      if (req) {
        stageRequestRef.current = null;
        if (req === "stage") {
          // Lay slots out like flex-wrap: rows from ~34% height, wrapping.
          const pad = Math.max(24, W * 0.05);
          const gap = 14;
          let cx = pad;
          let row = 0;
          for (const b of bodies) {
            if (cx + b.w > W - pad) {
              cx = pad;
              row++;
            }
            b.tx = cx + b.w / 2;
            b.ty = H * 0.34 + row * 74;
            cx += b.w + gap;
          }
          modeRef.current = "staged";
        } else {
          modeRef.current = "free";
          // A parting shove, so the collapse scatters instead of pancaking.
          for (const b of bodies) {
            b.vx += rand(-260, 260);
            b.vy += rand(-140, 40);
          }
        }
      }

      // Consume a finished drag: apply the throw velocity.
      if (dragRef.current?.released) {
        const d = dragRef.current;
        const b = bodies[d.idx];
        if (b && d.released) {
          b.vx = d.released.vx;
          b.vy = d.released.vy;
        }
        dragRef.current = null;
      }

      const drag = dragRef.current;
      const stagedMode = modeRef.current === "staged";

      bodies.forEach((b, i) => {
        if (now - started < b.delay) return; // hasn't rained in yet

        if (drag?.idx === i) {
          // Follow the pointer, remember velocity for the throw.
          const tx = drag.px + drag.dx;
          const ty = drag.py + drag.dy;
          const prevX = b.x;
          const prevY = b.y;
          b.x += (tx - b.x) * 0.6;
          b.y += (ty - b.y) * 0.6;
          b.vx = clamp((b.x - prevX) / dt, -2600, 2600);
          b.vy = clamp((b.y - prevY) / dt, -2600, 2600);
        } else if (stagedMode) {
          // Spring toward the assigned slot. (Yank one out mid-pose and
          // it snaps back — the diagram INSISTS it's a real system.)
          b.vx += ((b.tx - b.x) * 90 - b.vx * 14) * dt;
          b.vy += ((b.ty - b.y) * 90 - b.vy * 14) * dt;
          b.x += b.vx * dt;
          b.y += b.vy * dt;
        } else {
          b.vy += GRAVITY * dt;
          b.x += b.vx * dt;
          b.y += b.vy * dt;

          // Walls / floor.
          if (b.x < b.w / 2) {
            b.x = b.w / 2;
            if (b.vx < -700) b.squash = 0.82;
            b.vx = Math.abs(b.vx) * WALL_REST;
          } else if (b.x > W - b.w / 2) {
            b.x = W - b.w / 2;
            if (b.vx > 700) b.squash = 0.82;
            b.vx = -Math.abs(b.vx) * WALL_REST;
          }
          if (b.y > H - b.h / 2) {
            b.y = H - b.h / 2;
            if (b.vy > 700) b.squash = 1.22;
            b.vy = b.vy > 140 ? -b.vy * FLOOR_REST : 0;
            b.vx *= 0.9; // ground friction
          }
        }

        // Cosmetic lean + squash recovery.
        const targetRot = stagedMode ? 0 : clamp(b.vx * 0.018, -13, 13);
        b.rot += (targetRot - b.rot) * 0.18;
        b.squash += (1 - b.squash) * 0.16;
      });

      // Pair separation — skipped while staged so the row stays crisp.
      if (!stagedMode) {
        for (let pass = 0; pass < 2; pass++) {
          for (let i = 0; i < bodies.length; i++) {
            for (let j = i + 1; j < bodies.length; j++) {
              const a = bodies[i];
              const b = bodies[j];
              const ox = (a.w + b.w) / 2 - Math.abs(a.x - b.x);
              const oy = (a.h + b.h) / 2 - Math.abs(a.y - b.y);
              if (ox <= 0 || oy <= 0) continue;
              const aHeld = drag?.idx === i;
              const bHeld = drag?.idx === j;
              if (ox < oy) {
                const s = a.x < b.x ? -1 : 1;
                if (aHeld) b.x -= s * ox;
                else if (bHeld) a.x += s * ox;
                else {
                  a.x += (s * ox) / 2;
                  b.x -= (s * ox) / 2;
                }
                const rv = a.vx - b.vx;
                if (rv * s < 0 && !aHeld && !bHeld) {
                  a.vx = b.vx * 0.5;
                  b.vx = rv * 0.5 + b.vx;
                }
              } else {
                const s = a.y < b.y ? -1 : 1;
                if (aHeld) b.y -= s * oy;
                else if (bHeld) a.y += s * oy;
                else {
                  a.y += (s * oy) / 2;
                  b.y -= (s * oy) / 2;
                }
                const rv = a.vy - b.vy;
                if (rv * s < 0 && !aHeld && !bHeld) {
                  a.vy = b.vy * 0.5;
                  b.vy = rv * 0.5 + b.vy;
                }
              }
            }
          }
        }
      }

      // Write to the DOM.
      bodies.forEach((b, i) => {
        const el = elsRef.current[i];
        if (!el) return;
        el.style.transform = `translate3d(${b.x - b.w / 2}px, ${b.y - b.h / 2}px, 0) rotate(${b.rot}deg) scale(${b.squash}, ${2 - b.squash})`;
      });
    };

    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
      io.disconnect();
      if (stageTimer.current) clearTimeout(stageTimer.current);
    };
  }, []);

  // ── Dragging ────────────────────────────────────────────────────────
  const pitPoint = (e: React.PointerEvent) => {
    const rect = pitRef.current?.getBoundingClientRect();
    return rect
      ? { x: e.clientX - rect.left, y: e.clientY - rect.top }
      : { x: 0, y: 0 };
  };

  const onGrab = (i: number) => (e: React.PointerEvent<HTMLDivElement>) => {
    const b = bodiesRef.current?.[i];
    if (!b) return;
    e.currentTarget.setPointerCapture(e.pointerId);
    const p = pitPoint(e);
    dragRef.current = {
      idx: i,
      dx: b.x - p.x,
      dy: b.y - p.y,
      px: p.x,
      py: p.y,
      samples: [],
    };
  };

  const onMove = (e: React.PointerEvent<HTMLDivElement>) => {
    const d = dragRef.current;
    if (!d) return;
    const p = pitPoint(e);
    d.px = p.x;
    d.py = p.y;
    // e.timeStamp: same high-res clock as performance.now(), but taken
    // from the event itself, which keeps the handler pure.
    d.samples.push({ x: p.x, y: p.y, t: e.timeStamp });
    if (d.samples.length > 5) d.samples.shift();
  };

  const onRelease = (i: number) => () => {
    const d = dragRef.current;
    if (!d || d.idx !== i || d.released) return;
    // Throw velocity from the last few pointer samples. Posted for the
    // loop to apply — the bodies belong to the effect.
    let vx = 0;
    let vy = 0;
    if (d.samples.length >= 2) {
      const a = d.samples[0];
      const z = d.samples[d.samples.length - 1];
      const dt = Math.max((z.t - a.t) / 1000, 0.016);
      vx = clamp((z.x - a.x) / dt, -2200, 2200);
      vy = clamp((z.y - a.y) / dt, -2200, 2200);
    }
    d.released = { vx, vy };
  };

  // ── The button ──────────────────────────────────────────────────────
  const pretendOrganized = () => {
    if (staged || modeRef.current === "staged") return;

    stageRequestRef.current = "stage";
    setStaged(true);
    const n = attempts; // caption index BEFORE increment
    setAttempts((a) => a + 1);
    setCaption((c) => ({
      n: c.n + 1,
      text: STAGED_CAPTIONS[Math.min(n, STAGED_CAPTIONS.length - 1)],
    }));

    stageTimer.current = setTimeout(() => {
      stageRequestRef.current = "collapse";
      setStaged(false);
      setCaption((c) => ({
        n: c.n + 1,
        text: COLLAPSED_CAPTIONS[Math.min(n, COLLAPSED_CAPTIONS.length - 1)],
      }));
    }, 2200);
  };

  return (
    <section ref={sectionRef} className="vf-bleed relative overflow-hidden bg-ink py-32 text-beige">
      <style>{`
        @keyframes ppNote {
          from { transform: translateY(8px); opacity: 0; }
          to { transform: translateY(0); opacity: 1; }
        }
      `}</style>

      <div className="relative z-10 mx-auto max-w-7xl px-10">
        {/* ── Copy ── */}
        <div className="flex flex-wrap items-end justify-between gap-10">
          <div className="max-w-2xl">
            <span className="vf-pill vf-pill--pink text-xs!">How we work · allegedly</span>

            <h2
              className="font-display mt-8 text-[clamp(3rem,7vw,6.5rem)] uppercase leading-[0.85] tracking-tight"
              style={{ color: "#fff", textShadow: "6px 6px 0 var(--color-green)" }}
            >
              The
              <br />
              Process™
            </h2>

            <p className="mt-8 max-w-xl text-lg leading-relaxed text-beige/80">
              Every agency site has the same diagram: four tidy steps and an
              arrow. Here&apos;s ours instead — physically accurate,
              peer-reviewed by gravity. Grab it. Throw it. Then press the
              button and watch us pretend.
            </p>
            <p className="mt-4 text-sm text-beige/50">
              100% real footage. The coffee is load-bearing.
            </p>
          </div>

          {/* Controls */}
          <div className="flex flex-col items-start gap-3 pb-2">
            <button
              type="button"
              onClick={pretendOrganized}
              disabled={staged}
              className="vf-pill disabled:cursor-not-allowed disabled:opacity-60"
            >
              {staged ? "Enjoy it while it lasts…" : "Pretend we have a process"}
            </button>
            <p className="font-mono text-xs uppercase tracking-widest text-beige/50">
              organization attempts: {attempts}
              {attempts >= 3 && " (why)"}
            </p>
            <p
              key={caption.n}
              className="min-h-6 text-sm font-semibold text-yellow"
              style={{ animation: "ppNote 0.35s cubic-bezier(0.16,1,0.3,1)" }}
              role="status"
              aria-live="polite"
            >
              {caption.text}
            </p>
          </div>
        </div>

        {/* ── The pit ── */}
        <div
          ref={pitRef}
          className="relative mt-12 h-105 touch-pan-y overflow-hidden rounded-xl border-2 border-outline bg-beige sm:h-130"
          style={{
            boxShadow: "10px 10px 0 var(--color-green)",
            backgroundImage:
              "linear-gradient(to right, rgba(0,0,0,0.05) 1.5px, transparent 1.5px), linear-gradient(to bottom, rgba(0,0,0,0.05) 1.5px, transparent 1.5px)",
            backgroundSize: "72px 72px",
          }}
        >
          {/* Taped-on figure label */}
          <div className="vf-hard pointer-events-none absolute left-4 top-4 z-10 -rotate-2 rounded border-2 border-outline bg-pistachio px-2.5 py-1 font-mono text-[10px] uppercase tracking-widest text-ink">
            fig. 1 — the creative process (accurate)
          </div>

          {SPECS.map((spec, i) => (
            <div
              key={i}
              ref={(el) => {
                elsRef.current[i] = el;
              }}
              onPointerDown={onGrab(i)}
              onPointerMove={onMove}
              onPointerUp={onRelease(i)}
              onPointerCancel={onRelease(i)}
              className={`absolute left-0 top-0 cursor-grab touch-none select-none will-change-transform active:cursor-grabbing ${
                ready ? "" : "opacity-0"
              } ${
                spec.shape
                  ? ""
                  : `vf-hard rounded-lg border-2 border-outline px-4 py-2 text-sm font-bold uppercase tracking-wide text-ink ${spec.cls}`
              }`}
            >
              {spec.shape === "dot" && <Dot id={`pp-d${i}`} hue="blue" size={64} shadow={4} />}
              {spec.shape === "bolt" && <Bolt id={`pp-b${i}`} hue="yellow" size={56} shadow={4} />}
              {spec.shape === "tri" && <Triangle id={`pp-t${i}`} hue="green" size={64} shadow={4} />}
              {spec.label}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
