import { cn } from "@/lib/utils";
import { PropsWithChildren, ReactNode } from "react";

interface ButtonProps extends PropsWithChildren {
  className?: string;
  children?: ReactNode;
  href?: string;
  onClick: () => void;
}

const Button = ({ className, children, href, onClick }: ButtonProps) => {
  return (
    <a
      href={href ?? ""}
      onClick={(e) => {
        e.preventDefault();
        onClick();
      }}
      className={cn(
        "text-muted-foreground bg-card border-border hover:bg-nav-pill cursor-pointer transform rounded-md border-2 px-4 py-2 text-base transition duration-200 hover:-translate-y-1 hover:shadow-md",
        className,
      )}
    >
      {children}
    </a>
  );
};

export default Button;
