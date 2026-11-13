CIS 591 CLASS EXAMPLE 3
Ask Copper answers support questions from the Copper PDFs


LIVE SITE

https://copper-module-3.vercel.app

Open Ask Copper with the button at the bottom right of the page.

Code repository: https://github.com/manuelportugalreis/copper-module-3


HOW IT WORKS

The four support PDFs in public/docs (32 pages in total) were split into 122 short passages of about three sentences each. Every passage keeps its document title and page number, and its text starts with the document title. Copper Home User Guide gave 34 passages, Copper Notes User Guide 28, Copper State Labs Terms and Conditions 33, and Copper Plus FAQ 27.

Every passage was embedded with Gemini's embedding model and saved to one JSON file that the app loads into memory when it starts.

Ask Copper has a new tool, search_docs. It embeds the customer's question, finds the 5 closest passages and returns each one with its document title, page number and a link that opens the PDF at that page. The tool card in the chat shows these 5 passages with their links.

Copper's instructions now say that setup, troubleshooting, warranty and policy questions must be answered only from what search_docs returns. Every sentence ends with a citation such as [Copper Home User Guide, p. 9], and each citation is a link to that page. If the passages don't answer the question, Copper says "I couldn't find that in our support docs" and suggests contacting the Copper Crew.

Search tests: "C-47" returned the Copper Home User Guide, page 9 (error code table) first. "annual refund" returned the Copper Plus FAQ, page 5, and the Terms and Conditions, page 4. "reset Wi-Fi" returned the Copper Home User Guide, page 4 (Reconnect to Wi-Fi) first.


EVALUATION ON THE LIVE SITE

The three questions were asked in Ask Copper on the live site. Every answer used search_docs. I then opened each cited PDF page from the live site and checked it against the answer.


Question a) What does C-31 mean on Copper Notes?

Copper's answer: "Error code C-31 means storage is full because recordings haven't been uploaded yet [Copper Notes User Guide, p. 8]. Connect to Wi-Fi and open the Copper app to upload your recordings [Copper Notes User Guide, p. 8]."

Check: Yes, page 8 of the Copper Notes User Guide supports this answer, because its error code table lists C-31 as "Storage full: recordings haven't been uploaded yet" with the fix "Connect to Wi-Fi and open the Copper app to upload your recordings".


Question b) Can I get a refund on an annual Copper Plus plan?

Copper's answer: "Annual plans get a full refund if you cancel within 14 days of purchase [Copper Plus FAQ, p. 5]."

Check: Yes, page 5 of the Copper Plus FAQ supports this answer, because it says almost word for word that annual plans get a full refund if you cancel within 14 days of purchase.


Question c) Can Copper Home order me a pizza?

Copper's answer: "I couldn't find that in our support docs. Please contact the Copper Crew in the Copper app (Settings > Help)."

Check: Yes, this is the correct and expected answer, because none of the five passages returned mentions ordering food, so Copper gave no citation and did not guess.


CHECKLIST

Done:
- Cloned the module-3-part-1 branch, created a public GitHub repo from it and installed the dependencies.
- Created a Vercel project linked to the repo.
- Saved the Gemini key in .env.local and in Vercel (production, preview and development), without committing it.
- Copied the four PDFs into public/docs.
- Built the passage index (122 passages) and the search_docs tool, with page links in the tool card and in the answers.
- Updated Copper's instructions (cite every sentence, never guess, "I couldn't find that in our support docs").
- Tests, lint and typecheck all pass.
- Committed, pushed and deployed. The live site opens the Copper site with Ask Copper, and the PDFs and the index are part of the deployment.
- Asked the three questions on the live site and checked every cited page.

Issues found and fixed:
- The Vercel project was first created with the wrong framework setting, so the home page returned an error. I set it to Next.js and deployed again.
- Google no longer allows new accounts to use the app's default model (Gemini 2.5 Flash), and the other course model hit its free daily limit during testing. I added Gemini 3.6 Flash to the app's model list and set Ask Copper to use it.
- In the first live run, answer b) had an extra sentence starting with "Otherwise", which linked two facts in a way the cited page does not. I made Copper's instructions stricter, deployed again and asked again. The answer above is from that final run.

Pending and limits:
- Nothing from the assignment is pending.
- The free Gemini tier allows about 10 questions a day on the live site. After that, Ask Copper shows an error until the limit resets the next day.
- The AI's wording can change slightly between runs. The answers above are from the final live run.
