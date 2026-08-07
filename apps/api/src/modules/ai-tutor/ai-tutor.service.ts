import { prisma } from "../../lib/prisma";
import { generateChatReply, isAiConfigured, type ChatTurn } from "../../lib/ai-client";
import { ApiError } from "../../utils/ApiError";

const NOT_CONFIGURED_REPLY =
  "Maaf, AI Tutor belum aktif karena kunci AI belum dikonfigurasi di server. Hubungi administrator BioVerse untuk mengaktifkannya.";

const MAX_CONTEXT_CHARS = 12000;

async function buildSystemPrompt(): Promise<string> {
  const sections = await prisma.materialSection.findMany({
    where: { isPublished: true },
    orderBy: { order: "asc" },
    select: { title: true, summary: true, contentBody: true },
  });

  let context = "";
  for (const s of sections) {
    const chunk = `### ${s.title}\n${s.summary}\n\n${s.contentBody}\n\n`;
    if (context.length + chunk.length > MAX_CONTEXT_CHARS) break;
    context += chunk;
  }

  if (!context) {
    context = "(Belum ada materi yang diterbitkan di platform saat ini.)";
  }

  return `Anda adalah AI Tutor pada platform belajar BioVerse, asisten belajar Biologi khusus topik "Jaringan Hewan" untuk siswa SMA, mahasiswa Pendidikan Biologi, dan guru.

ATURAN KETAT:
1. Jawab HANYA pertanyaan yang berkaitan dengan materi Jaringan Hewan (jaringan epitel, jaringan ikat, jaringan otot, jaringan saraf, histologi, struktur-fungsi jaringan hewan, dan submateri terkait di platform BioVerse).
2. Jika pertanyaan di luar topik tersebut (misalnya matematika, sejarah, teknologi, hal pribadi, dsb), TOLAK dengan sopan. Jelaskan singkat bahwa topik itu di luar cakupan BioVerse, lalu arahkan kembali ke materi Jaringan Hewan. Jangan tetap menjawab pertanyaan di luar topik.
3. Gunakan Bahasa Indonesia yang jelas, ramah, dan mudah dipahami siswa SMA.
4. Jawaban ringkas tapi lengkap. Gunakan format markdown (heading, list, bold) bila membantu kejelasan.
5. Dasarkan jawaban pada MATERI RUJUKAN di bawah ini bila relevan. Jangan mengarang fakta biologi yang bertentangan dengan materi rujukan.

MATERI RUJUKAN (submateri yang sudah diterbitkan di BioVerse):
${context}`;
}

export async function listSessions(userId: string) {
  return prisma.chatSession.findMany({
    where: { userId },
    orderBy: { updatedAt: "desc" },
    select: {
      id: true,
      title: true,
      createdAt: true,
      updatedAt: true,
      messages: { orderBy: { createdAt: "desc" }, take: 1, select: { content: true } },
    },
  });
}

export async function createSession(userId: string) {
  return prisma.chatSession.create({ data: { userId, title: "Percakapan baru" } });
}

export async function getSession(sessionId: string, userId: string) {
  const session = await prisma.chatSession.findUnique({
    where: { id: sessionId },
    include: { messages: { orderBy: { createdAt: "asc" } } },
  });
  if (!session || session.userId !== userId) throw ApiError.notFound("Percakapan tidak ditemukan");
  return session;
}

export async function deleteSession(sessionId: string, userId: string) {
  const session = await prisma.chatSession.findUnique({ where: { id: sessionId } });
  if (!session || session.userId !== userId) throw ApiError.notFound("Percakapan tidak ditemukan");
  await prisma.chatSession.delete({ where: { id: sessionId } });
}

function truncateTitle(text: string): string {
  const clean = text.trim().replace(/\s+/g, " ");
  return clean.length > 48 ? `${clean.slice(0, 48)}...` : clean;
}

export async function sendMessage(sessionId: string, userId: string, content: string) {
  const session = await getSession(sessionId, userId);

  const userMessage = await prisma.chatMessage.create({
    data: { sessionId, role: "USER", content },
  });

  if (session.messages.length === 0) {
    await prisma.chatSession.update({ where: { id: sessionId }, data: { title: truncateTitle(content) } });
  }

  const assistantText = await generateReply(sessionId, [...session.messages, userMessage]);

  const assistantMessage = await prisma.chatMessage.create({
    data: { sessionId, role: "ASSISTANT", content: assistantText },
  });

  await prisma.chatSession.update({ where: { id: sessionId }, data: { updatedAt: new Date() } });

  return { userMessage, assistantMessage };
}

export async function regenerateLastReply(sessionId: string, userId: string) {
  const session = await getSession(sessionId, userId);
  const messages = session.messages;
  const lastAssistantIndex = [...messages].reverse().findIndex((m) => m.role === "ASSISTANT");

  if (lastAssistantIndex === -1) throw ApiError.badRequest("Belum ada respons AI untuk diulang");

  const actualIndex = messages.length - 1 - lastAssistantIndex;
  const lastAssistant = messages[actualIndex];
  const historyForRegen = messages.slice(0, actualIndex);

  await prisma.chatMessage.delete({ where: { id: lastAssistant.id } });

  const assistantText = await generateReply(sessionId, historyForRegen);

  const assistantMessage = await prisma.chatMessage.create({
    data: { sessionId, role: "ASSISTANT", content: assistantText },
  });

  await prisma.chatSession.update({ where: { id: sessionId }, data: { updatedAt: new Date() } });

  return { assistantMessage };
}

async function generateReply(
  _sessionId: string,
  messages: { role: "USER" | "ASSISTANT"; content: string }[]
): Promise<string> {
  if (!isAiConfigured()) return NOT_CONFIGURED_REPLY;

  const systemPrompt = await buildSystemPrompt();
  const history: ChatTurn[] = messages.map((m) => ({
    role: m.role === "USER" ? "user" : "model",
    text: m.content,
  }));

  try {
    const reply = await generateChatReply(systemPrompt, history);
    return reply || "Maaf, AI Tutor tidak dapat memberikan jawaban saat ini. Silakan coba lagi.";
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error("[ai-tutor] generateChatReply failed:", err);
    return "Maaf, terjadi kendala saat menghubungi AI Tutor. Silakan coba lagi sebentar lagi.";
  }
}
