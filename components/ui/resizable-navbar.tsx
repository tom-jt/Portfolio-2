"use client";
import { cn, scrollToId } from "@/lib/utils";
import { IconMenu2, IconX } from "@tabler/icons-react";
import {
  motion,
  AnimatePresence,
  useScroll,
  useMotionValueEvent,
} from "motion/react";
import Image from "next/image";
import {
  GLASS_SCROLL_THRESHOLD,
  GLASS_SHADOW,
  GLASS_TRANSITION,
} from "@/components/shared/glass";

import React, { useRef, useState } from "react";

interface NavbarProps {
  children: React.ReactNode;
  className?: string;
}

interface NavBodyProps {
  children: React.ReactNode;
  className?: string;
  visible?: boolean;
}

interface NavItemsProps {
  items: {
    name: string;
    id: string;
  }[];
  className?: string;
}

interface MobileNavProps {
  children: React.ReactNode;
  className?: string;
  visible?: boolean;
}

interface MobileNavHeaderProps {
  children: React.ReactNode;
  className?: string;
}

interface MobileNavMenuProps {
  children: React.ReactNode;
  className?: string;
  isOpen: boolean;
  onClose: () => void;
}

export const Navbar = ({ children, className }: NavbarProps) => {
  const ref = useRef<HTMLDivElement>(null);
  const { scrollY } = useScroll({
    target: ref,
    offset: ["start start", "end start"],
  });
  const [visible, setVisible] = useState<boolean>(false);

  useMotionValueEvent(scrollY, "change", (latest) => {
    setVisible(latest > GLASS_SCROLL_THRESHOLD);
  });

  return (
    <motion.div
      ref={ref}
      className={cn("fixed inset-x-0 top-1 z-[100] w-full select-none", className)}
    >
      {React.Children.map(children, (child) =>
        React.isValidElement(child)
          ? React.cloneElement(
              child as React.ReactElement<{ visible?: boolean }>,
              { visible },
            )
          : child,
      )}
    </motion.div>
  );
};

export const NavBody = ({ children, className, visible }: NavBodyProps) => {
  return (
    <motion.div
      animate={{
        backdropFilter: visible ? "blur(3px)" : "none",
        boxShadow: visible
          ? GLASS_SHADOW
          : "none",
        width: visible ? "40%" : "100%",
        y: visible ? 25 : 0,
      }}
      transition={GLASS_TRANSITION}
      style={{
        minWidth: "800px",
      }}
      className={cn(
        "relative z-60 mx-auto hidden w-full max-w-7xl flex-row items-center justify-between self-start rounded-full bg-transparent px-4 py-2 lg:flex dark:bg-transparent",
        visible && "bg-nav-surface/80",
        className,
      )}
    >
      {children}
    </motion.div>
  );
};

export const NavItems = ({ items, className }: NavItemsProps) => {
  const [hovered, setHovered] = useState<number | null>(null);

  return (
    <motion.div
      onMouseLeave={() => setHovered(null)}
      className={cn(
        "text-nav-fg hover:text-nav-fg-hover absolute inset-0 hidden flex-1 flex-row items-center justify-center space-x-2 text-sm font-medium transition duration-200 lg:flex lg:space-x-2",
        className,
      )}
    >
      {items.map((item, idx) => (
        <a
          href={`#${item.id}`}
          onMouseEnter={() => setHovered(idx)}
          onClick={(e) => {
            e.preventDefault();
            scrollToId(item.id);
          }}
          className="text-nav-fg relative cursor-pointer px-4 py-2"
          key={`link-${idx}`}
        >
          {hovered === idx && (
            <motion.div
              layoutId="hovered"
              className="bg-nav-pill absolute inset-0 h-full w-full rounded-full"
            />
          )}
          <span className="relative z-20">{item.name}</span>
        </a>
      ))}
    </motion.div>
  );
};

export const MobileNav = ({ children, className, visible }: MobileNavProps) => {
  return (
    <motion.div
      animate={{
        backdropFilter: visible ? "blur(10px)" : "none",
        boxShadow: visible
          ? GLASS_SHADOW
          : "none",
        width: visible ? "90%" : "100%",
        paddingRight: visible ? "12px" : "0px",
        paddingLeft: visible ? "12px" : "0px",
        borderRadius: visible ? "4px" : "2rem",
        y: visible ? 20 : 0,
      }}
      transition={GLASS_TRANSITION}
      className={cn(
        "relative z-50 mx-auto flex w-full max-w-[calc(100vw-2rem)] flex-col items-center justify-between bg-transparent px-0 py-2 lg:hidden select-none",
        visible && "bg-nav-surface/80",
        className,
      )}
    >
      {children}
    </motion.div>
  );
};

