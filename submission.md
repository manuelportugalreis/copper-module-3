# CIS 591 Class Example 3: Ask Copper answers from the support PDFs

**Live site:** https://copper-module-3.vercel.app (open Ask Copper with the button at the bottom right)

**Repo:** https://github.com/manuelportugalreis/copper-module-3

## How it works

- 4 PDFs in `public/docs` (32 pages) were split into 122 passages of about 3 sentences each, with one sentence of overlap. Each passage keeps its document title and page number, and its text starts with the title.
  - Copper Home User Guide: 34 passages (10 pages)
  - Copper Notes User Guide: 28 passages (9 pages)
  - Copper State Labs Terms and Conditions: 33 passages (7 pages)
  - Copper Plus FAQ: 27 passages (6 pages)
- Every passage was embedded with `gemini-embedding-001` (768 dimensions) into `lib/copper/data/docs-index.json`. The app bundles that file and loads it into memory when it starts.
- New tool `search_docs` embeds the question, finds the 5 closest passages (cosine similarity) and returns each one with its title, page, citation and a link that opens the PDF at that page (`/docs/<file>.pdf#page=N`). The tool card shows the 5 passages with those links.
- Copper's instructions: support answers come only from `search_docs`, every sentence ends with a citation like `[Copper Home User Guide, p. 9]` (shown as a link to that page), and when the passages don't answer, Copper says "I couldn't find that in our support docs" and suggests the Copper Crew.

Retrieval tests (top hit): "C-47" gave Copper Home User Guide p. 9 (error code table); "annual refund" gave Copper Plus FAQ p. 5, then Terms and Conditions p. 4 (section 4.6); "reset Wi-Fi" gave Copper Home User Guide p. 4 (3.1 Reconnect to Wi-Fi), then Copper Notes User Guide p. 4.

## Evaluation on the live site

The questions were typed into Ask Copper on https://copper-module-3.vercel.app in headless Chrome (final run on 2026-11-12). Each answer called `search_docs`. I then downloaded each cited PDF from the live site and read the cited page.

### a) What does C-31 mean on Copper Notes?

> Error code C-31 means storage is full because recordings haven't been uploaded yet [Copper Notes User Guide, p. 8]. Connect to Wi-Fi and open the Copper app to upload your recordings [Copper Notes User Guide, p. 8].

**Supported:** Yes. On page 8 of the Copper Notes User Guide, the error code table says C-31 is "Storage full: recordings haven't been uploaded yet" and the fix is to connect to Wi-Fi and open the Copper app to upload the recordings.

### b) Can I get a refund on an annual Copper Plus plan?

> Annual plans get a full refund if you cancel within 14 days of purchase [Copper Plus FAQ, p. 5].

**Supported:** Yes. Page 5 of the Copper Plus FAQ says almost word for word that annual plans get a full refund if you cancel within 14 days of purchase.

### c) Can Copper Home order me a pizza?

> I couldn't find that in our support docs. Please contact the Copper Crew in the Copper app (Settings > Help).

**Supported:** Yes, this is the expected answer. None of the 5 passages returned (Copper Home User Guide pp. 2, 3, 5; Copper Plus FAQ p. 3) mentions ordering food, so Copper correctly said it couldn't find it and added no citation.

## Checklist

### Done
- [x] Cloned `module-3-part-1`, created the public repo `manuelportugalreis/copper-module-3`, ran `npm ci`
- [x] Created the Vercel project `copper-module-3` and linked it to the GitHub repo (pushes to `main` deploy to production)
- [x] `GOOGLE_GENERATIVE_AI_API_KEY` set in `.env.local` and on Vercel (production, preview, development); `.env.local` is not committed
- [x] 4 PDFs copied to `public/docs`, then chunked and embedded into `lib/copper/data/docs-index.json` (122 passages)
- [x] `search_docs` tool, tool card with page links, citation links in replies
- [x] Instructions updated (cite every sentence, "I couldn't find that in our support docs", never guess)
- [x] `npm test` (129 passed), `npm run lint` and `npm run typecheck` all clean
- [x] Committed, pushed, deployed. The live site returns 200 and shows the Copper site with Ask Copper; all 4 PDFs return 200 `application/pdf`; the index is bundled with the server code
- [x] All three live answers checked against the cited PDF pages

### Issues found and fixed
- The Vercel project was created with the "Other" framework preset, so the first deploy served only static files (`/` returned 404). I set the preset to Next.js and redeployed.
- Google no longer lets new users call `gemini-2.5-flash` (the app's default model). The course's other model, `gemini-3-flash`, hit the free tier's 20 requests a day limit during testing. I added `google/gemini-3.6-flash` to the approved models (`lib/ai/models.ts`, price from Google's pricing page) and set `AI_MODEL=google/gemini-3.6-flash` locally and on Vercel.
- On the first live run, answer (b) had a third sentence starting with "Otherwise, you keep Copper Plus until the end of the period you've paid for". The cited page says the fact but not the "otherwise" link. I tightened the instructions (one fact per sentence, no linking words the passage doesn't state, keep conditions), redeployed and asked again. The final answer is above.
- The embedding free tier allows 100 embeddings a minute, so `npm run docs:index` embeds in batches of 90 with a 65-second pause.

### Pending / limits to know
- Free tier: each chat model gets about 20 requests a day per Google project, and each question uses 2 (one search embedding plus one chat call). After about 10 questions a day the live chat replies "Sorry, something went wrong" until the quota resets. A paid key would remove this.
- The model's answers can vary between runs. The three answers above are from the final live run.
- Google returns no token count for embeddings, so those `ai_calls` log rows show `input_tokens: null`.
