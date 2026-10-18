import type { Metadata } from "next";

const description =
  "Computer Science and Law student at UNSW. Games, apps, and other creations by Tom Liu.";

export const metadata: Metadata = {
  title: "Portfolio",
  description,
  alternates: { canonical: "/cs" },
  openGraph: {
    title: "Tom Liu — Computer Science",
    description,
    url: "/cs",
    type: "website",
  },
  twitter: { title: "Tom Liu — Computer Science", description },
};

/**
 * `data-site` is set here rather than on <html> so it is server-rendered and
 * present in the first byte of HTML. Setting it from an effect would paint the
 * CS palette for a frame before swapping, which is visible on every load.
 */
export default function CsLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return <div data-site="cs">{children}</div>;
}
