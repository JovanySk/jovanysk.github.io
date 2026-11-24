"use client";

import { ArrowUpRight, type Icon } from "@phosphor-icons/react";
import { motion, useReducedMotion, type Variants } from "motion/react";

export const EASE = [0.32, 0.72, 0, 1] as const;
export const SPRING = { type: "spring", stiffness: 120, damping: 20 } as const;

/* Pill CTA with a "button-in-button" trailing icon that slides diagonally on hover. */
type CtaProps = {
  href: string;
  children: React.ReactNode;
  variant?: "primary" | "ghost";
  icon?: Icon;
  download?: boolean;
  external?: boolean;
  className?: string;
};

export function Cta({ href, children, variant = "primary", icon: IconCmp = ArrowUpRight, download, external, className = "" }: CtaProps) {
  const base =
    "group inline-flex items-center gap-3 whitespace-nowrap rounded-full py-1.5 pl-5 pr-1.5 text-sm font-medium transition-[transform,background-color,border-color,box-shadow] duration-300 ease-[cubic-bezier(0.32,0.72,0,1)] active:scale-[0.98]";
  const styles =
    variant === "primary"
      ? "bg-accent text-accent-fg shadow-[inset_0_1px_0_rgb(255_255_255/0.18)] hover:shadow-[inset_0_1px_0_rgb(255_255_255/0.18),0_8px_24px_-8px_var(--accent-line)]"
      : "text-fg ring-1 ring-line-strong ring-inset hover:ring-accent-line";
  const bubble =
    variant === "primary" ? "bg-accent-fg/15 text-accent-fg" : "bg-raised text-fg";
  return (
    <a
      href={href}
      download={download || undefined}
      target={external ? "_blank" : undefined}
      rel={external ? "noopener noreferrer" : undefined}
      className={`${base} ${styles} ${className}`}
    >
      {children}
      <span
        aria-hidden="true"
        className={`inline-flex size-8 items-center justify-center overflow-hidden rounded-full ${bubble}`}
      >
        <IconCmp
          size={15}
          weight="regular"
          className="transition-transform duration-300 ease-[cubic-bezier(0.32,0.72,0,1)] group-hover:translate-x-[1px] group-hover:-translate-y-[1px] group-hover:scale-110"
        />
      </span>
    </a>
  );
}

export const iconBtn =
  "inline-flex size-9 items-center justify-center rounded-full text-muted transition-[transform,color,background-color] duration-200 hover:bg-raised hover:text-fg active:scale-[0.96]";

export const chip =
  "inline-flex items-center rounded-full px-2.5 py-1 font-mono text-[11px] leading-none text-muted ring-1 ring-inset ring-line";

/* Reveal: fade-up with a slight blur, once. Children can stagger via <RevealItem>. */
const container: Variants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.07 } },
};
const item: Variants = {
  hidden: { opacity: 0, y: 32, filter: "blur(4px)" },
  show: { opacity: 1, y: 0, filter: "blur(0px)", transition: { duration: 0.8, ease: EASE } },
};

export function Reveal({
  children,
  className,
  stagger = false,
  as = "div",
  id,
}: {
  children: React.ReactNode;
  className?: string;
  stagger?: boolean;
  as?: "div" | "ul" | "header";
  id?: string;
}) {
  const reduce = useReducedMotion();
  const Comp = motion[as];
  return (
    <Comp
      id={id}
      className={className}
      variants={stagger ? container : item}
      initial={reduce ? false : "hidden"}
      whileInView="show"
      viewport={{ once: true, amount: 0.15 }}
    >
      {children}
    </Comp>
  );
}

export function RevealItem({
  children,
  className,
  as = "div",
}: {
  children: React.ReactNode;
  className?: string;
  as?: "div" | "li";
}) {
  const Comp = motion[as];
  return (
    <Comp className={className} variants={item}>
      {children}
    </Comp>
  );
}

export function SectionTitle({ children, id }: { children: React.ReactNode; id?: string }) {
  return (
    <h2
      id={id}
      className="max-w-[24ch] text-balance text-3xl font-semibold leading-[1.08] tracking-[-0.03em] text-fg md:text-[2.75rem]"
    >
      {children}
    </h2>
  );
}
