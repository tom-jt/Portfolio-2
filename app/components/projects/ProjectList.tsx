"use client";

import { useEffect, useId, useRef, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { useOutsideClick } from "@/hooks/use-outside-click";
import { getFilteredProjects, Project } from "@/data/database";
import { JSX } from "react";

type ListedProject = {
  title: string;
  description: string;
  src: string;
  ctaText: string;
  ctaLink: string;
  content: string | (() => JSX.Element);
};

interface ProjectListProps {
  filterBy: (p: Project) => boolean;
}

const ProjectList = ({ filterBy }: ProjectListProps) => {
  const [active, setActive] = useState<ListedProject | boolean | null>(null);
  const id = useId();
  const ref = useRef<HTMLDivElement>(null!);

  const cards: ListedProject[] = getFilteredProjects(filterBy).map((p) => ({
    description: p.subtitle,
    ctaText: "Visit",
    ctaLink: p.link,
    src: p.img,
    ...p,
  }));

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setActive(false);
      }
    }

    if (active && typeof active === "object") {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "auto";
    }

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [active]);

  useOutsideClick(ref, () => setActive(null));

  return (
    <>
      <AnimatePresence>
        {active && typeof active === "object" && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="
              z-10
              h-full w-full
              bg-black/20
              fixed inset-0
            "
          />
        )}
      </AnimatePresence>
      <AnimatePresence>
        {active && typeof active === "object" ? (
          <div
            className="
              grid z-100
              fixed inset-0 place-items-center
            "
          >
            <motion.button
              key={`button-${active.title}-${id}`}
              layout
              initial={{
                opacity: 0,
              }}
              animate={{
                opacity: 1,
              }}
              exit={{
                opacity: 0,
                transition: {
                  duration: 0.05,
                },
              }}
              onClick={() => setActive(null)}
              className="
                flex
                h-6 w-6
                bg-zinc-50
                rounded-full
                absolute top-2 right-2 items-center justify-center
                lg:hidden
              "
            >
              <CloseIcon />
            </motion.button>
            <motion.div
              layoutId={`card-${active.title}-${id}`}
              ref={ref}
              className="
                flex flex-col overflow-hidden
                w-full max-w-125 h-full
                bg-zinc-50
                dark:bg-neutral-900
                sm:rounded-3xl
                md:h-fit md:max-h-[90%]
              "
            >
              <motion.div layoutId={`image-${active.title}-${id}`}>
                <img
                  width={200}
                  height={200}
                  src={active.src}
                  alt={active.title}
                  className="
                    object-cover object-top
                    w-full h-80
                    sm:rounded-tr-lg sm:rounded-tl-lg
                    lg:h-80
                  "
                />
              </motion.div>

              <div>
                <div className="flex p-4 justify-between items-start">
                  <div className="">
                    <motion.h3
                      layoutId={`title-${active.title}-${id}`}
                      className="
                        font-medium text-neutral-700 text-base
                        dark:text-neutral-200
                      "
                    >
                      {active.title}
                    </motion.h3>
                    <motion.p
                      layoutId={`description-${active.description}-${id}`}
                      className="
                        text-neutral-600 text-base
                        dark:text-neutral-400
                      "
                    >
                      {active.description}
                    </motion.p>
                  </div>

                  <motion.a
                    layout
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    href={active.ctaLink}
                    target="_blank"
                    className="
                      px-4 py-3
                      text-sm font-bold text-zinc-50
                      bg-green-500
                      rounded-full
                    "
                  >
                    {active.ctaText}
                  </motion.a>
                </div>
                <div className="pt-4 px-4 relative">
                  <motion.div
                    layout
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="
                      flex flex-col overflow-auto
                      h-40
                      pb-10
                      text-neutral-600 text-xs
                      items-start gap-4 dark:text-neutral-400 [mask:linear-gradient(to_bottom,zinc-50,zinc-50,transparent)] [scrollbar-width:none] [-ms-overflow-style:none] [-webkit-overflow-scrolling:touch]
                      md:h-fit md:text-sm
                      lg:text-base
                    "
                  >
                    {typeof active.content === "function"
                      ? active.content()
                      : active.content}
                  </motion.div>
                </div>
              </div>
            </motion.div>
          </div>
        ) : null}
      </AnimatePresence>
      <ul
        className="
          grid grid-cols-1
          max-w-2xl w-full
          mx-auto
          items-start gap-4
          md:grid-cols-2
        "
      >
        {cards.map((card) => (
          <motion.div
            layoutId={`card-${card.title}-${id}`}
            key={card.title}
            onClick={() => setActive(card)}
            className="
              flex flex-col
              p-4
              rounded-xl
              cursor-pointer
              hover:bg-zinc-200 dark:hover:bg-neutral-800
            "
          >
            <div className="flex flex-col w-full gap-4">
              <motion.div layoutId={`image-${card.title}-${id}`}>
                <img
                  width={100}
                  height={100}
                  src={card.src}
                  alt={card.title}
                  className="
                    object-cover object-top
                    h-60 w-full
                    rounded-lg
                  "
                />
              </motion.div>
              <div
                className="
                  flex flex-col
                  justify-center items-center
                "
              >
                <motion.h3
                  layoutId={`title-${card.title}-${id}`}
                  className="
                    font-medium text-neutral-800 text-center text-base
                    dark:text-neutral-200
                    md:text-left
                  "
                >
                  {card.title}
                </motion.h3>
                <motion.p
                  layoutId={`description-${card.description}-${id}`}
                  className="
                    text-neutral-600 text-center text-base
                    dark:text-neutral-400
                    md:text-left
                  "
                >
                  {card.description}
                </motion.p>
              </div>
            </div>
          </motion.div>
        ))}
      </ul>
    </>
  );
};

export const CloseIcon = () => {
  return (
    <motion.svg
      initial={{
        opacity: 0,
      }}
      animate={{
        opacity: 1,
      }}
      exit={{
        opacity: 0,
        transition: {
          duration: 0.05,
        },
      }}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="h-4 w-4 text-black"
    >
      <path stroke="none" d="M0 0h24v24H0z" fill="none" />
      <path d="M18 6l-12 12" />
      <path d="M6 6l12 12" />
    </motion.svg>
  );
};

export default ProjectList;
