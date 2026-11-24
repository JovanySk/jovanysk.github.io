import { describe, expect, it } from "vitest";
import {
  activeZone,
  buildHolds,
  CLUSTER_IDS,
  hudLabel,
  landingScroll,
  minimapPoints,
  morphAt,
  scrollToPath,
  stations,
  stepZone,
  ZONE_IDS,
} from "../zones";
import { buildCloud, nearest, samplePixels } from "../particles";
import { dict } from "../../i18n";

// 7 sections: intro 900, then zones of various heights, viewport 900
const VH = 900;
const heights = [900, 2200, 2600, 3000, 2000, 2600, 1500];
const tops = heights.reduce<number[]>((acc, _h, i) => [...acc, i === 0 ? 0 : acc[i - 1] + heights[i - 1]], []);
const max = tops[6] + heights[6] - VH;

describe("buildHolds / scrollToPath", () => {
  const holds = buildHolds(tops, heights, VH, max);

  it("creates one monotonic hold window per section", () => {
    expect(holds).toHaveLength(ZONE_IDS.length);
    for (let i = 0; i < holds.length; i++) {
      expect(holds[i][0]).toBeLessThanOrEqual(holds[i][1]);
      if (i) expect(holds[i][0]).toBeGreaterThanOrEqual(holds[i - 1][1]);
    }
    expect(holds[holds.length - 1][1]).toBe(max);
  });

  it("rests exactly on each station inside its hold", () => {
    holds.forEach(([a, b], i) => {
      const mid = (a + b) / 2;
      expect(scrollToPath(mid, holds)).toBeCloseTo(i / (ZONE_IDS.length - 1), 6);
    });
  });

  it("is continuous and non-decreasing across the whole page", () => {
    let prev = 0;
    for (let y = 0; y <= max; y += 25) {
      const u = scrollToPath(y, holds);
      expect(u).toBeGreaterThanOrEqual(prev - 1e-9);
      expect(u - prev).toBeLessThan(0.06);
      prev = u;
    }
    expect(scrollToPath(max + 500, holds)).toBe(1);
    expect(scrollToPath(-50, holds)).toBe(0);
  });

  it("lands keyboard jumps at the start of the zone hold", () => {
    expect(landingScroll(0, holds, tops)).toBe(0);
    expect(scrollToPath(landingScroll(3, holds, tops), holds)).toBeCloseTo(3 / 6, 6);
  });
});

describe("zone helpers", () => {
  it("picks the section that owns the upper middle of the viewport", () => {
    expect(activeZone(0, VH, tops)).toBe(0);
    expect(activeZone(tops[2] - VH * 0.4, VH, tops)).toBe(2);
    expect(activeZone(max, VH, tops)).toBe(6);
  });

  it("clamps keyboard steps", () => {
    expect(stepZone(0, -1, 7)).toBe(0);
    expect(stepZone(6, 1, 7)).toBe(6);
    expect(stepZone(2, 1, 7)).toBe(3);
  });

  it("morphs the name within the first viewport", () => {
    expect(morphAt(0, VH)).toBe(0);
    expect(morphAt(VH, VH)).toBe(1);
    expect(morphAt(VH * 0.4, VH)).toBeGreaterThan(0.3);
  });

  it("formats the HUD label like a game readout", () => {
    const J = dict.es.journey;
    expect(hudLabel(2, J.hud, J.zones)).toBe("ZONA 2/5 · IA APLICADA");
    expect(hudLabel(0, J.hud, J.zones)).toBe("00 · ORIGEN");
    expect(hudLabel(6, dict.en.journey.hud, dict.en.journey.zones)).toBe("EXIT · CONTACT");
  });

  it("has a station per zone and normalised minimap points", () => {
    expect(stations(1.6)).toHaveLength(ZONE_IDS.length);
    expect(stations(0.46)).toHaveLength(ZONE_IDS.length);
    const pts = minimapPoints();
    expect(pts.map((p) => p.id)).toEqual([...CLUSTER_IDS]);
    pts.forEach((p) => {
      expect(p.x).toBeGreaterThanOrEqual(0);
      expect(p.x).toBeLessThanOrEqual(1);
      expect(p.y).toBeGreaterThanOrEqual(0);
      expect(p.y).toBeLessThanOrEqual(1);
    });
  });

  it("keeps the no-dash copy rule in the journey strings", () => {
    const text = JSON.stringify([dict.es.journey, dict.en.journey, dict.es.skills, dict.en.skills, dict.es.os.term.banner, dict.en.os.term.banner]);
    expect(text).not.toMatch(/[\u2013\u2014]/);
  });

  it("has a key metric for every project shown in the zones", () => {
    const repos = [...dict.es.projects.items.map((p) => p.repo), ...dict.es.more.items.map((p) => p.repo)];
    repos.forEach((r) => {
      expect(dict.es.journey.keys[r]).toBeDefined();
      expect(dict.en.journey.keys[r]).toBeDefined();
    });
  });
});

describe("particles", () => {
  it("distributes every point to a slot, deterministically", () => {
    const a = buildCloud(3000);
    const b = buildCloud(3000);
    expect(a.positions).toEqual(b.positions);
    const assigned = a.slots.reduce((n, s) => n + s.indices.length, 0);
    expect(assigned).toBe(3000);
    expect(a.slots.filter((s) => s.cluster === "ai")).toHaveLength(4);
    expect(a.slots.filter((s) => s.cluster === "systems")).toHaveLength(7);
  });

  it("samples glyph pixels into a unit-wide, centred text", () => {
    const w = 40;
    const h = 20;
    const alpha = new Uint8Array(w * h);
    for (let y = 4; y < 16; y++) for (let x = 4; x < 36; x++) alpha[y * w + x] = 255;
    const pts = samplePixels(alpha, w, h, 500);
    let minX = Infinity;
    let maxX = -Infinity;
    for (let i = 0; i < 500; i++) {
      minX = Math.min(minX, pts[i * 3]);
      maxX = Math.max(maxX, pts[i * 3]);
    }
    expect(maxX - minX).toBeGreaterThan(0.9);
    expect(maxX - minX).toBeLessThan(1.1);
    expect(Math.abs(maxX + minX)).toBeLessThan(0.1);
  });

  it("returns the query point first, then spaced neighbours", () => {
    const c = buildCloud(2000);
    const s = c.slots[0];
    const nn = nearest(c.positions, s.indices, s.center, 6);
    expect(nn).toHaveLength(6);
    expect(new Set(nn).size).toBe(6);
  });
});
