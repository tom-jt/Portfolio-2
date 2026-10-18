import { ImageResponse } from "next/og";
import { loadGoogleFont } from "@/lib/og-font";

export const alt = "Tom Liu — Computer Science";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

const TITLE = "Tom Liu";
const EYEBROW = "COMPUTER SCIENCE · UNSW SYDNEY";
const TAGLINE = "Games, apps, and other creations.";

const GROUND = "#fafafa";
const INK = "#09090b";
const MUTED = "#71717a";

export default async function Image() {
  const display = await loadGoogleFont(
    "Syne",
    800,
    TITLE + EYEBROW + TAGLINE,
  );

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          background: GROUND,
          position: "relative",
        }}
      >
        <div
          style={{
            display: "flex",
            color: MUTED,
            fontSize: 22,
            letterSpacing: 8,
            marginBottom: 24,
          }}
        >
          {EYEBROW}
        </div>

        <div
          style={{
            display: "flex",
            color: INK,
            fontSize: 132,
            lineHeight: 1,
            fontFamily: display ? "Display" : undefined,
          }}
        >
          {TITLE}
        </div>

        <div
          style={{
            display: "flex",
            width: 320,
            height: 3,
            background: INK,
            margin: "36px 0",
          }}
        />

        <div style={{ display: "flex", color: MUTED, fontSize: 28 }}>
          {TAGLINE}
        </div>
      </div>
    ),
    {
      ...size,
      fonts: display
        ? [{ name: "Display", data: display, style: "normal", weight: 800 }]
        : [],
    },
  );
}
