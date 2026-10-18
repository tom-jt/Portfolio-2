import { ImageResponse } from "next/og";
import { loadGoogleFont } from "@/lib/og-font";

export const alt = "Tom Liu — Law";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

const TITLE = "Tom Liu";
const EYEBROW = "BACHELOR OF LAWS · UNSW SYDNEY";
const TAGLINE = "Legal experience, competitions, and writing.";

const GOLD = "#d4af37";
const GROUND = "#0b0a0c";
const INK = "#f5f1e8";

export default async function Image() {
  const serif = await loadGoogleFont(
    "Cormorant Garamond",
    600,
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
        {/* Certificate rule, echoing the hero */}
        <div
          style={{
            position: "absolute",
            top: 36,
            left: 36,
            right: 36,
            bottom: 36,
            border: `2px solid ${GOLD}`,
            opacity: 0.45,
            display: "flex",
          }}
        />

        {/* Seal */}
        <div
          style={{
            width: 132,
            height: 132,
            borderRadius: 132,
            border: `3px solid ${GOLD}`,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            marginBottom: 34,
          }}
        >
          <div
            style={{
              width: 112,
              height: 112,
              borderRadius: 112,
              border: `1px solid ${GOLD}`,
              opacity: 0.8,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: GOLD,
              fontSize: 46,
              fontFamily: serif ? "Display" : undefined,
            }}
          >
            TL
          </div>
        </div>

        <div
          style={{
            display: "flex",
            color: GOLD,
            fontSize: 22,
            letterSpacing: 8,
            marginBottom: 20,
          }}
        >
          {EYEBROW}
        </div>

        <div
          style={{
            display: "flex",
            color: INK,
            fontSize: 118,
            lineHeight: 1,
            fontFamily: serif ? "Display" : undefined,
          }}
        >
          {TITLE}
        </div>

        <div
          style={{
            display: "flex",
            width: 320,
            height: 2,
            background: GOLD,
            opacity: 0.6,
            margin: "32px 0",
          }}
        />

        <div style={{ display: "flex", color: "#a29a8e", fontSize: 28 }}>
          {TAGLINE}
        </div>
      </div>
    ),
    {
      ...size,
      fonts: serif
        ? [{ name: "Display", data: serif, style: "normal", weight: 600 }]
        : [],
    },
  );
}
