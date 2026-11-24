"use client";

/*
  Fixed layer behind the page. Decides the rendering tier, then lazy-loads the
  three.js + GSAP leaf as its own chunk. No Motion in this tree.
*/

import { useEffect, useState } from "react";
import dynamic from "next/dynamic";
import { useSite } from "@/components/providers";

const LatentCanvas = dynamic(() => import("./latent-canvas"), { ssr: false });

type Tier = { reduced: boolean; lite: boolean } | null;

export function Backdrop() {
  const { t } = useSite();
  const [tier, setTier] = useState<Tier>(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    const reduced = matchMedia("(prefers-reduced-motion: reduce)").matches;
    const coarse = matchMedia("(pointer: coarse)").matches;
    const cores = navigator.hardwareConcurrency || 8;
    const lite = window.innerWidth < 768 || (coarse && cores <= 4);
    setTier({ reduced, lite });
    const onFail = () => setFailed(true);
    window.addEventListener("latent:fail", onFail);
    return () => window.removeEventListener("latent:fail", onFail);
  }, []);

  return (
    <div aria-hidden={failed || undefined} className="latent-backdrop pointer-events-none fixed inset-0 z-0">
      {tier && !failed && <LatentCanvas reduced={tier.reduced} lite={tier.lite} label={t.hero.sceneAria} />}
      {failed && (
        // eslint-disable-next-line @next/next/no-img-element
        <img src="/hero-embedding-dark.png" alt="" className="absolute inset-0 h-full w-full object-cover opacity-30" />
      )}
      {/* contrast: vignette + a soft floor so text never sits on raw bright points */}
      <div className="latent-vignette absolute inset-0" />
    </div>
  );
}
