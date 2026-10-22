import SiteSwitcher from "@/components/shared/SiteSwitcher";
import Arcade from "./sections/Arcade";
import FocusTimer from "./sections/FocusTimer";
import Garden from "./sections/Garden";
import Greeting from "./sections/Greeting";
import Sound from "./sections/Sound";
import Tasks from "./sections/Tasks";
import TopBar from "./sections/TopBar";

const HomePage = () => {
  return (
    <>
      <TopBar />
      <main className="mx-auto w-full max-w-[90rem] px-4 pb-20 sm:px-6 lg:px-10">
        <Greeting />

        {/* Desktop: tasks | timer over sound | garden. Tasks and the garden
            are absolutely filled into their cells, so the centre column sets
            the height and their lists scroll, instead of the longest list
            stretching every panel. Small screens stack, timer first. */}
        <div className="grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-12 lg:gap-6">
          <FocusTimer className="md:col-span-2 lg:col-span-5 lg:col-start-4 lg:row-start-1" />
          <div className="relative lg:col-span-3 lg:col-start-1 lg:row-span-2 lg:row-start-1">
            <Tasks className="h-full lg:absolute lg:inset-0" />
          </div>
          <div className="relative lg:col-span-4 lg:col-start-9 lg:row-span-2 lg:row-start-1 lg:min-h-[48rem]">
            <Garden className="h-full lg:absolute lg:inset-0" />
          </div>
          <Sound className="md:col-span-2 lg:col-span-5 lg:col-start-4 lg:row-start-2" />
        </div>

        <Arcade />
      </main>

      <footer className="mx-auto max-w-[90rem] px-4 pb-10 sm:px-6 lg:px-10">
        <div className="border-glass-edge text-muted-foreground flex flex-wrap items-center justify-between gap-4 border-t pt-6 text-sm">
          <p>Made by Tom Liu. Tasks, timer and garden save to this browser only.</p>
          <div className="text-nav-fg flex items-center gap-6">
            <SiteSwitcher to="cs" withLabel className="hover:text-nav-fg-hover text-sm" />
            <SiteSwitcher to="law" withLabel className="hover:text-nav-fg-hover text-sm" />
          </div>
        </div>
      </footer>
    </>
  );
};

export default HomePage;
