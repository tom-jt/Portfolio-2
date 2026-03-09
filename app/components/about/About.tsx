"use client";

import LogoLoop from "@/components/LogoLoop";
import {
  Terminal,
  AnimatedSpan,
  TypingAnimation,
} from "@/components/ui/terminal";
import {
  AndroidOriginalIcon,
  CsharpOriginalIcon,
  GithubOriginalIcon,
  JavaOriginalIcon,
  KotlinPlainIcon,
  LinkedinOriginalIcon,
  MongodbOriginalIcon,
  NextjsOriginalIcon,
  PostgresqlOriginalIcon,
  ReactOriginalIcon,
  TailwindcssOriginalIcon,
  TypescriptOriginalIcon,
  UnityOriginalIcon,
} from "@devicon/react";
import { CardBody, CardContainer, CardItem } from "@/components/ui/3d-card";
import Link from "next/link";
import Button from "@/components/Button";
import { CircleQuestionMarkIcon, LinkIcon } from "lucide-react";
import { IconBrandGithub, IconBrandLinkedin } from "@tabler/icons-react";

const funFacts = ["Every cow has a best friend they hang out with every day."];

const techLogos = [
  {
    node: <ReactOriginalIcon size={60} />,
    title: "React",
    href: "https://react.dev",
  },
  {
    node: <NextjsOriginalIcon size={60} />,
    title: "Next.js",
    href: "https://nextjs.org",
  },
  {
    node: <TypescriptOriginalIcon size={60} />,
    title: "TypeScript",
    href: "https://www.typescriptlang.org",
  },
  {
    node: <TailwindcssOriginalIcon size={60} />,
    title: "Tailwind CSS",
    href: "https://tailwindcss.com",
  },
  {
    node: <UnityOriginalIcon size={60} />,
    title: "Unity",
    href: "https://unity.com/",
  },
  {
    node: <CsharpOriginalIcon size={60} />,
    title: "C#",
    href: "https://en.wikipedia.org/wiki/C_Sharp_(programming_language)",
  },
  {
    node: <MongodbOriginalIcon size={60} />,
    title: "MongoDB",
    href: "https://www.mongodb.com/",
  },
  {
    node: <PostgresqlOriginalIcon size={60} />,
    title: "PostgreSQL",
    href: "https://www.postgresql.org/",
  },
  {
    node: <JavaOriginalIcon size={60} />,
    title: "Java",
    href: "https://www.java.com/",
  },
  {
    node: <AndroidOriginalIcon size={60} />,
    title: "Android",
    href: "https://developer.android.com/",
  },
  {
    node: <KotlinPlainIcon size={60} />,
    title: "Kotlin",
    href: "https://kotlinlang.org/",
  },
];

const About = () => {
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
      <div
        className="
          flex
          w-full h-full
          justify-center items-start gap-24
          max-sm:flex-col max-sm:items-center
        "
      >
        <TerminalContainer />
        <div
          className="
            flex flex-col
            md:w-1/3 h-full
            justify-center gap-2
          "
        >
          <div className="flex h-full w-full gap-2 max-2xl:flex-col">
            <AboutCard />
            <SocialsCard />
          </div>
          <div className="w-full h-full">
            <ContactCard />
          </div>
        </div>
      </div>
      <Logos />
    </div>
  );
};

const TerminalContainer = () => {
  return (
    <Terminal startOnView={true} className="min-w-1/3">
      <TypingAnimation>&gt; ~/about-me.info</TypingAnimation>

      <AnimatedSpan className="text-muted-foreground">
        Loading profile for 'Tom Liu'...
      </AnimatedSpan>

      <AnimatedSpan>
        Bachelor of Computer Science 💻 and Law ⚖️ student @ UNSW.
      </AnimatedSpan>

      <AnimatedSpan>&nbsp;</AnimatedSpan>

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
      </AnimatedSpan>

      <AnimatedSpan>&nbsp;</AnimatedSpan>

      <TypingAnimation>&gt; cat ~/welcome-message.info & exit</TypingAnimation>

      <AnimatedSpan className="text-blue-500">Nice to e-meet you!</AnimatedSpan>

      <AnimatedSpan className="text-blue-500">
        I hope you enjoy my little website &lt;3
      </AnimatedSpan>

      <AnimatedSpan>&nbsp;</AnimatedSpan>

      <AnimatedSpan className="text-muted-foreground">
        ℹ Introduction complete.
      </AnimatedSpan>
    </Terminal>
  );
};

