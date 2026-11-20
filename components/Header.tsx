// components/Header.tsx
"use client";

import { Menu, ArrowUpRight } from "lucide-react";

export default function Header() {
  return (
    // Phones get a tighter bar: smaller gutters and pills, no wrapping
    // labels, and the decorative arrow button dropped so the wordmark has
    // room to sit between the two pills without touching them.
    <header className="fixed top-0 left-0 right-0 z-80 flex items-center justify-between gap-2 px-4 py-4 sm:px-6 sm:py-5">
      <button type="button" className="vf-pill whitespace-nowrap max-sm:px-3 max-sm:text-xs">
        <Menu size={16} strokeWidth={2.75} />
        Menu
      </button>

      {/* Wordmark carries the same hard shadow as the pills, at a smaller
          offset so it doesn't outweigh them. */}
      <div className="font-display text-xl uppercase tracking-tight vf-text-hard-sm sm:text-2xl">
        VoidFrame
      </div>

      <div className="flex items-center gap-3">
        <a href="#contact" className="vf-pill vf-pill--pink whitespace-nowrap max-sm:px-3 max-sm:text-xs">
          Let&apos;s Work
        </a>
        <button type="button" className="vf-pill max-sm:hidden" aria-label="Open">
          <ArrowUpRight size={16} strokeWidth={2.75} />
        </button>
      </div>
    </header>
  );
}
