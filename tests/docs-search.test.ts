// Module 3: the support-docs search behind Ask Copper's search_docs tool.
// Pure checks: no AI key needed, nothing is embedded.
import { existsSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import {
  chunkDocument,
  cleanPage,
  groupSentences,
  splitSentences,
} from "@/lib/copper/docs/chunk";
import {
  citationFor,
  cosine,
  docsIndex,
  nearest,
  pageUrl,
  TOP_K,
} from "@/lib/copper/docs/search";
import { DOCUMENTS } from "@/lib/copper/documents";
import {
  NOT_FOUND,
  COPPER_INSTRUCTIONS,
} from "@/lib/copper/assistant/instructions";

describe("chunking", () => {
  it("drops the running header and footer lines", () => {
    const page =
      "COPPER STATE LABS\nCSL-UG-0101-EN Rev. C 1\n© 2026 Copper State Labs\nHello there.";
    expect(cleanPage(page)).toBe("Hello there.");
  });

  it("splits sentences and groups a few per passage, with one sentence of overlap", () => {
    const sentences = splitSentences("One. Two. Three. Four. Five.");
    expect(sentences).toEqual(["One.", "Two.", "Three.", "Four.", "Five."]);
    const passages = groupSentences(sentences);
    expect(passages[0]).toBe("One. Two. Three.");
    expect(passages[1].startsWith("Three.")).toBe(true);
    expect(passages.join(" ")).toContain("Five.");
  });

  it("starts every passage with its document title and keeps its page", () => {
    const passages = chunkDocument({ id: "doc", title: "Doc Title" }, [
      "First page text.",
      "Second page text.",
    ]);
    expect(passages.map((p) => p.page)).toEqual([1, 2]);
    for (const p of passages)
      expect(p.text.startsWith("Doc Title, page")).toBe(true);
  });
});

describe("search", () => {
  it("ranks passages by cosine similarity and returns the top 5 with links", () => {
    const passages = Array.from({ length: 8 }, (_, i) => ({
      id: `copper-home-user-guide-p${i + 1}-1`,
      docId: "copper-home-user-guide",
      title: "Copper Home User Guide",
      page: i + 1,
      text: `passage ${i}`,
      embedding: [1, i],
    }));
    const results = nearest([1, 7], passages);
    expect(results).toHaveLength(TOP_K);
    expect(results[0].page).toBe(8);
    expect(results[0].url).toBe("/docs/copper-home-user-guide.pdf#page=8");
    expect(results[0].citation).toBe("[Copper Home User Guide, p. 8]");
  });

  it("computes cosine similarity", () => {
    expect(cosine([1, 0], [1, 0])).toBe(1);
    expect(cosine([1, 0], [0, 1])).toBe(0);
  });

  it("builds page links and citations", () => {
    expect(pageUrl("copper-plus-faq", 5)).toBe(
      "/docs/copper-plus-faq.pdf#page=5",
    );
    expect(citationFor("Copper Plus FAQ", 5)).toBe("[Copper Plus FAQ, p. 5]");
  });
});

describe("the bundled index", () => {
  const index = docsIndex();

  it("has passages from every document, each with an embedding", () => {
    for (const doc of DOCUMENTS)
      expect(index.passages.some((p) => p.docId === doc.id)).toBe(true);
    for (const p of index.passages) {
      expect(p.embedding).toHaveLength(index.dimensions);
      expect(p.text.startsWith(p.title)).toBe(true);
    }
  });

  it("points at PDFs that exist in public/docs", () => {
    for (const doc of DOCUMENTS)
      expect(existsSync(join(process.cwd(), "public", doc.file))).toBe(true);
  });
});

describe("instructions", () => {
  it("tell Copper to cite and to say when the docs don't answer", () => {
    expect(COPPER_INSTRUCTIONS).toContain("search_docs");
    expect(COPPER_INSTRUCTIONS).toContain(NOT_FOUND);
    expect(COPPER_INSTRUCTIONS).toContain("[Copper Home User Guide, p. 9]");
  });
});
