"use client";

/*
  Fixed full-viewport WebGL scene: "a journey through latent space".
  - The name "JOVANY MORALES" is sampled from a canvas into points; on scroll the
    letters disperse and settle into 5 clusters (GPU attribute interpolation).
  - GSAP ScrollTrigger (scrub) smooths the scroll position; a camera path through
    the clusters is driven from it (see zones.ts for the pure mapping).
  - Project cards dispatch "latent:query" on hover: a query ray links the card to
    the nearest neighbours of its sub-cluster.
  Isolated leaf: three + GSAP only, never rendered inside a Motion tree.
*/

import { useEffect, useRef } from "react";
import {
  AdditiveBlending,
  BufferAttribute,
  BufferGeometry,
  CatmullRomCurve3,
  Color,
  ImageLoader,
  LineBasicMaterial,
  LineSegments,
  LoadingManager,
  PerspectiveCamera,
  Points,
  Scene,
  ShaderMaterial,
  Vector3,
  WebGLRenderer,
} from "three";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { buildCloud, mulberry32, nearest, samplePixels, slotId, type Slot } from "./particles";
import { buildHolds, CLUSTER_IDS, clamp01, morphAt, scrollToPath, stations, ZONE_IDS, type ClusterId, type Hold } from "./zones";

type Props = { reduced: boolean; lite: boolean; label: string };

export const SHOTS = [
  "/shots/plant-doctor.webp",
  "/shots/n8n-workflow.webp",
  "/shots/bi-sales.webp",
  "/shots/stockpilot.webp",
  "/shots/mascota-form.webp",
  "/shots/zyra-console.webp",
  "/shots/datavault-dashboard.webp",
  "/shots/datavault-ai.webp",
];

export type QueryDetail = { cluster: ClusterId; slot: number; x: number; y: number } | null;

const emit = (name: string, detail?: unknown) => window.dispatchEvent(new CustomEvent(name, { detail }));

const cloudVert = /* glsl */ `
  attribute vec3 aText;
  attribute vec3 aCloud;
  attribute vec3 aColor;
  attribute float aSlot;
  attribute float aSeed;
  attribute float aSize;
  uniform float uMorph;
  uniform float uTime;
  uniform float uPR;
  uniform float uSize;
  uniform float uTextScale;
  uniform vec3 uTextOffset;
  uniform float uHi;
  uniform float uHiAmt;
  uniform float uFogFar;
  uniform float uBoost;
  uniform float uDim;
  varying vec3 vColor;
  varying float vAlpha;
  void main() {
    float p = clamp(uMorph * 1.6 - aSeed * 0.6, 0.0, 1.0);
    p = p * p * (3.0 - 2.0 * p);
    vec3 txt = aText * uTextScale + uTextOffset;
    txt.xy += vec2(sin(uTime * 1.3 + aSeed * 50.0), cos(uTime * 1.1 + aSeed * 37.0)) * 0.0045 * uTextScale;
    vec3 pos = mix(txt, aCloud, p);
    vec3 dir = normalize(vec3(sin(aSeed * 91.7), cos(aSeed * 53.3), sin(aSeed * 27.1 + 1.0)) + 0.0001);
    pos += dir * sin(p * 3.14159) * (1.2 + aSeed * 3.4);
    pos += 0.05 * vec3(sin(uTime * 0.5 + aSeed * 40.0), cos(uTime * 0.45 + aSeed * 31.0), sin(uTime * 0.4 + aSeed * 17.0)) * p;
    float hi = abs(aSlot - uHi) < 0.5 ? uHiAmt : 0.0;
    vec4 mv = modelViewMatrix * vec4(pos, 1.0);
    gl_Position = projectionMatrix * mv;
    float depth = max(0.1, -mv.z);
    float sz = mix(uSize * 0.66, uSize, p) * aSize * (1.0 + hi * 0.8) * uBoost;
    gl_PointSize = clamp(sz * uPR * (10.0 / depth), 1.0 * uPR, 24.0 * uPR);
    vec3 textCol = mix(vec3(1.0, 1.0, 1.0), vec3(0.2, 0.83, 0.6), step(0.95, aSeed));
    vColor = mix(textCol, aColor, p);
    vColor = mix(vColor, vec3(0.3, 1.0, 0.72), hi * 0.85);
    float fog = 1.0 - smoothstep(15.0, uFogFar, depth) * 0.85;
    vAlpha = fog * smoothstep(0.4, 2.5, depth) * (0.85 + hi * 0.15) * mix(1.0, uDim, p);
  }
`;

