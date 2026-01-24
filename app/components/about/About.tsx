import LogoLoop from "@/components/LogoLoop";
import {
  Terminal,
  AnimatedSpan,
  TypingAnimation,
} from "@/components/ui/terminal";
import {
  IconBrandCSharp,
  IconBrandMongodb,
  IconBrandMysql,
  IconBrandNextjs,
  IconBrandReact,
  IconBrandTailwind,
  IconBrandTypescript,
  IconBrandUnity,
} from "@tabler/icons-react";

const About = () => {
  const funFacts = [
    "Every cow has a best friend they hang out with every day.",
  ];

  const techLogos = [
    {
      node: <IconBrandReact size={60} />,
      title: "React",
      href: "https://react.dev",
    },
    {
      node: <IconBrandNextjs size={60} />,
      title: "Next.js",
      href: "https://nextjs.org",
    },
    {
      node: <IconBrandTypescript size={60} />,
      title: "TypeScript",
      href: "https://www.typescriptlang.org",
    },
    {
      node: <IconBrandTailwind size={60} />,
      title: "Tailwind CSS",
      href: "https://tailwindcss.com",
    },
    {
      node: <IconBrandUnity size={60} />,
      title: "Unity",
      href: "https://unity.com/",
    },
    {
      node: <IconBrandCSharp size={60} />,
      title: "C#",
      href: "https://en.wikipedia.org/wiki/C_Sharp_(programming_language)",
    },
    {
      node: <IconBrandMongodb size={60} />,
      title: "MongoDB",
      href: "https://www.mongodb.com/",
    },
  ];

  return (
    <div
      id="me"
      className="
        flex flex-col
        h-fit w-full
        gap-24 items-center
      "
    >
      <h1 className="text-7xl font-bold">Who Am I?</h1>
      <Terminal startOnView={true} className="min-w-1/3">
        <TypingAnimation>&gt; ~/about-me.info</TypingAnimation>

        <AnimatedSpan className="text-muted-foreground">
          Loading profile for 'Tom Liu'...
        </AnimatedSpan>

        <AnimatedSpan>
          Bachelor of Computer Science 💻 and Law ⚖️ student @ UNSW. {"\n\n"}
        </AnimatedSpan>

        <TypingAnimation>&gt; ~/fun-facts.info</TypingAnimation>

        <AnimatedSpan className="text-muted-foreground">
          Loading fun facts for 'Tom Liu'...
        </AnimatedSpan>

        <AnimatedSpan className="text-green-500">
          ✔ Likes to both create and play video games.
        </AnimatedSpan>

        <AnimatedSpan className="text-green-500">
          ✔ Enjoys piano, gym, and figure skating.
        </AnimatedSpan>

        <AnimatedSpan className="text-green-500">
          ✔ Hopelessly addicted to boba and watermelon.
        </AnimatedSpan>

        <AnimatedSpan className="text-muted-foreground">
          Generating random fun fact...
        </AnimatedSpan>

        <AnimatedSpan>
          {"  "}- {funFacts[getRandomInt(0, funFacts.length)]}
          {"\n\n"}
        </AnimatedSpan>

        <TypingAnimation>
          &gt; cat ~/welcome-message.info || exit
        </TypingAnimation>

        <AnimatedSpan className="text-blue-500">
          Nice to e-meet you!
        </AnimatedSpan>

        <AnimatedSpan className="text-blue-500">
          I hope you enjoy my little website &lt;3 {"\n\n"}
        </AnimatedSpan>

        <AnimatedSpan className="text-muted-foreground">
          ℹ Introduction complete.
        </AnimatedSpan>
      </Terminal>
      <div className="flex flex-col w-full items-center gap-12">
        <h3 className="text-2xl">
          ↓&nbsp;&nbsp;I like to use these&nbsp;&nbsp;↓
        </h3>
        <LogoLoop
          logos={techLogos}
          speed={100}
          direction="right"
          logoHeight={60}
          gap={60}
          hoverSpeed={0}
          scaleOnHover={true}
          fadeOut
        />
        <h3 className="text-2xl">
          ↓&nbsp;&nbsp;to make these funky lil things&nbsp;&nbsp;↓
        </h3>
      </div>
    </div>
  );
};

const getRandomInt = (minInc: number, maxExc: number) => {
  const minCeiled = Math.ceil(minInc);
  const maxFloored = Math.floor(maxExc);
  return Math.floor(Math.random() * (maxFloored - minCeiled) + minCeiled);
};

export default About;
