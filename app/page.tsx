import { Particles } from "@/components/ui/particles";
import About from "./components/about/About";
import Home from "./components/home/Home";
import NavBar from "./components/NavBar";
import Projects from "./components/projects/Projects";

const App = () => {
  return (
    <div className="bg-zinc-50 dark:bg-black relative">
      <NavBar className="flex flex-col gap-48 z-10">
        <Home />
        <About />
        <Projects />
      </NavBar>

      <Particles
        className="absolute inset-0"
        quantity={500}
        color="#000000"
        vx={0.1}
        vy={0.2}
        refresh
      />
    </div>
  );
};

export default App;
