import { generateJson, isAiConfigured } from "../../lib/ai-client";
import { ApiError } from "../../utils/ApiError";

export interface AiChoice {
  text: string;
  isCorrect: boolean;
}

export interface AiPair {
  prompt: string;
  answer: string;
}

export interface AiQuestion {
  type: "MULTIPLE_CHOICE" | "TRUE_FALSE" | "MATCHING" | "DRAG_DROP" | "ESSAY";
  prompt: string;
  explanation: string;
  points: number;
  choices?: AiChoice[];
  pairs?: AiPair[];
}

const SYSTEM_PROMPT = `Anda adalah Instructional Designer & Spesialis Pendidikan Biologi. Tugas Anda membuat soal kuis dalam Bahasa Indonesia berdasarkan materi yang diberikan.

Balas HANYA dengan JSON array valid (tanpa markdown fence, tanpa teks lain). Setiap elemen array adalah satu soal dengan salah satu bentuk berikut sesuai tipenya:

MULTIPLE_CHOICE:
{"type":"MULTIPLE_CHOICE","prompt":"...","explanation":"...","points":10,"choices":[{"text":"...","isCorrect":true},{"text":"...","isCorrect":false},{"text":"...","isCorrect":false},{"text":"...","isCorrect":false}]}
(tepat 4 pilihan, HANYA 1 isCorrect:true)

TRUE_FALSE:
{"type":"TRUE_FALSE","prompt":"...","explanation":"...","points":10,"choices":[{"text":"Benar","isCorrect":true|false},{"text":"Salah","isCorrect":true|false}]}

MATCHING:
{"type":"MATCHING","prompt":"Cocokkan istilah dengan penjelasannya","explanation":"...","points":20,"pairs":[{"prompt":"istilah 1","answer":"penjelasan 1"},{"prompt":"istilah 2","answer":"penjelasan 2"},{"prompt":"istilah 3","answer":"penjelasan 3"},{"prompt":"istilah 4","answer":"penjelasan 4"}]}
(tepat 4 pasangan)

DRAG_DROP:
Bentuk JSON persis sama seperti MATCHING (gunakan "type":"DRAG_DROP").

ESSAY:
{"type":"ESSAY","prompt":"...","explanation":"Jawaban model/rubrik singkat untuk soal ini","points":20}

Aturan:
- Gunakan HANYA informasi yang didukung oleh materi sumber, jangan mengarang fakta biologi baru.
- explanation WAJIB diisi untuk semua tipe (penjelasan jawaban benar / rubrik untuk essay).
- Variasikan tipe soal sesuai daftar tipe yang diminta pengguna.
- Jangan menyertakan tipe soal di luar yang diminta.`;

export async function generateQuizQuestions(
  sourceText: string,
  types: string[],
  count: number
): Promise<AiQuestion[]> {
  if (!isAiConfigured()) {
    throw ApiError.badRequest(
      "AI belum dikonfigurasi di server (GEMINI_API_KEY kosong). Hubungi administrator untuk mengaktifkan fitur generate otomatis."
    );
  }

  const userPrompt = `Buat ${count} soal kuis dengan variasi tipe: ${types.join(", ")}.\n\nMateri sumber:\n"""\n${sourceText.slice(0, 15000)}\n"""`;

  const raw = await generateJson(SYSTEM_PROMPT, userPrompt);
  const jsonText = raw.replace(/^```json\s*/i, "").replace(/```$/i, "").trim();

  let parsed: unknown;
  try {
    parsed = JSON.parse(jsonText);
  } catch {
    throw ApiError.badRequest("Gagal memproses hasil AI. Silakan coba lagi.");
  }

  if (!Array.isArray(parsed)) {
    throw ApiError.badRequest("Format hasil AI tidak sesuai. Silakan coba lagi.");
  }

  return parsed as AiQuestion[];
}
