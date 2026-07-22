"use client";

import { ArrowUpRight } from "lucide-react";

export default function Contact() {
  return (
    <section id="contact" className="vf-bleed relative overflow-hidden bg-beige text-ink py-32">
      {/* Background Text */}
      <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
        <h1 className="select-none text-[22vw] font-black uppercase tracking-tighter text-ink/[0.05] leading-none">
          VOID
        </h1>
      </div>

      <div className="relative z-10 mx-auto max-w-7xl px-10">
        {/* Hero */}
        <div className="mb-32">
          <p className="mb-4 text-sm uppercase tracking-[0.4em] text-ink/50">
            Final Frame
          </p>

          <h1 className="font-display text-[clamp(4rem,12vw,10rem)] uppercase leading-[0.85] tracking-tight vf-text-hard">
            Contact
            <br />
            Us
          </h1>

          <p className="mt-10 max-w-xl text-lg leading-relaxed text-ink/70">
            Every brand has a story. The question is—
            <br />
            <span className="text-green">
              will anyone remember yours?
            </span>
          </p>
        </div>

        {/* Content */}
        <div className="grid gap-24 lg:grid-cols-2">
          {/* Left */}
          <div>
            <p className="mb-6 text-xs uppercase tracking-[0.4em] text-ink/50">
              Start a Conversation
            </p>

            <h2 className="font-display text-6xl uppercase leading-[0.9] tracking-tight">
              Let's Build
              <br />
              Something
              <br />
              Worth Watching.
            </h2>

            <p className="mt-8 max-w-md text-ink/70 leading-8">
              Whether you're launching a brand, redesigning your digital
              presence, or creating your next campaign—we'd love to hear your
              vision.
            </p>

            <div className="mt-16 space-y-3 text-sm uppercase tracking-widest">
              <p>hello@voidframe.studio</p>
              <p>Instagram</p>
              <p>Behance</p>
              <p>LinkedIn</p>
            </div>
          </div>

          {/* Right */}
          <form className="space-y-12">
            <div>
              <label className="mb-3 block text-xs uppercase tracking-[0.3em] text-ink/50">
                Name
              </label>

              <input
                type="text"
                placeholder="Who are you?"
                className="w-full border-b border-ink/25 bg-transparent pb-4 text-2xl outline-none transition-all placeholder:text-ink/30 focus:border-green"
              />
            </div>

            <div>
              <label className="mb-3 block text-xs uppercase tracking-[0.3em] text-ink/50">
                Email
              </label>

              <input
                type="email"
                placeholder="you@example.com"
                className="w-full border-b border-ink/25 bg-transparent pb-4 text-2xl outline-none transition-all placeholder:text-ink/30 focus:border-green"
              />
            </div>

            <div>
              <label className="mb-3 block text-xs uppercase tracking-[0.3em] text-ink/50">
                Your Story
              </label>

              <textarea
                rows={5}
                placeholder="Tell us about your vision..."
                className="w-full resize-none border-b border-ink/25 bg-transparent pb-4 text-2xl outline-none transition-all placeholder:text-ink/30 focus:border-green"
              />
            </div>

            <button
              type="submit"
              className="vf-pill mt-10 px-8! py-5! text-sm! tracking-[0.25em]!"
            >
              Frame My Story

              <ArrowUpRight
                size={18}
                className="transition-transform duration-300 group-hover:translate-x-1 group-hover:-translate-y-1"
              />
            </button>
          </form>
        </div>

        {/* Footer */}
        <div className="mt-40 border-t border-ink/15 pt-10 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <p className="text-ink/50 uppercase tracking-[0.3em] text-xs">
            © 2026 VOID FRAME
          </p>

          <p className="text-sm text-ink/50">
            Enough scrolling. Let's make something unforgettable.
          </p>
        </div>
      </div>
    </section>
  );
}