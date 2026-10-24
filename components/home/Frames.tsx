"use client";

import type { CSSProperties, ReactNode } from "react";
import type { FrameId } from "@/lib/home/cosmetics";
import { seeded } from "./scenes/canvas";

/**
 * Frames for the garden window, one to match each pot. Each is a ring drawn
 * over the window's edge: its own colours and pattern, pale or dark lines
 * for its inner and outer edges, and a soft sheen of light, so they all read
 * as solid things with a surface. A border holds one image only, so the ring
 * is an overlay, masked to the band between its padding and its edge.
 */

interface FrameStyle {
  /** The ring's surface, as CSS backgrounds, top layer first. */
  surface: string;
  /** The lines along its inner and outer edges. */
  edge: string;
  /** The window's shape, as classes. */
  shape?: string;
  /** Ring thickness in px. */
  width?: number;
  /** Anything drawn on top, like rivets. */
  extra?: ReactNode;
}

/**
 * Points scattered over a tile, for stars, snow, embers and the like: seeded,
 * so a frame always looks the same, with sizes and brightness that vary, and
 * a tile big enough that its repeat doesn't show as rows or columns.
 */
function scatter(seed: number, colors: string[], count: number, r: [number, number], tile: [number, number]) {
  const rand = seeded(seed);
  const [w, h] = tile;
  const circles = Array.from({ length: count }, () => {
    const radius = r[0] + (r[1] - r[0]) * rand() ** 1.6;
    const color = colors[Math.floor(rand() * colors.length)];
    const alpha = 0.55 + 0.45 * rand();
    return `<circle cx='${(rand() * w).toFixed(1)}' cy='${(rand() * h).toFixed(1)}' r='${radius.toFixed(2)}' fill='${color}' fill-opacity='${alpha.toFixed(2)}'/>`;
  }).join("");
  const svg = `<svg xmlns='http://www.w3.org/2000/svg' width='${w}' height='${h}'>${circles}</svg>`;
  return `url("data:image/svg+xml,${encodeURIComponent(svg)}") 0 0 / ${w}px ${h}px`;
}

/** The brass porthole's rivets, centred in the band and clear of its
 *  rounded corners, so none overhang. */
const Rivets = () => (
  <span aria-hidden="true" className="pointer-events-none absolute inset-0 z-10">
    {[20, 35, 50, 65, 80].flatMap((x) => [
      <span key={`t${x}`} className="absolute top-px size-1.5 -translate-x-1/2 rounded-full bg-[#f3dca2] shadow-[0_1px_0_#6f521f]" style={{ left: `${x}%` }} />,
      <span key={`b${x}`} className="absolute bottom-px size-1.5 -translate-x-1/2 rounded-full bg-[#f3dca2] shadow-[0_1px_0_#6f521f]" style={{ left: `${x}%` }} />,
    ])}
  </span>
);

/** Porcelain's blue line, running round the middle of the band. */
const BlueLine = () => (
  <span aria-hidden="true" className="pointer-events-none absolute inset-[3.5px] z-10 rounded-[inherit] shadow-[0_0_0_1px_#4a6fb5]" />
);

const DARK = "rgb(0 0 0 / 0.35)";
const PALE = "#f7f4ee";