const dotFrag = /* glsl */ `
  varying vec3 vColor;
  varying float vAlpha;
  void main() {
    float d = length(gl_PointCoord - 0.5);
    if (d > 0.5) discard;
    float a = smoothstep(0.5, 0.04, d);
    gl_FragColor = vec4(vColor, a * a * vAlpha);
  }
`;

const dustVert = /* glsl */ `
  attribute float aSeed;
  uniform float uTime;
  uniform float uPR;
  varying vec3 vColor;
  varying float vAlpha;
  void main() {
    vec3 pos = position + 0.25 * vec3(sin(uTime * 0.12 + aSeed * 30.0), cos(uTime * 0.1 + aSeed * 20.0), 0.0);
    vec4 mv = modelViewMatrix * vec4(pos, 1.0);
    gl_Position = projectionMatrix * mv;
    float depth = max(0.1, -mv.z);
    gl_PointSize = clamp((1.2 + aSeed * 1.8) * uPR * (10.0 / depth), 0.6 * uPR, 3.0 * uPR);
    vColor = vec3(0.63, 0.63, 0.67);
    vAlpha = (0.25 + aSeed * 0.35) * (1.0 - smoothstep(20.0, 80.0, depth)) * smoothstep(0.5, 4.0, depth);
  }
`;

const queryVert = /* glsl */ `
  uniform float uPR;
  uniform float uAlpha;
  varying vec3 vColor;
  varying float vAlpha;
  void main() {
    vec4 mv = modelViewMatrix * vec4(position, 1.0);
    gl_Position = projectionMatrix * mv;
    gl_PointSize = clamp(22.0 * uPR * (10.0 / max(0.1, -mv.z)), 4.0 * uPR, 34.0 * uPR);
    vColor = vec3(0.3, 1.0, 0.72);
    vAlpha = uAlpha;
  }
`;

function sampleName(count: number, family: string): Float32Array {
  const w = 1600;
  const h = 620;
  const c = document.createElement("canvas");
  c.width = w;
  c.height = h;
  const ctx = c.getContext("2d", { willReadFrequently: true });
  if (!ctx) return new Float32Array(count * 3);
  ctx.fillStyle = "#fff";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.font = `700 250px ${family}`;
  try {
    (ctx as CanvasRenderingContext2D & { letterSpacing: string }).letterSpacing = "-10px";
  } catch {}
  ctx.fillText("JOVANY", w / 2, h * 0.29);
  ctx.fillText("MORALES", w / 2, h * 0.73);
  const img = ctx.getImageData(0, 0, w, h).data;
  const alpha = new Uint8Array(w * h);
  for (let i = 0; i < w * h; i++) alpha[i] = img[i * 4 + 3];
  return samplePixels(alpha, w, h, count);
}

