"use client";

import { useEffect, useState } from "react";

export default function Hero() {
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const onScroll = () => {
      const section = document.getElementById("hero");
      if (!section) return;

      const rect = section.getBoundingClientRect();
      const total = rect.height - window.innerHeight;

      const value = Math.min(Math.max(-rect.top / total, 0), 1);

      setProgress(value);
    };

    window.addEventListener("scroll", onScroll);
    onScroll();

    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // Ease Out
  const ease = 1 - Math.pow(1 - progress, 3);

  // Start outside viewport
  const topY = -500 + ease * 500;
  const bottomY = -500 + ease * 500;

  return (
    <section id="hero" className="relative h-[200vh] bg-white">
      <div className="sticky top-0 h-screen overflow-hidden">

        {/* ================= Background ================= */}

        <div
          className="absolute inset-0"
          style={{
            backgroundColor: "#fff",
            backgroundImage: `
              linear-gradient(45deg,#000 25%,transparent 25%),
              linear-gradient(-45deg,#000 25%,transparent 25%),
              linear-gradient(45deg,transparent 75%,#000 75%),
              linear-gradient(-45deg,transparent 75%,#000 75%)
            `,
            backgroundSize: "180px 180px",
            backgroundPosition:
              "0 0,0 90px,90px -90px,-90px 0",
          }}
        />

        {/* Dark overlay */}
        <div className="absolute inset-0 bg-black/10" />

        {/* ================= Burrito ================= */}

        {/* TOP */}
        <img
          src="/burrito.avif"
          alt=""
          className="absolute left-1/2 z-20 w-[420px] -translate-x-1/2"
          style={{
            top: `${topY}px`,
          }}
        />

        {/* BOTTOM */}
        <img
          src="/burrito.avif"
          alt=""
          className="absolute left-1/2 z-20 w-[420px] -translate-x-1/2"
          style={{
            bottom: `${bottomY}px`,
          }}
        />

        {/* ================= Text ================= */}

        <div className="absolute bottom-12 left-1/2 -translate-x-1/2 text-center">
          <p className="text-sm font-medium uppercase tracking-[0.6em] text-white">
            SCROLL
          </p>
        </div>
      </div>
    </section>
  );
}