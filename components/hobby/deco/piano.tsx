import type { ReactNode } from "react";
import type { DecoSet } from "./Deco";
import { A, I, INK, Note, Poke, vars, vh } from "./parts";

const MINT = "#6FE0B0";
const MINT_2 = "#B9F2DA";
const PAPER = "#E9FBF3";

/* Clefs, drawn as filled shapes so they read cleanly at sticker size. */
const Bass = ({ w, c }: { w: number; c: string }) => (
  <svg width={w} height={Math.round((w * 58) / 54)} viewBox="0 0 54 58" style={{ display: "block" }}>
    <path
      d="M5 17C5 8 13 2 22 2c13 0 21 9 21 21 0 16-15 28-38 34 17-9 29-19 29-34 0-9-5-16-12-16-6 0-9 3-10 6z"
      fill={c}
    />
    <circle cx="11" cy="17" r="6.5" fill={c} />
    <circle cx="49" cy="12" r="3.2" fill={c} />
    <circle cx="49" cy="26" r="3.2" fill={c} />
  </svg>
);

const Treble = ({ w, c }: { w: number; c: string }) => (
  <svg
    width={w}
    height={Math.round((w * 96) / 44)}
    viewBox="0 0 44 96"
    fill="none"
    stroke={c}
    strokeLinecap="round"
    strokeLinejoin="round"
    style={{ display: "block" }}
  >
    <path
      d="M23 62c-6 0-9-5-6-9 3-5 12-4 14 2 3 8-4 15-12 14-10-1-15-10-12-20 3-9 12-14 17-22 4-7 4-17-1-19-5-2-8 6-7 15l7 60c1 8-4 12-10 10-4-2-4-7 0-8"
      strokeWidth="4.4"
    />
    <circle cx="17" cy="84" r="4.4" fill={c} stroke="none" />
  </svg>
);

/* ---- hero: a music-box staff scrolling under a glowing playhead ---- */
const NOTE = (x: number, y: number) => <ellipse cx={x} cy={y} rx="8" ry="6" transform={`rotate(-20 ${x} ${y})`} />;

const Bar = () => (
  <svg width="800" height="120" viewBox="0 0 800 120" fill={I} style={{ flex: "none" }}>
    <g className="hd-note">
      {NOTE(40, 78)}
      <path d="M47 76V40" stroke={I} strokeWidth="2.4" />
    </g>
    <g className="hd-note" style={{ animationDelay: "-.4s" }}>
      {NOTE(110, 62)}
      <path d="M117 60V24" stroke={I} strokeWidth="2.4" />
    </g>
    <g className="hd-note" style={{ animationDelay: "-.8s" }}>
      {NOTE(170, 46)}
      {NOTE(220, 54)}
      <path d="M177 44V14L227 22V52" stroke={I} strokeWidth="2.4" fill="none" />
      <path d="M177 14L227 22" stroke={I} strokeWidth="6" />
    </g>
    <g className="hd-note" style={{ animationDelay: "-1.2s" }}>
      <ellipse cx="300" cy="86" rx="8" ry="6" transform="rotate(-20 300 86)" fill="none" stroke={I} strokeWidth="2.4" />
      <path d="M307 84V48" stroke={I} strokeWidth="2.4" />
    </g>
    <g className="hd-note" style={{ animationDelay: "-1.6s" }}>
      {NOTE(380, 54)}
      <path d="M387 52V16q10 6 12 18" stroke={I} strokeWidth="2.4" fill="none" />
    </g>
    <path d="M440 30v64" stroke={I} strokeWidth="2" opacity=".7" />
    <g className="hd-note" style={{ animationDelay: "-2s" }}>
      {NOTE(480, 70)}
      <path d="M487 68V32" stroke={I} strokeWidth="2.4" />
    </g>
    <g className="hd-note" style={{ animationDelay: "-.2s" }}>
      {NOTE(540, 38)}
      {NOTE(590, 46)}
      <path d="M547 36V6L597 14V44" stroke={I} strokeWidth="2.4" fill="none" />
      <path d="M547 6L597 14" stroke={I} strokeWidth="6" />
    </g>
    <g className="hd-note" style={{ animationDelay: "-.6s" }}>
      <ellipse cx="660" cy="78" rx="8" ry="6" transform="rotate(-20 660 78)" fill="none" stroke={I} strokeWidth="2.4" />
    </g>
    <g className="hd-note" style={{ animationDelay: "-1s" }}>
      {NOTE(740, 62)}
      <path d="M747 60V24" stroke={I} strokeWidth="2.4" />
    </g>
  </svg>
);

const FADE = "linear-gradient(90deg, transparent, #000 14%, #000 86%, transparent)";

