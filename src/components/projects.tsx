"use client";

import Image from "next/image";
import { ArrowUpRight, Check } from "@phosphor-icons/react";
import { LINKS, type FeaturedProject } from "@/i18n";
import { useSite } from "./providers";
import { Reveal, RevealItem, SectionTitle, chip } from "./ui";
import { TiltCard } from "./tilt-card";

// Asymmetric 12-col bento: screenshot tiles get the wide cells, typographic tiles the narrow ones.
const LAYOUT: Record<string, { order: number; span: string }> = {
  "ordercontext-mcp": { order: 1, span: "lg:col-span-5" },
  "plant-doctor-ai": { order: 2, span: "lg:col-span-7" },
  smartticket: { order: 3, span: "lg:col-span-4" },
  "bi-tienda": { order: 4, span: "lg:col-span-8" },
  "n8n-ai-ticket-pipeline": { order: 5, span: "lg:col-span-7" },
  "browsing-history-mirror": { order: 6, span: "lg:col-span-5" },
  "qaflow-api": { order: 7, span: "lg:col-span-4" },
  "zyra-compiler": { order: 8, span: "lg:col-span-8" },
};

// Real tool names registered in ordercontext-mcp/mcp-server/src/tools.ts
const MCP_TOOLS = [
  "get_order_by_id",
  "list_pending_orders",
  "get_customer_summary",
  "get_low_stock_products",
  "generate_order_context",
];

function Header({ p }: { p: FeaturedProject }) {
  return (
    <div className="flex items-start justify-between gap-4">
      <h3 className="text-lg font-medium tracking-[-0.02em] text-fg">{p.repo}</h3>
      <span
        aria-hidden="true"
        className="inline-flex size-8 shrink-0 items-center justify-center rounded-full bg-raised text-muted transition-[transform,color] duration-300 ease-[cubic-bezier(0.32,0.72,0,1)] group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-accent"
      >
        <ArrowUpRight size={15} weight="regular" />
      </span>
    </div>
  );
}

function Body({ p, hideDesc = false }: { p: FeaturedProject; hideDesc?: boolean }) {
  return (
    <>
      {!hideDesc && <p className="mt-2 max-w-[56ch] text-pretty text-sm leading-relaxed text-muted">{p.desc}</p>}
      <ul className="mt-4 space-y-1.5">
        {p.facts.map((f) => (
          <li key={f} className="flex gap-2 text-sm leading-snug text-fg">
            <Check size={14} weight="regular" className="mt-[3px] shrink-0 text-accent" aria-hidden="true" />
            <span>{f}</span>
          </li>
        ))}
      </ul>
      <div className="mt-5 flex flex-wrap gap-1.5">
        {p.stack.map((s) => (
          <span key={s} className={chip}>
            {s}
          </span>
        ))}
      </div>
    </>
  );
}

function ImageTile({ p }: { p: FeaturedProject }) {
  const img = p.image!;
  return (
    <div className="flex h-full flex-col">
      <div className="relative aspect-[16/9] overflow-hidden border-b border-line bg-raised lg:aspect-[2/1]">
        <Image
          src={img.src}
          alt={img.alt}
          width={img.w}
          height={img.h}
          sizes="(min-width: 1024px) 720px, 100vw"
          className="h-full w-full object-cover object-top transition-transform duration-700 ease-[cubic-bezier(0.32,0.72,0,1)] group-hover:-translate-y-1 group-hover:scale-[1.03]"
        />
      </div>
      <div className="flex flex-1 flex-col p-6">
        <Header p={p} />
        <Body p={p} />
      </div>
    </div>
  );
}

function TypeTile({ p, codeCaption }: { p: FeaturedProject; codeCaption: string }) {
  const isCode = p.kind === "code";
  return (
    <div className={`flex h-full flex-col p-6 md:p-7 ${p.repo === "smartticket" ? "core-tint" : ""}`}>
      <Header p={p} />
      <p className="mt-2 max-w-[56ch] text-pretty text-sm leading-relaxed text-muted">{p.desc}</p>
      {p.metric && (
        <div className="mt-6">
          <p className="font-mono text-6xl font-medium leading-none tracking-[-0.05em] text-accent md:text-7xl">
            {p.metric.value}
          </p>
          <p className="mt-3 text-sm text-fg">{p.metric.caption}</p>
        </div>
      )}
      {isCode && (
        <figure className="mt-6 border-t border-line pt-4">
          <ul className="space-y-1 font-mono text-[12.5px] leading-relaxed">
            {MCP_TOOLS.map((tool) => (
              <li key={tool} className="flex items-center justify-between gap-3">
                <span className="truncate text-fg">{tool}</span>
                <span className="shrink-0 text-muted">readOnly</span>
              </li>
            ))}
          </ul>
          <figcaption className="mt-3 text-xs text-muted">{codeCaption}</figcaption>
        </figure>
      )}
      <div className="mt-auto pt-6">
        <Body p={p} hideDesc />
      </div>
    </div>
  );
}

export function Projects() {
  const { t } = useSite();
  const items = [...t.projects.items].sort((a, b) => LAYOUT[a.repo].order - LAYOUT[b.repo].order);

  return (
    <section id="projects" aria-labelledby="projects-title" className="mx-auto max-w-7xl px-4 py-24 md:px-8 md:py-32">
      <Reveal>
        <SectionTitle id="projects-title">{t.projects.title}</SectionTitle>
      </Reveal>
      <Reveal stagger as="ul" className="mt-14 grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-12">
        {items.map((p) => (
          <RevealItem as="li" key={p.repo} className={LAYOUT[p.repo].span}>
            <TiltCard href={LINKS.repo(p.repo)} label={t.projects.repoAria(p.repo)}>
              {p.kind === "image" ? <ImageTile p={p} /> : <TypeTile p={p} codeCaption={t.projects.codeCaption} />}
            </TiltCard>
          </RevealItem>
        ))}
      </Reveal>
    </section>
  );
}
