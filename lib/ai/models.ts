// The course's approved models. Calls go straight to Google with a Google AI
// Studio key, which is free and needs no credit card.
export const MODELS = [
  {
    id: "google/gemini-2.5-flash",
    label: "Gemini 2.5 Flash (fast, shows its thinking)",
    // Google's own name for it, used when calling Google.
    googleId: "gemini-2.5-flash",
  },
  {
    id: "google/gemini-3-flash",
    label: "Gemini 3 Flash (newer, thinks out loud less often)",
    googleId: "gemini-3-flash-preview",
  },
  {
    // Module 3: Google closed 2.5 Flash to new keys and the free tier gives
    // each model 20 requests a day, so Ask Copper can run on 3.6 Flash.
    id: "google/gemini-3.6-flash",
    label: "Gemini 3.6 Flash (current Flash for new Google keys)",
    googleId: "gemini-3.6-flash",
  },
] as const;

export type ModelId = (typeof MODELS)[number]["id"];

/**
 * The model used when a call doesn't name one. 2.5 Flash writes a summary of
 * its thinking for every question, which Ask Copper shows students.
 */
export const DEFAULT_MODEL: ModelId = "google/gemini-2.5-flash";

/** AI_MODEL if it names an approved model, otherwise the default. */
export function defaultModel(): ModelId {
  const id = process.env.AI_MODEL;
  return MODELS.find((m) => m.id === id)?.id ?? DEFAULT_MODEL;
}
