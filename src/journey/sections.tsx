"use client";

/* HTML layer of the journey: every zone is a real section in the static HTML. */

import type { ReactNode } from "react";
import Image from "next/image";
import { ArrowDownRight, ArrowUpRight, DownloadSimple, GithubLogo, LinkedinLogo, PaperPlaneTilt, AppWindow } from "@phosphor-icons/react";
import { LINKS, type FeaturedProject, type MediaShot } from "@/i18n";
import { useSite } from "@/components/providers";
import { Magnetic, ProjectCard, Rise, SplitTitle } from "./fx";
import { CLUSTER_IDS, type ClusterId } from "./zones";

// Real tool names registered in ordercontext-mcp/mcp-server/src/tools.ts
const MCP_TOOLS = ["get_order_by_id", "list_pending_orders", "get_customer_summary", "get_low_stock_products", "generate_order_context"];

const chip = "inline-flex items-center rounded-md bg-white/[0.04] px-2 py-1 font-mono text-[11px] leading-none text-zinc-400 ring-1 ring-inset ring-white/10";

type Proj = { repo: string; desc: string; facts: string[]; stack: string[]; image?: MediaShot; phone?: MediaShot };

function useProjects() {
  const { t } = useSite();
  const map = new Map<string, Proj>();
  t.projects.items.forEach((p: FeaturedProject) => map.set(p.repo, { repo: p.repo, desc: p.desc, facts: p.facts, stack: p.stack, image: p.image }));
  const media: Record<string, MediaShot | undefined> = {
    stockpilot: t.more.media[0],
    "mi-mascota-citas": t.more.media[1],
    "datavault-android": t.more.media[2],
  };
  t.more.items.forEach((p) => map.set(p.repo, { repo: p.repo, desc: p.desc, facts: [], stack: [], image: media[p.repo] }));
  return (repo: string) => map.get(repo)!;
}

function Drift({ d, className = "", children }: { d: number; className?: string; children: ReactNode }) {
  return (
    <div className={`drift ${className}`} style={{ ["--d" as string]: d }}>
      {children}
    </div>
  );
}

function Cta({
  href,
  children,
  icon: Icon,
  primary,
  download,
  external,
}: {
  href: string;
  children: ReactNode;
  icon: typeof ArrowUpRight;
  primary?: boolean;
  download?: boolean;
  external?: boolean;
}) {
  return (
    <Magnetic>
      <a
        href={href}
        download={download || undefined}
        target={external ? "_blank" : undefined}
        rel={external ? "noopener noreferrer" : undefined}
        className={`group inline-flex h-12 items-center gap-3 rounded-full pl-5 pr-1.5 text-[14px] font-medium transition-[background-color,box-shadow,color] duration-300 ${
          primary
            ? "bg-emerald-400 text-zinc-950 shadow-[0_0_0_1px_rgb(52_211_153/0.4),0_10px_40px_-10px_rgb(52_211_153/0.6)] hover:bg-emerald-300"
            : "bg-zinc-950/60 text-zinc-100 ring-1 ring-inset ring-white/15 backdrop-blur-md hover:ring-white/35"
        }`}
      >
        {children}
        <span
          aria-hidden="true"
          className={`grid size-9 place-items-center rounded-full ${primary ? "bg-zinc-950/10" : "bg-white/[0.06]"}`}
        >
          <Icon size={16} className="transition-transform duration-300 group-hover:-translate-y-px group-hover:translate-x-px" />
        </span>
      </a>
    </Magnetic>
  );
}

function ZoneHead({ id, n, title, lead, right }: { id: ClusterId | "contact"; n?: number; title: string; lead?: string; right?: boolean }) {
  const { t } = useSite();
  return (
    <header className="relative">
      <p className={`flex items-center gap-3 font-mono text-[11px] uppercase tracking-[0.2em] text-zinc-500 ${right ? "lg:justify-end" : ""}`}>
        <span className="text-emerald-400">{n ? `${String(n).padStart(2, "0")} / 05` : t.journey.hud.exit}</span>
        <span className="h-px w-10 bg-white/20" aria-hidden="true" />
        <span>{t.journey.zones[id]}</span>
      </p>
      <SplitTitle id={`${id}-title`} text={title} className="mt-4" />
      {lead && <p className="mt-5 max-w-[46ch] text-pretty text-lg leading-relaxed text-zinc-300 md:text-xl">{lead}</p>}
    </header>
  );
}

