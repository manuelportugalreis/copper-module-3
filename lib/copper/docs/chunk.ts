// Module 3: splits the support PDFs into passages for search. Each page is
// cleaned of its running header and footer, cut into sentences, and the
// sentences are grouped a few at a time. Every passage keeps its document's
// title and page number, and its text starts with the title, so the embedding
// knows which document (and product) it comes from.

export type Passage = {
  /** Stable id, for example "copper-home-user-guide-p9-2". */
  id: string;
  docId: string;
  title: string;
  page: number;
  /** "<title>, page <n>: <passage>". This is what gets embedded. */
  text: string;
};

/** A passage stops growing once it has this many sentences… */
const MAX_SENTENCES = 3;
/** …or this many characters. */
const TARGET_CHARS = 400;
/** A single "sentence" longer than this (usually a table) is cut at word breaks. */
const MAX_CHARS = 600;
/** The last sentence of a passage is repeated in the next if it's this short. */
const OVERLAP_CHARS = 200;

// Lines on every page that say nothing about the product.
const BOILERPLATE = [
  /^COPPER STATE LABS$/,
  /^CSL-[A-Z]+-\d+/,
  /^©/,
];

/** Joins a page's lines into one string, without headers, footers or hyphen breaks. */
export function cleanPage(text: string): string {
  return text
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => line && !BOILERPLATE.some((re) => re.test(line)))
    .join(" ")
    .replace(/\s+/g, " ")
    .trim();
}

/** Splits text after ., ! or ? when the next word starts a new sentence. */
export function splitSentences(text: string): string[] {
  return text
    .split(/(?<=[.!?])\s+(?=["“(•A-Z0-9])/)
    .map((s) => s.trim())
    .filter(Boolean);
}

/** Cuts an overlong piece of text at word breaks into pieces of about TARGET_CHARS. */
function cutLong(sentence: string): string[] {
  if (sentence.length <= MAX_CHARS) return [sentence];
  const words = sentence.split(" ");
  const pieces: string[] = [];
  let current = "";
  for (const word of words) {
    if (current && current.length + word.length + 1 > TARGET_CHARS) {
      pieces.push(current);
      current = word;
    } else {
      current = current ? `${current} ${word}` : word;
    }
  }
  if (current) pieces.push(current);
  return pieces;
}

/**
 * Groups sentences into passages of a few sentences each. Each passage starts
 * with the last sentence of the one before (when it's short), so a question
 * and its answer, or a table row and its follow-up, aren't cut apart.
 */
export function groupSentences(sentences: string[]): string[] {
  const passages: string[] = [];
  let group: string[] = [];
  let fresh = 0; // sentences in `group` not already in the previous passage
  const flush = () => {
    if (fresh > 0) passages.push(group.join(" "));
    const last = group.at(-1);
    group = last && last.length <= OVERLAP_CHARS ? [last] : [];
    fresh = 0;
  };
  for (const sentence of sentences.flatMap(cutLong)) {
    if (sentence.length > TARGET_CHARS) {
      // A long one gets a passage of its own (after the overlap sentence).
      if (fresh > 0) flush();
      group.push(sentence);
      fresh = 1;
      flush();
      continue;
    }
    group.push(sentence);
    fresh++;
    if (
      group.length > MAX_SENTENCES ||
      (fresh >= MAX_SENTENCES && group.length >= MAX_SENTENCES) ||
      group.join(" ").length >= TARGET_CHARS
    )
      flush();
  }
  flush();
  return passages;
}

/** Every passage of one document, given the raw text of each page (page 1 first). */
export function chunkDocument(
  doc: { id: string; title: string },
  pages: string[],
): Passage[] {
  return pages.flatMap((raw, i) => {
    const page = i + 1;
    return groupSentences(splitSentences(cleanPage(raw))).map(
      (passage, n) => ({
        id: `${doc.id}-p${page}-${n + 1}`,
        docId: doc.id,
        title: doc.title,
        page,
        text: `${doc.title}, page ${page}: ${passage}`,
      }),
    );
  });
}
