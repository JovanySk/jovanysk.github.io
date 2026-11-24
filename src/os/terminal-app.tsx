"use client";

import { useEffect, useRef, useState } from "react";
import { useSite } from "../components/providers";
import type { Dict } from "../i18n";
import { complete, run, type Effect } from "./terminal";

type InEntry = { kind: "in"; text: string };
type OutEntry = { kind: "out"; lines: string[]; sources?: string[]; sourcesLabel?: string; dim?: boolean };
type BannerEntry = { kind: "banner" };
type Entry = (InEntry | OutEntry | BannerEntry) & { id: number };

// "JM" in the ANSI Shadow figlet font. Rendered in its own monospace stack so the
// box-drawing glyphs and the spaces always come from the same font (no drift).
const LOGO = [
  "     ██╗███╗   ███╗",
  "     ██║████╗ ████║",
  "     ██║██╔████╔██║",
  "██   ██║██║╚██╔╝██║",
  "╚█████╔╝██║ ╚═╝ ██║",
  " ╚════╝ ╚═╝     ╚═╝",
];
const PALETTE = ["#3f3f46", "#f87171", "#34d399", "#fcd34d", "#60a5fa", "#e879f9", "#67e8f9", "#f4f4f5"];

function Banner({ b }: { b: Dict["os"]["term"]["banner"] }) {
  const rows: [string, string][] = [
    ["OS", "JovanyOS 1.0"],
    b.role as [string, string],
    b.location as [string, string],
    b.stack as [string, string],
    b.focus as [string, string],
    b.projects as [string, string],
    b.shell as [string, string],
  ];
  const keyW = Math.max(...rows.map(([k]) => k.length)) + 1;
  return (
    <div className="mb-1">
      <div className="flex items-start gap-x-5">
        <pre
          aria-hidden="true"
          className="m-0 mt-1 shrink-0 text-[11px] leading-[1.2] text-emerald-400"
          style={{ fontFamily: 'Menlo, Consolas, "Cascadia Mono", "DejaVu Sans Mono", monospace' }}
        >
          {LOGO.join("\n")}
        </pre>
        <div className="min-w-0 flex-1">
          <div>
            <span className="font-semibold text-emerald-400">jovany</span>
            <span className="text-zinc-500">@</span>
            <span className="font-semibold text-emerald-400">jovanyos</span>
          </div>
          <div className="whitespace-pre text-zinc-600">{"-".repeat("jovany@jovanyos".length)}</div>
          {/* key column sized in ch so values stay aligned; long values wrap under themselves */}
          <dl className="grid gap-x-2" style={{ gridTemplateColumns: `${keyW + 1}ch 1fr` }}>
            {rows.map(([k, v]) => (
              <div key={k} className="contents">
                <dt className="font-semibold text-emerald-400">{k}:</dt>
                <dd className="m-0 text-zinc-200">{v}</dd>
              </div>
            ))}
          </dl>
          <div className="mt-2 flex gap-0" aria-hidden="true">
            {PALETTE.map((c) => (
              <span key={c} className="inline-block h-[13px] w-[22px]" style={{ background: c }} />
            ))}
          </div>
        </div>
      </div>
      <p className="mt-4 text-zinc-400">
        {b.hint[0]}
        <span className="text-emerald-400">{b.hint[1]}</span>
        {b.hint[2]}
        <span className="text-zinc-100">{b.hint[3]}</span>
      </p>
    </div>
  );
}

/** Reveals lines character by character (sequentially). Instant under reduced motion. */
function Typed({ lines, reduce, onTick }: { lines: string[]; reduce: boolean; onTick: () => void }) {
  const total = lines.reduce((a, l) => a + l.length, 0);
  const [shown, setShown] = useState(reduce ? total : 0);
  useEffect(() => {
    if (reduce || shown >= total) return;
    const step = Math.max(2, Math.ceil(total / 90)); // whole block in ~1.4 s max
    const id = window.setTimeout(() => {
      setShown((s) => Math.min(total, s + step));
      onTick();
    }, 16);
    return () => window.clearTimeout(id);
  }, [shown, total, reduce, onTick]);
  let left = reduce ? total : shown;
  return (
    <>
      {lines.map((l, i) => {
        const part = l.slice(0, Math.max(0, left));
        left -= l.length;
        return (
          <div key={i} className="whitespace-pre-wrap">
            {part || " "}
          </div>
        );
      })}
    </>
  );
}

