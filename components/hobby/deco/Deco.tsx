"use client";

import type { FC } from "react";
import type { HobbyId } from "@/data/hobby/hobbies";
import { cn } from "@/lib/utils";
import balisong from "./balisong";
import magic from "./magic";
import ice from "./ice";
import piano from "./piano";
import { Region } from "./parts";
import "./deco.css";

/**
 * Where each hobby's decoration goes:
 * - Ground: behind everything, the whole window (snow).
 * - Hero: the header's top right, beside the stick figure.
 * - Left, Right: the empty sides of a wide window, fixed while you scroll.
 * - Bottom: a band along the foot of the page.
 * - Toolbar, Grid, Panel: small things resting on those boxes.
 */
export interface DecoSet {
  Ground?: FC;
  Hero?: FC;
  Left?: FC;
  Right?: FC;
  Bottom?: FC;
  Toolbar?: FC;
  Grid?: FC;
  Panel?: FC;
}

const SETS: Record<HobbyId, DecoSet> = { magic, ice, balisong, piano };

export const DecoGround = ({ hobby }: { hobby: HobbyId }) => {
  const Ground = SETS[hobby].Ground;
  return Ground ? (
    <Region className="absolute inset-0 overflow-hidden">
      <Ground />
    </Region>
  ) : null;
};

export const DecoHero = ({ hobby, className }: { hobby: HobbyId; className?: string }) => {
  const Hero = SETS[hobby].Hero;
  return Hero ? (
    <Region className={cn("relative h-[260px] w-[340px] shrink-0", className)}>
      <Hero />
    </Region>
  ) : null;
};

/**
 * The sides. The page column is 1376px wide, and each side box is the 304px
 * just outside its content, so it hugs the content on any wide window.
 * They show only when there is room for them.
 */
export const DecoSides = ({ hobby }: { hobby: HobbyId }) => {
  const { Left, Right } = SETS[hobby];
  const side = "fixed top-0 z-0 hidden h-dvh w-[304px] min-[1800px]:block";
  return (
    <>
      {Left && (
        <Region className={side} style={{ left: "calc(50% - 960px)" }}>
          <Left />
        </Region>
      )}
      {Right && (
        <Region className={side} style={{ left: "calc(50% + 656px)" }}>
          <Right />
        </Region>
      )}
    </>
  );
};

export const DecoBottom = ({ hobby }: { hobby: HobbyId }) => {
  const Bottom = SETS[hobby].Bottom;
  return Bottom ? (
    <Region className="fit-short:hidden absolute inset-x-0 bottom-0 hidden h-[116px] overflow-hidden md:block">
      <Bottom />
    </Region>
  ) : null;
};

export const DecoAnchor = ({ hobby, slot }: { hobby: HobbyId; slot: "Toolbar" | "Grid" | "Panel" }) => {
  const Piece = SETS[hobby][slot];
  return Piece ? (
    <Region className="absolute inset-0 z-[9] max-md:hidden">
      <Piece />
    </Region>
  ) : null;
};
