import type { DecoSet } from "./Deco";
import { A, I, INK, Note, Poke, seeded, vars, vh } from "./parts";

const BROWN = "#3A2A14";
const LEAF = "#7FCB8F";
const LEAF2 = "#5FAE72";
const AMBER = "#FFB454";
const AMBER_2 = "#FFD9A3";

const Wings = ({ c1, c2, spots = true }: { c1: string; c2: string; spots?: boolean }) => (
  <g className="hd-wing">
    <path d="M30 30C20 10 4 10 6 22s14 10 24 8z" fill={c1} />
    <path d="M30 30C22 40 10 48 14 52s14-6 16-22z" fill={c2} />
    <path d="M30 30c10-20 26-20 24-8s-14 10-24 8z" fill={c1} />
    <path d="M30 30c8 10 20 18 16 22s-14-6-16-22z" fill={c2} />
    {spots && (
      <>
        <circle cx="14" cy="22" r="3" fill="#FFF3DF" />
        <circle cx="46" cy="22" r="3" fill="#FFF3DF" />
      </>
    )}
  </g>
);

const Body = ({ face }: { face?: boolean }) => (
  <>
    <path d="M30 18v26" stroke={BROWN} strokeWidth="3" strokeLinecap="round" />
    <path d="M30 18l-5-7M30 18l5-7" stroke={BROWN} strokeWidth="1.5" strokeLinecap="round" />
    {face && (
      <>
        <circle cx="27" cy="22" r="1.4" fill="#fff" />
        <circle cx="33" cy="22" r="1.4" fill="#fff" />
      </>
    )}
  </>
);

const Butterfly = ({
  size,
  c1,
  c2,
  rest,
  face,
  className,
}: {
  size: number;
  c1: string;
  c2: string;
  rest?: boolean;
  face?: boolean;
  className?: string;
}) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 60 60"
    className={rest ? `hd-rest ${className ?? ""}` : className}
    style={{ display: "block" }}
  >
    <Wings c1={c1} c2={c2} />
    <Body face={face} />
  </svg>
);

/** A butterfly flying a loop. Paths are in the box it sits in. */
const Fly = ({
  path,
  size,
  c1,
  c2,
  dur,
  delay,
  slow,
}: {
  path: string;
  size: number;
  c1: string;
  c2: string;
  dur: number;
  delay: number;
  slow?: boolean;
}) => (
  <div
    className={`hd-path hd-fly hd-move${slow ? " hd-slow" : ""}`}
    style={{
      offsetPath: `path('${path}')`,
      animationDuration: `${dur}s`,
      animationDelay: `${delay}s`,
    }}
  >
    <Butterfly size={size} c1={c1} c2={c2} />
  </div>
);

const Daisy = ({ cx, cy, r, petal, centre }: { cx: number; cy: number; r: number; petal: string; centre: string }) => (
  <g className="hd-nod">
    {[0, 45, 90, 135, 180, 225, 270, 315].map((a) => (
      <ellipse
        key={a}
        cx={cx}
        cy={cy - r}
        rx={r * 0.42}
        ry={r * 0.62}
        fill={petal}
        transform={`rotate(${a} ${cx} ${cy})`}
      />
    ))}
    <circle cx={cx} cy={cy} r={r * 0.45} fill={centre} />
  </g>
);

/* ---- hero: the trainer, flipping, and a butterfly looping round it ---- */
// Kept below the nav bar, which sits over the top of this box.
const P_HERO = "M20 225C70 140 170 225 230 160S340 95 312 84S175 100 122 138S-30 295 20 225";

const Hero = () => (
  <>
    <svg className="absolute top-0 left-0 overflow-visible" width="340" height="260" fill="none">
      <path d={P_HERO} stroke={I} strokeWidth="1.6" strokeDasharray="2 9" strokeLinecap="round" opacity=".35" />
    </svg>
    <div className="hd-sticker" style={{ left: 164, top: 96, transform: "rotate(8deg)" }}>
      <Poke className="hd-spinner">
        <div className="hd-knife grid size-[120px] place-items-center">
          <svg width="120" height="120" viewBox="0 0 120 120">
            <rect x="56" y="14" width="8" height="54" rx="3" fill="#D9DCE3" />
            <rect x="47" y="62" width="11" height="48" rx="5" fill={AMBER} />
            <rect x="62" y="62" width="11" height="48" rx="5" fill="#E0962E" />
            <circle cx="60" cy="64" r="4" fill={BROWN} />
            <path d="M52 104h16" stroke={BROWN} strokeWidth="3" strokeLinecap="round" />
          </svg>
        </div>
      </Poke>
    </div>
    <Fly path={P_HERO} size={52} c1={AMBER} c2={AMBER_2} dur={16} delay={0} />
  </>
);

