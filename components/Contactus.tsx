"use client";

import { useRef, useState } from "react";
import { Arc, Bolt, Dot } from "./Memphis";

/**
 * SPEAK INTO THE VOID — the contact form as official paperwork
 * ---------------------------------------------------------------------
 * FORM VF-01 "PROJECT SUMMONS": the letter IS the form. Real inputs
 * (name, company, email) sit inline in the sentence; the rest of the
 * blanks are highlighted mad-lib chips you click to cycle through
 * increasingly honest options. Extras:
 *
 *   - a signature pad you actually draw on (canvas, pointer events)
 *   - a CREDIBILITY meter that judges your answers in real time
 *     ("exposure + vibes" as budget does not score well)
 *   - a void console on the side that mutters about everything you do
 *   - FILE THE SUMMONS slams a RECEIVED BY THE VOID stamp on the paper,
 *     then opens a real mailto with the whole brief pre-written
 *
 * Like DamageMenu, everything is derived state + a couple of timeouts —
 * no effects, no refs-into-effects, react-compiler stays happy. The
 * only imperative code is the signature canvas, which draws inside
 * pointer handlers (allowed: it never touches render state).
 * --------------------------------------------------------------------- */

const rand = (a: number, b: number) => a + Math.random() * (b - a);

/* Paper stock for the form. Slightly whiter than --color-beige so the
   document reads as a fresh sheet lying ON the manila section, same
   trick as DamageMenu's till roll. */
const PAPER = "#fffdf2";

// Signature pad's internal drawing resolution (CSS size is fluid).
const SIG_W = 600;
const SIG_H = 140;

/* ── The blanks ───────────────────────────────────────────────────────
   Each option carries a credibility score 0–20. The meter averages
   them, so picking "a miracle" on a "yesterday" deadline with an
   "exposure" budget files you straight into PURE FICTION territory. */
interface Blank {
  hue: string; // tailwind classes for the chip
  aria: string;
  options: { text: string; cred: number }[];
  quips: string[]; // console reaction, cycled per click
}

const BLANKS = {
  need: {
    hue: "bg-yellow",
    aria: "What you need",
    options: [
      { text: "a website", cred: 18 },
      { text: "a full rebrand", cred: 16 },
      { text: "a logo (bigger)", cred: 8 },
      { text: "an ad campaign", cred: 15 },
      { text: "literally everything", cred: 6 },
      { text: "a miracle", cred: 2 },
    ],
    quips: [
      "a website. classic. respectable.",
      "full rebrand — the void loves a clean slate.",
      "bigger logo. the void has seen things.",
      "ads. zuckerberg stirs in his sleep.",
      "everything?? okay big spender.",
      "miracles are extra. obviously.",
    ],
  },
  reaction: {
    hue: "bg-pink",
    aria: "Desired audience reaction",
    options: [
      { text: "gasp audibly", cred: 14 },
      { text: "take us seriously", cred: 18 },
      { text: "stop laughing at us", cred: 10 },
      { text: "cry (good tears)", cred: 12 },
      { text: "throw money", cred: 16 },
      { text: "fear us, respectfully", cred: 8 },
    ],
    quips: [
      "audible gasps. measurable. we like it.",
      "seriousness: our second-best product.",
      "who's laughing? point them out.",
      "good tears cost the same as bad ones.",
      "money-throwing is a valid KPI.",
      "respectful fear. the premium package.",
    ],
  },
  deadline: {
    hue: "bg-orange",
    aria: "Deadline",
    options: [
      { text: "yesterday", cred: 2 },
      { text: "two weeks ago", cred: 1 },
      { text: "ASAP (aggressively)", cred: 6 },
      { text: "this quarter", cred: 18 },
      { text: "whenever (a lie)", cred: 8 },
      { text: "before my investor call", cred: 12 },
    ],
    quips: [
      "yesterday. so, time travel. noted.",
      "TWO weeks ago? the void respects the audacity.",
      "aggressive ASAP — the client classic.",
      "this quarter. an actual timeline?? marry us.",
      "'whenever'. we both know that's false.",
      "investor call. say less. we've all been there.",
    ],
  },
  budget: {
    hue: "bg-green text-beige",
    aria: "Budget",
    options: [
      { text: "exposure + vibes", cred: 0 },
      { text: "$50 and a handshake", cred: 1 },
      { text: "four figures (barely)", cred: 8 },
      { text: "five figures (confident)", cred: 16 },
      { text: "six figures (hello)", cred: 20 },
      { text: "whatever the receipt said", cred: 12 },
    ],
    quips: [
      "exposure? the void is already invisible.",
      "$50 and a handshake. framed, not cashed.",
      "four figures, barely. honesty appreciated.",
      "five confident figures. the void perks up.",
      "six figures. everyone act natural.",
      "ah, you met our register. condolences.",
    ],
  },
  builtBy: {
    hue: "bg-blue text-beige",
    aria: "Who built your current site",
    options: [
      { text: "my nephew", cred: 6 },
      { text: "me, in 2011", cred: 8 },
      { text: "a guy on Fiverr", cred: 7 },
      { text: "GeoCities (still live)", cred: 3 },
      { text: "an AI I don't trust", cred: 10 },
      { text: "no one. there is no site", cred: 14 },
    ],
    quips: [
      "the nephew industrial complex strikes again.",
      "2011. the drop shadows were... a choice.",
      "$5 well spent. sort of. not really.",
      "GeoCities?! is it... visitable? do we dare?",
      "the AI knows what it did.",
      "no site. a true blank canvas. delicious.",
    ],
  },
} satisfies Record<string, Blank>;

