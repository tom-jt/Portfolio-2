import { cn } from "@/lib/utils";
import Link from "next/link";
import { PropsWithChildren, ReactNode } from "react";

interface NavBarIconButtonProps extends PropsWithChildren {
  className?: string;
  children: ReactNode;
  href?: string;
}

const baseClasses =
  "relative z-0 cursor-pointer mask-add hover:text-zinc-400 transition-all flex justify-center items-center";

const NavBarIconButton = ({
  className,
  children,
  href,
}: NavBarIconButtonProps) => {
  // With no href this is just a wrapper around an already-interactive child,
  // such as the theme toggler. Defaulting to <Link href="/"> meant every
  // click navigated home — which now redirects to /cs and reloads the page.
  if (!href) {
    return <span className={cn(className, baseClasses)}>{children}</span>;
  }

  return (
    <Link href={href} className={cn(className, baseClasses)}>
      {children}
    </Link>
  );
};

export default NavBarIconButton;
