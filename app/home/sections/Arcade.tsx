"use client";

import { useCallback, useState } from "react";
import Image from "next/image";
import { Droplet, Gamepad2 } from "lucide-react";
import GameModal from "@/components/home/GameModal";
import { GRAIN } from "@/components/home/scenes/canvas";
import { Eyebrow } from "@/components/home/ui";
import { games, type ArcadeGame } from "@/data/home/games";
import { rewardGamePlay } from "@/lib/home/garden";
import { cn } from "@/lib/utils";

/** A game cartridge: a little CRT screen over a label. */
const Cartridge = ({ game, index, onPlay }: { game: ArcadeGame; index: number; onPlay: () => void }) => {
  const live = game.status === "live";

  return (
    <article
      className={cn(
        "home-glass group relative flex flex-col overflow-hidden rounded-[1.6rem] transition duration-300",
        live && "hover:-translate-y-1",
      )}
    >
      <div aria-hidden="true" className="absolute inset-x-0 top-0 h-1 opacity-80" style={{ background: game.accent }} />

      <div className="relative m-3 aspect-[16/10] overflow-hidden rounded-[1.1rem] border border-white/8 bg-[#05070d]">
        {live && game.thumbnail ? (
          <Image
            src={game.thumbnail}
            alt=""
            fill
            sizes="(min-width: 1024px) 30vw, (min-width: 640px) 45vw, 90vw"
            className="object-cover transition duration-500 group-hover:scale-105"
          />
        ) : (
          // No signal: drifting static, tinted with the game's colour.
          <div
            className="absolute -inset-10 opacity-40"
            style={{
              backgroundImage: `url("${GRAIN}")`,
              animation: live ? undefined : "home-static 0.5s steps(5) infinite",
            }}
          />
        )}
        <div
          aria-hidden="true"
          className="absolute inset-0 mix-blend-screen"
          style={{ background: `radial-gradient(ellipse at 30% 20%, ${game.accent}33, transparent 65%)` }}
        />
        {/* Scanlines and a curved-glass sheen. */}
        <div className="absolute inset-0 bg-[repeating-linear-gradient(to_bottom,rgb(255_255_255/0.04)_0_1px,transparent_1px_3px)]" />
        <div className="absolute inset-0 rounded-[inherit] shadow-[inset_0_0_40px_rgb(0_0_0/0.8)]" />
        <p
          className="font-pixel absolute inset-0 grid place-items-center text-sm tracking-[0.3em] uppercase"
          style={{ color: game.accent, textShadow: `0 0 12px ${game.accent}` }}
        >
          {live ? (game.thumbnail ? "" : "Press start") : "Coming soon"}
        </p>
      </div>

      <div className="flex flex-1 flex-col px-5 pt-1 pb-5">
        <p className="font-pixel text-xs" style={{ color: game.accent }}>
          No. {String(index + 1).padStart(2, "0")}
        </p>
        <h3 className="font-pixel mt-1 text-xl">{game.title}</h3>
        <p className="text-muted-foreground mt-1 text-sm">{game.tagline}</p>
        <div className="mt-auto flex items-center justify-between pt-4">
          {live ? (
            <button
              type="button"
              onClick={onPlay}
              className="text-primary-foreground focus-visible:ring-ring inline-flex h-10 cursor-pointer items-center gap-2 rounded-full px-5 text-sm font-semibold transition hover:brightness-110 focus-visible:ring-2 focus-visible:outline-none"
              style={{ background: game.accent, boxShadow: `0 8px 26px -10px ${game.accent}` }}
            >
              <Gamepad2 className="size-4" />
              Play
            </button>
          ) : (
            <span className="text-muted-foreground border-glass-edge rounded-full border px-3 py-1.5 text-xs">
              In the workshop
            </span>
          )}
          {live && (
            <span className="text-muted-foreground flex items-center gap-1 text-xs" title="The first play each day waters the garden">
              <Droplet className="text-glow-2 size-3" />
              daily bonus
            </span>
          )}
        </div>
      </div>
    </article>
  );
};

const Arcade = () => {
  const [active, setActive] = useState<ArcadeGame | null>(null);
  const close = useCallback(() => setActive(null), []);

  return (
    <section id="arcade" aria-labelledby="arcade-title" className="mt-16 scroll-mt-24 sm:mt-24">
      <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
        <div>
          <Eyebrow>Arcade</Eyebrow>
          <h2 id="arcade-title" className="font-display mt-2 text-4xl tracking-tight italic sm:text-5xl">
            Little games, made here.
          </h2>
        </div>
        <p className="text-muted-foreground max-w-sm text-sm">
          Small things I&rsquo;ve built for the browser. The first play of each one every day waters the garden.
        </p>
      </div>
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {games.map((g, i) => (
          <Cartridge
            key={g.id}
            game={g}
            index={i}
            onPlay={() => {
              setActive(g);
              rewardGamePlay(g.id, g.title);
            }}
          />
        ))}
      </div>
      <GameModal game={active} onClose={close} />
    </section>
  );
};

export default Arcade;
