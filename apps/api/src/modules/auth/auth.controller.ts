import type { Request, Response } from "express";
import { asyncHandler } from "../../utils/asyncHandler";
import { ApiError } from "../../utils/ApiError";
import { setSessionCookies, clearSessionCookies, REFRESH_COOKIE_NAME } from "./cookies";
import * as authService from "./auth.service";

export const register = asyncHandler(async (req: Request, res: Response) => {
  const { user, accessToken, refreshToken, csrfToken } = await authService.registerUser(req.body);
  setSessionCookies(res, refreshToken, csrfToken);
  res.status(201).json({ success: true, data: { user, accessToken, csrfToken } });
});

export const login = asyncHandler(async (req: Request, res: Response) => {
  const { user, accessToken, refreshToken, csrfToken } = await authService.loginUser(req.body);
  setSessionCookies(res, refreshToken, csrfToken);
  res.status(200).json({ success: true, data: { user, accessToken, csrfToken } });
});

export const refresh = asyncHandler(async (req: Request, res: Response) => {
  const rawToken = req.cookies?.[REFRESH_COOKIE_NAME];
  if (!rawToken) throw ApiError.unauthorized("Sesi tidak ditemukan");

  const { user, accessToken, refreshToken, csrfToken } = await authService.rotateRefreshToken(rawToken);
  setSessionCookies(res, refreshToken, csrfToken);
  res.status(200).json({ success: true, data: { user, accessToken, csrfToken } });
});

export const logout = asyncHandler(async (req: Request, res: Response) => {
  const rawToken = req.cookies?.[REFRESH_COOKIE_NAME];
  if (rawToken) await authService.revokeRefreshToken(rawToken);
  clearSessionCookies(res);
  res.status(200).json({ success: true, data: { message: "Berhasil keluar" } });
});

export const me = asyncHandler(async (req: Request, res: Response) => {
  const user = await authService.getUserById(req.user!.id);
  res.status(200).json({ success: true, data: { user } });
});

export const forgotPassword = asyncHandler(async (req: Request, res: Response) => {
  await authService.requestPasswordReset(req.body.email);
  res.status(200).json({
    success: true,
    data: { message: "Jika email terdaftar, tautan reset password telah dikirim." },
  });
});

export const resetPassword = asyncHandler(async (req: Request, res: Response) => {
  await authService.resetPassword(req.body.token, req.body.password);
  res.status(200).json({ success: true, data: { message: "Password berhasil diperbarui." } });
});
