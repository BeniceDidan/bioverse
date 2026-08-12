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

// Every limit here is keyed by IP, and a whole class shares one public address
// behind the school's NAT — so the server sees thirty students as a single very
// busy visitor. A 30-student load test against the previous numbers (20 logins
// per 15 min, 120 requests per minute) locked 10 students out of logging in
// entirely and blocked most quiz answers; even 15 students failed. The server
// itself was never the problem — it answered in 8-18ms throughout.

/**
 * Guards against password guessing, keyed on the account rather than the
 * address. That distinction is the point: an attacker hammering one account
 * cannot also burn through a classroom's shared allowance, and a classroom
 * cannot lock itself out. Successful logins don't count, so a student who
 * types their password correctly never consumes any of it.
 */
export const loginRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 10,
  skipSuccessfulRequests: true,
  keyGenerator: (req) => {
    const email = typeof req.body?.email === "string" ? req.body.email.trim().toLowerCase() : "";
    return email ? `akun:${email}` : `ip:${req.ip}`;
  },
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: "Terlalu banyak percobaan masuk untuk akun ini. Coba lagi dalam beberapa menit.",
  },
});

/**
 * A ceiling per address so one machine can't enumerate accounts, sized for a
 * class rather than a person: 40 students signing in and occasionally
 * re-authenticating fits comfortably under 300 in a quarter hour.
 */
export const authIpRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 300,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: "Terlalu banyak permintaan dari jaringan ini. Coba lagi sebentar lagi." },
});

/**
 * Sized for a class doing a full lesson at once: reading a materi and working
 * through a quiz costs a student roughly 15-20 requests a minute, so 40 of them
 * peak around 800. 1200 leaves headroom while still stopping a runaway client.
 */
export const apiRateLimiter = rateLimit({
  windowMs: 60 * 1000,
  limit: 1200,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: "Terlalu banyak permintaan. Tunggu sebentar lalu coba lagi." },
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
