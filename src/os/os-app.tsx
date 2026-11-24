"use client";

/*
  JovanyOS: desktop-first playground. Loaded only on /os (own lazy chunk).
  The three.js wallpaper is a sibling leaf of the Motion-driven windows, never nested inside them.
*/

import { useCallback, useEffect, useMemo, useReducer, useRef, useState } from "react";
import dynamic from "next/dynamic";
import Image from "next/image";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import {
  Briefcase,
  EnvelopeSimple,
  FilePdf,
  FolderSimple,
  GithubLogo,
  LinkedinLogo,
  Moon,
  SignOut,
  Sun,
  TerminalWindow,
} from "@phosphor-icons/react";
import { LINKS } from "../i18n";
import { useSite } from "../components/providers";
import { Cta, EASE } from "../components/ui";
import { buildProjects, PROJECT_ICONS } from "./projects-data";
import { focusedId, initialWm, wmReducer, type Win, type WinKind } from "./wm";
import { WindowFrame } from "./window-frame";
import { Dock, type DockItem } from "./dock";
import { ContactApp, ExperienceApp, FinderApp, ProjectApp } from "./apps";
import { TerminalApp } from "./terminal-app";
import type { Effect } from "./terminal";

const EmbeddingScene = dynamic(() => import("../components/embedding-scene"), { ssr: false });

const KONAMI = ["ArrowUp", "ArrowUp", "ArrowDown", "ArrowDown", "ArrowLeft", "ArrowRight", "ArrowLeft", "ArrowRight", "b", "a"];

const SIZES: Record<WinKind, { w: number; h: number }> = {
  finder: { w: 640, h: 470 },
  terminal: { w: 660, h: 420 },
  experience: { w: 600, h: 560 },
  contact: { w: 460, h: 330 },
  project: { w: 640, h: 580 },
};

/* ---------------- small pieces ---------------- */

function Clock({ lang, label }: { lang: string; label: string }) {
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    const id = window.setInterval(() => setNow(new Date()), 15000);
    return () => window.clearInterval(id);
  }, []);
  const text = new Intl.DateTimeFormat(lang === "es" ? "es-MX" : "en-US", { hour: "2-digit", minute: "2-digit" }).format(now);
  return (
    <time aria-label={label} dateTime={now.toISOString()} className="font-mono text-xs tabular-nums text-fg">
      {text}
    </time>
  );
}

function Boot({ onDone, label, hint }: { onDone: () => void; label: string; hint: string }) {
  useEffect(() => {
    const skip = () => onDone();
    window.addEventListener("keydown", skip);
    window.addEventListener("pointerdown", skip);
    return () => {
      window.removeEventListener("keydown", skip);
      window.removeEventListener("pointerdown", skip);
    };
  }, [onDone]);
  return (
    <motion.div
      role="status"
      aria-label={label}
      className="fixed inset-0 z-[90] flex flex-col items-center justify-center gap-6 bg-bg"
      exit={{ opacity: 0 }}
      transition={{ duration: 0.4, ease: EASE }}
    >
      <span className="flex size-16 items-center justify-center rounded-[1.1rem] bg-fg text-2xl font-semibold tracking-[-0.06em] text-bg">
        JM
      </span>
      <div className="h-px w-48 overflow-hidden bg-line">
        <motion.div
          className="h-full origin-left bg-accent"
          initial={{ scaleX: 0 }}
          animate={{ scaleX: 1 }}
          transition={{ duration: 1.2, ease: EASE }}
          onAnimationComplete={onDone}
        />
      </div>
      <p className="font-mono text-[11px] text-muted">{hint}</p>
    </motion.div>
  );
}

function Wallpaper({ reduce, label, alt }: { reduce: boolean; label: string; alt: string }) {
  const [failed, setFailed] = useState(false);
  const onFail = useCallback(() => setFailed(true), []);
  return (
    <div className="absolute inset-0" aria-hidden={false}>
      <div
        aria-hidden="true"
        className="absolute inset-0"
        style={{ background: "radial-gradient(60% 60% at 50% 45%, var(--glow), transparent 70%)" }}
      />
      {failed ? (
        <div className="absolute inset-0 flex items-center justify-center">
          <Image src="/hero-embedding-light.png" alt={alt} width={784} height={889} className="h-[80%] w-auto dark:hidden" />
          <Image src="/hero-embedding-dark.png" alt={alt} width={784} height={889} className="hidden h-[80%] w-auto dark:block" />
        </div>
      ) : (
        <EmbeddingScene reduced={reduce} label={label} onFail={onFail} />
      )}
    </div>
  );
}

