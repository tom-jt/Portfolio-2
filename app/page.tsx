import Home from "./components/home/Home";
import NavBar from "./components/NavBar";

const App = () => {
  return (
    <div>
      <NavBar>
        <Home />
      </NavBar>
    </div>
  );
};

export default App;
