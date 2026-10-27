/** Shared plumbing for the canvas scenes. */

/** Deterministic PRNG, so a scene draws the same city on every visit and resize. */
export function seeded(seed: number) {
  return () => {
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export const lerp = (a: number, b: number, t: number) => a + (b - a) * t;

/**
 * Sizes a canvas's backing store to its CSS box times `scale`, and returns a
 * context already scaled so drawing code works in CSS pixels.
 */
export function fitCanvas(canvas: HTMLCanvasElement, scale: number) {
  // clientWidth rather than getBoundingClientRect: the layout size, ignoring
  // any CSS transform (the blurred layers are scaled up to hide their edges).
  const width = canvas.clientWidth;
  const height = canvas.clientHeight;
  canvas.width = Math.max(1, Math.round(width * scale));
  canvas.height = Math.max(1, Math.round(height * scale));
  const ctx = canvas.getContext("2d")!;
  ctx.setTransform(scale, 0, 0, scale, 0, 0);
  return { ctx, w: width, h: height };
}

/** Device pixel ratio, capped: full-screen canvases at 3x cost a lot for little. */
export const cappedDpr = (cap: number) =>
  Math.min(typeof window === "undefined" ? 1 : window.devicePixelRatio || 1, cap);

/**
 * Runs `frame` on every animation frame with a clamped delta, so a tab that
 * was in the background resumes smoothly instead of jumping. Returns a stop
 * function.
 */
export function animate(frame: (t: number, dt: number) => void) {
  let raf = 0;
  let last = performance.now();
  const loop = (now: number) => {
    const dt = Math.min(0.05, (now - last) / 1000);
    last = now;
    frame(now / 1000, dt);
    raf = requestAnimationFrame(loop);
  };
  raf = requestAnimationFrame(loop);
  return () => cancelAnimationFrame(raf);
}

/** Calls `fn` after the window stops resizing. Returns a cleanup. */
export function onResize(fn: () => void, wait = 150) {
  let timer: ReturnType<typeof setTimeout> | undefined;
  const handler = () => {
    clearTimeout(timer);
    timer = setTimeout(fn, wait);
  };
  window.addEventListener("resize", handler);
  return () => {
    clearTimeout(timer);
    window.removeEventListener("resize", handler);
  };
}

/** Film grain tile, overlaid on every scene so flat gradients don't band. */
export const GRAIN =
  "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='160' height='160'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.8' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='160' height='160' filter='url(%23n)' opacity='0.5'/%3E%3C/svg%3E";
