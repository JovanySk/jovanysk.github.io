"use client";

import { useState } from "react";
import Image from "next/image";
import { ArrowRight, Check, DownloadSimple, GithubLogo, LinkedinLogo } from "@phosphor-icons/react";
import { LINKS } from "../i18n";
import { useSite } from "../components/providers";
import { Cta, chip } from "../components/ui";
import { PROJECT_ICONS, type OsProject } from "./projects-data";

/* ---------------- Finder ---------------- */
export function FinderApp({ projects, onOpen }: { projects: OsProject[]; onOpen: (repo: string) => void }) {
  const { t } = useSite();
  const [selected, setSelected] = useState<string | null>(null);
  const groups = [
    { label: t.os.featured, items: projects.filter((p) => p.featured) },
    { label: t.os.more, items: projects.filter((p) => !p.featured) },
  ];
  return (
    <div className="p-5">
      {groups.map((g) => (
        <section key={g.label} className="mb-6 last:mb-2">
          <h3 className="mb-3 px-1 text-xs font-medium text-muted">{g.label}</h3>
          <ul className="grid grid-cols-4 gap-1">
            {g.items.map((p, i) => {
              const IconCmp = PROJECT_ICONS[p.repo];
              const active = selected === p.repo;
              return (
                <li key={p.repo}>
                  <button
                    type="button"
                    data-autofocus={g.label === t.os.featured && i === 0 ? "" : undefined}
                    onClick={() => setSelected(p.repo)}
                    onDoubleClick={() => onOpen(p.repo)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        onOpen(p.repo);
                      }
                    }}
                    className={`flex w-full flex-col items-center gap-2 rounded-[1.1rem] px-2 py-3 text-center transition-colors focus-visible:rounded-[1.1rem] ${
                      active ? "bg-accent-soft ring-1 ring-inset ring-accent-line" : "hover:bg-raised"
                    }`}
                  >
                    <span className="flex size-12 items-center justify-center rounded-[0.9rem] bg-raised text-fg shadow-[inset_0_1px_0_var(--highlight),0_0_0_1px_var(--line)]">
                      <IconCmp size={22} weight="regular" className={active ? "text-accent" : ""} aria-hidden="true" />
                    </span>
                    <span className="line-clamp-2 break-all font-mono text-[11px] leading-tight text-fg">{p.repo}</span>
                  </button>
                </li>
              );
            })}
          </ul>
        </section>
      ))}
      <p className="px-1 text-xs text-muted">{t.os.finderHint}</p>
    </div>
  );
}

/* ---------------- Project ---------------- */
export function ProjectApp({ p }: { p: OsProject }) {
  const { t } = useSite();
  const [main, ...rest] = p.images;
  return (
    <div className="p-5">
      {main && (
        <div className={`overflow-hidden rounded-[1.1rem] ring-1 ring-line ${rest.length && rest[0].phone ? "grid grid-cols-2 gap-2 ring-0" : ""}`}>
          {[main, ...(rest.length && rest[0].phone ? rest : [])].map((img) => (
            <Image
              key={img.src}
              src={img.src}
              alt={img.alt}
              width={img.w}
              height={img.h}
              className={`h-auto w-full ${img.phone ? "max-h-[360px] rounded-[1.1rem] object-cover object-top ring-1 ring-line" : ""}`}
            />
          ))}
        </div>
      )}
      {rest.length > 0 && !rest[0].phone && (
        <div className="mt-2 grid grid-cols-2 gap-2">
          {rest.map((img) => (
            <Image key={img.src} src={img.src} alt={img.alt} width={img.w} height={img.h} className="h-auto w-full rounded-[1.1rem] ring-1 ring-line" />
          ))}
        </div>
      )}
      <div className="mt-5 grid grid-cols-1 gap-5 sm:grid-cols-[1fr_auto]">
        <div>
          <h2 className="text-xl font-semibold tracking-[-0.03em] text-fg">{p.repo}</h2>
          <p className="mt-2 text-pretty text-sm leading-relaxed text-muted">{p.desc}</p>
        </div>
        {p.metric && (
          <div className="sm:text-right">
            <p className="font-mono text-4xl font-medium leading-none tracking-[-0.04em] text-accent">{p.metric.value}</p>
            <p className="mt-1.5 max-w-[22ch] text-xs text-muted sm:ml-auto">{p.metric.caption}</p>
          </div>
        )}
      </div>
      {p.facts.length > 0 && (
        <>
          <h3 className="mt-5 text-xs font-medium text-muted">{t.os.keyFacts}</h3>
          <ul className="mt-2 space-y-1.5">
            {p.facts.map((f) => (
              <li key={f} className="flex gap-2 font-mono text-[12.5px] leading-snug text-fg">
                <Check size={13} weight="regular" className="mt-[2px] shrink-0 text-accent" aria-hidden="true" />
                {f}
              </li>
            ))}
          </ul>
        </>
      )}
      {p.stack.length > 0 && (
        <div className="mt-4 flex flex-wrap gap-1.5" aria-label={t.os.stack}>
          {p.stack.map((s) => (
            <span key={s} className={chip}>
              {s}
            </span>
          ))}
        </div>
      )}
      <div className="mt-6">
        <Cta href={LINKS.repo(p.repo)} external icon={GithubLogo}>
          {t.os.viewOnGithub}
        </Cta>
      </div>
    </div>
  );
}

