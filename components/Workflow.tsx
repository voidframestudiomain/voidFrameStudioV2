import { useEffect, useRef, useState } from "react";

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

const IMAGES = [
  { src: "https://picsum.photos/id/1015/360/460", top: "8%",  left: "6%",  w: 200, speed: 260, rotate: -6,  accent: "#FF3D6E" },
  { src: "https://picsum.photos/id/1025/360/460", top: "58%", left: "10%", w: 170, speed: 420, rotate: 4,   accent: "#D4FF3D" },
  { src: "https://picsum.photos/id/1035/460/360", top: "14%", left: "78%", w: 220, speed: 200, rotate: 5,   accent: "#8B3DFF" },
  { src: "https://picsum.photos/id/1041/360/460", top: "62%", left: "76%", w: 190, speed: 340, rotate: -4,  accent: "#FFB93D" },
  { src: "https://picsum.photos/id/1050/460/360", top: "4%",  left: "38%", w: 180, speed: 480, rotate: -3,  accent: "#FF3D6E" },
  { src: "https://picsum.photos/id/1060/360/460", top: "68%", left: "42%", w: 160, speed: 160, rotate: 6,   accent: "#8B3DFF" },
  { src: "https://picsum.photos/id/1074/360/460", top: "34%", left: "2%",  w: 150, speed: 380, rotate: 3,   accent: "#D4FF3D" },
  { src: "https://picsum.photos/id/1084/360/460", top: "32%", left: "88%", w: 150, speed: 300, rotate: -5,  accent: "#FFB93D" },
];

export default function VoidFrameParallaxHero() {
  const sectionRef = useRef(null);
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
    <section ref={sectionRef} className="vf-parallax-section -mx-[40px] w-[calc(100%+80px)]" >
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
          border: 2px solid var(--accent);
          box-shadow: 0 20px 50px rgba(0,0,0,0.55);
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
          color: #F5F3EF;
          margin: 0;
          text-transform: uppercase;
        }
        .vf-text-layer p {
          margin: 20px 0 0;
          font-family: 'Inter', sans-serif;
          font-size: 15px;
          letter-spacing: 0.08em;
          text-transform: uppercase;
          color: #D4FF3D;
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
  font-size: clamp(5rem, 12vw, 12rem);
  font-weight: 900;
  color: #fff;
  white-space: nowrap;
}

.frame {
  display: inline-block;
  transform-origin: center;
  will-change: transform;
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
          color: rgba(245,243,239,0.4);
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
                //   "--accent": img.accent,
                  transform: `translateY(${translateY}px) rotate(${img.rotate}deg)`,
                  opacity,
                }}
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