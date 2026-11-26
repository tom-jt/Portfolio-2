import { useRef, useState, type ReactNode } from "react";
import type { DecoSet } from "./Deco";
import { A, BLUSH, CREAM, GLINT, I, INK, Note, Poke, RED, Spark, vars, vh } from "./parts";

type Suit = "heart" | "diamond" | "spade" | "club";

const SUITS: Record<Suit, ReactNode> = {
  heart: <path d="M12 21s-8-5-8-11a4.5 4.5 0 0 1 8-2.8A4.5 4.5 0 0 1 20 10c0 6-8 11-8 11z" />,
  diamond: <path d="M12 2l7 10-7 10-7-10z" />,
  spade: <path d="M12 2c3 4.5 9 7 9 12a4.5 4.5 0 0 1-8 2.8L14 22h-4l1-5.2A4.5 4.5 0 0 1 3 14c0-5 6-7.5 9-12z" />,
  club: (
    <>
      <circle cx="7.5" cy="13" r="4.5" />
      <circle cx="16.5" cy="13" r="4.5" />
      <circle cx="12" cy="7" r="4.5" />
      <path d="M10.5 13h3l1.5 9h-6z" />
    </>
  ),
};

const red = (k: Suit) => k === "heart" || k === "diamond";

/** A small playing card, face up or showing its striped back. */
const MiniCard = ({
  face = true,
  rank = "A",
  kind = "heart",
  w = 34,
}: {
  face?: boolean;
  rank?: string;
  kind?: Suit;
  w?: number;
}) => (
  <svg width={w} height={Math.round(w * 1.4)} viewBox="0 0 34 48" style={{ display: "block" }}>
    <rect x="0.5" y="0.5" width="33" height="47" rx="4" fill={CREAM} />
    {face ? (
      <>
        <text
          x="5"
          y="12"
          fontSize="10"
          fontWeight="700"
          fill={red(kind) ? RED : INK}
          style={{ fontFamily: "var(--font-bricolage)" }}
        >
          {rank}
        </text>
        <g transform="translate(9 16) scale(.68)" fill={red(kind) ? RED : INK}>
          {SUITS[kind]}
        </g>
      </>
    ) : (
      <>
        <rect x="3.5" y="3.5" width="27" height="41" rx="2.5" fill={RED} />
        <path
          d="M3.5 10l7-6.5M3.5 20l17-16.5M3.5 30l27-26M3.5 40l27-26M10 44.5l20.5-20M20 44.5l10.5-10"
          stroke="rgba(255,255,255,.22)"
          strokeWidth="3"
        />
      </>
    )}
  </svg>
);

const Star = ({ c }: { c: string }) => <path d="M12 2l2 8 8 2-8 2-2 8-2-8-8-2 8-2z" fill={c} />;

/* ---- hero: a royal flush that fans out, sways in 3D, and flips its ace ---- */

/**
 * Ten to ace, left to right. Each card sits a hair nearer than the one
 * before, so the right one is on top and every card's corner index shows, as
 * in a real fan. The ace is the one that turns over.
 */
const FAN: { a: number; z: number; d: number; rank: string }[] = [
  { a: -36, z: 0, d: 0, rank: "10" },
  { a: -18, z: 2, d: 0.05, rank: "J" },
  { a: 0, z: 4, d: 0.1, rank: "Q" },
  { a: 18, z: 6, d: 0.15, rank: "K" },
  { a: 36, z: 8, d: 0.2, rank: "A" },
];

