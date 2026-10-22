"use client";

import { useSyncExternalStore } from "react";
import type { AmbienceKind } from "./scenes";

/**
 * Ambient sound, synthesised with Web Audio instead of shipped as audio
 * files: filtered noise loops for the bed, plus a buffer of sparse decaying
 * clicks for raindrops ticking on glass. Nothing to download, it loops without
 * a seam, and each scene gets its own sound for a few lines of code.
 */

let ctx: AudioContext | null = null;
let master: GainNode | null = null;
let bed: { kind: AmbienceKind; bus: GainNode; stop: () => void } | null = null;

const FADE = 0.6;

// Whether sound is actually playing, which can differ from the saved
// preference: a returning visitor's "on" waits for their first click.
const playingListeners = new Set<() => void>();
const notifyPlaying = () => playingListeners.forEach((l) => l());

export function useAmbiencePlaying() {
  return useSyncExternalStore(
    (l) => {
      playingListeners.add(l);
      return () => playingListeners.delete(l);
    },
    () => bed !== null,
    () => false,
  );
}

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

function whiteNoise(c: AudioContext, seconds: number) {
  const buffer = c.createBuffer(1, Math.floor(c.sampleRate * seconds), c.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1;
  return buffer;
}

/** Short bursts of noise with a fast exponential decay: drops hitting glass. */
function patter(c: AudioContext, seconds: number, perSecond: number) {
  const rate = c.sampleRate;
  const buffer = c.createBuffer(1, Math.floor(rate * seconds), rate);
  const data = buffer.getChannelData(0);
  const count = Math.floor(seconds * perSecond);
  for (let i = 0; i < count; i++) {
    const tau = ((0.6 + Math.random() * 2.6) / 1000) * rate;
    const length = Math.floor(tau * 6);
    const at = Math.floor(Math.random() * (data.length - length));
    const amp = 0.15 + Math.random() ** 2 * 0.85;
    for (let j = 0; j < length; j++) {
      data[at + j] += (Math.random() * 2 - 1) * amp * Math.exp(-j / tau);
    }
  }
  return buffer;
}

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

function loop(c: AudioContext, buffer: AudioBuffer, offset = 0) {
  const src = c.createBufferSource();
  src.buffer = buffer;
  src.loop = true;
  src.start(0, offset % buffer.duration);
  return src;
}

/** Slowly swings `param` by ±depth, so the bed breathes instead of droning. */
function lfo(c: AudioContext, param: AudioParam, hz: number, depth: number, delay = 0) {
  const osc = c.createOscillator();
  osc.frequency.value = hz;
  const amount = gain(c, depth);
  osc.connect(amount).connect(param);
  osc.start(c.currentTime + delay);
  return osc;
}

function buildRain(c: AudioContext, out: AudioNode) {
  const noise = whiteNoise(c, 5);
  const body = gain(c, 0.42);
  const sources: AudioScheduledSourceNode[] = [
    // The steady wash.
    route(loop(c, noise), out, filter(c, "lowpass", 1100, 0.3), body),
    // Hiss on top.
    route(
      loop(c, noise, 2.3),
      out,
      filter(c, "highpass", 3200),
      filter(c, "lowpass", 9000),
      gain(c, 0.06),
    ),
    // Low city rumble underneath.
    route(loop(c, noise, 1.1), out, filter(c, "lowpass", 140), gain(c, 0.3)),
    // Fine drops, and fewer heavier ones, on the glass.
    route(
      loop(c, patter(c, 7.3, 46)),
      out,
      filter(c, "bandpass", 2600, 0.7),
      gain(c, 0.5),
    ),
    route(
      loop(c, patter(c, 5.9, 14)),
      out,
      filter(c, "bandpass", 1150, 1),
      gain(c, 0.45),
    ),
  ];
  sources.push(lfo(c, body.gain, 0.045, 0.12));
  return sources;
}

function buildWaves(c: AudioContext, out: AudioNode) {
  const noise = whiteNoise(c, 6);
  const swell = gain(c, 0.34);
  const foam = gain(c, 0.05);
  const period = 1 / 0.085;
  const sources: AudioScheduledSourceNode[] = [
    route(loop(c, noise), out, filter(c, "lowpass", 520, 0.4), swell),
    route(loop(c, noise, 3), out, filter(c, "bandpass", 1600, 0.6), foam),
    // A little wind.
    route(
      loop(c, noise, 1.7),
      out,
      filter(c, "bandpass", 380, 1.5),
      gain(c, 0.04),
    ),
  ];
  sources.push(lfo(c, swell.gain, 0.085, 0.3));
  // The foam hisses as each wave breaks, a quarter-cycle after the swell.
  sources.push(lfo(c, foam.gain, 0.085, 0.045, period / 4));
  return sources;
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

  // Crossfade: the old bed fades out on its own bus while the new one fades in.
  bed?.stop();
  const bus = gain(c, 0);
  bus.connect(master);
  const sources = kind === "rain" ? buildRain(c, bus) : buildWaves(c, bus);
  bus.gain.setTargetAtTime(1, c.currentTime, FADE / 3);

  bed = {
    kind,
    bus,
    stop: () => {
      bus.gain.setTargetAtTime(0, c.currentTime, FADE / 3);
      const end = c.currentTime + FADE * 2;
      sources.forEach((s) => s.stop(end));
      setTimeout(() => bus.disconnect(), FADE * 2000 + 100);
    },
  };
  notifyPlaying();
}

export function stopAmbience() {
  if (!bed) return;
  bed.stop();
  bed = null;
  notifyPlaying();
}

/** A soft two-note bell for the end of a session. Plays even with ambience off. */
export function playChime() {
  if (typeof window === "undefined") return;
  // A session can end on load, before any click. The browser would refuse
  // to play, so don't ask.
  const activated = navigator.userActivation?.hasBeenActive ?? true;
  if (!audioUnlocked() && !activated) return;
  const c = context();
  const out = gain(c, 0.22);
  out.connect(c.destination);
  const notes: [number, number][] = [
    [659.25, 0],
    [987.77, 0.22],
  ];
  for (const [freq, delay] of notes) {
    for (const [mult, level] of [
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
      env.gain.linearRampToValueAtTime(level, t + 0.012);
      env.gain.exponentialRampToValueAtTime(0.0001, t + 2.6);
      osc.connect(env).connect(out);
      osc.start(t);
      osc.stop(t + 2.7);
    }
  }
  setTimeout(() => out.disconnect(), 3400);
}
