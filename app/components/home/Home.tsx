import { HeroParallax } from "@/components/ui/hero-parallax";
import { getFilteredProjects, projects } from "@/data/database";

type FeaturedProject = {
  title: string;
  link: string;
  thumbnail: string;
};

const Home = () => {
  return (
    <div id="home">
      <HeroParallax products={featuredProjects} />
    </div>
  );
};

const featuredProjects: FeaturedProject[] = getFilteredProjects(
  (p) => p.featured === true,
).map((p) => ({
  title: p.title,
  link: p.link,
  thumbnail: p.img,
}));

export default Home;
