import { Router } from "express";
import { asyncHandler } from "../../utils/asyncHandler";
import { prisma } from "../../lib/prisma";
import { requireAuth } from "../../middleware/auth";
import { csrfProtection } from "../../middleware/security";
import { ApiError } from "../../utils/ApiError";

export const materialsRouter = Router();

materialsRouter.get(
  "/",
  asyncHandler(async (_req, res) => {
    const material = await prisma.material.findFirst({
      include: {
        sections: {
          where: { isPublished: true },
          orderBy: { order: "asc" },
          select: {
            id: true,
            slug: true,
            order: true,
            title: true,
            description: true,
            estimatedMinutes: true,
            upload: { select: { fileUrl: true, fileName: true } },
          },
        },
      },
    });
    res.status(200).json({ success: true, data: { material } });
  })
);

/**
 * Searching only title + description missed the point of this app: the
 * substance lives in the AI-expanded `contentBody`, so a student searching
 * the very topic they are reading about ("jaringan epitel") could get zero
 * hits whenever those words happened not to be in the heading. Matching runs
 * in Postgres rather than in the browser so the body never has to be shipped
 * to the client just to be searched.
 */
materialsRouter.get(
  "/search",
  asyncHandler(async (req, res) => {
    const q = String(req.query.q ?? "").trim();
    if (q.length < 2) {
      return res.status(200).json({ success: true, data: { results: [], query: q } });
    }

    const sections = await prisma.materialSection.findMany({
      where: {
        isPublished: true,
        OR: [
          { title: { contains: q, mode: "insensitive" } },
          { description: { contains: q, mode: "insensitive" } },
          { contentBody: { contains: q, mode: "insensitive" } },
        ],
      },
      orderBy: { order: "asc" },
      select: {
        id: true,
        slug: true,
        title: true,
        description: true,
        estimatedMinutes: true,
        contentBody: true,
      },
    });

    const results = sections.map(({ contentBody, ...section }) => {
      const inTitle = section.title.toLowerCase().includes(q.toLowerCase());
      const inDescription = section.description.toLowerCase().includes(q.toLowerCase());
      return {
        ...section,
        matchedIn: inTitle ? "title" : inDescription ? "description" : "content",
        // A short window around the hit, so the student can see *why* this
        // section matched when the words aren't in the title.
        snippet: inTitle || inDescription ? null : buildSnippet(contentBody ?? "", q),
      };
    });

    res.status(200).json({ success: true, data: { results, query: q } });
  })
);

function buildSnippet(body: string, q: string): string | null {
  const plain = body.replace(/[#*_`>]/g, "").replace(/\s+/g, " ").trim();
  const at = plain.toLowerCase().indexOf(q.toLowerCase());
  if (at === -1) return null;
  const start = Math.max(0, at - 60);
  const end = Math.min(plain.length, at + q.length + 90);
  return `${start > 0 ? "…" : ""}${plain.slice(start, end).trim()}${end < plain.length ? "…" : ""}`;
}

materialsRouter.get(
  "/sections/:slug",
  asyncHandler(async (req, res) => {
    const section = await prisma.materialSection.findUnique({
      where: { slug: req.params.slug },
      include: {
        mediaAssets: { orderBy: { order: "asc" } },
        videos: { orderBy: { order: "asc" } },
        microscopeSlides: { include: { hotspots: true }, orderBy: { order: "asc" } },
        quizzes: true,
        upload: { select: { fileUrl: true, fileName: true } },
      },
    });
    if (!section || !section.isPublished) {
      return res.status(404).json({ success: false, message: "Submateri tidak ditemukan" });
    }
    res.status(200).json({ success: true, data: { section } });
  })
);

materialsRouter.post(
  "/sections/:id/progress",
  requireAuth,
  csrfProtection,
  asyncHandler(async (req, res) => {
    const status = req.body?.status === "COMPLETED" ? "COMPLETED" : "IN_PROGRESS";
    const section = await prisma.materialSection.findUnique({ where: { id: req.params.id } });
    if (!section || !section.isPublished) throw ApiError.notFound("Submateri tidak ditemukan");

    const existing = await prisma.progress.findUnique({
      where: { userId_materialSectionId: { userId: req.user!.id, materialSectionId: section.id } },
    });

    if (existing?.status === "COMPLETED" && status === "IN_PROGRESS") {
      await prisma.progress.update({
        where: { id: existing.id },
        data: { lastAccessedAt: new Date() },
      });
    } else {
      await prisma.progress.upsert({
        where: { userId_materialSectionId: { userId: req.user!.id, materialSectionId: section.id } },
        create: {
          userId: req.user!.id,
          materialSectionId: section.id,
          status,
          progressPercent: status === "COMPLETED" ? 100 : 50,
          completedAt: status === "COMPLETED" ? new Date() : null,
        },
        update: {
          status,
          progressPercent: status === "COMPLETED" ? 100 : 50,
          lastAccessedAt: new Date(),
          completedAt: status === "COMPLETED" ? new Date() : undefined,
        },
      });
    }

    res.status(200).json({ success: true, data: { message: "Progress diperbarui" } });
  })
);
