import { prisma } from "../../lib/prisma";
import { uploadBuffer, deleteByUrl } from "../../lib/storage";
import { ApiError } from "../../utils/ApiError";

const TISSUE_TYPES = ["EPITEL", "IKAT", "OTOT", "SARAF", "LAINNYA"] as const;
type TissueType = (typeof TISSUE_TYPES)[number];

interface CreateSlideInput {
  materialSectionId: string;
  tissueName: string;
  description: string;
  tissueType?: TissueType;
  file: Express.Multer.File;
}

/**
 * Falls back to reading the tissue name when the teacher hasn't picked a
 * category. Slides are almost always named after their tissue ("Jaringan Epitel
 * Pipih"), so this gets existing and hastily-filled slides into the right group
 * without forcing anyone to re-enter what they already typed.
 */
export function guessTissueType(tissueName: string): TissueType {
  const name = tissueName.toLowerCase();
  if (name.includes("epitel")) return "EPITEL";
  // "tulang belakang" checked here, before the bone rule below claims it for
  // connective tissue — the spinal cord is nervous tissue despite the name.
  if (name.includes("saraf") || name.includes("neuron") || name.includes("tulang belakang")) return "SARAF";
  if (name.includes("otot")) return "OTOT";
  if (name.includes("ikat") || name.includes("tulang") || name.includes("darah") || name.includes("lemak"))
    return "IKAT";
  return "LAINNYA";
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
      tissueType: input.tissueType ?? guessTissueType(input.tissueName),
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
  data: Partial<{ tissueName: string; description: string; materialSectionId: string; tissueType: TissueType }>
) {
  await getOwnedSlide(slideId, teacherId);

  if (data.materialSectionId) {
    const section = await prisma.materialSection.findUnique({ where: { id: data.materialSectionId } });
    if (!section) throw ApiError.badRequest("Submateri tidak ditemukan");
  }

  if (data.tissueType && !TISSUE_TYPES.includes(data.tissueType)) {
    throw ApiError.badRequest("Jenis jaringan tidak dikenal");
  }

  // Only these four fields, picked by name. This route has no schema in front
  // of it, so anything spread straight into Prisma is whatever the client sent
  // — which let a PATCH carrying teacherId hand the slide to another account
  // and drop it out of its owner's list entirely.
  return prisma.microscopeSlide.update({
    where: { id: slideId },
    data: {
      ...(data.tissueName !== undefined && { tissueName: data.tissueName }),
      ...(data.description !== undefined && { description: data.description }),
      ...(data.materialSectionId !== undefined && { materialSectionId: data.materialSectionId }),
      ...(data.tissueType !== undefined && { tissueType: data.tissueType }),
    },
  });
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

/** Clears every preparat this teacher owns, taking each slide image out of
 * storage too so the bucket doesn't accumulate orphans. */
export async function deleteAllSlides(teacherId: string) {
  const slides = await prisma.microscopeSlide.findMany({
    where: { teacherId },
    select: { id: true, slideImageUrl: true },
  });
  if (slides.length === 0) return 0;

  await prisma.microscopeSlide.deleteMany({ where: { teacherId } });
  await Promise.all(slides.map((s) => deleteByUrl(s.slideImageUrl).catch(() => {})));
  return slides.length;
}

interface HotspotInput {
  xPercent: number;
  yPercent: number;
  label: string;
  tissueName?: string;
  tissueFunction: string;
  characteristics: string;
  location: string;
  example: string;
}

export async function createHotspot(slideId: string, teacherId: string, input: HotspotInput) {
  const slide = await getOwnedSlide(slideId, teacherId);
  // The tissue name belongs to the slide, not to each label on it. Older rows
  // carry their own copy, so a value sent explicitly still wins.
  return prisma.microscopeHotspot.create({
    data: { slideId, ...input, tissueName: input.tissueName?.trim() || slide.tissueName },
  });
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
    orderBy: [{ tissueType: "asc" }, { materialSection: { order: "asc" } }, { order: "asc" }],
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
