import NavBar from "./sections/NavBar";
import Hero from "./sections/Hero";
import About from "./sections/About";
import Timeline from "./sections/Timeline";
import Contact from "./sections/Contact";
import LawBackground from "@/components/law/LawBackground";
import SectionFrame from "@/components/law/SectionFrame";

const LawSite = () => {
  return (
    // overflow-x-clip, not overflow-hidden: the decorative rings deliberately
    // bleed past the viewport edges, but `hidden` would establish a scroll
    // container and break the timeline's sticky year labels. `clip` does not.
    <div className="relative z-0 overflow-x-clip">
      <LawBackground />
      <SectionFrame />
      <NavBar>
        <Hero />
        {/* No bottom padding: the contact arcs are the last thing on the
            page, and their flat edge is meant to sit flush with its end. */}
        <div className="flex flex-col gap-32 px-[8vw] pt-24 max-sm:gap-24 max-sm:px-[6vw] sm:gap-40">
          <About />
          <Timeline />
          <Contact />
        </div>
      </NavBar>
    </div>
  );
};

export default LawSite;
