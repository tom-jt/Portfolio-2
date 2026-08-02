"use client";

import SectionTitle from "@/components/SectionTitle";
import { Project, ProjectType } from "@/data/database";
import { Code2, Gamepad2, type LucideIcon } from "lucide-react";
import ProjectList from "./ProjectList";

interface ColumnHeaderProps {
  icon: LucideIcon;
  label: string;
  microcopy: string;
}

const ColumnHeader = ({ icon: Icon, label, microcopy }: ColumnHeaderProps) => {
  return (
    <div className="mb-8 w-full max-w-2xl mx-auto">
      <div className="flex items-center gap-3">
        <Icon
          className="size-5 shrink-0 text-zinc-500 dark:text-zinc-400"
          strokeWidth={1.75}
        />
        <h2
          className="
            text-sm font-semibold uppercase tracking-[0.2em]
            text-zinc-800 dark:text-zinc-100
          "
        >
          {label}
        </h2>
      </div>
      <p className="mt-2 text-sm text-zinc-500 dark:text-zinc-400">
        {microcopy}
      </p>
      <div
        className="
          mt-4 h-px w-full
          bg-gradient-to-r from-zinc-400/60 via-zinc-300/40 to-transparent
          dark:from-zinc-500/50 dark:via-zinc-600/30
        "
      />
    </div>
  );
};

const Projects = () => {
  return (
    <div
      id="projects"
      className="
        flex flex-col
        h-fit w-full
        items-center max-sm:gap-12 sm:gap-24
      "
    >
      <SectionTitle eyebrow="Archive" title="My Creations" />

      <div
        className="
          overflow-visible flex max-sm:flex-col max-sm:items-center
          w-full
          gap-10 sm:gap-8 justify-around
        "
      >
        <div className="w-full sm:w-[46%]">
          <ColumnHeader
            icon={Gamepad2}
            label="Games"
            microcopy="Playable builds"
          />
          <ProjectList filterBy={(p: Project) => p.type === ProjectType.GAME} />
        </div>

        <div className="w-full sm:w-[46%]">
          <ColumnHeader
            icon={Code2}
            label="Projects"
            microcopy="Apps & tools"
          />
          <ProjectList
            filterBy={(p: Project) => p.type === ProjectType.PROJECT}
          />
        </div>
      </div>
    </div>
  );
};

export default Projects;
