"use client";

/* Motion micro-interactions for the journey (kept out of the three/GSAP leaf). */

import { useEffect, useRef, useState } from "react";
import { motion, useMotionTemplate, useMotionValue, useReducedMotion, useSpring, useTransform } from "motion/react";
import type { ClusterId } from "./zones";

const EASE = [0.22, 1, 0.36, 1] as const;

function useFinePointer() {
  const [fine, setFine] = useState(false);
  useEffect(() => {
    const mq = matchMedia("(hover: hover) and (pointer: fine)");
    setFine(mq.matches);
    const on = () => setFine(mq.matches);
    mq.addEventListener("change", on);
    return () => mq.removeEventListener("change", on);
  }, []);
  return fine;
}

/** Giant display title with a per-letter reveal. Screen readers get the plain text. */
export function SplitTitle({ text, id, className = "" }: { text: string; id?: string; className?: string }) {
  const reduce = useReducedMotion();
  const words = text.split(" ");
  let n = 0;
  return (
    <motion.h2
      id={id}
      aria-label={text}
      className={`display-title ${className}`}
      initial={reduce ? false : "hidden"}
      whileInView="show"
      viewport={{ once: true, amount: 0.5 }}
      transition={{ staggerChildren: 0.028 }}
    >
      {words.map((w, wi) => (
        <span key={wi} aria-hidden="true" className="inline-block overflow-hidden whitespace-nowrap pb-[0.08em] align-bottom">
          {[...w].map((ch) => {
            const i = n++;
            return (
              <motion.span
                key={i}
                className="inline-block"
                variants={{
                  hidden: { y: "105%", opacity: 0 },
                  show: { y: "0%", opacity: 1, transition: { duration: 0.9, ease: EASE } },
                }}
              >
                {ch}
              </motion.span>
            );
          })}
          {wi < words.length - 1 && <span className="inline-block">&nbsp;</span>}
        </span>
      ))}
    </motion.h2>
  );
}

/** Fade-up reveal for panels. */
export function Rise({ children, className = "", delay = 0 }: { children: React.ReactNode; className?: string; delay?: number }) {
  const reduce = useReducedMotion();
  return (
    <motion.div
      className={className}
      initial={reduce ? false : { opacity: 0, y: 36 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.2 }}
      transition={{ duration: 0.9, ease: EASE, delay }}
    >
      {children}
    </motion.div>
  );
}

/** Magnetic wrapper: the child drifts toward the pointer (fine pointers only). */
export function Magnetic({ children, strength = 0.3 }: { children: React.ReactNode; strength?: number }) {
  const reduce = useReducedMotion();
  const fine = useFinePointer();
  const on = fine && !reduce;
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const sx = useSpring(x, { stiffness: 220, damping: 16, mass: 0.4 });
  const sy = useSpring(y, { stiffness: 220, damping: 16, mass: 0.4 });
  return (
    <motion.span
      className="inline-block"
      style={on ? { x: sx, y: sy } : undefined}
      onPointerMove={(e) => {
        if (!on) return;
        const r = e.currentTarget.getBoundingClientRect();
        x.set((e.clientX - (r.left + r.width / 2)) * strength);
        y.set((e.clientY - (r.top + r.height / 2)) * strength);
      }}
      onPointerLeave={() => {
        x.set(0);
        y.set(0);
      }}
    >
      {children}
    </motion.span>
  );
}

export function query(detail: { cluster: ClusterId; slot: number; x: number; y: number } | null) {
  window.dispatchEvent(new CustomEvent("latent:query", { detail }));
}

/**
 * Glass project card: tilt + spotlight on fine pointers, and on hover it fires the
 * query ray in the 3D scene from the card centre to its sub-cluster.
 */
export function ProjectCard({
  href,
  label,
  cluster,
  slot,
  className = "",
  children,
}: {
  href: string;
  label: string;
  cluster: ClusterId;
  slot: number;
  className?: string;
  children: React.ReactNode;
}) {
  const reduce = useReducedMotion();
  const fine = useFinePointer();
  const tilt = fine && !reduce;
  const ref = useRef<HTMLAnchorElement>(null);
  const px = useMotionValue(0.5);
  const py = useMotionValue(0.5);
  const sx = useMotionValue(-999);
  const sy = useMotionValue(-999);
  const spring = { stiffness: 140, damping: 18, mass: 0.5 };
  const rotateX = useSpring(useTransform(py, [0, 1], [5, -5]), spring);
  const rotateY = useSpring(useTransform(px, [0, 1], [-5, 5]), spring);
  const spot = useMotionTemplate`radial-gradient(380px circle at ${sx}px ${sy}px, rgb(52 211 153 / 0.10), transparent 65%)`;
  const edge = useMotionTemplate`radial-gradient(240px circle at ${sx}px ${sy}px, rgb(52 211 153 / 0.55), transparent 70%)`;

  const fire = () => {
    const r = ref.current?.getBoundingClientRect();
    if (r) query({ cluster, slot, x: r.left + r.width / 2, y: r.top + r.height / 2 });
  };

  return (
    <motion.a
      ref={ref}
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      aria-label={label}
      onPointerEnter={fire}
      onFocus={fire}
      onBlur={() => query(null)}
      onPointerMove={(e) => {
        if (!fine) return;
        const r = e.currentTarget.getBoundingClientRect();
        sx.set(e.clientX - r.left);
        sy.set(e.clientY - r.top);
        if (tilt) {
          px.set((e.clientX - r.left) / r.width);
          py.set((e.clientY - r.top) / r.height);
        }
      }}
      onPointerLeave={() => {
        px.set(0.5);
        py.set(0.5);
        sx.set(-999);
        sy.set(-999);
        query(null);
      }}
      style={tilt ? { rotateX, rotateY, transformPerspective: 1000 } : undefined}
      className={`focus-card group relative block ${className}`}
    >
      <motion.span
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 z-10 rounded-[18px] opacity-0 transition-opacity duration-300 group-hover:opacity-100"
        style={{
          background: edge,
          padding: 1,
          WebkitMask: "linear-gradient(#000 0 0) content-box exclude, linear-gradient(#000 0 0)",
          mask: "linear-gradient(#000 0 0) content-box exclude, linear-gradient(#000 0 0)",
        }}
      />
      <div className="glass-card relative h-full overflow-hidden rounded-[18px]">
        {children}
        <motion.span aria-hidden="true" className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-300 group-hover:opacity-100" style={{ background: spot }} />
      </div>
    </motion.a>
  );
}