/* ---- drifting petals, for both sides ---- */
const petalRand = seeded(3);
const PETALS = Array.from({ length: 8 }, () => ({
  x: 10 + petalRand() * 270,
  dx: -80 + petalRand() * 160,
  c: ["#FFF6EC", "#FFE3EA", AMBER_2, "#FFCDB8"][Math.floor(petalRand() * 4)],
  dur: 18 + petalRand() * 12,
  delay: -petalRand() * 30,
}));

const Petals = ({ shift = 0 }: { shift?: number }) => (
  <>
    {PETALS.map((p, i) => (
      <svg
        key={i}
        className="hd-petal hd-move"
        style={vars({
          left: Math.round(p.x),
          "--dx": `${Math.round(p.dx)}px`,
          animationDuration: `${p.dur.toFixed(1)}s`,
          animationDelay: `${(p.delay - shift).toFixed(1)}s`,
          opacity: 0.7,
        })}
        width="12"
        height="16"
        viewBox="0 0 12 16"
      >
        <path d="M6 0c5 4 6 10 0 16C0 10 1 4 6 0z" fill={p.c} />
      </svg>
    ))}
  </>
);

const P_LEFT = "M150 20C300 -40 300 200 150 240S0 500 150 540S300 300 150 240S0 80 150 20";
const P_RIGHT = "M154 20C4 -20 4 220 154 260S294 500 154 560S14 320 154 260S284 60 154 20";

const Left = () => (
  <>
    <Petals />
    <div
      className="hd-sticker hd-wob"
      style={vars({
        left: 110,
        top: vh(170),
        "--r": "10deg",
        animationDelay: "-2s",
      })}
    >
      <Poke>
        <Butterfly size={96} c1="#C9B2FF" c2="#E6DBFF" rest face />
      </Poke>
    </div>
    <Note x={70} y={vh(290)}>
      flutter, not flick
    </Note>

    <div className="absolute" style={{ left: 0, top: vh(400), width: 304, height: 560 }}>
      <svg className="absolute top-0 left-0 overflow-visible" width="304" height="560" fill="none">
        <path d={P_LEFT} stroke={I} strokeWidth="1.6" strokeDasharray="2 9" strokeLinecap="round" opacity=".3" />
      </svg>
      <Fly path={P_LEFT} size={40} c1="#FF9F7A" c2="#FFCDB8" dur={20} delay={-4} slow />
      <Fly path={P_LEFT} size={26} c1="#F4E07A" c2="#F4EFBE" dur={20} delay={-14} />
    </div>

    {/* A tall flowering stem, with a butterfly asleep on the top flower. */}
    <div className="absolute bottom-0" style={{ left: 60, width: 220, height: 580 }}>
      <svg
        className="hd-stem absolute inset-0 overflow-visible"
        width="220"
        height="580"
        viewBox="0 0 220 580"
        fill="none"
      >
        <path d="M110 580C110 460 70 400 100 300S150 160 120 60" stroke={LEAF2} strokeWidth="5" strokeLinecap="round" />
        <path d="M100 300C60 280 40 240 52 220c30 4 46 40 48 80z" fill={LEAF} />
        <path d="M112 420c40-14 62-48 52-70-30 2-48 34-52 70z" fill={LEAF} />
        <path d="M120 170c30-20 40-50 28-66-24 8-30 36-28 66z" fill={LEAF} />
        <path d="M100 300C80 250 50 200 40 150" stroke={LEAF2} strokeWidth="4" strokeLinecap="round" />
        <Daisy cx={120} cy={50} r={22} petal="#FFF6EC" centre={AMBER} />
        <Daisy cx={40} cy={140} r={16} petal="#FFE3EA" centre="#FF9F7A" />
        <path d="M112 420c20 20 40 40 70 40" stroke={LEAF2} strokeWidth="4" strokeLinecap="round" />
        <Daisy cx={184} cy={450} r={14} petal="#FFF6EC" centre={AMBER} />
        <g className="hd-rest" transform="translate(92 -2) rotate(-12) scale(.83)">
          <Wings c1="#FF9F7A" c2="#FFCDB8" />
          <Body face />
        </g>
      </svg>
      <Note x={90} y={-30} rotate={-6}>
        shh, she&apos;s resting
      </Note>
    </div>
  </>
);

