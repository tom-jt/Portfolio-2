"use client";

import { Project, ProjectType } from "@/data/database";
import ProjectList from "./ProjectList";

const Projects = () => {
  return (
    <div
      id="projects"
      className="
        flex flex-col
        h-fit w-full
        items-center gap-24
      "
    >
      <div className="text-7xl text-center max-sm:text-5xl font-bold">My Creations</div>

      <div
        className="
          overflow-visible flex max-sm:flex-col max-sm:items-center
          w-full
          gap-4 justify-around
        "
      >
        <div className="sm:w-3/7">
          <ProjectList filterBy={(p: Project) => p.type === ProjectType.GAME} />
        </div>

        <div className="w-1/5 py-12 sm:hidden">
          <div
            className="
              flex
              h-fit
              text-2xl
              sticky top-1/2
              max-2xl:flex-col
              justify-between
            "
          >
            <p>← games</p>
            <p className="text-right">projects →</p>
          </div>
        </div>

        <div className="py-12">
          <p>Projects</p>
        </div>

        <div className="sm:w-3/7">
          <ProjectList
            filterBy={(p: Project) => p.type === ProjectType.PROJECT}
          />
        </div>
      </div>
    </div>
  );
};

export default Projects;
