import type { DecoSet } from "./Deco";
import { BLUSH, I, INK, Note, Poke, seeded, vars, vh } from "./parts";

const NAVY = "#25304A";
const SNOW = "#F7FBFF";
const ORANGE = "#FFB454";
const SKY = "#7CC4FF";

const FLAKE_A = "M12 2v20M3.4 7l17.2 10M20.6 7L3.4 17";
const FLAKE_B = "M12 2v20M3.4 7l17.2 10M20.6 7L3.4 17M9 4l3 2 3-2M9 20l3-2 3 2";

/* Snow for the whole window, laid out once so server and client agree. */
const rand = seeded(7);
const FLAKES = Array.from({ length: 40 }, (_, i) => {
  const s = [8, 10, 12, 14, 16, 18, 22][Math.floor(rand() * 7)];
  return {
    left: `${((i + rand() * 0.6) * (100 / 40)).toFixed(2)}%`,
    s,
    big: s >= 16,
    op: s >= 16 ? 1 : [0.45, 0.6, 0.8][Math.floor(rand() * 3)],
    dur: 14 + rand() * 14,
    delay: -rand() * 28,
    sway: 3.6 + rand() * 2.4,
  };
});

const Ground = () => (
  <>
    {FLAKES.map((f, i) => (
      <span
        key={i}
        className="hd-flake hd-move"
        style={{
          left: f.left,
          animationDuration: `${f.dur.toFixed(1)}s`,
          animationDelay: `${f.delay.toFixed(1)}s`,
          opacity: f.op,
        }}
      >
        <svg
          width={f.s}
          height={f.s}
          viewBox="0 0 24 24"
          fill="none"
          stroke={f.big ? "var(--hd-snow)" : "var(--hd-snow-2)"}
          strokeWidth={f.big ? 1.6 : 2}
          strokeLinecap="round"
          style={{ animationDuration: `${f.sway.toFixed(1)}s` }}
        >
          <path d={f.big ? FLAKE_B : FLAKE_A} />
        </svg>
      </span>
    ))}
  </>
);

const Penguin = ({ w, scarf = true }: { w: number; scarf?: boolean }) => (
  <svg width={w} height={Math.round((w * 132) / 120)} viewBox="0 0 120 132" style={{ display: "block" }}>
    <ellipse cx="60" cy="74" rx="44" ry="52" fill={NAVY} />
    <ellipse cx="60" cy="84" rx="30" ry="38" fill={SNOW} />
    <ellipse className="hd-blink" cx="45" cy="56" rx="5" ry="6" fill={INK} />
    <ellipse className="hd-blink" cx="75" cy="56" rx="5" ry="6" fill={INK} />
    <circle cx="47" cy="54" r="1.8" fill="#fff" />
    <circle cx="77" cy="54" r="1.8" fill="#fff" />
    <ellipse cx="38" cy="68" rx="6" ry="3.5" fill={BLUSH} opacity=".9" />
    <ellipse cx="82" cy="68" rx="6" ry="3.5" fill={BLUSH} opacity=".9" />
    <path d="M53 64h14l-7 8z" fill={ORANGE} />
    <path d="M16 76q-10 18 4 30M104 76q10 18-4 30" stroke={NAVY} strokeWidth="10" strokeLinecap="round" fill="none" />
    <path d="M40 124h16l-4 6h-12zM64 124h16l-4 6H64z" fill={ORANGE} />
    {scarf && (
      <>
        <path d="M24 92q36 14 72 0v10q-36 14-72 0z" fill={SKY} />
        <path d="M82 98l8 22h-10l-4-18z" fill={SKY} />
      </>
    )}
    <path d="M28 18q32-22 64 0q-8 6-32 6t-32-6z" fill={SKY} />
    <circle cx="60" cy="8" r="7" fill={SNOW} />
  </svg>
);

