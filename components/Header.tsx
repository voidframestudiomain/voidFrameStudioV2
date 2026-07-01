// components/Header.tsx
"use client";

import { useState } from "react";

export default function Header() {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <header className="fixed top-0 left-0 right-0 z-[80] flex items-center justify-between px-6 py-4">
        <div className="letsWorkCTA bg-black rounded-full px-4 py-2 font-semibold text-white">
            Let's Work
        </div>
        <div className="logo text-xl font-semibold text-black tracking-tighter">VoidFrame</div>
        <div className="menuArrow flex items-center gap-1">

        
        <div className="contactUs bg-black rounded-full px-6 py-2 font-semibold text-white items-center ">Menu</div>
      <div className="arrowMotion bg-black px-4 py-2 rounded-full text-white">
  <span>→</span>
</div>
</div>
    </header>
  );
}