"use client";

import { motion, useReducedMotion, type Variants } from "motion/react";
import { ArrowDownRight, DownloadSimple } from "@phosphor-icons/react";
import { LINKS } from "@/i18n";
import { useSite } from "./providers";
import { Cta, EASE } from "./ui";
import { HeroVisual } from "./hero-visual";

const parent: Variants = { hidden: {}, show: { transition: { staggerChildren: 0.09, delayChildren: 0.1 } } };
const child: Variants = {
  hidden: { opacity: 0, y: 28, filter: "blur(6px)" },
  show: { opacity: 1, y: 0, filter: "blur(0px)", transition: { duration: 0.9, ease: EASE } },
};
// The headline is the LCP element: it moves in but is never hidden, so it paints with the HTML.
const headline: Variants = {
  hidden: { y: 18 },
  show: { y: 0, transition: { duration: 0.9, ease: EASE } },
};

export function Hero() {
  const { t, lang } = useSite();
  const reduce = useReducedMotion();

  return (
    <section
      id="top"
      aria-labelledby="hero-title"
      className="mx-auto grid min-h-[100dvh] max-w-7xl grid-cols-1 items-center gap-12 px-4 pb-16 pt-28 md:px-8 lg:grid-cols-[1.4fr_1fr] lg:gap-12 lg:pb-12 lg:pt-24"
    >
      {/* Text column: Motion tree */}
      <motion.div variants={parent} initial={reduce ? false : "hidden"} animate="show" className="min-w-0">
        <motion.p variants={child} className="font-mono text-xs text-muted">
          {t.hero.eyebrow}
        </motion.p>
        <motion.h1
          id="hero-title"
          variants={headline}
          className="mt-5 text-balance text-[2.15rem] font-semibold leading-[1.05] tracking-[-0.035em] text-fg sm:text-5xl lg:text-[2.25rem] xl:text-[2.85rem]"
        >
          {t.hero.title}
        </motion.h1>
        <motion.p variants={child} className="mt-6 max-w-[44ch] text-pretty text-base leading-relaxed text-muted md:text-lg">
          {t.hero.sub}
        </motion.p>
        <motion.div variants={child} className="mt-9 flex flex-wrap items-center gap-3">
          <Cta href="#projects" icon={ArrowDownRight}>
            {t.hero.ctaProjects}
          </Cta>
          <Cta href={LINKS.cv[lang]} variant="ghost" icon={DownloadSimple} download>
            {t.hero.ctaCv}
          </Cta>
        </motion.div>
      </motion.div>

      {/* Visual column: separate tree, three.js leaf inside, no Motion */}
      <HeroVisual />
    </section>
  );
}
