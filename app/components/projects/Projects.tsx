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
      <div className="text-7xl font-bold">My Creations</div>

      <div
        className="
          overflow-visible flex
          w-full
          gap-4 justify-around
        "
      >
        <div className="w-3/7">
          <ProjectList filterBy={(p: Project) => p.type === ProjectType.GAME} />
        </div>

        <div className="w-1/5 pt-24 pb-36">
          <div
            className="
              flex
              h-fit
              text-2xl
              sticky top-1/2
              max-2xl:flex-col
              max-2xl:gap-4
            "
          >
            <p>← games</p>
            <p className="text-right">projects →</p>
          </div>
        </div>

        <div className="w-3/7">
          <ProjectList
            filterBy={(p: Project) => p.type === ProjectType.PROJECT}
          />
        </div>
      </div>
    </div>
  );
};

export default Projects;
