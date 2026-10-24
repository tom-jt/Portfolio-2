"use client";

import { useSyncExternalStore } from "react";
import type { DropKind } from "./garden";
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
  /** Heard only now and then: fades in for a few seconds, then away for a while. */
  bursts?: { on: [min: number, max: number]; off: [min: number, max: number] };
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
  wind: {
    layers: [
      { file: "wind", gain: 0.62 },
      { file: "light-rain", gain: 0.32, lowpass: 3000 },
    ],
  },
  leaves: {
    layers: [
      { file: "rain-on-leaves", gain: 0.8 },
      { file: "light-rain", gain: 0.22, offset: 9 },
    ],
  },
  deluge: {
    layers: [
      { file: "heavy-rain", gain: 0.85 },
      { file: "rain-on-window", gain: 0.25, lowpass: 1600, offset: 5 },
    ],
  },
  lake: {
    layers: [
      { file: "waves", gain: 0.32, lowpass: 900 },
      { file: "wind", gain: 0.14, offset: 30 },
    ],
    extra: (c, out) => crickets(c, out, 1.1),
  },
  woods: {
    layers: [
      // Kept low: a hush of leaves under the birds, not a rustle over them.
      { file: "rain-on-leaves", gain: 0.05, lowpass: 2000, offset: 14 },
      // The canopy stirring overhead, rather than wind in the open.
      { file: "wind-in-trees", gain: 0.2, lowpass: 3200, offset: 8 },
    ],
    extra: (c, out) => {
      const stops = [birds(c, out), halo(c, out)];
      return () => stops.forEach((stop) => stop());
    },
  },
  cosmos: {
    layers: [],
    extra: drone,
  },
  shore: {
    layers: [
      { file: "waves", gain: 0.85 },
      { file: "wind", gain: 0.16, offset: 40 },
      { file: "seagulls", gain: 0.3, lowpass: 5000, bursts: { on: [5, 10], off: [14, 32] } },
    ],
    extra: (c, out) => crickets(c, out, 0.25),
  },
  majula: {
    layers: [
      { file: "majula", gain: 0.9 },
      { file: "campfire", gain: 0.7 },
    ],
  },
  snow: {
    // Calm: the howling gusts are kept low and muffled under a steady wind.
    layers: [
      { file: "howling-wind", gain: 0.35, lowpass: 1100 },
      { file: "wind", gain: 0.3, lowpass: 1200, offset: 25 },
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

// ---------------------------------------------------------------- nature

/**
 * Calls `play(at)` for each event a little ahead of the audio clock, where
 * `play` returns the seconds until the next. Two seconds ahead, because
 * background tabs only get timers once a second. Returns a stop function.
 */
function every(c: AudioContext, play: (at: number) => number) {
  let next = c.currentTime + 0.5;
  const schedule = () => {
    // Back from a stall (a throttled background tab, a busy page): skip what
    // was missed, rather than pile every missed event into the past at once.
    if (next < c.currentTime) next = c.currentTime + 0.05;
    while (next < c.currentTime + 2) next += Math.max(0.05, play(next) || 0);
  };
  schedule();
  const timer = setInterval(schedule, 400);
  return () => clearInterval(timer);
}

/** Swells `param` up to `level` for a few seconds at a time, with long
 *  quiet spells between. Returns a stop function. */
function bursts(c: AudioContext, param: AudioParam, level: number, { on, off }: NonNullable<Layer["bursts"]>) {
  const span = ([min, max]: [number, number]) => min + Math.random() * (max - min);
  return every(c, (at) => {
    const hold = span(on);
    param.setTargetAtTime(level, at, 0.8);
    param.setTargetAtTime(0, at + hold, 1.2);
    return hold + span(off);
  });
}

/** Birds in the canopy: short phrases of whistled notes, a second or few
 *  apart, each bird with its own pitch and pattern, and its own place in the
 *  trees from left to right. */
function birds(c: AudioContext, out: AudioNode) {
  const bus = gain(c, 0.85);
  // Deep woods: more of each call comes back off the trunks.
  route(bus, out, room(c, 3.2), gain(c, 0.5));
  bus.connect(out);
  /** `bend` is how far each note slides, up or down. */
  const voices = [
    { base: 2600, spread: 900, notes: [3, 6], gap: 0.13, length: 0.09, bend: 0.35 },
    { base: 3400, spread: 500, notes: [2, 4], gap: 0.2, length: 0.16, bend: 0.35 },
    { base: 1900, spread: 700, notes: [4, 8], gap: 0.09, length: 0.06, bend: 0.35 },
    // A lower, slower song further off, like a thrush in the understorey.
    { base: 1300, spread: 400, notes: [2, 4], gap: 0.28, length: 0.22, bend: 0.35 },
    // A quick bright trill, like a wren's.
    { base: 3800, spread: 250, notes: [7, 12], gap: 0.045, length: 0.035, bend: 0.2 },
    // A soft call that hardly bends: a dove somewhere further back.
    { base: 820, spread: 120, notes: [2, 3], gap: 0.42, length: 0.3, bend: 0.06 },
  ];
  const chirp = (into: AudioNode, at: number, from: number, to: number, length: number, level: number) => {
    const osc = c.createOscillator();
    osc.type = "sine";
    osc.frequency.setValueAtTime(from, at);
    osc.frequency.exponentialRampToValueAtTime(to, at + length);
    const env = c.createGain();
    env.gain.setValueAtTime(0, at);
    env.gain.linearRampToValueAtTime(level, at + length * 0.25);
    env.gain.exponentialRampToValueAtTime(0.0001, at + length);
    osc.connect(env).connect(into);
    osc.start(at);
    osc.stop(at + length + 0.05);
  };
  return every(c, (at) => {
    const v = pick(voices);
    const count = v.notes[0] + Math.floor(Math.random() * (v.notes[1] - v.notes[0] + 1));
    const level = 0.035 + Math.random() * 0.035;
    const place = c.createStereoPanner();
    place.pan.value = jitter(1.4);
    place.connect(bus);
    for (let i = 0; i < count; i++) {
      const f = v.base + jitter(v.spread);
      const to = Math.random() < 0.5 ? f * (1 + v.bend) : f / (1 + v.bend);
      chirp(place, at + i * v.gap, f, to, v.length, level);
    }
    return count * v.gap + 0.8 + Math.random() * 2.8;
  });
}

/**
 * Sunlight through the canopy: a warm chord held very quietly, each note a
 * pair a few cents apart so it shimmers as they beat, swelling and fading
 * over half a minute, with now and then a faint glint of a note above it.
 */
function halo(c: AudioContext, out: AudioNode) {
  const bus = gain(c, 0);
  const tone = filter(c, "lowpass", 2400, 0.5);
  bus.connect(tone);
  route(tone, out, room(c, 3.6), gain(c, 0.7));
  tone.connect(out);
  // It comes up slowly, well after the birds and leaves.
  bus.gain.setTargetAtTime(0.6, c.currentTime, 4);
  const sources: OscillatorNode[] = [];
  // D major with its ninth, spread wide: D4, A4, E5, F♯5, and A5.
  for (const note of [62, 69, 76, 78, 81]) {
    for (const cents of [-5, 5]) {
      const osc = c.createOscillator();
      osc.frequency.value = midiHz(note);
      osc.detune.value = cents + jitter(2);
      osc.connect(gain(c, note < 70 ? 0.004 : 0.0028)).connect(bus);
      osc.start();
      sources.push(osc);
    }
  }
  // The swell, between a third of its level and all of it.
  const lfo = c.createOscillator();
  lfo.frequency.value = 1 / 28;
  lfo.connect(gain(c, 0.4)).connect(bus.gain);
  lfo.start();
  sources.push(lfo);

  const stopGlints = every(c, (at) => {
    const osc = c.createOscillator();
    osc.frequency.value = midiHz(pick([86, 88, 90, 93]));
    const env = c.createGain();
    env.gain.setValueAtTime(0, at);
    env.gain.linearRampToValueAtTime(0.003, at + 1.2);
    env.gain.linearRampToValueAtTime(0, at + 4);
    osc.connect(env).connect(bus);
    osc.start(at);
    osc.stop(at + 4.1);
    return 4 + Math.random() * 8;
  });
  return () => {
    stopGlints();
    const t = c.currentTime;
    for (const s of sources) s.stop(t + 3);
  };
}

/** Crickets: trains of quick high pulses, now near, now far, in bursts of a
 *  few seconds with quiet between, the way a chorus starts and stops. */
function crickets(c: AudioContext, out: AudioNode, level: number) {
  const bus = gain(c, level);
  route(bus, out, filter(c, "highpass", 2500, 0.7));
  // Opens mid-chorus, so there's something to hear straight away.
  let left = 6;
  return every(c, (at) => {
    if (left === 0) {
      // Start the next burst after a lull.
      left = 5 + Math.floor(Math.random() * 9);
      return 3 + Math.random() * 6;
    }
    left -= 1;
    const f = 4200 + Math.random() * 900;
    const pulses = 3 + Math.floor(Math.random() * 4);
    const near = 0.012 + Math.random() * 0.016;
    for (let i = 0; i < pulses; i++) {
      const t = at + i * 0.045;
      const osc = c.createOscillator();
      osc.frequency.value = f;
      const env = c.createGain();
      env.gain.setValueAtTime(0, t);
      env.gain.linearRampToValueAtTime(near, t + 0.006);
      env.gain.exponentialRampToValueAtTime(0.0001, t + 0.03);
      osc.connect(env).connect(bus);
      osc.start(t);
      osc.stop(t + 0.04);
    }
    return 0.25 + Math.random() * 0.45;
  });
}

/**
 * Deep space: a low chord held for ever, its filter opening and closing over
 * half a minute, and now and then a faint high shimmer like distant light.
 */
function drone(c: AudioContext, out: AudioNode) {
  const bus = gain(c, 0.9);
  const tone = filter(c, "lowpass", 600, 0.9);
  bus.connect(tone);
  route(tone, out, room(c, 4));
  tone.connect(out);
  const sources: OscillatorNode[] = [];
  for (const [note, detune, level] of [
    [38, -6, 0.1],
    [38, 7, 0.1],
    [45, 0, 0.07],
    [50, 4, 0.05],
    [57, -3, 0.025],
  ] as const) {
    const osc = c.createOscillator();
    osc.type = "sawtooth";
    osc.frequency.value = midiHz(note);
    osc.detune.value = detune;
    osc.connect(gain(c, level)).connect(bus);
    osc.start();
    sources.push(osc);
  }
  // The filter breathes.
  const lfo = c.createOscillator();
  lfo.frequency.value = 1 / 32;
  const depth = gain(c, 380);
  lfo.connect(depth).connect(tone.frequency);
  lfo.start();
  sources.push(lfo);

  const stopShimmer = every(c, (at) => {
    const osc = c.createOscillator();
    osc.frequency.value = midiHz(81 + [0, 2, 4, 7, 9][Math.floor(Math.random() * 5)]);
    const env = c.createGain();
    env.gain.setValueAtTime(0, at);
    env.gain.linearRampToValueAtTime(0.012, at + 2.5);
    env.gain.linearRampToValueAtTime(0, at + 6);
    osc.connect(env).connect(bus);
    osc.start(at);
    osc.stop(at + 6.2);
    return 5 + Math.random() * 7;
  });
  return () => {
    stopShimmer();
    const t = c.currentTime;
    for (const s of sources) s.stop(t + 3);
  };
}

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
    // Skip any bars missed while timers were held up, as `every` does.
    if (next < c.currentTime) next = c.currentTime + 0.1;
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

/**
 * The volume slider's position as gain: an audio taper, in even steps of
 * decibels across the top 20 dB, so every part of its travel is heard, and
 * fading to silence over the last few percent. The top is as loud as ever.
 * (A square law, which this replaced, left the bottom quarter all but silent.)
 */
const TAPER_DB = 20;
const curve = (v: number) => 0.8 * 10 ** ((-TAPER_DB * (1 - v)) / 20) * Math.min(1, v / 0.04);

/** The ambience's own level, kept so a chime's dip can return to it. */
let volume = 0;
/** When the current dip under a chime ends, in context time. */
let duckUntil = 0;
/** Ambience dips to this share of its level under a chime… */
const DUCK = 0.3;
/** …and is most of the way down this many seconds after the dip starts. */
const DUCK_LEAD = 0.25;

/**
 * Dips the ambience under a chime for `seconds` from now, then lets it swell
 * back. Returns whether there was any to dip.
 */
function duck(seconds: number) {
  if (!ctx || !master || !bed) return false;
  const t = ctx.currentTime;
  duckUntil = Math.max(duckUntil, t + seconds);
  const g = master.gain;
  g.cancelScheduledValues(t);
  g.setValueAtTime(g.value, t);
  g.setTargetAtTime(curve(volume) * DUCK, t, DUCK_LEAD / 3);
  g.setTargetAtTime(curve(volume), duckUntil, 0.5);
  return true;
}

const ducking = () => !!ctx && ctx.currentTime < duckUntil;

export function setAmbienceVolume(v: number) {
  volume = v;
  if (!ctx || !master || !bed) return;
  // Mid-dip, move the dip's level and where it returns to instead.
  if (ducking()) duck(0);
  else master.gain.setTargetAtTime(curve(v), ctx.currentTime, 0.08);
}

export function playAmbience(kind: AmbienceKind, v: number) {
  const c = context();
  if (!master) return;
  volume = v;
  if (!ducking()) master.gain.setTargetAtTime(curve(v), c.currentTime, 0.15);
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
  const stoppers: (() => void)[] = [];
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
        const level = gain(c, layer.bursts ? 0 : layer.gain);
        route(src, bus, ...chain, level);
        src.start(0, (layer.offset ?? 0) % buffer.duration);
        sources.push(src);
        if (layer.bursts) stoppers.push(bursts(c, level.gain, layer.gain, layer.bursts));
      });
      if (recipe.extra) stoppers.push(recipe.extra(c, bus));
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
      stoppers.forEach((s) => s());
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
 * How loud a sound over the ambience plays, as a share of its own level.
 * Fixed levels sat far above the bed: a chime came 14 dB over it at full
 * volume and 25 dB at the default, so with the speakers turned up for a quiet
 * bed it arrived as a loud beep. Over the ambience they now follow its
 * volume, to a floor that keeps a reminder from going unheard. With the
 * ambience off they play at their own level.
 */
const overAmbience = () => (bed ? Math.max(0.3, (0.6 * curve(volume)) / curve(1)) : 1);

/** When each chime last rang, so one asked for twice at once rings once. */
const lastRung = new Map<string, number>();

/**
 * A few sine notes with overtones and a long tail: the house bell. Plays even
 * with ambience off, and dips the ambience first when it is on, so the chime
 * is heard rather than fought over. A sound can be due on load, before any
 * click; the browser would refuse it, so it isn't asked for.
 */
function bell(
  notes: [freq: number, delay: number][],
  { level = 0.22, attack = 0.012, decay = 2.6 } = {},
) {
  if (typeof window === "undefined") return;
  const activated = navigator.userActivation?.hasBeenActive ?? true;
  if (!audioUnlocked() && !activated) return;
  // Two of the same at once (two reminders falling due together, say) would
  // ring in step, twice as loud, so the second is dropped.
  const key = notes.join();
  const now = performance.now();
  if (now - (lastRung.get(key) ?? -Infinity) < 1500) return;
  lastRung.set(key, now);
  const c = context();
  const out = gain(c, level * overAmbience());
  out.connect(c.destination);
  const last = Math.max(...notes.map(([, d]) => d));
  // Hold the dip through the notes and most of their ring.
  const lead = duck(DUCK_LEAD + last + decay * 0.6) ? DUCK_LEAD : 0;
  for (const [freq, at] of notes) {
    const delay = at + lead;
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
  setTimeout(() => out.disconnect(), (lead + last + decay) * 1000 + 500);
}

/**
 * End of a focus session: a bright chord struck at once, then its octave.
 * Struck together rather than in turn, so it never sounds like the eye
 * reminders, which are little tunes.
 */
export const playChime = () =>
  bell(
    [
      [659.25, 0],
      [830.61, 0],
      [987.77, 0],
      [1318.51, 0.32],
    ],
    { level: 0.13, attack: 0.008, decay: 2.8 },
  );

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

// ----------------------------------------------------------------- catches

/** D major's pentatonic, D5 to B5, so any run of catches sounds in tune. */
const CATCH_NOTES = [74, 76, 78, 81, 83];

/** Each catch's notes, as steps up the pentatonic from a random start (five
 *  steps to the octave), how far apart they fall, how long they ring, and how
 *  much octave glints above them. The rarer the drop, the more it sparkles. */
const CATCH_STYLE: Record<DropKind, { steps: number[]; gap: number; decay: number; level: number; glint: number }> = {
  plain: { steps: [0], gap: 0, decay: 0.28, level: 0.05, glint: 0.12 },
  golden: { steps: [0, 2], gap: 0.07, decay: 0.45, level: 0.05, glint: 0.2 },
  rainbow: { steps: [0, 1, 2, 3, 4], gap: 0.045, decay: 0.5, level: 0.04, glint: 0.2 },
  diamond: { steps: [0, 2, 4, 5], gap: 0.06, decay: 0.8, level: 0.045, glint: 0.3 },
  meteor: { steps: [5, 2, 0], gap: 0.05, decay: 0.5, level: 0.045, glint: 0.15 },
};

/** Rank, so a rare catch in a chain still gets its sound. */
const CATCH_RANK: Record<DropKind, number> = { plain: 0, golden: 1, meteor: 2, rainbow: 3, diamond: 4 };

let catchRoom: { input: GainNode; context: AudioContext } | null = null;
let lastCatch = { at: -Infinity, rank: -1 };

/**
 * Catching a drop in the garden: a soft "plip", a sine that lifts a little in
 * pitch as it rings, the way a drop sounds landing in still water. Rarer drops
 * add notes, ringing longer. Call it inside the click or key press, which
 * lets the browser start the sound even with the ambience off.
 *
 * A chain of catches at once (Torrent, Thunderclap) plays one sound, the
 * rarest in it, rather than stacking; and the pitch wanders over the scale so
 * a run of catches doesn't drone.
 */
export function playCatch(kind: DropKind) {
  if (typeof window === "undefined") return;
  primeAudio();
  const c = context();
  const now = c.currentTime;
  const rank = CATCH_RANK[kind];
  if (now - lastCatch.at < 0.06 && rank <= lastCatch.rank) return;
  lastCatch = { at: now, rank };

  // One small room for every catch, made once.
  if (catchRoom?.context !== c) {
    const input = gain(c, 1);
    input.connect(c.destination);
    route(input, c.destination, room(c, 1.2), gain(c, 0.22));
    catchRoom = { input, context: c };
  }
  const style = CATCH_STYLE[kind];
  const out = gain(c, overAmbience());
  out.connect(catchRoom.input);
  const start = Math.floor(Math.random() * CATCH_NOTES.length);
  style.steps.forEach((step, i) => {
    const index = start + step;
    const note = CATCH_NOTES[index % CATCH_NOTES.length] + 12 * Math.floor(index / CATCH_NOTES.length);
    const f = midiHz(note);
    const at = now + 0.005 + i * style.gap;
    for (const [mult, share] of [
      [1, 1],
      [2, style.glint],
    ]) {
      const osc = c.createOscillator();
      osc.type = "sine";
      osc.frequency.setValueAtTime(f * mult * 0.88, at);
      osc.frequency.exponentialRampToValueAtTime(f * mult, at + 0.035);
      const env = c.createGain();
      env.gain.setValueAtTime(0, at);
      env.gain.linearRampToValueAtTime(style.level * share, at + 0.004);
      env.gain.exponentialRampToValueAtTime(0.0001, at + style.decay);
      osc.connect(env).connect(out);
      osc.start(at);
      osc.stop(at + style.decay + 0.05);
    }
  });
  const end = style.gap * style.steps.length + style.decay;
  setTimeout(() => out.disconnect(), end * 1000 + 300);
}
