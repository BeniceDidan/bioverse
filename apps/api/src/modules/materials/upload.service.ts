import { PDFParse } from "pdf-parse";
import { prisma } from "../../lib/prisma";
import { generateJson, isAiConfigured } from "../../lib/ai-client";
import { uploadBuffer, deleteByUrl } from "../../lib/storage";
import { ApiError } from "../../utils/ApiError";

const MAX_PROMPT_CHARS = 18000;
const MIN_EXTRACTED_CHARS = 50;

function slugify(input: string): string {
  return input
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .slice(0, 80);
}

// Shared by createUpload and replaceUploadFile — extracts text from a PDF
// buffer and updates the upload row with the result, with a specific
// message when a PDF has no usable text layer (the most common real cause
// of "upload gagal": scanned/photographed pages have no extractable text
// at all, which used to fail deep inside AI-expand with a generic error
// instead of being caught here where the actual cause is known).
async function extractAndStoreText(uploadId: string, buffer: Buffer) {
  try {
    const parser = new PDFParse({ data: buffer });
    const result = await parser.getText();
    const text = result.text?.trim() ?? "";

    if (text.length < MIN_EXTRACTED_CHARS) {
      return prisma.materialUpload.update({
        where: { id: uploadId },
        data: {
          status: "FAILED",
          errorMessage:
            "Teks yang terbaca dari PDF ini terlalu sedikit atau kosong. File ini kemungkinan hasil scan/foto tanpa lapisan teks — coba gunakan PDF hasil convert langsung dari Word/dokumen digital.",
        },
      });
    }

    return prisma.materialUpload.update({
      where: { id: uploadId },
      data: { extractedText: result.text, status: "READY_TO_EXPAND", errorMessage: null },
    });
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error("[extractAndStoreText] PDF parse failed:", err);
    return prisma.materialUpload.update({
      where: { id: uploadId },
      data: {
        status: "FAILED",
        errorMessage: "Gagal membaca file PDF. Pastikan file tidak terkunci password dan tidak rusak.",
      },
    });
  }
}

export async function createUpload(teacherId: string, file: Express.Multer.File) {
  const material = await prisma.material.findFirstOrThrow();
  const fileUrl = await uploadBuffer(file.buffer, file.originalname, file.mimetype, "materi-pdf");

  const upload = await prisma.materialUpload.create({
    data: {
      teacherId,
      materialId: material.id,
      fileName: file.originalname,
      fileUrl,
      status: "UPLOADED",
    },
  });

  return extractAndStoreText(upload.id, file.buffer);
}

export async function listUploadsForTeacher(teacherId: string) {
  return prisma.materialUpload.findMany({
    where: { teacherId },
    orderBy: { createdAt: "desc" },
    include: { materialSection: { select: { id: true, slug: true, title: true, isPublished: true } } },
  });
}

const EXPAND_SYSTEM_PROMPT = `Anda adalah Instructional Designer & Spesialis Pendidikan Biologi. Tugas Anda mengubah teks mentah hasil ekstraksi PDF materi ajar menjadi satu submateri pembelajaran terstruktur untuk platform BioVerse, dalam Bahasa Indonesia.

Balas HANYA dengan JSON valid (tanpa markdown fence, tanpa teks lain) dengan bentuk persis:
{
  "title": string (judul singkat submateri),
  "description": string (1-2 kalimat ringkas),
  "learningObjectives": string[] (3-5 poin),
  "competencies": string[] (1-2 poin, gaya kompetensi dasar kurikulum biologi),
  "indicators": string[] (3-5 poin, indikator pencapaian),
  "estimatedMinutes": number (estimasi waktu belajar realistis, 10-40),
  "contentBody": string (markdown terstruktur dengan heading ##, list, dan penjelasan mendalam berbasis isi PDF — akurat, tidak mengarang fakta biologi baru di luar isi sumber),
  "structureFunctionNote": string (1 paragraf hubungan struktur-fungsi jika relevan, jika tidak relevan buat catatan konsep kunci),
  "realLifeExamples": string[] (2-3 contoh kehidupan nyata),
  "summary": string (1 paragraf ringkasan penutup)
}

Gunakan HANYA informasi yang benar-benar didukung oleh teks sumber. Jika teks sumber tidak cukup untuk satu bagian, buat isi yang masuk akal secara akademik namun tetap konsisten dengan topik yang terdeteksi dari sumber.`;

