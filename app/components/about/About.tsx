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
  JavaOriginalIcon,
  KotlinPlainIcon,
  MongodbOriginalIcon,
  NextjsOriginalIcon,
  PostgresqlOriginalIcon,
  ReactOriginalIcon,
  TailwindcssOriginalIcon,
  TypescriptOriginalIcon,
  UnityOriginalIcon,
  GoOriginalIcon,
} from "@devicon/react";
import { CardBody, CardContainer, CardItem } from "@/components/ui/3d-card";
import Link from "next/link";
import { LinkIcon } from "lucide-react";
import { IconBrandGithub, IconBrandLinkedin } from "@tabler/icons-react";
import { useEffect, useState } from "react";
import { scrollToId } from "@/lib/utils";
import SectionTitle from "@/components/SectionTitle";

const funFacts = [
  "Every cow has a best friend they hang out with every day.",
  "Otters sometime hold hands while sleeping to not drift apart.",
  "A cloud weighs around a million tonnes.",
  "The fear of long words is called Hippopotomonstrosesquippedaliophobia.",
  "It's almost impossible to get too much sugar from fresh fruit.",
  "You inhale 50 potentially harmful bacteria every time you breathe.",
  "You can see stars as they were 4,000 years ago with the naked eye.",
  "Bats aren’t blind.",
  "You can make friends with a cat by blinking slowly.",
  "The devil's number might have been 616, not 666.",
];

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
  {
    node: <GoOriginalIcon size={60} />,
    title: "Go",
    href: "https://go.dev/",
  },
];

const cardShell =
  "flex flex-col h-full w-full p-5 bg-background/80 border-zinc-200/70 rounded-xl border gap-4 relative group/card dark:bg-black/60 dark:border-white/10";

const About = () => {
  return (
    <div
      id="me"
      className="
        flex flex-col
        h-fit w-full
        gap-14 sm:gap-16 items-center
      "
    >
      <SectionTitle eyebrow="About" title="Who Am I?" />
      <div
        className="
          flex
          w-full h-full max-sm:flex-col max-sm:items-center
          justify-center items-start gap-12 sm:gap-16
        "
      >
        <TerminalContainer />
        <div
          className="
            flex flex-col
            h-full
            justify-center gap-3
            md:w-1/3
          "
        >
          <div
            className="
              flex
              h-full w-full max-2xl:flex-col
              gap-3
            "
          >
            <AboutCard />
            <SocialsCard />
          </div>
          <ContactTeaser />
        </div>
      </div>
      <Logos />
    </div>
  );
};

const TerminalContainer = () => {
  const [rand, setRand] = useState(0);
  useEffect(() => {
    setRand(getRandomInt(0, funFacts.length));
  }, []);

  const funFact = funFacts[rand];

  return (
    <Terminal startOnView={true} className="min-w-1/3">
      <TypingAnimation>&gt; ~/about-me.info</TypingAnimation>

      <AnimatedSpan className="text-muted-foreground">
        Loading profile for 'Tom Liu'...
      </AnimatedSpan>

      <AnimatedSpan>
        Bachelor of Computer Science 💻 and Law ⚖️ student @ UNSW.
      </AnimatedSpan>

      <TypingAnimation>
        &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;
      </TypingAnimation>

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
        {"  "}- {funFact}
      </AnimatedSpan>

      <TypingAnimation>
        &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;
      </TypingAnimation>

      <TypingAnimation>&gt; cat ~/welcome-message.info & exit</TypingAnimation>

      <AnimatedSpan className="text-blue-500">Nice to e-meet you!</AnimatedSpan>

      <AnimatedSpan className="text-blue-500">
        I hope you enjoy my little website &lt;3
      </AnimatedSpan>

      <TypingAnimation>
        &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;
      </TypingAnimation>

      <AnimatedSpan className="text-muted-foreground">
        ℹ Introduction complete.
      </AnimatedSpan>
    </Terminal>
  );
};

