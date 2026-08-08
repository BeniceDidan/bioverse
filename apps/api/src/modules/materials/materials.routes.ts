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
