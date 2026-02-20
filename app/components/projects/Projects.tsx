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
          <ProjectList />
        </div>

        <div className="w-1/5 pt-24 pb-48">
          <div
            className="
              flex
              h-fit
              text-2xl
              sticky justify-between top-1/2
            "
          >
            <p>← games</p>
            <p className="text-right">projects →</p>
          </div>
        </div>

        <div className="w-3/7">
          <ProjectList />
        </div>
      </div>
    </div>
  );
};

export default Projects;
