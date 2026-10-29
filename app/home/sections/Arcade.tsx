"use client";

import { useCallback, useState } from "react";
import Image from "next/image";
import { Gamepad2 } from "lucide-react";
import GameModal from "@/components/home/GameModal";
import { GRAIN } from "@/components/home/scenes/canvas";
import { Panel, type PanelChrome } from "@/components/home/ui";
import { games, type ArcadeGame } from "@/data/home/games";
import { rewardGamePlay } from "@/lib/home/garden";
import { cn } from "@/lib/utils";

/** A game cartridge: a little CRT screen over its name. Live ones are buttons. */
const Cartridge = ({ game, onPlay }: { game: ArcadeGame; onPlay: () => void }) => {
  const live = game.status === "live";
  const Root = live ? "button" : "div";

  return (
    <Root
      {...(live ? { type: "button" as const, onClick: onPlay, "aria-label": `play ${game.title}` } : {})}
      className={cn(
        "border-glass-edge group flex flex-col gap-2.5 rounded-2xl border border-t-2 bg-white/3 p-2 pb-3 text-left",
        live && "focus-visible:ring-ring cursor-pointer transition hover:-translate-y-0.5 hover:bg-white/6 focus-visible:ring-2 focus-visible:outline-none",
      )}
      style={{ borderTopColor: game.accent }}
    >
      <div className="relative aspect-[16/10] overflow-hidden rounded-[0.65rem] bg-[#05070d]">
        {live && game.thumbnail ? (
          <Image src={game.thumbnail} alt="" fill sizes="12rem" className="object-cover transition duration-500 group-hover:scale-105" />
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
        <div className="absolute inset-0 bg-[repeating-linear-gradient(to_bottom,rgb(255_255_255/0.04)_0_1px,transparent_1px_3px)]" />
        <div className="absolute inset-0 shadow-[inset_0_0_30px_rgb(0_0_0/0.8)]" />
        {!(live && game.thumbnail) && (
          <span
            className="font-pixel absolute inset-0 grid place-items-center text-[0.7rem] tracking-[0.15em]"
            style={{ color: game.accent, textShadow: `0 0 10px ${game.accent}` }}
          >
            {live ? <Gamepad2 className="size-5" /> : "coming soon"}
          </span>
        )}
      </div>
      <span className="flex flex-col gap-0.5 px-1">
        <span className="font-pixel text-[0.95rem] leading-tight">{game.title}</span>
        {game.tagline && <span className="text-muted-foreground text-xs">{game.tagline}</span>}
      </span>
    </Root>
  );
};

/** The games, as a card. The first play of each one each day waters the garden. */
const Arcade = ({ className, chrome }: { className?: string; chrome?: PanelChrome }) => {
  const [active, setActive] = useState<ArcadeGame | null>(null);
  const close = useCallback(() => setActive(null), []);

  return (
    <Panel id="arcade" title="arcade" icon={Gamepad2} className={className} chrome={chrome}>
      <div className="grid grid-cols-1 gap-3 @[18rem]:grid-cols-2 @[28rem]:grid-cols-3">
        {games.map((g) => (
          <Cartridge
            key={g.id}
            game={g}
            onPlay={() => {
              setActive(g);
              rewardGamePlay(g.id, g.title);
            }}
          />
        ))}
      </div>
      <GameModal game={active} onClose={close} />
    </Panel>
  );
};

export default Arcade;
