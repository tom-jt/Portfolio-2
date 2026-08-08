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
        "cursor-pointer px-4 py-2 text-zinc-500 text-base bg-white rounded-md border-2 border-zinc-100 dark:text-zinc-300 hover:bg-zinc-100 hover:-translate-y-1 transform transition duration-200 hover:shadow-md dark:bg-black dark:border-zinc-800 dark:hover:bg-zinc-800",
        className,
      )}
    >
      {children}
    </a>
  );
};

export default Button;
