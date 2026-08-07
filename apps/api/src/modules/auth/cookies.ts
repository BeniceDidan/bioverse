import type { Response } from "express";
import { env } from "../../config/env";

const REFRESH_COOKIE = "refresh_token";
const CSRF_COOKIE = "csrf_token";

// The web app and API are deployed on different origins (e.g. vercel.app /
// onrender.com), so these cookies must be sent cross-site. That requires
// SameSite=None, which browsers only honor alongside Secure — fine in
// production (https), but SameSite=None without https is rejected outright
// in local dev, so dev keeps Lax on plain http.
const CROSS_SITE_SAMESITE = env.isProduction ? "none" : "lax";

export function setSessionCookies(res: Response, refreshToken: string, csrfToken: string) {
  res.cookie(REFRESH_COOKIE, refreshToken, {
    httpOnly: true,
    secure: env.isProduction,
    sameSite: CROSS_SITE_SAMESITE,
    path: "/api/auth",
    maxAge: 7 * 24 * 60 * 60 * 1000,
  });
  res.cookie(CSRF_COOKIE, csrfToken, {
    httpOnly: false,
    secure: env.isProduction,
    sameSite: CROSS_SITE_SAMESITE,
    path: "/",
    maxAge: 7 * 24 * 60 * 60 * 1000,
  });
}

export function clearSessionCookies(res: Response) {
  res.clearCookie(REFRESH_COOKIE, { path: "/api/auth" });
  res.clearCookie(CSRF_COOKIE, { path: "/" });
}

export const REFRESH_COOKIE_NAME = REFRESH_COOKIE;
