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
import {
  IconBrandGithub,
  IconBrandInstagram,
  IconBrandLinkedin,
} from "@tabler/icons-react";
import { Gamepad2Icon } from "lucide-react";

interface NavBarProps extends PropsWithChildren {
  children?: ReactNode;
}

const NavBar = ({ children }: NavBarProps) => {
  const navItems = [
    {
      name: "Me",
      link: "#me",
    },
    {
      name: "Projects",
      link: "#projects",
    },
    {
      name: "Contact",
      link: "#contact",
    },
  ];

  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  return (
    <div className="relative w-full">
      <Navbar>
        {/* Desktop Navigation */}
        <NavBody>
          <NavbarLogo />
          <NavItems items={navItems} />
          <div className="flex items-center gap-4">
            <NavBarIconButton icon={<IconBrandGithub />} />
            <NavBarIconButton icon={<IconBrandLinkedin />} />
            <NavBarIconButton icon={<Gamepad2Icon />} />
            <NavBarIconButton
              icon={<AnimatedThemeToggler className="cursor-pointer" />}
              className="ml-16"
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
                icon={<AnimatedThemeToggler className="cursor-pointer" />}
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
            <div className="flex w-full gap-4 justify-center">
              <NavBarIconButton icon={<IconBrandGithub />} />
              <NavBarIconButton icon={<IconBrandLinkedin />} />
              <NavBarIconButton icon={<Gamepad2Icon />} />
            </div>
          </MobileNavMenu>
        </MobileNav>
      </Navbar>

      {children}
    </div>
  );
};

export default NavBar;
