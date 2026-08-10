import { env } from "../config/env";

// Flash-Lite specifically because it's Google's cost-optimized, high-volume
// tier — the regular Flash model's free-tier quota (20 requests/day total,
// shared across AI Tutor + materi AI-expand) was nowhere near enough for
// real classroom use and was exhausted within a single day of testing.
export const AI_MODEL = "gemini-3.1-flash-lite";

// Untyped: @google/genai is ESM-only, statically importing its types from this
// CommonJS module requires a resolution-mode attribute TS won't emit for .ts files.
// eslint-disable-next-line @typescript-eslint/no-explicit-any -- see note above
let clientPromise: Promise<any> | null = null;

// eslint-disable-next-line @typescript-eslint/no-explicit-any -- see note above
function getClient(): Promise<any> {
  if (!clientPromise) {
    clientPromise = import("@google/genai").then(({ GoogleGenAI }) => new GoogleGenAI({ apiKey: env.geminiApiKey }));
  }
  return clientPromise;
}

export function isAiConfigured() {
  return !!env.geminiApiKey;
}

export async function generateJson(systemInstruction: string, userPrompt: string): Promise<string> {
  if (!isAiConfigured()) throw new Error("AI belum dikonfigurasi");
  const genAI = await getClient();

  const response = await genAI.models.generateContent({
    model: AI_MODEL,
    contents: userPrompt,
    config: {
      systemInstruction,
      responseMimeType: "application/json",
    },
  });

  return response.text ?? "";
}

export interface ChatTurn {
  role: "user" | "model";
  text: string;
}

export async function generateChatReply(systemInstruction: string, history: ChatTurn[]): Promise<string> {
  if (!isAiConfigured()) throw new Error("AI belum dikonfigurasi");
  const genAI = await getClient();

  const response = await genAI.models.generateContent({
    model: AI_MODEL,
    contents: history.map((turn) => ({ role: turn.role, parts: [{ text: turn.text }] })),
    config: {
      systemInstruction,
    },
  });

  return response.text ?? "";
}