const Skate = ({ w }: { w: number }) => (
  <svg width={w} height={Math.round((w * 96) / 104)} viewBox="0 0 104 96" style={{ display: "block" }}>
    <path d="M18 8h30v40c0 8 8 12 20 14l18 3c6 1 10 6 10 12v3H14z" fill="#DDEFFF" />
    <path d="M18 8h30v14H18z" fill={SKY} />
    <path d="M30 30l12 4M30 38l12 4M30 46l12 4" stroke={NAVY} strokeWidth="2.4" strokeLinecap="round" />
    <path d="M10 86h84" stroke="#B8C2D0" strokeWidth="5" strokeLinecap="round" />
    <path d="M24 80v6M80 80v6" stroke="#B8C2D0" strokeWidth="4" />
    <path d="M90 86q8 0 8-8" stroke="#B8C2D0" strokeWidth="4" fill="none" strokeLinecap="round" />
  </svg>
);

const Hero = () => (
  <>
    <div className="hd-sticker hd-wob" style={vars({ left: 24, top: 74, "--r": "-8deg", animationDelay: "-1s" })}>
      <Poke>
        <Penguin w={120} />
      </Poke>
    </div>
    <div
      className="hd-sticker hd-wob"
      style={vars({
        left: 184,
        top: 50,
        "--r": "12deg",
        animationDelay: "-2.6s",
      })}
    >
      <Poke>
        <Skate w={104} />
      </Poke>
    </div>
    <div
      className="hd-sticker hd-wob"
      style={vars({
        left: 200,
        top: 168,
        "--r": "-14deg",
        animationDelay: "-.4s",
      })}
    >
      <Poke>
        <svg width="66" height="66" viewBox="0 0 24 24">
          <circle cx="12" cy="12" r="11" fill="#E9F5FF" />
          <path
            d="M12 3v18M4.2 7.5l15.6 9M19.8 7.5l-15.6 9M9.5 4.6L12 6.4l2.5-1.8M9.5 19.4L12 17.6l2.5 1.8"
            stroke={SKY}
            strokeWidth="1.8"
            strokeLinecap="round"
            fill="none"
          />
        </svg>
      </Poke>
    </div>
  </>
);

const EIGHT = "M150 50 C40 50 40 210 150 210 S260 370 150 370 S40 210 150 210 S260 50 150 50";

const Left = () => (
  <>
    {/* A knitted beanie. */}
    <div
      className="hd-sticker hd-wob"
      style={vars({
        left: 96,
        top: vh(150),
        "--r": "-10deg",
        animationDelay: "-1.8s",
      })}
    >
      <Poke>
        <svg width="112" height="100" viewBox="0 0 112 100">
          <path d="M14 70C14 34 32 14 56 14s42 20 42 56z" fill={SKY} />
          <path
            d="M30 30v40M44 20v50M58 16v54M72 20v50M86 32v38"
            stroke="#5EA8E8"
            strokeWidth="4"
            strokeLinecap="round"
          />
          <rect x="8" y="64" width="96" height="24" rx="10" fill={SNOW} />
          <path
            d="M18 70v12M30 70v12M42 70v12M54 70v12M66 70v12M78 70v12M90 70v12"
            stroke="#D8E8F7"
            strokeWidth="3"
            strokeLinecap="round"
          />
          <circle cx="56" cy="12" r="11" fill={SNOW} />
        </svg>
      </Poke>
    </div>
    <Note x={70} y={vh(270)} rotate={-5}>
      rink is 4°C, dress up
    </Note>

    {/* A figure eight scratched into the ice, and a skate going round it. */}
    <div className="absolute" style={{ left: 0, top: vh(470), width: 304, height: 440 }}>
      <svg className="absolute top-0 left-0" width="304" height="400" fill="none">
        <path d={EIGHT} stroke={I} strokeOpacity=".18" strokeWidth="10" strokeLinecap="round" />
        <path
          className="hd-eight"
          d={EIGHT}
          stroke={I}
          strokeWidth="1.8"
          strokeDasharray="6 9"
          strokeLinecap="round"
          opacity=".75"
        />
      </svg>
      <div className="hd-path hd-trace hd-move" style={{ offsetPath: `path('${EIGHT}')` }}>
        <div style={{ transform: "translate(-50%,-80%)" }}>
          <Skate w={40} />
        </div>
      </div>
      <Note x={70} y={400} rotate={-3} muted>
        figure eights, ish
      </Note>
    </div>
  </>
);

