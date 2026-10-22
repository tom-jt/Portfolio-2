import type { Metadata } from "next";
import { Geist, Geist_Mono, Syne } from "next/font/google";
import { SiteCurtainProvider } from "@/components/shared/SiteCurtain";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const syne = Syne({
  variable: "--font-syne",
  subsets: ["latin"],
  weight: ["600", "700", "800"],
});

/**
 * Absolute URLs are required for OG/Twitter images. Set NEXT_PUBLIC_SITE_URL
 * to the production origin at deploy time; localhost is only a dev fallback,
 * and shipping with it would emit unreachable OG image URLs.
 */
export const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: "Tom Liu",
    template: "%s — Tom Liu",
  },
  description: "Computer Science and Law student at UNSW.",
  authors: [{ name: "Tom Liu" }],
  openGraph: {
    siteName: "Tom Liu",
    locale: "en_AU",
    type: "website",
  },
  twitter: { card: "summary_large_image" },
  robots: { index: true, follow: true },
};

/**
 * Applies the stored theme before first paint so there is no flash of the
 * wrong theme. Must stay inline and synchronous — moving this into a
 * component or effect reintroduces the flash.
 *
 * Falls back to the OS preference when nothing has been stored yet. To make
 * light the default for new visitors instead, drop the matchMedia branch.
 *
 * It also applies the /home scene for the same reason: a visitor who picked
 * the sunset would otherwise see the rainy palette flash first. The key must
 * match PREFS_KEY in lib/home/scenes.ts.
 */
const themeBootScript = `
(function () {
  try {
    var stored = localStorage.getItem("theme");
    var dark = stored
      ? stored === "dark"
      : window.matchMedia("(prefers-color-scheme: dark)").matches;
    if (dark) document.documentElement.classList.add("dark");
  } catch (e) {}
  try {
    var prefs = JSON.parse(localStorage.getItem("home:prefs:v1") || "null");
    if (prefs && typeof prefs.scene === "string") {
      document.documentElement.setAttribute("data-home-scene", prefs.scene);
    }
  } catch (e) {}
})();
`;

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    // Font variables must sit on <html> so that :root can resolve them.
    // On <body> they are invisible to :root, which is why --font-display
    // silently resolved to nothing and .c-h1 fell back to the default sans.
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} ${syne.variable}`}
      suppressHydrationWarning
    >
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeBootScript }} />
      </head>
      <body className="antialiased">
        {/* Lives above the route segments so the curtain survives the
            navigation it is covering. Mounted in a [data-site] wrapper it
            would unmount mid-sweep. */}
        <SiteCurtainProvider>{children}</SiteCurtainProvider>
      </body>
    </html>
  );
}
