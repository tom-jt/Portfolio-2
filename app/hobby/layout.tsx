import type { Metadata } from "next";
import { Bricolage_Grotesque, Inter, Nanum_Pen_Script } from "next/font/google";

const bricolage = Bricolage_Grotesque({
  variable: "--font-bricolage",
  subsets: ["latin"],
  weight: ["600", "700"],
});

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

/** Handwriting, for the quips and empty states only, never card content. */
const nanum = Nanum_Pen_Script({
  variable: "--font-nanum",
  subsets: ["latin"],
  weight: "400",
});

const description =
  "Tom Liu's hobbies: magic, ice skating, balisong, and piano, and the things learnt along the way.";

export const metadata: Metadata = {
  title: { default: "Hobbies", template: "%s | Hobbies | Tom Liu" },
  description,
  alternates: { canonical: "/hobby" },
  openGraph: {
    title: "Tom Liu — Hobbies",
    description,
    url: "/hobby",
    type: "website",
  },
  twitter: { title: "Tom Liu — Hobbies", description },
};

/**
 * Like the law and home layouts, the fonts load here so the other sites never
 * download them, and their variables sit on the same element as
 * data-site="hobby" so the palette's font tokens resolve.
 */
export default function HobbyLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <div
      data-site="hobby"
      className={`${bricolage.variable} ${inter.variable} ${nanum.variable} bg-background text-foreground min-h-dvh`}
    >
      {children}
    </div>
  );
}
