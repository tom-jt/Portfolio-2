import { Particles } from "@/components/ui/particles";
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
            max-sm:px-[5vw] max-sm:pt-[12vh] max-sm:*:py-[12vh]
            px-[15vw] pt-[15vh]
            *:py-[15vh]
          "
        >
          <About />
          <Projects />
          <Contact />
        </div>
      </NavBar>

      {/* <Particles
        quantity={250}
        color="#000000"
        vx={0.1}
        vy={0.2}
        refresh
        className="absolute inset-0"
      />

      <Particles
        quantity={250}
        color="#000000"
        vx={0.1}
        vy={0.2}
        refresh
        className="absolute inset-0"
      /> */}

      {/*Background Dots */}
      <div
        className="
          bg-size-[20px_20px] bg-[radial-gradient(#d4d4d4_1px,transparent_1px)]
          pointer-events-none
          top-[110vh] -z-10 absolute inset-0 dark:bg-[radial-gradient(#606060_1px,transparent_1px)]
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
