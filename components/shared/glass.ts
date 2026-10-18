/**
 * The navbar's floating-capsule treatment, shared so the CS side rails match
 * it exactly rather than by eye. Both animate these values through motion on
 * the same scroll trigger.
 */

export const GLASS_SHADOW =
  "0 0 24px rgba(34, 42, 53, 0.06), 0 1px 1px rgba(0, 0, 0, 0.05), 0 0 0 1px rgba(34, 42, 53, 0.04), 0 0 4px rgba(34, 42, 53, 0.08), 0 16px 68px rgba(47, 48, 55, 0.05), 0 1px 0 rgba(255, 255, 255, 0.1) inset";

export const GLASS_BLUR = "blur(3px)";

/** Scroll distance at which the chrome condenses. */
export const GLASS_SCROLL_THRESHOLD = 100;

export const GLASS_TRANSITION = {
  type: "spring",
  stiffness: 200,
  damping: 50,
} as const;
