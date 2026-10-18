"use client";

import { useEffect, useState } from "react";

/**
 * Tracks the `dark` class on <html>, which is where the theme lives.
 *
 * Starts false so the server render and the first client render agree; the
 * boot script may already have added the class, so the observer fires an
 * immediate read on mount to catch up.
 */
export function useIsDark() {
  const [isDark, setIsDark] = useState(false);

  useEffect(() => {
    const read = () =>
      setIsDark(document.documentElement.classList.contains("dark"));

    read();
    const observer = new MutationObserver(read);
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["class"],
    });
    return () => observer.disconnect();
  }, []);

  return isDark;
}
