import type { Response } from "express";
import { env } from "../../config/env";

const REFRESH_COOKIE = "refresh_token";
const CSRF_COOKIE = "csrf_token";

export function setSessionCookies(res: Response, refreshToken: string, csrfToken: string) {
  res.cookie(REFRESH_COOKIE, refreshToken, {
    httpOnly: true,
    secure: env.isProduction,
    sameSite: "lax",
    path: "/api/auth",
    maxAge: 7 * 24 * 60 * 60 * 1000,
  });
  res.cookie(CSRF_COOKIE, csrfToken, {
    httpOnly: false,
    secure: env.isProduction,
    sameSite: "lax",
    path: "/",
    maxAge: 7 * 24 * 60 * 60 * 1000,
  });
}

export function clearSessionCookies(res: Response) {
  res.clearCookie(REFRESH_COOKIE, { path: "/api/auth" });
  res.clearCookie(CSRF_COOKIE, { path: "/" });
}

export const REFRESH_COOKIE_NAME = REFRESH_COOKIE;
