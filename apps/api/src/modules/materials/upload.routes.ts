import { Router } from "express";
import { requireAuth, requireRole } from "../../middleware/auth";
import { csrfProtection } from "../../middleware/security";
import { asyncHandler } from "../../utils/asyncHandler";
import { prisma } from "../../lib/prisma";
import { uploadPdf } from "./upload.storage";
import * as uploadController from "./upload.controller";

export const teacherMaterialsRouter = Router();

teacherMaterialsRouter.use(requireAuth, requireRole("TEACHER"));

teacherMaterialsRouter.get(
  "/sections",
  asyncHandler(async (_req, res) => {
    const sections = await prisma.materialSection.findMany({
      orderBy: { order: "asc" },
      select: { id: true, title: true, isPublished: true },
    });
    res.status(200).json({ success: true, data: { sections } });
  })
);

teacherMaterialsRouter.get("/uploads", uploadController.listUploads);
teacherMaterialsRouter.get("/uploads/:id", uploadController.getUploadDetail);
teacherMaterialsRouter.post("/upload", csrfProtection, uploadPdf, uploadController.uploadPdfHandler);
teacherMaterialsRouter.post("/uploads/:id/expand", csrfProtection, uploadController.expandUpload);
teacherMaterialsRouter.post("/uploads/:id/publish", csrfProtection, uploadController.publishUpload);
teacherMaterialsRouter.post(
  "/uploads/:id/replace",
  csrfProtection,
  uploadPdf,
  uploadController.replaceUploadFile
);
// Declared before "/uploads/:id" so "all" is never read as an upload id.
teacherMaterialsRouter.delete("/uploads/all", csrfProtection, uploadController.deleteAllUploads);
teacherMaterialsRouter.delete("/uploads/:id", csrfProtection, uploadController.deleteUpload);
teacherMaterialsRouter.patch("/sections/:id", csrfProtection, uploadController.updateSection);
teacherMaterialsRouter.delete("/sections/:id", csrfProtection, uploadController.deleteSection);
