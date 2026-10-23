"use client";

import { useSyncExternalStore } from "react";
import type { AmbienceKind } from "./scenes";

/**
 * Ambient sound. The beds are recordings (public/home/sounds, see the README
 * there for where they're from), fetched the first time they're needed and
 * layered with Web Audio; the café's jazz is composed on the fly.
 */

let ctx: AudioContext | null = null;
let master: GainNode | null = null;
let bed: { kind: AmbienceKind; stop: () => void } | null = null;

const FADE = 0.6;

export type AmbienceStatus = "off" | "loading" | "playing" | "error";
let status: AmbienceStatus = "off";

// Whether sound is actually playing, which can differ from the saved
// preference: a returning visitor's "on" waits for their first click.
const statusListeners = new Set<() => void>();
const setStatus = (next: AmbienceStatus) => {
  status = next;
  statusListeners.forEach((l) => l());
};
const subscribeStatus = (l: () => void) => {
  statusListeners.add(l);
  return () => statusListeners.delete(l);
};

export const useAmbienceStatus = () =>
  useSyncExternalStore(subscribeStatus, () => status, () => "off" as const);

/** On, including while its recordings are still loading. */
export const useAmbiencePlaying = () => useAmbienceStatus() !== "off";

function context() {
  if (!ctx) {
    const Ctor =
      window.AudioContext ??
      (window as unknown as { webkitAudioContext: typeof AudioContext })
        .webkitAudioContext;
    ctx = new Ctor();
    master = ctx.createGain();
    master.gain.value = 0;
    master.connect(ctx.destination);
  }
  if (ctx.state === "suspended") void ctx.resume();
  return ctx;
}

let primed = false;

/**
 * Creates or resumes the audio context. Call it inside a click handler:
 * Safari only lets audio start from within the gesture itself.
 */
export function primeAudio() {
  if (typeof window === "undefined") return;
  context();
  primed = true;
}

/** True once a gesture has started audio. `resume()` settles asynchronously,
 *  so the context can still read "suspended" right after priming. */
export const audioUnlocked = () => primed || ctx?.state === "running";

/** Wires `src` through each node in turn into `out`, and returns `src`. */
function route<T extends AudioNode>(src: T, out: AudioNode, ...nodes: AudioNode[]) {
  [src, ...nodes].reduce((a, b) => {
    a.connect(b);
    return b;
  }).connect(out);
  return src;
}

function filter(c: AudioContext, type: BiquadFilterType, freq: number, q = 0.7) {
  const f = c.createBiquadFilter();
  f.type = type;
  f.frequency.value = freq;
  f.Q.value = q;
  return f;
}

function gain(c: AudioContext, value: number) {
  const g = c.createGain();
  g.gain.value = value;
  return g;
}

// ------------------------------------------------------------ recordings

/** Decoded, loop-ready recordings by file name. Decoded audio is big (about
 *  23 MB a stereo minute), so only the current sound's are kept. */
const recordings = new Map<string, Promise<AudioBuffer>>();

function load(c: AudioContext, file: string) {
  let buffer = recordings.get(file);
  if (!buffer) {
    buffer = fetch(`/home/sounds/${file}.mp3`)
      .then((r) => {
        if (!r.ok) throw new Error(`${file}: ${r.status}`);
        return r.arrayBuffer();
      })
      .then((data) => c.decodeAudioData(data))
      .then((decoded) => seamless(c, decoded));
    // A failed fetch is retried next time rather than remembered.
    buffer.catch(() => recordings.delete(file));
    recordings.set(file, buffer);
  }
  return buffer;
}

/**
 * Folds the last couple of seconds of a recording over its start with an
 * equal-power crossfade, so it loops without a seam (and without the gap
 * MP3 encoders pad the ends with).
 */
