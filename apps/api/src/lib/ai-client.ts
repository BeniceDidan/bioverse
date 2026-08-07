import { GoogleGenAI } from "@google/genai";
import { env } from "../config/env";

export const AI_MODEL = "gemini-flash-latest";

export const genAI = env.geminiApiKey ? new GoogleGenAI({ apiKey: env.geminiApiKey }) : null;

export function isAiConfigured() {
  return genAI !== null;
}

export async function generateJson(systemInstruction: string, userPrompt: string): Promise<string> {
  if (!genAI) throw new Error("AI belum dikonfigurasi");

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
  if (!genAI) throw new Error("AI belum dikonfigurasi");

  const response = await genAI.models.generateContent({
    model: AI_MODEL,
    contents: history.map((turn) => ({ role: turn.role, parts: [{ text: turn.text }] })),
    config: {
      systemInstruction,
    },
  });

  return response.text ?? "";
}
