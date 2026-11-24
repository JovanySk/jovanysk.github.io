"use client";

import { Fragment, useRef } from "react";
import { motion, useMotionValue, useSpring, useTransform, type MotionValue } from "motion/react";
import type { Icon } from "@phosphor-icons/react";

export type DockItem = { id: string; label: string; icon: Icon; onSelect: () => void; running?: boolean; sepBefore?: boolean };

const BASE = 46;
const MAX = 70;

function DockIcon({ item, mouseX, reduce }: { item: DockItem; mouseX: MotionValue<number>; reduce: boolean }) {
  const ref = useRef<HTMLButtonElement>(null);
  const distance = useTransform(mouseX, (x) => {
    const r = ref.current?.getBoundingClientRect();
    return r ? x - (r.left + r.width / 2) : Infinity;
  });
  const target = useTransform(distance, [-150, 0, 150], [BASE, MAX, BASE], { clamp: true });
  const size = useSpring(target, { stiffness: 260, damping: 22, mass: 0.4 });
  const IconCmp = item.icon;

  return (
    <li className="relative flex flex-col items-center">
      <motion.button
        ref={ref}
        type="button"
        onClick={item.onSelect}
        aria-label={item.label}
        style={reduce ? { width: BASE, height: BASE } : { width: size, height: size }}
        whileTap={reduce ? undefined : { scale: 0.92 }}
        className="group/dock relative rounded-[1.05rem] bg-[var(--shell)] p-[3px] ring-1 ring-inset ring-line focus-visible:rounded-[1.05rem]"
      >
        <span className="flex h-full w-full items-center justify-center rounded-[calc(1.05rem-3px)] bg-card text-fg shadow-[inset_0_1px_0_var(--highlight),0_0_0_1px_var(--line)] transition-colors group-hover/dock:text-accent">
          <IconCmp weight="regular" className="size-[46%]" aria-hidden="true" />
        </span>
        <span
          role="tooltip"
          className="pointer-events-none absolute -top-9 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-full bg-fg px-2.5 py-1 text-[11px] font-medium text-bg opacity-0 transition-opacity group-hover/dock:opacity-100 group-focus-visible/dock:opacity-100"
        >
          {item.label}
        </span>
      </motion.button>
      <span
        aria-hidden="true"
        className={`mt-1 h-[3px] w-3 rounded-full transition-colors ${item.running ? "bg-accent" : "bg-transparent"}`}
      />
    </li>
  );
}

export function Dock({ items, label, reduce }: { items: DockItem[]; label: string; reduce: boolean }) {
  const mouseX = useMotionValue(Infinity);
  return (
    <nav aria-label={label} className="pointer-events-none fixed inset-x-0 bottom-3 z-[60] flex justify-center">
      <motion.ul
        onMouseMove={(e) => !reduce && mouseX.set(e.clientX)}
        onMouseLeave={() => mouseX.set(Infinity)}
        className="glass pointer-events-auto flex items-end gap-2 rounded-[1.75rem] px-3 pb-1.5 pt-3 shadow-[0_20px_50px_-20px_rgb(0_0_0/0.45)] ring-1 ring-line"
      >
        {items.map((it) => (
          <Fragment key={it.id}>
            {it.sepBefore && <li aria-hidden="true" className="mx-1 mb-3 h-10 w-px self-end bg-line-strong" />}
            <DockIcon item={it} mouseX={mouseX} reduce={reduce} />
          </Fragment>
        ))}
      </motion.ul>
    </nav>
  );
}
