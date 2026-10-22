"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { Scale, Code2, CloudRain } from "lucide-react";
import { cn } from "@/lib/utils";
import { SITE_HREF, useSiteCurtain, type Site } from "./SiteCurtain";

const ICON = { law: Scale, cs: Code2, home: CloudRain };
const LABEL = { law: "Law portfolio", cs: "CS portfolio", home: "Home" };

interface SiteSwitcherProps {
  /** The site being switched TO. */
  to: Site;
  className?: string;
  /** Show a text label beside the icon (used in the mobile menu). */
  withLabel?: boolean;
}

const SiteSwitcher = ({ to, className, withLabel }: SiteSwitcherProps) => {
  const { switchTo, busy } = useSiteCurtain();
  const router = useRouter();

  // Prefetch so the curtain's cover phase is not waiting on a cold route.
  useEffect(() => {
    router.prefetch(SITE_HREF[to]);
  }, [router, to]);

  const Icon = ICON[to];
  const label = LABEL[to];

  return (
    <button
      type="button"
      onClick={() => switchTo(to)}
      disabled={busy}
      aria-label={to === "home" ? "Go home" : `Switch to ${label}`}
      title={to === "home" ? "Go home" : `Switch to ${label}`}
      className={cn(
        "flex cursor-pointer items-center gap-2 transition-all disabled:cursor-wait disabled:opacity-50",
        className,
      )}
    >
      <Icon size={20} />
      {withLabel ? <span>{label}</span> : null}
    </button>
  );
};

export default SiteSwitcher;
