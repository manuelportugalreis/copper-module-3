// npm run docs:search -- "C-47": shows the 5 passages search_docs returns for
// a question, to check the index without opening the chat.
import { searchDocs } from "@/lib/copper/docs/search";

async function main() {
  const queries = process.argv.slice(2);
  if (queries.length === 0)
    throw new Error('Usage: npm run docs:search -- "your question"');
  for (const query of queries) {
    const { results } = await searchDocs(query);
    console.log(`\n${query}`);
    for (const r of results)
      console.log(
        `  ${r.score.toFixed(3)}  ${r.citation}  ${r.url}\n         ${r.text.slice(0, 150)}`,
      );
  }
}

main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
