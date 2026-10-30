"use client";

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { AnimatePresence, motion } from "motion/react";
import { ExternalLink, Maximize2, Minimize2, X } from "lucide-react";
import type { ArcadeGame } from "@/data/home/games";
import { cn } from "@/lib/utils";
import { IconButton } from "./ui";

/** "16/9" → 1.777… Falls back to 16:9 for anything it can't read. */
function ratio(aspect: string) {
  const [w, h] = aspect.split("/").map(Number);
  return w > 0 && h > 0 ? w / h : 16 / 9;
}

type FullscreenFrame = HTMLIFrameElement & { webkitRequestFullscreen?: () => void };

/**
 * Real full screen where the browser allows it on a frame. iPhones only take
 * videos full screen, and some browsers refuse, so then it reports false and
 * the modal fills the window itself.
 */
async function enterFullscreen(frame: FullscreenFrame | null) {
  if (!frame) return false;
  try {
    if (frame.requestFullscreen) await frame.requestFullscreen();
    else if (frame.webkitRequestFullscreen) frame.webkitRequestFullscreen();
    else return false;
  } catch {
    return false;
  }
  return true;
}

/**
 * A game played in a frame over the page, sized to fit the viewport.
 *
 * Portalled to the /home root: it is opened from inside a card, and the
 * card's transform would otherwise make it the
 * containing block, pinning this "fixed" overlay to the card instead of the
 * window. The root still carries the scene's palette tokens.
 */
const GameModal = ({ game, onClose }: { game: ArcadeGame | null; onClose: () => void }) => {
  const frame = useRef<HTMLIFrameElement>(null);
  const closeButton = useRef<HTMLButtonElement>(null);
  /** Filling the window ourselves, where real full screen isn't to be had. */
  const [filled, setFilled] = useState(false);

  useEffect(() => {
    if (!game) return;
    const opener = document.activeElement as HTMLElement | null;
    const overflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    closeButton.current?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== "Escape") return;
      // Out of the filled window first, then out of the game.
      setFilled((f) => {
        if (!f) onClose();
        return false;
      });
    };
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = overflow;
      window.removeEventListener("keydown", onKey);
      setFilled(false);
      opener?.focus();
    };
  }, [game, onClose]);

  const root = typeof document === "undefined" ? null : document.querySelector('[data-site="home"]');
  if (!root) return null;

  // Filled, the frame takes the whole window as real full screen would, and
  // the game lays itself out for it, as it does full screen.
  const box = filled
    ? { width: "100vw", height: "100dvh" }
    : {
        aspectRatio: game?.aspect,
        width: `min(64rem, calc(100vw - 3rem), calc((100dvh - 8rem) * ${game ? ratio(game.aspect) : 16 / 9}))`,
      };

  return createPortal(
    <AnimatePresence>
      {game && (
        <motion.div
          key={game.id}
          role="dialog"
          aria-modal="true"
          aria-labelledby="game-title"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-95 flex items-center justify-center bg-black/80 p-3 sm:p-6"
          onClick={onClose}
        >
          <motion.div
            initial={{ scale: 0.96, y: 12 }}
            animate={{ scale: 1, y: 0 }}
            exit={{ scale: 0.96, y: 12 }}
            transition={{ type: "spring", stiffness: 320, damping: 30 }}
            onClick={(e) => e.stopPropagation()}
            className={cn(
              "flex max-w-full flex-col",
              filled
                ? "fixed inset-0 items-center justify-center overflow-hidden bg-black"
                : "bg-glass-strong border-glass-edge rounded-3xl border p-3 shadow-2xl",
            )}
          >
            <header className={cn("flex items-center justify-between gap-3 px-2 pb-3", filled && "hidden")}>
              {/* Side by side, or on a phone the description on a line of its own. */}
              <div className="flex min-w-0 flex-col md:flex-row md:items-baseline md:gap-3">
                <h2 id="game-title" className="font-pixel truncate text-lg">
                  {game.title}
                </h2>
                {game.description && (
                  <p className="text-muted-foreground truncate font-sans text-xs">{game.description}</p>
                )}
              </div>
              <div className="flex gap-2">
                <IconButton
                  label="Full screen"
                  onClick={async () => {
                    if (!(await enterFullscreen(frame.current))) setFilled(true);
                  }}
                >
                  <Maximize2 className="size-4" />
                </IconButton>
                <a
                  href={game.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="Open in a new tab"
                  title="Open in a new tab"
                  className="border-glass-edge text-foreground/80 hover:text-foreground grid size-10 place-items-center rounded-full border bg-white/4 transition hover:bg-white/10"
                >
                  <ExternalLink className="size-4" />
                </a>
                <IconButton ref={closeButton} label="Close" onClick={onClose}>
                  <X className="size-4" />
                </IconButton>
              </div>
            </header>
            <div
              className={cn(
                "overflow-hidden bg-black",
                !filled && "rounded-2xl",
              )}
              style={box}
            >
              <iframe
                ref={frame}
                src={game.url}
                title={game.title}
                allow="autoplay; fullscreen; gamepad"
                className="h-full w-full border-0"
              />
            </div>
            {filled && (
              <IconButton
                label="Exit full screen"
                onClick={() => setFilled(false)}
                className="absolute top-[calc(0.75rem+env(safe-area-inset-top))] right-3 bg-black/60"
              >
                <Minimize2 className="size-4" />
              </IconButton>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>,
    root,
  );
};

export default GameModal;
