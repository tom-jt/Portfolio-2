import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function prefersReducedMotion() {
  if (typeof window === "undefined") return false;
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

export function scrollToId(id: string) {
  const element = document.getElementById(id);
  element?.scrollIntoView({
    // Smooth scrolling is motion too — a long page-length glide is exactly
    // what vestibular-sensitive users are asking not to receive.
    behavior: prefersReducedMotion() ? "auto" : "smooth",
  });
}
