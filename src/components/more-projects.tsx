"use client";

import Image from "next/image";
import { ArrowUpRight } from "@phosphor-icons/react";
import { LINKS } from "@/i18n";
import { useSite } from "./providers";
import { Reveal, RevealItem } from "./ui";

export function MoreProjects() {
  const { t } = useSite();
  const m = t.more;

  return (
    <section aria-labelledby="more-title" className="mx-auto max-w-7xl px-4 pb-24 md:px-8 md:pb-32">
      <Reveal>
        <h2 id="more-title" className="text-2xl font-semibold tracking-[-0.03em] text-fg md:text-3xl">
          {m.title}
        </h2>
      </Reveal>

      {/* media strip: scroll-snap on small screens, fixed-height row on desktop */}
      <Reveal
        stagger
        as="ul"
        className="-mx-4 mt-10 flex snap-x snap-mandatory items-start gap-3 overflow-x-auto px-4 pb-2 [scrollbar-width:none] md:mx-0 md:grid md:grid-cols-[1fr_1fr_auto_auto] md:overflow-visible md:px-0 md:pb-0"
      >
        {m.media.map((s) => (
          <RevealItem
            as="li"
            key={s.src}
            className={`shell shrink-0 snap-start ${s.phone ? "w-[140px] md:w-[124px]" : "w-[78vw] max-w-[420px] md:w-auto md:max-w-none"}`}
          >
            <div className={`core ${s.phone ? "aspect-[520/1036] md:aspect-auto md:h-[248px]" : "aspect-[16/10] md:aspect-auto md:h-[248px]"}`}>
              <Image
                src={s.src}
                alt={s.alt}
                width={s.w}
                height={s.h}
                sizes={s.phone ? "140px" : "(min-width: 768px) 40vw, 78vw"}
                className="h-full w-full object-cover object-top"
              />
            </div>
          </RevealItem>
        ))}
      </Reveal>

      <Reveal stagger as="ul" className="mt-10 grid grid-cols-1 gap-x-10 md:grid-cols-2">
        {m.items.map((p) => (
          <RevealItem as="li" key={p.repo} className="border-t border-line">
            <a
              href={LINKS.repo(p.repo)}
              target="_blank"
              rel="noopener noreferrer"
              className="group flex items-start justify-between gap-6 rounded-[1.25rem] py-5 transition-colors"
            >
              <span>
                <span className="block font-medium tracking-[-0.01em] text-fg transition-colors group-hover:text-accent">
                  {p.repo}
                </span>
                <span className="mt-1 block text-pretty text-sm leading-relaxed text-muted">{p.desc}</span>
              </span>
              <ArrowUpRight
                size={16}
                weight="regular"
                aria-hidden="true"
                className="mt-1 shrink-0 text-muted transition-transform duration-300 ease-[cubic-bezier(0.32,0.72,0,1)] group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-accent"
              />
            </a>
          </RevealItem>
        ))}
      </Reveal>
    </section>
  );
}
