import {
  ChartBar,
  ClockCounterClockwise,
  Code,
  Cpu,
  DeviceMobile,
  Factory,
  FlowArrow,
  Package,
  PawPrint,
  Plant,
  Plugs,
  Storefront,
  TestTube,
  Ticket,
  TreeStructure,
  Warehouse,
  type Icon,
} from "@phosphor-icons/react";
import type { Dict, MediaShot } from "../i18n";

export type OsProject = {
  repo: string;
  desc: string;
  facts: string[];
  stack: string[];
  metric?: { value: string; caption: string };
  images: MediaShot[];
  featured: boolean;
};

export const PROJECT_ICONS: Record<string, Icon> = {
  "ordercontext-mcp": Plugs,
  smartticket: Ticket,
  "plant-doctor-ai": Plant,
  "bi-tienda": ChartBar,
  "n8n-ai-ticket-pipeline": FlowArrow,
  "browsing-history-mirror": ClockCounterClockwise,
  "qaflow-api": Factory,
  "zyra-compiler": Code,
  stockpilot: Warehouse,
  "spring-cloud-microservices": TreeStructure,
  "mi-mascota-citas": PawPrint,
  "datavault-android": DeviceMobile,
  inventrack: Package,
  "qaflow-testing-portfolio": TestTube,
  "minijava-compiler": Cpu,
  kurocute: Storefront,
};

// indices into t.more.media
const MORE_MEDIA: Record<string, number[]> = {
  stockpilot: [0],
  "mi-mascota-citas": [1],
  "datavault-android": [2, 3],
  "spring-cloud-microservices": [4, 5],
  "minijava-compiler": [6, 7],
  inventrack: [8],
};

export function buildProjects(t: Dict): OsProject[] {
  const featured: OsProject[] = t.projects.items.map((p) => {
    const images: MediaShot[] = p.image ? [p.image] : [];
    if (p.extra) images.push(p.extra);
    if (p.repo === "bi-tienda")
      images.push({ src: "/shots/bi-overview.webp", w: 1200, h: 750, alt: t.hero.shotAlt });
    return { repo: p.repo, desc: p.desc, facts: p.facts, stack: p.stack, metric: p.metric, images, featured: true };
  });
  const more: OsProject[] = t.more.items.map((p) => ({
    repo: p.repo,
    desc: p.desc,
    facts: [],
    stack: [],
    images: (MORE_MEDIA[p.repo] ?? []).map((i) => t.more.media[i]),
    featured: false,
  }));
  return [...featured, ...more];
}
