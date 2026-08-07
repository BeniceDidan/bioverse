import type { Request, Response } from "express";
import { asyncHandler } from "../../utils/asyncHandler";
import { ApiError } from "../../utils/ApiError";
import * as videoService from "./video.service";

// ── Teacher ──────────────────────────────────────────────────────────────

export const createVideo = asyncHandler(async (req: Request, res: Response) => {
  const { materialSectionId, title, description, youtubeUrl, durationSeconds } = req.body;
  if (!materialSectionId || !title || !description || !youtubeUrl) {
    throw ApiError.badRequest("Submateri, judul, deskripsi, dan link YouTube wajib diisi");
  }
  const video = await videoService.createVideo(req.user!.id, {
    materialSectionId,
    title,
    description,
    youtubeUrl,
    durationSeconds: durationSeconds ? Number(durationSeconds) : undefined,
  });
  res.status(201).json({ success: true, data: { video } });
});

export const listVideos = asyncHandler(async (req: Request, res: Response) => {
  const videos = await videoService.listVideosForTeacher(req.user!.id);
  res.status(200).json({ success: true, data: { videos } });
});

export const updateVideo = asyncHandler(async (req: Request, res: Response) => {
  const video = await videoService.updateVideo(req.params.id, req.user!.id, req.body);
  res.status(200).json({ success: true, data: { video } });
});

export const publishVideo = asyncHandler(async (req: Request, res: Response) => {
  const video = await videoService.setVideoPublished(req.params.id, req.user!.id, true);
  res.status(200).json({ success: true, data: { video } });
});

export const unpublishVideo = asyncHandler(async (req: Request, res: Response) => {
  const video = await videoService.setVideoPublished(req.params.id, req.user!.id, false);
  res.status(200).json({ success: true, data: { video } });
});

export const deleteVideo = asyncHandler(async (req: Request, res: Response) => {
  await videoService.deleteVideo(req.params.id, req.user!.id);
  res.status(200).json({ success: true, data: { message: "Video dihapus" } });
});

// ── Public ───────────────────────────────────────────────────────────────

export const listPublicVideos = asyncHandler(async (_req: Request, res: Response) => {
  const videos = await videoService.listPublicVideos();
  res.status(200).json({ success: true, data: { videos } });
});

export const getPublicVideo = asyncHandler(async (req: Request, res: Response) => {
  const video = await videoService.getPublicVideo(req.params.id);
  res.status(200).json({ success: true, data: { video } });
});
