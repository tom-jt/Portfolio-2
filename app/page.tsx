import { Particles } from "@/components/ui/particles";
import About from "./components/about/About";
import Home from "./components/home/Home";
import NavBar from "./components/navbar/NavBar";
import Projects from "./components/projects/Projects";
import Contact from "./components/contact/Contact";

const App = () => {
  return (
    <div className="bg-zinc-50 dark:bg-black relative z-0">
      <NavBar>
        <Home />
        <div className="px-48 pt-24 *:py-24">
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
          pointer-events-none top-[100vh]
          -z-10 bg-size-[20px_20px] bg-[radial-gradient(#d4d4d4_1px,transparent_1px)]
          absolute inset-0 dark:bg-[radial-gradient(#606060_1px,transparent_1px)]
        "
      >
        <div
          className="
          flex
          bg-zinc-50
          pointer-events-none
          absolute dark:bg-black inset-0 items-center justify-center
          mask-[linear-gradient(to_right,black_0_10%,transparent_12.5%_22.5%,black_25%_42.5%,transparent_45%_55%,black_57.5%_75%,transparent_77.5%_87.5%,black_90%)]
        "
        />
      </div>
    </div>
  );
};

export default App;