const Hero = () => (
  <div
    className="absolute inset-x-0 overflow-hidden"
    style={{ top: 70, height: 120, maskImage: FADE, WebkitMaskImage: FADE }}
  >
    <div
      className="absolute inset-x-0"
      style={{
        top: 30,
        height: 64,
        background: "repeating-linear-gradient(180deg, rgb(var(--hb-rgb) / 35%) 0 1.5px, transparent 1.5px 16px)",
      }}
    />
    <div className="hd-track" style={{ width: 1600, height: 120 }}>
      <Bar />
      <Bar />
    </div>
    <div
      className="hd-playhead absolute left-1/2 top-3.5 h-24 w-[3px] rounded-[3px]"
      style={{ background: A, boxShadow: `0 0 16px ${A}` }}
    />
  </div>
);

/* ---- left: two notes with faces, and a staff winding down the side ---- */
const CENTRE = "M150 40C60 140 240 240 150 340S60 540 150 640";

const Head = ({ kind, c }: { kind: "q" | "e" | "h"; c: string }): ReactNode => {
  const head = (
    <ellipse
      cx="9"
      cy="24"
      rx="7.5"
      ry="5.6"
      transform="rotate(-20 9 24)"
      fill={kind === "h" ? "none" : c}
      stroke={kind === "h" ? c : "none"}
      strokeWidth="2.4"
    />
  );
  const stem =
    kind === "e" ? (
      <path d="M15.5 22V2q8 5 9 14" stroke={c} strokeWidth="2.4" fill="none" />
    ) : (
      <path d="M15.5 22V2" stroke={c} strokeWidth="2.4" />
    );
  return (
    <svg width="28" height="30" viewBox="0 0 28 30" style={{ transform: "translate(-30%,-70%)" }}>
      {head}
      {stem}
    </svg>
  );
};

const RIDERS: { kind: "q" | "e" | "h"; c: string }[] = [
  { kind: "q", c: A },
  { kind: "e", c: I },
  { kind: "q", c: I },
  { kind: "h", c: A },
  { kind: "e", c: A },
  { kind: "q", c: I },
];

const Face = ({ cx, cy }: { cx: number; cy: number }) => (
  <>
    <ellipse className="hd-blink" cx={cx - 7} cy={cy - 2} rx="2.6" ry="3.2" fill={INK} />
    <ellipse className="hd-blink" cx={cx + 6} cy={cy - 5} rx="2.6" ry="3.2" fill={INK} />
    <path d={`M${cx - 4} ${cy + 6}q4 3 8-1`} stroke={INK} strokeWidth="2" strokeLinecap="round" fill="none" />
    <ellipse cx={cx - 13} cy={cy + 5} rx="3.4" ry="2" fill="#FFB3BD" />
    <ellipse cx={cx + 12} cy={cy + 1} rx="3.4" ry="2" fill="#FFB3BD" />
  </>
);

const Left = () => (
  <>
    <div className="hd-sticker" style={{ left: 70, top: vh(140) }}>
      <Poke>
        <svg width="140" height="120" viewBox="0 0 140 120" style={{ overflow: "visible" }}>
          <path d="M44 24L120 10" stroke={INK} strokeWidth="12" strokeLinecap="round" />
          <g className="hd-hop">
            <path d="M44 24v66" stroke={INK} strokeWidth="5" />
            <ellipse cx="28" cy="92" rx="20" ry="15" transform="rotate(-18 28 92)" fill={MINT} />
            <Face cx={28} cy={92} />
          </g>
          <g className="hd-hop" style={{ animationDelay: "-.6s" }}>
            <path d="M120 10v66" stroke={INK} strokeWidth="5" />
            <ellipse cx="104" cy="78" rx="20" ry="15" transform="rotate(-18 104 78)" fill={MINT_2} />
            <Face cx={104} cy={78} />
          </g>
        </svg>
      </Poke>
    </div>

    <div className="hd-sticker hd-wob" style={vars({ left: 118, top: vh(300), "--r": "-8deg" })}>
      <Poke>
        <Treble w={58} c={MINT} />
      </Poke>
    </div>

    <div className="absolute" style={{ left: 0, top: vh(400), width: 304, height: 700 }}>
      <svg className="absolute top-0 left-0" width="304" height="700" fill="none">
        {[-24, -12, 0, 12, 24].map((dx) => (
          <path key={dx} d={CENTRE} transform={`translate(${dx} 0)`} stroke={I} strokeWidth="1.4" opacity=".32" />
        ))}
      </svg>
      {RIDERS.map((r, i) => (
        <div
          key={i}
          className="hd-path hd-ride hd-move"
          style={{
            offsetPath: `path('${CENTRE}')`,
            animationDelay: `${(-i * 14) / 6}s`,
          }}
        >
          <Head kind={r.kind} c={r.c} />
        </div>
      ))}
      <Note x={40} y={660} rotate={-3} muted>
        practice makes… progress
      </Note>
    </div>
  </>
);

