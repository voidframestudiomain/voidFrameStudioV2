// components/Header.tsx
"use client";

import { useEffect, useState } from "react";

export default function Header() {
  const [menuOpen, setMenuOpen] = useState(false);
  void menuOpen;
  void setMenuOpen;

  // Whether a dark surface is currently under the header. Sections that
  // are dark mark themselves with data-header-theme="dark"; on scroll we
  // check whether any of them covers the header's midpoint (rects account
  // for transforms, so HowWeWork's sliding panel only counts once it has
  // actually slid under the header).
  const [onDark, setOnDark] = useState(false);

  useEffect(() => {
    let raf = 0;
    const check = () => {
      raf = 0;
      const x = window.innerWidth / 2;
      const y = 36; // header midline
      let dark = false;
      document.querySelectorAll('[data-header-theme="dark"]').forEach((el) => {
        const r = el.getBoundingClientRect();
        if (r.top <= y && r.bottom >= y && r.left <= x && r.right >= x) dark = true;
      });
      setOnDark(dark);
    };
    const onScroll = () => {
      if (!raf) raf = requestAnimationFrame(check);
    };
    check();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
      if (raf) cancelAnimationFrame(raf);
    };
  }, []);

  // Pills invert on dark sections: black-on-white becomes white-on-black.
  const pill = onDark ? "bg-white text-black" : "bg-black text-white";

  return (
    <header className="fixed top-0 left-0 right-0 z-[80] flex items-center justify-between px-4 py-3 md:px-6 md:py-4">
        {/* Hidden on phones — the logo takes the left slot so the bar
            never crowds at narrow widths. */}
        <div className={`letsWorkCTA hidden rounded-full px-4 py-2 font-semibold transition-colors duration-300 sm:block ${pill}`}>
            Let&apos;s Work
        </div>
        <div
          className={`logo text-lg font-semibold tracking-tighter transition-colors duration-300 md:text-xl ${
            onDark ? "text-white" : "text-black"
          }`}
        >
          VoidFrame
        </div>
        <div className="menuArrow flex items-center gap-1">


        <div className={`contactUs rounded-full px-4 py-1.5 text-sm font-semibold items-center transition-colors duration-300 md:px-6 md:py-2 md:text-base ${pill}`}>Menu</div>
      <div className={`arrowMotion hidden px-4 py-2 rounded-full transition-colors duration-300 sm:block ${pill}`}>
  <span>→</span>
</div>
</div>
    </header>
  );
}
