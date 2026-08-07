import { env } from "../config/env";

export const AI_MODEL = "gemini-flash-latest";

// Untyped: @google/genai is ESM-only, statically importing its types from this
// CommonJS module requires a resolution-mode attribute TS won't emit for .ts files.
let clientPromise: Promise<any> | null = null;

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
