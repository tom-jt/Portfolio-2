"use client";

import { AnimatedThemeToggler } from "@/components/ui/animated-theme-toggler";
import SealMark from "@/components/law/SealMark";
import GoldRule from "@/components/law/GoldRule";
import SectionTitle from "@/components/shared/SectionTitle";
import Form from "@/components/shared/Form";
import Button from "@/components/shared/Button";

/**
 * Phase 2 specimen. Not the real law site — this exists to prove the palette
 * and the shared-component reskin before four sections get built on top of
 * them. Replaced by the real landing page in phase 3.
 */

const swatches: { name: string; token: string; note?: string }[] = [
  { name: "background", token: "--background", note: "page ground" },
  { name: "card", token: "--card", note: "panels" },
  { name: "foreground", token: "--foreground", note: "body ink" },
  { name: "muted-foreground", token: "--muted-foreground", note: "secondary" },
  { name: "primary", token: "--primary", note: "royal red" },
  { name: "gold", token: "--gold", note: "metallic" },
  { name: "gold-highlight", token: "--gold-highlight", note: "sweep peak" },
  { name: "border", token: "--border", note: "hairline" },
];

const Section = ({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) => (
  <section className="flex w-full flex-col gap-8">
    <div className="flex flex-col gap-3">
      <p className="c-eyebrow mb-0 text-left">{label}</p>
      <GoldRule fade="right" />
    </div>
    {children}
  </section>
);

export default function LawSpecimenPage() {
  return (
    <main className="mx-auto flex max-w-5xl flex-col gap-20 px-[6vw] py-20">
      {/* Header */}
      <header className="flex items-start justify-between gap-8">
        <div className="flex items-center gap-6">
          <SealMark size={88} />
          <div className="flex flex-col gap-1">
            <p className="c-eyebrow mb-0 text-left">Design specimen</p>
            <h1 className="font-display text-6xl leading-none font-medium">
              Law
            </h1>
          </div>
        </div>
        <AnimatedThemeToggler className="text-muted-foreground hover:text-gold cursor-pointer transition-colors" />
      </header>

      <Section label="Palette">
        <div className="grid grid-cols-2 gap-px sm:grid-cols-4">
          {swatches.map((s) => (
            <div key={s.token} className="border-border flex flex-col border">
              <div
                className="h-20 w-full"
                style={{ background: `var(${s.token})` }}
              />
              <div className="flex flex-col gap-0.5 p-3">
                <span className="font-mono text-sm tracking-tight">
                  {s.name}
                </span>
                {s.note ? (
                  <span className="text-muted-foreground text-sm">
                    {s.note}
                  </span>
                ) : null}
              </div>
            </div>
          ))}
        </div>
      </Section>

      <Section label="Type scale">
        <div className="flex flex-col gap-6">
          <p className="font-display text-8xl leading-none font-light">
            Display 300
          </p>
          <p className="font-display text-6xl leading-none font-medium">
            Heading 500
          </p>
          <p className="font-display text-4xl leading-tight font-semibold">
            Subhead 600
          </p>
          <GoldRule fade="right" />
          <p className="max-w-2xl text-lg leading-relaxed">
            Body copy is set in Inter, not a serif. Pairing a high-contrast
            display face with a neutral grotesque keeps long passages readable
            and stops the page reading as a wedding invitation. The serif does
            the ceremony; the sans does the work.
          </p>
          <p className="text-muted-foreground max-w-2xl text-base leading-relaxed">
            Secondary copy sits at muted-foreground. On the light palette this
            is a warm grey, not a cool one, so it does not fight the ivory
            ground.
          </p>
        </div>
      </Section>

      {/* The decisive test. */}
      <Section label="Gold, under test">
        <div className="flex flex-col gap-10">
          <div className="flex flex-col gap-3">
            <p className="text-muted-foreground text-base">
              1 — Gold as large text (expected to fail on the light palette)
            </p>
            <p className="text-gold font-display text-5xl font-medium">
              Bachelor of Laws
            </p>
          </div>

          <div className="flex flex-col gap-3">
            <p className="text-muted-foreground text-base">
              2 — Royal red as large text (the light palette&rsquo;s real accent)
            </p>
            <p className="text-primary font-display text-5xl font-medium">
              Bachelor of Laws
            </p>
          </div>

          <div className="flex flex-col gap-3">
            <p className="text-muted-foreground text-base">
              3 — Gold as hairline and small mark (expected to work in both)
            </p>
            <div className="flex items-center gap-4">
              <SealMark size={56} />
              <GoldRule fade="right" />
            </div>
          </div>

          <div className="flex flex-col gap-3">
            <p className="text-muted-foreground text-base">
              4 — Gold sweep on a heading (the &ldquo;glitter&rdquo;, once)
            </p>
            <p className="c-gold-sweep font-display text-5xl font-medium">
              Tom Liu
            </p>
          </div>

          <div className="border-gold-hair flex flex-col gap-3 border-l-2 pl-5">
            <p className="text-muted-foreground text-base">
              5 — Resolution: <code>accent-text</code>, which is red on light
              and gold on dark. Compare against 1 and 2 in both themes — this
              row should look right in each, where they each only look right
              in one.
            </p>
            <p className="c-eyebrow mb-0 text-left">Admitted 2029</p>
            <p className="text-accent-text font-display text-5xl font-medium">
              Bachelor of Laws
            </p>
          </div>

          <div className="flex flex-col gap-3">
            <p className="text-muted-foreground text-base">
              6 — Sharp corners, hairline borders, no shadow
            </p>
            <div className="border-border bg-card max-w-md border p-6">
              <p className="font-display mb-2 text-3xl font-medium">
                R v Specimen
              </p>
              <p className="text-muted-foreground text-base">
                [2026] HCA 1 — a card with a 2px radius and a 1px border,
                carrying no shadow at all.
              </p>
            </div>
          </div>
        </div>
      </Section>

      {/* Proves phase 0's tokenisation: these are the CS components, unchanged. */}
      <Section label="Shared components, reskinned">
        <div className="flex flex-col gap-8">
          <p className="text-muted-foreground max-w-2xl text-base">
            None of the components below were modified for the law site. They
            read CSS variables, so they pick up the law palette automatically —
            this is the check that phase 0 actually worked.
          </p>
          <SectionTitle eyebrow="Contact" title="Get in touch" align="start" />
          <div className="flex flex-wrap items-start gap-10">
            <Form />
            <Button onClick={() => {}}>Shared Button</Button>
          </div>
        </div>
      </Section>
    </main>
  );
}
