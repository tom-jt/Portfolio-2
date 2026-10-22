import { ImageResponse } from "next/og";
import { loadGoogleFont } from "@/lib/og-font";

export const alt = "Tom's room — a rainy corner of the internet";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

const TITLE = "tom's room";
const EYEBROW = "focus · tasks · garden · games";

const GROUND = "#0a0f1f";
const INK = "#ede7da";
const MUTED = "#a3acc0";
const LAMP = "#f2b46d";

/** Fixed pseudo-random streaks, so the image is identical on every build. */
const STREAKS = Array.from({ length: 70 }, (_, i) => {
  const r = (n: number) => ((Math.sin(i * 12.9898 + n * 78.233) * 43758.5453) % 1 + 1) % 1;
  return { x: r(1) * 1200, y: r(2) * 630, h: 30 + r(3) * 60, o: 0.12 + r(4) * 0.25 };
});

const BOKEH = [
  { x: 120, y: 560, r: 70, c: "255,180,100" },
  { x: 330, y: 610, r: 50, c: "236,150,190" },
  { x: 880, y: 590, r: 80, c: "126,208,228" },
  { x: 1080, y: 540, r: 60, c: "255,180,100" },
  { x: 620, y: 640, r: 46, c: "255,96,84" },
];

export default async function Image() {
  const display = await loadGoogleFont("Instrument Serif", 400, TITLE);

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
          background: `linear-gradient(180deg, #050914 0%, ${GROUND} 45%, #241c3e 80%, #12142a 100%)`,
          position: "relative",
        }}
      >
        {BOKEH.map((b, i) => (
          <div
            key={`b${i}`}
            style={{
              position: "absolute",
              left: b.x - b.r,
              top: b.y - b.r,
              width: b.r * 2,
              height: b.r * 2,
              borderRadius: b.r,
              background: `radial-gradient(circle, rgba(${b.c},0.45) 0%, rgba(${b.c},0.3) 55%, rgba(${b.c},0) 100%)`,
            }}
          />
        ))}
        {STREAKS.map((s, i) => (
          <div
            key={`s${i}`}
            style={{
              position: "absolute",
              left: s.x,
              top: s.y,
              width: 2,
              height: s.h,
              background: `linear-gradient(180deg, rgba(190,210,255,0), rgba(190,210,255,${s.o}))`,
              transform: "rotate(-6deg)",
            }}
          />
        ))}

        <div
          style={{
            display: "flex",
            color: MUTED,
            fontSize: 24,
            letterSpacing: 2,
            marginBottom: 20,
          }}
        >
          {EYEBROW}
        </div>
        <div
          style={{
            display: "flex",
            color: INK,
            fontSize: 150,
            lineHeight: 1,
            fontFamily: display ? "Display" : undefined,
          }}
        >
          {TITLE}
        </div>
        <div style={{ display: "flex", width: 120, height: 3, background: LAMP, marginTop: 34 }} />
      </div>
    ),
    {
      ...size,
      fonts: display ? [{ name: "Display", data: display, style: "normal", weight: 400 }] : [],
    },
  );
}