/** A card face: an index in two corners and the suit in the middle. */
const Face = ({ rank }: { rank: string }) => (
  <>
    <span
      className="font-display absolute top-1.5 left-2 flex flex-col items-center text-lg leading-none font-bold"
      style={{ color: RED }}
    >
      {rank}
      <svg width="11" height="11" viewBox="0 0 24 24" fill={RED} className="mt-0.5">
        {SUITS.heart}
      </svg>
    </span>
    <span
      className="font-display absolute right-2 bottom-1.5 flex rotate-180 flex-col items-center text-lg leading-none font-bold"
      style={{ color: RED }}
    >
      {rank}
      <svg width="11" height="11" viewBox="0 0 24 24" fill={RED} className="mt-0.5">
        {SUITS.heart}
      </svg>
    </span>
    <svg className="absolute top-[45px] left-[26px]" width="40" height="40" viewBox="0 0 24 24" fill={RED}>
      {SUITS.heart}
    </svg>
  </>
);

const BACK = `repeating-linear-gradient(45deg, rgba(255,255,255,.18) 0 6px, transparent 6px 12px), ${RED}`;

const Hero = () => {
  const [spin, setSpin] = useState(false);
  return (
    <div className="absolute inset-0">
      {/* Tap the fan and it spins round once. */}
      <Poke
        className="hd-stage absolute"
        style={{ left: 134, top: 110, width: 92, height: 130 }}
        onPoke={() => setSpin(true)}
      >
        <div
          className="hd-shuffler absolute inset-0"
          data-spin={spin ? "" : undefined}
          onAnimationEnd={(e) => {
            if (e.target === e.currentTarget) setSpin(false);
          }}
        >
          <div className="hd-fan absolute inset-0">
            {FAN.map((c, i) => {
              const style = vars({ "--a": `${c.a}deg`, "--z": `${c.z}px`, animationDelay: `${c.d}s` });
              return i < FAN.length - 1 ? (
                <div key={c.rank} className="hd-card hd-card-face" style={{ ...style, background: CREAM }}>
                  <Face rank={c.rank} />
                </div>
              ) : (
                <div key={c.rank} className="hd-card" style={style}>
                  <div className="hd-flipper">
                    <div className="hd-face hd-card-face" style={{ background: CREAM }}>
                      <Face rank={c.rank} />
                    </div>
                    <div
                      className="hd-face hd-card-face"
                      style={{ transform: "rotateY(180deg)", background: BACK, border: `5px solid ${CREAM}` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </Poke>
      <Spark x={40} y={60} s={24} c={I} d={-0.4} />
      <Spark x={300} y={84} s={16} c={GLINT} d={-1.6} />
      <Spark x={330} y={170} s={20} c={A} d={-2.4} />
      <Spark x={10} y={190} s={13} c={GLINT} d={-1} />
    </div>
  );
};

/* ---- sides ---- */
const SuitRise = ({
  kind,
  x,
  s,
  c,
  dur,
  delay,
  op,
}: {
  kind: Suit;
  x: number;
  s: number;
  c: string;
  dur: number;
  delay: number;
  op: number;
}) => (
  <span
    className="hd-rise hd-move"
    style={{ left: x, animationDuration: `${dur}s`, animationDelay: `${delay}s`, opacity: op }}
  >
    <svg width={s} height={s} viewBox="0 0 24 24" fill={c}>
      {SUITS[kind]}
    </svg>
  </span>
);

/** Where a tapped wand throws its sparkles: eight ways, out and fading. */
const BURST = Array.from({ length: 8 }, (_, i) => {
  const t = (i / 8) * Math.PI * 2;
  const r = i % 2 ? 46 : 64;
  return {
    dx: Math.round(Math.cos(t) * r),
    dy: Math.round(Math.sin(t) * r),
    c: [I, GLINT, A][i % 3],
    s: i % 2 ? 12 : 16,
  };
});

const Wand = () => {
  const [burst, setBurst] = useState(0);
  return (
    <div className="absolute" style={{ left: 96, top: vh(150), width: 150, height: 140 }}>
      <div className="hd-sticker" style={{ left: 0, top: 30 }}>
        <Poke onPoke={() => setBurst((b) => b + 1)}>
          <div className="hd-wand">
            <svg width="110" height="110" viewBox="0 0 110 110">
              <path d="M18 96L84 26" stroke={INK} strokeWidth="11" strokeLinecap="round" />
              <path d="M18 96l9-9.5" stroke={CREAM} strokeWidth="11" strokeLinecap="round" />
              <path d="M75 35.5l9-9.5" stroke={CREAM} strokeWidth="11" strokeLinecap="round" />
            </svg>
          </div>
        </Poke>
      </div>
      <svg
        className="hd-pop hd-move"
        style={vars({ left: 92, top: 22, "--dx": "30px", "--dy": "-26px" })}
        width="18"
        height="18"
        viewBox="0 0 24 24"
      >
        <Star c={I} />
      </svg>
      <svg
        className="hd-pop hd-move"
        style={vars({ left: 96, top: 26, "--dx": "40px", "--dy": "6px", animationDelay: "-1s" })}
        width="13"
        height="13"
        viewBox="0 0 24 24"
      >
        <Star c={GLINT} />
      </svg>
      <svg
        className="hd-pop hd-move"
        style={vars({ left: 90, top: 24, "--dx": "8px", "--dy": "-40px", animationDelay: "-2.1s" })}
        width="15"
        height="15"
        viewBox="0 0 24 24"
      >
        <Star c={A} />
      </svg>
      {burst > 0 && (
        <span key={burst} className="hd-move absolute" style={{ left: 92, top: 30 }}>
          {BURST.map((b, i) => (
            <svg
              key={i}
              className="hd-burst"
              style={vars({ left: -b.s / 2, top: -b.s / 2, "--dx": `${b.dx}px`, "--dy": `${b.dy}px` })}
              width={b.s}
              height={b.s}
              viewBox="0 0 24 24"
            >
              <Star c={b.c} />
            </svg>
          ))}
        </span>
      )}
    </div>
  );
};

const SPRING = "M70 280 C70 60 250 60 250 260";

const Left = () => (
  <>
    <SuitRise kind="heart" x={40} s={22} c={A} dur={30} delay={-2} op={0.6} />
    <SuitRise kind="spade" x={190} s={16} c={GLINT} dur={36} delay={-14} op={0.4} />
    <SuitRise kind="diamond" x={110} s={14} c={I} dur={26} delay={-21} op={0.45} />
    <SuitRise kind="club" x={250} s={20} c={GLINT} dur={40} delay={-30} op={0.35} />
    <SuitRise kind="diamond" x={20} s={12} c={GLINT} dur={33} delay={-9} op={0.25} />

    <Wand />
    <Note x={60} y={vh(300)} rotate={-6}>
      abracadab… oops
    </Note>

    {/* A spring of cards, arcing from one pile to the other. */}
    <div className="absolute" style={{ left: 0, top: vh(500), width: 304, height: 400 }}>
      <svg className="absolute top-0 left-0" width="304" height="400" fill="none">
        <path d={SPRING} stroke={I} strokeWidth="1.6" strokeDasharray="2 9" strokeLinecap="round" opacity=".45" />
      </svg>
      {Array.from({ length: 12 }, (_, i) => (
        <div
          key={i}
          className="hd-path hd-spring hd-move"
          style={{ offsetPath: `path('${SPRING}')`, animationDelay: `${-i * 0.2}s` }}
        >
          <MiniCard
            face={i % 3 !== 0}
            rank={["A", "7", "K", "Q", "3"][i % 5]}
            kind={(["heart", "spade", "diamond", "club"] as Suit[])[i % 4]}
            w={26}
          />
        </div>
      ))}
      <div className="absolute" style={{ left: 50, top: 272 }}>
        <MiniCard face={false} w={40} />
      </div>
      <div className="absolute" style={{ left: 53, top: 268 }}>
        <MiniCard face={false} w={40} />
      </div>
      <div className="absolute" style={{ left: 228, top: 270 }}>
        <MiniCard face={false} w={40} />
      </div>
      <div className="absolute" style={{ left: 231, top: 266 }}>
        <MiniCard face={false} w={40} />
      </div>
      <Note x={70} y={350} rotate={-3} muted>
        springs, mostly onto
        <br />
        &nbsp;&nbsp;the floor
      </Note>
    </div>

    <Spark x={30} y={vh(420)} s={16} c={GLINT} d={-0.3} />
    <Spark x={270} y={vh(470)} s={12} c={I} d={-1.2} />
    <Spark x={220} y={vh(980)} s={18} c={A} d={-2} />
    <Spark x={40} y={vh(1010)} s={12} c={GLINT} d={-0.8} />
    <Spark x={150} y={vh(110)} s={12} c={I} d={-2.2} />
  </>
);

/**
 * A top hat and a shy bunny. Drawn in three layers so the bunny sits inside
 * the hat: the dark opening at the back, then the bunny, then the crown and
 * the front of the rim over him. Tap the hat and he hops all the way out.
 */
const Hat = () => {
  const [out, setOut] = useState(false);
  const bunny = useRef<SVGSVGElement>(null);
  /* Start the hop from wherever the peek has him right now, so he never
     snaps back into the hat first. */
  const hop = () => {
    const el = bunny.current;
    if (!el || out) return;
    const y = new DOMMatrixReadOnly(getComputedStyle(el).transform).m42;
    el.style.setProperty("--from", `${Math.round(y)}px`);
    setOut(true);
  };
  return (
    <div className="hd-sticker" style={{ left: 64, top: vh(470) }}>
      <Poke onPoke={hop}>
        <div className="hd-wob relative" style={vars({ "--r": "-6deg", width: 170, height: 190 })}>
          <svg className="absolute" style={{ left: 0, top: 62 }} width="170" height="26" viewBox="0 0 170 26">
            <ellipse cx="85" cy="12" rx="48" ry="11" fill="#2A2733" />
          </svg>
          <div className="absolute overflow-hidden" style={{ left: 39, top: -60, width: 92, height: 144 }}>
            <svg
              ref={bunny}
              className={out ? "hd-bunny-out absolute" : "hd-bunny absolute"}
              style={{ left: 6, top: 66, transform: "translateY(84px)" }}
              width="80"
              height="70"
              viewBox="0 0 80 70"
              onAnimationEnd={(e) => {
                if (e.target === e.currentTarget) setOut(false);
              }}
            >
              <path d="M26 34C18 10 20 0 26 0s10 14 8 34z" fill="#fff" />
              <path d="M27 30c-4-14-3-22 0-22s5 10 4 22z" fill="#FFC9D1" />
              <path d="M46 34c2-20 6-34 12-34s6 12-4 34z" fill="#fff" />
              <path d="M49 30c2-14 4-22 7-22s2 10-3 22z" fill="#FFC9D1" />
              <ellipse cx="40" cy="52" rx="24" ry="20" fill="#fff" />
              <ellipse className="hd-blink" cx="32" cy="50" rx="2.6" ry="3.2" fill={INK} />
              <ellipse className="hd-blink" cx="48" cy="50" rx="2.6" ry="3.2" fill={INK} />
              <ellipse cx="26" cy="58" rx="4" ry="2.4" fill={BLUSH} />
              <ellipse cx="54" cy="58" rx="4" ry="2.4" fill={BLUSH} />
              <path d="M38 56l2 2 2-2" stroke={INK} strokeWidth="1.6" fill="none" strokeLinecap="round" />
            </svg>
          </div>
          <svg className="absolute" style={{ left: 0, top: 62 }} width="170" height="128" viewBox="0 0 170 128">
            {/* The brim first, so the crown stands on it. */}
            <ellipse cx="85" cy="108" rx="82" ry="18" fill={INK} />
            <path d="M10 106q75 22 150 0" stroke="#3A3644" strokeWidth="2" fill="none" />
            <path d="M37 12v76c0 10 22 16 48 16s48-6 48-16V12c0 6-22 11-48 11S37 18 37 12z" fill={INK} />
            <path d="M37 12c0 6 22 11 48 11s48-5 48-11" stroke="#3A3644" strokeWidth="2" fill="none" />
            <path d="M37 88c0 10 22 16 48 16s48-6 48-16" stroke="#3A3644" strokeWidth="2" fill="none" />
            <path d="M37 68c0 10 22 15 48 15s48-5 48-15v16c0 10-22 15-48 15s-48-5-48-15z" fill={RED} />
          </svg>
        </div>
      </Poke>
    </div>
  );
};

const Right = () => (
  <>
    <SuitRise kind="heart" x={44} s={16} c={I} dur={32} delay={-8} op={0.45} />
    <SuitRise kind="diamond" x={224} s={22} c={A} dur={28} delay={-17} op={0.5} />
    <SuitRise kind="spade" x={144} s={14} c={GLINT} dur={38} delay={-26} op={0.38} />
    <SuitRise kind="club" x={84} s={18} c={GLINT} dur={34} delay={-4} op={0.34} />
    <SuitRise kind="heart" x={264} s={12} c={A} dur={26} delay={-12} op={0.4} />

    <div
      className="hd-sticker hd-wob"
      style={vars({ left: 84, top: vh(150), "--r": "12deg", animationDelay: "-1.2s" })}
    >
      <Poke>
        <MiniCard rank="A" kind="spade" w={70} />
      </Poke>
    </div>
    <div
      className="hd-sticker hd-wob"
      style={vars({ left: 174, top: vh(230), "--r": "-10deg", animationDelay: "-2.8s" })}
    >
      <Poke>
        <MiniCard rank="7" kind="heart" w={56} />
      </Poke>
    </div>

    <Hat />
    <Note x={74} y={vh(690)} rotate={4}>
      he&apos;s a bit shy
    </Note>

    <Spark x={34} y={vh(400)} s={14} c={I} d={-2.6} />
    <Spark x={264} y={vh(360)} s={18} c={GLINT} d={-1.5} />
    <Spark x={244} y={vh(820)} s={14} c={A} d={-0.6} />
    <Spark x={44} y={vh(960)} s={20} c={I} d={-3} />
    <Spark x={174} y={vh(1080)} s={12} c={GLINT} d={-1.9} />
    <Spark x={44} y={vh(110)} s={12} c={GLINT} d={-0.9} />
  </>
);

/* ---- the foot of the page: a ribbon spread that ripples, and rises to the pointer ---- */
const RANKS = ["A", "2", "3", "4", "5", "6", "7", "8", "9", "J", "Q", "K"];
const KINDS: Suit[] = ["heart", "spade", "diamond", "club"];

const Bottom = () => (
  <div className="absolute bottom-2 left-1/2 -translate-x-1/2" style={{ width: 920, height: 84 }}>
    <div className="hd-ribbon absolute inset-0">
      {Array.from({ length: 30 }, (_, i) => (
        <span
          key={i}
          style={vars({
            left: i * 30,
            "--r": `${((i - 15) * 0.6).toFixed(1)}deg`,
            animationDelay: `${(i * 0.07).toFixed(2)}s`,
          })}
        >
          <MiniCard face={i % 7 !== 3} rank={RANKS[i % 12]} kind={KINDS[i % 4]} w={46} />
        </span>
      ))}
    </div>
    <Note x={960} y={44} rotate={-3} muted>
      ← ribbon spread, nailed it once
    </Note>
  </div>
);

/* ---- an ace taped to the grid's corner ---- */
const Grid = () => (
  <div className="absolute -top-1 right-1 rotate-[9deg]">
    <Poke>
      <span className="block" style={{ filter: "drop-shadow(0 8px 12px var(--hd-drop))" }}>
        <MiniCard rank="A" kind="heart" w={38} />
      </span>
    </Poke>
    <span
      className="absolute -top-1.5 left-1 h-3 w-8 -rotate-12 rounded-[2px]"
      style={{ background: "rgba(255,150,170,.55)" }}
    />
  </div>
);

const set: DecoSet = { Hero, Left, Right, Bottom, Grid };
export default set;
