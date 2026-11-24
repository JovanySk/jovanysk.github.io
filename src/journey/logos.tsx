// Server component: technology logos from the `simple-icons` package, rendered as
// inline SVG paths at build time (zero client JS). Monochrome, accent on hover.

import type { ReactNode } from "react";
import {
  siAstro,
  siBootstrap,
  siClaude,
  siCypress,
  siDjango,
  siDocker,
  siDotnet,
  siFastapi,
  siGithubactions,
  siGooglecloud,
  siGooglegemini,
  siHtml5,
  siJetpackcompose,
  siJsonwebtokens,
  siJunit5,
  siKotlin,
  siKubernetes,
  siLaravel,
  siLinux,
  siModelcontextprotocol,
  siMongodb,
  siMysql,
  siN8n,
  siNextdotjs,
  siNodedotjs,
  siOllama,
  siOpenjdk,
  siPandas,
  siPhp,
  siPostgresql,
  siPostman,
  siPytest,
  siPython,
  siRailway,
  siReact,
  siScikitlearn,
  siSpringboot,
  siSqlite,
  siTailwindcss,
  siThreedotjs,
  siTypescript,
  siVitest,
} from "simple-icons";
import { dict } from "@/i18n";

type SI = { title: string; slug: string; path: string };

// Every path ships once, in a sprite; logos reference it with <use>.
function Glyph({ icon, className = "size-4" }: { icon: SI; className?: string }) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false" className={`shrink-0 fill-current ${className}`}>
      <use href={`#si-${icon.slug}`} />
    </svg>
  );
}

// One band, every logo once (label overrides where the brand title differs from the tech name).
const BAND: [SI, string?][] = [
  [siPython], [siOpenjdk, "Java"], [siTypescript], [siReact], [siNextdotjs], [siDjango], [siFastapi], [siSpringboot],
  [siDotnet, "ASP.NET Core"], [siNodedotjs], [siLaravel], [siKotlin], [siJetpackcompose], [siPostgresql], [siMysql],
  [siSqlite], [siMongodb], [siDocker], [siKubernetes], [siGithubactions], [siGooglecloud], [siLinux], [siRailway],
  [siOllama], [siClaude], [siGooglegemini], [siModelcontextprotocol, "MCP"], [siScikitlearn], [siPandas], [siN8n],
  [siPytest], [siJunit5], [siVitest], [siCypress], [siPostman], [siTailwindcss], [siAstro], [siThreedotjs],
];

export function LogoSprite() {
  const all = new Map<string, SI>();
  BAND.forEach(([ic]) => all.set(ic.slug, ic));
  BY_PREFIX.forEach(([, ics]) => ics.forEach((ic) => all.set(ic.slug, ic)));
  return (
    <svg aria-hidden="true" width="0" height="0" className="absolute">
      <defs>
        {[...all.values()].map((ic) => (
          <symbol key={ic.slug} id={`si-${ic.slug}`} viewBox="0 0 24 24">
            <path d={ic.path} />
          </symbol>
        ))}
      </defs>
    </svg>
  );
}

export function LogoMarquee() {
  const row = (hidden: boolean) => (
    <ul className="marquee-row flex shrink-0 items-center gap-10 pr-10" aria-hidden={hidden || undefined}>
      {BAND.map(([icon, label]) => (
        <li key={icon.title} className="flex items-center gap-2.5 whitespace-nowrap text-zinc-500 transition-colors duration-300 hover:text-emerald-400">
          <Glyph icon={icon} className="size-5" />
          <span className="font-mono text-[12px] tracking-wide">{label ?? icon.title}</span>
        </li>
      ))}
    </ul>
  );
  return (
    <div className="marquee group relative flex overflow-hidden py-5">
      {row(false)}
      {row(true)}
    </div>
  );
}

// Skill item (any language) -> logo(s). Items without a brand logo get a mono monogram.
const BY_PREFIX: [RegExp, SI[]][] = [
  [/^LLMs/, [siClaude, siGooglegemini]],
  [/^Ollama/, [siOllama]],
  [/^MCP/, [siModelcontextprotocol]],
  [/^scikit/, [siScikitlearn]],
  [/^pandas/, [siPandas]],
  [/^React/, [siReact]],
  [/^Next/, [siNextdotjs]],
  [/^TypeScript/, [siTypescript]],
  [/^Astro/, [siAstro]],
  [/^Tailwind/, [siTailwindcss]],
  [/^Bootstrap/, [siBootstrap]],
  [/^HTML/, [siHtml5]],
  [/^Three/, [siThreedotjs]],
  [/^Python \(/, [siDjango, siFastapi]],
  [/^Python$/, [siPython]],
  [/^Java \(/, [siSpringboot]],
  [/^Java$/, [siOpenjdk]],
  [/^C#/, [siDotnet]],
  [/^Node/, [siNodedotjs]],
  [/^PHP\/Laravel/, [siLaravel]],
  [/^PHP$/, [siPhp]],
  [/^JWT/, [siJsonwebtokens]],
  [/^Kotlin/, [siKotlin]],
  [/^Jetpack/, [siJetpackcompose]],
  [/^PostgreSQL/, [siPostgresql]],
  [/^MySQL/, [siMysql]],
  [/^SQLite/, [siSqlite]],
  [/^MongoDB/, [siMongodb]],
  [/^Google Cloud/, [siGooglecloud]],
  [/^Docker/, [siDocker]],
  [/^Kubernetes/, [siKubernetes]],
  [/^GitHub Actions/, [siGithubactions]],
  [/^Linux/, [siLinux]],
  [/^Railway/, [siRailway]],
  [/^n8n/, [siN8n]],
  [/^JUnit/, [siJunit5]],
  [/^pytest/, [siPytest]],
  [/^Vitest/, [siVitest]],
  [/^Cypress/, [siCypress]],
  [/^Postman/, [siPostman]],
];

/** Map of every skill item string (ES and EN) to its logo node, built on the server. */
export function skillLogos(): Record<string, ReactNode> {
  const out: Record<string, ReactNode> = {};
  for (const lang of ["es", "en"] as const) {
    for (const g of dict[lang].skills.groups) {
      for (const item of g.items) {
        if (out[item]) continue;
        const hit = BY_PREFIX.find(([re]) => re.test(item));
        if (hit) {
          out[item] = (
            <span className="flex items-center gap-1">
              {hit[1].map((ic) => (
                <Glyph key={ic.title} icon={ic} className="size-[15px]" />
              ))}
            </span>
          );
        }
      }
    }
  }
  return out;
}