/* ---------------- Experience ---------------- */
export function ExperienceApp() {
  const { t } = useSite();
  const e = t.experience;
  return (
    <div className="p-6">
      <p className="font-mono text-xs text-muted">{e.period}</p>
      <h2 className="mt-2 text-balance text-xl font-semibold leading-snug tracking-[-0.03em] text-fg">{e.title}</h2>
      <p className="mt-2 text-sm text-fg">
        {e.role}, <span className="text-muted">{e.company}</span>
      </p>
      <p className="mt-3 text-pretty text-sm leading-relaxed text-muted">{e.body}</p>
      <span className="mt-4 inline-flex rounded-full bg-accent-soft px-3 py-1 text-xs font-medium text-accent ring-1 ring-inset ring-accent-line">
        {e.badge}
      </span>
      <ul className="mt-5 grid grid-cols-2 gap-2">
        {e.metrics.map((m, i) => (
          <li key={i} className={`rounded-[1.1rem] bg-raised p-4 ring-1 ring-inset ring-line ${i === 0 ? "col-span-2" : ""}`}>
            <p className="flex flex-wrap items-center gap-2 font-mono text-xl font-medium tracking-[-0.03em]">
              {m.before && (
                <>
                  <span className="text-muted">{m.before}</span>
                  <ArrowRight size={14} className="text-muted" aria-hidden="true" />
                  <span className="sr-only">{e.to}</span>
                </>
              )}
              <span className={i === 0 ? "text-accent" : "text-fg"}>{m.after}</span>
            </p>
            <p className="mt-1.5 text-xs leading-relaxed text-muted">{m.label}</p>
          </li>
        ))}
      </ul>
      <div className="mt-4 flex flex-wrap gap-1.5">
        {e.stack.map((s) => (
          <span key={s} className={chip}>
            {s}
          </span>
        ))}
      </div>
    </div>
  );
}

/* ---------------- Contact ---------------- */
export function ContactApp({ note }: { note?: string }) {
  const { t, lang } = useSite();
  const c = t.contact;
  return (
    <div className="p-6">
      {note === "hire" && (
        <p className="mb-5 rounded-[1.1rem] bg-accent-soft px-4 py-3 text-sm text-fg ring-1 ring-inset ring-accent-line">{t.os.hireNote}</p>
      )}
      <h2 className="text-balance text-2xl font-semibold leading-tight tracking-[-0.03em] text-fg">{c.title}</h2>
      <p className="mt-2 text-sm leading-relaxed text-muted">{c.body}</p>
      <div className="mt-5 flex flex-wrap gap-2">
        <span data-autofocus="">
          <Cta href={`mailto:${LINKS.email}`}>{c.cta}</Cta>
        </span>
        <Cta href={LINKS.cv[lang]} variant="ghost" icon={DownloadSimple} download>
          {c.cv}
        </Cta>
      </div>
      <div className="mt-5 flex items-center gap-4 text-sm">
        <a className="inline-flex items-center gap-1.5 text-muted hover:text-fg" href={LINKS.github} target="_blank" rel="noopener noreferrer">
          <GithubLogo size={16} aria-hidden="true" /> GitHub
        </a>
        <a className="inline-flex items-center gap-1.5 text-muted hover:text-fg" href={LINKS.linkedin} target="_blank" rel="noopener noreferrer">
          <LinkedinLogo size={16} aria-hidden="true" /> LinkedIn
        </a>
        <span className="font-mono text-xs text-muted">{LINKS.email}</span>
      </div>
    </div>
  );
}
