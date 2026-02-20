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
import { IconBrandGithub, IconBrandLinkedin } from "@tabler/icons-react";
import { cn } from "@/lib/utils";

interface NavBarProps extends PropsWithChildren {
  children?: ReactNode;
  className?: string;
}

const NavBar = ({ children, className }: NavBarProps) => {
  const navItems = [
    {
      name: "Home",
      link: "#home",
    },
    {
      name: "About Me",
      link: "#me",
    },
    {
      name: "My Creations",
      link: "#projects",
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
                href={item.link}
                onClick={() => setIsMobileMenuOpen(false)}
                className="relative text-neutral-600 dark:text-neutral-300"
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
