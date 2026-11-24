"use client";

/*
  Hero 3D scene: an "embedding space" point cloud that morphs from noise into
  clusters, with a query point linked to its nearest neighbours (vector search).
  Plain three.js, isolated leaf, never rendered inside a Motion tree.
  Loaded with next/dynamic({ ssr: false }) so it ships as its own lazy chunk.
*/

import { useEffect, useRef } from "react";
import {
  AdditiveBlending,
  BufferAttribute,
  BufferGeometry,
  Color,
  Group,
  LineBasicMaterial,
  LineSegments,
  NormalBlending,
  PerspectiveCamera,
  Points,
  Scene,
  ShaderMaterial,
  WebGLRenderer,
} from "three";

type Props = { reduced: boolean; label: string; onFail: () => void };

const CENTERS: [number, number, number][] = [
  [-1.55, 0.95, 0.2],
  [1.45, 1.05, -0.45],
  [0.1, -0.1, 0.85], // query cluster (accent)
  [-1.25, -1.25, -0.55],
  [1.45, -1.15, 0.25],
];
const QUERY_CLUSTER = 2;
const NEIGHBOURS = 9;
const MORPH_DELAY = 0.5;
const MORPH_DURATION = 5.5;

const PALETTE = {
  light: { zinc: "#71717a", accent: "#059669", blending: NormalBlending, opacity: 0.8, line: 0.7 },
  dark: { zinc: "#d4d4d8", accent: "#10b981", blending: AdditiveBlending, opacity: 0.9, line: 0.85 },
};

