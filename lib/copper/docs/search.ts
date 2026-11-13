// Module 3: searches the support documents. The passages and their embeddings
// are built ahead of time by `npm run docs:index` into docs-index.json, which
// is bundled with the app and loaded into memory once, when the server starts.
// A question is embedded the same way and compared with every passage.
import { callEmbed } from "@/lib/ai/call";
import type { Passage } from "@/lib/copper/docs/chunk";
import { DOCUMENTS } from "@/lib/copper/documents";
import indexJson from "@/lib/copper/data/docs-index.json";

export type IndexedPassage = Passage & { embedding: number[] };

export type DocsIndex = {
  model: string;
  dimensions: number;
  builtAt: string;
  passages: IndexedPassage[];
};

export type DocResult = {
  title: string;
  page: number;
  /** Opens the PDF at this page. */
  url: string;
  /** How to cite it in a reply: "[Copper Home User Guide, p. 9]". */
  citation: string;
  text: string;
  /** Cosine similarity, 0 to 1: higher is closer to the question. */
  score: number;
};

export type DocSearch = { query: string; results: DocResult[] };

/** How many passages search_docs returns. */
export const TOP_K = 5;

const INDEX = indexJson as DocsIndex;

/** The in-memory index (read once when the module loads). */
export function docsIndex(): DocsIndex {
  return INDEX;
}

export function cosine(a: number[], b: number[]): number {
  let dot = 0;
  let na = 0;
  let nb = 0;
  for (let i = 0; i < a.length; i++) {
    dot += a[i] * b[i];
    na += a[i] * a[i];
    nb += b[i] * b[i];
  }
  return na && nb ? dot / Math.sqrt(na * nb) : 0;
}

/** The link that opens a document's PDF at one page. */
export function pageUrl(docId: string, page: number): string {
  const doc = DOCUMENTS.find((d) => d.id === docId);
  return `${doc?.file ?? `/docs/${docId}.pdf`}#page=${page}`;
}

export const citationFor = (title: string, page: number) =>
  `[${title}, p. ${page}]`;

/** The k passages closest to a question's embedding, closest first. */
export function nearest(
  queryEmbedding: number[],
  passages: IndexedPassage[],
  k = TOP_K,
): DocResult[] {
  return passages
    .map((p) => ({ p, score: cosine(queryEmbedding, p.embedding) }))
    .sort((a, b) => b.score - a.score)
    .slice(0, k)
    .map(({ p, score }) => ({
      title: p.title,
      page: p.page,
      url: pageUrl(p.docId, p.page),
      citation: citationFor(p.title, p.page),
      text: p.text,
      score: Math.round(score * 1000) / 1000,
    }));
}

/** search_docs: embeds the question and returns the 5 closest passages. */
export async function searchDocs(query: string): Promise<DocSearch> {
  const { embedding } = await callEmbed(
    { module: 3, feature: "search-docs" },
    query,
    "query",
  );
  return { query, results: nearest(embedding, INDEX.passages) };
}
