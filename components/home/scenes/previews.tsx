import { useId, type ReactNode } from "react";
import { getScene, type SceneId } from "@/lib/home/scenes";
import { photoThumb } from "./PhotoScene";

/**
 * Thumbnails for the scene picker: each scene drawn small enough to read
 * at 40px, so the picker shows where you're going rather than two colours.
 */

const Rain = ({ id }: { id: string }) => (
  <>
    <defs>
      <linearGradient id={`${id}-sky`} x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stopColor="#060a18" />
        <stop offset="0.65" stopColor="#241c3e" />
        <stop offset="1" stopColor="#0d1124" />
      </linearGradient>
    </defs>
    <rect width="40" height="40" fill={`url(#${id}-sky)`} />
    <path d="M0 40V25h5v-6h6v8h4V16h6v10h4v-5h6v6h5v-4h4v17Z" fill="#0b1026" />
    {[
      [7, 22], [13, 29], [17, 19], [18, 24], [27, 23], [32, 29], [36, 26], [8, 33], [22, 31],
    ].map(([x, y]) => (
      <rect key={`${x}-${y}`} x={x} y={y} width="1.4" height="1.6" fill="#ffd59a" opacity="0.85" />
    ))}
    <circle cx="10" cy="37" r="4" fill="#ffb464" opacity="0.35" />
    <circle cx="30" cy="36" r="5" fill="#7ed0e4" opacity="0.25" />
    <g stroke="#c8d8ff" strokeWidth="0.6" opacity="0.55" strokeLinecap="round">
      {[4, 11, 19, 26, 34, 15, 30].map((x, i) => (
        <line key={x} x1={x} y1={2 + (i % 3) * 5} x2={x + 0.8} y2={8 + (i % 3) * 5} />
      ))}
    </g>
  </>
);

const Hill = ({ id }: { id: string }) => (
  <>
    <defs>
      <linearGradient id={`${id}-sky`} x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stopColor="#2a66c4" />
        <stop offset="0.7" stopColor="#a7d0f2" />
      </linearGradient>
    </defs>
    <rect width="40" height="40" fill={`url(#${id}-sky)`} />
    <ellipse cx="27" cy="9" rx="8" ry="3" fill="#fff" opacity="0.85" />
    <ellipse cx="22" cy="10.5" rx="5" ry="2.2" fill="#fff" opacity="0.7" />
    <path d="M0 26C8 22 16 23 24 25s12 0 16-2v17H0Z" fill="#6fae74" />
    <path d="M0 31C10 27 22 27 40 33v7H0Z" fill="#3f8a47" />
    <rect x="29.4" y="20" width="0.9" height="4" fill="#3b2b1f" />
    <circle cx="29.8" cy="19.5" r="2.6" fill="#2f6d39" />
    <g stroke="#fff" strokeWidth="0.55" opacity="0.6" strokeLinecap="round">
      {[5, 12, 18, 33, 9, 25].map((x, i) => (
        <line key={x} x1={x} y1={4 + (i % 3) * 6} x2={x + 0.7} y2={9 + (i % 3) * 6} />
      ))}
    </g>
  </>
);

const Sunset = ({ id }: { id: string }) => (
  <>
    <defs>
      <linearGradient id={`${id}-sky`} x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stopColor="#2a1b4a" />
        <stop offset="0.5" stopColor="#a8406c" />
        <stop offset="1" stopColor="#ffb46a" />
      </linearGradient>
      <linearGradient id={`${id}-sea`} x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stopColor="#c46677" />
        <stop offset="1" stopColor="#24122f" />
      </linearGradient>
    </defs>
    <rect width="40" height="25" fill={`url(#${id}-sky)`} />
    <path d="M18 25a8 8 0 0 1 16 0Z" fill="#ffe6a8" />
    <rect y="25" width="40" height="15" fill={`url(#${id}-sea)`} />
    <g fill="#ffe2a8">
      <rect x="22" y="27" width="8" height="0.8" opacity="0.8" />
      <rect x="23.5" y="30" width="5" height="0.8" opacity="0.6" />
      <rect x="21" y="33" width="10" height="0.8" opacity="0.4" />
    </g>
    <path d="M0 25v-2.5c4-1 8-.8 11 2.5Z" fill="#2b1636" />
  </>
);

const Cafe = ({ id }: { id: string }) => (
  <>
    <defs>
      <radialGradient id={`${id}-lamp`} cx="0.5" cy="0.3" r="0.6">
        <stop offset="0" stopColor="#ffbe74" stopOpacity="0.55" />
        <stop offset="1" stopColor="#ffbe74" stopOpacity="0" />
      </radialGradient>
    </defs>
    <rect width="40" height="40" fill="#2a1a12" />
    <rect x="7" y="6" width="26" height="20" rx="1" fill="#131a2e" />
    <circle cx="13" cy="21" r="3" fill="#ffb464" opacity="0.35" />
    <circle cx="26" cy="19" r="2.5" fill="#e89ac0" opacity="0.3" />
    <g stroke="#9fc4e8" strokeWidth="0.55" opacity="0.6" strokeLinecap="round">
      {[10, 15, 21, 27, 31].map((x, i) => (
        <line key={x} x1={x} y1={8 + (i % 2) * 4} x2={x + 0.6} y2={13 + (i % 2) * 4} />
      ))}
    </g>
    <path d="M7 16h26M20 6v20" stroke="#4a2e1e" strokeWidth="1.2" />
    <rect x="7" y="6" width="26" height="20" rx="1" fill="none" stroke="#5a3a26" strokeWidth="1.5" />
    <rect width="40" height="40" fill={`url(#${id}-lamp)`} />
    <path d="M20 0v4" stroke="#1a0f0a" strokeWidth="0.6" />
    <path d="M17 6l1.5-2h3L23 6Z" fill="#c88a4a" />
    <rect y="30" width="40" height="10" fill="#4a2f1d" />
    <rect y="30" width="40" height="0.8" fill="#7a5235" />
    <path d="M24 30v-3.5h4.5V30Z" fill="#efe3d0" />
    <path d="M25 25.5c.6-1 .6-1.8 0-2.8M27 25.5c.6-1 .6-1.8 0-2.8" stroke="#fff" strokeWidth="0.5" opacity="0.45" fill="none" />
  </>
);

const PREVIEW: Partial<Record<SceneId, (p: { id: string }) => ReactNode>> = {
  rain: Rain,
  hill: Hill,
  sunset: Sunset,
  cafe: Cafe,
};

export const ScenePreview = ({ scene, className }: { scene: SceneId; className?: string }) => {
  const id = useId().replace(/:/g, "");
  const Draw = PREVIEW[scene];
  const photo = getScene(scene).photo;
  if (photo || !Draw) {
    // Photo scenes show a thumbnail of the photograph itself.
    return photo ? (
      // eslint-disable-next-line @next/next/no-img-element -- a 40px thumbnail
      <img src={photoThumb(photo)} alt="" aria-hidden="true" loading="lazy" className={`object-cover ${className ?? ""}`} />
    ) : null;
  }
  return (
    <svg viewBox="0 0 40 40" aria-hidden="true" className={className}>
      <Draw id={id} />
    </svg>
  );
};
