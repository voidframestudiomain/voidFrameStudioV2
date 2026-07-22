// components/Header.tsx
"use client";

import { Menu, ArrowUpRight } from "lucide-react";

export default function Header() {
  return (
    <header className="fixed top-0 left-0 right-0 z-80 flex items-center justify-between px-6 py-5">
      <button type="button" className="vf-pill">
        <Menu size={16} strokeWidth={2.75} />
        Menu
      </button>

      {/* Wordmark carries the same hard shadow as the pills, at a smaller
          offset so it doesn't outweigh them. */}
      <div className="font-display text-2xl uppercase tracking-tight vf-text-hard-sm">
        VoidFrame
      </div>

      <div className="flex items-center gap-3">
        <button type="button" className="vf-pill vf-pill--pink">
          Let&apos;s Work
        </button>
        <button type="button" className="vf-pill" aria-label="Open">
          <ArrowUpRight size={16} strokeWidth={2.75} />
        </button>
      </div>
    </header>
  );
}
