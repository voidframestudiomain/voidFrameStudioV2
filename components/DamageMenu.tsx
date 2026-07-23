"use client";

import { useState } from "react";
import { Arc, Bolt, Dot, Triangle, Zigzag, type Hue } from "./Memphis";

/**
 * WHAT'S THE DAMAGE? — the services menu as a point-of-sale gag
 * ---------------------------------------------------------------------
 * A diner-style menu of services on the left; every "ADD" prints a line
 * onto a thermal receipt on the right — mono type, dashed rules, fake
 * barcode, sawtooth tear-off edge, the works. The economics are
 * sarcastic but internally consistent:
 *
 *   - ordering the same service again triggers SURGE PRICING
 *     (each extra unit costs +40% more — "you kept asking")
 *   - a tip row offers 0% / 15% / 420%
 *   - tax is vibes (included)
 *   - totals get judged, then converted into oat-milk lattes
 *   - ≥$25k earns a rubber stamp: FISCALLY UNHINGED
 *   - ATTEMPT TO PAY gets declined, then becomes the real contact CTA
 *
 * No effects, no refs-into-effects — the whole thing is derived state,
 * which keeps the react-compiler lint rules trivially happy.
 * --------------------------------------------------------------------- */

const rand = (a: number, b: number) => a + Math.random() * (b - a);

/* Thermal receipt stock. Warmer and lighter than --color-beige on purpose:
   it has to read as a fresh till roll sitting ON the manila page, so it
   can't be the same value as the paper behind it. */
const PAPER = "#fefaee";
const QTY_CAP = 3;

interface Service {
  id: string;
  name: string;
  short: string; // receipt-width name
  tag: string;
  price: number;
  was: number; // the devastating fake discount
  icon: React.ComponentType<{ id?: string; hue?: Hue; size?: number; shadow?: number }>;
  hue: Hue;
  // Receipt sub-note per quantity (index = qty-1).
  subs: [string, string, string];
}

const SERVICES: Service[] = [
  {
    id: "web",
    name: "Web Development",
    short: "WEB DEV",
    tag: "Pixels arranged emotionally. Dark mode included, therapy not.",
    price: 8999,
    was: 9004,
    icon: Dot,
    hue: "blue",
    subs: [
      "pixels, emotionally arranged",
      "round two: now with 30% more divs",
      "a third site is a cry for help",
    ],
  },
  {
    id: "cd",
    name: "Creative Direction",
    short: "CREATIVE DIR.",
    tag: "We say no to your ideas. Artistically.",
    price: 12000,
    was: 12001,
    icon: Triangle,
    hue: "green",
    subs: [
      "taste — imported, small-batch",
      "double direction, twice the no",
      "at this point we ARE your brand",
    ],
  },
  {
    id: "smm",
    name: "Social Media Marketing",
    short: "SOCIAL MEDIA",
    tag: "We argue with strangers so you don't have to.",
    price: 3499,
    was: 3500,
    icon: Arc,
    hue: "orange",
    subs: [
      "includes 3 spicy replies / mo",
      "now arguing in two timezones",
      "terminally online (for you)",
    ],
  },
  {
    id: "seo",
    name: "SEO",
    short: "S.E.O.",
    tag: "Sweet nothings, whispered directly to Google.",
    price: 5000,
    was: 5003,
    icon: Bolt,
    hue: "yellow",
    subs: [
      "results in 6–8 business eternities",
      "google now knows you exist",
      "page one or we riot",
    ],
  },
  {
    id: "meta",
    name: "Meta Ads",
    short: "META ADS",
    tag: "Zuckerberg gets his cut either way.",
    price: 2999,
    was: 2999.99,
    icon: Zigzag,
    hue: "green",
    subs: [
      "ad spend sold separately (obviously)",
      "retargeting your ex-customers",
      "the algorithm knows. it always knew",
    ],
  },
];