/* ---- right: the bass clef, a metronome, and notes drifting up ---- */
const Float = ({
  x,
  y,
  dx,
  delay,
  children,
}: {
  x: number;
  y: string;
  dx: number;
  delay: number;
  children: ReactNode;
}) => (
  <span
    className="hd-float hd-move"
    style={vars({
      left: x,
      top: y,
      "--dx": `${dx}px`,
      animationDelay: `${delay}s`,
    })}
  >
    {children}
  </span>
);

const Right = () => (
  <>
    <div
      className="hd-sticker hd-wob"
      style={vars({
        left: 84,
        top: vh(150),
        "--r": "10deg",
        animationDelay: "-2s",
      })}
    >
      <Poke>
        <Bass w={96} c={MINT} />
      </Poke>
    </div>
    <div
      className="hd-sticker hd-wob"
      style={vars({
        left: 194,
        top: vh(230),
        "--r": "-6deg",
        animationDelay: "-1s",
      })}
    >
      <Poke>
        <Treble w={34} c={MINT_2} />
      </Poke>
    </div>

    <div className="hd-sticker" style={{ left: 74, top: vh(440) }}>
      <Poke>
        <svg width="100" height="140" viewBox="0 0 100 140">
          <path d="M34 8h32l22 120H12z" fill={MINT} />
          <path d="M38 14h24l17 92H21z" fill={PAPER} />
          <path d="M30 70h40M28 82h44M26 94h48" stroke="#9FDCC2" strokeWidth="2" />
          <g className="hd-tick">
            <path d="M50 112V26" stroke={INK} strokeWidth="4" strokeLinecap="round" />
            <rect x="42" y="46" width="16" height="12" rx="3" fill={INK} />
          </g>
          <rect x="8" y="124" width="84" height="12" rx="4" fill="#4FC497" />
          <circle cx="50" cy="112" r="5" fill={INK} />
        </svg>
      </Poke>
    </div>
    <Note x={84} y={vh(600)} rotate={4} size={26}>
      ♩ = 60, no faster
    </Note>

    <Float x={114} y={vh(1000)} dx={-30} delay={0}>
      <svg width="26" height="34" viewBox="0 0 24 32" fill={A}>
        <ellipse cx="8" cy="26" rx="6" ry="4.5" />
        <path d="M13 25V3q8 4 9 12" stroke={A} strokeWidth="2.4" fill="none" />
      </svg>
    </Float>
    <Float x={184} y={vh(1020)} dx={40} delay={-2.3}>
      <svg width="22" height="30" viewBox="0 0 24 32" fill={I}>
        <ellipse cx="8" cy="26" rx="6" ry="4.5" />
        <path d="M13 25V3" stroke={I} strokeWidth="2.4" />
      </svg>
    </Float>
    <Float x={64} y={vh(1020)} dx={20} delay={-4.6}>
      <svg width="34" height="30" viewBox="0 0 34 30" fill={A}>
        <ellipse cx="7" cy="24" rx="6" ry="4.5" />
        <ellipse cx="27" cy="20" rx="6" ry="4.5" />
        <path d="M12 23V5l20-4v18" stroke={A} strokeWidth="2.4" fill="none" />
      </svg>
    </Float>
    <Float x={244} y={vh(980)} dx={-20} delay={-5.6}>
      <svg width="20" height="28" viewBox="0 0 24 32" fill={I}>
        <ellipse cx="8" cy="26" rx="6" ry="4.5" />
        <path d="M13 25V3q8 4 9 12" stroke={I} strokeWidth="2.4" fill="none" />
      </svg>
    </Float>
  </>
);

/* ---- resting on the boxes: a repeat sign and a fermata ---- */
const Grid = () => (
  <div className="hd-sticker hd-wob top-0 right-1.5" style={vars({ "--r": "-6deg", animationDelay: "-2s" })}>
    <Poke>
      <svg width="32" height="42" viewBox="0 0 44 58">
        <rect x="2" y="2" width="40" height="54" rx="8" fill={PAPER} />
        <path d="M12 10v38" stroke={INK} strokeWidth="7" />
        <path d="M22 10v38" stroke={INK} strokeWidth="2.4" />
        <circle cx="31" cy="22" r="3.2" fill={INK} />
        <circle cx="31" cy="36" r="3.2" fill={INK} />
      </svg>
    </Poke>
  </div>
);

