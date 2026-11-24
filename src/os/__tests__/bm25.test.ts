import { describe, expect, it } from "vitest";
import { answer, BM25, MIN_SCORE, tokenize } from "../bm25";
import { KB } from "../kb";
import { run } from "../terminal";
import { dict } from "../../i18n";

const repos = ["ordercontext-mcp", "smartticket", "plant-doctor-ai", "zyra-compiler"];

describe("tokenize", () => {
  it("is accent-insensitive and drops stopwords", () => {
    expect(tokenize("¿Qué búsqueda HÍBRIDA usaste?")).toEqual(["busqueda", "hibrida", "usaste"]);
    expect(tokenize("búsqueda")).toEqual(tokenize("busqueda"));
  });
});

describe("BM25 retrieval", () => {
  it("matches Spanish queries without accents against accented passages", () => {
    const a = answer("que hiciste en intesc con el asistente rag", "es");
    expect(a.found).toBe(true);
    if (a.found) {
      expect(a.text.join(" ")).toMatch(/INTESC/);
      expect(a.text[0]).toMatch(/[áéíóú]/); // answered in Spanish, with accents
    }
  });

  it("finds the hybrid search fact with an accentless query", () => {
    const hits = new BM25(KB).search("busqueda hibrida reranking", 1);
    expect(hits[0].passage.id).toBe("intesc-hybrid");
  });

  it("answers in English and cites sources", () => {
    const a = answer("What is the smartticket macro-F1?", "en");
    expect(a.found).toBe(true);
    if (a.found) {
      expect(a.text.join(" ")).toMatch(/0\.85/);
      expect(a.sources.length).toBeGreaterThan(0);
      expect(a.sources[0]).toMatch(/smartticket/);
    }
  });

  it("answers full stack questions: frontend, cloud/gcp, mobile, testing", () => {
    const top = (q: string) => new BM25(KB).search(q, 1)[0].passage.id;
    expect(top("what frontend do you use")).toBe("skills-frontend");
    expect(top("gcp")).toBe("skills-gcp");
    expect(top("experiencia en la nube aws kubernetes")).toBe("skills-cloud");
    expect(top("mobile android")).toBe("skills-mobile");
    expect(top("fullstack")).toBe("skills-fullstack");
    const a = answer("testing tools", "en");
    expect(a.found && a.text.join(" ")).toMatch(/Testcontainers/);
  });

  it("falls back below the threshold", () => {
    expect(answer("receta de pizza napolitana", "es").found).toBe(false);
    expect(answer("favorite football team", "en").found).toBe(false);
    expect(MIN_SCORE).toBeGreaterThan(0);
  });
});

describe("terminal commands", () => {
  const ctx = (lang: "es" | "en") => ({ lang, t: dict[lang], repos });

  it("returns citations for questions", () => {
    const r = run("¿cuántas pruebas tiene qaflow-api?", ctx("es"));
    expect(r.sources?.length).toBeGreaterThan(0);
  });

  it("returns the honest fallback", () => {
    const r = run("pizza", ctx("es"));
    expect(r.lines[0]).toBe(dict.es.os.term.notFound);
    expect(r.sources).toBeUndefined();
  });

  it("parses built-in commands", () => {
    expect(run("open zyra", ctx("en")).effect).toEqual({ type: "project", repo: "zyra-compiler" });
    expect(run("lang en", ctx("es")).lines[0]).toBe(dict.en.os.term.langSet);
    expect(run("sudo hire jovany", ctx("en")).effect).toEqual({ type: "hire" });
    expect(run("clear", ctx("en")).effect).toEqual({ type: "clear" });
  });
});
