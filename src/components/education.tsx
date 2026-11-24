"use client";

import { Certificate, GraduationCap, Translate } from "@phosphor-icons/react";
import { useSite } from "./providers";
import { Reveal, RevealItem } from "./ui";

export function Education() {
  const { t } = useSite();
  const e = t.education;

  return (
    <section aria-labelledby="education-title" className="mx-auto max-w-7xl px-4 pb-24 md:px-8 md:pb-32">
      <Reveal className="shell">
        <div className="core grid grid-cols-1 gap-10 p-7 md:p-10 lg:grid-cols-[1.4fr_1fr] lg:gap-16">
          <div>
            <h2 id="education-title" className="flex items-center gap-2.5 text-sm font-medium text-muted">
              <GraduationCap size={18} weight="regular" className="text-accent" aria-hidden="true" />
              {e.title}
            </h2>
            <p className="mt-5 text-balance text-2xl font-semibold leading-tight tracking-[-0.03em] text-fg md:text-3xl">
              {e.degree}
            </p>
            <p className="mt-3 text-muted">{e.school}</p>
            <p className="mt-1 font-mono text-sm text-fg">{e.grad}</p>
          </div>
          <Reveal stagger className="flex flex-col justify-end gap-6">
            <RevealItem className="flex gap-3">
              <Certificate size={18} weight="regular" className="mt-0.5 shrink-0 text-accent" aria-hidden="true" />
              <div>
                <h3 className="text-sm font-medium text-fg">{e.certTitle}</h3>
                <p className="mt-1 text-pretty text-sm leading-relaxed text-muted">{e.cert}</p>
              </div>
            </RevealItem>
            <RevealItem className="flex gap-3">
              <Translate size={18} weight="regular" className="mt-0.5 shrink-0 text-accent" aria-hidden="true" />
              <div>
                <h3 className="text-sm font-medium text-fg">{e.langTitle}</h3>
                <p className="mt-1 text-sm leading-relaxed text-muted">{e.langs}</p>
              </div>
            </RevealItem>
          </Reveal>
        </div>
      </Reveal>
    </section>
  );
}
