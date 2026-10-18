"use client";

import { motion } from "motion/react";
import Link from "next/link";
import Image from "next/image";
import { IconBrandGithub, IconBrandLinkedin } from "@tabler/icons-react";
import SectionTitle from "@/components/shared/SectionTitle";
import GoldRule from "@/components/law/GoldRule";
import GuillocheRings from "@/components/law/GuillocheRings";
import { profile } from "@/data/shared/profile";

/**
 * MagicUI's box-reveal is not in the registry under that name, so the staged
 * reveals here are plain motion — one fewer dependency for the same effect.
 */
const Reveal = ({
  children,
  delay = 0,
}: {
  children: React.ReactNode;
  delay?: number;
}) => (
  <motion.div
    initial={{ opacity: 0, y: 24 }}
    whileInView={{ opacity: 1, y: 0 }}
    viewport={{ once: true, margin: "-80px" }}
    transition={{ duration: 0.7, delay, ease: [0.22, 1, 0.36, 1] }}
  >
    {children}
  </motion.div>
);

const interests = [
  "Constitutional Law",
  "International Commercial Arbitration",
  "Contract Law",
  "Cybersecurity",
  "Privacy Law",
];

const About = () => {
  return (
    <section
      id="me"
      className="flex w-full scroll-mt-32 flex-col items-center gap-16"
    >
      <SectionTitle eyebrow="About" title="Who Am I?" as="h2" />

      <div className="flex w-full items-center justify-center gap-16 max-lg:flex-col">
        {/* Portrait, framed in a gold hairline rather than a drop shadow. */}
        <Reveal>
          <div className="relative shrink-0">
            {/* Oversized rings bleeding out from behind the portrait. */}
            <GuillocheRings
              size={560}
              rings={7}
              opacity={0.5}
              className="pointer-events-none absolute -top-28 -left-32 -z-10"
            />
            <div className="border-gold-hair absolute -inset-3 border" />
            <Image
              src="/images/AboutPhotoLaw.jpg"
              alt="Tom Liu"
              width={680}
              height={840}
              priority
              className="relative h-105 w-85 object-cover"
            />
          </div>
        </Reveal>

        <div className="flex max-w-xl flex-col gap-7">
          <div className="flex justify-between">
            <Reveal delay={0.1}>
              <p className="font-display text-accent-text text-4xl leading-tight font-medium">
                Law and Computer Science Student @ UNSW
              </p>
            </Reveal>
            <Reveal delay={0.35}>
              <div className="flex items-center gap-5 pt-2">
                <Link
                  href={profile.socials.linkedin}
                  aria-label="LinkedIn"
                  className="text-muted-foreground hover:text-accent-text transition-colors"
                >
                  <IconBrandLinkedin size={32} />
                </Link>
                <Link
                  href={profile.socials.github}
                  aria-label="GitHub"
                  className="text-muted-foreground hover:text-accent-text transition-colors"
                >
                  <IconBrandGithub size={32} />
                </Link>
              </div>
            </Reveal>
          </div>

          <Reveal delay={0.15}>
            <GoldRule fade="right" />
          </Reveal>

          <Reveal delay={0.2}>
            <p className="text-lg leading-relaxed">
              I'm equally obsessed with oral advocacy and developing video
              games. Having served my time in Law School, I now read legal
              scholarship for fun and will quietly fix your AGLC footnotes and
              en-dashes if you leave them unattended.
            </p>
          </Reveal>

          <Reveal delay={0.25}>
            <p className="text-muted-foreground text-base leading-relaxed">
              Away from studying, I play piano, spend time on badminton courts
              and on the ice, and maintain an unreasonable diet of boba and
              watermelon.
            </p>
          </Reveal>

          <Reveal delay={0.3}>
            <div className="flex flex-col gap-4 pt-2">
              <p className="c-eyebrow mb-0 text-left">Areas of interest</p>
              <div className="flex flex-wrap gap-2 justify-center">
                {interests.map((area) => (
                  <span
                    key={area}
                    className="border-border text-muted-foreground border px-4 py-2 text-sm"
                  >
                    {area}
                  </span>
                ))}
              </div>
            </div>
          </Reveal>
        </div>
      </div>

      <Reveal delay={0.1}>
        <div className="flex max-w-3xl flex-col items-center gap-5 text-center">
          <p className="c-eyebrow mb-0">Favourite quote</p>
          <figure className="flex flex-col items-center gap-4">
            <blockquote className="font-display text-xl leading-relaxed italic">
              ‘The flame of the Commonwealth’s hatred for that beneficial
              constitutional guarantee, s&nbsp;51(xxxi), may flicker, but it
              will not die. That is why it is eternally important to ensure that
              that flame does not start a destructive blaze.’
            </blockquote>
            <GoldRule weight="hair" className="w-24" />
            <figcaption className="text-muted-foreground text-sm">
              <cite>JT International SA v Commonwealth</cite> (2012) 250 CLR 1
            </figcaption>
          </figure>
        </div>
      </Reveal>
    </section>
  );
};

export default About;
