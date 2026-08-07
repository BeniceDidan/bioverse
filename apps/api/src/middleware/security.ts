import cors from "cors";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import type { NextFunction, Request, Response } from "express";
import { env } from "../config/env";
import { ApiError } from "../utils/ApiError";

export const corsMiddleware = cors({
  origin: env.webOrigin,
  credentials: true,
});

export const helmetMiddleware = helmet({
  // Static assets under /uploads (materi PDFs, microscope slide images) are
  // meant to be embedded by the web app on a different origin/port.
  crossOriginResourcePolicy: { policy: "cross-origin" },
});

export const authRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: "Terlalu banyak percobaan. Coba lagi beberapa saat lagi." },
});

export const apiRateLimiter = rateLimit({
  windowMs: 60 * 1000,
  limit: 120,
  standardHeaders: true,
  legacyHeaders: false,
});

const SAFE_METHODS = new Set(["GET", "HEAD", "OPTIONS"]);

/**
 * Double-submit cookie CSRF check: the client must echo the `csrf_token`
 * cookie value back in the `x-csrf-token` header for any state-changing
 * request. The cookie itself is set (non-httpOnly) on login/register.
 */
export function csrfProtection(req: Request, _res: Response, next: NextFunction) {
  if (SAFE_METHODS.has(req.method)) return next();

  const cookieToken = req.cookies?.csrf_token;
  const headerToken = req.headers["x-csrf-token"];

  if (!cookieToken || !headerToken || cookieToken !== headerToken) {
    return next(ApiError.forbidden("Validasi CSRF gagal"));
  }
  next();
}