const Panel = () => (
  <div className="hd-sticker hd-wob -top-[22px] right-8" style={vars({ "--r": "6deg" })}>
    <Poke>
      <svg width="52" height="33" viewBox="0 0 70 44">
        <path
          d="M4 34C6 14 20 4 35 4s29 10 31 30c-1 2-3 2-4 0C58 20 48 12 35 12S12 20 8 34c-1 2-3 2-4 0z"
          fill={MINT}
        />
        <circle cx="35" cy="31" r="6.5" fill={MINT} />
      </svg>
    </Poke>
  </div>
);

/* ---- the foot of the page: a keyboard, its keys pressing in a slow wave ---- */
const WHITE = 64;
/** Semitones above C for each white key in an octave, and where black keys sit. */
const STEPS = [0, 2, 4, 5, 7, 9, 11];
const HAS_BLACK = [0, 1, 3, 4, 5];
/** White key i, from C2 up through six octaves and round again. */
const whiteMidi = (i: number) => 36 + 12 * (Math.floor(i / 7) % 6) + STEPS[i % 7];

let audio: AudioContext | null = null;

/**
 * One soft, bell-ish piano note. Every note is its own little chain of
 * nodes that stops and lets go after a second and a half, rather than one
 * long-lived voice being re-shaped, which newer Chromium handles badly.
 */
const playNote = (midi: number) => {
  try {
    audio ??= new AudioContext();
    if (audio.state === "suspended") void audio.resume();
    const ctx = audio;
    const t = ctx.currentTime;
    const f = 440 * 2 ** ((midi - 69) / 12);
    const out = ctx.createGain();
    out.gain.setValueAtTime(0.0001, t);
    out.gain.exponentialRampToValueAtTime(0.14, t + 0.012);
    out.gain.exponentialRampToValueAtTime(0.0001, t + 1.4);
    out.connect(ctx.destination);
    const partials: [number, OscillatorType, number][] = [
      [1, "triangle", 1],
      [2, "sine", 0.3],
      [3, "sine", 0.08],
    ];
    for (const [mult, type, level] of partials) {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = type;
      osc.frequency.value = f * mult;
      gain.gain.value = level;
      osc.connect(gain).connect(out);
      osc.start(t);
      osc.stop(t + 1.5);
      osc.onended = () => {
        osc.disconnect();
        gain.disconnect();
      };
    }
    window.setTimeout(() => out.disconnect(), 1700);
  } catch {
    // No audio here; the key still presses.
  }
};

/** Pointer handlers for a key: press and sound, drag across to glide, let go. */
const keyProps = (midi: number) => {
  const down = (el: HTMLElement) => {
    if (el.hasAttribute("data-down")) return;
    el.setAttribute("data-down", "");
    playNote(midi);
  };
  const up = (el: HTMLElement) => el.removeAttribute("data-down");
  return {
    onPointerDown: (e: React.PointerEvent<HTMLElement>) => {
      e.currentTarget.releasePointerCapture?.(e.pointerId);
      down(e.currentTarget);
    },
    onPointerEnter: (e: React.PointerEvent<HTMLElement>) => {
      if (e.buttons & 1) down(e.currentTarget);
    },
    onPointerUp: (e: React.PointerEvent<HTMLElement>) => up(e.currentTarget),
    onPointerLeave: (e: React.PointerEvent<HTMLElement>) => up(e.currentTarget),
    onPointerCancel: (e: React.PointerEvent<HTMLElement>) => up(e.currentTarget),
  };
};

/* ---- the foot of the page: a keyboard, its keys pressing in a slow wave. It plays, too. ---- */
const Bottom = () => (
  <>
    <div
      className="absolute inset-x-0 top-[18px] h-2 opacity-35 blur-[4px]"
      style={{ background: `linear-gradient(90deg, transparent, ${A}, transparent)` }}
    />
    <div
      className="absolute top-[26px] -left-[30px] flex touch-none gap-[3px] rounded-t-2xl px-1.5 pt-1.5"
      style={{ background: INK }}
    >
      {Array.from({ length: WHITE }, (_, i) => (
        <span
          key={i}
          className="hd-key"
          style={{ animationDelay: `${(i * 0.11).toFixed(2)}s` }}
          {...keyProps(whiteMidi(i))}
        />
      ))}
      {Array.from({ length: WHITE - 1 }, (_, i) =>
        HAS_BLACK.includes(i % 7) ? (
          <span
            key={`b${i}`}
            className="hd-black absolute top-1.5 h-[52px] w-6 rounded-b-[5px]"
            style={{ left: 6 + i * 42 + 30, background: INK, boxShadow: "inset 0 -3px 0 rgba(255,255,255,.08)" }}
            {...keyProps(whiteMidi(i) + 1)}
          />
        ) : null,
      )}
    </div>
  </>
);

const set: DecoSet = { Hero, Left, Right, Grid, Panel, Bottom };
export default set;
