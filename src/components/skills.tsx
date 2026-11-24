"use client";

import { Brain, Database, HardDrives, TestTube, type Icon } from "@phosphor-icons/react";
import { useSite } from "./providers";
import { Reveal, RevealItem, SectionTitle } from "./ui";

const ICONS: Icon[] = [Brain, HardDrives, Database, TestTube];

export function Skills() {
  const { t } = useSite();
  const s = t.skills;

  return (
    <section id="skills" aria-labelledby="skills-title" className="mx-auto max-w-7xl px-4 py-24 md:px-8 md:py-32">
      <Reveal>
        <SectionTitle id="skills-title">{s.title}</SectionTitle>
      </Reveal>

      <Reveal stagger className="mt-14 grid grid-cols-1 gap-x-16 gap-y-12 md:grid-cols-2">
        {s.groups.map((g, i) => {
          const IconCmp = ICONS[i];
          return (
            <RevealItem key={g.name} className="border-t border-line pt-6">
              <h3 className="flex items-center gap-2.5 text-base font-medium tracking-[-0.01em] text-fg">
                <IconCmp size={18} weight="regular" className="text-accent" aria-hidden="true" />
                {g.name}
              </h3>
              <ul className="mt-5 flex flex-wrap gap-2">
                {g.items.map((it) => (
                  <li
                    key={it}
                    className="rounded-full bg-raised px-3 py-1.5 font-mono text-xs text-fg ring-1 ring-inset ring-line"
                  >
                    {it}
                  </li>
                ))}
              </ul>
            </RevealItem>
          );
        })}
      </Reveal>

      <Reveal>
        <p className="mt-12 text-sm text-muted">
          <span className="font-medium text-fg">{s.alsoLabel}:</span> {s.also}
        </p>
      </Reveal>
    </section>
  );
}
