"use client";

import { useEffect, useRef, useState } from "react";
import {
  Bird,
  CloudDrizzle,
  CloudLightning,
  CloudRain,
  CloudRainWind,
  Coffee,
  Flame,
  Headphones,
  Leaf,
  Lock,
  Moon,
  Music2,
  Orbit,
  Pause,
  Play,
  Volume1,
  Volume2,
  Snowflake,
  Sunset,
  Waves,
  Wind,
  type LucideIcon,
} from "lucide-react";
import {
  Eyebrow,
  Panel,
  PrimaryButton,
  textButton,
  type PanelChrome,
} from "@/components/home/ui";
import { DEFAULT_SPOTIFY_URL } from "@/data/home/config";
import {
  playAmbience,
  primeAudio,
  useAmbienceStatus,
} from "@/lib/home/ambience";
import { describeUnlock, isUnlocked } from "@/lib/home/cosmetics";
import { useGardenValue } from "@/lib/home/garden";
import {
  activeAmbience,
  prefsStore,
  setPrefs,
  usePrefs,
} from "@/lib/home/prefs";
import {
  AMBIENCES,
  getAmbience,
  getScene,
  type AmbienceKind,
} from "@/lib/home/scenes";
import {
  loadSpotifyApi,
  setSpotifyController,
  setSpotifyPlaying,
  spotifyEmbedUrl,
  spotifyUri,
  type SpotifyController,
} from "@/lib/home/spotify";
import { cn } from "@/lib/utils";

/**
 * Plays or pauses the ambience, from the sound card or the collapsed chip.
 * Must run inside the click, so Safari lets the audio start. Saved as on but
 * not yet allowed to play (no click since the page loaded), it starts now.
 */
export function toggleAmbience(playing: boolean) {
  if (playing) return setPrefs({ ambienceOn: false });
  primeAudio();
  const prefs = prefsStore.get();
  if (prefs.ambienceOn)
    playAmbience(activeAmbience(prefs), prefs.ambienceVolume);
  else setPrefs({ ambienceOn: true });
}

/** Three bars bouncing while ambience plays. */
export const Equaliser = ({ on }: { on: boolean }) => (
  <span aria-hidden="true" className="flex h-3.5 shrink-0 items-end gap-0.5">
    {[0, 0.25, 0.5].map((delay) => (
      <span
        key={delay}
        className={cn(
          "bg-glow-2 w-0.75 origin-bottom rounded-full",
          on ? "h-full" : "h-1",
        )}
        style={
          on
            ? {
                animation: `home-eq 0.9s ease-in-out ${delay}s infinite alternate`,
              }
            : undefined
        }
      />
    ))}
  </span>
);

const ICONS: Record<AmbienceKind, LucideIcon> = {
  glass: CloudRain,
  cafe: Coffee,
  hill: CloudDrizzle,
  storm: CloudLightning,
  waves: Waves,
  wind: Wind,
  leaves: Leaf,
  deluge: CloudRainWind,
  lake: Moon,
  woods: Bird,
  cosmos: Orbit,
  shore: Sunset,
  majula: Flame,
  snow: Snowflake,
};

/**
 * Spotify's player, through its iFrame API so the page can tell whether it
 * is playing: while it is, /home keeps it alive with its card closed. If the
 * API won't load, a plain embed still plays; it just stops when closed.
 */
const SpotifyPlayer = ({ link, embed }: { link: string; embed: string }) => {
  const host = useRef<HTMLDivElement>(null);
  const [fallback, setFallback] = useState(false);

  useEffect(() => {
    const uri = spotifyUri(link);
    const root = host.current;
    // The link was already checked to make `embed`, so this always parses.
    if (!uri || !root) return;
    // The API replaces the element it's given, so give it one React doesn't own.
    const target = document.createElement("div");
    root.appendChild(target);
    let controller: SpotifyController | undefined;
    let cancelled = false;
    loadSpotifyApi().then(
      (api) => {
        if (cancelled) return;
        api.createController(
          target,
          { uri, width: "100%", height: 152 },
          (c) => {
            if (cancelled) return c.destroy?.();
            controller = c;
            setSpotifyController(c);
            c.addListener("playback_update", (e) =>
              setSpotifyPlaying(!e.data.isPaused),
            );
          },
        );
      },
      () => !cancelled && setFallback(true),
    );
    return () => {
      cancelled = true;
      setSpotifyController(null);
      controller?.destroy?.();
      root.replaceChildren();
      setSpotifyPlaying(false);
    };
  }, [link]);

  if (fallback) {
    return (
      <iframe
        title="Spotify player"
        src={embed}
        width="100%"
        height="152"
        allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
        className="block rounded-xl border-0"
      />
    );
  }
  return (
    <div
      ref={host}
      className="h-[152px] overflow-hidden rounded-xl [&_iframe]:block [&_iframe]:border-0"
    />
  );
};