type BlankKey = keyof typeof BLANKS;
const BLANK_KEYS = Object.keys(BLANKS) as BlankKey[];

function credLabel(c: number): string {
  if (c >= 80) return "LEGALLY BINDING";
  if (c >= 60) return "PLAUSIBLE";
  if (c >= 40) return "SUSPICIOUS";
  if (c >= 20) return "A CRY FOR HELP";
  return "PURE FICTION";
}

const CHANNELS = [
  { label: "hello@voidframe.studio", href: "mailto:hello@voidframe.studio" },
  { label: "Instagram", href: "#" },
  { label: "Behance", href: "#" },
  { label: "LinkedIn", href: "#" },
];

const IDLE_LOG = "status: listening. it's what the void does.";
const MAX_LOG = 6;

const EMAIL_RE = /^\S+@\S+\.\S+$/;

export default function Contact() {
  const [sel, setSel] = useState<Record<BlankKey, number>>({
    need: 0,
    reaction: 0,
    deadline: 0,
    budget: 0,
    builtBy: 0,
  });
  const [name, setName] = useState("");
  const [company, setCompany] = useState("");
  const [email, setEmail] = useState("");
  const [signed, setSigned] = useState(false);
  const [log, setLog] = useState<{ n: number; lines: string[] }>({
    n: 0,
    lines: [IDLE_LOG],
  });
  const [stage, setStage] = useState<"idle" | "stamping" | "sent">("idle");
  const [tilt, setTilt] = useState(0);
  // Shake is a toggled animation, NOT a key-remount — remounting the
  // letter would wipe the signature canvas bitmap and any input focus.
  const [shaking, setShaking] = useState(false);

  // Signature pad internals — imperative canvas state, never rendered.
  const sigRef = useRef<HTMLCanvasElement>(null);
  const drawing = useRef(false);
  const lastPt = useRef({ x: 0, y: 0 });

  const say = (line: string) =>
    setLog((l) => ({ n: l.n + 1, lines: [...l.lines, `> ${line}`].slice(-MAX_LOG) }));

  const cycle = (key: BlankKey) => {
    const next = (sel[key] + 1) % BLANKS[key].options.length;
    setSel((s) => ({ ...s, [key]: next }));
    setTilt(rand(-0.9, 0.9));
    say(BLANKS[key].quips[next]);
  };

  // ── Credibility: average of chip scores (0–20 → %), plus paperwork
  //    bonuses for actually filling in the human parts. ──────────────
  const chipCred = BLANK_KEYS.reduce((s, k) => s + BLANKS[k].options[sel[k]].cred, 0);
  const cred = Math.min(
    100,
    Math.round((chipCred / (BLANK_KEYS.length * 20)) * 70) +
      (name.trim() ? 8 : 0) +
      (company.trim() ? 5 : 0) +
      (EMAIL_RE.test(email) ? 9 : 0) +
      (signed ? 8 : 0)
  );
  const meterColor =
    cred >= 60
      ? "var(--color-green)"
      : cred >= 40
      ? "var(--color-yellow)"
      : cred >= 20
      ? "var(--color-orange)"
      : "var(--color-pink)";

  // ── Signature pad ───────────────────────────────────────────────────
  const sigPoint = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    return {
      x: ((e.clientX - rect.left) / rect.width) * SIG_W,
      y: ((e.clientY - rect.top) / rect.height) * SIG_H,
    };
  };

  const sigDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    e.currentTarget.setPointerCapture(e.pointerId);
    drawing.current = true;
    lastPt.current = sigPoint(e);
    if (!signed) {
      setSigned(true);
      say("a signature. how binding. how brave.");
    }
  };

  const sigMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!drawing.current) return;
    const ctx = sigRef.current?.getContext("2d");
    if (!ctx) return;
    const p = sigPoint(e);
    ctx.strokeStyle = "#1b1e17";
    ctx.lineWidth = 3.2;
    ctx.lineCap = "round";
    ctx.beginPath();
    ctx.moveTo(lastPt.current.x, lastPt.current.y);
    ctx.lineTo(p.x, p.y);
    ctx.stroke();
    lastPt.current = p;
  };

  const sigUp = () => {
    drawing.current = false;
  };

  const sigClear = () => {
    sigRef.current?.getContext("2d")?.clearRect(0, 0, SIG_W, SIG_H);
    setSigned(false);
    say("signature voided. legally, nothing happened.");
  };

  // ── Filing ──────────────────────────────────────────────────────────
  const composeMailto = () => {
    const line = (k: BlankKey) => BLANKS[k].options[sel[k]].text;
    const body = [
      "FORM VF-01 — PROJECT SUMMONS",
      "",
      `Name: ${name.trim() || "(withheld, mysteriously)"}`,
      `Speaking for: ${company.trim() || "(a venture yet unnamed)"}`,
      `Requires: ${line("need")}`,
      `Desired audience reaction: ${line("reaction")}`,
      `Deadline: ${line("deadline")}`,
      `Budget: ${line("budget")}`,
      `Current site built by: ${line("builtBy")}`,
      `Signature: ${signed ? "drawn, legally dramatic" : "unsigned (coward)"}`,
      `Credibility at time of filing: ${cred}% — ${credLabel(cred)}`,
      "",
      "— filed via the void, voidframe.studio",
    ].join("\n");
    const subject = `PROJECT SUMMONS — ${name.trim() || "an anonymous visionary"}`;
    return `mailto:hello@voidframe.studio?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
  };

  const file = () => {
    if (stage !== "idle") return;
    if (!name.trim()) {
      say("anonymous summons are ignored. name, please.");
      setShaking(true);
      return;
    }
    if (!EMAIL_RE.test(email)) {
      say("that email won't survive the void. try a real one.");
      setShaking(true);
      return;
    }
    setStage("stamping");
    setTilt(rand(-1.6, 1.6));
    say("stamping… please hold still.");
    setTimeout(() => say("folding into a paper aeroplane…"), 700);
    setTimeout(() => {
      say("launched. the void has your paperwork.");
      setStage("sent");
      window.location.href = composeMailto();
    }, 1500);
  };

  const refile = () => {
    setStage("idle");
    say("fresh form. the void pretends it forgot you.");
  };

  return (
    <section id="contact" className="vf-bleed relative overflow-hidden bg-beige py-32 text-ink">
      <style>{`
        @keyframes vfcStamp {
          0% { transform: rotate(-12deg) scale(2.6); opacity: 0; }
          60% { transform: rotate(-12deg) scale(0.94); opacity: 1; }
          100% { transform: rotate(-12deg) scale(1); opacity: 1; }
        }
        @keyframes vfcShake {
          0%, 100% { transform: translateX(0); }
          20% { transform: translateX(-8px); }
          40% { transform: translateX(6px); }
          60% { transform: translateX(-4px); }
          80% { transform: translateX(3px); }
        }
        @keyframes vfcLine {
          from { transform: translateY(-6px); opacity: 0; }
          to { transform: translateY(0); opacity: 1; }
        }
      `}</style>

      {/* Watermark + floating family shapes */}
      <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
        <h1 className="font-display select-none text-[24vw] uppercase leading-none tracking-tighter text-ink/[0.04]">
          VOID
        </h1>
      </div>
      <Arc id="ct-arc" hue="pink" size={150} rotate={16} className="absolute -right-8 top-16 hidden lg:block" />
      <Bolt id="ct-bolt" hue="yellow" size={90} rotate={-14} className="absolute left-8 bottom-40 hidden lg:block" />
      <Dot id="ct-dot" hue="blue" size={64} className="absolute right-24 bottom-24 hidden xl:block" />

      <div className="relative z-10 mx-auto max-w-7xl px-10">
        {/* ── Heading ── */}
        <div className="max-w-2xl">
          <span className="vf-pill vf-pill--orange text-xs!">Final frame · Paperwork required</span>
          <h2 className="font-display mt-8 text-[clamp(3rem,8vw,7.5rem)] uppercase leading-[0.85] tracking-tight vf-text-hard">
            Speak into
            <br />
            the void.
          </h2>
          <p className="mt-8 max-w-xl text-lg leading-relaxed text-ink/80">
            No contact form. Just Form VF-01 — fill in the blanks, tap the
            highlighted parts until they tell the truth, sign it, and file.
          </p>
          <p className="mt-3 text-sm text-ink/60">
            The void responds within 1–2 business moods.
          </p>
        </div>

        <div className="mt-14 grid items-start gap-12 lg:grid-cols-[minmax(0,1fr)_360px]">
          {/* ── FORM VF-01 ─────────────────────────────────────────── */}
          <div
            onAnimationEnd={() => setShaking(false)}
            style={{
              transform: `rotate(${tilt * 0.4}deg)`,
              transition: "transform 0.35s cubic-bezier(0.34, 1.56, 0.64, 1)",
              animation: shaking ? "vfcShake 0.45s ease-in-out" : undefined,
            }}
          >
            <div
              className="vf-hard-lg relative rounded-xl border-2 border-outline"
              style={{ background: PAPER }}
            >
              {/* RECEIVED stamp */}
              {stage !== "idle" && (
                <div
                  className="font-display pointer-events-none absolute left-1/2 top-[38%] z-10 -translate-x-1/2 border-4 border-orange px-4 py-2 text-center text-3xl uppercase leading-none tracking-wide text-orange"
                  style={{ animation: "vfcStamp 0.4s cubic-bezier(0.16,1,0.3,1) both" }}
                >
                  Received
                  <br />
                  <span className="text-lg">by the void</span>
                </div>
              )}

              {/* Form header */}
              <div className="flex items-center justify-between border-b-2 border-outline px-6 py-3 font-mono text-[10px] uppercase tracking-[0.25em] text-ink/60">
                <span>Form VF-01 · Project summons</span>
                <span className="hidden sm:block">Rev. 2026 · in triplicate</span>
              </div>

              {/* The letter — inputs and chips live INSIDE the prose */}
              <div className="px-6 py-8 text-[1.05rem] leading-[2.35] sm:px-10 sm:text-lg sm:leading-[2.5]">
                <p className="font-mono text-[10px] uppercase tracking-[0.3em] text-ink/50">
                  To whoever is listening inside the void:
                </p>

                <p className="mt-6">
                  My name is{" "}
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="your name"
                    aria-label="Your name"
                    className="inline-block w-[11ch] border-b-2 border-dashed border-ink/40 bg-transparent px-1 text-center font-semibold outline-none placeholder:text-ink/30 focus:border-green"
                  />{" "}
                  and I speak for{" "}
                  <input
                    type="text"
                    value={company}
                    onChange={(e) => setCompany(e.target.value)}
                    placeholder="the brand"
                    aria-label="Your company or brand"
                    className="inline-block w-[12ch] border-b-2 border-dashed border-ink/40 bg-transparent px-1 text-center font-semibold outline-none placeholder:text-ink/30 focus:border-green"
                  />
                  . We require <MadChip k="need" sel={sel} onCycle={cycle} />, engineered so
                  that people <MadChip k="reaction" sel={sel} onCycle={cycle} />. The deadline
                  was, is, and remains <MadChip k="deadline" sel={sel} onCycle={cycle} />. The
                  budget is <MadChip k="budget" sel={sel} onCycle={cycle} />, every cent of
                  which is real. For context, our current site was built by{" "}
                  <MadChip k="builtBy" sel={sel} onCycle={cycle} /> — and it shows.
                </p>

                <p className="mt-6">
                  Reach me at{" "}
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@somewhere.real"
                    aria-label="Your email"
                    className="inline-block w-[19ch] border-b-2 border-dashed border-ink/40 bg-transparent px-1 text-center font-semibold outline-none placeholder:text-ink/30 focus:border-green"
                  />{" "}
                  before I change my mind.
                </p>

                {/* Signature block */}
                <div className="mt-10 grid gap-6 sm:grid-cols-[1fr_auto] sm:items-end">
                  <div>
                    <div className="flex items-baseline justify-between">
                      <p className="font-mono text-[10px] uppercase tracking-[0.3em] text-ink/50">
                        Sign here — under duress
                      </p>
                      <button
                        type="button"
                        onClick={sigClear}
                        className="font-mono text-[10px] uppercase tracking-widest text-ink/50 underline decoration-dashed underline-offset-4 hover:text-orange"
                      >
                        void signature
                      </button>
                    </div>
                    <canvas
                      ref={sigRef}
                      width={SIG_W}
                      height={SIG_H}
                      onPointerDown={sigDown}
                      onPointerMove={sigMove}
                      onPointerUp={sigUp}
                      onPointerLeave={sigUp}
                      aria-label="Signature pad — draw your signature"
                      className="mt-2 h-24 w-full cursor-crosshair touch-none rounded border-2 border-dashed border-ink/30 bg-white/40"
                    />
                    {!signed && (
                      <p className="mt-1 font-mono text-[10px] text-ink/40">
                        ↳ scribble something. cursive optional. dignity optional.
                      </p>
                    )}
                  </div>
                  <div className="pb-1 text-right font-mono text-[10px] uppercase leading-relaxed tracking-widest text-ink/50">
                    <p>date: today,</p>
                    <p>unfortunately</p>
                  </div>
                </div>
              </div>

              {/* Form footer: file it */}
              <div className="flex flex-wrap items-center justify-between gap-4 border-t-2 border-dashed border-outline/30 px-6 py-5 sm:px-10">
                <p className="font-mono text-[10px] uppercase tracking-widest text-ink/50">
                  filing fee: $0 · reading fee: your dignity
                </p>
                {stage === "sent" ? (
                  <button type="button" onClick={refile} className="vf-pill vf-pill--green text-xs!">
                    Filed ✓ — summon again
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={file}
                    disabled={stage === "stamping"}
                    className="vf-pill text-xs! disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {stage === "stamping" ? "Stamping…" : "File the summons ↗"}
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* ── Void console + channels ────────────────────────────── */}
          <div className="lg:sticky lg:top-24">
            {/* Credibility meter */}
            <div className="flex items-baseline justify-between font-mono text-xs uppercase tracking-widest">
              <span>Credibility</span>
              <span>
                {cred}% — {credLabel(cred)}
              </span>
            </div>
            <div className="vf-hard mt-2 rounded-lg border-2 border-outline bg-pistachio p-1">
              <div
                className="h-5 rounded transition-all duration-500"
                style={{ width: `${Math.max(cred, 2)}%`, background: meterColor }}
                role="meter"
                aria-valuenow={cred}
                aria-valuemin={0}
                aria-valuemax={100}
                aria-label="Inquiry credibility"
              />
            </div>
            <p className="mt-2 font-mono text-[10px] text-ink/50">
              ↳ the void reads everything. it judges most of it.
            </p>

            {/* Console */}
            <div className="vf-hard mt-8 rounded-xl border-2 border-outline bg-ink px-5 py-4">
              <div className="flex items-center justify-between border-b border-beige/15 pb-2">
                <span className="font-mono text-[10px] uppercase tracking-widest text-beige/60">
                  void console — live
                </span>
                <span className="h-2 w-2 animate-pulse rounded-full bg-green" />
              </div>
              <div
                role="status"
                aria-live="polite"
                className="mt-3 min-h-36 space-y-1.5 font-mono text-[11px] leading-relaxed text-beige/85"
              >
                {log.lines.map((line, i) => (
                  <p
                    key={`${log.n}-${i}`}
                    className={i === log.lines.length - 1 ? "text-yellow" : "text-beige/50"}
                    style={
                      i === log.lines.length - 1
                        ? { animation: "vfcLine 0.3s cubic-bezier(0.16,1,0.3,1)" }
                        : undefined
                    }
                  >
                    {line}
                  </p>
                ))}
              </div>
            </div>

            {/* Other summoning channels */}
            <div className="mt-8">
              <p className="font-mono text-[10px] uppercase tracking-[0.3em] text-ink/50">
                Lower-effort summons
              </p>
              <ul className="mt-3 space-y-2">
                {CHANNELS.map((c) => (
                  <li key={c.label}>
                    <a
                      href={c.href}
                      className="group inline-flex items-baseline gap-2 text-sm font-semibold uppercase tracking-widest transition-transform hover:translate-x-1"
                    >
                      {c.label}
                      <span className="text-ink/40 transition-colors group-hover:text-orange">↗</span>
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>

        {/* ── Footer ── */}
        <div className="mt-32 flex flex-col gap-4 border-t border-ink/15 pt-10 md:flex-row md:items-center md:justify-between">
          <p className="text-xs uppercase tracking-[0.3em] text-ink/50">© 2026 VOID FRAME</p>
          <p className="text-sm text-ink/50">
            Enough scrolling. File the paperwork.
          </p>
        </div>
      </div>
    </section>
  );
}

/* Inline mad-lib chip: click to cycle. Rendered as a highlighter mark
   over the sentence, slightly rotated so each one sits like tape. */
function MadChip({
  k,
  sel,
  onCycle,
}: {
  k: BlankKey;
  sel: Record<BlankKey, number>;
  onCycle: (k: BlankKey) => void;
}) {
  const blank = BLANKS[k];
  const i = sel[k];
  // Deterministic per-field tilt so chips don't all lean the same way.
  const lean = [-1.2, 0.8, -0.6, 1.1, -0.9][BLANK_KEYS.indexOf(k)];
  return (
    <button
      type="button"
      onClick={() => onCycle(k)}
      aria-label={`${blank.aria}: ${blank.options[i].text}. Click to change.`}
      className={`${blank.hue} vf-hard mx-0.5 inline-flex -translate-y-px items-baseline gap-1.5 whitespace-nowrap rounded border-2 border-outline px-2 py-0.5 align-baseline text-[0.85em] font-bold leading-snug transition-transform hover:translate-y-0.5 hover:shadow-[2px_2px_0_0_var(--color-outline)] active:translate-y-1 active:shadow-none`}
      style={{ transform: `rotate(${lean}deg)` }}
    >
      {blank.options[i].text}
      <span aria-hidden="true" className="text-[0.75em] opacity-60">
        ↻
      </span>
    </button>
  );
}
