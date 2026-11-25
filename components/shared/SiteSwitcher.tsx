"use client";

import { useEffect, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { Scale, Code2, CloudRain, Shapes } from "lucide-react";
import { cn } from "@/lib/utils";
import { SITE_HREF, useSiteCurtain, type Site } from "./SiteCurtain";

const ICON = { law: Scale, cs: Code2, home: CloudRain, hobby: Shapes };
const LABEL = {
  law: "Law portfolio",
  cs: "CS portfolio",
  home: "Home",
  hobby: "Hobbies",
};

interface SiteSwitcherProps {
  /** The site being switched TO. */
  to: Site;
  className?: string;
  /** Show a text label beside the icon (used in the mobile menu). */
  withLabel?: boolean;
  /** Drawn instead of the site's own icon. */
  icon?: ReactNode;
  /** Replaces the text label, for sites with their own casing (/home). */
  label?: string;
  /** Runs after the click, before the curtain, e.g. to close a menu. */
  onSwitch?: () => void;
}

const SiteSwitcher = ({
  to,
  className,
  withLabel,
  icon,
  label: labelText,
  onSwitch,
}: SiteSwitcherProps) => {
  const { switchTo, busy } = useSiteCurtain();
  const router = useRouter();

  // Prefetch so the curtain's cover phase is not waiting on a cold route.
  useEffect(() => {
    router.prefetch(SITE_HREF[to]);
  }, [router, to]);

  const Icon = ICON[to];
  const label = LABEL[to];
  const title =
    to === "home"
      ? "Go home"
      : to === "hobby"
        ? "Go to Hobbies"
        : `Switch to ${label}`;

  return (
    <button
      type="button"
      onClick={() => {
        onSwitch?.();
        switchTo(to);
      }}
      disabled={busy}
      aria-label={title}
      title={title}
      className={cn(
        "flex cursor-pointer items-center gap-2 transition-all disabled:cursor-wait disabled:opacity-50",
        className,
      )}
    >
      {icon ?? <Icon size={20} />}
      {withLabel ? <span>{labelText ?? label}</span> : null}
    </button>
  );
};

export default SiteSwitcher;