// Surge pricing: unit k (0-based) costs base × (1 + 0.4k). Ordering more
// makes each one MORE expensive. Like ride-sharing, but for taste.
function lineTotal(base: number, qty: number): number {
  let sum = 0;
  for (let k = 0; k < qty; k++) sum += base * (1 + 0.4 * k);
  return Math.round(sum);
}

const fmt = (n: number) => `$${Math.round(n).toLocaleString("en-US")}`;

function totalLabel(total: number): string {
  if (total === 0) return "TOTAL";
  if (total < 10000) return "TOTAL (FINE)";
  if (total < 25000) return "TOTAL (OUCH)";
  if (total < 50000) return "TOTAL (SIT DOWN)";
  return "TOTAL (CALL YOUR CFO)";
}

function conversion(total: number): string {
  if (total === 0) return "≈ 0 regrets. for now.";
  if (total < 10000) return `≈ ${Math.round(total / 6).toLocaleString("en-US")} oat-milk lattes`;
  if (total < 25000)
    return `≈ ${Math.round(total / 700).toLocaleString("en-US")} standing desks you won't stand at`;
  if (total < 50000)
    return `≈ ${Math.round(total / 1200).toLocaleString("en-US")} conference tickets (networking!)`;
  return `≈ ${(total / 2100000).toFixed(3)} yachts (the small kind)`;
}

// Deterministic fake barcode widths — module constant, so render stays pure.
const BARCODE = [3, 1, 2, 1, 4, 1, 1, 2, 3, 1, 2, 4, 1, 1, 3, 2, 1, 1, 2, 1, 3, 1, 4, 2, 1, 3, 1, 2, 1, 1, 4, 1, 2, 3, 1, 2];

const IDLE_QUIP = "tap things. the register never lies. (it lies a little)";

interface CartLine {
  id: string;
  qty: number;
}

