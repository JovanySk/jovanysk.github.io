"use client";

/*
  Game HUD: one top bar (mark, zone readout, palette, OS entry, language), a minimap
  of the 5 clusters with the camera dot (desktop), a bottom progress bar and
  keyboard zone jumps (J/K, ArrowUp/ArrowDown). Scroll updates write to refs.
*/

import { useCallback, useEffect, useRef, useState } from "react";
import { AppWindow, MagnifyingGlass } from "@phosphor-icons/react";
import { useSite } from "@/components/providers";
import { openPalette } from "@/components/command-palette";
import {
  activeZone,
  buildHolds,
  CLUSTER_IDS,
  hudLabel,
  landingScroll,
  minimapPoints,
  scrollToPath,
  stepZone,
  ZONE_IDS,
  type Hold,
} from "./zones";

const MAP = minimapPoints();
// minimap box: 56 x 200, origin top
const MX = (x: number) => 10 + x * 36;
const MY = (y: number) => 14 + y * 172;

function useLayout() {
  const geo = useRef<{ tops: number[]; holds: Hold[] }>({ tops: [], holds: [] });
  const measure = useCallback(() => {
    const els = ZONE_IDS.map((id) => document.getElementById(id));
    if (els.some((e) => !e)) return;
    const tops = els.map((e) => e!.getBoundingClientRect().top + window.scrollY);
    const heights = els.map((e) => e!.offsetHeight);
    const max = Math.max(0, document.documentElement.scrollHeight - window.innerHeight);
    geo.current = { tops, holds: buildHolds(tops, heights, window.innerHeight, max) };
  }, []);
  return { geo, measure };
}