function Zone({ id, children, className = "" }: { id: string; children: ReactNode; className?: string }) {
  return (
    <section id={id} data-zone aria-labelledby={`${id}-title`} className={`zone relative px-5 md:px-10 lg:pr-36 ${className}`}>
      <div className="mx-auto max-w-[1320px]">{children}</div>
    </section>
  );
}

function CardHead({ repo, k }: { repo: string; k?: { v: string; c: string } }) {
  return (
    <>
      <div className="flex items-start justify-between gap-4">
        <h3 className="font-mono text-[15px] font-medium tracking-tight text-zinc-50">{repo}</h3>
        <span
          aria-hidden="true"
          className="grid size-8 shrink-0 place-items-center rounded-full bg-white/[0.06] text-zinc-400 transition-[transform,color] duration-300 group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-emerald-400"
        >
          <ArrowUpRight size={15} />
        </span>
      </div>
      {k && (
        <p className="mt-4 flex items-baseline gap-3">
          <span className="font-mono text-4xl font-medium tracking-[-0.04em] text-emerald-400 md:text-5xl">{k.v}</span>
          <span className="font-mono text-[11px] uppercase tracking-[0.12em] text-zinc-400">{k.c}</span>
        </p>
      )}
    </>
  );
}

function Shot({ img, ratio = "aspect-[16/10]" }: { img: MediaShot; ratio?: string }) {
  return (
    <div className={`relative ${ratio} overflow-hidden border-b border-white/10 bg-zinc-900`}>
      <Image
        src={img.src}
        alt={img.alt}
        width={img.w}
        height={img.h}
        sizes="(min-width: 1024px) 560px, 100vw"
        className="h-full w-full object-cover object-top opacity-90 transition-[transform,opacity] duration-700 ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:scale-[1.03] group-hover:opacity-100"
      />
    </div>
  );
}

function Card({ p, cluster, slot, extra, showImage = true }: { p: Proj; cluster: ClusterId; slot: number; extra?: ReactNode; showImage?: boolean }) {
  const { t } = useSite();
  const k = t.journey.keys[p.repo];
  return (
    <ProjectCard href={LINKS.repo(p.repo)} label={t.projects.repoAria(p.repo)} cluster={cluster} slot={slot}>
      {showImage && p.image && <Shot img={p.image} />}
      <div className="p-5 md:p-6">
        <CardHead repo={p.repo} k={k} />
        {extra}
        <p className="mt-4 text-pretty text-[14.5px] leading-relaxed text-zinc-300">{p.desc}</p>
        {p.facts.length > 0 && (
          <ul className="mt-3 space-y-1">
            {p.facts.map((f) => (
              <li key={f} className="flex gap-2 text-[13px] leading-snug text-zinc-400">
                <span aria-hidden="true" className="mt-[7px] size-1 shrink-0 bg-emerald-400" />
                {f}
              </li>
            ))}
          </ul>
        )}
        {p.stack.length > 0 && (
          <div className="mt-4 flex flex-wrap gap-1.5">
            {p.stack.map((s) => (
              <span key={s} className={chip}>
                {s}
              </span>
            ))}
          </div>
        )}
      </div>
    </ProjectCard>
  );
}

/* ------------------------------------------------------------------ intro */

