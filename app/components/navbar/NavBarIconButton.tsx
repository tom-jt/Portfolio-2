import { cn } from "@/lib/utils";
import Link from "next/link";
import { PropsWithChildren, ReactNode } from "react";

interface NavBarIconButtonProps extends PropsWithChildren {
  className?: string;
  children: ReactNode;
  href?: string;
}

const NavBarIconButton = ({
  className,
  children,
  href,
}: NavBarIconButtonProps) => {
  const baseClasses =
    "relative z-0 cursor-pointer mask-add hover:text-zinc-400 transition-all flex justify-center items-center";

  return (
    <Link href={href ?? "/"} className={cn(className, baseClasses)}>
      {children}
    </Link>
  );
};

export default NavBarIconButton;
