"use client";

import { useEffect, useRef, useState } from "react";

/**
 * THE CLIENT SIMULATOR
 * ---------------------------------------------------------------------
 * Interactive canvas gag: a poster we're "proud of" sits in a fake
 * browser window, and every button is a piece of real client feedback.
 * Each click mutates the artwork (logo inflates, colors go neon, fonts
 * turn ransom-note, or everything drains to corporate grey) and bleeds
 * the DESIGN INTEGRITY meter. At 0% the poster's elements get physics
 * and fall off the canvas, and the death screen pitches the contact
 * section. The punchline of FunFact's red-flag quotes, made playable.
 *
 * All artwork is drawn in a 1000×1250 design space and scaled to the
 * canvas each frame, so it stays crisp at any size/DPR.
 * --------------------------------------------------------------------- */

// ── Design-space constants ────────────────────────────────────────────
const DW = 1000;
const DH = 1250;

type HSL = { h: number; s: number; l: number };

// Palette in HSL so pop (hue spin / saturation) and safe (desaturate)
// can be applied as math instead of pre-baked color variants.
const P = {
  green: { h: 164, s: 100, l: 29 },
  pink: { h: 324, s: 64, l: 77 },
  yellow: { h: 62, s: 69, l: 57 },
  orange: { h: 28, s: 85, l: 60 },
  blue: { h: 209, s: 49, l: 65 },
  ink: { h: 160, s: 8, l: 15 },
} satisfies Record<string, HSL>;

interface Dyn {
  vx: number;
  vy: number;
  vr: number;
}

interface ShapeItem {
  type: "sun" | "arc" | "tri" | "bolt" | "dot" | "zig";
  x: number;
  y: number;
  size: number;
  rot: number;
  color: HSL;
  // Pre-rolled speckle dash positions, stable across frames.
  dashes: { x: number; y: number; a: number }[];
  dyn?: Dyn;
}

interface TextItem {
  t: string;
  // Replacement copy once "play it safe" has been pressed enough.
  safeT?: string;
  x: number;
  y: number;
  size: number;
  display: boolean;
  dyn?: Dyn;
}

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  rot: number;
  vr: number;
  life: number;
  color: string;
  size: number;
}

interface World {
  shapes: ShapeItem[];
  texts: TextItem[];
  logo: { x: number; y: number; size: number; scale: number; scaleT: number; dyn?: Dyn };
  pop: number;
  safe: number;
  fontLv: number;
  shakeT: number;
  particles: Particle[];
  dead: boolean;
}

const rand = (a: number, b: number) => a + Math.random() * (b - a);

function makeDashes(radius: number): ShapeItem["dashes"] {
  return Array.from({ length: 9 }, () => ({
    x: rand(-radius, radius),
    y: rand(-radius, radius),
    a: rand(0, Math.PI),
  }));
}

function initWorld(): World {
  return {
    shapes: [
      { type: "sun", x: 780, y: 300, size: 210, rot: 0, color: P.orange, dashes: [] },
      { type: "dot", x: 180, y: 260, size: 85, rot: 0, color: P.blue, dashes: makeDashes(60) },
      { type: "zig", x: 520, y: 190, size: 150, rot: -0.1, color: P.green, dashes: [] },
      { type: "bolt", x: 830, y: 640, size: 150, rot: -0.25, color: P.yellow, dashes: makeDashes(45) },
      { type: "tri", x: 660, y: 980, size: 170, rot: 0.18, color: P.green, dashes: makeDashes(55) },
      { type: "arc", x: 250, y: 1030, size: 260, rot: -0.12, color: P.pink, dashes: [] },
    ],
    texts: [
      { t: "VOID", x: 80, y: 520, size: 225, display: true },
      { t: "FRAME", x: 80, y: 720, size: 225, display: true },
      {
        t: "DESIGN IN MOTION",
        safeT: "SYNERGY. INNOVATION. SOLUTIONS.",
        x: 84,
        y: 800,
        size: 38,
        display: false,
      },
      { t: "EST. 2026", x: 800, y: 1180, size: 30, display: false },
    ],
    logo: { x: 125, y: 125, size: 95, scale: 1, scaleT: 1 },
    pop: 0,
    safe: 0,
    fontLv: 0,
    shakeT: 0,
    particles: [],
    dead: false,
  };
}