function seamless(c: AudioContext, input: AudioBuffer, seconds = 2) {
  const fade = Math.min(Math.floor(seconds * input.sampleRate), Math.floor(input.length / 4));
  const length = input.length - fade;
  const output = c.createBuffer(input.numberOfChannels, length, input.sampleRate);
  for (let ch = 0; ch < input.numberOfChannels; ch++) {
    const src = input.getChannelData(ch);
    const dst = output.getChannelData(ch);
    dst.set(src.subarray(0, length));
    for (let i = 0; i < fade; i++) {
      const t = (i / fade) * (Math.PI / 2);
      dst[i] = src[i] * Math.sin(t) + src[length + i] * Math.cos(t);
    }
  }
  return output;
}

interface Layer {
  file: string;
  gain: number;
  /** Muffles it, for rain heard through glass from inside. */
  lowpass?: number;
  /** Seconds into the loop to start, so a recording used twice doesn't line up. */
  offset?: number;
}

interface Recipe {
  layers: Layer[];
  /** Anything generated rather than recorded. Returns a stop function. */
  extra?: (c: AudioContext, out: AudioNode) => () => void;
}

const RECIPES: Record<AmbienceKind, Recipe> = {
  glass: { layers: [{ file: "rain-on-window", gain: 0.85 }] },
  hill: {
    layers: [
      { file: "light-rain", gain: 0.7 },
      { file: "rain-on-leaves", gain: 0.3 },
      { file: "wind", gain: 0.38 },
    ],
  },
  storm: {
    layers: [
      { file: "heavy-rain", gain: 0.72 },
      { file: "rain-on-window", gain: 0.3, lowpass: 2200, offset: 11 },
      { file: "thunder", gain: 0.95 },
    ],
  },
  waves: {
    layers: [
      { file: "waves", gain: 0.85 },
      { file: "wind", gain: 0.12, offset: 20 },
    ],
  },
  cafe: {
    layers: [
      { file: "cafe", gain: 0.5 },
      { file: "rain-on-window", gain: 0.32, lowpass: 900 },
    ],
    extra: (c, out) => jazz(c, route(gain(c, 0.6), out)),
  },
};

// ------------------------------------------------------------------ jazz

type Quality = "maj9" | "m9" | "13" | "9" | "m7";

/** Rootless voicings, as semitones above the root. */
const VOICING: Record<Quality, number[]> = {
  maj9: [4, 7, 11, 14],
  m9: [3, 7, 10, 14],
  m7: [3, 7, 10, 15],
  "13": [4, 10, 14, 21],
  "9": [4, 10, 14, 19],
};

/** Two eight-bar loops of changes in F, one or two chords a bar. Roots are
 *  pitch classes (0 = C). */
const FORMS: [root: number, quality: Quality][][][] = [
  [
    [[5, "maj9"]],
    [[2, "m9"]],
    [[7, "m9"]],
    [[0, "13"]],
    [[9, "m7"], [2, "9"]],
    [[7, "m9"]],
    [[0, "13"]],
    [[5, "maj9"]],
  ],
  [
    [[10, "maj9"]],
    [[10, "m7"], [3, "9"]],
    [[9, "m7"]],
    [[2, "9"]],
    [[7, "m9"]],
    [[0, "13"]],
    [[5, "maj9"], [2, "m9"]],
    [[7, "m9"], [0, "13"]],
  ],
];

/** Where each chord hit lands in a bar, in beats, and how long it rings.
 *  Swung: the offbeat falls two-thirds of the way through the beat. */
const COMPING: [at: number, length: number][][] = [
  [[0, 1.6], [1 + 2 / 3, 1.2]],
  [[0, 3.4]],
  [[2 / 3, 1.3], [2 + 2 / 3, 1.2]],
  [[0, 1.2], [2, 1.6]],
];

const midiHz = (n: number) => 440 * 2 ** ((n - 69) / 12);
const pick = <T,>(items: T[]) => items[Math.floor(Math.random() * items.length)];
const jitter = (amount: number) => (Math.random() - 0.5) * amount;

