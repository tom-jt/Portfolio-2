"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { Scale, Code2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { useSiteCurtain } from "./SiteCurtain";

interface SiteSwitcherProps {
  /** The site being switched TO. */
  to: "cs" | "law";
  className?: string;
  /** Show a text label beside the icon (used in the mobile menu). */
  withLabel?: boolean;
}

const SiteSwitcher = ({ to, className, withLabel }: SiteSwitcherProps) => {
  const { switchTo, busy } = useSiteCurtain();
  const router = useRouter();

  // Prefetch so the curtain's cover phase is not waiting on a cold route.
  useEffect(() => {
    router.prefetch(to === "law" ? "/law" : "/cs");
  }, [router, to]);

  const Icon = to === "law" ? Scale : Code2;
  const label = to === "law" ? "Law portfolio" : "CS portfolio";

  return (
    <button
      type="button"
      onClick={() => switchTo(to)}
      disabled={busy}
      aria-label={`Switch to ${label}`}
      title={`Switch to ${label}`}
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
