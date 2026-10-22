"use client";

import { AnimatePresence, motion } from "motion/react";
import { Droplet, Info, Sparkles, Trophy, X } from "lucide-react";
import { formatNumber } from "@/lib/home/format";
import { dismissToast, useToasts, type ToastKind } from "@/lib/home/toasts";
import { cn } from "@/lib/utils";

const ICON: Record<ToastKind, typeof Droplet> = {
  reward: Droplet,
  level: Sparkles,
  achievement: Trophy,
  info: Info,
};

/**
 * Rewards land top centre, the one edge of the scene the controls leave
 * free. The list is a polite live region so screen readers hear them too.
 */
const RewardToasts = () => {
  const toasts = useToasts();

  return (
    <div
      aria-live="polite"
      className="pointer-events-none fixed top-4 left-1/2 z-90 flex w-[min(22rem,calc(100vw-2rem))] -translate-x-1/2 flex-col items-center gap-2"
    >
      <AnimatePresence initial={false}>
        {toasts.map((t) => {
          const Icon = ICON[t.kind];
          const big = t.kind === "level";
          return (
            <motion.div
              key={t.id}
              layout
              initial={{ opacity: 0, y: -12, scale: 0.96 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -12, transition: { duration: 0.2 } }}
              transition={{ type: "spring", stiffness: 380, damping: 30 }}
              className={cn(
                "bg-glass-strong border-glass-edge pointer-events-auto flex w-full items-start gap-3 rounded-2xl border p-3.5 shadow-[0_18px_40px_-18px_rgb(0_0_0/0.8)] backdrop-blur-xl",
                big && "border-glow/60 shadow-[0_0_40px_-10px_var(--glow)]",
              )}
            >
              <span
                className={cn(
                  "grid size-8 shrink-0 place-items-center rounded-full",
                  t.kind === "info"
                    ? "bg-white/8 text-muted-foreground"
                    : "bg-glow/15 text-glow",
                )}
              >
                <Icon className="size-4" />
              </span>
              <div className="min-w-0 flex-1">
                <p
                  className={cn(
                    "leading-tight font-semibold",
                    big ? "font-display text-xl" : "text-sm",
                  )}
                >
                  {t.title}
                </p>
                {t.detail && (
                  <p className="text-muted-foreground mt-0.5 text-xs leading-snug">
                    {t.detail}
                  </p>
                )}
                {(t.drops || t.xp) && (
                  <p className="font-pixel mt-1 flex items-center gap-3 text-sm">
                    {t.drops ? (
                      <span className="text-glow-2 flex items-center gap-1">
                        <Droplet className="size-3.5" />+{formatNumber(t.drops)}
                      </span>
                    ) : null}
                    {t.xp ? <span className="text-glow">+{t.xp} xp</span> : null}
                  </p>
                )}
              </div>
              <button
                type="button"
                onClick={() => dismissToast(t.id)}
                aria-label="Dismiss"
                className="text-muted-foreground hover:text-foreground -m-1 cursor-pointer p-1"
              >
                <X className="size-3.5" />
              </button>
            </motion.div>
          );
        })}
      </AnimatePresence>
    </div>
  );
};

export default RewardToasts;