export const MobileNavHeader = ({
  children,
  className,
}: MobileNavHeaderProps) => {
  return (
    <div
      className={cn(
        "flex w-full flex-row items-center justify-between",
        className,
      )}
    >
      {children}
    </div>
  );
};

export const MobileNavMenu = ({
  children,
  className,
  isOpen,
  onClose,
}: MobileNavMenuProps) => {
  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className={cn(
            "bg-nav-surface absolute inset-x-0 top-16 z-50 flex w-full flex-col items-start justify-start rounded-lg px-4 py-8 shadow-[0_0_24px_rgba(34,42,53,0.06),0_1px_1px_rgba(0,0,0,0.05),0_0_0_1px_rgba(34,42,53,0.04),0_0_4px_rgba(34,42,53,0.08),0_16px_68px_rgba(47,48,55,0.05),0_1px_0_rgba(255,255,255,0.1)_inset]",
            className,
          )}
        >
          {children}
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export const MobileNavToggle = ({
  className,
  isOpen,
  onClick,
}: {
  className?: string;
  isOpen: boolean;
  onClick: () => void;
}) => {
  return isOpen ? (
    <IconX
      className={cn("text-foreground", className)}
      onClick={onClick}
    />
  ) : (
    <IconMenu2
      className={cn("text-foreground", className)}
      onClick={onClick}
    />
  );
};

interface NavbarLogoProps {
  /** Light-theme mark. Ignored when `children` is supplied. */
  src?: string;
  /** Dark-theme mark. Ignored when `children` is supplied. */
  darkSrc?: string;
  alt?: string;
  size?: number;
  /** Defaults to scrolling to the `home` anchor. */
  onClick?: () => void;
  /** Replaces the images entirely — for an inline SVG mark, say. */
  children?: React.ReactNode;
  className?: string;
  /** Real href so the link is crawlable; the click is still intercepted. */
  href?: string;
  /**
   * The mark itself is aria-hidden, so the link needs its own name —
   * without this the logo is an unlabelled link to screen readers.
   */
  ariaLabel?: string;
}

export const NavbarLogo = ({
  src = "/images/logos/LogoSimpleTrans.png",
  darkSrc = "/images/logos/LogoSimpleDarkTrans.png",
  alt = "logo",
  size = 30,
  onClick,
  children,
  className,
  href = "#home",
  ariaLabel = "Home",
}: NavbarLogoProps) => {
  return (
    <a
      href={href}
      aria-label={ariaLabel}
      className={cn("relative z-20 cursor-pointer px-2 py-1", className)}
      onClick={(e) => {
        e.preventDefault();
        if (onClick) onClick();
        else scrollToId("home");
      }}
    >
      {children ?? (
        <>
          <Image
            src={src}
            alt={alt}
            width={size}
            height={size}
            className="dark:hidden"
          />
          <Image
            src={darkSrc}
            alt={alt}
            width={size}
            height={size}
            className="hidden dark:block"
          />
        </>
      )}
    </a>
  );
};

export const NavbarButton = ({
  href,
  as: Tag = "a",
  children,
  className,
  variant = "primary",
  ...props
}: {
  href?: string;
  as?: React.ElementType;
  children: React.ReactNode;
  className?: string;
  variant?: "primary" | "secondary" | "dark" | "gradient";
} & (
  | React.ComponentPropsWithoutRef<"a">
  | React.ComponentPropsWithoutRef<"button">
)) => {
  const baseStyles =
    "px-4 py-2 rounded-md bg-white button bg-white text-black text-sm font-bold relative cursor-pointer hover:-translate-y-0.5 transition duration-200 inline-block text-center";

  const variantStyles = {
    primary:
      "shadow-[0_0_24px_rgba(34,_42,_53,_0.06),_0_1px_1px_rgba(0,_0,_0,_0.05),_0_0_0_1px_rgba(34,_42,_53,_0.04),_0_0_4px_rgba(34,_42,_53,_0.08),_0_16px_68px_rgba(47,_48,_55,_0.05),_0_1px_0_rgba(255,_255,_255,_0.1)_inset]",
    secondary: "bg-transparent shadow-none dark:text-white",
    dark: "bg-black text-white shadow-[0_0_24px_rgba(34,_42,_53,_0.06),_0_1px_1px_rgba(0,_0,_0,_0.05),_0_0_0_1px_rgba(34,_42,_53,_0.04),_0_0_4px_rgba(34,_42,_53,_0.08),_0_16px_68px_rgba(47,_48,_55,_0.05),_0_1px_0_rgba(255,_255,_255,_0.1)_inset]",
    gradient:
      "bg-gradient-to-b from-blue-500 to-blue-700 text-white shadow-[0px_2px_0px_0px_rgba(255,255,255,0.3)_inset]",
  };

  return (
    <Tag
      href={href || undefined}
      className={cn(baseStyles, variantStyles[variant], className)}
      {...props}
    >
      {children}
    </Tag>
  );
};
