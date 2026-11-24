"use client";

import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { AppWindow, MagnifyingGlass, Moon, Sun } from "@phosphor-icons/react";
import { LINKS } from "@/i18n";
import { useSite } from "./providers";
import { Cta, EASE, iconBtn } from "./ui";

export const SECTION_IDS = ["projects", "experience", "skills", "contact"] as const;

export function openPalette() {
  window.dispatchEvent(new CustomEvent("open-palette"));
}

function useScrollSpy(ids: readonly string[]) {
  const [active, setActive] = useState<string | null>(null);
  useEffect(() => {
    const seen = new Map<string, boolean>();
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => seen.set(e.target.id, e.isIntersecting));
        const first = ids.find((id) => seen.get(id));
        setActive(first ?? null);
      },
      // a thin band across the upper middle of the viewport
      { rootMargin: "-35% 0px -60% 0px", threshold: 0 },
    );
    ids.forEach((id) => {
      const el = document.getElementById(id);
      if (el) io.observe(el);
    });
    return () => io.disconnect();
  }, [ids]);
  return active;
}

export function Nav() {
  const { t, toggleLang, theme, toggleTheme } = useSite();
  const reduce = useReducedMotion();
  const active = useScrollSpy(SECTION_IDS);
  const [open, setOpen] = useState(false);
  const [isMac, setIsMac] = useState(true);
  const menuBtn = useRef<HTMLButtonElement>(null);
  const firstLink = useRef<HTMLAnchorElement>(null);

  useEffect(() => {
    setIsMac(/Mac|iPhone|iPad/.test(navigator.platform || navigator.userAgent));
  }, []);

  // mobile overlay: lock scroll, Escape to close, focus management
  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    firstLink.current?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener("keydown", onKey);
      menuBtn.current?.focus();
    };
  }, [open]);

  const labels: Record<(typeof SECTION_IDS)[number], string> = {
    projects: t.nav.projects,
    experience: t.nav.experience,
    skills: t.nav.skills,
    contact: t.nav.contact,
  };

  return (
    <>
      <a
        href="#main"
        className="sr-only rounded-full bg-accent px-4 py-2 text-accent-fg focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[70]"
      >
        {t.meta.skip}
      </a>
      <header className="pointer-events-none fixed inset-x-0 top-0 z-50 flex justify-center px-4 pt-4 md:pt-5">
        <motion.div
          initial={reduce ? false : { opacity: 0, y: -12, filter: "blur(4px)" }}
          animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
          transition={{ duration: 0.8, ease: EASE }}
          className="glass pointer-events-auto flex h-14 w-full max-w-md items-center justify-between gap-1 rounded-full py-1.5 pl-1.5 pr-1.5 shadow-[0_1px_2px_rgb(24_24_27/0.05),0_12px_32px_-12px_rgb(24_24_27/0.18)] ring-1 ring-line md:w-max md:max-w-none"
        >
          <a
            href="#top"
            aria-label={t.nav.home}
            className="inline-flex size-11 shrink-0 items-center justify-center rounded-full bg-fg font-mono text-[13px] font-semibold tracking-tight text-bg transition-transform duration-200 active:scale-[0.96]"
          >
            JM
          </a>

          <nav aria-label={t.nav.primary} className="hidden md:block">
            <ul className="flex items-center px-1">
              {SECTION_IDS.map((id) => (
                <li key={id}>
                  <a
                    href={`#${id}`}
                    aria-current={active === id ? "true" : undefined}
                    className={`relative isolate block rounded-full px-3.5 py-2 text-sm transition-colors duration-200 ${
                      active === id ? "text-fg" : "text-muted hover:text-fg"
                    }`}
                  >
                    {active === id && (
                      <motion.span
                        layoutId="nav-active"
                        transition={reduce ? { duration: 0 } : { type: "spring", stiffness: 380, damping: 32 }}
                        className="absolute inset-0 -z-10 rounded-full bg-raised ring-1 ring-inset ring-line"
                      />
                    )}
                    {labels[id]}
                  </a>
                </li>
              ))}
            </ul>
          </nav>

          <div className="flex items-center gap-0.5">
            <span aria-hidden="true" className="mx-1.5 hidden h-5 w-px bg-line md:block" />
            <button
              type="button"
              onClick={openPalette}
              aria-label={t.nav.cmdAria}
              aria-keyshortcuts={isMac ? "Meta+K" : "Control+K"}
              className="hidden h-9 items-center gap-1.5 rounded-full px-2.5 text-muted transition-colors hover:bg-raised hover:text-fg lg:inline-flex"
            >
              <MagnifyingGlass size={15} weight="regular" aria-hidden="true" />
              <kbd className="font-mono text-[11px] leading-none">{isMac ? "⌘K" : "Ctrl K"}</kbd>
            </button>
            <a
              href="/os/"
              className="mr-1 hidden h-9 items-center gap-1.5 rounded-full bg-raised px-3 text-[13px] font-medium text-fg ring-1 ring-inset ring-line transition-[transform,box-shadow] duration-200 hover:ring-accent-line active:scale-[0.97] lg:inline-flex pointer-coarse:hidden"
            >
              <AppWindow size={15} weight="regular" className="text-accent" aria-hidden="true" />
              {t.os.enter}
            </a>
            <button
              type="button"
              onClick={toggleLang}
              aria-label={t.nav.langAria}
              className={`${iconBtn} w-auto px-2.5 font-mono text-xs font-medium`}
            >
              {t.nav.langLabel}
            </button>
            <button
              type="button"
              onClick={toggleTheme}
              aria-label={theme === "dark" ? t.nav.themeToLight : t.nav.themeToDark}
              className={iconBtn}
            >
              {theme === "dark" ? (
                <Sun size={16} weight="regular" aria-hidden="true" />
              ) : (
                <Moon size={16} weight="regular" aria-hidden="true" />
              )}
            </button>
            <button
              ref={menuBtn}
              type="button"
              onClick={() => setOpen((o) => !o)}
              aria-expanded={open}
              aria-controls="mobile-menu"
              aria-label={open ? t.nav.menuClose : t.nav.menuOpen}
              className="relative ml-1 inline-flex size-11 items-center justify-center rounded-full bg-raised md:hidden"
            >
              <motion.span
                aria-hidden="true"
                className="absolute h-[1.5px] w-4 rounded-full bg-fg"
                animate={open ? { rotate: 45, y: 0 } : { rotate: 0, y: -3 }}
                transition={reduce ? { duration: 0 } : { duration: 0.4, ease: EASE }}
              />
              <motion.span
                aria-hidden="true"
                className="absolute h-[1.5px] w-4 rounded-full bg-fg"
                animate={open ? { rotate: -45, y: 0 } : { rotate: 0, y: 3 }}
                transition={reduce ? { duration: 0 } : { duration: 0.4, ease: EASE }}
              />
            </button>
          </div>
        </motion.div>
      </header>

      <AnimatePresence>
        {open && (
          <motion.div
            id="mobile-menu"
            role="dialog"
            aria-modal="true"
            aria-label={t.nav.primary}
            className="fixed inset-0 z-40 flex flex-col justify-between bg-bg/95 px-6 pb-10 pt-28 backdrop-blur-xl md:hidden"
            initial={reduce ? { opacity: 1 } : { opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.35, ease: EASE }}
          >
            <nav aria-label={t.nav.primary}>
              <motion.ul
                className="flex flex-col gap-2"
                initial="hidden"
                animate="show"
                variants={{ hidden: {}, show: { transition: { staggerChildren: 0.06, delayChildren: 0.05 } } }}
              >
                {SECTION_IDS.map((id, i) => (
                  <motion.li
                    key={id}
                    variants={{
                      hidden: reduce ? { opacity: 1 } : { opacity: 0, y: 24 },
                      show: { opacity: 1, y: 0, transition: { duration: 0.6, ease: EASE } },
                    }}
                  >
                    <a
                      ref={i === 0 ? firstLink : undefined}
                      href={`#${id}`}
                      onClick={() => setOpen(false)}
                      className="block rounded-full py-2 text-4xl font-medium tracking-[-0.03em] text-fg"
                    >
                      {labels[id]}
                    </a>
                  </motion.li>
                ))}
              </motion.ul>
            </nav>
            <div onClick={() => setOpen(false)}>
              <Cta href={`mailto:${LINKS.email}`}>{t.contact.cta}</Cta>
              <p className="mt-6 font-mono text-xs text-muted">
                {LINKS.email}
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
