"use client";

import { Arc, Bolt, Dot } from "./Memphis";

export default function FunFact() {
  return (
    <section className="vf-bleed relative flex min-h-screen items-center overflow-hidden bg-yellow text-ink">
      {/* Huge Background Text — needs a heavier tint than it did on the old
          off-white, since low-opacity ink disappears against the yellow. */}
      <h1 className="font-display pointer-events-none absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 select-none text-[28vw] uppercase tracking-tighter text-outline/[0.07]">
        WHY?
      </h1>

      {/* Shapes bleed off the right edge, clear of the copy column. */}
      <div className="pointer-events-none absolute right-0 top-0 h-full w-1/2">
        <Arc id="ff1" hue="pink" size={210} rotate={-160} className="absolute right-10 top-[12%]" />
        <Bolt id="ff2" hue="green" size={130} rotate={12} className="absolute right-[38%] top-[42%]" />
        <Dot id="ff3" hue="blue" size={120} className="absolute right-16 bottom-[14%]" />
      </div>

      <div className="relative z-10 mx-auto flex max-w-7xl flex-col px-10">
        <p className="mb-6 text-sm uppercase tracking-[0.45em] text-outline/65">
          Fun Fact
        </p>

        <h2 className="font-display max-w-5xl text-[clamp(3rem,7.5vw,7rem)] uppercase leading-[0.85] tracking-tight vf-text-hard">
          We might
          <br />
          reject your
          <br />
          project.
        </h2>

        <p className="mt-12 max-w-xl text-xl leading-relaxed text-outline/80">
          Not because it's bad.
          <br />
          Because we refuse to build
          {/* Dark with a green underline rather than green text — green on
              lime is muddy at body-copy size. text-ink, NOT text-outline:
              that utility now renders white, which would vanish here. */}
          <span className="font-semibold text-ink underline decoration-green decoration-4 underline-offset-4">
            {" "}
            boring.
          </span>
        </p>

        <div className="mt-24 border-l-4 border-outline pl-8">
          <p className="text-lg leading-9 text-outline/65">
            If every idea ends with...
          </p>

          {/* The three red-flag quotes as pills — same UI unit as the nav,
              which is what ties the system together across sections. */}
          <div className="mt-8 flex flex-col items-start gap-4">
            <span className="vf-pill vf-pill--pink text-lg! tracking-normal!">
              "Can we copy this?"
            </span>
            <span className="vf-pill vf-pill--orange text-lg! tracking-normal!">
              "Make the logo bigger."
            </span>
            <span className="vf-pill text-lg! tracking-normal!">
              "Let's play it safe."
            </span>
          </div>
        </div>

        <h3 className="font-display mt-28 max-w-4xl text-[clamp(2.5rem,5vw,5rem)] uppercase leading-[0.9] tracking-tight">
          Then we're probably
          <br />
          not your agency.
        </h3>

        <p className="mt-10 text-sm uppercase tracking-[0.45em] text-outline/65">
          Creativity needs trust.
        </p>
      </div>
    </section>
  );
}