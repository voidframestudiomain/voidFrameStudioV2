"use client";

export default function FunFact() {
  return (
    
    <section className="relative flex min-h-screen items-center overflow-hidden bg-[#f5f3ef] text-black  -mx-[40px] w-[calc(100%+80px)]">
      {/* Huge Background Text */}
      <h1 className="pointer-events-none absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 select-none text-[28vw] font-black uppercase tracking-tighter text-black/[0.03]">
        WHY?
      </h1>

      <div className="relative z-10 mx-auto flex max-w-7xl flex-col px-10">
        <p className="mb-6 text-sm uppercase tracking-[0.45em] text-neutral-500">
          Fun Fact
        </p>

        <h2 className="max-w-5xl text-[clamp(3rem,7vw,7rem)] font-black uppercase leading-[0.9] tracking-tight">
          We might
          <br />
          reject your
          <br />
          project.
        </h2>

        <p className="mt-12 max-w-xl text-xl leading-relaxed text-neutral-600">
          Not because it's bad.
          <br />
          Because we refuse to build
          <span className="font-semibold text-black"> boring.</span>
        </p>

        <div className="mt-24 border-l-2 border-black pl-8">
          <p className="text-lg leading-9 text-neutral-500">
            If every idea ends with...
          </p>

          <div className="mt-8 space-y-4 text-3xl font-bold uppercase">
            <p>"Can we copy this?"</p>
            <p>"Make the logo bigger."</p>
            <p>"Let's play it safe."</p>
          </div>
        </div>

        <h3 className="mt-28 max-w-4xl text-[clamp(2.5rem,5vw,5rem)] font-black uppercase leading-[0.95]">
          Then we're probably
          <br />
          not your agency.
        </h3>

        <p className="mt-10 text-sm uppercase tracking-[0.45em] text-neutral-500">
          Creativity needs trust.
        </p>
      </div>
    </section>
  );
}