export default function LatentCanvas({ reduced, lite, label }: Props) {
  const hostRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const host = hostRef.current;
    if (!host) return;
    let disposed = false;

    // ---- loading manager: real progress for the loader ---------------------
    const manager = new LoadingManager();
    manager.onProgress = (item, loaded, total) => emit("latent:progress", { item, loaded, total });
    ["fonts", "engine", "particles", "shaders"].forEach((k) => manager.itemStart(k));

    let renderer: WebGLRenderer;
    try {
      renderer = new WebGLRenderer({ antialias: false, alpha: false, powerPreference: "high-performance", preserveDrawingBuffer: reduced });
      if (!renderer.getContext()) throw new Error("no webgl");
    } catch {
      emit("latent:fail");
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
      emit("latent:fail");
    };
    canvas.addEventListener("webglcontextlost", onLost);

    const dpr = Math.min(window.devicePixelRatio || 1, lite ? 1.5 : 1.75);
    renderer.setPixelRatio(dpr);
    renderer.setClearColor(new Color("#09090b"), 1);
    manager.itemEnd("engine");

    // preload the project screenshots through the same manager (the HTML reuses the cache)
    const imgLoader = new ImageLoader(manager);
    if (!reduced) SHOTS.forEach((src) => imgLoader.load(src, undefined, undefined, () => {}));

    const scene = new Scene();
    const camera = new PerspectiveCamera(45, 1, 0.1, 220);

    // ---- data ------------------------------------------------------------------
    const COUNT = lite ? 2800 : 10000;
    const DUST = lite ? 400 : 1600;
    const cloud = buildCloud(COUNT);
    const rand = mulberry32(99);
    const seeds = new Float32Array(COUNT);
    const sizes = new Float32Array(COUNT);
    for (let i = 0; i < COUNT; i++) {
      seeds[i] = rand();
      sizes[i] = 0.55 + rand() * 0.9;
    }

    const geo = new BufferGeometry();
    geo.setAttribute("position", new BufferAttribute(cloud.positions, 3));
    geo.setAttribute("aCloud", new BufferAttribute(cloud.positions, 3));
    geo.setAttribute("aText", new BufferAttribute(new Float32Array(COUNT * 3), 3));
    geo.setAttribute("aColor", new BufferAttribute(cloud.colors, 3));
    geo.setAttribute("aSlot", new BufferAttribute(cloud.slotIds, 1));
    geo.setAttribute("aSeed", new BufferAttribute(seeds, 1));
    geo.setAttribute("aSize", new BufferAttribute(sizes, 1));
    const uniforms = {
      uMorph: { value: reduced ? 1 : 0 },
      uTime: { value: 0 },
      uPR: { value: dpr },
      uSize: { value: lite ? 6.2 : 5.2 },
      uTextScale: { value: 12 },
      uTextOffset: { value: new Vector3(0, 0.9, 0) },
      uHi: { value: -10 },
      uHiAmt: { value: 0 },
      uFogFar: { value: 72 },
      uBoost: { value: 1 },
      // small screens: text sits on top of the clusters, so the cloud is dimmer there
      uDim: { value: lite ? 0.55 : 1 },
    };
    const mat = new ShaderMaterial({
      uniforms,
      vertexShader: cloudVert,
      fragmentShader: dotFrag,
      transparent: true,
      depthWrite: false,
      blending: AdditiveBlending,
    });
    const points = new Points(geo, mat);
    points.frustumCulled = false;
    points.visible = false;
    scene.add(points);

    // dust: a long tube of faint specks along the flight path for depth
    const dPos = new Float32Array(DUST * 3);
    const dSeed = new Float32Array(DUST);
    for (let i = 0; i < DUST; i++) {
      dPos[i * 3] = (rand() - 0.5) * 70;
      dPos[i * 3 + 1] = (rand() - 0.5) * 40;
      dPos[i * 3 + 2] = 18 - rand() * 135;
      dSeed[i] = rand();
    }
    const dGeo = new BufferGeometry();
    dGeo.setAttribute("position", new BufferAttribute(dPos, 3));
    dGeo.setAttribute("aSeed", new BufferAttribute(dSeed, 1));
    const dUniforms = { uTime: uniforms.uTime, uPR: uniforms.uPR };
    const dMat = new ShaderMaterial({
      uniforms: dUniforms,
      vertexShader: dustVert,
      fragmentShader: dotFrag,
      transparent: true,
      depthWrite: false,
      blending: AdditiveBlending,
    });
    const dust = new Points(dGeo, dMat);
    dust.frustumCulled = false;
    scene.add(dust);

    // ---- query ray: query point + links to its nearest neighbours --------------
    const K = 9;
    const slotById = new Map<number, Slot & { q: number; nn: number[] }>();
    cloud.slots.forEach((s) => {
      const ranked = nearest(cloud.positions, s.indices, s.center, K + 1);
      slotById.set(s.id, { ...s, q: ranked[0], nn: ranked.slice(1) });
    });
    const lPos = new Float32Array((K + 1) * 6);
    const lGeo = new BufferGeometry();
    lGeo.setAttribute("position", new BufferAttribute(lPos, 3));
    const lMat = new LineBasicMaterial({ color: new Color("#34d399"), transparent: true, opacity: 0, blending: AdditiveBlending, depthWrite: false });
    const lines = new LineSegments(lGeo, lMat);
    lines.frustumCulled = false;
    scene.add(lines);
    const qPos = new Float32Array(3);
    const qGeo = new BufferGeometry();
    qGeo.setAttribute("position", new BufferAttribute(qPos, 3));
    const qUniforms = { uPR: uniforms.uPR, uAlpha: { value: 0 } };
    const qMat = new ShaderMaterial({
      uniforms: qUniforms,
      vertexShader: queryVert,
      fragmentShader: dotFrag,
      transparent: true,
      depthWrite: false,
      blending: AdditiveBlending,
    });
    const qPoint = new Points(qGeo, qMat);
    qPoint.frustumCulled = false;
    scene.add(qPoint);

    // final (morph = 1) position of point i at time t, mirrors the shader drift
    const at = (i: number, t: number, out: number[]) => {
      const s = seeds[i];
      out[0] = cloud.positions[i * 3] + 0.05 * Math.sin(t * 0.5 + s * 40);
      out[1] = cloud.positions[i * 3 + 1] + 0.05 * Math.cos(t * 0.45 + s * 31);
      out[2] = cloud.positions[i * 3 + 2] + 0.05 * Math.sin(t * 0.4 + s * 17);
      return out;
    };

    // hover state from the project cards
    let hover: QueryDetail = null;
    let grow = 0;
    const onQuery = (e: Event) => {
      hover = (e as CustomEvent<QueryDetail>).detail;
      grow = 0;
    };
    window.addEventListener("latent:query", onQuery);

    // ---- camera path -------------------------------------------------------------
    let camCurve: CatmullRomCurve3;
    let lookCurve: CatmullRomCurve3;
    const buildPath = (aspect: number) => {
      const st = stations(aspect);
      camCurve = new CatmullRomCurve3(st.map((s) => new Vector3(...s.cam)), false, "catmullrom", 0.35);
      lookCurve = new CatmullRomCurve3(st.map((s) => new Vector3(...s.look)), false, "catmullrom", 0.35);
    };

    // name text scaled to the intro viewport
    const fitText = (aspect: number) => {
      const d = aspect < 1 ? 15 : 12.5;
      const visH = 2 * d * Math.tan((45 * Math.PI) / 360);
      const visW = visH * aspect;
      uniforms.uTextScale.value = Math.min(visW * (aspect < 1 ? 0.9 : 0.74), visH * 1.15);
      uniforms.uTextOffset.value.set(0, aspect < 1 ? visH * 0.14 : visH * 0.07, 0);
    };

    let vw = 1;
    let vh = 1;
    const resize = () => {
      vw = Math.max(1, window.innerWidth);
      vh = Math.max(1, window.innerHeight);
      renderer.setSize(vw, vh, false);
      camera.aspect = vw / vh;
      camera.updateProjectionMatrix();
      buildPath(camera.aspect);
      fitText(camera.aspect);
    };
    resize();

    // ---- scroll: GSAP ScrollTrigger scrub smooths the scroll position --------------
    gsap.registerPlugin(ScrollTrigger);
    const state = { y: window.scrollY };
    let holds: Hold[] = [];
    let sections: HTMLElement[] = [];
    const measure = () => {
      sections = ZONE_IDS.map((id) => document.getElementById(id)).filter(Boolean) as HTMLElement[];
      const tops = sections.map((s) => s.getBoundingClientRect().top + window.scrollY);
      const heights = sections.map((s) => s.offsetHeight);
      holds = buildHolds(tops, heights, window.innerHeight, ScrollTrigger.maxScroll(window));
    };
    const tween = reduced
      ? null
      : gsap.fromTo(
          state,
          { y: 0 },
          {
            y: () => ScrollTrigger.maxScroll(window),
            ease: "none",
            scrollTrigger: { start: 0, end: "max", scrub: 1.1, invalidateOnRefresh: true },
          },
        );
    ScrollTrigger.addEventListener("refresh", measure);
    measure();
    let refreshT = 0;
    const ro = new ResizeObserver(() => {
      window.clearTimeout(refreshT);
      refreshT = window.setTimeout(() => ScrollTrigger.refresh(), 150);
    });
    ro.observe(document.body);

    // ---- pointer parallax ------------------------------------------------------------
    let tx = 0;
    let ty = 0;
    let px = 0;
    let py = 0;
    const onPointer = (e: PointerEvent) => {
      if (e.pointerType !== "mouse") return;
      tx = (e.clientX / vw) * 2 - 1;
      ty = (e.clientY / vh) * 2 - 1;
    };
    if (!reduced) window.addEventListener("pointermove", onPointer, { passive: true });

    const cam = new Vector3();
    const look = new Vector3();
    const tmp = [0, 0, 0];
    const tmp2 = [0, 0, 0];
    const anchor = new Vector3();
    const lastCv: number[] = [];
    const root = document.documentElement;
    let lastPx = 99;

    const draw = (t: number, u: number, morph: number) => {
      camCurve.getPoint(u, cam);
      lookCurve.getPoint(u, look);
      cam.x += px * 0.55;
      cam.y -= py * 0.35;
      camera.position.copy(cam);
      camera.lookAt(look);
      camera.updateMatrixWorld();
      uniforms.uMorph.value = morph;
      uniforms.uTime.value = t;

      // which query ray to show: the hovered card, else the INTESC RAG demo near zone 1
      const zoneF = u * (ZONE_IDS.length - 1);
      const exitW = clamp01(zoneF - (ZONE_IDS.length - 2));
      uniforms.uFogFar.value = 72 + 120 * exitW;
      uniforms.uBoost.value = 1 + 1.3 * exitW;
      const nearIntesc = clamp01(1 - Math.abs(zoneF - 1) * 1.6) * morph;
      const target = hover ? slotById.get(slotId(hover.cluster, hover.slot)) : slotById.get(slotId("intesc", 0));
      const strength = hover ? 1 : nearIntesc;
      grow = Math.min(1, grow + 0.045);
      const g = hover ? 1 - Math.pow(1 - grow, 3) : 1;
      let seg = 0;
      if (target && strength > 0.01) {
        const q = at(target.q, t, tmp);
        const qx = q[0];
        const qy = q[1];
        const qz = q[2];
        qPos[0] = qx;
        qPos[1] = qy;
        qPos[2] = qz;
        if (hover) {
          // from the card on screen into the space
          anchor.set((hover.x / vw) * 2 - 1, -(hover.y / vh) * 2 + 1, 0.5).unproject(camera);
          anchor.sub(camera.position).normalize();
          const dist = camera.position.distanceTo(new Vector3(qx, qy, qz)) * 0.55;
          anchor.multiplyScalar(dist).add(camera.position);
          lPos.set([anchor.x, anchor.y, anchor.z, anchor.x + (qx - anchor.x) * g, anchor.y + (qy - anchor.y) * g, anchor.z + (qz - anchor.z) * g], 0);
          seg = 1;
        }
        for (let k = 0; k < target.nn.length; k++) {
          const n = at(target.nn[k], t, tmp2);
          const gk = clamp01(g * 1.6 - k * 0.07);
          lPos.set([qx, qy, qz, qx + (n[0] - qx) * gk, qy + (n[1] - qy) * gk, qz + (n[2] - qz) * gk], (seg + k) * 6);
        }
        seg += target.nn.length;
      }
      lGeo.setDrawRange(0, seg * 2);
      lGeo.attributes.position.needsUpdate = true;
      qGeo.attributes.position.needsUpdate = true;
      lMat.opacity = 0.75 * strength;
      qUniforms.uAlpha.value = strength;
      uniforms.uHi.value = hover ? slotId(hover.cluster, hover.slot) : -10;
      uniforms.uHiAmt.value += ((hover ? 1 : 0) - uniforms.uHiAmt.value) * 0.12;

      renderer.render(scene, camera);

      // sync the HTML layer with the camera: per-section offset from its station
      for (let i = 0; i < sections.length; i++) {
        const cv = Math.max(-1, Math.min(1, zoneF - i));
        if (lastCv[i] === undefined || Math.abs(lastCv[i] - cv) > 0.003) {
          lastCv[i] = cv;
          sections[i].style.setProperty("--cv", cv.toFixed(3));
        }
      }
      if (Math.abs(lastPx - (px + py)) > 0.002) {
        lastPx = px + py;
        root.style.setProperty("--px", px.toFixed(3));
        root.style.setProperty("--py", py.toFixed(3));
      }
    };

    // ---- loop ----------------------------------------------------------------------
    let raf = 0;
    let running = false;
    let ready = false;
    let last = 0;
    let elapsed = 0;
    const frame = (now: number) => {
      const dt = last ? Math.min(0.05, (now - last) / 1000) : 0;
      last = now;
      elapsed += dt;
      px += (tx - px) * 0.04;
      py += (ty - py) * 0.04;
      const y = state.y;
      draw(elapsed, scrollToPath(y, holds), morphAt(y, vh));
      raf = requestAnimationFrame(frame);
    };
    const renderStatic = () => {
      // reduced motion: one frame of the whole constellation, no flight
      draw(0, 1, 1);
    };
    const sync = () => {
      const should = ready && !reduced && !document.hidden;
      if (should && !running) {
        running = true;
        last = 0;
        raf = requestAnimationFrame(frame);
      } else if (!should && running) {
        running = false;
        cancelAnimationFrame(raf);
      }
    };
    document.addEventListener("visibilitychange", sync);
    const onResize = () => {
      resize();
      if (reduced && ready) renderStatic();
    };
    window.addEventListener("resize", onResize);

    // ---- fonts -> name particles -> shader compile -> ready ----------------------------
    const family = getComputedStyle(document.body).getPropertyValue("--font-geist-sans").trim() || "sans-serif";
    const fontsReady = Promise.race([
      document.fonts.load(`700 250px ${family}`).then(() => document.fonts.ready),
      new Promise((r) => setTimeout(r, 2500)),
    ]);
    fontsReady.then(() => {
      if (disposed) return;
      manager.itemEnd("fonts");
      const text = sampleName(COUNT, family);
      (geo.attributes.aText as BufferAttribute).set(text);
      geo.attributes.aText.needsUpdate = true;
      points.visible = true;
      manager.itemEnd("particles");
      requestAnimationFrame(() => {
        if (disposed) return;
        try {
          renderer.compile(scene, camera);
        } catch {}
        manager.itemEnd("shaders");
        ready = true;
        if (reduced) renderStatic();
        else root.classList.add("latent-ready");
        emit("latent:ready");
        (window as unknown as { __latentReady?: boolean }).__latentReady = true;
        sync();
      });
    });

    return () => {
      disposed = true;
      cancelAnimationFrame(raf);
      window.clearTimeout(refreshT);
      document.removeEventListener("visibilitychange", sync);
      window.removeEventListener("resize", onResize);
      window.removeEventListener("pointermove", onPointer);
      window.removeEventListener("latent:query", onQuery);
      canvas.removeEventListener("webglcontextlost", onLost);
      ScrollTrigger.removeEventListener("refresh", measure);
      tween?.scrollTrigger?.kill();
      tween?.kill();
      ro.disconnect();
      root.classList.remove("latent-ready");
      [geo, dGeo, lGeo, qGeo].forEach((g) => g.dispose());
      [mat, dMat, lMat, qMat].forEach((m) => m.dispose());
      renderer.dispose();
      canvas.remove();
    };
  }, [reduced, lite, label]);

  return <div ref={hostRef} className="absolute inset-0" />;
}

export { CLUSTER_IDS };
