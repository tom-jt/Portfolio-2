"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { AnimatePresence, motion } from "motion/react";
import SiteSwitcher from "@/components/shared/SiteSwitcher";
import { chipGlass } from "./ui";

/**
 * The TL mark, opening onto Tom's other sites: the two portfolios and the
 * hobbies. One button at every width keeps the room's corner uncluttered.
 */
const SitesMenu = () => {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const away = (e: PointerEvent) => {
      if (!ref.current?.contains(e.target as Node)) setOpen(false);
    };
    const esc = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("pointerdown", away);
    document.addEventListener("keydown", esc);
    return () => {
      document.removeEventListener("pointerdown", away);
      document.removeEventListener("keydown", esc);
    };
  }, [open]);

  const item =
    "text-muted-foreground hover:text-foreground w-full rounded-xl px-3 py-2.5 text-sm transition hover:bg-white/8";

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        aria-expanded={open}
        aria-label="tom's other sites"
        title="tom's other sites"
        onClick={() => setOpen((o) => !o)}
        className="focus-visible:ring-ring grid size-10 cursor-pointer place-items-center rounded-full transition hover:bg-white/8 focus-visible:ring-2 focus-visible:outline-none"
      >
        <Image src="/images/logos/LogoSimpleDarkTrans.png" alt="" width={24} height={24} />
      </button>
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -6, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -6, scale: 0.97 }}
            transition={{ duration: 0.17 }}
            className={`${chipGlass} absolute top-12 right-0 z-30 flex w-48 flex-col gap-0.5 rounded-2xl p-1.5`}
          >
            <SiteSwitcher to="cs" withLabel label="cs portfolio" className={item} onSwitch={() => setOpen(false)} />
            <SiteSwitcher to="law" withLabel label="law portfolio" className={item} onSwitch={() => setOpen(false)} />
            <SiteSwitcher to="hobby" withLabel label="hobbies" className={item} onSwitch={() => setOpen(false)} />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default SitesMenu;