const STYLES: Record<Exclude<FrameId, "plain">, FrameStyle> = {
  terracotta: { surface: "linear-gradient(135deg, #d0805c, #a5583a 55%, #c26c47)", edge: DARK },
  porcelain: { surface: "#f4f6fa", edge: "#4a6fb5", extra: <BlueLine /> },
  stone: {
    surface: `${scatter(3, ["#6f9a55", "#5a8547", "#86b06a"], 9, [1.5, 3.6], [96, 70])}, linear-gradient(#8a8f8a, #6f746f)`,
    edge: DARK,
  },
  // Copper, gone green in places where it has weathered.
  copper: {
    surface: `${scatter(5, ["#5fae8f", "#4f9a7e", "#7cc4a6"], 10, [1.5, 4.5], [110, 64])}, linear-gradient(135deg, #e39a5f, #8a4b2a 50%, #d9894f)`,
    edge: DARK,
  },
  midnight: { surface: `${scatter(7, ["#cfd8ff", "#ffffff"], 16, [0.4, 1.4], [120, 90])}, #1e2547`, edge: "#3a4270" },
  gilded: { surface: "linear-gradient(135deg, #f6d977, #b3862a 50%, #f6d977)", edge: "#7a5a18" },
  diamond: { surface: "linear-gradient(135deg, #f4fdff, #8fd3f2 50%, #f4fdff)", edge: "#ffffff" },
  slick: {
    surface: `${scatter(11, ["#ffffff"], 10, [0.6, 1.4], [100, 90])}, linear-gradient(135deg, #34508a, #141c33)`,
    edge: DARK,
  },
  daisy: { surface: `${scatter(13, ["#ffffff", "#fff6c2"], 9, [1.2, 2.6], [96, 80])}, #7fb77e`, edge: "#4f8a52" },
  marble: { surface: `${scatter(17, ["#8a6a4a", "#a5825f"], 18, [0.4, 1], [84, 64])}, #e9dcc6`, edge: "#7a4a2a" },
  dusk: { surface: "linear-gradient(135deg, #ffa06b, #6b3a8a)", edge: DARK },
  bark: { surface: "repeating-linear-gradient(90deg, #6b4a32 0 6px, #5a3d29 6px 8px)", edge: DARK },
  enamel: { surface: "#f4f6f8", edge: "#2f5fa8", width: 7 },
  maple: { surface: "linear-gradient(135deg, #b5532a, #d9822f 50%, #b5532a)", edge: DARK },
  borealis: { surface: "linear-gradient(135deg, #2a7a74, #3f2a74)", edge: "#8ff5cf" },
  coral: { surface: "repeating-linear-gradient(60deg, #ff8a73 0 6px, #ffb2a0 6px 8px)", edge: "#d9614a" },
  frost: {
    surface: `${scatter(19, ["#ffffff"], 18, [0.5, 1.4], [100, 80])}, linear-gradient(135deg, #eef7ff, #9cc4e8)`,
    edge: "#ffffff",
  },
  // Ash-grey stone with embers still glowing in it.
  ashen: {
    surface: `${scatter(29, ["#ff9a3c", "#ffc46b", "#ff6a2a"], 12, [0.6, 1.6], [110, 80])}, linear-gradient(135deg, #5b5753, #3e3b38)`,
    edge: DARK,
  },
  nebula: {
    surface: `${scatter(23, ["#ffffff", "#f0d8ff", "#cfe4ff"], 16, [0.4, 1.2], [110, 90])}, linear-gradient(135deg, #4a2f8a, #121a44)`,
    edge: "#7a5ad0",
  },
  wood: { surface: "repeating-linear-gradient(90deg, #7a4e2a 0 9px, #6b4423 9px 11px, #83582f 11px 14px)", edge: "#3a2414" },
  // Pastel panes cut into diamonds by pale leading.
  stained: {
    surface: [
      "repeating-linear-gradient(45deg, transparent 0 22px, #f7f4ee 22px 24px)",
      "repeating-linear-gradient(-45deg, transparent 0 22px, #f7f4ee 22px 24px)",
      "linear-gradient(135deg, #f6c9d4, #f7e5b8 25%, #cbe8d3 50%, #c6dbf3 75%, #dccdf1)",
    ].join(", "),
    edge: PALE,
  },
  brass: {
    surface: "linear-gradient(135deg, #e6c47e, #b8893a 45%, #8a6424 70%, #e6c47e)",
    edge: "#6f521f",
    shape: "rounded-[2.5rem]",
    extra: <Rivets />,
  },
  gothic: {
    surface: "repeating-linear-gradient(90deg, transparent 0 22px, rgb(0 0 0 / 0.25) 22px 23px), linear-gradient(#8f8f98, #6a6a72)",
    edge: "rgb(0 0 0 / 0.3)",
    shape: "rounded-b-md [border-top-left-radius:50%_42%] [border-top-right-radius:50%_42%]",
  },
};

/** A soft sheen across every frame, so each reads as a surface. */
const SHEEN =
  "linear-gradient(115deg, transparent 18%, rgb(255 255 255 / 0.32) 30%, transparent 38%, transparent 60%, rgb(255 255 255 / 0.18) 68%, transparent 74%)";

const RING_MASK = "linear-gradient(#000 0 0), linear-gradient(#000 0 0)";

/** The window's own shape and edge for a frame. */
export const frameShape = (id: FrameId) =>
  id === "plain" ? "rounded-2xl border border-glass-edge" : (STYLES[id].shape ?? "rounded-lg");

/** The frame itself, drawn over the window's edge. */
export function FrameRing({ id }: { id: FrameId }) {
  if (id === "plain") return null;
  const style = STYLES[id];
  const width = style.width ?? 8;
  return (
    <>
      <span
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 z-10 rounded-[inherit]"
        style={
          {
            padding: width,
            background: `${SHEEN}, ${style.surface}`,
            maskImage: RING_MASK,
            maskClip: "content-box, border-box",
            maskComposite: "exclude",
            WebkitMaskImage: RING_MASK,
            WebkitMaskClip: "content-box, border-box",
            WebkitMaskComposite: "xor",
            boxShadow: `inset 0 0 0 1.5px ${style.edge}`,
          } as CSSProperties
        }
      >
        {/* The inner edge, where the frame meets the glass. */}
        <span className="absolute rounded-[inherit]" style={{ inset: width, boxShadow: `0 0 0 1.5px ${style.edge}` }} />
      </span>
      {style.extra}
    </>
  );
}