/** The voicing's notes, in the octave that sits closest around D4. */
function voice(root: number, quality: Quality) {
  const shape = VOICING[quality];
  const centre = shape.reduce((a, b) => a + b, 0) / shape.length;
  const base = root + 12 * Math.round((62 - centre - root) / 12);
  return shape.map((i) => base + i);
}

/** A tiny room: a burst of decaying stereo noise as the convolver's impulse. */
function room(c: AudioContext, seconds: number) {
  const length = Math.floor(c.sampleRate * seconds);
  const impulse = c.createBuffer(2, length, c.sampleRate);
  for (let ch = 0; ch < 2; ch++) {
    const data = impulse.getChannelData(ch);
    for (let i = 0; i < length; i++) {
      data[i] = (Math.random() * 2 - 1) * (1 - i / length) ** 3;
    }
  }
  const convolver = c.createConvolver();
  convolver.buffer = impulse;
  return convolver;
}

/**
 * Light jazz, composed as it plays: an electric piano comping over a walking
 * bass, with brushes and a soft ride, round a loop of ii–V–I changes.
 * Generated rather than recorded, so it's free of copyright and never
 * plays the same way twice. Returns a stop function.
 */
function jazz(c: AudioContext, out: AudioNode) {
  const beat = 60 / 74;
  // Out of a small café speaker, into the room.
  const mix = gain(c, 1);
  const speaker = filter(c, "lowpass", 5500, 0.5);
  mix.connect(speaker).connect(out);
  route(speaker, out, room(c, 1.8), gain(c, 0.28));

  const noise = c.createBuffer(1, c.sampleRate * 2, c.sampleRate);
  const nd = noise.getChannelData(0);
  for (let i = 0; i < nd.length; i++) nd[i] = Math.random() * 2 - 1;

  /** Electric piano: an FM tine, bright as it's struck and mellowing. */
  const piano = (note: number, at: number, length: number, level: number) => {
    const f = midiHz(note);
    const carrier = c.createOscillator();
    const mod = c.createOscillator();
    const depth = c.createGain();
    const env = c.createGain();
    carrier.frequency.value = f;
    mod.frequency.value = f;
    depth.gain.setValueAtTime(f * 1.2, at);
    depth.gain.exponentialRampToValueAtTime(f * 0.15, at + 0.8);
    mod.connect(depth).connect(carrier.frequency);
    env.gain.setValueAtTime(0, at);
    env.gain.linearRampToValueAtTime(level, at + 0.006);
    env.gain.setTargetAtTime(level * 0.35, at + 0.006, 0.6);
    env.gain.setTargetAtTime(0, at + length, 0.12);
    carrier.connect(env).connect(mix);
    const end = at + length + 0.8;
    carrier.start(at);
    mod.start(at);
    carrier.stop(end);
    mod.stop(end);
  };

  /** Upright bass: a round pluck that dies away. */
  const bass = (note: number, at: number, length: number) => {
    const osc = c.createOscillator();
    osc.type = "triangle";
    osc.frequency.value = midiHz(note);
    const tone = filter(c, "lowpass", 650, 1.2);
    const env = c.createGain();
    env.gain.setValueAtTime(0, at);
    env.gain.linearRampToValueAtTime(0.2, at + 0.012);
    env.gain.setTargetAtTime(0.08, at + 0.012, 0.12);
    env.gain.setTargetAtTime(0, at + length * 0.92, 0.05);
    osc.connect(tone).connect(env).connect(mix);
    osc.start(at);
    osc.stop(at + length + 0.4);
  };

  /** Filtered noise with a quick envelope: brushes and the ride. */
  const hit = (at: number, freq: number, q: number, level: number, attack: number, decay: number) => {
    const src = c.createBufferSource();
    src.buffer = noise;
    const env = c.createGain();
    env.gain.setValueAtTime(0, at);
    env.gain.linearRampToValueAtTime(level, at + attack);
    env.gain.setTargetAtTime(0, at + attack, decay);
    src.connect(filter(c, "bandpass", freq, q)).connect(env).connect(mix);
    src.start(at, Math.random() * 0.5);
    src.stop(at + attack + decay * 6);
  };

  /** Roots in the bass register, C2 to B2. */
  const low = (pc: number) => 36 + ((pc - 36) % 12 + 12) % 12;

  let form = 0;
  let bar = 0;
  let next = c.currentTime + 0.2;

  const playBar = (t: number) => {
    const chords = FORMS[form][bar];
    const following = FORMS[form][(bar + 1) % 8];
    const per = 4 / chords.length;

    chords.forEach(([root, quality], i) => {
      const start = t + i * per * beat;
      const notes = voice(root, quality);
      const pattern = per === 4 ? pick(COMPING) : [[0, per * 0.8] as [number, number]];
      for (const [at, length] of pattern) {
        const when = start + at * beat + jitter(0.02);
        const level = 0.08 + Math.random() * 0.03;
        // A strum of a few milliseconds, low to high.
        notes.forEach((n, k) => piano(n, when + k * 0.008, length * beat, level));
      }

      // Walking bass: the root, chord tones, then a step into the next chord.
      const nextRoot = i + 1 < chords.length ? chords[i + 1][0] : following[0][0];
      const r = low(root);
      const fifth = r + 7;
      const third = r + VOICING[quality][0];
      const approach = low(nextRoot) + pick([-1, 1]);
      const walk = per === 4 ? [r, pick([third, fifth]), pick([fifth, r + 12, third]), approach] : [r, approach];
      walk.forEach((n, k) => bass(n, start + k * beat + jitter(0.012), beat));
    });

    // Now and then a short phrase over the top, from the chord's own notes.
    if (Math.random() < 0.3) {
      const [root, quality] = chords[0];
      const tones = voice(root, quality).map((n) => n + 12);
      let at = pick([1 + 2 / 3, 2]);
      let k = Math.floor(Math.random() * tones.length);
      for (let i = 0; i < 2 + Math.floor(Math.random() * 3) && at < 4; i++) {
        piano(tones[k], t + at * beat + jitter(0.02), beat * 0.6, 0.1);
        k = Math.max(0, Math.min(tones.length - 1, k + pick([-1, 1, 1])));
        at += pick([1 / 3, 2 / 3, 1]);
      }
    }

    // Brushes on two and four, a swirl between, and the ride's swung pattern.
    for (let b = 0; b < 4; b++) {
      const at = t + b * beat;
      if (b % 2 === 1) hit(at, 2400, 0.6, 0.16, 0.015, 0.08);
      hit(at, 3200, 0.4, 0.045, beat * 0.4, beat * 0.25);
      hit(at, 5800, 1.4, 0.09, 0.002, 0.12);
      if (b % 2 === 1) hit(at + (beat * 2) / 3, 5800, 1.4, 0.06, 0.002, 0.08);
    }
  };

  const schedule = () => {
    // Two seconds ahead: background tabs only get timers once a second.
    while (next < c.currentTime + 2) {
      playBar(next);
      next += 4 * beat;
      bar += 1;
      if (bar === 8) {
        bar = 0;
        if (Math.random() < 0.5) form = (form + 1) % FORMS.length;
      }
    }
  };
  schedule();
  const timer = setInterval(schedule, 400);
  return () => clearInterval(timer);
}

