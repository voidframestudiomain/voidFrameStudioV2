"use client";

import type { CSSProperties } from "react";

/**
 * MEMPHIS SHAPE KIT
 * ---------------------------------------------------------------------
 * The floating decorative geometry of the Yestalgia look: arcs, dots,
 * bolts, zigzags, triangles and a retro sunset.
 *
 * Every shape is built from the same three-layer recipe, which is what
 * makes them read as one family:
 *
 *   1. a fat black stroke underneath  → the outline
 *   2. the same path in a palette hue → the fill
 *   3. the same path again, painted with the confetti pattern → texture
 *
 * plus a CSS `drop-shadow` with ZERO blur radius for the hard offset
 * shadow. drop-shadow (not box-shadow) is required here — it follows the
 * shape's actual silhouette, whereas box-shadow would shadow the square
 * SVG bounding box instead of the arc/bolt itself.
 * --------------------------------------------------------------------- */

export type Hue = "green" | "pink" | "yellow" | "orange" | "blue" | "beige";

const HUE: Record<Hue, string> = {
  green: "var(--color-green)",
  pink: "var(--color-pink)",
  yellow: "var(--color-yellow)",
  orange: "var(--color-orange)",
  blue: "var(--color-blue)",
  beige: "var(--color-beige)",
};

// Scattered dashes. Rotated so the strokes never line up with the grid
// backdrop behind them.
function ConfettiPattern({ id }: { id: string }) {
  return (
    <pattern
      id={id}
      width="26"
      height="26"
      patternUnits="userSpaceOnUse"
      patternTransform="rotate(14)"
    >
      <g stroke="var(--color-outline)" strokeWidth="2.4" strokeLinecap="round">
        <path d="M4 3 l3.5 4.5" />
        <path d="M16 2 l-2.5 4.5" />
        <path d="M22 10 l2 4.5" />
        <path d="M8 14 l3.5 3.5" />
        <path d="M18 18 l-3.5 3.5" />
        <path d="M3 21 l3.5 2.5" />
      </g>
    </pattern>
  );
}

interface ShapeProps {
  hue?: Hue;
  /** Rendered width in px. Height follows the viewBox aspect ratio. */
  size?: number;
  /** Degrees of rotation applied to the whole shape. */
  rotate?: number;
  /** Offset-shadow distance in px. 0 disables the shadow. */
  shadow?: number;
  /** Turns off the confetti speckle, for a flat-fill shape. */
  plain?: boolean;
  className?: string;
  style?: CSSProperties;
}

interface ShapeInternals extends ShapeProps {
  id: string;
  viewBox: string;
  d: string;
  /** Stroked shapes (arc, zigzag) vs filled shapes (dot, bolt, triangle). */
  mode: "stroke" | "fill";
  /** Stroke thickness for mode="stroke", in viewBox units. */
  weight?: number;
}

function Shape({
  id,
  viewBox,
  d,
  mode,
  weight = 22,
  hue = "pink",
  size = 160,
  rotate = 0,
  shadow = 6,
  plain = false,
  className = "",
  style,
}: ShapeInternals) {
  const patternId = `vf-confetti-${id}`;
  const outlineWeight = weight + 9;

  const common =
    mode === "stroke"
      ? { fill: "none", strokeLinecap: "round" as const, strokeLinejoin: "round" as const }
      : {};

  return (
    <svg
      viewBox={viewBox}
      width={size}
      aria-hidden="true"
      focusable="false"
      className={`pointer-events-none select-none ${className}`}
      style={{
        overflow: "visible",
        transform: `rotate(${rotate}deg)`,
        // Zero blur radius — this is the hard printed shadow, not a glow.
        filter: shadow ? `drop-shadow(${shadow}px ${shadow}px 0 var(--color-outline))` : undefined,
        ...style,
      }}
    >
      {!plain && (
        <defs>
          <ConfettiPattern id={patternId} />
        </defs>
      )}

      {/* 1 — black outline */}
      <path
        d={d}
        {...common}
        stroke="var(--color-outline)"
        strokeWidth={mode === "stroke" ? outlineWeight : 9}
        fill={mode === "fill" ? "var(--color-outline)" : "none"}
      />
      {/* 2 — hue fill */}
      <path
        d={d}
        {...common}
        stroke={mode === "stroke" ? HUE[hue] : "none"}
        strokeWidth={mode === "stroke" ? weight : undefined}
        fill={mode === "fill" ? HUE[hue] : "none"}
      />
      {/* 3 — confetti speckle */}
      {!plain && (
        <path
          d={d}
          {...common}
          stroke={mode === "stroke" ? `url(#${patternId})` : "none"}
          strokeWidth={mode === "stroke" ? weight : undefined}
          fill={mode === "fill" ? `url(#${patternId})` : "none"}
        />
      )}
    </svg>
  );
}