export function Hud() {
  const { t, toggleLang } = useSite();
  const J = t.journey;
  const [zone, setZone] = useState(0);
  const [isMac, setIsMac] = useState(true);
  const { geo, measure } = useLayout();
  const barRef = useRef<HTMLDivElement>(null);
  const pctRef = useRef<HTMLSpanElement>(null);
  const dotRef = useRef<SVGCircleElement>(null);
  const zoneRef = useRef(0);

  const go = useCallback(
    (index: number) => {
      measure();
      const { holds, tops } = geo.current;
      if (!holds.length) return;
      const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
      window.scrollTo({ top: landingScroll(index, holds, tops), behavior: reduce ? "auto" : "smooth" });
    },
    [geo, measure],
  );

  useEffect(() => {
    setIsMac(/Mac|iPhone|iPad/.test(navigator.platform || navigator.userAgent));
    let raf = 0;
    const update = () => {
      raf = 0;
      const y = window.scrollY;
      const { tops, holds } = geo.current;
      const max = Math.max(1, document.documentElement.scrollHeight - window.innerHeight);
      const p = Math.min(1, Math.max(0, y / max));
      if (barRef.current) barRef.current.style.transform = `scaleX(${p})`;
      if (pctRef.current) pctRef.current.textContent = String(Math.round(p * 100)).padStart(3, "0");
      if (tops.length) {
        const z = activeZone(y, window.innerHeight, tops);
        if (z !== zoneRef.current) {
          zoneRef.current = z;
          setZone(z);
        }
        // camera dot: path parameter -> polyline through the 5 clusters (origin above, exit below)
        const u = scrollToPath(y, holds) * (ZONE_IDS.length - 1);
        const pts = [{ x: 0.5, y: -0.06 }, ...MAP, { x: 0.5, y: 1.06 }];
        const i = Math.min(pts.length - 2, Math.floor(u));
        const f = u - i;
        const cx = MX(pts[i].x + (pts[i + 1].x - pts[i].x) * f);
        const cy = MY(pts[i].y + (pts[i + 1].y - pts[i].y) * f);
        dotRef.current?.setAttribute("cx", cx.toFixed(1));
        dotRef.current?.setAttribute("cy", cy.toFixed(1));
      }
    };
    const onScroll = () => {
      if (!raf) raf = requestAnimationFrame(update);
    };
    const remeasure = () => {
      measure();
      onScroll();
    };
    remeasure();
    const ro = new ResizeObserver(remeasure);
    ro.observe(document.body);
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", remeasure);

    const onKey = (e: KeyboardEvent) => {
      if (e.metaKey || e.ctrlKey || e.altKey) return;
      const el = e.target as HTMLElement | null;
      if (el && (el.isContentEditable || /^(INPUT|TEXTAREA|SELECT)$/.test(el.tagName))) return;
      if (document.querySelector("[role=dialog]")) return;
      const k = e.key.toLowerCase();
      const dir = k === "j" || e.key === "ArrowDown" ? 1 : k === "k" || e.key === "ArrowUp" ? -1 : 0;
      if (!dir) return;
      e.preventDefault();
      go(stepZone(zoneRef.current, dir as 1 | -1, ZONE_IDS.length));
    };
    window.addEventListener("keydown", onKey);
    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", remeasure);
      window.removeEventListener("keydown", onKey);
    };
  }, [geo, measure, go]);

  const label = hudLabel(zone, J.hud, J.zones);
  const pill =
    "inline-flex h-8 items-center gap-1.5 rounded-full px-3 font-mono text-[11px] uppercase tracking-[0.14em] text-zinc-400 ring-1 ring-inset ring-white/10 transition-colors duration-200 hover:text-zinc-50 hover:ring-white/25";

  return (
    <>
      <a
        href="#main"
        className="sr-only rounded-full bg-emerald-400 px-4 py-2 text-zinc-950 focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[90]"
      >
        {t.meta.skip}
      </a>

      {/* top bar */}
      <header className="hud-top pointer-events-none fixed inset-x-0 top-0 z-50 flex h-16 items-center justify-between gap-3 px-4 md:px-8">
        <div className="pointer-events-auto flex min-w-0 items-center gap-3">
          <a
            href="#top"
            onClick={(e) => {
              e.preventDefault();
              go(0);
            }}
            aria-label={t.nav.home}
            className="grid size-9 shrink-0 place-items-center rounded-[10px] bg-zinc-50 font-sans text-[13px] font-semibold tracking-[-0.04em] text-zinc-950 transition-transform active:scale-95"
          >
            JM
          </a>
          <p className="flex min-w-0 items-center gap-2 font-mono text-[11px] uppercase tracking-[0.16em] text-zinc-300" aria-live="polite">
            <span aria-hidden="true" className="hud-blink size-1.5 shrink-0 bg-emerald-400" />
            <span className="truncate">{label}</span>
          </p>
        </div>
        <div className="pointer-events-auto flex shrink-0 items-center gap-1.5">
          <button type="button" onClick={openPalette} aria-label={t.nav.cmdAria} aria-keyshortcuts={isMac ? "Meta+K" : "Control+K"} className={pill}>
            <MagnifyingGlass size={13} aria-hidden="true" />
            <kbd className="hidden font-mono sm:inline">{isMac ? "⌘K" : "Ctrl K"}</kbd>
          </button>
          <a href="/os/" className={`${pill} hidden lg:inline-flex pointer-coarse:hidden`}>
            <AppWindow size={13} className="text-emerald-400" aria-hidden="true" />
            JovanyOS
          </a>
          <button type="button" onClick={toggleLang} aria-label={t.nav.langAria} className={pill}>
            {t.nav.langLabel}
          </button>
        </div>
      </header>

      {/* minimap */}
      <nav aria-label={J.hud.minimap} className="fixed right-5 top-1/2 z-40 hidden -translate-y-1/2 lg:block xl:right-8">
        <div className="hud-panel rounded-2xl px-2 py-3">
          <div className="relative h-[200px] w-[56px]">
            <svg width="56" height="200" viewBox="0 0 56 200" aria-hidden="true" className="absolute inset-0 overflow-visible">
              <polyline
                points={[`${MX(0.5)},${MY(-0.06)}`, ...MAP.map((p) => `${MX(p.x)},${MY(p.y)}`), `${MX(0.5)},${MY(1.06)}`].join(" ")}
                fill="none"
                stroke="rgb(255 255 255 / 0.14)"
                strokeDasharray="2 3"
              />
              <circle ref={dotRef} cx={MX(0.5)} cy={MY(-0.06)} r="2.6" fill="#34d399" className="hud-cam" />
            </svg>
            <ul>
              {MAP.map((p, i) => {
                const active = zone === i + 1;
                const left = p.x > 0.5;
                return (
                  <li key={p.id} className="absolute" style={{ left: MX(p.x) - 9, top: MY(p.y) - 9 }}>
                    <button
                      type="button"
                      onClick={() => go(i + 1)}
                      aria-label={J.hud.jump(J.zones[CLUSTER_IDS[i]])}
                      aria-current={active ? "step" : undefined}
                      className="group relative grid size-[18px] place-items-center rounded-full"
                    >
                      <span
                        className={`block rounded-full border transition-all duration-300 ${
                          active ? "size-2.5 border-emerald-400 bg-emerald-400/20" : "size-[7px] border-white/40 bg-white/10 group-hover:border-white"
                        }`}
                      />
                      <span
                        aria-hidden="true"
                        className={`absolute top-1/2 -translate-y-1/2 font-mono text-[8px] ${left ? "right-[18px]" : "left-[18px]"} ${
                          active ? "text-emerald-400" : "text-zinc-500 group-hover:text-zinc-200"
                        }`}
                      >
                        {String(i + 1).padStart(2, "0")}
                      </span>
                    </button>
                  </li>
                );
              })}
            </ul>
          </div>
          <p className="mt-2 border-t border-white/10 pt-2 text-center font-mono text-[9px] tracking-[0.12em] text-zinc-500" title={J.hud.keysHint}>
            {J.hud.keys}
          </p>
        </div>
      </nav>

      {/* progress */}
      <div className="pointer-events-none fixed inset-x-0 bottom-0 z-40" role="presentation">
        <div className="flex items-center justify-between px-4 pb-2 font-mono text-[10px] uppercase tracking-[0.16em] text-zinc-500 md:px-8">
          <span>
            <span ref={pctRef}>000</span>%
          </span>
          <span className="hidden sm:inline">{J.hud.keysHint}</span>
        </div>
        <div className="h-[2px] w-full bg-white/[0.06]">
          <div ref={barRef} className="h-full origin-left scale-x-0 bg-emerald-400/80" />
        </div>
      </div>
    </>
  );
}
