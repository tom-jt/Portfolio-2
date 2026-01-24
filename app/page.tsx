import About from "./components/about/About";
import Home from "./components/home/Home";
import NavBar from "./components/NavBar";
import Projects from "./components/projects/Projects";

const App = () => {
  return (
    <div className="bg-zinc-50 dark:bg-black">
      <NavBar className="flex flex-col gap-48">
        <Home />
        <About />
        <Projects />
      </NavBar>
    </div>
  );
};

export default App;
