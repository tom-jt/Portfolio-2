"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";
import { usePathname, useRouter } from "next/navigation";
import Image from "next/image";
import {
  AnimatePresence,
  motion,
  MotionConfig,
  useAnimationControls,
} from "motion/react";
import { CloudRain } from "lucide-react";
import SealMark from "@/components/law/SealMark";
import { useIsDark } from "@/hooks/use-is-dark";

export type Site = "cs" | "law" | "home";

interface CurtainContextValue {
  switchTo: (site: Site) => void;
  busy: boolean;
}

const CurtainContext = createContext<CurtainContextValue | null>(null);

export const useSiteCurtain = () => {
  const ctx = useContext(CurtainContext);
  if (!ctx) {
    throw new Error("useSiteCurtain must be used inside <SiteCurtainProvider>");
  }
  return ctx;
};

export const SITE_HREF: Record<Site, string> = {
  cs: "/cs",
  law: "/law",
  home: "/home",
};

/**
 * The curtain sits outside both [data-site] wrappers, so it cannot inherit
 * either palette and has to carry its own.
 *
 * Each direction shows the destination site's identity, themed. The CS panel
 * in dark is zinc-900 rather than the site's near-black: it sweeps across the
 * law site, whose dark ground is #0b0a0c, and two near-identical blacks make
 * the sweep invisible.
 *
 * Home has one skin for both themes, since /home ignores the theme toggle:
 * the rainy night's navy with its lamplight amber.
 */
const CURTAIN = {
  law: {
    light: { panel: "#7a1220", ink: "#d4af37" },
    dark: { panel: "#a8202f", ink: "#d4af37" },
  },
  cs: {
    light: {
      panel: "#fafafa",
      ink: "#18181b",
      logo: "/images/logos/LogoSimpleTrans.png",
    },
    dark: {
      panel: "#18181b",
      ink: "#fafafa",
      logo: "/images/logos/LogoSimpleDarkTrans.png",
    },
  },
  home: { panel: "#0d1428", ink: "#f2b46d" },
} as const;

/**
 * Law sweeps left-to-right and CS comes back right-to-left, so those two
 * read as opposites. Home falls from the top, like the rain it leads to.
 */
const SWEEP: Record<Site, { axis: "x" | "y"; from: string; exit: string }> = {
  law: { axis: "x", from: "-100%", exit: "100%" },
  cs: { axis: "x", from: "100%", exit: "-100%" },
  home: { axis: "y", from: "-100%", exit: "100%" },
};

/** Panel is fully across the screen for at least this long, even on an
 *  instant navigation — otherwise the sweep reads as a flicker. */
const MIN_COVER_MS = 380;
/** Never hold the curtain longer than this, however slow the route is. */
const MAX_WAIT_MS = 1500;

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

export const SiteCurtainProvider = ({
  children,
}: {
  children: React.ReactNode;
}) => {
  const router = useRouter();
  const pathname = usePathname();
  const isDark = useIsDark();
  const controls = useAnimationControls();

  const [visible, setVisible] = useState(false);
  const [busy, setBusy] = useState(false);
  const [target, setTarget] = useState<Site>("law");

  // Resolved by the effect below once the new route has actually rendered.
  const arrival = useRef<(() => void) | null>(null);
  const awaitedPath = useRef<string | null>(null);

  useEffect(() => {
    if (awaitedPath.current && pathname.startsWith(awaitedPath.current)) {
      awaitedPath.current = null;
      arrival.current?.();
      arrival.current = null;
    }
  }, [pathname]);

  const switchTo = useCallback(
    async (site: Site) => {
      if (busy) return;
      const href = SITE_HREF[site];
      if (pathname.startsWith(href)) return;

      const reduced =
        typeof window !== "undefined" &&
        window.matchMedia("(prefers-reduced-motion: reduce)").matches;

      if (reduced) {
        router.push(href);
        return;
      }

      setBusy(true);
      setTarget(site);
      setVisible(true);

      // Let the panel mount off-screen before animating it in.
      await controls.set("hidden");
      await controls.start("cover");

      const coveredAt = Date.now();
      await Promise.race([
        new Promise<void>((resolve) => {
          awaitedPath.current = href;
          arrival.current = resolve;
          router.push(href);
        }),
        sleep(MAX_WAIT_MS),
      ]);

      const held = Date.now() - coveredAt;
      if (held < MIN_COVER_MS) await sleep(MIN_COVER_MS - held);

      window.scrollTo({ top: 0, behavior: "instant" as ScrollBehavior });
      await controls.start("uncover");

      setVisible(false);
      setBusy(false);
    },
    [busy, controls, pathname, router],
  );

  const { axis, from, exit } = SWEEP[target];
  const at = (offset: string) => (axis === "x" ? { x: offset } : { y: offset });

  const mode = isDark ? "dark" : "light";
  const skin =
    target === "home"
      ? CURTAIN.home
      : target === "law"
        ? CURTAIN.law[mode]
        : CURTAIN.cs[mode];

  // Which edge of the panel leads the sweep, for the hairline.
  const leadingEdge =
    axis === "y" ? "bottom" : from === "-100%" ? "right" : "left";

  return (
    <CurtainContext.Provider value={{ switchTo, busy }}>
      {/* reducedMotion="user" makes every motion component below honour the
          OS setting, which the CSS media query cannot reach. */}
      <MotionConfig reducedMotion="user">{children}</MotionConfig>

      <AnimatePresence>
        {visible && (
          <motion.div
            key="curtain"
            className="pointer-events-none fixed inset-0 z-9999"
            initial={{ opacity: 1 }}
            aria-hidden="true"
          >
            <motion.div
              animate={controls}
              initial="hidden"
              variants={{
                hidden: at(from),
                cover: {
                  ...at("0%"),
                  transition: { duration: 0.52, ease: [0.76, 0, 0.24, 1] },
                },
                uncover: {
                  ...at(exit),
                  transition: { duration: 0.52, ease: [0.76, 0, 0.24, 1] },
                },
              }}
              className="absolute inset-0 flex items-center justify-center"
              style={{
                // Each direction gets its own site's identity colour. A dark
                // panel for the CS direction was invisible sweeping across the
                // law site in dark theme — black on black.
                background: skin.panel,
              }}
            >
              {/* Hairline riding the leading edge of the sweep. */}
              <div
                className={
                  axis === "y"
                    ? "absolute inset-x-0 h-0.75"
                    : "absolute inset-y-0 w-0.75"
                }
                style={{ background: skin.ink, [leadingEdge]: 0 }}
              />

              <motion.div
                initial={{ opacity: 0, scale: 0.94 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.45, delay: 0.18 }}
                className="flex flex-col items-center gap-5"
              >
                {target === "home" ? (
                  <CloudRain
                    size={84}
                    strokeWidth={1.2}
                    style={{ color: skin.ink }}
                  />
                ) : target === "law" ? (
                  <SealMark
                    size={132}
                    animate
                    style={{ color: skin.ink }}
                  />
                ) : (
                  <Image
                    src={CURTAIN.cs[mode].logo}
                    alt=""
                    width={96}
                    height={96}
                    priority
                  />
                )}
                <span
                  className={
                    target === "home"
                      ? "text-sm font-medium tracking-[0.2em]"
                      : "text-xs font-semibold tracking-[0.42em] uppercase"
                  }
                  style={{ color: skin.ink }}
                >
                  {target === "home"
                    ? "home"
                    : target === "law"
                      ? "Law"
                      : "Computer Science"}
                </span>
              </motion.div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </CurtainContext.Provider>
  );
};
