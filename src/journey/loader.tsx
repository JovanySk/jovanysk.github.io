"use client";

/*
  Game-style loading screen. The percentage is real: it comes from the THREE.LoadingManager
  in the canvas leaf (font, 3D engine, screenshots, particles, shader compile).
  Rendered in the static HTML but only shown with JS and without reduced motion (CSS).
  Skippable with the button, Enter, Escape or Space.
*/

import { useEffect, useRef, useState } from "react";
import { useSite } from "@/components/providers";

type Log = { key: string; text: string };

const MIN_MS = 900;
const MAX_MS = 9000;

export function Loader() {
  const { t } = useSite();
  const L = t.journey.loader;
  const [phase, setPhase] = useState<"loading" | "leaving" | "gone">("loading");
  const [logs, setLogs] = useState<Log[]>([]);
  const pctRef = useRef<HTMLSpanElement>(null);
  const barRef = useRef<HTMLDivElement>(null);
  const target = useRef(0);
  const shown = useRef(0);
  const start = useRef(0);
  const labels = useRef(L.items);
  labels.current = L.items;

  useEffect(() => {
    const root = document.documentElement;
    if (matchMedia("(prefers-reduced-motion: reduce)").matches) {
      setPhase("gone");
      return;
    }
    root.classList.add("is-loading");
    start.current = performance.now();
    let done = false;
    let raf = 0;

    const finish = () => {
      if (done) return;
      done = true;
      target.current = 1;
      const wait = Math.max(0, MIN_MS - (performance.now() - start.current));
      window.setTimeout(() => {
        setPhase("leaving");
        root.classList.remove("is-loading");
        window.setTimeout(() => setPhase("gone"), 750);
      }, wait + 250);
    };

    const tick = () => {
      shown.current += (target.current - shown.current) * 0.12;
      if (target.current - shown.current < 0.002) shown.current = target.current;
      const v = Math.round(shown.current * 100);
      if (pctRef.current) pctRef.current.textContent = String(v).padStart(3, "0");
      if (barRef.current) barRef.current.style.transform = `scaleX(${shown.current})`;
      if (!(done && shown.current >= 1)) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);

    const onProgress = (e: Event) => {
      const d = (e as CustomEvent<{ item: string; loaded: number; total: number }>).detail;
      target.current = Math.max(target.current, d.total ? d.loaded / d.total : 0);
      const item = d.item;
      const names = labels.current as Record<string, string>;
      const text = names[item] ?? (item.startsWith("/shots/") ? `${names.shots} · ${item.split("/").pop()}` : item);
      setLogs((xs) => [...xs.slice(-4), { key: item, text }]);
    };
    const onReady = () => finish();
    window.addEventListener("latent:progress", onProgress);
    window.addEventListener("latent:ready", onReady);
    window.addEventListener("latent:fail", onReady);
    if ((window as unknown as { __latentReady?: boolean }).__latentReady) finish();

    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Enter" || e.key === "Escape" || e.key === " ") finish();
    };
    window.addEventListener("keydown", onKey);
    const failsafe = window.setTimeout(finish, MAX_MS);

    return () => {
      cancelAnimationFrame(raf);
      window.clearTimeout(failsafe);
      window.removeEventListener("latent:progress", onProgress);
      window.removeEventListener("latent:ready", onReady);
      window.removeEventListener("latent:fail", onReady);
      window.removeEventListener("keydown", onKey);
      root.classList.remove("is-loading");
    };
  }, []);

  if (phase === "gone") return null;

  const skip = () => window.dispatchEvent(new KeyboardEvent("keydown", { key: "Escape" }));

  return (
    <div
      className={`latent-loader fixed inset-0 z-[80] flex-col justify-between bg-[#09090b] p-5 font-mono text-zinc-400 md:p-10 ${
        phase === "leaving" ? "is-leaving" : ""
      }`}
      role="status"
      aria-live="polite"
    >
      <div className="flex items-center justify-between text-[11px] uppercase tracking-[0.18em]">
        <span>JovanyOS · latent v2</span>
        <button
          type="button"
          onClick={skip}
          className="rounded-full px-3 py-1.5 uppercase tracking-[0.18em] text-zinc-300 ring-1 ring-white/15 transition-colors hover:text-emerald-400 hover:ring-emerald-400/50"
        >
          {L.skip} <span className="text-zinc-500">↵</span>
        </button>
      </div>

      <div className="flex flex-col items-center">
        <div className="loader-mark relative grid size-24 place-items-center">
          <span className="font-sans text-[44px] font-semibold leading-none tracking-[-0.07em] text-zinc-50">JM</span>
        </div>
        <p className="mt-10 flex items-baseline gap-3 text-[13px] text-zinc-400">
          <span>{L.label}</span>
          <span className="tabular-nums text-emerald-400">
            <span ref={pctRef}>000</span>%
          </span>
        </p>
        <div className="mt-4 h-px w-64 overflow-hidden bg-white/10">
          <div ref={barRef} className="h-full origin-left scale-x-0 bg-emerald-400" />
        </div>
      </div>

      <ul className="min-h-[5.5rem] space-y-1 text-[11px] leading-relaxed text-zinc-500">
        {logs.map((l) => (
          <li key={l.key} className="loader-log">
            <span className="text-emerald-500">ok</span> {l.text}
          </li>
        ))}
      </ul>
    </div>
  );
}
