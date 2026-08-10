import type { Request, Response } from "express";
import { asyncHandler } from "../../utils/asyncHandler";
import { ApiError } from "../../utils/ApiError";
import * as uploadService from "./upload.service";

export const uploadPdfHandler = asyncHandler(async (req: Request, res: Response) => {
  if (!req.file) throw ApiError.badRequest("File PDF wajib diunggah");
  const upload = await uploadService.createUpload(req.user!.id, req.file);
  res.status(201).json({ success: true, data: { upload } });
});

export const listUploads = asyncHandler(async (req: Request, res: Response) => {
  const uploads = await uploadService.listUploadsForTeacher(req.user!.id);
  res.status(200).json({ success: true, data: { uploads } });
});

export const getUploadDetail = asyncHandler(async (req: Request, res: Response) => {
  const upload = await uploadService.getUploadDetail(req.params.id, req.user!.id);
  res.status(200).json({ success: true, data: { upload } });
});

export const expandUpload = asyncHandler(async (req: Request, res: Response) => {
  const upload = await uploadService.expandUpload(req.params.id, req.user!.id);
  res.status(200).json({ success: true, data: { upload } });
});

export const publishUpload = asyncHandler(async (req: Request, res: Response) => {
  const upload = await uploadService.publishUpload(req.params.id, req.user!.id);
  res.status(200).json({ success: true, data: { upload } });
});

export const replaceUploadFile = asyncHandler(async (req: Request, res: Response) => {
  if (!req.file) throw ApiError.badRequest("File PDF wajib diunggah");
  const upload = await uploadService.replaceUploadFile(req.params.id, req.user!.id, req.file);
  res.status(200).json({ success: true, data: { upload } });
});

export const deleteUpload = asyncHandler(async (req: Request, res: Response) => {
  await uploadService.deleteUploadRecord(req.params.id, req.user!.id);
  res.status(200).json({ success: true, data: { message: "Riwayat upload dihapus" } });
});

export const deleteAllUploads = asyncHandler(async (req: Request, res: Response) => {
  const count = await uploadService.deleteAllUploads(req.user!.id);
  res.status(200).json({ success: true, data: { count, message: `${count} materi beserta riwayatnya dihapus` } });
});

export const updateSection = asyncHandler(async (req: Request, res: Response) => {
  const { title, description } = req.body;
  if (!title && !description) throw ApiError.badRequest("Judul atau deskripsi wajib diisi");
  const section = await uploadService.updateSection(req.params.id, { title, description });
  res.status(200).json({ success: true, data: { section } });
});

export const deleteSection = asyncHandler(async (req: Request, res: Response) => {
  await uploadService.deleteSection(req.params.id);
  res.status(200).json({ success: true, data: { message: "Materi dihapus" } });
});