export default function DamageMenu() {
  const [cart, setCart] = useState<CartLine[]>([]);
  const [adds, setAdds] = useState(0); // lifetime adds → order number
  const [tipPct, setTipPct] = useState(0);
  const [tilt, setTilt] = useState(0);
  const [quip, setQuip] = useState({ n: 0, text: IDLE_QUIP });
  const [payStage, setPayStage] = useState<"idle" | "declined" | "quote">("idle");

  const say = (text: string) => setQuip((q) => ({ n: q.n + 1, text }));

  const add = (id: string) => {
    const existing = cart.find((l) => l.id === id);
    if (existing && existing.qty >= QTY_CAP) {
      say("four?? we legally can't. it's in the geneva convention.");
      setTilt(rand(-1.6, 1.6));
      return;
    }
    setCart((c) =>
      c.some((l) => l.id === id)
        ? c.map((l) => (l.id === id ? { ...l, qty: l.qty + 1 } : l))
        : [...c, { id, qty: 1 }]
    );
    setAdds((a) => a + 1);
    setTilt(rand(-1.4, 1.4));
    if (existing) say("same thing again? surge pricing says thank you.");
    else say("printing… try to look calm.");
  };

  const remove = (id: string) => {
    setCart((c) => c.filter((l) => l.id !== id));
    setTilt(rand(-1.2, 1.2));
    say("refunded. pretend it never happened.");
  };

  const subtotal = cart.reduce((sum, l) => {
    const s = SERVICES.find((sv) => sv.id === l.id);
    return s ? sum + lineTotal(s.price, l.qty) : sum;
  }, 0);
  const tip = Math.round((subtotal * tipPct) / 100);
  const total = subtotal + tip;
  const orderNo = String(7 + adds).padStart(4, "0");

  const attemptPay = () => {
    if (total === 0) {
      say("pay for WHAT exactly?");
      setTilt(rand(-1.6, 1.6));
      return;
    }
    setPayStage("declined");
    setTilt(rand(-2, 2));
    say("card declined. both of them. impressive.");
    setTimeout(() => setPayStage("quote"), 1400);
  };

  return (
    <section className="vf-bleed relative overflow-hidden bg-pink py-32 text-ink">
      <style>{`
        @keyframes dmgLine {
          from { transform: translateY(-7px); opacity: 0; }
          to { transform: translateY(0); opacity: 1; }
        }
        @keyframes dmgStamp {
          0% { transform: rotate(-14deg) scale(2.4); opacity: 0; }
          60% { transform: rotate(-14deg) scale(0.94); opacity: 1; }
          100% { transform: rotate(-14deg) scale(1); opacity: 1; }
        }
        @keyframes dmgShake {
          0%, 100% { transform: translateX(0); }
          20% { transform: translateX(-7px); }
          40% { transform: translateX(6px); }
          60% { transform: translateX(-4px); }
          80% { transform: translateX(3px); }
        }
      `}</style>

      {/* The reference's signature pink-grid backdrop. */}
      <div className="vf-grid pointer-events-none absolute inset-0" />

      <div className="relative z-10 mx-auto max-w-7xl px-10">
        {/* ── Heading ── */}
        <div className="max-w-2xl">
          <span className="vf-pill text-xs!">Menu · No substitutions</span>
          <h2 className="font-display mt-8 text-[clamp(3rem,7vw,6.5rem)] uppercase leading-[0.85] tracking-tight vf-text-hard">
            What&apos;s the
            <br />
            damage?
          </h2>
          <p className="mt-8 max-w-xl text-lg leading-relaxed">
            Tap what you need. The register prints what it costs. All prices
            are 100% real numbers we made up with complete confidence.
          </p>
          <p className="mt-3 text-sm text-ink/60">
            Prices in USD. Payment also accepted in exposure (it is not).
          </p>
        </div>

        <div className="mt-14 grid items-start gap-12 lg:grid-cols-[minmax(0,1fr)_400px]">
          {/* ── The menu ── */}
          <div className="vf-hard-lg rounded-xl border-2 border-outline bg-beige">
            <div className="border-b-2 border-outline px-6 py-4 text-center font-mono text-xs uppercase tracking-[0.3em]">
              ≡ menu ≡ est. 2026 · no substitutions · no mercy
            </div>

            <ul>
              {SERVICES.map((s, i) => {
                const line = cart.find((l) => l.id === s.id);
                const Icon = s.icon;
                return (
                  <li
                    key={s.id}
                    className={`flex items-center gap-5 px-6 py-5 ${
                      i < SERVICES.length - 1 ? "border-b-2 border-dashed border-outline/25" : ""
                    }`}
                  >
                    <div className="hidden shrink-0 sm:block">
                      <Icon id={`dm-${s.id}`} hue={s.hue} size={46} shadow={3} />
                    </div>

                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
                        <h3 className="font-display text-xl uppercase tracking-tight">{s.name}</h3>
                        {line && (
                          <span className="rounded border-2 border-outline bg-green px-1.5 font-mono text-[10px] font-bold text-beige">
                            ×{line.qty} IN CART
                          </span>
                        )}
                      </div>
                      <p className="mt-1 text-sm text-ink/70">{s.tag}</p>
                    </div>

                    {/* Dotted leader, like a real menu */}
                    <div className="mx-1 hidden h-0 flex-1 border-b-2 border-dotted border-outline/40 md:block" />

                    <div className="shrink-0 text-right">
                      <p className="font-mono text-lg font-bold">{fmt(s.price)}</p>
                      <p className="font-mono text-[10px] text-ink/50">
                        <s>{fmt(s.was)}</s> SALE
                      </p>
                    </div>

                    <button
                      type="button"
                      onClick={() => add(s.id)}
                      className="vf-pill shrink-0 text-xs!"
                      aria-label={`Add ${s.name}`}
                    >
                      Add+
                    </button>
                  </li>
                );
              })}
            </ul>

            <div className="border-t-2 border-outline px-6 py-3 text-center font-mono text-[10px] uppercase tracking-widest text-ink/50">
              consumption of this menu implies budget. bon appétit.
            </div>
          </div>

          {/* ── The register ── */}
          <div className="lg:sticky lg:top-24">
            {/* Printer */}
            <div className="vf-hard relative z-10 rounded-xl border-2 border-outline bg-ink px-5 py-3">
              <div className="flex items-center justify-between">
                <span className="font-mono text-[10px] uppercase tracking-widest text-beige/70">
                  voidframe POS v0.1 — &ldquo;the money printer&rdquo;
                </span>
                <span className="h-2 w-2 animate-pulse rounded-full bg-green" />
              </div>
              {/* Paper slot */}
              <div className="mt-2 h-1.5 rounded-full bg-black" />
            </div>

            {/* Receipt paper */}
            <div
              className="relative mx-auto w-[92%]"
              style={{
                transform: `rotate(${tilt}deg)`,
                transition: "transform 0.35s cubic-bezier(0.34, 1.56, 0.64, 1)",
                animation: payStage === "declined" ? "dmgShake 0.45s ease-in-out" : undefined,
              }}
            >
              <div
                className="border-x-2 border-outline px-5 pb-6 pt-5 font-mono text-xs leading-relaxed text-ink shadow-[8px_8px_0_0_rgba(0,0,0,0.35)]"
                style={{ background: PAPER }}
              >
                {/* Stamp for irresponsible totals */}
                {total >= 25000 && (
                  <div
                    className="font-display pointer-events-none absolute left-1/2 top-1/3 z-10 -translate-x-1/2 border-4 border-orange px-3 py-1 text-2xl uppercase tracking-wide text-orange"
                    style={{ animation: "dmgStamp 0.4s cubic-bezier(0.16,1,0.3,1) both" }}
                  >
                    Fiscally unhinged
                  </div>
                )}

                <p className="font-display text-center text-2xl uppercase tracking-tight">
                  Voidframe
                </p>
                <p className="text-center text-[10px] text-ink/60">
                  &ldquo;we make it pop (correctly)&rdquo;
                </p>
                <p className="mt-2 text-center text-[10px] uppercase">
                  order #{orderNo} · date: today, unfortunately
                </p>
                <p className="text-center text-[10px] uppercase text-ink/60">
                  cashier: the intern (unpaid)
                </p>

                <div className="my-3 border-t-2 border-dashed border-ink/30" />

                {/* Lines */}
                {cart.length === 0 ? (
                  <div className="py-4 text-center text-ink/50">
                    <p>NO ITEMS YET</p>
                    <p className="mt-1 text-[10px]">your restraint has been noted</p>
                    <p className="mt-2">{"¯\\_(ツ)_/¯"}</p>
                  </div>
                ) : (
                  cart.map((l) => {
                    const s = SERVICES.find((sv) => sv.id === l.id);
                    if (!s) return null;
                    return (
                      <div
                        key={`${l.id}-${l.qty}`}
                        className="group py-1"
                        style={{ animation: "dmgLine 0.3s cubic-bezier(0.16,1,0.3,1) both" }}
                      >
                        <div className="flex items-baseline justify-between gap-2">
                          <span className="uppercase">
                            {s.short}
                            {l.qty > 1 && ` ×${l.qty}`}
                          </span>
                          <span className="mx-1 flex-1 border-b border-dotted border-ink/30" />
                          <span className="font-bold">{fmt(lineTotal(s.price, l.qty))}</span>
                          <button
                            type="button"
                            onClick={() => remove(l.id)}
                            aria-label={`Remove ${s.name}`}
                            className="ml-1 border border-ink/30 px-1 text-[10px] leading-tight text-ink/50 hover:border-outline hover:bg-ink hover:text-beige"
                          >
                            ✕
                          </button>
                        </div>
                        <p className="text-[10px] text-ink/50">↳ {s.subs[l.qty - 1]}</p>
                        {l.qty > 1 && (
                          <p className="text-[10px] text-orange">
                            ↳ surge pricing: you kept asking
                          </p>
                        )}
                      </div>
                    );
                  })
                )}

                <div className="my-3 border-t-2 border-dashed border-ink/30" />

                {/* Totals */}
                <div className="flex justify-between">
                  <span>SUBTOTAL</span>
                  <span className="font-bold">{fmt(subtotal)}</span>
                </div>
                <div className="flex justify-between text-ink/60">
                  <span>LOYALTY DISCOUNT</span>
                  <span>-$0.00</span>
                </div>
                <p className="text-[10px] text-ink/50">↳ (you&apos;re new here)</p>
                <div className="flex justify-between text-ink/60">
                  <span>VIBES TAX</span>
                  <span>included</span>
                </div>

                {/* Tip */}
                <div className="mt-2 flex items-center justify-between gap-2">
                  <span>TIP THE DESIGNER</span>
                  <span className="flex gap-1">
                    {[0, 15, 420].map((p) => (
                      <button
                        key={p}
                        type="button"
                        onClick={() => {
                          setTipPct(p);
                          setTilt(rand(-1, 1));
                          if (p === 420) say("420%. you absolute legend.");
                        }}
                        className={`border px-1.5 text-[10px] leading-snug ${
                          tipPct === p
                            ? "border-outline bg-ink text-beige"
                            : "border-ink/30 text-ink/60 hover:border-outline"
                        }`}
                      >
                        {p}%
                      </button>
                    ))}
                  </span>
                </div>
                {tip > 0 && (
                  <div className="flex justify-between" style={{ animation: "dmgLine 0.3s both" }}>
                    <span>TIP {tipPct === 420 ? "(THERAPY FUND)" : "(OAT MILK FUND)"}</span>
                    <span className="font-bold">{fmt(tip)}</span>
                  </div>
                )}

                <div className="my-3 border-t-2 border-ink" />

                <div className="flex items-baseline justify-between text-sm" aria-live="polite">
                  <span className="font-bold">{totalLabel(total)}</span>
                  <span className="font-display text-2xl">{fmt(total)}</span>
                </div>
                <p className="text-right text-[10px] text-ink/60">{conversion(total)}</p>

                {/* Pay */}
                <div className="mt-4">
                  {payStage === "quote" ? (
                    <a href="#contact" className="vf-pill vf-pill--green w-full justify-center text-xs!">
                      Fine — get a real quote ↗
                    </a>
                  ) : (
                    <button
                      type="button"
                      onClick={attemptPay}
                      disabled={payStage === "declined"}
                      className="vf-pill w-full justify-center text-xs! disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      {payStage === "declined" ? "DECLINED (as expected)" : "Attempt to pay"}
                    </button>
                  )}
                </div>

                {/* Barcode */}
                <div className="mt-5 flex h-10 items-stretch justify-center gap-px" aria-hidden="true">
                  {BARCODE.map((wd, i) => (
                    <span key={i} className="bg-ink" style={{ width: wd }} />
                  ))}
                </div>
                <p className="mt-1 text-center text-[10px] tracking-[0.2em] text-ink/60">
                  *NOT-A-REAL-BARCODE*
                </p>

                <p className="mt-3 text-center text-[10px] uppercase leading-relaxed text-ink/60">
                  no refunds · only regrets
                  <br />
                  thank you for pretending to have budget
                </p>
              </div>

              {/* Sawtooth tear-off edge */}
              <div
                className="h-4 w-full"
                style={{
                  background: `linear-gradient(-45deg, transparent 11px, ${PAPER} 0) 0 0 / 16px 16px repeat-x, linear-gradient(45deg, transparent 11px, ${PAPER} 0) 0 0 / 16px 16px repeat-x`,
                }}
              />
            </div>

            {/* Register quips */}
            <p
              key={quip.n}
              role="status"
              aria-live="polite"
              className="mt-5 min-h-6 text-center font-mono text-xs font-semibold text-ink"
              style={{ animation: "dmgLine 0.35s cubic-bezier(0.16,1,0.3,1)" }}
            >
              {quip.text}
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
