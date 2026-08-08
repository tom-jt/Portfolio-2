import About from "./components/about/About";
import Home from "./components/home/Home";
import NavBar from "./components/navbar/NavBar";
import Projects from "./components/projects/Projects";
import Contact from "./components/contact/Contact";

const App = () => {
  return (
    <div className="z-0 bg-zinc-50 dark:bg-black relative">
      <NavBar>
        <Home />
        <div
          className="
            max-sm:px-[5vw] max-sm:pt-[10vh] max-sm:*:py-[10vh]
            px-[15vw] pt-[12vh]
            *:py-[12vh]
          "
        >
          <About />
          <Projects />
          <Contact />
        </div>
      </NavBar>

      {/* Background dots — fade out toward contact footer */}
      <div
        className="
          bg-size-[20px_20px] bg-[radial-gradient(#d4d4d4_1px,transparent_1px)]
          pointer-events-none
          top-[110vh] -z-10 absolute inset-0
          mask-[linear-gradient(to_bottom,black_0%,black_70%,transparent_100%)]
          dark:bg-[radial-gradient(#606060_1px,transparent_1px)]
        "
      >
        <div
          className="
            flex
            bg-zinc-50
            pointer-events-none
            absolute dark:bg-black inset-0 items-center justify-center mask-[linear-gradient(to_right,black_0%,transparent_50%_50%,black_100%)]
          "
        />
      </div>
    </div>
  );
};

export default App;
