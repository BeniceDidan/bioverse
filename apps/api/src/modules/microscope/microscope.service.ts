import { prisma } from "../../lib/prisma";
import { uploadBuffer, deleteByUrl } from "../../lib/storage";
import { ApiError } from "../../utils/ApiError";

interface CreateSlideInput {
  materialSectionId: string;
  tissueName: string;
  description: string;
  file: Express.Multer.File;
}

export async function createSlide(teacherId: string, input: CreateSlideInput) {
  const section = await prisma.materialSection.findUnique({ where: { id: input.materialSectionId } });
  if (!section) throw ApiError.badRequest("Submateri tidak ditemukan");

  const count = await prisma.microscopeSlide.count({ where: { materialSectionId: input.materialSectionId } });
  const slideImageUrl = await uploadBuffer(
    input.file.buffer,
    input.file.originalname,
    input.file.mimetype,
    "microscope-slides"
  );

  return prisma.microscopeSlide.create({
    data: {
      materialSectionId: input.materialSectionId,
      teacherId,
      tissueName: input.tissueName,
      description: input.description,
      slideImageUrl,
      order: count + 1,
    },
  });
}

export async function listSlidesForTeacher(teacherId: string) {
  return prisma.microscopeSlide.findMany({
    where: { teacherId },
    orderBy: { createdAt: "desc" },
    include: {
      materialSection: { select: { id: true, title: true } },
      _count: { select: { hotspots: true } },
    },
  });
}

async function getOwnedSlide(slideId: string, teacherId: string) {
  const slide = await prisma.microscopeSlide.findUnique({ where: { id: slideId } });
  if (!slide || slide.teacherId !== teacherId) throw ApiError.notFound("Preparat tidak ditemukan");
  return slide;
}

export async function getSlideForTeacher(slideId: string, teacherId: string) {
  await getOwnedSlide(slideId, teacherId);
  return prisma.microscopeSlide.findUnique({
    where: { id: slideId },
    include: { hotspots: { orderBy: { createdAt: "asc" } }, materialSection: { select: { id: true, title: true } } },
  });
}

export async function updateSlide(
  slideId: string,
  teacherId: string,
  data: Partial<{ tissueName: string; description: string }>
) {
  await getOwnedSlide(slideId, teacherId);
  return prisma.microscopeSlide.update({ where: { id: slideId }, data });
}

export async function setSlidePublished(slideId: string, teacherId: string, isPublished: boolean) {
  await getOwnedSlide(slideId, teacherId);
  return prisma.microscopeSlide.update({ where: { id: slideId }, data: { isPublished } });
}

export async function deleteSlide(slideId: string, teacherId: string) {
  const slide = await getOwnedSlide(slideId, teacherId);
  await prisma.microscopeSlide.delete({ where: { id: slideId } });
  await deleteByUrl(slide.slideImageUrl).catch(() => {});
}

interface HotspotInput {
  xPercent: number;
  yPercent: number;
  label: string;
  tissueName: string;
  tissueFunction: string;
  characteristics: string;
  location: string;
  example: string;
}

export async function createHotspot(slideId: string, teacherId: string, input: HotspotInput) {
  await getOwnedSlide(slideId, teacherId);
  return prisma.microscopeHotspot.create({ data: { slideId, ...input } });
}

async function getOwnedHotspot(hotspotId: string, teacherId: string) {
  const hotspot = await prisma.microscopeHotspot.findUnique({ where: { id: hotspotId }, include: { slide: true } });
  if (!hotspot || hotspot.slide.teacherId !== teacherId) throw ApiError.notFound("Label tidak ditemukan");
  return hotspot;
}

export async function updateHotspot(hotspotId: string, teacherId: string, input: Partial<HotspotInput>) {
  await getOwnedHotspot(hotspotId, teacherId);
  return prisma.microscopeHotspot.update({ where: { id: hotspotId }, data: input });
}

export async function deleteHotspot(hotspotId: string, teacherId: string) {
  await getOwnedHotspot(hotspotId, teacherId);
  await prisma.microscopeHotspot.delete({ where: { id: hotspotId } });
}

// ── Public (student-facing) ──────────────────────────────────────────────

export async function listPublicSlides() {
  return prisma.microscopeSlide.findMany({
    where: { isPublished: true },
    orderBy: [{ materialSection: { order: "asc" } }, { order: "asc" }],
    include: {
      materialSection: { select: { id: true, title: true, slug: true } },
      _count: { select: { hotspots: true } },
    },
  });
}

export async function getPublicSlide(slideId: string) {
  const slide = await prisma.microscopeSlide.findUnique({
    where: { id: slideId },
    include: { hotspots: { orderBy: { createdAt: "asc" } }, materialSection: { select: { id: true, title: true, slug: true } } },
  });
  if (!slide || !slide.isPublished) throw ApiError.notFound("Preparat tidak ditemukan");
  return slide;
}
