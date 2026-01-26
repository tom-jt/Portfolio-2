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
          justify-around
        "
      >
        <div className="w-1/2">
          <ProjectList />
        </div>

        <div className="w-1/4 pt-24 pb-48">
          <div
            className="
            flex
            text-2xl
            sticky justify-between top-1/2 h-fit
          "
          >
            <h3>← games</h3>
            <h3 className="text-right">projects →</h3>
          </div>
        </div>
        <div className="w-1/2">
          <ProjectList />
        </div>
      </div>
    </div>
  );
};

export default Projects;