/* ---------------- desktop ---------------- */

function Desktop({ reduce }: { reduce: boolean }) {
  const { t, lang, theme, toggleLang, toggleTheme, setLangTo, setThemeTo } = useSite();
  const [wm, dispatch] = useReducer(wmReducer, initialWm);
  const [crt, setCrt] = useState(false);
  const bounds = useRef<HTMLDivElement>(null);
  const spawnRef = useRef(0);
  const projects = useMemo(() => buildProjects(t), [t]);
  const repos = useMemo(() => projects.map((p) => p.repo), [projects]);
  const focused = focusedId(wm);

  const open = useCallback(
    (kind: WinKind, repo?: string, note?: string, at?: { x: number; y: number }) => {
      // new windows land near the centre, cascading a little each time
      const n = (spawnRef.current++ % 5) - 2;
      const pos = at ?? { x: Math.max(16, (window.innerWidth - SIZES[kind].w) / 2 + n * 28), y: Math.max(16, 56 + (n + 2) * 22) };
      dispatch({ type: "open", kind, repo, note, at: pos });
    },
    [],
  );

  // first visit: Finder on the left, Terminal on the right
  useEffect(() => {
    const w = window.innerWidth;
    open("finder", undefined, undefined, { x: Math.max(24, w * 0.06), y: 40 });
    open("terminal", undefined, undefined, { x: Math.max(24, w - SIZES.terminal.w - w * 0.06), y: 150 });
  }, [open]);

  // Konami code toggles CRT scanlines on the terminal
  useEffect(() => {
    let i = 0;
    const onKey = (e: KeyboardEvent) => {
      const k = e.key.length === 1 ? e.key.toLowerCase() : e.key;
      i = k === KONAMI[i] ? i + 1 : k === KONAMI[0] ? 1 : 0;
      if (i === KONAMI.length) {
        i = 0;
        setCrt((c) => !c);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const openCv = useCallback(() => window.open(LINKS.cv[lang], "_blank", "noopener"), [lang]);

  const onEffect = useCallback(
    (e: Effect) => {
      switch (e.type) {
        case "open":
          return open(e.kind);
        case "project":
          return open("project", e.repo);
        case "cv":
          return openCv();
        case "lang":
          return setLangTo(e.lang);
        case "theme":
          return setThemeTo(e.theme);
        case "hire":
          return open("contact", undefined, "hire");
      }
    },
    [open, openCv, setLangTo, setThemeTo],
  );

  const isOpen = (id: string) => wm.wins.some((w) => w.id === id);

  const dock: DockItem[] = [
    { id: "finder", label: t.os.apps.finder, icon: FolderSimple, onSelect: () => open("finder"), running: isOpen("finder") },
    ...projects
      .filter((p) => p.featured)
      .map((p) => ({
        id: `project:${p.repo}`,
        label: p.repo,
        icon: PROJECT_ICONS[p.repo],
        onSelect: () => open("project", p.repo),
        running: isOpen(`project:${p.repo}`),
      })),
    { id: "terminal", label: t.os.apps.terminal, icon: TerminalWindow, onSelect: () => open("terminal"), running: isOpen("terminal"), sepBefore: true },
    { id: "experience", label: t.os.apps.experience, icon: Briefcase, onSelect: () => open("experience"), running: isOpen("experience") },
    { id: "contact", label: t.os.apps.contact, icon: EnvelopeSimple, onSelect: () => open("contact"), running: isOpen("contact") },
    { id: "cv", label: t.os.apps.cv, icon: FilePdf, onSelect: openCv, sepBefore: true },
    { id: "github", label: t.os.apps.github, icon: GithubLogo, onSelect: () => window.open(LINKS.github, "_blank", "noopener") },
    { id: "linkedin", label: t.os.apps.linkedin, icon: LinkedinLogo, onSelect: () => window.open(LINKS.linkedin, "_blank", "noopener") },
  ];

  const titleOf = (w: Win) =>
    w.kind === "project" ? w.repo! : w.kind === "finder" ? t.os.apps.finder : w.kind === "terminal" ? t.os.apps.terminal : w.kind === "experience" ? t.os.apps.experience : t.os.apps.contact;

  const contentOf = (w: Win) => {
    switch (w.kind) {
      case "finder":
        return <FinderApp projects={projects} onOpen={(repo) => open("project", repo)} />;
      case "terminal":
        return <TerminalApp repos={repos} reduce={reduce} crt={crt} onEffect={onEffect} />;
      case "experience":
        return <ExperienceApp />;
      case "contact":
        return <ContactApp note={w.note} />;
      case "project": {
        const p = projects.find((x) => x.repo === w.repo);
        return p ? <ProjectApp p={p} /> : null;
      }
    }
  };

  const focusedWin = wm.wins.find((w) => w.id === focused);

  return (
    <div className="fixed inset-0 overflow-hidden bg-bg text-fg">
      <Wallpaper reduce={reduce} label={t.hero.sceneAria} alt={t.hero.sceneAlt} />

      {/* menu bar */}
      <header className="glass fixed inset-x-0 top-0 z-[70] flex h-10 items-center justify-between border-b border-line px-3 text-[13px]">
        <div className="flex items-center gap-2.5">
          <span aria-hidden="true" className="inline-flex size-6 items-center justify-center rounded-full bg-fg font-mono text-[9px] font-semibold text-bg">
            JM
          </span>
          <h1 className="font-semibold tracking-[-0.01em]">{t.os.brand}</h1>
          {focusedWin && <span className="text-muted">{titleOf(focusedWin)}</span>}
        </div>
        <div className="flex items-center gap-1">
          <button type="button" onClick={toggleLang} aria-label={t.nav.langAria} className="rounded-full px-2.5 py-1 font-mono text-xs hover:bg-raised">
            {t.nav.langLabel}
          </button>
          <button
            type="button"
            onClick={toggleTheme}
            aria-label={theme === "dark" ? t.nav.themeToLight : t.nav.themeToDark}
            className="inline-flex size-7 items-center justify-center rounded-full hover:bg-raised"
          >
            {theme === "dark" ? <Sun size={14} aria-hidden="true" /> : <Moon size={14} aria-hidden="true" />}
          </button>
          <span className="mx-2">
            <Clock lang={lang} label={t.os.clockLabel} />
          </span>
          <a
            href="/"
            aria-label={t.os.exitAria}
            className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs hover:bg-raised"
          >
            <SignOut size={14} aria-hidden="true" />
            {t.os.exit}
          </a>
        </div>
      </header>

      {/* desktop area: windows live here, constrained to it */}
      <main ref={bounds} aria-label={t.os.desktopLabel} className="absolute inset-x-0 bottom-0 top-10">
        <AnimatePresence>
          {wm.wins.map((w) => {
            const size = SIZES[w.kind];
            return (
              <WindowFrame
                key={w.id}
                win={w}
                title={titleOf(w)}
                width={size.w}
                height={size.h}
                focused={focused === w.id}
                reduce={reduce}
                bounds={bounds}
                labels={{ close: t.os.close, minimize: t.os.minimize }}
                onFocus={() => dispatch({ type: "focus", id: w.id })}
                onClose={() => dispatch({ type: "close", id: w.id })}
                onMinimize={() => dispatch({ type: "minimize", id: w.id })}
              >
                {contentOf(w)}
              </WindowFrame>
            );
          })}
        </AnimatePresence>
      </main>

      <Dock items={dock} label={t.os.dockLabel} reduce={reduce} />
    </div>
  );
}

/* ---------------- entry ---------------- */

export default function OsApp() {
  const { t } = useSite();
  const reduce = !!useReducedMotion();
  const [desktop, setDesktop] = useState<boolean | null>(null);
  const [booting, setBooting] = useState(true);
  const endBoot = useCallback(() => setBooting(false), []);

  useEffect(() => {
    const check = () => setDesktop(window.innerWidth >= 1024 && !matchMedia("(pointer: coarse)").matches);
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);

  if (desktop === null) return null;

  if (!desktop) {
    return (
      <main className="flex min-h-[100dvh] flex-col items-start justify-center gap-6 px-6">
        <span className="flex size-14 items-center justify-center rounded-[1.1rem] bg-fg text-xl font-semibold tracking-[-0.06em] text-bg">JM</span>
        <h1 className="max-w-[18ch] text-balance text-3xl font-semibold leading-tight tracking-[-0.03em]">{t.os.mobileTitle}</h1>
        <p className="max-w-[44ch] text-muted">{t.os.mobileBody}</p>
        <Cta href="/">{t.os.backClassic}</Cta>
      </main>
    );
  }

  return (
    <>
      <Desktop reduce={reduce} />
      <AnimatePresence>{booting && !reduce && <Boot key="boot" onDone={endBoot} label={t.os.booting} hint={t.os.skipHint} />}</AnimatePresence>
    </>
  );
}