const Mitten = ({ flip }: { flip?: boolean }) => (
  <svg
    width="62"
    height="80"
    viewBox="0 0 62 80"
    style={{ display: "block", transform: flip ? "scaleX(-1)" : undefined }}
  >
    <path d="M14 22c0-12 8-18 18-18s18 6 18 18v30c0 10-8 18-18 18s-18-8-18-18z" fill={SKY} />
    <path d="M14 34c-10-2-14 8-8 14l8 6z" fill={SKY} />
    <rect x="12" y="62" width="40" height="14" rx="5" fill={SNOW} />
    <path d="M24 26l8 8 8-8M24 38l8 8 8-8" stroke="#E9F5FF" strokeWidth="3" strokeLinecap="round" fill="none" />
  </svg>
);

const Right = () => (
  <>
    {/* Cocoa, still steaming. */}
    <div
      className="hd-sticker hd-wob"
      style={vars({
        left: 74,
        top: vh(150),
        "--r": "6deg",
        animationDelay: "-3s",
      })}
    >
      <Poke>
        <svg width="110" height="120" viewBox="0 0 110 120" style={{ overflow: "visible" }}>
          {[38, 56, 74].map((x, i) => (
            <path
              key={x}
              className="hd-steam"
              style={{ animationDelay: `${-i}s` }}
              d={`M${x} 34q-8-10 0-18t0-16`}
              stroke="#E9F5FF"
              strokeWidth="4"
              strokeLinecap="round"
              fill="none"
            />
          ))}
          <path d="M18 44h76l-6 58c-1 8-8 14-16 14H40c-8 0-15-6-16-14z" fill={BLUSH} />
          <path d="M92 56c14 0 16 22 0 24" stroke={BLUSH} strokeWidth="8" fill="none" />
          <ellipse cx="56" cy="44" rx="38" ry="8" fill="#8A5A44" />
          <circle cx="44" cy="42" r="6" fill="#fff" />
          <circle cx="58" cy="44" r="5" fill="#fff" />
          <circle cx="68" cy="41" r="5.5" fill="#fff" />
          <ellipse className="hd-blink" cx="44" cy="78" rx="3" ry="3.6" fill={INK} />
          <ellipse className="hd-blink" cx="66" cy="78" rx="3" ry="3.6" fill={INK} />
          <path d="M51 86q4 4 8 0" stroke={INK} strokeWidth="2.4" strokeLinecap="round" fill="none" />
        </svg>
      </Poke>
    </div>

    {/* Mittens on a string. */}
    <div className="absolute" style={{ left: 40, top: vh(420), width: 220, height: 200 }}>
      <div className="hd-swing absolute inset-0">
        <svg className="absolute top-0 left-0" width="220" height="80" fill="none">
          <path d="M30 60Q110 0 190 60" stroke="var(--hd-snow-2)" strokeWidth="2" />
        </svg>
        <div className="hd-sticker" style={{ left: 6, top: 52, transform: "rotate(14deg)" }}>
          <Poke>
            <Mitten />
          </Poke>
        </div>
        <div className="hd-sticker" style={{ left: 150, top: 52, transform: "rotate(-14deg)" }}>
          <Poke>
            <Mitten flip />
          </Poke>
        </div>
      </div>
    </div>
    <Note x={94} y={vh(620)} rotate={4} size={26}>
      brrr
    </Note>

    {/* A snowman who blinks. */}
    <div
      className="hd-sticker hd-wob"
      style={vars({
        left: 84,
        top: vh(720),
        "--r": "-4deg",
        animationDelay: "-2s",
      })}
    >
      <Poke>
        <svg width="130" height="170" viewBox="0 0 130 170">
          <circle cx="65" cy="124" r="42" fill={SNOW} />
          <circle cx="65" cy="62" r="32" fill={SNOW} />
          <path d="M30 86q35 16 70 0v12q-35 16-70 0z" fill={BLUSH} />
          <path d="M84 94l6 26h-11l-3-22z" fill={BLUSH} />
          <path d="M38 40h54l-4-26H42z" fill={NAVY} />
          <rect x="30" y="38" width="70" height="8" rx="4" fill={NAVY} />
          <path d="M42 30h46" stroke={SKY} strokeWidth="5" />
          <ellipse className="hd-blink" cx="54" cy="60" rx="3.6" ry="4.4" fill={INK} />
          <ellipse className="hd-blink" cx="76" cy="60" rx="3.6" ry="4.4" fill={INK} />
          <path d="M65 68l14 4-14 3z" fill={ORANGE} />
          <ellipse cx="46" cy="72" rx="5" ry="3" fill={BLUSH} />
          <ellipse cx="84" cy="72" rx="5" ry="3" fill={BLUSH} />
          <circle cx="65" cy="112" r="3.4" fill={NAVY} />
          <circle cx="65" cy="128" r="3.4" fill={NAVY} />
          <path d="M24 108L4 92M106 108l20-16" stroke="#8A5A44" strokeWidth="4" strokeLinecap="round" />
        </svg>
      </Poke>
    </div>
  </>
);