// Deterministic PRNG so the static frame always looks the same.
function mulberry32(seed: number) {
  return () => {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const smooth = (x: number) => x * x * (3 - 2 * x);
const clamp01 = (x: number) => Math.min(1, Math.max(0, x));
const pointProgress = (progress: number, seed: number) => smooth(clamp01(progress * 1.25 - seed * 0.25));

const vertexShader = /* glsl */ `
  attribute vec3 aStart;
  attribute vec3 aEnd;
  attribute float aMix;
  attribute float aSize;
  attribute float aSeed;
  uniform float uProgress;
  uniform float uTime;
  uniform float uPixelRatio;
  uniform float uSize;
  varying float vMix;
  varying float vDepth;
  void main() {
    float p = clamp(uProgress * 1.25 - aSeed * 0.25, 0.0, 1.0);
    p = p * p * (3.0 - 2.0 * p);
    vec3 pos = mix(aStart, aEnd, p);
    pos += 0.03 * vec3(sin(uTime * 0.6 + aSeed * 40.0), cos(uTime * 0.5 + aSeed * 31.0), sin(uTime * 0.4 + aSeed * 17.0));
    vec4 mv = modelViewMatrix * vec4(pos, 1.0);
    gl_Position = projectionMatrix * mv;
    gl_PointSize = uSize * aSize * uPixelRatio * (6.0 / -mv.z);
    vMix = aMix * p;
    vDepth = clamp((-mv.z - 4.5) / 5.0, 0.0, 1.0);
  }
`;

const fragmentShader = /* glsl */ `
  uniform vec3 uZinc;
  uniform vec3 uAccent;
  uniform float uOpacity;
  varying float vMix;
  varying float vDepth;
  void main() {
    float d = length(gl_PointCoord - 0.5);
    if (d > 0.5) discard;
    float a = smoothstep(0.5, 0.15, d);
    vec3 col = mix(uZinc, uAccent, vMix);
    gl_FragColor = vec4(col, a * uOpacity * (1.0 - 0.55 * vDepth));
  }
`;

export default function EmbeddingScene({ reduced, label, onFail }: Props) {
  const hostRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const host = hostRef.current;
    if (!host) return;

    let renderer: WebGLRenderer;
    try {
      renderer = new WebGLRenderer({
        antialias: false,
        alpha: true,
        powerPreference: "low-power",
        // Static frame must survive for screenshots/exports.
        preserveDrawingBuffer: reduced,
      });
      if (!renderer.getContext()) throw new Error("no webgl");
    } catch {
      onFail();
      return;
    }

    const canvas = renderer.domElement;
    canvas.setAttribute("role", "img");
    canvas.setAttribute("aria-label", label);
    canvas.style.display = "block";
    canvas.style.width = "100%";
    canvas.style.height = "100%";
    host.appendChild(canvas);

    const onLost = (e: Event) => {
      e.preventDefault();
      onFail();
    };
    canvas.addEventListener("webglcontextlost", onLost);

    const dpr = Math.min(window.devicePixelRatio || 1, 1.75);
    renderer.setPixelRatio(dpr);
    renderer.setClearColor(0x000000, 0);

    const scene = new Scene();
    const camera = new PerspectiveCamera(40, 1, 0.1, 50);
    const group = new Group();
    scene.add(group);

    // ---- data ----------------------------------------------------------
    const rand = mulberry32(20261124);
    const gauss = () => {
      const u = Math.max(rand(), 1e-6);
      const v = rand();
      return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v);
    };
    const count = host.clientWidth < 520 ? 2200 : 3200;
    const start = new Float32Array(count * 3);
    const end = new Float32Array(count * 3);
    const mixA = new Float32Array(count);
    const size = new Float32Array(count);
    const seed = new Float32Array(count);
    const cluster = new Uint8Array(count);

    for (let i = 0; i < count; i++) {
      // start: uniform-ish ball
      const r = 2.9 * Math.cbrt(rand());
      const th = rand() * Math.PI * 2;
      const ph = Math.acos(2 * rand() - 1);
      start[i * 3] = r * Math.sin(ph) * Math.cos(th) * 1.15;
      start[i * 3 + 1] = r * Math.sin(ph) * Math.sin(th) * 0.85;
      start[i * 3 + 2] = r * Math.cos(ph);
      // end: soft clusters
      const c = Math.floor(rand() * CENTERS.length);
      cluster[i] = c;
      const spread = c === QUERY_CLUSTER ? 0.34 : 0.4;
      end[i * 3] = CENTERS[c][0] + gauss() * spread;
      end[i * 3 + 1] = CENTERS[c][1] + gauss() * spread;
      end[i * 3 + 2] = CENTERS[c][2] + gauss() * spread;
      mixA[i] = c === QUERY_CLUSTER ? 1 : rand() < 0.03 ? 0.6 : 0;
      size[i] = 0.6 + rand() * 0.8;
      seed[i] = rand();
    }

    // query point = point of the accent cluster nearest to its centre
    const qc = CENTERS[QUERY_CLUSTER];
    let qIndex = 0;
    let best = Infinity;
    for (let i = 0; i < count; i++) {
      if (cluster[i] !== QUERY_CLUSTER) continue;
      const d = (end[i * 3] - qc[0]) ** 2 + (end[i * 3 + 1] - qc[1]) ** 2 + (end[i * 3 + 2] - qc[2]) ** 2;
      if (d < best) {
        best = d;
        qIndex = i;
      }
    }
    // k nearest neighbours of the query in the final (clustered) space
    const dists: [number, number][] = [];
    for (let i = 0; i < count; i++) {
      if (i === qIndex || cluster[i] !== QUERY_CLUSTER) continue;
      const d =
        (end[i * 3] - end[qIndex * 3]) ** 2 +
        (end[i * 3 + 1] - end[qIndex * 3 + 1]) ** 2 +
        (end[i * 3 + 2] - end[qIndex * 3 + 2]) ** 2;
      dists.push([d, i]);
    }
    dists.sort((a, b) => a[0] - b[0]);
    // top-k by distance, spaced out along the ranking so the links stay readable at this scale
    const RANKS = [2, 6, 12, 20, 32, 48, 70, 96, 130];
    const nn = RANKS.slice(0, NEIGHBOURS).map((r) => dists[Math.min(r, dists.length - 1)][1]);

    // ---- cloud ---------------------------------------------------------
    const geo = new BufferGeometry();
    geo.setAttribute("position", new BufferAttribute(end.slice(), 3));
    geo.setAttribute("aStart", new BufferAttribute(start, 3));
    geo.setAttribute("aEnd", new BufferAttribute(end, 3));
    geo.setAttribute("aMix", new BufferAttribute(mixA, 1));
    geo.setAttribute("aSize", new BufferAttribute(size, 1));
    geo.setAttribute("aSeed", new BufferAttribute(seed, 1));

    const uniforms = {
      uProgress: { value: reduced ? 1 : 0 },
      uTime: { value: 0 },
      uPixelRatio: { value: dpr },
      uSize: { value: 5.4 },
      uZinc: { value: new Color() },
      uAccent: { value: new Color() },
      uOpacity: { value: 0.8 },
    };
    const mat = new ShaderMaterial({
      uniforms,
      vertexShader,
      fragmentShader,
      transparent: true,
      depthWrite: false,
    });
    const cloud = new Points(geo, mat);
    cloud.frustumCulled = false;
    group.add(cloud);

    // ---- query point + neighbour links -------------------------------------
    const qGeo = new BufferGeometry();
    const qPos = new Float32Array(3);
    qGeo.setAttribute("position", new BufferAttribute(qPos, 3));
    qGeo.setAttribute("aStart", new BufferAttribute(qPos, 3));
    qGeo.setAttribute("aEnd", new BufferAttribute(qPos, 3));
    qGeo.setAttribute("aMix", new BufferAttribute(new Float32Array([1]), 1));
    qGeo.setAttribute("aSize", new BufferAttribute(new Float32Array([1]), 1));
    qGeo.setAttribute("aSeed", new BufferAttribute(new Float32Array([0]), 1));
    const qUniforms = {
      ...uniforms,
      uProgress: { value: 1 },
      uTime: { value: 0 }, // CPU already applies the wobble to the query point
      uSize: { value: 24 },
      uOpacity: { value: 1 },
    };
    const qMat = new ShaderMaterial({
      uniforms: qUniforms,
      vertexShader,
      fragmentShader,
      transparent: true,
      depthWrite: false,
    });
    const qPoint = new Points(qGeo, qMat);
    qPoint.frustumCulled = false;
    group.add(qPoint);

    const lPos = new Float32Array(NEIGHBOURS * 6);
    const lGeo = new BufferGeometry();
    lGeo.setAttribute("position", new BufferAttribute(lPos, 3));
    const lMat = new LineBasicMaterial({ transparent: true, opacity: 0 });
    const lines = new LineSegments(lGeo, lMat);
    lines.frustumCulled = false;
    group.add(lines);

    const out = [0, 0, 0];
    const posAt = (i: number, progress: number, time: number) => {
      const p = pointProgress(progress, seed[i]);
      const s = seed[i];
      out[0] = start[i * 3] + (end[i * 3] - start[i * 3]) * p + 0.03 * Math.sin(time * 0.6 + s * 40);
      out[1] = start[i * 3 + 1] + (end[i * 3 + 1] - start[i * 3 + 1]) * p + 0.03 * Math.cos(time * 0.5 + s * 31);
      out[2] = start[i * 3 + 2] + (end[i * 3 + 2] - start[i * 3 + 2]) * p + 0.03 * Math.sin(time * 0.4 + s * 17);
      return out;
    };

    let lineAlpha = PALETTE.light.line;
    const updateQuery = (progress: number, time: number) => {
      const q = posAt(qIndex, progress, time);
      const qx = q[0];
      const qy = q[1];
      const qz = q[2];
      qPos[0] = qx;
      qPos[1] = qy;
      qPos[2] = qz;
      qGeo.attributes.position.needsUpdate = true;
      qGeo.attributes.aStart.needsUpdate = true;
      qGeo.attributes.aEnd.needsUpdate = true;
      for (let k = 0; k < nn.length; k++) {
        const n = posAt(nn[k], progress, time);
        lPos.set([qx, qy, qz, n[0], n[1], n[2]], k * 6);
      }
      lGeo.attributes.position.needsUpdate = true;
      // links appear only once the space has organised itself
      lMat.opacity = lineAlpha * smooth(clamp01((progress - 0.7) / 0.3));
      qUniforms.uOpacity.value = 0.35 + 0.65 * smooth(clamp01((progress - 0.5) / 0.5));
    };

    // ---- theme -------------------------------------------------------------
    const applyTheme = () => {
      const dark = document.documentElement.classList.contains("dark");
      const pal = dark ? PALETTE.dark : PALETTE.light;
      uniforms.uZinc.value.set(pal.zinc);
      uniforms.uAccent.value.set(pal.accent);
      uniforms.uOpacity.value = pal.opacity;
      mat.blending = pal.blending;
      qMat.blending = NormalBlending;
      mat.needsUpdate = true;
      lMat.color.set(pal.accent);
      lineAlpha = pal.line;
    };
    applyTheme();

    // ---- sizing --------------------------------------------------------------
    const resize = () => {
      const w = Math.max(1, host.clientWidth);
      const h = Math.max(1, host.clientHeight);
      renderer.setSize(w, h, false);
      const aspect = w / h;
      camera.aspect = aspect;
      camera.position.set(0, 0, Math.max(6.9, 7.6 / aspect));
      camera.updateProjectionMatrix();
    };
    resize();

    // ---- pointer parallax (no scroll listeners, no zoom) ---------------------
    let targetX = 0;
    let targetY = 0;
    let curX = 0;
    let curY = 0;
    const onPointer = (e: PointerEvent) => {
      targetX = (e.clientX / window.innerWidth) * 2 - 1;
      targetY = (e.clientY / window.innerHeight) * 2 - 1;
    };

    const BASE_RY = -0.35;
    const BASE_RX = 0.12;

    const renderStatic = () => {
      group.rotation.set(BASE_RX, BASE_RY, 0);
      updateQuery(1, 0);
      uniforms.uProgress.value = 1;
      uniforms.uTime.value = 0;
      renderer.render(scene, camera);
    };

    let raf = 0;
    let elapsed = 0;
    let last = 0;
    let visible = true;
    let running = false;

    const frame = (now: number) => {
      const dt = last ? Math.min(0.05, (now - last) / 1000) : 0;
      last = now;
      elapsed += dt;
      const progress = clamp01((elapsed - MORPH_DELAY) / MORPH_DURATION);
      uniforms.uProgress.value = progress;
      uniforms.uTime.value = elapsed;
      curX += (targetX - curX) * 0.05;
      curY += (targetY - curY) * 0.05;
      group.rotation.y = BASE_RY + elapsed * 0.05 + curX * 0.3;
      group.rotation.x = BASE_RX + curY * 0.18;
      updateQuery(progress, elapsed);
      renderer.render(scene, camera);
      raf = requestAnimationFrame(frame);
    };

    const sync = () => {
      const shouldRun = !reduced && visible && !document.hidden;
      if (shouldRun && !running) {
        running = true;
        last = 0;
        raf = requestAnimationFrame(frame);
      } else if (!shouldRun && running) {
        running = false;
        cancelAnimationFrame(raf);
      }
    };

    const io = new IntersectionObserver(
      ([entry]) => {
        visible = entry.isIntersecting;
        sync();
      },
      { threshold: 0 },
    );
    io.observe(host);
    document.addEventListener("visibilitychange", sync);

    const ro = new ResizeObserver(() => {
      resize();
      if (reduced) renderStatic();
    });
    ro.observe(host);

    const mo = new MutationObserver(() => {
      applyTheme();
      if (reduced) renderStatic();
    });
    mo.observe(document.documentElement, { attributes: true, attributeFilter: ["class"] });

    if (reduced) {
      renderStatic();
    } else {
      window.addEventListener("pointermove", onPointer, { passive: true });
      sync();
    }

    return () => {
      cancelAnimationFrame(raf);
      io.disconnect();
      ro.disconnect();
      mo.disconnect();
      document.removeEventListener("visibilitychange", sync);
      window.removeEventListener("pointermove", onPointer);
      canvas.removeEventListener("webglcontextlost", onLost);
      geo.dispose();
      qGeo.dispose();
      lGeo.dispose();
      mat.dispose();
      qMat.dispose();
      lMat.dispose();
      renderer.dispose();
      canvas.remove();
    };
  }, [reduced, label, onFail]);

  return <div ref={hostRef} className="scene-in absolute inset-0" />;
}
