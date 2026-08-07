import type { Request, Response } from "express";
import { asyncHandler } from "../../utils/asyncHandler";
import { ApiError } from "../../utils/ApiError";
import * as microscopeService from "./microscope.service";

// ── Teacher ──────────────────────────────────────────────────────────────

export const createSlide = asyncHandler(async (req: Request, res: Response) => {
  if (!req.file) throw ApiError.badRequest("Gambar preparat wajib diunggah");
  const { materialSectionId, tissueName, description } = req.body;
  if (!materialSectionId || !tissueName || !description) {
    throw ApiError.badRequest("Submateri, nama jaringan, dan deskripsi wajib diisi");
  }
  const slide = await microscopeService.createSlide(req.user!.id, {
    materialSectionId,
    tissueName,
    description,
    file: req.file,
  });
  res.status(201).json({ success: true, data: { slide } });
});

export const listSlides = asyncHandler(async (req: Request, res: Response) => {
  const slides = await microscopeService.listSlidesForTeacher(req.user!.id);
  res.status(200).json({ success: true, data: { slides } });
});

export const getSlide = asyncHandler(async (req: Request, res: Response) => {
  const slide = await microscopeService.getSlideForTeacher(req.params.id, req.user!.id);
  res.status(200).json({ success: true, data: { slide } });
});

export const updateSlide = asyncHandler(async (req: Request, res: Response) => {
  const slide = await microscopeService.updateSlide(req.params.id, req.user!.id, req.body);
  res.status(200).json({ success: true, data: { slide } });
});

export const publishSlide = asyncHandler(async (req: Request, res: Response) => {
  const slide = await microscopeService.setSlidePublished(req.params.id, req.user!.id, true);
  res.status(200).json({ success: true, data: { slide } });
});

export const unpublishSlide = asyncHandler(async (req: Request, res: Response) => {
  const slide = await microscopeService.setSlidePublished(req.params.id, req.user!.id, false);
  res.status(200).json({ success: true, data: { slide } });
});

export const deleteSlide = asyncHandler(async (req: Request, res: Response) => {
  await microscopeService.deleteSlide(req.params.id, req.user!.id);
  res.status(200).json({ success: true, data: { message: "Preparat dihapus" } });
});

export const createHotspot = asyncHandler(async (req: Request, res: Response) => {
  const hotspot = await microscopeService.createHotspot(req.params.id, req.user!.id, req.body);
  res.status(201).json({ success: true, data: { hotspot } });
});

export const updateHotspot = asyncHandler(async (req: Request, res: Response) => {
  const hotspot = await microscopeService.updateHotspot(req.params.hotspotId, req.user!.id, req.body);
  res.status(200).json({ success: true, data: { hotspot } });
});

export const deleteHotspot = asyncHandler(async (req: Request, res: Response) => {
  await microscopeService.deleteHotspot(req.params.hotspotId, req.user!.id);
  res.status(200).json({ success: true, data: { message: "Label dihapus" } });
});

// ── Public ───────────────────────────────────────────────────────────────

export const listPublicSlides = asyncHandler(async (_req: Request, res: Response) => {
  const slides = await microscopeService.listPublicSlides();
  res.status(200).json({ success: true, data: { slides } });
});

export const getPublicSlide = asyncHandler(async (req: Request, res: Response) => {
  const slide = await microscopeService.getPublicSlide(req.params.id);
  res.status(200).json({ success: true, data: { slide } });
});