/* ---- snow resting on the boxes ---- */
const CAP =
  "M0 34C4 22 16 16 30 20C40 8 64 6 76 16C88 10 104 12 112 20C124 12 146 12 156 22C170 14 190 16 198 24C214 16 236 18 244 26C262 22 280 26 290 30L300 34Z";

const Cap = ({ left, w, h = 34 }: { left: number; w: number; h?: number }) => (
  <svg
    className="absolute"
    style={{
      left,
      top: -h + 4,
      filter: "drop-shadow(0 3px 4px var(--hd-drop))",
    }}
    width={w}
    height={h}
    viewBox="0 0 300 34"
    preserveAspectRatio="none"
  >
    <path d={CAP} fill={SNOW} />
    <path d="M8 34c40-6 90-8 140-4s100 2 150 4z" fill="#DCEBFA" />
  </svg>
);


const Panel = () => <Cap left={24} w={190} />;

/* ---- the foot of the page: a strip of rink, and two penguins ---- */
const Bottom = () => (
  <>
    <div
      className="absolute inset-x-0 top-[52px] bottom-0 overflow-hidden"
      style={{
        background: "linear-gradient(180deg, transparent, rgb(var(--hb-rgb) / 10%))",
        borderTop: "2px dashed rgb(var(--hb-rgb) / 45%)",
      }}
    >
      <div
        className="hd-glint absolute inset-y-0 w-[120px]"
        style={{
          background: "linear-gradient(90deg, transparent, rgba(255,255,255,.12), transparent)",
        }}
      />
      <svg
        className="absolute top-5 left-0"
        width="2560"
        height="90"
        fill="none"
        stroke={I}
        strokeOpacity=".22"
        strokeWidth="1.4"
      >
        <path d="M80 40q160-40 320 10M500 70q200-50 380 0M1000 30q180 40 360-10M1440 60q160-40 380 10M240 80q80-20 160 0M1900 40q200-40 380 10M2200 70q120-30 300 0" />
      </svg>
    </div>
    <div className="hd-slider hd-move" style={{ top: 4 }}>
      <Penguin w={46} />
    </div>
    <div className="hd-slider hd-move" style={{ top: 20, animationDelay: ".45s" }}>
      <svg width="32" height="35" viewBox="0 0 120 132" style={{ animationDuration: ".45s" }}>
        <ellipse cx="60" cy="74" rx="44" ry="52" fill="#9AA3B5" />
        <ellipse cx="60" cy="84" rx="30" ry="38" fill={SNOW} />
        <ellipse cx="45" cy="60" rx="6" ry="7" fill={INK} />
        <ellipse cx="75" cy="60" rx="6" ry="7" fill={INK} />
        <path d="M53 70h14l-7 8z" fill={ORANGE} />
        <ellipse cx="36" cy="74" rx="7" ry="4" fill={BLUSH} />
        <ellipse cx="84" cy="74" rx="7" ry="4" fill={BLUSH} />
      </svg>
    </div>
    <span className="absolute left-1/2" style={{ top: 78 }}>
      <Note x={-60} y={0} rotate={-2}>
        wait for meee
      </Note>
    </span>
  </>
);

const set: DecoSet = { Ground, Hero, Left, Right, Panel, Bottom };
export default set;
