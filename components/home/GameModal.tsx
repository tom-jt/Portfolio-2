"use client";

import { useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { AnimatePresence, motion } from "motion/react";
import { ExternalLink, Maximize2, X } from "lucide-react";
import type { ArcadeGame } from "@/data/home/games";
import { IconButton } from "./ui";

/** "16/9" → 1.777… Falls back to 16:9 for anything it can't read. */
function ratio(aspect: string) {
  const [w, h] = aspect.split("/").map(Number);
  return w > 0 && h > 0 ? w / h : 16 / 9;
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

  useEffect(() => {
    if (!game) return;
    const opener = document.activeElement as HTMLElement | null;
    const overflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    closeButton.current?.focus();
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = overflow;
      window.removeEventListener("keydown", onKey);
      opener?.focus();
    };
  }, [game, onClose]);

  const root = typeof document === "undefined" ? null : document.querySelector('[data-site="home"]');
  if (!root) return null;

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
            className="bg-glass-strong border-glass-edge flex max-w-full flex-col rounded-3xl border p-3 shadow-2xl"
          >
            <header className="flex items-center justify-between gap-3 px-2 pb-3">
              <h2 id="game-title" className="font-pixel truncate text-lg">
                {game.title}
              </h2>
              <div className="flex gap-2">
                <IconButton label="Full screen" onClick={() => frame.current?.requestFullscreen?.()}>
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
              className="overflow-hidden rounded-2xl bg-black"
              style={{
                aspectRatio: game.aspect,
                width: `min(64rem, calc(100vw - 3rem), calc((100dvh - 8rem) * ${ratio(game.aspect)}))`,
              }}
            >
              <iframe
                ref={frame}
                src={game.url}
                title={game.title}
                allow="autoplay; fullscreen; gamepad"
                className="h-full w-full border-0"
              />
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>,
    root,
  );
};

export default GameModal;
