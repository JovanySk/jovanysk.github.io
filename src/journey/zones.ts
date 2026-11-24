// Pure logic for the "latent space" journey: zone list, 3D layout of the clusters,
// camera stations and the scroll -> camera mapping. No DOM, no three.js: unit tested.

export const ZONE_IDS = ["top", "intesc", "ai", "backend", "systems", "stack", "contact"] as const;
export type ZoneId = (typeof ZONE_IDS)[number];

/** The 5 clusters shown in the minimap (numbered 1..5 in the HUD). */
export const CLUSTER_IDS = ["intesc", "ai", "backend", "systems", "stack"] as const;
export type ClusterId = (typeof CLUSTER_IDS)[number];

export type Vec3 = [number, number, number];
export type Shape = "ball" | "clumps" | "ring" | "disk";

export type ClusterDef = {
  center: Vec3;
  shape: Shape;
  /** sub-clusters, one per project card (hover target of the query ray) */
  slots: number;
  /** share of the particles that end up here */
  weight: number;
  /** palette: [base, sparkle] as hex; only emerald, zinc and white */
  tint: [string, string];
  /** probability of a point taking the sparkle colour */
  sparkle: number;
};

export const CLUSTERS: Record<ClusterId, ClusterDef> = {
  intesc: { center: [5, 0.5, -20], shape: "ball", slots: 1, weight: 0.22, tint: ["#10b981", "#6ee7b7"], sparkle: 0.18 },
  ai: { center: [-6, 2, -40], shape: "clumps", slots: 4, weight: 0.2, tint: ["#e4e4e7", "#34d399"], sparkle: 0.3 },
  backend: { center: [6, -1.5, -60], shape: "clumps", slots: 5, weight: 0.2, tint: ["#d4d4d8", "#10b981"], sparkle: 0.08 },
  systems: { center: [-5, 1.5, -80], shape: "ring", slots: 7, weight: 0.2, tint: ["#a1a1aa", "#fafafa"], sparkle: 0.12 },
  stack: { center: [0, -2, -100], shape: "disk", slots: 1, weight: 0.18, tint: ["#fafafa", "#10b981"], sparkle: 0.1 },
};

export type Station = { cam: Vec3; look: Vec3 };

const add = (a: Vec3, b: Vec3): Vec3 => [a[0] + b[0], a[1] + b[1], a[2] + b[2]];

/**
 * Camera rest pose for every zone. `side` pushes the cluster to one side of the
 * screen so the HTML panel on the other side stays readable. On narrow screens
 * (aspect < 1) the cluster is centred and the camera backs off a little.
 */
export function stations(aspect: number): Station[] {
  const narrow = aspect < 1;
  const k = narrow ? 0 : Math.min(1, aspect / 1.6);
  const dist = narrow ? 13 : 10;
  const pose = (c: Vec3, side: number, lift = 0): Station => {
    const look = add(c, [-side * 3.4 * k, lift, 0]);
    return { look, cam: add(look, [side * 1.6 * k, 1.1, dist]) };
  };
  const C = CLUSTERS;
  return [
    { cam: [0, 0, narrow ? 15 : 12.5], look: [0, 0, 0] },
    pose(C.intesc.center, 1), // cluster right, metrics left
    pose(C.ai.center, 0, 0.4), // cards around a centred cluster
    pose(C.backend.center, 0, 0.4),
    pose(C.systems.center, 1), // cluster right, list left
    pose(C.stack.center, 0, -1.2), // galaxy below the skill modules
    // exit: pull back above the whole path so every cluster is in frame
    { cam: narrow ? [22, 26, 4] : [26, 12, -2], look: narrow ? [0, -2, -60] : [-21, -4, -62] },
  ];
}

/** Scroll window (in px) where the camera rests at a zone. */
export type Hold = [number, number];

/**
 * Builds one hold window per section: the camera arrives slightly before the
 * section top reaches the viewport top and stays until its bottom leaves.
 */
