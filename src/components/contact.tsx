"use client";

import { DownloadSimple, GithubLogo, LinkedinLogo, MapPin } from "@phosphor-icons/react";
import { LINKS } from "@/i18n";
import { useSite } from "./providers";
import { Cta, Reveal, RevealItem } from "./ui";

const social =
  "inline-flex size-11 items-center justify-center rounded-full text-fg ring-1 ring-inset ring-line-strong transition-[transform,color,box-shadow] duration-300 hover:text-accent hover:ring-accent-line active:scale-[0.96]";

export function Contact() {
  const { t, lang } = useSite();
  const c = t.contact;

  return (
    <section id="contact" aria-labelledby="contact-title" className="mx-auto max-w-7xl px-4 py-24 md:px-8 md:py-36">
      <Reveal stagger>
        <RevealItem>
          <h2
            id="contact-title"
            className="max-w-[18ch] text-balance text-4xl font-semibold leading-[1.02] tracking-[-0.04em] text-fg sm:text-5xl lg:text-7xl"
          >
            {c.title}
          </h2>
        </RevealItem>
        <RevealItem>
          <p className="mt-7 max-w-[50ch] text-pretty text-lg leading-relaxed text-muted">{c.body}</p>
        </RevealItem>
        <RevealItem className="mt-10 flex flex-wrap items-center gap-3">
          <Cta href={`mailto:${LINKS.email}`}>{c.cta}</Cta>
          <Cta href={LINKS.cv[lang]} variant="ghost" icon={DownloadSimple} download>
            {c.cv}
          </Cta>
          <span className="mx-1 hidden h-6 w-px bg-line sm:block" aria-hidden="true" />
          <a href={LINKS.github} target="_blank" rel="noopener noreferrer" aria-label={c.github} className={social}>
            <GithubLogo size={18} weight="regular" aria-hidden="true" />
          </a>
          <a href={LINKS.linkedin} target="_blank" rel="noopener noreferrer" aria-label={c.linkedin} className={social}>
            <LinkedinLogo size={18} weight="regular" aria-hidden="true" />
          </a>
        </RevealItem>
        <RevealItem className="mt-10 flex flex-wrap items-center gap-x-6 gap-y-2 font-mono text-sm text-muted">
          <a href={`mailto:${LINKS.email}`} className="text-fg underline decoration-line-strong underline-offset-4 hover:decoration-accent">
            {LINKS.email}
          </a>
          <span className="inline-flex items-center gap-1.5">
            <MapPin size={15} weight="regular" aria-hidden="true" />
            {c.location}
          </span>
        </RevealItem>
      </Reveal>
    </section>
  );
}