/** Perceived loudness is roughly the square of the gain. */
const curve = (v: number) => v * v * 0.8;

export function setAmbienceVolume(volume: number) {
  if (!ctx || !master || !bed) return;
  master.gain.setTargetAtTime(curve(volume), ctx.currentTime, 0.08);
}

export function playAmbience(kind: AmbienceKind, volume: number) {
  const c = context();
  if (!master) return;
  master.gain.setTargetAtTime(curve(volume), c.currentTime, 0.15);
  if (bed?.kind === kind) return;

  // Crossfade: the old bed fades out on its own bus while the new one fades
  // in, once its recordings have arrived.
  bed?.stop();
  const bus = gain(c, 0);
  bus.connect(master);
  const recipe = RECIPES[kind];
  const files = recipe.layers.map((l) => l.file);
  for (const file of recordings.keys()) if (!files.includes(file)) recordings.delete(file);
  const sources: AudioBufferSourceNode[] = [];
  let stopExtra = () => {};
  let stopped = false;
  setStatus("loading");

  Promise.all(files.map((file) => load(c, file))).then(
    (buffers) => {
      if (stopped) return;
      buffers.forEach((buffer, i) => {
        const layer = recipe.layers[i];
        const src = c.createBufferSource();
        src.buffer = buffer;
        src.loop = true;
        const chain = layer.lowpass ? [filter(c, "lowpass", layer.lowpass, 0.5)] : [];
        route(src, bus, ...chain, gain(c, layer.gain));
        src.start(0, (layer.offset ?? 0) % buffer.duration);
        sources.push(src);
      });
      if (recipe.extra) stopExtra = recipe.extra(c, bus);
      bus.gain.setTargetAtTime(1, c.currentTime, FADE / 3);
      setStatus("playing");
    },
    () => {
      if (!stopped) setStatus("error");
    },
  );

  bed = {
    kind,
    stop: () => {
      stopped = true;
      stopExtra();
      bus.gain.setTargetAtTime(0, c.currentTime, FADE / 3);
      const end = c.currentTime + FADE * 2;
      sources.forEach((s) => s.stop(end));
      // Long enough for anything the jazz had already scheduled to finish.
      setTimeout(() => bus.disconnect(), 3000);
    },
  };
}

