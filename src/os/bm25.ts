// Tiny BM25 retriever for the JovanyOS terminal. Pure TS, runs in the browser.
// Accent-insensitive, bilingual (ES/EN) tokenization with stopwords and light plural stemming.

import { KB, type Passage } from "./kb";

export type Lang = "es" | "en";

const STOP = new Set(
  (
    "a al algo como con cual cuales cuando de del donde el ella ellas ellos en era es esa ese eso esta este esto estos fue ha han hay la las le les lo los mas me mi mis muy no nos o para pero por que se sin sobre su sus te tiene tu tus un una uno unos y ya yo " +
    "hiciste haces hace tienes tenes cuantos cuantas cuanto cual dime cuentame puedes sabes " +
    "a about an and are as at be by can could did do does for from has have how i in is it its me my of on or tell than that the their them there these they this to was what when where which who why will with you your"
  ).split(/\s+/),
);

export function normalize(s: string): string {
  return s.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "");
}

export function tokenize(s: string): string[] {
  return normalize(s)
    .split(/[^a-z0-9.]+/)
    .map((t) => t.replace(/^\.+|\.+$/g, ""))
    .filter((t) => t.length > 1 && !STOP.has(t))
    .map((t) => (t.length > 4 && t.endsWith("es") && !/\d/.test(t) ? t.slice(0, -2) : t.length > 3 && t.endsWith("s") && !/\d/.test(t) ? t.slice(0, -1) : t));
}

type Doc = { p: Passage; tf: Map<string, number>; len: number };

export class BM25 {
  private docs: Doc[];
  private df = new Map<string, number>();
  private avgLen: number;
  constructor(passages: Passage[], private k1 = 1.2, private b = 0.75) {
    this.docs = passages.map((p) => {
      const toks = tokenize(`${p.es} ${p.en} ${p.tags ?? ""} ${p.source}`);
      const tf = new Map<string, number>();
      toks.forEach((t) => tf.set(t, (tf.get(t) ?? 0) + 1));
      tf.forEach((_, t) => this.df.set(t, (this.df.get(t) ?? 0) + 1));
      return { p, tf, len: toks.length };
    });
    this.avgLen = this.docs.reduce((a, d) => a + d.len, 0) / Math.max(1, this.docs.length);
  }

  idf(term: string): number {
    const n = this.df.get(term) ?? 0;
    const N = this.docs.length;
    return Math.log(1 + (N - n + 0.5) / (n + 0.5));
  }

  search(query: string, k = 3): { passage: Passage; score: number }[] {
    const q = [...new Set(tokenize(query))];
    if (!q.length) return [];
    return this.docs
      .map((d) => {
        let score = 0;
        for (const term of q) {
          const f = d.tf.get(term);
          if (!f) continue;
          score += (this.idf(term) * f * (this.k1 + 1)) / (f + this.k1 * (1 - this.b + (this.b * d.len) / this.avgLen));
        }
        return { passage: d.p, score };
      })
      .filter((r) => r.score > 0)
      .sort((a, b) => b.score - a.score)
      .slice(0, k);
  }
}

export const MIN_SCORE = 2.2;

export type Answer = { found: true; text: string[]; sources: string[] } | { found: false };

let shared: BM25 | null = null;
export function getIndex() {
  return (shared ??= new BM25(KB));
}

/** Retrieve top passages and compose a short answer with citations. */
export function answer(query: string, lang: Lang, index: BM25 = getIndex()): Answer {
  const hits = index.search(query, 3);
  if (!hits.length || hits[0].score < MIN_SCORE) return { found: false };
  const top = hits[0].score;
  const kept = hits.filter((h, i) => i === 0 || h.score >= top * 0.7);
  const sources = [...new Set(kept.map((h) => h.passage.source))];
  return { found: true, text: kept.map((h) => h.passage[lang]), sources };
}