const Right = () => (
  <>
    <Petals shift={9} />
    {/* A cocoon on a thread, nearly ready. Thread and cocoon swing as one,
        from the top of the thread. */}
    <div className="absolute" style={{ left: 84, top: vh(120), width: 100, height: 300 }}>
      <div className="hd-swing absolute top-0 left-0 h-[252px] w-[100px]">
        <svg className="absolute top-0 left-0" width="100" height="176" fill="none">
          <path d="M50 0v176" stroke={I} strokeWidth="1.4" opacity=".6" />
        </svg>
        <div className="absolute" style={{ left: 26, top: 170 }}>
          <Poke>
            <svg width="48" height="80" viewBox="0 0 48 80">
              <path d="M24 2c14 6 20 24 18 44s-10 30-18 32c-8-2-16-12-18-32S10 8 24 2z" fill="#C9A97A" />
              <path
                d="M10 26q14 6 28 0M8 40q16 6 32 0M10 54q14 6 28 0"
                stroke="#A88758"
                strokeWidth="2.4"
                strokeLinecap="round"
                fill="none"
              />
              <ellipse className="hd-blink" cx="18" cy="34" rx="2.4" ry="3" fill={INK} />
              <ellipse className="hd-blink" cx="30" cy="34" rx="2.4" ry="3" fill={INK} />
              <path d="M20 44q4 3 8 0" stroke={INK} strokeWidth="2" strokeLinecap="round" fill="none" />
            </svg>
          </Poke>
        </div>
      </div>
      <Note x={120} y={184} rotate={5}>
        nearly
        <br />
        ready
      </Note>
    </div>

    <div className="absolute" style={{ left: 0, top: vh(400), width: 304, height: 560 }}>
      <Fly path={P_RIGHT} size={36} c1="#F4E07A" c2="#F4EFBE" dur={18} delay={-9} />
      <Fly path={P_RIGHT} size={30} c1="#C9B2FF" c2="#E6DBFF" dur={18} delay={-2} slow />
    </div>

    <svg
      className="hd-stem absolute bottom-0"
      style={{ left: 44, animationDelay: "-2s" }}
      width="240"
      height="360"
      viewBox="0 0 240 360"
      fill="none"
    >
      <path
        d="M80 360C80 280 60 200 80 120M150 360c0-60 20-120 10-180M80 260c-30-10-50-40-44-60 24 2 40 30 44 60zM152 250c30-12 46-40 38-58-24 4-36 30-38 58z"
        stroke={LEAF2}
        strokeWidth="5"
        strokeLinecap="round"
        fill={LEAF}
      />
      <g className="hd-nod">
        <path d="M68 110c0-14 4-22 12-22s12 8 12 22c0 8-6 12-12 12s-12-4-12-12z" fill="#FF9F7A" />
        <path d="M68 102l6 8 6-12 6 12 6-8" fill="#FF9F7A" stroke="#FF9F7A" strokeWidth="2" />
      </g>
      <Daisy cx={160} cy={170} r={18} petal="#FFF6EC" centre={AMBER} />
    </svg>
  </>
);

/* ---- resting on the boxes ---- */
const Grid = () => (
  <div className="hd-sticker hd-wob -top-0.5 right-1" style={vars({ "--r": "-12deg" })}>
    <Poke>
      <Butterfly size={46} c1={AMBER} c2={AMBER_2} rest face />
    </Poke>
  </div>
);

const Panel = () => (
  <div className="hd-crawl absolute -top-[24px] left-7" style={vars({ "--far": "220px" })}>
    <Poke>
      <svg width="110" height="34" viewBox="0 0 110 34" style={{ overflow: "visible" }}>
        {Array.from({ length: 5 }, (_, i) => (
          <circle
            key={i}
            className="hd-seg"
            cx={12 + i * 15}
            cy="16"
            r="10"
            fill={i % 2 ? "#9BDB7A" : "#86CC66"}
            style={{ animationDelay: `${-i * 0.12}s` }}
          />
        ))}
        <g className="hd-seg" style={{ animationDelay: "-.7s" }}>
          <circle cx="94" cy="14" r="12" fill="#9BDB7A" />
          <circle cx="90" cy="11" r="2.2" fill={INK} />
          <circle cx="99" cy="11" r="2.2" fill={INK} />
          <ellipse cx="88" cy="18" rx="3" ry="1.8" fill="#FFB3BD" />
          <ellipse cx="101" cy="18" rx="3" ry="1.8" fill="#FFB3BD" />
          <path d="M90 2l-3-6M98 2l3-6" stroke={INK} strokeWidth="1.6" strokeLinecap="round" />
        </g>
      </svg>
    </Poke>
  </div>
);

/* ---- the foot of the page: grass and small daisies ---- */
const TUFTS = Array.from({ length: 40 }, (_, i) => 20 + i * 64);
const Bottom = () => (
  <svg
    className="hd-stem absolute bottom-0 left-0"
    style={{ animationDuration: "7s" }}
    width="2560"
    height="60"
    viewBox="0 0 2560 60"
    fill="none"
  >
    {TUFTS.map((x, i) => (
      <path
        key={x}
        d={`M${x} 60q-4-24 -10-34M${x} 60q2-30 4-44M${x} 60q6-22 14-30`}
        stroke={i % 2 ? LEAF2 : LEAF}
        strokeWidth="3"
        strokeLinecap="round"
      />
    ))}
    {TUFTS.filter((_, i) => i % 2 === 0).map((x, i) => (
      <Daisy key={x} cx={x + 32} cy={24} r={7} petal={i % 2 ? "#FFF6EC" : "#FFE3EA"} centre={A} />
    ))}
  </svg>
);

const set: DecoSet = { Hero, Left, Right, Grid, Panel, Bottom };
export default set;
