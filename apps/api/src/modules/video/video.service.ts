import { prisma } from "../../lib/prisma";
import { ApiError } from "../../utils/ApiError";

function extractYoutubeId(input: string): string | null {
  const trimmed = input.trim();
  if (/^[a-zA-Z0-9_-]{11}$/.test(trimmed)) return trimmed;

  try {
    const url = new URL(trimmed);
    if (url.hostname.includes("youtu.be")) return url.pathname.slice(1) || null;
    if (url.hostname.includes("youtube.com")) {
      if (url.pathname === "/watch") return url.searchParams.get("v");
      if (url.pathname.startsWith("/embed/")) return url.pathname.split("/embed/")[1] ?? null;
      if (url.pathname.startsWith("/shorts/")) return url.pathname.split("/shorts/")[1] ?? null;
    }
  } catch {
    return null;
  }
  return null;
}

interface CreateVideoInput {
  materialSectionId: string;
  title: string;
  description: string;
  youtubeUrl: string;
  durationSeconds?: number;
}

export async function createVideo(teacherId: string, input: CreateVideoInput) {
  const section = await prisma.materialSection.findUnique({ where: { id: input.materialSectionId } });
  if (!section) throw ApiError.badRequest("Submateri tidak ditemukan");

  const youtubeId = extractYoutubeId(input.youtubeUrl);
  if (!youtubeId) throw ApiError.badRequest("Link atau ID video YouTube tidak valid");

  const count = await prisma.video.count({ where: { materialSectionId: input.materialSectionId } });

  return prisma.video.create({
    data: {
      materialSectionId: input.materialSectionId,
      teacherId,
      title: input.title,
      description: input.description,
      youtubeId,
      durationSeconds: input.durationSeconds,
      order: count + 1,
    },
  });
}

export async function listVideosForTeacher(teacherId: string) {
  return prisma.video.findMany({
    where: { teacherId },
    orderBy: { createdAt: "desc" },
    include: { materialSection: { select: { id: true, title: true } } },
  });
}

async function getOwnedVideo(videoId: string, teacherId: string) {
  const video = await prisma.video.findUnique({ where: { id: videoId } });
  if (!video || video.teacherId !== teacherId) throw ApiError.notFound("Video tidak ditemukan");
  return video;
}

export async function updateVideo(
  videoId: string,
  teacherId: string,
  data: Partial<{ title: string; description: string; youtubeUrl: string; durationSeconds: number }>
) {
  await getOwnedVideo(videoId, teacherId);

  const { youtubeUrl, ...rest } = data;
  const youtubeId = youtubeUrl ? extractYoutubeId(youtubeUrl) : undefined;
  if (youtubeUrl && !youtubeId) throw ApiError.badRequest("Link atau ID video YouTube tidak valid");

  return prisma.video.update({
    where: { id: videoId },
    data: { ...rest, ...(youtubeId ? { youtubeId } : {}) },
  });
}

export async function setVideoPublished(videoId: string, teacherId: string, isPublished: boolean) {
  await getOwnedVideo(videoId, teacherId);
  return prisma.video.update({ where: { id: videoId }, data: { isPublished } });
}

export async function deleteVideo(videoId: string, teacherId: string) {
  await getOwnedVideo(videoId, teacherId);
  await prisma.video.delete({ where: { id: videoId } });
}

// ── Public (student-facing) ──────────────────────────────────────────────

export async function listPublicVideos() {
  return prisma.video.findMany({
    where: { isPublished: true },
    orderBy: [{ materialSection: { order: "asc" } }, { order: "asc" }],
    include: { materialSection: { select: { id: true, title: true, slug: true } } },
  });
}

export async function getPublicVideo(videoId: string) {
  const video = await prisma.video.findUnique({
    where: { id: videoId },
    include: { materialSection: { select: { id: true, title: true, slug: true } } },
  });
  if (!video || !video.isPublished) throw ApiError.notFound("Video tidak ditemukan");
  return video;
}
