import { PropsWithChildren, ReactNode } from "react";

interface ButtonProps extends PropsWithChildren {
  children?: ReactNode;
  href: string;
}

const Button = ({ children, href }: ButtonProps) => {
  return (
    <a
      href={href}
      className="
        px-4 py-2
        text-neutral-500 text-base
        bg-white
        rounded-md border-2 border-zinc-100
        dark:text-neutral-300 hover:bg-zinc-100 hover:-translate-y-1 transform transition duration-200 hover:shadow-md dark:bg-black dark:border-zinc-800 dark:hover:bg-zinc-800
      "
    >
      {children}
    </a>
  );
};

export default Button;
