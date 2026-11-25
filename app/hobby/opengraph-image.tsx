import { ImageResponse } from "next/og";
import { loadGoogleFont } from "@/lib/og-font";

export const alt = "Tom Liu — Hobbies";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

const TITLE = "Hobbies";
const EYEBROW = "Tom Liu";
const TAGLINE = "Magic, ice skating, balisong, and piano.";
const QUIP = "learnt slowly, logged happily";

const GROUND = "#0b0b0f";
const INK = "#f2f1ee";
const MUTED = "#a7a4ae";
const ROSE = "#ff6b7d";
const DOTS = ["#ff6b7d", "#7cc4ff", "#ffb454", "#6fe0b0"];

export default async function Image() {
  const [display, hand] = await Promise.all([
    loadGoogleFont("Bricolage Grotesque", 700, TITLE + EYEBROW + TAGLINE),
    loadGoogleFont("Nanum Pen Script", 400, QUIP),
  ]);

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
          backgroundImage: "radial-gradient(circle at 78% 30%, rgba(255,107,125,0.28), transparent 45%)",
        }}
      >
        <div style={{ display: "flex", color: MUTED, fontSize: 24, letterSpacing: 2, marginBottom: 18 }}>
          {EYEBROW}
        </div>
        <div
          style={{
            display: "flex",
            color: INK,
            fontSize: 150,
            lineHeight: 1,
            letterSpacing: -5,
            fontFamily: display ? "Display" : undefined,
          }}
        >
          {TITLE}
        </div>
        <div style={{ display: "flex", gap: 14, margin: "34px 0" }}>
          {DOTS.map((c) => (
            <div key={c} style={{ display: "flex", width: 14, height: 14, borderRadius: 7, background: c }} />
          ))}
        </div>
        <div style={{ display: "flex", color: MUTED, fontSize: 30 }}>{TAGLINE}</div>
        <div
          style={{
            display: "flex",
            color: ROSE,
            fontSize: 40,
            marginTop: 22,
            transform: "rotate(-3deg)",
            fontFamily: hand ? "Hand" : undefined,
          }}
        >
          {QUIP}
        </div>
      </div>
    ),
    {
      ...size,
      fonts: [
        ...(display ? [{ name: "Display", data: display, style: "normal" as const, weight: 700 as const }] : []),
        ...(hand ? [{ name: "Hand", data: hand, style: "normal" as const, weight: 400 as const }] : []),
      ],
    },
  );
}