export function buildHolds(tops: number[], heights: number[], vh: number, maxScroll: number): Hold[] {
  const n = tops.length;
  const holds: Hold[] = [];
  let prev = 0;
  for (let i = 0; i < n; i++) {
    let a = i === 0 ? 0 : tops[i] - vh * 0.25;
    let b = i === 0 ? 0 : tops[i] + heights[i] - vh * 0.9;
    if (i === n - 1) b = maxScroll;
    a = Math.min(Math.max(a, prev), maxScroll);
    b = Math.min(Math.max(b, a), maxScroll);
    if (i === n - 1) a = Math.min(a, b);
    holds.push([a, b]);
    prev = b;
  }
  return holds;
}

const smooth = (x: number) => x * x * (3 - 2 * x);
export const clamp01 = (x: number) => Math.min(1, Math.max(0, x));

/**
 * Maps a scroll position to the camera path parameter u in [0, 1].
 * Inside a hold window u sits exactly on that station (i / (n - 1));
 * between windows it eases from one station to the next.
 */
export function scrollToPath(y: number, holds: Hold[]): number {
  const n = holds.length;
  if (n < 2) return 0;
  for (let i = 0; i < n; i++) {
    const [a, b] = holds[i];
    if (y <= b) {
      if (y >= a || i === 0) return i / (n - 1);
      const from = holds[i - 1][1];
      const f = a > from ? (y - from) / (a - from) : 1;
      return (i - 1 + smooth(clamp01(f))) / (n - 1);
    }
  }
  return 1;
}

/** Index of the zone that owns the viewport: the last section whose top passed 45% of the viewport. */
export function activeZone(y: number, vh: number, tops: number[]): number {
  let idx = 0;
  for (let i = 0; i < tops.length; i++) if (tops[i] <= y + vh * 0.45) idx = i;
  return idx;
}

/** Next zone index for keyboard navigation, clamped to the list. */
export function stepZone(current: number, dir: 1 | -1, count: number): number {
  return Math.min(count - 1, Math.max(0, current + dir));
}

/** Where to scroll to "land" on a zone: the start of its hold window. */
export function landingScroll(index: number, holds: Hold[], tops: number[]): number {
  if (index === 0) return 0;
  return Math.max(holds[index][0], tops[index] - 8);
}

/** Dispersal of the name particles: 0 = letters, 1 = clusters. */
export function morphAt(y: number, vh: number): number {
  return clamp01(y / (vh * 0.95));
}

/** HUD label: "ZONA 2/5 · IA APLICADA" for clusters, plain names for the ends. */
export function hudLabel(
  index: number,
  names: { zone: string; origin: string; exit: string },
  zoneNames: Record<Exclude<ZoneId, "top">, string>,
): string {
  const id = ZONE_IDS[index];
  if (id === "top") return `00 · ${names.origin}`;
  if (id === "contact") return `${names.exit} · ${zoneNames.contact}`;
  const n = CLUSTER_IDS.indexOf(id as ClusterId) + 1;
  return `${names.zone} ${n}/${CLUSTER_IDS.length} · ${zoneNames[id]}`;
}

/** Top-down minimap coordinates (0..1) of each cluster: x from world x, y from world z. */
export function minimapPoints(): { id: ClusterId; x: number; y: number }[] {
  const pts = CLUSTER_IDS.map((id) => ({ id, x: CLUSTERS[id].center[0], z: CLUSTERS[id].center[2] }));
  const xs = pts.map((p) => p.x);
  const zs = pts.map((p) => p.z);
  const minX = Math.min(...xs);
  const maxX = Math.max(...xs);
  const minZ = Math.min(...zs);
  const maxZ = Math.max(...zs);
  return pts.map((p) => ({
    id: p.id,
    x: maxX > minX ? (p.x - minX) / (maxX - minX) : 0.5,
    y: maxZ > minZ ? (maxZ - p.z) / (maxZ - minZ) : 0.5,
  }));
}
