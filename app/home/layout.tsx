import type { Metadata, Viewport } from "next";
import { Instrument_Serif, Tiny5 } from "next/font/google";
import HomeShell from "@/components/home/HomeShell";

const instrument = Instrument_Serif({
  variable: "--font-instrument",
  subsets: ["latin"],
  weight: "400",
});

/** Pixel face for game numbers. Chosen over Pixelify Sans, whose 2 and 5
 *  read as Z and S at small sizes, which is fatal for a score. */
const pixel = Tiny5({
  variable: "--font-pixel-face",
  subsets: ["latin"],
  weight: "400",
});

const description =
  "A rainy little corner of the internet: a focus timer, a to-do list, an idle garden that grows as you work, and small web games by Tom Liu.";

export const metadata: Metadata = {
  title: "Home",
  description,
  alternates: { canonical: "/home" },
  openGraph: {
    title: "Tom's room",
    description,
    url: "/home",
    type: "website",
  },
  twitter: { title: "Tom's room", description },
  // Installable as an app: its manifest, and what iPhones read instead.
  manifest: "/home/manifest.webmanifest",
  appleWebApp: { capable: true, title: "room", statusBarStyle: "black" },
  icons: { apple: "/home/icons/apple-touch-icon.png" },
};

/** The browser and app chrome's colour; HomeShell keeps it to the scene's. */
export const viewport: Viewport = { themeColor: "#0a0f1f" };

/**
 * Like the law layout, the fonts are loaded here so the portfolio sites never
 * download them, and their variables sit on the same element as
 * `data-site="home"` so the palette's font tokens resolve.
 */
export default function HomeLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <HomeShell className={`${instrument.variable} ${pixel.variable}`}>
      {children}
    </HomeShell>
  );
}
