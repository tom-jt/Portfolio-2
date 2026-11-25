"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
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
import { HOBBIES, type HobbyId } from "@/data/hobby/hobbies";
import { cn } from "@/lib/utils";

const items = HOBBIES.map((h) => ({ name: h.name, id: h.id, href: `/hobby/${h.id}` }));

/**
 * The same navbar as /cs and /law, with the hobbies as its items. `leave`
 * runs before switching hobby and can cancel it, for unsaved edits.
 */
const HobbyNav = ({ hobby, leave }: { hobby: HobbyId; leave: () => boolean }) => {
  const router = useRouter();
  const [menuOpen, setMenuOpen] = useState(false);

  const go = (id: string) => {
    if (id === hobby || !leave()) return;
    setMenuOpen(false);
    router.push(`/hobby/${id}`);
  };
  const top = () => window.scrollTo({ top: 0, behavior: "smooth" });

  return (
    <Navbar>
      <NavBody>
        <NavbarLogo href="/hobby" ariaLabel="Back to the top" onClick={top} />
        <NavItems items={items} activeId={hobby} onSelect={go} />
        <div className="text-nav-fg relative z-20 flex items-center gap-5">
          <SiteSwitcher to="home" className="hover:text-nav-fg-hover" />
          <SiteSwitcher to="cs" className="hover:text-nav-fg-hover" />
          <SiteSwitcher to="law" className="hover:text-nav-fg-hover" />
          <AnimatedThemeToggler className="hover:text-nav-fg-hover cursor-pointer transition-colors" />
        </div>
      </NavBody>

      <MobileNav>
        <MobileNavHeader>
          <NavbarLogo href="/hobby" ariaLabel="Back to the top" onClick={top} />
          <div className="text-nav-fg flex items-center gap-4">
            <AnimatedThemeToggler className="cursor-pointer" />
            <MobileNavToggle
              isOpen={menuOpen}
              onClick={() => setMenuOpen(!menuOpen)}
              className="cursor-pointer"
            />
          </div>
        </MobileNavHeader>

        <MobileNavMenu isOpen={menuOpen} onClose={() => setMenuOpen(false)}>
          {items.map((item) => (
            <a
              key={item.id}
              href={item.href}
              aria-current={item.id === hobby ? "page" : undefined}
              onClick={(e) => {
                e.preventDefault();
                if (item.id === hobby) setMenuOpen(false);
                else go(item.id);
              }}
              className={cn(
                "text-nav-fg hover:bg-nav-pill hover:text-nav-fg-hover flex w-full cursor-pointer items-center gap-2.5 rounded-lg px-4 py-4 transition",
                item.id === hobby && "bg-nav-pill text-nav-fg-hover",
              )}
            >
              <span data-hobby={item.id} className={cn("size-1.5 rounded-full", item.id === hobby ? "bg-hb" : "bg-transparent")} />
              {item.name}
            </a>
          ))}
          <div className="border-border text-nav-fg mt-2 flex w-full flex-col gap-4 border-t px-4 pt-4">
            <SiteSwitcher to="home" withLabel className="text-sm" />
            <SiteSwitcher to="cs" withLabel className="text-sm" />
            <SiteSwitcher to="law" withLabel className="text-sm" />
          </div>
        </MobileNavMenu>
      </MobileNav>
    </Navbar>
  );
};

export default HobbyNav;
