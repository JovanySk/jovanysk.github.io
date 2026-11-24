"use client";

import { ArrowRight, Briefcase } from "@phosphor-icons/react";
import type { Metric } from "@/i18n";
import { useSite } from "./providers";
import { Reveal, RevealItem, SectionTitle, chip } from "./ui";

// Bento placement for the 8 metrics, in dictionary order (exact cell count, no empty cells).
const CELLS = [
  { span: "md:col-span-2 lg:col-span-7 lg:row-span-2", variant: "tint", big: true },
  { span: "lg:col-span-5", variant: "plain" },
  { span: "lg:col-span-5", variant: "grid" },
  { span: "lg:col-span-3", variant: "plain" },
  { span: "lg:col-span-5", variant: "plain" },
  { span: "lg:col-span-4", variant: "plain" },
  { span: "lg:col-span-5", variant: "plain" },
  { span: "md:col-span-2 lg:col-span-7", variant: "plain" },
] as const;

function MetricValue({ m, big, to }: { m: Metric; big?: boolean; to: string }) {
  const size = big ? "text-5xl sm:text-6xl lg:text-7xl" : "text-3xl sm:text-4xl";
  return (
    <p className={`flex flex-wrap items-center gap-x-3 gap-y-1 font-mono font-medium tracking-[-0.04em] ${size}`}>
      {m.before && (
        <>
          <span className="text-muted">{m.before}</span>
          <ArrowRight size={big ? 32 : 20} weight="regular" className="shrink-0 text-muted" aria-hidden="true" />
          <span className="sr-only">{to}</span>
        </>
      )}
      <span className={big ? "text-accent" : "text-fg"}>{m.after}</span>
    </p>
  );
}

export function Experience() {
  const { t } = useSite();
  const e = t.experience;

  return (
    <section id="experience" aria-labelledby="experience-title" className="mx-auto max-w-7xl px-4 py-24 md:px-8 md:py-32">
      <Reveal stagger as="header" className="max-w-3xl">
        <RevealItem>
          <SectionTitle id="experience-title">{e.title}</SectionTitle>
        </RevealItem>
        <RevealItem className="mt-6 flex flex-wrap items-center gap-x-3 gap-y-2 text-sm">
          <Briefcase size={16} weight="regular" className="text-accent" aria-hidden="true" />
          <span className="font-medium text-fg">{e.role}</span>
          <span className="text-muted">{e.company}</span>
          <span className="font-mono text-xs text-muted">{e.period}</span>
        </RevealItem>
        <RevealItem>
          <p className="mt-5 max-w-[62ch] text-pretty leading-relaxed text-muted">{e.body}</p>
        </RevealItem>
        <RevealItem className="mt-6 flex flex-wrap items-center gap-2">
          <span className="inline-flex items-center rounded-full bg-accent-soft px-3 py-1 text-xs font-medium text-accent ring-1 ring-inset ring-accent-line">
            {e.badge}
          </span>
          {e.stack.map((s) => (
            <span key={s} className={chip}>
              {s}
            </span>
          ))}
        </RevealItem>
      </Reveal>

      <Reveal stagger as="ul" className="mt-14 grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-12">
        {e.metrics.map((m, i) => {
          const c = CELLS[i];
          const bg = c.variant === "tint" ? "core-tint" : c.variant === "grid" ? "core-grid" : "";
          const big = "big" in c && c.big;
          return (
            <RevealItem as="li" key={i} className={`shell ${c.span}`}>
              <div className={`core flex h-full flex-col justify-between gap-8 p-6 ${big ? "md:p-9" : ""} ${bg}`}>
                <MetricValue m={m} big={big} to={e.to} />
                <p className={`max-w-[46ch] text-pretty text-sm leading-relaxed ${big ? "text-fg md:text-base" : "text-muted"}`}>
                  {m.label}
                </p>
              </div>
            </RevealItem>
          );
        })}
      </Reveal>
    </section>
  );
}
