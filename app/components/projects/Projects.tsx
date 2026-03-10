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
        items-center max-sm:gap-12 sm:gap-24
      "
    >
      <h1 className="c-h1">My Creations</h1>

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

        <div className="w-1/5 py-12 max-sm:hidden">
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
            <p>GAMES</p>
            <p className="text-right">PROJECTS</p>
          </div>
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
