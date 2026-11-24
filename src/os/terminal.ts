// Terminal command interpreter for JovanyOS. Pure: returns output + an effect to apply.

import { dict, type Dict } from "../i18n";
import { answer, normalize, type Lang } from "./bm25";

export type Effect =
  | { type: "clear" }
  | { type: "open"; kind: "finder" | "terminal" | "experience" | "contact" }
  | { type: "project"; repo: string }
  | { type: "cv" }
  | { type: "lang"; lang: Lang }
  | { type: "theme"; theme: "dark" | "light" }
  | { type: "hire" };

export type Result = { lines: string[]; sources?: string[]; effect?: Effect };

export const COMMANDS = [
  "help", "ayuda", "projects", "proyectos", "open", "cv", "contact", "contacto",
  "clear", "whoami", "lang", "theme", "sudo",
];

const APP_ALIASES: Record<string, "finder" | "terminal" | "experience" | "contact"> = {
  finder: "finder", proyectos: "finder", projects: "finder",
  terminal: "terminal",
  experiencia: "experience", experience: "experience", intesc: "experience",
  contacto: "contact", contact: "contact",
};

export function findRepo(query: string, repos: string[]): string | null {
  const q = normalize(query).replace(/\s+/g, "-");
  if (!q) return null;
  return repos.find((r) => r === q) ?? repos.find((r) => r.startsWith(q)) ?? repos.find((r) => r.includes(q)) ?? null;
}

export function complete(input: string, repos: string[]): string[] {
  const raw = input.replace(/^\s+/, "");
  const lower = normalize(raw);
  if (lower.startsWith("open ")) {
    const rest = lower.slice(5);
    const targets = [...repos, ...Object.keys(APP_ALIASES)];
    return targets.filter((r) => r.startsWith(rest)).map((r) => `open ${r}`);
  }
  if (!lower || lower.includes(" ")) return [];
  return COMMANDS.filter((c) => c.startsWith(lower));
}

export function run(input: string, ctx: { lang: Lang; t: Dict; repos: string[] }): Result {
  const T = ctx.t.os.term;
  const raw = input.trim();
  if (!raw) return { lines: [] };
  const lower = normalize(raw);
  const [cmd, ...args] = lower.split(/\s+/);
  const arg = args.join(" ");

  switch (cmd) {
    case "help":
    case "ayuda":
    case "?":
      return { lines: T.help };
    case "projects":
    case "proyectos":
    case "ls":
      if (!arg) return { lines: [T.projectsHeader, ...ctx.repos.map((r) => `  ${r}`)] };
      break;
    case "open":
    case "abrir": {
      if (!arg) return { lines: [T.unknownProject] };
      const app = APP_ALIASES[arg];
      if (app) return { lines: [`${T.opening} ${arg}`], effect: { type: "open", kind: app } };
      if (arg === "cv") return { lines: [T.cv], effect: { type: "cv" } };
      const repo = findRepo(arg, ctx.repos);
      return repo ? { lines: [`${T.opening} ${repo}`], effect: { type: "project", repo } } : { lines: [T.unknownProject] };
    }
    case "cv":
      if (!arg) return { lines: [T.cv], effect: { type: "cv" } };
      break;
    case "contact":
    case "contacto":
      if (!arg) return { lines: T.contact, effect: { type: "open", kind: "contact" } };
      break;
    case "clear":
    case "cls":
      return { lines: [], effect: { type: "clear" } };
    case "whoami":
      return { lines: [T.whoami] };
    case "lang":
      if (arg === "es" || arg === "en") {
        return { lines: [dict[arg].os.term.langSet], effect: { type: "lang", lang: arg } };
      }
      return { lines: [T.usageLang] };
    case "theme":
      if (arg === "dark" || arg === "light") return { lines: [T.themeSet], effect: { type: "theme", theme: arg } };
      return { lines: [T.usageTheme] };
    case "sudo":
      if (/^hire\s+(jovany|jovanysk|me)$/.test(arg)) return { lines: T.hire, effect: { type: "hire" } };
      return { lines: [T.sudoDenied] };
  }

  // Anything else: retrieval over the knowledge base.
  const a = answer(raw, ctx.lang);
  if (!a.found) return { lines: [T.notFound] };
  return { lines: a.text, sources: a.sources };
}