export async function expandUpload(uploadId: string, teacherId: string) {
  const upload = await prisma.materialUpload.findUnique({ where: { id: uploadId } });
  if (!upload || upload.teacherId !== teacherId) throw ApiError.notFound("Upload tidak ditemukan");
  if (!upload.extractedText) throw ApiError.badRequest("Teks PDF belum siap diproses");

  if (!isAiConfigured()) {
    throw ApiError.badRequest(
      "AI belum dikonfigurasi di server (GEMINI_API_KEY kosong). Hubungi administrator untuk mengaktifkan fitur expand otomatis."
    );
  }

  await prisma.materialUpload.update({ where: { id: uploadId }, data: { status: "EXPANDING" } });

  let jsonText = "";
  try {
    const sourceText = upload.extractedText.slice(0, MAX_PROMPT_CHARS);
    const raw = await generateJson(
      EXPAND_SYSTEM_PROMPT,
      `Nama file: ${upload.fileName}\n\nTeks hasil ekstraksi PDF:\n"""\n${sourceText}\n"""`
    );

    jsonText = raw.replace(/^```json\s*/i, "").replace(/```$/i, "").trim();
    const parsed = JSON.parse(jsonText);

    const sectionData = {
      title: parsed.title,
      description: parsed.description,
      learningObjectives: parsed.learningObjectives ?? [],
      competencies: parsed.competencies ?? [],
      indicators: parsed.indicators ?? [],
      estimatedMinutes: Number(parsed.estimatedMinutes) || 20,
      contentBody: parsed.contentBody ?? "",
      structureFunctionNote: parsed.structureFunctionNote ?? null,
      realLifeExamples: parsed.realLifeExamples ?? [],
      summary: parsed.summary ?? "",
    };

    // Re-processing a replaced document: update the existing submateri in
    // place (keeping its slug/order/publish state stable) instead of
    // creating a duplicate section.
    if (upload.materialSectionId) {
      await prisma.materialSection.update({ where: { id: upload.materialSectionId }, data: sectionData });
    } else {
      const baseSlug = slugify(parsed.title || upload.fileName);
      let slug = baseSlug || `materi-${Date.now()}`;
      let attempt = 1;
      while (await prisma.materialSection.findUnique({ where: { slug } })) {
        slug = `${baseSlug}-${attempt++}`;
      }

      const maxOrder = await prisma.materialSection.aggregate({
        where: { materialId: upload.materialId },
        _max: { order: true },
      });

      const section = await prisma.materialSection.create({
        data: { materialId: upload.materialId, slug, order: (maxOrder._max.order ?? 0) + 1, isPublished: false, ...sectionData },
      });

      await prisma.materialUpload.update({ where: { id: uploadId }, data: { materialSectionId: section.id } });
    }

    return prisma.materialUpload.update({
      where: { id: uploadId },
      data: { status: "EXPANDED", errorMessage: null },
      include: { materialSection: true },
    });
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error("[expandUpload] AI expand failed:", err);
    const isMalformedJson = err instanceof SyntaxError;
    const errorMessage = isMalformedJson
      ? "AI memberikan format jawaban yang tidak sesuai. Silakan coba proses ulang."
      : "Gagal memproses materi dengan AI. Silakan coba lagi.";
    await prisma.materialUpload.update({ where: { id: uploadId }, data: { status: "FAILED", errorMessage } });
    throw err instanceof ApiError ? err : ApiError.badRequest(errorMessage);
  }
}

export async function getUploadDetail(uploadId: string, teacherId: string) {
  const upload = await prisma.materialUpload.findUnique({
    where: { id: uploadId },
    include: { materialSection: true },
  });
  if (!upload || upload.teacherId !== teacherId) throw ApiError.notFound("Upload tidak ditemukan");
  return upload;
}

export async function publishUpload(uploadId: string, teacherId: string) {
  const upload = await prisma.materialUpload.findUnique({ where: { id: uploadId } });
  if (!upload || upload.teacherId !== teacherId) throw ApiError.notFound("Upload tidak ditemukan");
  if (!upload.materialSectionId) throw ApiError.badRequest("Materi belum di-expand");

  await prisma.materialSection.update({
    where: { id: upload.materialSectionId },
    data: { isPublished: true },
  });

  return prisma.materialUpload.findUnique({
    where: { id: uploadId },
    include: { materialSection: true },
  });
}

// ── Edit / delete (teacher management) ───────────────────────────────────

export async function replaceUploadFile(uploadId: string, teacherId: string, file: Express.Multer.File) {
  const upload = await prisma.materialUpload.findUnique({ where: { id: uploadId } });
  if (!upload || upload.teacherId !== teacherId) throw ApiError.notFound("Upload tidak ditemukan");

  const oldFileUrl = upload.fileUrl;
  const fileUrl = await uploadBuffer(file.buffer, file.originalname, file.mimetype, "materi-pdf");
  await deleteByUrl(oldFileUrl).catch(() => {});

  await prisma.materialUpload.update({
    where: { id: uploadId },
    data: { fileName: file.originalname, fileUrl, status: "UPLOADED", errorMessage: null, extractedText: null },
  });

  return extractAndStoreText(uploadId, file.buffer);
}

export async function deleteUploadRecord(uploadId: string, teacherId: string) {
  const upload = await prisma.materialUpload.findUnique({ where: { id: uploadId } });
  if (!upload || upload.teacherId !== teacherId) throw ApiError.notFound("Upload tidak ditemukan");
  await prisma.materialUpload.delete({ where: { id: uploadId } });
  await deleteByUrl(upload.fileUrl).catch(() => {});
}

export async function updateSection(sectionId: string, data: { title?: string; description?: string }) {
  const section = await prisma.materialSection.findUnique({ where: { id: sectionId } });
  if (!section) throw ApiError.notFound("Submateri tidak ditemukan");
  return prisma.materialSection.update({ where: { id: sectionId }, data });
}

export async function deleteSection(sectionId: string) {
  const section = await prisma.materialSection.findUnique({ where: { id: sectionId } });
  if (!section) throw ApiError.notFound("Submateri tidak ditemukan");
  await prisma.materialSection.delete({ where: { id: sectionId } });
}
