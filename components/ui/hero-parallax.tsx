"use client";
import React from "react";
import {
  motion,
  useScroll,
  useTransform,
  useSpring,
  MotionValue,
} from "motion/react";
import TextType from "../TextType";
import ScrollDownIndicator from "../ScrollDownIndicator";

export interface Product {
  title: string;
  subtitle: string;
  link: string;
  thumbnail: string;
}

export interface HeroParallaxProps {
  products: Product[];
}

export const HeroParallax = ({ products }: HeroParallaxProps) => {
  const firstRow = products.slice(0, 5);
  const secondRow = products.slice(5, 10);
  const ref = React.useRef(null);
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start start", "end start"],
  });

  const springConfig = { stiffness: 300, damping: 30, bounce: 100 };

  const translateX = useSpring(
    useTransform(scrollYProgress, [0, 1], [0, 1000]),
    springConfig,
  );
  const translateXReverse = useSpring(
    useTransform(scrollYProgress, [0, 1], [0, -1000]),
    springConfig,
  );
  const rotateX = useSpring(
    useTransform(scrollYProgress, [0, 0.2], [15, 0]),
    springConfig,
  );
  const opacity = useSpring(
    useTransform(scrollYProgress, [0, 0.2], [0.2, 1]),
    springConfig,
  );
  const rotateZ = useSpring(
    useTransform(scrollYProgress, [0, 0.2], [20, 0]),
    springConfig,
  );
  const translateY = useSpring(
    useTransform(scrollYProgress, [0, 0.2], [-800, 100]),
    springConfig,
  );
  return (
    <div
      ref={ref}
      className="
        overflow-hidden flex flex-col
        transform-3d
        antialiased relative self-auto perspective-[1000px]
      "
    >
      <Header />
      <ProductTitle />
      <motion.div
        style={{
          rotateX,
          rotateZ,
          translateY,
          opacity,
        }}
        className=""
      >
        <motion.div
          className="
            flex flex-row-reverse
            max-sm:space-x-10
            space-x-reverse space-x-20 pb-20
          "
        >
          {firstRow.map((product) => (
            <ProductCard
              product={product}
              translate={translateX}
              key={product.title}
            />
          ))}
        </motion.div>
        <motion.div
          className="
            flex flex-row
            max-sm:space-x-10
            pb-26 space-x-20
          "
        >
          {secondRow.map((product) => (
            <ProductCard
              product={product}
              translate={translateXReverse}
              key={product.title}
            />
          ))}
        </motion.div>
      </motion.div>
    </div>
  );
};

export const Header = () => {
  const subtitle =
    "A Computer Science and Law student overdosing on boba and discovering life the hard way.";
  return (
    <div
      className="
        flex z-10
        w-full h-screen
        relative justify-center items-center
      "
    >
      <div
        className="
          flex flex-col
          h-[30%] w-full
          px-[15vw]
          justify-between gap-8
        "
      >
        <TextType
          text={[
            "HEY THERE,\nI'M TOM",
            "你好、\n我叫汤姆",
            "SALUT,\nJE M'APPELLE TOM",
            "はじめまして、\nトムです",
          ]}
          typingSpeed={75}
          pauseDuration={4000}
          showCursor
          cursorCharacter="_"
          deletingSpeed={50}
          cursorBlinkDuration={0.5}
          variableSpeed={{ min: 60, max: 120 }}
          className="max-sm:text-4xl text-7xl font-bold"
        />
        <p
          className="
            max-w-lg max-sm:hidden
            text-zinc-700
            dark:text-zinc-300
            md:text-xl
          "
        >
          {subtitle}
        </p>
      </div>

      <div className="absolute bottom-1/8">
        <ScrollDownIndicator />
      </div>

      {/* Mobile */}
      <div
        className="
          px-8
          text-center
          absolute bottom-1/6
          sm:hidden
        "
      >
        <p>{subtitle}</p>
      </div>
    </div>
  );
};

export const ProductTitle = () => {
  return (
    <div className="flex z-10 w-full justify-center">
      <h1 className="pt-4 c-h1">Featured Projects</h1>
    </div>
  );
};

export const ProductCard = ({
  product,
  translate,
}: {
  product: Product;
  translate: MotionValue<number>;
}) => {
  return (
    <motion.div
      style={{
        x: translate,
      }}
      whileHover={{
        y: -20,
      }}
      key={product.title}
      className="
        h-96 w-120 max-sm:h-48 max-sm:w-60
        group/product relative shrink-0
      "
    >
      <a href={product.link} className="block group-hover/product:shadow-2xl">
        <img
          src={product.thumbnail}
          height="600"
          width="600"
          alt={product.title}
          className="
            object-cover object-top-left
            h-full w-full
            rounded-xl
            shadow-2xs
            absolute inset-0 dark:brightness-75
          "
        />
      </a>
      <div
        className="
          h-full w-full
          bg-black
          rounded-xl
          opacity-0 pointer-events-none
          absolute inset-0 group-hover/product:opacity-80
        "
      ></div>
      <h2
        className="
          opacity-0
          absolute bottom-4 left-4 group-hover/product:opacity-100
        "
      >
        <p className="text-zinc-50">{product.title}</p>
        <p className="text-zinc-300">{product.subtitle}</p>
      </h2>
    </motion.div>
  );
};
