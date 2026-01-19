import Link from "next/link";
import { PropsWithChildren, ReactNode } from "react";

interface NavBarIconButtonProps {
  className?: string;
  icon: ReactNode;
  href?: string;
}

const NavBarIconButton = ({ className, icon, href }: NavBarIconButtonProps) => {
  return (
    <Link
      href={href ?? "/"}
      className={`${className} relative z-0 cursor-pointer mask-add
      hover:text-zinc-400 transition-all`}
    >
      {icon}
    </Link>
  );
};

export default NavBarIconButton;
