"use client";

import { useState, PropsWithChildren } from "react";
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
import { AnimatedThemeToggler } from "@/components/ui/animated-theme-toggler";
import SiteSwitcher from "@/components/shared/SiteSwitcher";
import SealMark from "@/components/law/SealMark";
import { cn, scrollToId } from "@/lib/utils";

const navItems = [
  { name: "Home", id: "home" },
  { name: "About", id: "me" },
  { name: "Timeline", id: "timeline" },
  { name: "Contact", id: "contact" },
];

const NavBar = ({
  children,
  className,
}: PropsWithChildren<{ className?: string }>) => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  return (
    <div className={cn("relative w-full", className)}>
      <Navbar>
        <NavBody>
          <NavbarLogo onClick={() => scrollToId("home")}>
            <SealMark size={34} />
          </NavbarLogo>
          <NavItems items={navItems} />
          <div className="text-nav-fg relative z-20 flex items-center gap-5">
            <SiteSwitcher to="cs" className="hover:text-nav-fg-hover" />
            <AnimatedThemeToggler className="hover:text-nav-fg-hover cursor-pointer transition-colors" />
          </div>
        </NavBody>

        <MobileNav>
          <MobileNavHeader>
            <NavbarLogo onClick={() => scrollToId("home")}>
              <SealMark size={30} />
            </NavbarLogo>
            <div className="text-nav-fg flex items-center gap-4">
              <SiteSwitcher to="cs" />
              <AnimatedThemeToggler className="cursor-pointer" />
              <MobileNavToggle
                isOpen={isMobileMenuOpen}
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                className="cursor-pointer"
              />
            </div>
          </MobileNavHeader>

          <MobileNavMenu
            isOpen={isMobileMenuOpen}
            onClose={() => setIsMobileMenuOpen(false)}
          >
            {navItems.map((item, idx) => (
              <a
                key={`law-mobile-${idx}`}
                onClick={(e) => {
                  e.preventDefault();
                  setIsMobileMenuOpen(false);
                  scrollToId(item.id);
                }}
                className="text-nav-fg hover:bg-nav-pill hover:text-nav-fg-hover w-full cursor-pointer px-4 py-4 transition-colors"
              >
                {item.name}
              </a>
            ))}
            <div className="border-border text-nav-fg mt-2 w-full border-t px-4 pt-4">
              <SiteSwitcher to="cs" withLabel className="text-sm" />
            </div>
          </MobileNavMenu>
        </MobileNav>
      </Navbar>

      {children}
    </div>
  );
};

export default NavBar;