export function TerminalApp({
  repos,
  reduce,
  crt,
  onEffect,
}: {
  repos: string[];
  reduce: boolean;
  crt: boolean;
  onEffect: (e: Effect) => void;
}) {
  const { t, lang } = useSite();
  const T = t.os.term;
  const nextId = useRef(1);
  const [entries, setEntries] = useState<Entry[]>(() => [{ id: 0, kind: "banner" }]);
  const [input, setInput] = useState("");
  const [history, setHistory] = useState<string[]>([]);
  const [hIndex, setHIndex] = useState<number | null>(null);
  const scroller = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const toBottom = useRef(() => {
    const el = scroller.current;
    if (el) el.scrollTop = el.scrollHeight;
  }).current;

  useEffect(toBottom, [entries, toBottom]);

  const push = (e: InEntry | OutEntry) => setEntries((xs) => [...xs, { ...e, id: nextId.current++ }]);

  const submit = (raw: string) => {
    const value = raw.trim();
    push({ kind: "in", text: raw });
    setInput("");
    setHIndex(null);
    if (!value) return;
    setHistory((h) => [...h.filter((x) => x !== value), value]);
    const res = run(value, { lang, t, repos });
    if (res.effect?.type === "clear") {
      setEntries([]);
      return;
    }
    if (res.lines.length) push({ kind: "out", lines: res.lines, sources: res.sources, sourcesLabel: T.sources });
    if (res.effect) onEffect(res.effect);
  };

  const onKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      submit(input);
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      if (!history.length) return;
      const i = hIndex === null ? history.length - 1 : Math.max(0, hIndex - 1);
      setHIndex(i);
      setInput(history[i]);
    } else if (e.key === "ArrowDown") {
      e.preventDefault();
      if (hIndex === null) return;
      const i = hIndex + 1;
      if (i >= history.length) {
        setHIndex(null);
        setInput("");
      } else {
        setHIndex(i);
        setInput(history[i]);
      }
    } else if (e.key === "Tab" && input.trim()) {
      e.preventDefault(); // autocomplete instead of leaving the field
      const options = complete(input, repos);
      if (options.length === 1) setInput(options[0] + (options[0].startsWith("open ") ? "" : " "));
      else if (options.length > 1) push({ kind: "out", lines: [`${T.suggestions}: ${options.join("  ")}`], dim: true });
    }
  };

  return (
    <div
      className={`relative flex h-full flex-col bg-[#0c0c0e] font-mono text-[12.5px] leading-relaxed text-zinc-200 ${crt ? "crt" : ""}`}
      onClick={() => inputRef.current?.focus()}
    >
      <div ref={scroller} className="min-h-0 flex-1 overflow-y-auto px-5 py-4" aria-live="polite">
        {entries.map((e, idx) =>
          e.kind === "banner" ? (
            <Banner key={e.id} b={T.banner} />
          ) : e.kind === "in" ? (
            <div key={e.id} className="mt-3 first:mt-0">
              <span className="text-emerald-400">jovany@os</span>
              <span className="text-zinc-400">:~$ </span>
              <span className="text-zinc-100">{e.text}</span>
            </div>
          ) : (
            <div key={e.id} className={`mt-1 ${e.dim ? "text-zinc-400" : "text-zinc-200"}`}>
              <Typed lines={e.lines} reduce={reduce || idx < entries.length - 1} onTick={toBottom} />
              {e.sources && e.sources.length > 0 && (
                <div className="mt-1.5 text-zinc-400">
                  {e.sourcesLabel}:{" "}
                  {e.sources.map((s, i) => (
                    <span key={s} className="text-emerald-400">
                      [{i + 1}] {s}
                      {i < e.sources!.length - 1 ? "  " : ""}
                    </span>
                  ))}
                </div>
              )}
            </div>
          ),
        )}
        <div className="mt-3 flex items-center">
          <label htmlFor="term-input" className="shrink-0">
            <span className="text-emerald-400">jovany@os</span>
            <span className="text-zinc-400">:~$&nbsp;</span>
            <span className="sr-only">{T.inputLabel}</span>
          </label>
          <input
            id="term-input"
            ref={inputRef}
            data-autofocus=""
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={onKeyDown}
            autoComplete="off"
            autoCapitalize="off"
            spellCheck={false}
            className="min-w-0 flex-1 bg-transparent text-zinc-100 caret-emerald-400 outline-none"
          />
        </div>
      </div>
    </div>
  );
}
