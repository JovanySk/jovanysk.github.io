"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import {
  AppWindow,
  ArrowDown,
  ArrowUp,
  Brain,
  Briefcase,
  ChatCircleText,
  Cpu,
  Database,
  DownloadSimple,
  GithubLogo,
  House,
  LinkedinLogo,
  MagnifyingGlass,
  Stack,
  Translate,
  type Icon,
} from "@phosphor-icons/react";
import { LINKS } from "@/i18n";
import { useSite } from "./providers";
import { EASE } from "./ui";

export function openPalette() {
  window.dispatchEvent(new CustomEvent("open-palette"));
}

type Item = { id: string; group: string; label: string; icon: Icon; run: () => void };

const normalize = (s: string) =>
  s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "");

export function CommandPalette() {
  const { t, lang, toggleLang } = useSite();
  const reduce = useReducedMotion();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [index, setIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const restoreRef = useRef<HTMLElement | null>(null);

  const close = useCallback(() => setOpen(false), []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setOpen((o) => !o);
      }
    };
    const onOpen = () => setOpen(true);
    window.addEventListener("keydown", onKey);
    window.addEventListener("open-palette", onOpen);
    return () => {
      window.removeEventListener("keydown", onKey);
      window.removeEventListener("open-palette", onOpen);
    };
  }, []);

  useEffect(() => {
    if (open) {
      restoreRef.current = document.activeElement as HTMLElement | null;
      setQuery("");
      setIndex(0);
      requestAnimationFrame(() => inputRef.current?.focus());
      const prev = document.body.style.overflow;
      document.body.style.overflow = "hidden";
      return () => {
        document.body.style.overflow = prev;
        restoreRef.current?.focus?.();
      };
    }
  }, [open]);

  const go = (id: string) => () => {
    document.getElementById(id)?.scrollIntoView({ behavior: reduce ? "auto" : "smooth" });
  };

  const items: Item[] = useMemo(
    () => [
      { id: "top", group: t.palette.sections, label: t.nav.home.split(",")[0], icon: House, run: go("top") },
      { id: "intesc", group: t.palette.sections, label: `01 · ${t.journey.zones.intesc}`, icon: Briefcase, run: go("intesc") },
      { id: "ai", group: t.palette.sections, label: `02 · ${t.journey.titles.ai}`, icon: Brain, run: go("ai") },
      { id: "backend", group: t.palette.sections, label: `03 · ${t.journey.titles.backend}`, icon: Database, run: go("backend") },
      { id: "systems", group: t.palette.sections, label: `04 · ${t.journey.titles.systems}`, icon: Cpu, run: go("systems") },
      { id: "stack", group: t.palette.sections, label: `05 · ${t.journey.titles.stack}`, icon: Stack, run: go("stack") },
      { id: "contact", group: t.palette.sections, label: t.nav.contact, icon: ChatCircleText, run: go("contact") },
      { id: "lang", group: t.palette.actions, label: t.palette.switchLang, icon: Translate, run: toggleLang },
      {
        id: "os",
        group: t.palette.actions,
        label: t.os.enter,
        icon: AppWindow,
        run: () => {
          window.location.href = "/os/";
        },
      },
      {
        id: "cv",
        group: t.palette.actions,
        label: t.palette.cv,
        icon: DownloadSimple,
        run: () => {
          const a = document.createElement("a");
          a.href = LINKS.cv[lang];
          a.download = "";
          a.click();
        },
      },
      {
        id: "email",
        group: t.palette.actions,
        label: t.palette.email,
        icon: ChatCircleText,
        run: () => {
          window.location.href = `mailto:${LINKS.email}`;
        },
      },
      { id: "gh", group: t.palette.links, label: t.palette.github, icon: GithubLogo, run: () => window.open(LINKS.github, "_blank", "noopener") },
      { id: "li", group: t.palette.links, label: t.palette.linkedin, icon: LinkedinLogo, run: () => window.open(LINKS.linkedin, "_blank", "noopener") },
    ],
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [t, lang, toggleLang, reduce],
  );

  const filtered = useMemo(() => {
    const q = normalize(query.trim());
    return q ? items.filter((i) => normalize(i.label).includes(q) || normalize(i.group).includes(q)) : items;
  }, [items, query]);

  useEffect(() => setIndex(0), [query]);

  const select = (item: Item) => {
    setOpen(false);
    // let the dialog close (and scroll lock release) before acting
    requestAnimationFrame(() => item.run());
  };

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Escape") {
      e.preventDefault();
      close();
    } else if (e.key === "ArrowDown") {
      e.preventDefault();
      setIndex((i) => (filtered.length ? (i + 1) % filtered.length : 0));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setIndex((i) => (filtered.length ? (i - 1 + filtered.length) % filtered.length : 0));
    } else if (e.key === "Enter") {
      e.preventDefault();
      const it = filtered[index];
      if (it) select(it);
    } else if (e.key === "Tab") {
      e.preventDefault(); // keep focus inside the dialog
    }
  };

  let lastGroup = "";

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          key="palette"
          className="fixed inset-0 z-[65] flex items-start justify-center px-4 pt-[14vh]"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: reduce ? 0 : 0.2 }}
        >
          <div className="absolute inset-0 bg-bg/60 backdrop-blur-[2px]" onClick={close} aria-hidden="true" />
          <motion.div
            role="dialog"
            aria-modal="true"
            aria-label={t.palette.title}
            onKeyDown={onKeyDown}
            initial={reduce ? false : { opacity: 0, y: 12, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={reduce ? { opacity: 0 } : { opacity: 0, y: 8, scale: 0.98 }}
            transition={{ duration: 0.35, ease: EASE }}
            className="shell relative w-full max-w-lg bg-bg/80"
          >
            <div className="core">
              <div className="flex items-center gap-3 border-b border-line px-4">
                <MagnifyingGlass size={18} weight="regular" className="shrink-0 text-muted" aria-hidden="true" />
                <input
                  ref={inputRef}
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder={t.palette.placeholder}
                  aria-label={t.palette.placeholder}
                  role="combobox"
                  aria-expanded="true"
                  aria-controls="palette-list"
                  aria-activedescendant={filtered[index] ? `cmd-${filtered[index].id}` : undefined}
                  aria-autocomplete="list"
                  className="h-14 w-full bg-transparent text-[15px] text-fg outline-none placeholder:text-muted"
                />
                <kbd className="shrink-0 rounded-full px-2 py-1 font-mono text-[10px] text-muted ring-1 ring-inset ring-line">
                  esc
                </kbd>
              </div>
              <ul id="palette-list" role="listbox" aria-label={t.palette.title} className="max-h-[50vh] overflow-y-auto p-2">
                {filtered.length === 0 && <li className="px-3 py-8 text-center text-sm text-muted">{t.palette.empty}</li>}
                {filtered.map((it, i) => {
                  const showGroup = it.group !== lastGroup;
                  lastGroup = it.group;
                  const IconCmp = it.icon;
                  const activeItem = i === index;
                  return (
                    <li key={it.id} role="presentation">
                      {showGroup && (
                        <div role="presentation" className="px-3 pb-1.5 pt-3 text-xs font-medium text-muted">
                          {it.group}
                        </div>
                      )}
                      <div
                        id={`cmd-${it.id}`}
                        role="option"
                        aria-selected={activeItem}
                        onMouseMove={() => setIndex(i)}
                        onClick={() => select(it)}
                        className={`flex cursor-pointer items-center gap-3 rounded-full px-3 py-2.5 text-sm transition-colors ${
                          activeItem ? "bg-raised text-fg" : "text-muted"
                        }`}
                      >
                        <IconCmp size={16} weight="regular" aria-hidden="true" className={activeItem ? "text-accent" : ""} />
                        {it.label}
                      </div>
                    </li>
                  );
                })}
              </ul>
              <div className="flex items-center gap-4 border-t border-line px-4 py-2.5 font-mono text-[11px] text-muted">
                <span className="inline-flex items-center gap-1">
                  <ArrowUp size={12} aria-hidden="true" />
                  <ArrowDown size={12} aria-hidden="true" />
                  {t.palette.hintNav}
                </span>
                <span>enter {t.palette.hintSelect}</span>
                <span>esc {t.palette.hintClose}</span>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
