"use client";

import { useEffect, useRef } from "react";
import { motion, useDragControls } from "motion/react";
import { Minus, X } from "@phosphor-icons/react";
import type { Win } from "./wm";

const FOCUSABLE =
  'a[href], button:not([disabled]), input:not([disabled]), textarea, select, [tabindex]:not([tabindex="-1"])';

type Props = {
  win: Win;
  title: string;
  width: number;
  height?: number;
  focused: boolean;
  reduce: boolean;
  bounds: React.RefObject<HTMLDivElement | null>;
  labels: { close: string; minimize: string };
  onFocus: () => void;
  onClose: () => void;
  onMinimize: () => void;
  children: React.ReactNode;
};

export function WindowFrame({ win, title, width, height, focused, reduce, bounds, labels, onFocus, onClose, onMinimize, children }: Props) {
  const controls = useDragControls();
  const ref = useRef<HTMLDivElement>(null);

  // Move keyboard focus into the window when it becomes the focused one.
  useEffect(() => {
    const el = ref.current;
    if (!focused || !el || win.minimized) return;
    if (el.contains(document.activeElement)) return;
    const marker = el.querySelector<HTMLElement>("[data-autofocus]");
    const target = (marker?.matches(FOCUSABLE) ? marker : marker?.querySelector<HTMLElement>(FOCUSABLE)) ?? el;
    target.focus({ preventScroll: true });
  }, [focused, win.minimized]);

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Escape") {
      e.stopPropagation();
      onClose();
      return;
    }
    if (e.key !== "Tab" || !ref.current) return;
    const items = [...ref.current.querySelectorAll<HTMLElement>(FOCUSABLE)].filter((n) => n.offsetParent !== null);
    if (!items.length) return;
    const first = items[0];
    const last = items[items.length - 1];
    if (e.shiftKey && (document.activeElement === first || document.activeElement === ref.current)) {
      e.preventDefault();
      last.focus();
    } else if (!e.shiftKey && document.activeElement === last) {
      e.preventDefault();
      first.focus();
    }
  };

  const spring = reduce ? { duration: 0 } : { type: "spring" as const, stiffness: 320, damping: 30 };

  return (
    // Outer layer: dragging (x/y). Inner layer: open/minimize animation. Kept separate so they never fight.
    <motion.div
      drag
      dragControls={controls}
      dragListener={false}
      dragMomentum={false}
      dragElastic={0}
      dragConstraints={bounds}
      onPointerDown={onFocus}
      className="absolute"
      style={{ left: win.x, top: win.y, zIndex: win.z, width, pointerEvents: win.minimized ? "none" : undefined }}
    >
      <motion.div
        ref={ref}
        role="dialog"
        aria-label={title}
        aria-hidden={win.minimized || undefined}
        tabIndex={-1}
        onKeyDown={onKeyDown}
        onFocus={onFocus}
        initial={reduce ? false : { opacity: 0, scale: 0.6, y: 260 }}
        animate={
          win.minimized
            ? { opacity: 0, scale: 0.5, y: 320, transitionEnd: { visibility: "hidden" } }
            : { opacity: 1, scale: 1, y: 0, visibility: "visible" }
        }
        exit={reduce ? { opacity: 0, transition: { duration: 0 } } : { opacity: 0, scale: 0.8, y: 160 }}
        transition={spring}
        style={{ transformOrigin: "50% 100%" }}
        className={`shell bg-bg/40 outline-none backdrop-blur-sm ${focused ? "shadow-[0_30px_80px_-24px_rgb(0_0_0/0.45)]" : "opacity-95 shadow-[0_16px_40px_-20px_rgb(0_0_0/0.35)]"}`}
      >
        <div className="core flex flex-col" style={{ height }}>
          <div
            onPointerDown={(e) => {
              onFocus();
              controls.start(e);
            }}
            className="flex h-11 shrink-0 cursor-grab items-center gap-2 border-b border-line px-4 active:cursor-grabbing"
          >
            <button
              type="button"
              aria-label={labels.close}
              onPointerDown={(e) => e.stopPropagation()}
              onClick={onClose}
              className="group/tl inline-flex size-3.5 items-center justify-center rounded-full bg-line-strong text-fg transition-colors hover:bg-accent hover:text-accent-fg"
            >
              <X size={8} weight="bold" className="opacity-0 group-hover/tl:opacity-100" aria-hidden="true" />
            </button>
            <button
              type="button"
              aria-label={labels.minimize}
              onPointerDown={(e) => e.stopPropagation()}
              onClick={onMinimize}
              className="group/tl inline-flex size-3.5 items-center justify-center rounded-full bg-line-strong text-fg transition-colors hover:bg-raised"
            >
              <Minus size={8} weight="bold" className="opacity-0 group-hover/tl:opacity-100" aria-hidden="true" />
            </button>
            <p className={`pointer-events-none flex-1 truncate pr-10 text-center text-[13px] ${focused ? "text-fg" : "text-muted"}`}>
              {title}
            </p>
          </div>
          <div className="min-h-0 flex-1 overflow-auto">{children}</div>
        </div>
      </motion.div>
    </motion.div>
  );
}