const Sound = ({
  className,
  chrome,
}: {
  className?: string;
  chrome?: PanelChrome;
}) => {
  const prefs = usePrefs();
  const lockedIds = useGardenValue((s) =>
    AMBIENCES.filter((a) => !isUnlocked(a.unlock, s))
      .map((a) => a.id)
      .join(" "),
  ).split(" ");
  const scene = getScene(prefs.scene);
  const kind = activeAmbience(prefs);
  const ambience = getAmbience(kind);
  const embed = spotifyEmbedUrl(prefs.spotifyUrl ?? DEFAULT_SPOTIFY_URL);
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState("");
  const [error, setError] = useState(false);
  const status = useAmbienceStatus();
  const playing = status !== "off";
  // Saved as on, but waiting for a first click before the browser allows sound.
  const waiting = prefs.ambienceOn && !playing;
  const note = waiting
    ? "click anywhere to resume"
    : status === "loading"
      ? "loading…"
      : status === "error"
        ? "couldn\u2019t load the sound"
        : null;

  const choose = (id: AmbienceKind) => {
    // Inside the click, so the sound can start straight away.
    primeAudio();
    // Picking the scene's own sound goes back to following the scene.
    setPrefs({ ambience: id === scene.ambience ? null : id, ambienceOn: true });
  };

  const save = () => {
    if (!spotifyEmbedUrl(draft)) return setError(true);
    setPrefs({ spotifyUrl: draft.trim(), spotifyLoaded: true });
    setEditing(false);
    setDraft("");
    setError(false);
  };

  return (
    <Panel
      id="sound"
      title="sound"
      icon={Headphones}
      className={className}
      chrome={chrome}
    >
      <div className="border-glass-edge flex items-center gap-3 rounded-2xl border bg-white/3 p-3">
        <button
          type="button"
          data-ambience-toggle
          aria-pressed={playing}
          aria-label={`${playing ? "Pause" : "Play"} ${ambience.label}`}
          onClick={() => toggleAmbience(playing)}
          className="bg-glow-2/15 text-glow-2 hover:bg-glow-2/25 focus-visible:ring-glow-2 grid size-11 shrink-0 cursor-pointer place-items-center rounded-full transition focus-visible:ring-2 focus-visible:outline-none"
        >
          {playing ? (
            <Pause className="size-4" />
          ) : (
            <Play className="ml-0.5 size-4" />
          )}
        </button>
        <div className="min-w-0 flex-1">
          <p className="flex items-center gap-2 text-sm font-medium">
            <span className="truncate">{ambience.label}</span>
            <Equaliser on={status === "playing"} />
          </p>
          {note && (
            <p
              className={cn(
                "truncate text-xs",
                status === "error"
                  ? "text-destructive"
                  : "text-muted-foreground",
              )}
            >
              {note}
            </p>
          )}
        </div>
        <label className="text-muted-foreground flex items-center gap-2">
          <span className="sr-only">Ambience volume</span>
          {prefs.ambienceVolume < 0.5 ? (
            <Volume1 className="size-4" />
          ) : (
            <Volume2 className="size-4" />
          )}
          <input
            type="range"
            min={0}
            max={1}
            step={0.01}
            value={prefs.ambienceVolume}
            onChange={(e) =>
              setPrefs({ ambienceVolume: Number(e.target.value) })
            }
            className="accent-glow-2 w-20 cursor-pointer"
          />
        </label>
      </div>

      <div className="mt-4 flex items-center justify-between">
        <Eyebrow>Ambience</Eyebrow>
        {prefs.ambience && (
          <button
            type="button"
            onClick={() => setPrefs({ ambience: null })}
            className={cn(textButton, "text-muted-foreground text-xs")}
          >
            match scene
          </button>
        )}
      </div>
      <div
        role="group"
        aria-label="ambient sound"
        className="mt-2 grid grid-cols-4 gap-1.5"
      >
        {AMBIENCES.map((a) => {
          const locked = lockedIds.includes(a.id);
          const Icon = locked ? Lock : ICONS[a.id];
          const selected = a.id === kind;
          const title =
            locked && a.unlock
              ? `${a.label}: ${describeUnlock(a.unlock)}`
              : a.label;
          return (
            <button
              key={a.id}
              type="button"
              aria-pressed={selected}
              aria-label={title}
              title={title}
              disabled={locked}
              onClick={() => choose(a.id)}
              className={cn(
                "focus-visible:ring-ring flex min-w-0 cursor-pointer flex-col items-center gap-1 rounded-xl border px-1 py-2 text-[0.7rem] transition focus-visible:ring-2 focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50",
                selected
                  ? "border-glow/60 bg-glow/12 text-foreground"
                  : "border-glass-edge text-muted-foreground enabled:hover:text-foreground bg-white/3 enabled:hover:bg-white/8",
              )}
            >
              <Icon className={cn("size-4", selected && "text-glow")} />
              <span className="max-w-full truncate">{a.short}</span>
            </button>
          );
        })}
      </div>

      <div className="mt-4 flex items-center justify-between">
        <Eyebrow>Music</Eyebrow>
        <button
          type="button"
          onClick={() => {
            setEditing((e) => !e);
            setError(false);
          }}
          className={cn(textButton, "text-muted-foreground text-xs")}
        >
          {editing ? "Cancel" : "Change playlist"}
        </button>
      </div>

      {editing && (
        <form
          onSubmit={(e) => {
            e.preventDefault();
            save();
          }}
          className="mt-2"
        >
          <div className="flex gap-2">
            <input
              autoFocus
              value={draft}
              onChange={(e) => {
                setDraft(e.target.value);
                setError(false);
              }}
              placeholder="paste a spotify link…"
              aria-label="Spotify playlist, album, or track link"
              aria-invalid={error}
              className={cn(
                "border-glass-edge placeholder:text-muted-foreground/70 focus:border-glow/70 h-10 min-w-0 flex-1 rounded-full border bg-black/20 px-4 text-sm normal-case outline-none",
                error && "border-destructive",
              )}
            />
            <PrimaryButton type="submit" className="h-10 px-4">
              Save
            </PrimaryButton>
          </div>
          <p
            className={cn(
              "mt-1.5 text-xs",
              error ? "text-destructive" : "text-muted-foreground",
            )}
          >
            {error
              ? "That doesn't look like a Spotify link."
              : "any playlist, album, or track"}
            {prefs.spotifyUrl && !error && (
              <>
                {" "}
                <button
                  type="button"
                  onClick={() => {
                    setPrefs({ spotifyUrl: null });
                    setEditing(false);
                  }}
                  className={textButton}
                >
                  Back to the default
                </button>
              </>
            )}
          </p>
        </form>
      )}

      <div className="mt-3">
        {prefs.spotifyLoaded && embed ? (
          <SpotifyPlayer
            key={embed}
            link={prefs.spotifyUrl ?? DEFAULT_SPOTIFY_URL}
            embed={embed}
          />
        ) : (
          // Spotify's embed pulls in a lot of script and sets cookies, so it
          // waits until it's asked for. After that it loads automatically.
          <div className="border-glass-edge flex h-[152px] items-center gap-4 rounded-xl border border-dashed bg-black/15 p-4">
            <span className="bg-glow/12 text-glow grid size-16 shrink-0 place-items-center rounded-lg sm:size-[7.5rem]">
              <Music2 className="size-7 sm:size-9" />
            </span>
            <div className="min-w-0">
              <p className="font-display text-xl">spotify</p>
              <p className="text-muted-foreground mt-1 text-xs">
                previews unless you&rsquo;re signed in
              </p>
              <button
                type="button"
                onClick={() => setPrefs({ spotifyLoaded: true })}
                className={cn(textButton, "text-glow mt-2 text-sm font-medium")}
              >
                load player →
              </button>
            </div>
          </div>
        )}
      </div>
    </Panel>
  );
};

export default Sound;
