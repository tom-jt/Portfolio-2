import Link from "next/link";
import { ReactNode } from "react";

interface NavBarIconButtonProps {
  icon: ReactNode;
  href?: string;
}

const NavBarIconButton = ({ icon, href }: NavBarIconButtonProps) => {
  return (
    <Link href={href ?? "/"} className="z-0 cursor-pointer">
      {icon}
    </Link>
  );
};

export default NavBarIconButton;
