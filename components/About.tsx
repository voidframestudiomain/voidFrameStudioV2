"use client";

export default function About() {
  return (
    <section className="relative overflow-hidden bg-black text-white py-36">
      {/* Background Word */}
      <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
        <h1 className="select-none text-[22vw] font-black uppercase tracking-tight text-white/[0.04]">
          CREATE
        </h1>
      </div>

      <div className="relative z-10 mx-auto max-w-7xl px-10">
        {/* Intro */}
        <div className="max-w-5xl">
          <p className="mb-6 uppercase tracking-[0.4em] text-neutral-500 text-sm">
            About Void Frame
          </p>

          <h2 className="text-[clamp(4rem,10vw,8rem)] font-black uppercase leading-[0.88] tracking-tight">
            We don't
            <br />
            follow trends.
            <br />
            <span className="text-neutral-500">
              We leave them behind.
            </span>
          </h2>
        </div>

        {/* Manifesto */}
        <div className="mt-28 grid gap-20 lg:grid-cols-2">
          <div>
            <p className="text-3xl leading-relaxed font-light text-neutral-300">
              Every pixel has a purpose.
              <br />
              Every animation earns its place.
              <br />
              Every project should make someone stop scrolling.
            </p>

            <p className="mt-12 text-lg leading-9 text-neutral-400 max-w-xl">
              We aren't interested in making content that blends into the feed.
              We obsess over details, movement, typography, storytelling and
              emotion until every frame feels impossible to ignore.
            </p>
          </div>

          <div className="space-y-10">
            <div className="border-l border-white/20 pl-8">
              <p className="text-sm uppercase tracking-[0.35em] text-neutral-500">
                Rule #01
              </p>

              <h3 className="mt-3 text-3xl font-bold">
                Good isn't enough.
              </h3>
            </div>

            <div className="border-l border-white/20 pl-8">
              <p className="text-sm uppercase tracking-[0.35em] text-neutral-500">
                Rule #02
              </p>

              <h3 className="mt-3 text-3xl font-bold">
                Creativity beats comfort.
              </h3>
            </div>

            <div className="border-l border-white/20 pl-8">
              <p className="text-sm uppercase tracking-[0.35em] text-neutral-500">
                Rule #03
              </p>

              <h3 className="mt-3 text-3xl font-bold">
                We'd rather surprise people than play it safe.
              </h3>
            </div>
          </div>
        </div>

        {/* Divider */}
        <div className="my-32 h-px bg-white/10" />

        {/* Fun Fact */}
        <div className="grid items-center gap-16 lg:grid-cols-[1fr_420px]">
          <div>
            <p className="uppercase tracking-[0.4em] text-neutral-500 text-sm">
              Fun Fact
            </p>

            <h2 className="mt-6 text-[clamp(3rem,7vw,6rem)] font-black uppercase leading-[0.9]">
              We might
              <br />
              reject
              <br />
              your project.
            </h2>

            <p className="mt-10 max-w-2xl text-xl leading-9 text-neutral-300">
              Not because your idea isn't good.
              <br />
              But because creativity needs trust.
            </p>

            <p className="mt-8 max-w-2xl text-lg leading-8 text-neutral-500">
              If every bold idea is answered with
              <span className="text-white"> "Can we make it smaller?"</span>,
              <span className="text-white"> "Let's copy this brand."</span>,
              or
              <span className="text-white">
                {" "}
                "Can we play it safe?"
              </span>
              ...we're probably not the right studio for you.
            </p>
          </div>

          <div className="rounded-3xl border border-white/10 bg-white/5 p-10 backdrop-blur">
            <p className="text-xs uppercase tracking-[0.4em] text-neutral-500">
              Our Promise
            </p>

            <p className="mt-8 text-3xl leading-relaxed font-light">
              Give us creative freedom...
            </p>

            <p className="mt-6 text-5xl font-black uppercase">
              We'll give
              <br />
              you goosebumps.
            </p>
          </div>
        </div>

        {/* Closing */}
        <div className="mt-40 text-center">
          <h2 className="text-[clamp(4rem,12vw,10rem)] font-black uppercase leading-none">
            MAKE
            <br />
            THEM
            <br />
            FEEL.
          </h2>

          <p className="mt-10 text-neutral-500 uppercase tracking-[0.35em]">
            That's the whole job.
          </p>
        </div>
      </div>
    </section>
  );
}