const AboutCard = () => {
  return (
    <CardContainer
      containerClassName="w-full 2xl:w-4/5"
      className="w-full h-full"
    >
      <CardBody className={cardShell}>
        <CardItem
          as="h3"
          translateZ={40}
          className="
            text-xl font-bold text-zinc-600
            dark:text-white
          "
        >
          Rock Bottom Frequenter
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
              group-hover/card:shadow-md
            "
          />
        </CardItem>
        <CardItem
          as="p"
          translateZ={60}
          className="text-zinc-500 text-sm dark:text-zinc-300"
        >
          Soft grass in dusk rain,
          <br />
          Beneath silken breeze, your eyes
          <br />
          Glimmer with moonlight.
        </CardItem>
      </CardBody>
    </CardContainer>
  );
};

const SocialsCard = () => {
  return (
    <CardContainer
      containerClassName="w-full 2xl:w-1/5"
      className="w-full h-full"
    >
      <CardBody
        className="
          flex
          h-full w-full
          p-5
          bg-background/80
          border-zinc-200/70 rounded-xl border
          items-center justify-center gap-6 relative group/card dark:bg-black/60 dark:border-white/10
          2xl:flex-col
        "
      >
        <CardItem translateZ={40}>
          <LinkIcon size={24} className="text-zinc-400" />
        </CardItem>
        <CardItem translateZ={100}>
          <Link href="https://github.com/tom-jt">
            <IconBrandGithub
              size={48}
              className="transition-all hover:text-zinc-400"
            />
          </Link>
        </CardItem>
        <CardItem translateZ={100}>
          <Link href="https://www.linkedin.com/in/tom-liu-jt">
            <IconBrandLinkedin
              size={48}
              className="transition-all hover:text-zinc-400"
            />
          </Link>
        </CardItem>
        <CardItem translateZ={40}>
          <LinkIcon size={24} className="text-zinc-400" />
        </CardItem>
      </CardBody>
    </CardContainer>
  );
};

const ContactTeaser = () => {
  return (
    <button
      type="button"
      onClick={() => scrollToId("contact")}
      className="
        group flex w-full items-center justify-between gap-4
        rounded-xl border border-zinc-200/70 bg-background/50 px-5 py-4
        text-left transition-colors
        hover:border-zinc-300 hover:bg-zinc-100/60
        dark:border-white/10 dark:bg-black/40
        dark:hover:border-white/20 dark:hover:bg-zinc-900/60
        cursor-pointer
      "
    >
      <div className="flex flex-col gap-0.5">
        <span className="text-sm font-medium text-zinc-700 dark:text-zinc-200">
          Want to chat?
        </span>
        <span className="text-xs text-zinc-500 dark:text-zinc-400">
          Jump to the message form →
        </span>
      </div>
      <span className="text-zinc-400 transition-transform group-hover:translate-x-0.5">
        ↓
      </span>
    </button>
  );
};

const Logos = () => {
  return (
    <div className="flex flex-col w-full items-center gap-8">
      <p className="c-eyebrow mb-0">Tools I grab</p>
      <LogoLoop
        logos={techLogos}
        speed={100}
        direction="right"
        logoHeight={48}
        gap={48}
        hoverSpeed={0}
        scaleOnHover={true}
        fadeOut
        className="max-sm:hidden opacity-80"
      />

      {/* Mobile */}
      <LogoLoop
        logos={techLogos}
        speed={50}
        direction="right"
        logoHeight={48}
        gap={20}
        hoverSpeed={0}
        fadeOut
        className="sm:hidden opacity-80"
      />
      <p className="text-sm text-zinc-500 dark:text-zinc-400">
        … to make the random things below
      </p>
    </div>
  );
};

const getRandomInt = (minInc: number, maxExc: number) => {
  const minCeiled = Math.ceil(minInc);
  const maxFloored = Math.floor(maxExc);
  return Math.floor(Math.random() * (maxFloored - minCeiled) + minCeiled);
};

export default About;
