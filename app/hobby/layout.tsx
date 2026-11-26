import type { Metadata } from "next";
import { Fraunces, Instrument_Sans, Nanum_Pen_Script } from "next/font/google";

/** Titles: a soft, slightly wonky serif, like a label on a scrapbook page. */
const fraunces = Fraunces({
  variable: "--font-fraunces",
  subsets: ["latin"],
  style: ["normal", "italic"],
  axes: ["SOFT", "WONK", "opsz"],
});

const instrument = Instrument_Sans({
  variable: "--font-isans",
  subsets: ["latin"],
});

/** Handwriting: quips, tags, notes, and the stamps. */
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
      className={`${fraunces.variable} ${instrument.variable} ${nanum.variable} bg-background text-foreground min-h-dvh`}
    >
      {children}
    </div>
  );
}