// ── Feedback buttons ──────────────────────────────────────────────────
const ACTIONS = {
  logo: {
    label: "Make the logo bigger",
    cost: 12,
    quips: [
      "Done. The logo is now 50% bigger. Visionary.",
      "Bigger again. The whitespace is filing a complaint.",
      "The logo is now the main character.",
      "NASA called. They can see it.",
      "The logo has consumed the design. Long live the logo.",
    ],
  },
  pop: {
    label: "Make it pop",
    cost: 15,
    quips: [
      "We made it pop. It now pops.",
      "Added neon. Subtlety has left the chat.",
      "It's popping so hard the colors are fighting.",
      "Pop level critical. Sunglasses recommended.",
      "It is now 100% pop, 0% design.",
    ],
  },
  font: {
    label: "Add another font",
    cost: 18,
    quips: [
      "Added a second font. Bold. Literally.",
      "Third font added. It's giving ransom note.",
      "Comic Sans has entered the building.",
      "Five fonts, each one a cry for help.",
      "The fonts have unionized against you.",
    ],
  },
  safe: {
    label: "Play it safe",
    cost: 10,
    quips: [
      "Played it safe. Removed 30% of the joy.",
      "Safer. Beiger. Sadder.",
      "It now reads like a terms & conditions page.",
      "Congratulations, it's officially wallpaper.",
      "Maximum safety achieved. Flatline imminent.",
    ],
  },
} as const;
type ActionKey = keyof typeof ACTIONS;

const CHAOS_FONTS = [
  '"Comic Sans MS", "Comic Sans", cursive',
  "Papyrus, fantasy",
  '"Courier New", monospace',
  "Impact, fantasy",
  "Georgia, serif",
  '"Brush Script MT", cursive',
];

const DEFAULT_NOTE = "Current status: actually quite nice. Try not to ruin it.";

// Resolve an HSL through the current pop/safe chaos levels.
function css(c: HSL, pop: number, safe: number, hueSpin: boolean): string {
  const h = (c.h + (hueSpin ? pop * 47 : 0)) % 360;
  const desat = 1 - Math.min(0.85, safe * 0.3);
  const s = Math.min(100, c.s + pop * 8) * desat;
  const l = c.l + (78 - c.l) * Math.min(0.7, safe * 0.22);
  return `hsl(${h} ${s}% ${l}%)`;
}

