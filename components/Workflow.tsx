import { useEffect, useRef, useState } from "react";
import type { CSSProperties } from "react";

/**
 * VOID FRAME — parallax hero
 * -----------------------------------------------------------
 * Section is 200vh tall. Inside it, a 100vh sticky stage stays
 * pinned to the viewport while the user scrolls through the
 * remaining 100vh of scroll distance. That scroll distance is
 * converted to a 0→1 progress value, which drives:
 *
 *   - floating images (z-index 1): each has its own speed
 *     multiplier, so they drift upward at different rates —
 *     classic parallax depth.
 *   - "VOID FRAME" (z-index 9): pinned dead center, sits above
 *     every image regardless of how they stack.
 * -----------------------------------------------------------
 */

// Accents cycle through the Yestalgia palette instead of the previous
// neon set, so the floating cards read as one collection against the ink
// stage rather than eight unrelated highlights.
const IMAGES = [
  { src: "https://picsum.photos/id/1015/360/460", top: "8%",  left: "6%",  w: 200, speed: 260, rotate: -6,  accent: "var(--color-pink)" },
  { src: "https://picsum.photos/id/1025/360/460", top: "58%", left: "10%", w: 170, speed: 420, rotate: 4,   accent: "var(--color-yellow)" },
  { src: "https://picsum.photos/id/1035/460/360", top: "14%", left: "78%", w: 220, speed: 200, rotate: 5,   accent: "var(--color-blue)" },
  { src: "https://picsum.photos/id/1041/360/460", top: "62%", left: "76%", w: 190, speed: 340, rotate: -4,  accent: "var(--color-orange)" },
  { src: "https://picsum.photos/id/1050/460/360", top: "4%",  left: "38%", w: 180, speed: 480, rotate: -3,  accent: "var(--color-green)" },
  { src: "https://picsum.photos/id/1060/360/460", top: "68%", left: "42%", w: 160, speed: 160, rotate: 6,   accent: "var(--color-blue)" },
  { src: "https://picsum.photos/id/1074/360/460", top: "34%", left: "2%",  w: 150, speed: 380, rotate: 3,   accent: "var(--color-yellow)" },
  { src: "https://picsum.photos/id/1084/360/460", top: "32%", left: "88%", w: 150, speed: 300, rotate: -5,  accent: "var(--color-orange)" },
];

export default function VoidFrameParallaxHero() {
  // Typed, not bare useRef(null) — that inferred `never` and failed the
  // production type check on sectionRef.current.getBoundingClientRect().
  const sectionRef = useRef<HTMLElement>(null);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    let ticking = false;

    const measure = () => {
      const el = sectionRef.current;
      if (!el) return;
      const rect = el.getBoundingClientRect();
      const scrollDistance = rect.height - window.innerHeight;
      const scrolled = -rect.top;
      const p = scrollDistance > 0 ? Math.min(1, Math.max(0, scrolled / scrollDistance)) : 0;
      setProgress(p);
      ticking = false;
    };

    const onScroll = () => {
      if (!ticking) {
        window.requestAnimationFrame(measure);
        ticking = true;
      }
    };

    window.addEventListener("scroll", onScroll, { passive: true });
    measure();
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <section ref={sectionRef} className="vf-parallax-section vf-bleed" >
      <style>{`
        .vf-parallax-section {
          position: relative;
          height: 300vh;
        }
        .vf-stage {
          position: sticky;
          top: 0;
          height: 100vh;
          overflow: hidden;
          display: flex;
          align-items: center;
          justify-content: center;
          /* Dark color-block. The title is beige, so this section MUST
             carry its own background — on the beige page it was
             beige-on-beige and effectively invisible. */
          background: var(--color-ink);
        }
        .vf-img-layer {
          position: absolute;
          inset: 0;
          z-index: 1;
        }
        .vf-img-card {
          position: absolute;
          border-radius: 4px;
          overflow: hidden;
          /* Black outline with a hard offset shadow in the card's own
             accent hue — the blurred drop shadow that was here reads as
             lit depth, which fights the flat printed look everywhere else. */
          border: 3px solid var(--color-outline);
          box-shadow: 8px 8px 0 var(--accent, var(--color-beige));
          will-change: transform;
        }
        .vf-img-card img {
          display: block;
          width: 100%;
          height: 100%;
          object-fit: cover;
        }
        .vf-text-layer {
          position: relative;
          z-index: 9;
          text-align: center;
          pointer-events: none;
        }
        .vf-text-layer h1 {
          font-family: 'Space Grotesk', sans-serif;
          font-weight: 700;
          font-size: clamp(48px, 11vw, 160px);
          line-height: 0.92;
          letter-spacing: -0.02em;
          color: var(--color-beige);
          margin: 0;
          text-transform: uppercase;
        }
        .vf-text-layer p {
          margin: 20px 0 0;
          font-family: 'Inter', sans-serif;
          font-size: 15px;
          letter-spacing: 0.08em;
          text-transform: uppercase;
          color: var(--color-yellow);
        }
          .vf-text-layer {
  position: absolute;
  inset: 0;
  display: flex;
  justify-content: center;
  align-items: center;
  overflow: hidden;
}

.vf-title {
  font-family: var(--font-anton), sans-serif;
  font-size: clamp(5rem, 13vw, 13rem);
  letter-spacing: -0.01em;
  color: var(--color-beige);
  white-space: nowrap;
}

/* The "F" scales to ~60x on scroll, so whatever color it is becomes a
   full-screen wipe at the end of the section. Green makes that the
   loudest brand moment on the page instead of a flat white flash. */
.frame {
  display: inline-block;
  transform-origin: center;
  will-change: transform;
  color: var(--color-green);
}

        .vf-fade-hint {
          position: absolute;
          bottom: 36px;
          left: 50%;
          transform: translateX(-50%);
          z-index: 9;
          font-family: 'Inter', sans-serif;
          font-size: 12px;
          letter-spacing: 0.08em;
          text-transform: uppercase;
          color: color-mix(in srgb, var(--color-beige) 45%, transparent);
        }
      `}</style>

      <div className="vf-stage">
        <div className="vf-img-layer">
          {IMAGES.map((img, i) => {
            const translateY = -progress * img.speed;
            const opacity = 1 - progress * 0.5;
            return (
              <div
                key={i}
                className="vf-img-card"
                style={{
                  top: img.top,
                  left: img.left,
                  width: img.w,
                  height: img.w * 1.25,
                  ["--accent" as string]: img.accent,
                  transform: `translateY(${translateY}px) rotate(${img.rotate}deg)`,
                  opacity,
                } as CSSProperties}
              >
                <img src={img.src} alt="" />
              </div>
            );
          })}
        </div>

        {/* <div
          className="vf-text-layer"
          style={{
            transform: `scale(${1 + progress * 2.12})`,
          }}
        >
          <h1>Void Frame</h1>
          <p>Digital marketing that doesn't whisper</p>
        </div> */}
        <div className="vf-text-layer">
  <h1 className="vf-title">
    <span className="void">VOID </span>
    <span
      className="frame"
      style={{
        transform: `scale(${1 + progress * 60})`,
      }}
    >
      F
    </span>
    <span className="rame">RAME</span>
  </h1>
</div>

        <div className="vf-fade-hint" style={{ opacity: 1 - progress * 3 }}>
          Scroll
        </div>
      </div>
    </section>
  );
}