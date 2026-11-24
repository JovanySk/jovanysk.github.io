// Pure particle generation for the latent space scene (no DOM, no three.js).

import { CLUSTER_IDS, CLUSTERS, type ClusterId, type Vec3 } from "./zones";

export function mulberry32(seed: number) {
  return () => {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export type Slot = { cluster: ClusterId; slot: number; id: number; center: Vec3; indices: number[] };

export type Cloud = {
  positions: Float32Array; // xyz per point, final clustered position
  colors: Float32Array; // rgb per point
  slotIds: Float32Array; // slot id per point (cluster index * 16 + slot)
  slots: Slot[];
};

export const slotId = (cluster: ClusterId, slot: number) => CLUSTER_IDS.indexOf(cluster) * 16 + slot;

const hexRgb = (hex: string): Vec3 => {
  const n = parseInt(hex.slice(1), 16);
  return [((n >> 16) & 255) / 255, ((n >> 8) & 255) / 255, (n & 255) / 255];
};

/** Local centre of sub-cluster `s` of `n` for a given shape. */
function slotOffset(shape: string, s: number, n: number): Vec3 {
  if (n <= 1) return [0, 0, 0];
  const a = (s / n) * Math.PI * 2 + 0.4;
  if (shape === "ring") return [Math.cos(a) * 3.1, Math.sin(a) * 3.1 * 0.62, Math.sin(a) * 1.2];
  // clumps: loose ring, tilted towards the camera
  return [Math.cos(a) * 2.7, Math.sin(a) * 1.7, Math.sin(a * 2) * 0.9];
}

/**
 * Distributes `count` points over the 5 clusters. Each cluster has a distinct
 * structure (ball, clumps, ring, spiral disk) so every zone reads differently.
 */
export function buildCloud(count: number, seed = 20261124): Cloud {
  const rand = mulberry32(seed);
  const gauss = () => {
    const u = Math.max(rand(), 1e-6);
    return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * rand());
  };
  const positions = new Float32Array(count * 3);
  const colors = new Float32Array(count * 3);
  const slotIds = new Float32Array(count);
  const slots: Slot[] = [];
  CLUSTER_IDS.forEach((cid) => {
    const c = CLUSTERS[cid];
    for (let s = 0; s < c.slots; s++) {
      const o = slotOffset(c.shape, s, c.slots);
      slots.push({ cluster: cid, slot: s, id: slotId(cid, s), center: [c.center[0] + o[0], c.center[1] + o[1], c.center[2] + o[2]], indices: [] });
    }
  });

  // cumulative weights -> cluster per point (deterministic blocks, then shuffled by rand inside)
  const total = CLUSTER_IDS.reduce((a, id) => a + CLUSTERS[id].weight, 0);
  let cursor = 0;
  CLUSTER_IDS.forEach((cid, ci) => {
    const c = CLUSTERS[cid];
    const n = ci === CLUSTER_IDS.length - 1 ? count - cursor : Math.round((c.weight / total) * count);
    const base = hexRgb(c.tint[0]);
    const spark = hexRgb(c.tint[1]);
    const mySlots = slots.filter((s) => s.cluster === cid);
    for (let k = 0; k < n && cursor < count; k++, cursor++) {
      const i = cursor;
      const slot = mySlots[k % mySlots.length];
      let x = 0;
      let y = 0;
      let z = 0;
      if (c.shape === "ball") {
        const r = 1.55;
        x = gauss() * r;
        y = gauss() * r * 0.8;
        z = gauss() * r;
      } else if (c.shape === "clumps") {
        // 85% in the clump, 15% as a faint bridge to the centre
        if (rand() < 0.85) {
          x = slot.center[0] - c.center[0] + gauss() * 0.62;
          y = slot.center[1] - c.center[1] + gauss() * 0.62;
          z = slot.center[2] - c.center[2] + gauss() * 0.62;
        } else {
          const t = rand();
          x = (slot.center[0] - c.center[0]) * t + gauss() * 0.15;
          y = (slot.center[1] - c.center[1]) * t + gauss() * 0.15;
          z = (slot.center[2] - c.center[2]) * t + gauss() * 0.15;
        }
      } else if (c.shape === "ring") {
        if (rand() < 0.6) {
          x = slot.center[0] - c.center[0] + gauss() * 0.4;
          y = slot.center[1] - c.center[1] + gauss() * 0.4;
          z = slot.center[2] - c.center[2] + gauss() * 0.4;
        } else {
          const a = rand() * Math.PI * 2;
          x = Math.cos(a) * 3.1 + gauss() * 0.12;
          y = Math.sin(a) * 3.1 * 0.62 + gauss() * 0.12;
          z = Math.sin(a) * 1.2 + gauss() * 0.12;
        }
      } else {
        // spiral disk, 3 arms
        const arm = Math.floor(rand() * 3);
        const r = Math.pow(rand(), 0.7) * 5.2;
        const a = arm * ((Math.PI * 2) / 3) + r * 0.9 + gauss() * 0.22;
        x = Math.cos(a) * r + gauss() * 0.12;
        z = Math.sin(a) * r * 0.9 + gauss() * 0.12;
        y = gauss() * 0.14 * (1.2 - r / 5.2);
        // tilt the disk towards the camera (around x)
        const ty = y * Math.cos(1.05) - z * Math.sin(1.05);
        z = y * Math.sin(1.05) + z * Math.cos(1.05);
        y = ty;
      }
      positions[i * 3] = c.center[0] + x;
      positions[i * 3 + 1] = c.center[1] + y;
      positions[i * 3 + 2] = c.center[2] + z;
      const col = rand() < c.sparkle ? spark : base;
      const lum = 0.75 + rand() * 0.25;
      colors[i * 3] = col[0] * lum;
      colors[i * 3 + 1] = col[1] * lum;
      colors[i * 3 + 2] = col[2] * lum;
      slotIds[i] = slot.id;
      slot.indices.push(i);
    }
  });
  return { positions, colors, slotIds, slots };
}

/**
 * Picks `count` points from the opaque pixels of a glyph mask (alpha > 127),
 * normalised so the text is 1 unit wide and centred on the origin (y up).
 */
export function samplePixels(alpha: Uint8ClampedArray | Uint8Array, w: number, h: number, count: number, seed = 7): Float32Array {
  const rand = mulberry32(seed);
  const hits: number[] = [];
  let minX = w;
  let maxX = 0;
  let minY = h;
  let maxY = 0;
  for (let y = 0; y < h; y += 2) {
    for (let x = 0; x < w; x += 2) {
      if (alpha[y * w + x] > 127) {
        hits.push(x, y);
        if (x < minX) minX = x;
        if (x > maxX) maxX = x;
        if (y < minY) minY = y;
        if (y > maxY) maxY = y;
      }
    }
  }
  const out = new Float32Array(count * 3);
  const n = hits.length / 2;
  if (!n) return out;
  const width = Math.max(1, maxX - minX);
  const cx = (minX + maxX) / 2;
  const cy = (minY + maxY) / 2;
  for (let i = 0; i < count; i++) {
    const k = Math.floor(rand() * n);
    const x = hits[k * 2] + (rand() - 0.5) * 2;
    const y = hits[k * 2 + 1] + (rand() - 0.5) * 2;
    out[i * 3] = (x - cx) / width;
    out[i * 3 + 1] = -(y - cy) / width;
    out[i * 3 + 2] = (rand() - 0.5) * 0.012;
  }
  return out;
}

/** k points of `indices` nearest to `center`, picked at spaced ranks so links stay readable. */
export function nearest(positions: Float32Array, indices: number[], center: Vec3, k: number): number[] {
  const d = indices.map((i) => {
    const dx = positions[i * 3] - center[0];
    const dy = positions[i * 3 + 1] - center[1];
    const dz = positions[i * 3 + 2] - center[2];
    return [dx * dx + dy * dy + dz * dz, i] as [number, number];
  });
  d.sort((a, b) => a[0] - b[0]);
  const out: number[] = [];
  const step = Math.max(1, Math.floor(d.length / (k * 16)));
  for (let r = 0; out.length < k && r < d.length; r += step * (out.length + 1)) out.push(d[r][1]);
  return out;
}
