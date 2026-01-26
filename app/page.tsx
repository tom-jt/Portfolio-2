import { Particles } from "@/components/ui/particles";
import About from "./components/about/About";
import Home from "./components/home/Home";
import NavBar from "./components/navbar/NavBar";
import Projects from "./components/projects/Projects";
import Contact from "./components/contact/Contact";

const App = () => {
  return (
    <div className="bg-zinc-50 dark:bg-black relative">
      <NavBar className="z-10">
        <Home />
        <div className="pt-24 *:p-24">
          <About />
          <Projects />
          <Contact />
        </div>
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
