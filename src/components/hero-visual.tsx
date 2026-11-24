"use client";

/*
  Right side of the hero. Deliberately NOT a Motion tree: the three.js scene lives
  here as its own lazy chunk, and entrance is handled with CSS.
*/

import { useCallback, useEffect, useState } from "react";
import dynamic from "next/dynamic";
import Image from "next/image";
import { useSite } from "./providers";

const EmbeddingScene = dynamic(() => import("./embedding-scene"), { ssr: false });

type Mode = "pending" | "webgl" | "static";

export function HeroVisual() {
  const { t } = useSite();
  const [mode, setMode] = useState<Mode>("pending");
  const [reduced, setReduced] = useState(false);

  useEffect(() => {
    const mq = matchMedia("(prefers-reduced-motion: reduce)");
    setReduced(mq.matches);
    const onChange = () => setReduced(mq.matches);
    mq.addEventListener("change", onChange);

    const coarse = matchMedia("(pointer: coarse)").matches;
    const cores = navigator.hardwareConcurrency || 8;
    const lowEnd = coarse && cores <= 4;
    if (lowEnd) {
      setMode("static");
      return () => mq.removeEventListener("change", onChange);
    }
    // Let hero text paint and hydrate first; then pull the three.js chunk.
    const ric = "requestIdleCallback" in window;
    const id: number = ric
      ? window.requestIdleCallback(() => setMode("webgl"), { timeout: 1200 })
      : window.setTimeout(() => setMode("webgl"), 300);
    return () => {
      mq.removeEventListener("change", onChange);
      if (ric) window.cancelIdleCallback(id);
      else window.clearTimeout(id);
    };
  }, []);

  const onFail = useCallback(() => setMode("static"), []);

  return (
    <div className="relative h-[340px] w-full sm:h-[420px] lg:h-[min(560px,calc(100dvh-12rem))]">
      {/* one very subtle accent glow behind the canvas */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 -z-10"
        style={{ background: "radial-gradient(50% 50% at 55% 45%, var(--glow), transparent 70%)" }}
      />

      <div className="shell absolute inset-0 bottom-10 left-8 sm:left-12">
        <div className="core h-full bg-[radial-gradient(120%_90%_at_50%_40%,var(--card),var(--bg))]">
          {mode === "webgl" && <EmbeddingScene reduced={reduced} label={t.hero.sceneAria} onFail={onFail} />}
          {mode === "static" && (
            <div className="scene-in absolute inset-0">
              <Image
                src="/hero-embedding-light.png"
                alt={t.hero.sceneAlt}
                width={784}
                height={889}
                className="h-full w-full object-cover dark:hidden"
              />
              <Image
                src="/hero-embedding-dark.png"
                alt={t.hero.sceneAlt}
                width={784}
                height={889}
                className="hidden h-full w-full object-cover dark:block"
              />
            </div>
          )}
        </div>
      </div>

      {/* JM monogram tile, overlapping the canvas */}
      <div className="shell absolute bottom-0 left-0 size-28 bg-bg/70 backdrop-blur-sm sm:size-32">
        <div className="core flex h-full items-center justify-center !bg-fg">
          <span
            aria-hidden="true"
            className="font-sans text-[2.6rem] font-semibold leading-none tracking-[-0.06em] text-bg sm:text-5xl"
          >
            JM
          </span>
        </div>
      </div>
    </div>
  );
}