export function Intro() {
  const { t, lang } = useSite();
  const J = t.journey;
  return (
    <section id="top" data-zone aria-labelledby="hero-title" className="relative flex h-[100svh] min-h-[620px] flex-col justify-end px-5 pb-16 md:px-10 md:pb-14">
      <h1 id="hero-title" aria-label="Jovany Morales del Ángel" className="latent-name pointer-events-none absolute inset-x-0 text-center">
        <span aria-hidden="true" className="block">JOVANY</span>
        <span aria-hidden="true" className="block">MORALES</span>
      </h1>
      <div className="relative mx-auto flex w-full max-w-[1320px] flex-col gap-8 lg:flex-row lg:items-end lg:justify-between lg:pr-20">
        <Rise className="max-w-[40rem]">
          <p className="font-mono text-[11px] uppercase tracking-[0.18em] text-emerald-400">{t.hero.eyebrow}</p>
          <p className="mt-4 text-balance text-[1.75rem] font-semibold leading-[1.06] tracking-[-0.035em] text-zinc-50 sm:text-4xl lg:text-[2.6rem]">
            {t.hero.title}
          </p>
          <div className="mt-7 flex flex-wrap items-center gap-3">
            <Cta href="#intesc" icon={ArrowDownRight} primary>
              {t.hero.ctaProjects}
            </Cta>
            <Cta href={LINKS.cv[lang]} icon={DownloadSimple} download>
              {t.hero.ctaCv}
            </Cta>
          </div>
        </Rise>
        <Rise delay={0.15} className="hidden max-w-[36ch] font-mono text-[11px] uppercase leading-relaxed tracking-[0.16em] text-zinc-500 lg:block">
          <p>{t.contact.location}</p>
          <p className="mt-1">{J.intro.coords}</p>
          <p className="mt-6 flex items-center gap-3 text-zinc-300">
            <span className="scroll-cue relative block h-10 w-px overflow-hidden bg-white/15" aria-hidden="true" />
            {J.intro.scroll}
          </p>
        </Rise>
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------ 1 INTESC */

export function ZoneIntesc() {
  const { t } = useSite();
  const e = t.experience;
  const J = t.journey;
  return (
    <Zone id="intesc">
      <div className="lg:w-[60%]">
        <ZoneHead id="intesc" n={1} title={J.titles.intesc} />
        <Rise className="mt-6">
          <p className="text-balance text-2xl font-medium leading-snug tracking-[-0.02em] text-zinc-100 md:text-[1.75rem]">{e.title}</p>
          <div className="mt-5 flex flex-wrap items-center gap-x-4 gap-y-2 font-mono text-[12px] text-zinc-400">
            <span className="text-zinc-200">{e.role}</span>
            <span aria-hidden="true">·</span>
            <span>{e.company}</span>
            <span aria-hidden="true">·</span>
            <span>{e.period}</span>
          </div>
          <p className="mt-4 max-w-[60ch] text-pretty text-[15px] leading-relaxed text-zinc-300">{e.body}</p>
          <p className="mt-4 inline-flex items-center gap-2 rounded-md bg-emerald-400/10 px-2.5 py-1.5 font-mono text-[11px] uppercase tracking-[0.12em] text-emerald-300 ring-1 ring-inset ring-emerald-400/25">
            <span aria-hidden="true" className="size-1.5 bg-emerald-400" />
            {e.badge}
          </p>
          <div className="mt-4 flex flex-wrap gap-1.5">
            {e.stack.map((s) => (
              <span key={s} className={chip}>
                {s}
              </span>
            ))}
          </div>
        </Rise>
        <h3 className="sr-only">{J.metricsLabel}</h3>
        <ul className="mt-10 grid grid-cols-1 gap-3 sm:grid-cols-2">
          {e.metrics.map((m, i) => (
            <li key={m.label} className={i === 0 || i === e.metrics.length - 1 ? "sm:col-span-2" : ""}>
              <Drift d={0.25 + (i % 3) * 0.15}>
                <Rise delay={(i % 2) * 0.08} className="hud-panel h-full rounded-xl p-4 md:p-5">
                  <p className="flex items-center justify-between font-mono text-[10px] uppercase tracking-[0.18em] text-zinc-500">
                    <span>M{String(i + 1).padStart(2, "0")}</span>
                    {m.before && <span>{J.before} → {J.after}</span>}
                  </p>
                  <p className={`mt-2 flex flex-wrap items-baseline gap-x-3 font-mono tracking-[-0.04em] ${i === 0 ? "text-5xl md:text-6xl" : "text-3xl"}`}>
                    {m.before && (
                      <>
                        <span className="text-zinc-500 line-through decoration-1">{m.before}</span>
                        <span aria-hidden="true" className="text-base text-zinc-600">→</span>
                        <span className="sr-only">{e.to}</span>
                      </>
                    )}
                    <span className="text-emerald-400">{m.after}</span>
                  </p>
                  <p className="mt-2 text-pretty text-[13.5px] leading-snug text-zinc-300">{m.label}</p>
                </Rise>
              </Drift>
            </li>
          ))}
        </ul>
      </div>
    </Zone>
  );
}

/* ------------------------------------------------------------------ 2 applied AI */

function TicketBars() {
  return (
    <div className="mt-4 space-y-2 font-mono text-[11px] text-zinc-400" aria-hidden="true">
      {[
        ["smartticket", 0.85, "bg-emerald-400"],
        ["baseline", 0.14, "bg-zinc-600"],
      ].map(([name, v, c]) => (
        <div key={name as string} className="flex items-center gap-3">
          <span className="w-20 shrink-0">{name}</span>
          <span className="h-1.5 flex-1 bg-white/[0.06]">
            <span className={`block h-full ${c}`} style={{ width: `${(v as number) * 100}%` }} />
          </span>
          <span className="w-8 text-right text-zinc-300">{(v as number).toFixed(2)}</span>
        </div>
      ))}
    </div>
  );
}

function McpTools() {
  const { t } = useSite();
  return (
    <figure className="mt-4 rounded-lg bg-black/40 p-3 ring-1 ring-inset ring-white/10">
      <ul className="space-y-1 font-mono text-[12px] leading-relaxed">
        {MCP_TOOLS.map((tool) => (
          <li key={tool} className="flex items-center justify-between gap-3">
            <span className="truncate text-zinc-200">{tool}()</span>
            <span className="shrink-0 text-emerald-400/80">readOnly</span>
          </li>
        ))}
      </ul>
      <figcaption className="mt-2 text-[11px] text-zinc-500">{t.projects.codeCaption}</figcaption>
    </figure>
  );
}

export function ZoneAi() {
  const { t } = useSite();
  const J = t.journey;
  const p = useProjects();
  return (
    <Zone id="ai">
      <ZoneHead id="ai" n={2} title={J.titles.ai} lead={J.leads.ai} />
      <div className="mt-14 grid grid-cols-1 gap-5 md:grid-cols-2 lg:flex lg:justify-between lg:gap-0">
        <div className="flex flex-col gap-5 lg:w-[41%]">
          <Drift d={0.7}>
            <Rise>
              <Card p={p("plant-doctor-ai")} cluster="ai" slot={0} />
            </Rise>
          </Drift>
          <Drift d={0.4} className="lg:ml-[12%]">
            <Rise>
              <Card p={p("smartticket")} cluster="ai" slot={1} extra={<TicketBars />} />
            </Rise>
          </Drift>
        </div>
        <div className="flex flex-col gap-5 lg:mt-40 lg:w-[38%]">
          <Drift d={0.5}>
            <Rise>
              <Card p={p("ordercontext-mcp")} cluster="ai" slot={2} extra={<McpTools />} />
            </Rise>
          </Drift>
          <Drift d={0.85} className="lg:-ml-[10%]">
            <Rise>
              <Card p={p("n8n-ai-ticket-pipeline")} cluster="ai" slot={3} />
            </Rise>
          </Drift>
        </div>
      </div>
    </Zone>
  );
}

/* ------------------------------------------------------------------ 3 backend */

export function ZoneBackend() {
  const { t } = useSite();
  const J = t.journey;
  const p = useProjects();
  return (
    <Zone id="backend">
      <div className="lg:ml-auto lg:w-[62%] lg:text-right">
        <ZoneHead id="backend" n={3} title={J.titles.backend} right />
      </div>
      <p className="mt-5 max-w-[46ch] text-pretty text-lg leading-relaxed text-zinc-300 md:text-xl lg:ml-auto lg:text-right">{J.leads.backend}</p>
      <div className="mt-14 grid grid-cols-1 gap-5 md:grid-cols-2 lg:flex lg:justify-between lg:gap-0">
        <div className="flex flex-col gap-5 lg:mt-28 lg:w-[38%]">
          <Drift d={0.6}>
            <Rise>
              <Card p={p("qaflow-api")} cluster="backend" slot={0} />
            </Rise>
          </Drift>
          <Drift d={0.35} className="lg:ml-[14%]">
            <Rise>
              <Card p={p("bi-tienda")} cluster="backend" slot={1} />
            </Rise>
          </Drift>
        </div>
        <div className="flex flex-col gap-5 lg:w-[44%]">
          <Drift d={0.8}>
            <Rise>
              <Card p={p("stockpilot")} cluster="backend" slot={2} />
            </Rise>
          </Drift>
          <Drift d={0.45} className="lg:-ml-[16%] lg:mr-[16%]">
            <Rise>
              <Card p={p("spring-cloud-microservices")} cluster="backend" slot={3} />
            </Rise>
          </Drift>
          <Drift d={0.7} className="lg:ml-[10%]">
            <Rise>
              <Card p={p("mi-mascota-citas")} cluster="backend" slot={4} />
            </Rise>
          </Drift>
        </div>
      </div>
    </Zone>
  );
}

/* ------------------------------------------------------------------ 4 systems */

const SYSTEMS = ["zyra-compiler", "browsing-history-mirror", "datavault-android", "minijava-compiler", "inventrack", "qaflow-testing-portfolio", "kurocute"];

export function ZoneSystems() {
  const { t } = useSite();
  const J = t.journey;
  const p = useProjects();
  const zyra = p("zyra-compiler").image!;
  const vault = t.more.media[3];
  return (
    <Zone id="systems">
      <div className="relative lg:flex lg:items-start lg:justify-between">
        <div className="lg:w-[60%]">
          <ZoneHead id="systems" n={4} title={J.titles.systems} lead={J.leads.systems} />
          <Rise className="mt-12">
            <ol className="hud-panel divide-y divide-white/[0.07] rounded-xl">
              {SYSTEMS.map((repo, i) => {
                const k = J.keys[repo];
                return (
                  <li key={repo}>
                    <a
                      href={LINKS.repo(repo)}
                      target="_blank"
                      rel="noopener noreferrer"
                      aria-label={t.projects.repoAria(repo)}
                      onPointerEnter={(e) => {
                        const r = e.currentTarget.getBoundingClientRect();
                        window.dispatchEvent(new CustomEvent("latent:query", { detail: { cluster: "systems", slot: i, x: r.left + r.width / 2, y: r.top + r.height / 2 } }));
                      }}
                      onPointerLeave={() => window.dispatchEvent(new CustomEvent("latent:query", { detail: null }))}
                      className="group grid grid-cols-[2rem_1fr_auto] items-baseline gap-x-3 px-4 py-4 transition-colors duration-200 hover:bg-emerald-400/[0.05] md:grid-cols-[2.5rem_1fr_9rem_1.5rem] md:px-5"
                    >
                      <span className="font-mono text-[11px] text-zinc-600 group-hover:text-emerald-400">{String(i + 1).padStart(2, "0")}</span>
                      <span className="min-w-0">
                        <span className="block font-mono text-[14px] text-zinc-100">{repo}</span>
                        <span className="mt-1 block text-pretty text-[13.5px] leading-snug text-zinc-400">{p(repo).desc}</span>
                      </span>
                      <span className="text-right">
                        <span className="block font-mono text-[15px] text-emerald-400">{k.v}</span>
                        <span className="block font-mono text-[10px] uppercase tracking-[0.1em] text-zinc-500">{k.c}</span>
                      </span>
                      <ArrowUpRight size={14} aria-hidden="true" className="hidden text-zinc-500 transition-colors group-hover:text-emerald-400 md:block" />
                    </a>
                  </li>
                );
              })}
            </ol>
          </Rise>
        </div>
        <div className="pointer-events-none relative mt-10 hidden h-[560px] lg:mt-48 lg:block lg:w-[34%]">
          <Drift d={1} className="absolute right-0 top-0 w-[88%]">
            <figure className="glass-card overflow-hidden rounded-[14px]">
              <Image src={zyra.src} alt={zyra.alt} width={zyra.w} height={zyra.h} sizes="420px" className="w-full opacity-85" />
              <figcaption className="px-3 py-2 font-mono text-[10px] uppercase tracking-[0.14em] text-zinc-500">zyra-compiler · NASM x86-64</figcaption>
            </figure>
          </Drift>
          <Drift d={1.4} className="absolute bottom-0 left-[4%] w-[38%]">
            <figure className="glass-card overflow-hidden rounded-[18px]">
              <Image src={vault.src} alt={vault.alt} width={vault.w} height={vault.h} sizes="180px" className="w-full opacity-90" />
              <figcaption className="px-3 py-2 font-mono text-[10px] uppercase tracking-[0.14em] text-zinc-500">datavault-android</figcaption>
            </figure>
          </Drift>
        </div>
      </div>
    </Zone>
  );
}

/* ------------------------------------------------------------------ 5 stack */

// Skill modules balanced over 3 columns (group indices; stacked in this order on mobile).
const MODULE_COLUMNS = [
  [0, 2, 6],
  [1, 5, 3],
  [4, 7, 8],
];

export function ZoneStack({ marquee, logos }: { marquee: ReactNode; logos: Record<string, ReactNode> }) {
  const { t } = useSite();
  const J = t.journey;
  const e = t.education;
  return (
    <Zone id="stack">
      <ZoneHead id="stack" n={5} title={J.titles.stack} lead={t.skills.title} />
      <Rise className="relative -mx-5 mt-12 md:-mx-10 lg:-mr-36">
        <p className="sr-only">{J.stackBand}</p>
        <div className="border-y border-white/[0.08] bg-zinc-950/50 backdrop-blur-sm">{marquee}</div>
      </Rise>
      <div className="mt-12 grid grid-cols-1 gap-3 lg:grid-cols-3">
        {MODULE_COLUMNS.map((col, ci) => (
          <ul key={ci} className="flex flex-col gap-3">
            {col.map((gi) => {
              const g = t.skills.groups[gi];
              return (
          <li key={g.id}>
            <Rise delay={ci * 0.06} className="hud-panel h-full rounded-xl p-4 md:p-5">
              <h3 className="flex items-center justify-between font-mono text-[11px] uppercase tracking-[0.16em]">
                <span className="text-zinc-200">
                  <span className="text-emerald-400">MOD {String(gi + 1).padStart(2, "0")}</span> · {g.name}
                </span>
                <span className="text-zinc-600">{String(g.items.length).padStart(2, "0")}</span>
              </h3>
              <ul className="mt-4 flex flex-wrap gap-1.5">
                {g.items.map((it) => (
                  <li
                    key={it}
                    className="inline-flex items-center gap-1.5 rounded-md bg-white/[0.035] px-2 py-1.5 text-[12.5px] leading-none text-zinc-300 ring-1 ring-inset ring-white/[0.08] transition-colors duration-200 hover:text-emerald-300 hover:ring-emerald-400/30"
                  >
                    {logos[it] ? <span className="text-zinc-400">{logos[it]}</span> : null}
                    {it}
                  </li>
                ))}
              </ul>
            </Rise>
          </li>
              );
            })}
          </ul>
        ))}
      </div>
      <div className="mt-3 grid grid-cols-1 gap-3 md:grid-cols-3">
        <Rise className="hud-panel rounded-xl p-4 md:p-5">
          <h3 className="font-mono text-[11px] uppercase tracking-[0.16em] text-zinc-500">{e.title}</h3>
          <p className="mt-3 text-lg font-medium leading-snug tracking-[-0.01em] text-zinc-100">{e.degree}</p>
          <p className="mt-1 text-[13.5px] text-zinc-400">{e.school}</p>
          <p className="mt-2 font-mono text-[12px] text-emerald-400">{e.grad}</p>
        </Rise>
        <Rise delay={0.06} className="hud-panel rounded-xl p-4 md:p-5">
          <h3 className="font-mono text-[11px] uppercase tracking-[0.16em] text-zinc-500">{e.certTitle}</h3>
          <p className="mt-3 text-pretty text-[14.5px] leading-relaxed text-zinc-200">{e.cert}</p>
        </Rise>
        <Rise delay={0.12} className="hud-panel rounded-xl p-4 md:p-5">
          <h3 className="font-mono text-[11px] uppercase tracking-[0.16em] text-zinc-500">{e.langTitle}</h3>
          <p className="mt-3 text-[14.5px] leading-relaxed text-zinc-200">{e.langs}</p>
        </Rise>
      </div>
    </Zone>
  );
}

/* ------------------------------------------------------------------ contact */

export function ZoneContact() {
  const { t, lang } = useSite();
  const J = t.journey;
  const c = t.contact;
  const row = "group flex items-center gap-4 rounded-lg px-3 py-3 transition-colors duration-200 hover:bg-white/[0.04] md:px-4";
  const idx = "w-7 shrink-0 font-mono text-[12px] text-zinc-600 group-hover:text-emerald-400";
  return (
    <Zone id="contact" className="zone-last">
      <div className="max-w-3xl">
        <ZoneHead id="contact" title={J.titles.contact} />
        <Rise className="mt-10">
          <div className="hud-panel overflow-hidden rounded-xl">
            <div className="flex items-center justify-between border-b border-white/[0.08] px-4 py-2.5 font-mono text-[11px] text-zinc-500">
              <span>contact · bm25sh</span>
              <span className="flex items-center gap-2 text-emerald-400">
                <span className="hud-blink size-1.5 bg-emerald-400" aria-hidden="true" />
                {J.contact.status}
              </span>
            </div>
            <div className="p-4 md:p-6">
              <p className="font-mono text-[13px]">
                <span className="text-emerald-400">{J.contact.prompt}</span> <span className="text-zinc-100">{J.contact.cmd}</span>
                <span className="term-caret ml-1 inline-block h-[1.05em] w-[0.55em] translate-y-[3px] bg-zinc-300" aria-hidden="true" />
              </p>
              <p className="mt-5 text-balance text-3xl font-semibold leading-[1.08] tracking-[-0.03em] text-zinc-50 md:text-[2.6rem]">{c.title}</p>
              <p className="mt-3 text-pretty text-[15px] leading-relaxed text-zinc-400">
                {c.body} <span className="font-mono text-[12px] text-zinc-500">· {c.location}</span>
              </p>
              <div className="mt-7">
                <Cta href={`mailto:${LINKS.email}`} icon={PaperPlaneTilt} primary>
                  {c.cta}
                </Cta>
                <p className="mt-3 font-mono text-[12px] text-zinc-500">{LINKS.email}</p>
              </div>
              <ul className="mt-7 border-t border-white/[0.08] pt-3 font-mono text-[13px]">
                <li>
                  <a href={LINKS.cv[lang]} download className={row}>
                    <span className={idx}>[1]</span>
                    <DownloadSimple size={16} className="text-zinc-400" aria-hidden="true" />
                    <span className="flex-1 text-zinc-100">{c.cv}</span>
                    <span className="text-zinc-500">PDF · {lang.toUpperCase()}</span>
                  </a>
                </li>
                <li>
                  <a href={LINKS.github} target="_blank" rel="noopener noreferrer" className={row}>
                    <span className={idx}>[2]</span>
                    <GithubLogo size={16} className="text-zinc-400" aria-hidden="true" />
                    <span className="flex-1 text-zinc-100">GitHub</span>
                    <span className="hidden truncate text-zinc-500 sm:inline">github.com/JovanySk</span>
                  </a>
                </li>
                <li>
                  <a href={LINKS.linkedin} target="_blank" rel="noopener noreferrer" className={row}>
                    <span className={idx}>[3]</span>
                    <LinkedinLogo size={16} className="text-zinc-400" aria-hidden="true" />
                    <span className="flex-1 text-zinc-100">LinkedIn</span>
                    <span className="hidden truncate text-zinc-500 sm:inline">in/jovany-morales</span>
                  </a>
                </li>
                <li>
                  <a href="/os/" className={row}>
                    <span className={idx}>[4]</span>
                    <AppWindow size={16} className="text-emerald-400" aria-hidden="true" />
                    <span className="flex-1 text-zinc-100">{J.contact.os}</span>
                    <span className="hidden text-zinc-500 sm:inline">{J.contact.osHint}</span>
                  </a>
                </li>
              </ul>
            </div>
          </div>
        </Rise>
        <footer className="mt-10 flex flex-col gap-3 font-mono text-[11px] uppercase tracking-[0.14em] text-zinc-600 sm:flex-row sm:items-center sm:justify-between">
          <p>{t.footer.rights}</p>
          <a href="#top" className="text-zinc-500 transition-colors hover:text-emerald-400">
            ↑ {J.contact.top}
          </a>
        </footer>
      </div>
    </Zone>
  );
}

export { CLUSTER_IDS };
