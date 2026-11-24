"use client";

import { useEffect, useState } from "react";
import { motion, useMotionTemplate, useMotionValue, useReducedMotion, useSpring, useTransform } from "motion/react";

const MAX_TILT = 6; // degrees

/**
 * Link card with a subtle perspective tilt that follows the pointer and an accent
 * spotlight on hover. Tilt only on fine pointers and never under reduced motion.
 * Motion values only: no React state per pointer move.
 */
export function TiltCard({
  href,
  label,
  className = "",
  children,
}: {
  href: string;
  label: string;
  className?: string;
  children: React.ReactNode;
}) {
  const reduce = useReducedMotion();
  const [fine, setFine] = useState(false);
  useEffect(() => {
    const mq = matchMedia("(hover: hover) and (pointer: fine)");
    setFine(mq.matches);
    const on = () => setFine(mq.matches);
    mq.addEventListener("change", on);
    return () => mq.removeEventListener("change", on);
  }, []);
  const tilt = fine && !reduce;

  const px = useMotionValue(0.5);
  const py = useMotionValue(0.5);
  const sx = useMotionValue(-999);
  const sy = useMotionValue(-999);
  const spring = { stiffness: 120, damping: 20, mass: 0.6 };
  const rotateX = useSpring(useTransform(py, [0, 1], [MAX_TILT, -MAX_TILT]), spring);
  const rotateY = useSpring(useTransform(px, [0, 1], [-MAX_TILT, MAX_TILT]), spring);
  const spotlight = useMotionTemplate`radial-gradient(420px circle at ${sx}px ${sy}px, var(--accent-soft), transparent 65%)`;
  const ring = useMotionTemplate`radial-gradient(260px circle at ${sx}px ${sy}px, var(--accent-line), transparent 70%)`;

  const onMove = (e: React.PointerEvent<HTMLAnchorElement>) => {
    if (!fine) return;
    const r = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - r.left;
    const y = e.clientY - r.top;
    sx.set(x);
    sy.set(y);
    if (tilt) {
      px.set(x / r.width);
      py.set(y / r.height);
    }
  };
  const onLeave = () => {
    px.set(0.5);
    py.set(0.5);
    sx.set(-999);
    sy.set(-999);
  };

  return (
    <motion.a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      aria-label={label}
      onPointerMove={onMove}
      onPointerLeave={onLeave}
      whileTap={reduce ? undefined : { scale: 0.99 }}
      style={tilt ? { rotateX, rotateY, transformPerspective: 1100 } : undefined}
      className={`focus-card group relative block h-full ${className}`}
    >
      {/* accent border highlight that follows the pointer (masked to the 1px shell edge) */}
      <motion.span
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 rounded-[1.75rem] opacity-0 transition-opacity duration-300 group-hover:opacity-100"
        style={{
          background: ring,
          padding: 1,
          WebkitMask: "linear-gradient(#000 0 0) content-box exclude, linear-gradient(#000 0 0)",
          mask: "linear-gradient(#000 0 0) content-box exclude, linear-gradient(#000 0 0)",
        }}
      />
      <div className="shell h-full">
        <div className="core h-full">
          {children}
          <motion.span
            aria-hidden="true"
            className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-300 group-hover:opacity-100"
            style={{ background: spotlight }}
          />
        </div>
      </div>
    </motion.a>
  );
}
