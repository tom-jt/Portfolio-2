"use client";

import { AnimatedThemeToggler } from "@/components/ui/animated-theme-toggler";
import {
  MobileNav,
  MobileNavHeader,
  MobileNavMenu,
  MobileNavToggle,
  Navbar,
  NavbarLogo,
  NavBody,
  NavItems,
} from "@/components/ui/resizable-navbar";
import { PropsWithChildren, ReactNode, useState } from "react";
import NavBarIconButton from "./NavBarIconButton";
import { cn, scrollToId } from "@/lib/utils";

interface NavBarProps extends PropsWithChildren {
  children?: ReactNode;
  className?: string;
}

const NavBar = ({ children, className }: NavBarProps) => {
  const navItems = [
    {
      name: "Home",
      id: "home",
    },
    {
      name: "About",
      id: "me",
    },
    {
      name: "Projects",
      id: "projects",
    },
    {
      name: "Contact",
      id: "contact",
    },
  ];

  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  return (
    <div className={cn("relative w-full", className)}>
      <Navbar>
        {/* Desktop Navigation */}
        <NavBody>
          <NavbarLogo />
          <NavItems items={navItems} />
          <div>
            <NavBarIconButton
              children={<AnimatedThemeToggler className="cursor-pointer" />}
              className="absolute"
            />
          </div>
        </NavBody>

        {/* Mobile Navigation */}
        <MobileNav>
          <MobileNavHeader>
            <NavbarLogo />
            <div className="flex gap-4">
              <MobileNavToggle
                isOpen={isMobileMenuOpen}
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                className="cursor-pointer"
              />
              <NavBarIconButton
                children={<AnimatedThemeToggler className="cursor-pointer" />}
              />
            </div>
          </MobileNavHeader>

          <MobileNavMenu
            isOpen={isMobileMenuOpen}
            onClose={() => setIsMobileMenuOpen(false)}
          >
            {navItems.map((item, idx) => (
              <a
                key={`mobile-link-${idx}`}
                onClick={(e) => {
                  e.preventDefault();
                  setIsMobileMenuOpen(false);
                  scrollToId(item.id);
                }}
                className="relative text-zinc-600 dark:text-zinc-300 cursor-pointer w-full py-4 px-4 hover:bg-zinc-200 dark:hover:bg-zinc-600 rounded-lg transition"
              >
                <span className="block">{item.name}</span>
              </a>
            ))}
          </MobileNavMenu>
        </MobileNav>
      </Navbar>

      {children}
    </div>
  );
};

export default NavBar;