/** Half-donut arc, opening downward. */
export function Arc(props: ShapeProps & { id?: string }) {
  return (
    <Shape
      id={props.id ?? "arc"}
      viewBox="0 0 100 62"
      d="M12 56 A38 38 0 0 1 88 56"
      mode="stroke"
      weight={20}
      {...props}
    />
  );
}

/** Speckled circle. */
export function Dot(props: ShapeProps & { id?: string }) {
  return (
    <Shape
      id={props.id ?? "dot"}
      viewBox="0 0 100 100"
      d="M50 6 A44 44 0 1 1 49.9 6 Z"
      mode="fill"
      {...props}
    />
  );
}

/** Lightning bolt. */
export function Bolt(props: ShapeProps & { id?: string }) {
  return (
    <Shape
      id={props.id ?? "bolt"}
      viewBox="0 0 100 130"
      d="M62 6 L18 66 L46 66 L34 124 L84 52 L54 52 Z"
      mode="fill"
      {...props}
    />
  );
}

/** Descending stepped staircase. */
export function Zigzag(props: ShapeProps & { id?: string }) {
  return (
    <Shape
      id={props.id ?? "zig"}
      viewBox="0 0 110 110"
      d="M10 12 H36 V38 H62 V64 H88 V92"
      mode="stroke"
      weight={19}
      {...props}
    />
  );
}

/** Triangle wedge. */
export function Triangle(props: ShapeProps & { id?: string }) {
  return (
    <Shape
      id={props.id ?? "tri"}
      viewBox="0 0 100 88"
      d="M50 6 L94 82 L6 82 Z"
      mode="fill"
      {...props}
    />
  );
}

/**
 * Retro sunset — a disc sliced by horizontal gaps that widen toward the
 * bottom. The classic 80s sun. Not speckled; the slices are its texture.
 */
export function Sunset({
  size = 320,
  hue = "orange",
  className = "",
  style,
}: Pick<ShapeProps, "size" | "hue" | "className" | "style">) {
  const clipId = "vf-sun-clip";
  // Gap thickness grows as y increases, so the disc dissolves downward.
  const bands = [58, 66, 74, 82, 90];

  return (
    <svg
      viewBox="0 0 100 100"
      width={size}
      aria-hidden="true"
      focusable="false"
      className={`pointer-events-none select-none ${className}`}
      style={style}
    >
      <defs>
        <clipPath id={clipId}>
          <circle cx="50" cy="50" r="44" />
        </clipPath>
      </defs>
      <circle
        cx="50"
        cy="50"
        r="44"
        fill={HUE[hue]}
        stroke="var(--color-outline)"
        strokeWidth="5"
      />
      <g clipPath={`url(#${clipId})`}>
        {bands.map((y, i) => (
          <rect key={y} x="0" y={y} width="100" height={2 + i * 1.6} fill="var(--color-outline)" />
        ))}
      </g>
    </svg>
  );
}