export function stopAmbience() {
  if (!bed) return;
  bed.stop();
  bed = null;
  setStatus("off");
}

/**
 * A few sine notes with overtones and a long tail: the house bell. Plays even
 * with ambience off. A sound can be due on load, before any click; the
 * browser would refuse it, so it isn't asked for.
 */
function bell(
  notes: [freq: number, delay: number][],
  { level = 0.22, attack = 0.012, decay = 2.6 } = {},
) {
  if (typeof window === "undefined") return;
  const activated = navigator.userActivation?.hasBeenActive ?? true;
  if (!audioUnlocked() && !activated) return;
  const c = context();
  const out = gain(c, level);
  out.connect(c.destination);
  for (const [freq, delay] of notes) {
    for (const [mult, amount] of [
      [1, 1],
      [2, 0.25],
      [3.01, 0.08],
    ]) {
      const osc = c.createOscillator();
      osc.type = "sine";
      osc.frequency.value = freq * mult;
      const env = c.createGain();
      const t = c.currentTime + delay;
      env.gain.setValueAtTime(0, t);
      env.gain.linearRampToValueAtTime(amount, t + attack);
      env.gain.exponentialRampToValueAtTime(0.0001, t + decay);
      osc.connect(env).connect(out);
      osc.start(t);
      osc.stop(t + decay + 0.1);
    }
  }
  const longest = Math.max(...notes.map(([, d]) => d)) + decay;
  setTimeout(() => out.disconnect(), longest * 1000 + 500);
}

/** End of a focus session: two bright rising notes. */
export const playChime = () =>
  bell([
    [659.25, 0],
    [987.77, 0.22],
  ]);

/** Time to rest your eyes: two low notes falling, eased in so it never startles. */
export const playEyeChime = () =>
  bell(
    [
      [523.25, 0],
      [392, 0.45],
    ],
    { level: 0.16, attack: 0.09, decay: 3.2 },
  );

/** The rest is over: the start chime's answer, three soft notes rising. */
export const playRestDone = () =>
  bell(
    [
      [392, 0],
      [523.25, 0.3],
      [659.25, 0.6],
    ],
    { level: 0.11, attack: 0.07, decay: 2.6 },
  );
