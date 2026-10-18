import type { Metadata } from "next";
import { Cormorant_Garamond, Inter } from "next/font/google";

const cormorant = Cormorant_Garamond({
  variable: "--font-cormorant",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
});

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

const description =
  "Law student at UNSW. Legal experience, competitions, and writing by Tom Liu.";

export const metadata: Metadata = {
  title: "Law",
  description,
  alternates: { canonical: "/law" },
  openGraph: {
    title: "Tom Liu — Law",
    description,
    url: "/law",
    type: "website",
  },
  twitter: { title: "Tom Liu — Law", description },
};

/**
 * Law fonts are loaded here rather than in the root layout so CS visitors
 * never download them.
 *
 * The wrapper carries both `data-site` (which selects the law palette) and
 * the font variables, so `[data-site="law"] { --font-display-family:
 * var(--font-cormorant) }` resolves against a variable defined on the very
 * same element.
 */
export default function LawLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <div
      data-site="law"
      className={`${cormorant.variable} ${inter.variable} bg-background text-foreground min-h-dvh`}
    >
      {children}
    </div>
  );
}
