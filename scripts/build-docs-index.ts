// npm run docs:index: reads every PDF in public/docs, splits each page into
// passages, embeds them with Gemini and writes lib/copper/data/docs-index.json.
// Run it again whenever a PDF changes. Needs GOOGLE_GENERATIVE_AI_API_KEY.
import { readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { extractText, getDocumentProxy } from "unpdf";
import {
  callEmbedMany,
  EMBEDDING_DIMENSIONS,
  EMBEDDING_MODEL,
} from "@/lib/ai/call";
import { chunkDocument, type Passage } from "@/lib/copper/docs/chunk";
import type { DocsIndex } from "@/lib/copper/docs/search";
import { DOCUMENTS } from "@/lib/copper/documents";

const ROOT = process.cwd();
const OUT = join(ROOT, "lib/copper/data/docs-index.json");
const BATCH = 90;
const WAIT_MS = 65_000;

async function readPages(file: string): Promise<string[]> {
  const bytes = new Uint8Array(readFileSync(join(ROOT, "public", file)));
  const pdf = await getDocumentProxy(bytes);
  const { text } = await extractText(pdf, { mergePages: false });
  return text;
}

async function main() {
  const passages: Passage[] = [];
  for (const doc of DOCUMENTS) {
    const pages = await readPages(doc.file);
    const chunks = chunkDocument(doc, pages);
    console.log(
      `${doc.title}: ${pages.length} pages -> ${chunks.length} passages`,
    );
    passages.push(...chunks);
  }

  // Google's free tier allows 100 embeddings a minute, so send them in
  // batches and wait a minute between batches.
  const embeddings: number[][] = [];
  for (let start = 0; start < passages.length; start += BATCH) {
    if (start > 0) {
      console.log(`Waiting ${WAIT_MS / 1000}s for the free-tier limit…`);
      await new Promise((resolve) => setTimeout(resolve, WAIT_MS));
    }
    const batch = passages.slice(start, start + BATCH).map((p) => p.text);
    const result = await callEmbedMany(
      { module: 3, feature: "docs-index" },
      batch,
      "document",
    );
    embeddings.push(...result.embeddings);
    console.log(`Embedded ${embeddings.length}/${passages.length}`);
  }
  if (embeddings.length !== passages.length)
    throw new Error("Got a different number of embeddings than passages.");

  const index: DocsIndex = {
    model: EMBEDDING_MODEL,
    dimensions: EMBEDDING_DIMENSIONS,
    builtAt: new Date().toISOString(),
    passages: passages.map((p, i) => ({
      ...p,
      embedding: embeddings[i].map((x) => Math.round(x * 1e6) / 1e6),
    })),
  };
  writeFileSync(OUT, JSON.stringify(index) + "\n");
  console.log(`Wrote ${passages.length} passages to ${OUT}`);
}

main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
