import type { NextFunction, Request, Response } from "express";
import multer from "multer";
import { ApiError } from "../utils/ApiError";
import { env } from "../config/env";

export function notFoundHandler(req: Request, res: Response) {
  res.status(404).json({ success: false, message: `Rute ${req.method} ${req.path} tidak ditemukan` });
}

export function errorHandler(err: unknown, req: Request, res: Response, _next: NextFunction) {
  if (err instanceof ApiError) {
    return res.status(err.statusCode).json({
      success: false,
      message: err.message,
      ...(err.errors ? { errors: err.errors } : {}),
    });
  }

  // Multer's own errors (file too large, unexpected field, etc.) previously
  // fell through to the generic 500 below instead of a clear, actionable
  // message — a likely real cause of "some files fail to upload" with no
  // useful feedback to the teacher.
  if (err instanceof multer.MulterError) {
    const message =
      err.code === "LIMIT_FILE_SIZE"
        ? "Ukuran file terlalu besar."
        : "Gagal mengunggah file. Pastikan format dan ukuran file sesuai.";
    return res.status(400).json({ success: false, message });
  }

  if (!env.isProduction) {
    // eslint-disable-next-line no-console
    console.error(err);
  }

  res.status(500).json({
    success: false,
    message: "Terjadi kesalahan pada server. Silakan coba lagi.",
  });
}