export default function ClientSimulator() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const frameRef = useRef<HTMLDivElement>(null);
  const sectionRef = useRef<HTMLElement>(null);
  const headingRef = useRef<HTMLHeadingElement>(null);
  const tipRef = useRef<HTMLDivElement>(null);
  const worldRef = useRef<World | null>(null);
  const integrityRef = useRef(100);
  const deathTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const [integrity, setIntegrity] = useState(100);
  const [counts, setCounts] = useState<Record<ActionKey, number>>({
    logo: 0,
    pop: 0,
    font: 0,
    safe: 0,
  });
  const [note, setNote] = useState({ n: 0, text: DEFAULT_NOTE });
  const [dead, setDead] = useState(false);

  // ── Render loop ─────────────────────────────────────────────────────
  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx) return;

    worldRef.current ??= initWorld();

    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    // The Anton/PP Mori families registered by next/font have generated
    // names — read them off rendered elements instead of hardcoding.
    const displayFont = headingRef.current
      ? getComputedStyle(headingRef.current).fontFamily
      : "sans-serif";
    const bodyFont = getComputedStyle(document.body).fontFamily;

    const ro = new ResizeObserver(() => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const rect = canvas.getBoundingClientRect();
      canvas.width = Math.round(rect.width * dpr);
      canvas.height = Math.round(rect.height * dpr);
    });
    ro.observe(canvas);

    // Only burn frames while the section is on screen.
    let active = false;
    let raf = 0;
    const io = new IntersectionObserver(
      ([entry]) => {
        const was = active;
        active = entry.isIntersecting;
        if (active && !was) raf = requestAnimationFrame(tick);
      },
      { rootMargin: "120px" }
    );
    if (sectionRef.current) io.observe(sectionRef.current);

    function textFont(w: World, i: number, item: TextItem): string {
      if (w.fontLv > 0) {
        return CHAOS_FONTS[(i * 3 + w.fontLv) % CHAOS_FONTS.length];
      }
      return item.display ? displayFont : bodyFont;
    }

    function drawShape(w: World, sh: ShapeItem, t: number, i: number) {
      if (!ctx) return;
      const jiggle =
        !reduceMotion && w.pop > 0 && !w.dead
          ? Math.sin(t * (2 + i * 0.6) + i * 1.7) * 0.05 * Math.min(w.pop, 4)
          : 0;
      const size = sh.size * (1 - Math.min(0.35, w.safe * 0.08));
      const fill = css(sh.color, w.pop, w.safe, true);

      // Two passes: black copy offset +8/+8 (the hard shadow), then the
      // real shape. Matches the DOM shapes' zero-blur drop-shadow.
      for (const pass of ["shadow", "top"] as const) {
        ctx.save();
        ctx.translate(sh.x + (pass === "shadow" ? 8 : 0), sh.y + (pass === "shadow" ? 8 : 0));
        ctx.rotate(sh.rot + jiggle);
        const col = pass === "shadow" ? "#000" : fill;

        ctx.lineJoin = "round";
        if (sh.type === "dot") {
          ctx.beginPath();
          ctx.arc(0, 0, size * 0.55, 0, Math.PI * 2);
          ctx.fillStyle = col;
          ctx.fill();
          if (pass === "top") {
            ctx.lineWidth = 7;
            ctx.strokeStyle = "#000";
            ctx.stroke();
            speckle(sh, size * 0.5);
          }
        } else if (sh.type === "tri") {
          const k = size / 100;
          ctx.beginPath();
          ctx.moveTo(0, -44 * k);
          ctx.lineTo(44 * k, 32 * k);
          ctx.lineTo(-44 * k, 32 * k);
          ctx.closePath();
          ctx.fillStyle = col;
          ctx.fill();
          if (pass === "top") {
            ctx.lineWidth = 7;
            ctx.strokeStyle = "#000";
            ctx.stroke();
            speckle(sh, size * 0.4);
          }
        } else if (sh.type === "bolt") {
          const k = size / 100;
          const pts = [
            [12, -59],
            [-32, 1],
            [-4, 1],
            [-16, 59],
            [34, -13],
            [4, -13],
          ];
          ctx.beginPath();
          pts.forEach(([px, py], n) => (n ? ctx.lineTo(px * k, py * k) : ctx.moveTo(px * k, py * k)));
          ctx.closePath();
          ctx.fillStyle = col;
          ctx.fill();
          if (pass === "top") {
            ctx.lineWidth = 7;
            ctx.strokeStyle = "#000";
            ctx.stroke();
          }
        } else if (sh.type === "arc") {
          const r = size * 0.42;
          ctx.beginPath();
          ctx.arc(0, 0, r, Math.PI, Math.PI * 2, false);
          ctx.lineCap = "butt";
          if (pass === "shadow") {
            ctx.lineWidth = size * 0.3;
            ctx.strokeStyle = "#000";
            ctx.stroke();
          } else {
            ctx.lineWidth = size * 0.3;
            ctx.strokeStyle = "#000";
            ctx.stroke();
            ctx.lineWidth = size * 0.22;
            ctx.strokeStyle = col;
            ctx.stroke();
          }
        } else if (sh.type === "zig") {
          const k = size / 100;
          const pts = [
            [-39, -40],
            [-13, -40],
            [-13, -14],
            [13, -14],
            [13, 12],
            [39, 12],
            [39, 40],
          ];
          ctx.beginPath();
          pts.forEach(([px, py], n) => (n ? ctx.lineTo(px * k, py * k) : ctx.moveTo(px * k, py * k)));
          ctx.lineCap = "butt";
          if (pass === "shadow") {
            ctx.lineWidth = size * 0.27;
            ctx.strokeStyle = "#000";
            ctx.stroke();
          } else {
            ctx.lineWidth = size * 0.27;
            ctx.strokeStyle = "#000";
            ctx.stroke();
            ctx.lineWidth = size * 0.19;
            ctx.strokeStyle = col;
            ctx.stroke();
          }
        } else if (sh.type === "sun") {
          const r = size;
          ctx.beginPath();
          ctx.arc(0, 0, r, 0, Math.PI * 2);
          ctx.fillStyle = col;
          ctx.fill();
          if (pass === "top") {
            ctx.lineWidth = 7;
            ctx.strokeStyle = "#000";
            ctx.stroke();
            // Retro slices, clipped to the disc, widening downward.
            ctx.save();
            ctx.clip();
            ctx.fillStyle = "#000";
            for (let n = 0; n < 5; n++) {
              ctx.fillRect(-r, r * (0.08 + n * 0.19), r * 2, r * (0.045 + n * 0.03));
            }
            ctx.restore();
          }
        }
        ctx.restore();
      }

      function speckle(shape: ShapeItem, radius: number) {
        if (!ctx) return;
        ctx.save();
        ctx.clip();
        ctx.strokeStyle = "#000";
        ctx.lineWidth = 4;
        ctx.lineCap = "round";
        for (const d of shape.dashes) {
          if (Math.hypot(d.x, d.y) > radius) continue;
          ctx.beginPath();
          ctx.moveTo(d.x, d.y);
          ctx.lineTo(d.x + Math.cos(d.a) * 13, d.y + Math.sin(d.a) * 13);
          ctx.stroke();
        }
        ctx.restore();
      }
    }

    const tick = (now: number) => {
      if (!active) return;
      raf = requestAnimationFrame(tick);
      const w = worldRef.current;
      if (!w || canvas.width === 0) return;
      const t = now / 1000;

      const k = canvas.width / DW;
      ctx.setTransform(k, 0, 0, k, 0, 0);

      // Click shake — harder the lower the integrity.
      if (w.shakeT > 0 && !reduceMotion) {
        w.shakeT--;
        const amp = integrityRef.current < 40 ? 7 : 3;
        ctx.translate(rand(-amp, amp), rand(-amp, amp));
      }

      // Paper + faint grid.
      ctx.fillStyle = css({ h: 80, s: 20, l: 94 }, 0, w.safe, false);
      ctx.fillRect(-40, -40, DW + 80, DH + 80);
      ctx.strokeStyle = "rgba(0,0,0,0.05)";
      ctx.lineWidth = 2;
      for (let x = 100; x < DW; x += 100) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, DH);
        ctx.stroke();
      }
      for (let y = 100; y < DH; y += 100) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(DW, y);
        ctx.stroke();
      }

      // Death physics: everything tumbles off-canvas.
      if (w.dead) {
        const g = 0.7;
        for (const it of [...w.shapes, ...w.texts, w.logo]) {
          const d = it.dyn;
          if (!d) continue;
          d.vy += g;
          it.x += d.vx;
          it.y += d.vy;
          if ("rot" in it) it.rot += d.vr;
        }
      }

      w.shapes.forEach((sh, i) => drawShape(w, sh, t, i));

      // Texts.
      w.texts.forEach((item, i) => {
        const str = w.safe >= 2 && item.safeT ? item.safeT : item.t;
        const size = item.size * (1 - Math.min(0.25, w.safe * 0.06));
        ctx.save();
        ctx.translate(item.x, item.y);
        const wob = w.fontLv > 0 ? Math.sin(i * 9 + w.fontLv * 2) * 0.04 * Math.min(w.fontLv, 3) : 0;
        ctx.rotate(wob);
        ctx.font = `${item.display ? "" : "600 "}${size}px ${textFont(w, i, item)}`;
        ctx.textBaseline = "alphabetic";
        // Sticker treatment on the two display words, plain ink otherwise.
        if (item.display) {
          ctx.fillStyle = "#000";
          ctx.fillText(str, 6, 6);
          ctx.fillStyle = css({ h: 0, s: 0, l: 100 }, 0, 0, false);
          ctx.fillText(str, 0, 0);
          ctx.lineWidth = 3;
          ctx.strokeStyle = "#000";
          ctx.strokeText(str, 0, 0);
        } else {
          ctx.fillStyle = css(P.ink, 0, w.safe, false);
          ctx.fillText(str, 0, 0);
        }
        ctx.restore();
      });

      // Logo — drawn LAST, always pure black. The logo is eternal.
      const lg = w.logo;
      lg.scale += (lg.scaleT - lg.scale) * 0.12;
      ctx.save();
      ctx.translate(lg.x, lg.y);
      const ls = lg.size * lg.scale;
      ctx.fillStyle = "#000";
      ctx.beginPath();
      if ("roundRect" in ctx) {
        ctx.roundRect(-ls / 2, -ls / 2, ls, ls, ls * 0.18);
      } else {
        // Older Safari: square corners beat a crash.
        (ctx as CanvasRenderingContext2D).rect(-ls / 2, -ls / 2, ls, ls);
      }
      ctx.fill();
      ctx.fillStyle = css(P.yellow, 0, 0, false);
      ctx.font = `${ls * 0.52}px ${displayFont}`;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText("VF", 0, ls * 0.03);
      ctx.restore();

      // Confetti.
      if (w.particles.length) {
        w.particles = w.particles.filter((p) => p.life > 0 && p.y < DH + 100);
        for (const p of w.particles) {
          p.vy += 0.35;
          p.x += p.vx;
          p.y += p.vy;
          p.rot += p.vr;
          p.life--;
          ctx.save();
          ctx.translate(p.x, p.y);
          ctx.rotate(p.rot);
          ctx.fillStyle = p.color;
          ctx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size * 0.55);
          ctx.restore();
        }
      }
    };

    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
      io.disconnect();
      if (deathTimer.current) clearTimeout(deathTimer.current);
    };
  }, []);

  // ── Interactions ────────────────────────────────────────────────────
  const applyAction = (key: ActionKey) => {
    const w = worldRef.current;
    if (!w || w.dead) return;
    const cfg = ACTIONS[key];

    if (key === "logo") w.logo.scaleT = Math.min(w.logo.scaleT * 1.5, 34);
    if (key === "pop") {
      w.pop++;
      const colors = [P.green, P.pink, P.yellow, P.orange, P.blue];
      for (let i = 0; i < 90; i++) {
        w.particles.push({
          x: rand(150, DW - 150),
          y: rand(120, DH * 0.6),
          vx: rand(-5, 5),
          vy: rand(-9, -2),
          rot: rand(0, Math.PI),
          vr: rand(-0.2, 0.2),
          life: rand(50, 110),
          size: rand(10, 26),
          color: css(colors[i % colors.length], w.pop, 0, true),
        });
      }
    }
    if (key === "font") w.fontLv++;
    if (key === "safe") w.safe++;
    w.shakeT = 10;

    const nextCount = counts[key] + 1;
    setCounts((c) => ({ ...c, [key]: c[key] + 1 }));
    setNote((n) => ({
      n: n.n + 1,
      text: cfg.quips[Math.min(nextCount - 1, cfg.quips.length - 1)],
    }));

    const before = integrityRef.current;
    const next = Math.max(0, before - cfg.cost - Math.floor(rand(0, 4)));
    integrityRef.current = next;
    setIntegrity(next);

    if (before > 0 && next === 0) {
      w.dead = true;
      for (const it of [...w.shapes, ...w.texts, w.logo]) {
        it.dyn = { vx: rand(-4, 4), vy: rand(-16, -6), vr: rand(-0.18, 0.18) };
      }
      setNote((n) => ({ n: n.n + 1, text: "…you hear that? That's the sound of a designer sighing." }));
      deathTimer.current = setTimeout(() => setDead(true), 1300);
    }
  };

  const reset = () => {
    worldRef.current = initWorld();
    integrityRef.current = 100;
    setIntegrity(100);
    setCounts({ logo: 0, pop: 0, font: 0, safe: 0 });
    setNote((n) => ({ n: n.n + 1, text: DEFAULT_NOTE }));
    setDead(false);
  };

  // "Please don't touch" tooltip follows the cursor over the artwork.
  const onCanvasMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const tip = tipRef.current;
    const frame = frameRef.current;
    if (!tip || !frame) return;
    const rect = frame.getBoundingClientRect();
    tip.style.opacity = "1";
    tip.style.transform = `translate(${e.clientX - rect.left + 16}px, ${e.clientY - rect.top + 14}px)`;
  };
  const onCanvasLeave = () => {
    if (tipRef.current) tipRef.current.style.opacity = "0";
  };

  const totalClicks = counts.logo + counts.pop + counts.font + counts.safe;
  const mood =
    integrity > 80
      ? "PRISTINE"
      : integrity > 60
      ? "MILDLY CONCERNED"
      : integrity > 40
      ? "SWEATING"
      : integrity > 20
      ? "CRYING IN FIGMA"
      : integrity > 0
      ? "BEYOND SAVING"
      : "DECEASED";
  const meterColor =
    integrity > 60
      ? "var(--color-green)"
      : integrity > 35
      ? "var(--color-yellow)"
      : integrity > 15
      ? "var(--color-orange)"
      : "var(--color-pink)";

  return (
    <section ref={sectionRef} className="vf-bleed relative overflow-hidden bg-blue py-32 text-ink">
      <style>{`
        @keyframes csNote {
          from { transform: translateY(8px); opacity: 0; }
          to { transform: translateY(0); opacity: 1; }
        }
      `}</style>

      <div className="vf-grid pointer-events-none absolute inset-0 opacity-60" />

      <div className="relative z-10 mx-auto grid max-w-7xl gap-14 px-10 lg:grid-cols-2">
        {/* ── Copy ── */}
        <div>
          <span className="vf-pill vf-pill--pink text-xs!">Interactive · Exhibit A</span>

          <h2
            ref={headingRef}
            className="font-display mt-8 text-[clamp(3rem,6.5vw,6rem)] uppercase leading-[0.85] tracking-tight vf-text-hard"
          >
            Destroy
            <br />
            this design.
          </h2>

          <p className="mt-8 max-w-md text-lg leading-relaxed text-ink">
            That poster over there? We like it. Your job: give feedback until it
            stops existing. Every button below is something a real client has
            actually said to us.
          </p>
          <p className="mt-4 max-w-md text-sm text-ink/70">
            Fastest destruction so far: 6 clicks. A record we&apos;re not proud of.
          </p>
        </div>

        {/* ── The artwork ── */}
        <div className="lg:col-start-2 lg:row-span-2 lg:row-start-1">
          <div
            ref={frameRef}
            className="vf-hard-lg relative overflow-hidden rounded-xl border-2 border-outline bg-beige"
          >
            {/* Fake window chrome */}
            <div className="flex items-center gap-2 border-b-2 border-outline bg-pistachio px-4 py-2.5">
              <span className="h-3 w-3 rounded-full border-2 border-outline bg-pink" />
              <span className="h-3 w-3 rounded-full border-2 border-outline bg-yellow" />
              <span className="h-3 w-3 rounded-full border-2 border-outline bg-green" />
              <span className="ml-2 truncate font-mono text-xs text-ink/70">
                masterpiece_FINAL_v37 (1).fig
              </span>
            </div>

            <div
              className="relative aspect-[4/5] cursor-not-allowed"
              onMouseMove={onCanvasMove}
              onMouseLeave={onCanvasLeave}
            >
              <canvas
                ref={canvasRef}
                className="absolute inset-0 h-full w-full"
                aria-label="A poster being progressively ruined by your client feedback"
              />

              <div
                ref={tipRef}
                className="pointer-events-none absolute left-0 top-0 z-10 whitespace-nowrap rounded border-2 border-outline bg-beige px-2 py-1 font-mono text-[10px] opacity-0 transition-opacity duration-150"
              >
                please don&apos;t touch the artwork
              </div>

              {/* Death screen */}
              {dead && (
                <div className="absolute inset-0 z-20 flex flex-col items-center justify-center gap-5 bg-ink/95 p-8 text-center">
                  <h3 className="font-display text-5xl uppercase tracking-tight vf-text-hard">
                    You killed it.
                  </h3>
                  <p className="font-mono text-xs uppercase tracking-widest text-beige/60">
                    {totalClicks} rounds of feedback · logo ×{counts.logo} · pop ×{counts.pop} ·
                    fonts +{counts.font} · safe ×{counts.safe}
                  </p>
                  <p className="max-w-sm text-lg leading-relaxed text-beige">
                    This is what &ldquo;just a few tweaks&rdquo; does.
                    <br />
                    Now imagine six months of it.
                  </p>
                  <div className="mt-2 flex flex-wrap items-center justify-center gap-4">
                    <a href="#contact" className="vf-pill vf-pill--green">
                      Hire professionals
                    </a>
                    <button type="button" onClick={reset} className="vf-pill">
                      Resurrect it
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* ── Controls ── */}
        <div className="lg:col-start-1 lg:row-start-2">
          <div className="grid grid-cols-2 gap-4">
            {(Object.keys(ACTIONS) as ActionKey[]).map((key, i) => (
              <button
                key={key}
                type="button"
                disabled={integrity === 0}
                onClick={() => applyAction(key)}
                className={`vf-pill justify-center text-xs! disabled:cursor-not-allowed disabled:opacity-50 ${
                  ["vf-pill--pink", "", "vf-pill--orange", "vf-pill--green"][i]
                }`}
              >
                {ACTIONS[key].label}
                {counts[key] > 0 && ` ×${counts[key]}`}
              </button>
            ))}
          </div>

          {/* Integrity meter */}
          <div className="mt-8">
            <div className="flex items-baseline justify-between font-mono text-xs uppercase tracking-widest">
              <span>Design integrity</span>
              <span>
                {integrity}% — {mood}
              </span>
            </div>
            <div className="vf-hard mt-2 rounded-lg border-2 border-outline bg-beige p-1">
              <div
                className="h-5 rounded transition-all duration-500"
                style={{ width: `${Math.max(integrity, 2)}%`, background: meterColor }}
                role="meter"
                aria-valuenow={integrity}
                aria-valuemin={0}
                aria-valuemax={100}
                aria-label="Design integrity"
              />
            </div>
          </div>

          {/* Studio notes */}
          <div className="mt-6 min-h-14" role="status" aria-live="polite">
            <p className="font-mono text-[10px] uppercase tracking-[0.3em] text-ink/60">
              Studio notes
            </p>
            <p
              key={note.n}
              className="mt-1 text-base font-semibold"
              style={{ animation: "csNote 0.35s cubic-bezier(0.16,1,0.3,1)" }}
            >
              {note.text}
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