const AboutCard = () => {
  return (
    <CardContainer containerClassName="w-full 2xl:w-4/5 h-full" className="w-full h-full">
      <CardBody
        className="
          flex flex-col
          h-full w-full
          p-6
          bg-background
          border-black/10 rounded-xl border
          gap-4 relative group/card dark:hover:shadow-2xl dark:hover:shadow-emerald-500/10 dark:bg-black dark:border-white/20
        "
      >
        <CardItem
          as="h3"
          translateZ={40}
          className="
              text-xl font-bold text-zinc-600
              dark:text-white
            "
        >
          PLACEHOLDER
        </CardItem>
        <CardItem translateZ={100}>
          <img
            src="/images/AboutPhoto.jpg"
            height="1000"
            width="1000"
            alt="thumbnail"
            className="
              object-cover
              rounded-xl
              group-hover/card:shadow-xl
            "
          />
        </CardItem>
        <CardItem
          as="p"
          translateZ={60}
          className="
              text-zinc-500 text-sm
              dark:text-zinc-300
            "
        >
          Placeholder placeholder placeholder
        </CardItem>
      </CardBody>
    </CardContainer>
  );
};

const SocialsCard = () => {
  return (
    <CardContainer containerClassName="w-full 2xl:w-1/5 h-full" className="w-full h-full">
      <CardBody
        className="
          flex 2xl:flex-col
          h-full w-full
          p-6
          bg-background
          border-black/10 rounded-xl border
          items-center justify-center gap-8 relative group/card dark:hover:shadow-2xl dark:hover:shadow-emerald-500/10 dark:bg-black dark:border-white/20
        "
      >
        <CardItem translateZ={40}>
          <LinkIcon size={30} />
        </CardItem>
        <CardItem translateZ={100}>
          <Link href="https://github.com/tom-jt">
            <IconBrandGithub
              size={60}
              className="hover:text-zinc-400 transition-all"
            />
          </Link>
        </CardItem>
        <CardItem translateZ={100}>
          <Link href="https://www.linkedin.com/in/tom-liu-jt">
            <IconBrandLinkedin
              size={60}
              className="hover:text-zinc-400 transition-all"
            />
          </Link>
        </CardItem>
        <CardItem translateZ={40}>
          <LinkIcon size={30} />
        </CardItem>
      </CardBody>
    </CardContainer>
  );
};

const ContactCard = () => {
  return (
    <CardContainer containerClassName="w-full h-full" className="w-full h-full">
      <CardBody
        className="
          flex max-2xl:flex-col gap-8
          h-full w-full
          p-6
          bg-background
          border-black/10 rounded-xl border
          justify-between 2xl:items-center relative group/card dark:hover:shadow-2xl dark:hover:shadow-emerald-500/10 dark:bg-black dark:border-white/20
        "
      >
        <div className="flex flex-col gap-2">
          <CardItem
            as="h3"
            translateZ={40}
            className="
              text-xl font-bold text-zinc-600
              dark:text-white
            "
          >
            Get In Touch
          </CardItem>
          <CardItem
            as="p"
            translateZ={60}
            className="
              text-zinc-500 text-sm
              dark:text-zinc-300
            "
          >
            email: tom.liu.media@gmail.com
          </CardItem>
        </div>

        <CardItem translateZ={70}>
          <Button href="#contact">Chuck me a msg!</Button>
        </CardItem>
      </CardBody>
    </CardContainer>
  );
};

const Logos = () => {
  return (
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
  );
};

const getRandomInt = (minInc: number, maxExc: number) => {
  const minCeiled = Math.ceil(minInc);
  const maxFloored = Math.floor(maxExc);
  return Math.floor(Math.random() * (maxFloored - minCeiled) + minCeiled);
};

export default About;
