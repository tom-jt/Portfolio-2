import { HeroParallax, Product } from "@/components/ui/hero-parallax";
import { getFeaturedProjects, ProjectType } from "@/data/cs/projects";

type FeaturedProject = Product;

const Home = () => {
  return (
    <div id="home">
      <HeroParallax products={featuredProjects} />
    </div>
  );
};

const featuredProjects: FeaturedProject[] = getFeaturedProjects().map((p) => ({
  title: p.title,
  subtitle: p.subtitle,
  link: p.type === ProjectType.GAME ? p.gamelink : p.link,
  thumbnail: p.img,
}));

export default Home;
