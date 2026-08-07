import type { Request, Response } from "express";
import { asyncHandler } from "../../utils/asyncHandler";
import { ApiError } from "../../utils/ApiError";
import * as aiTutorService from "./ai-tutor.service";

export const listSessions = asyncHandler(async (req: Request, res: Response) => {
  const sessions = await aiTutorService.listSessions(req.user!.id);
  res.status(200).json({ success: true, data: { sessions } });
});

export const createSession = asyncHandler(async (req: Request, res: Response) => {
  const session = await aiTutorService.createSession(req.user!.id);
  res.status(201).json({ success: true, data: { session } });
});

export const getSession = asyncHandler(async (req: Request, res: Response) => {
  const session = await aiTutorService.getSession(req.params.id, req.user!.id);
  res.status(200).json({ success: true, data: { session } });
});

export const deleteSession = asyncHandler(async (req: Request, res: Response) => {
  await aiTutorService.deleteSession(req.params.id, req.user!.id);
  res.status(200).json({ success: true, data: { message: "Percakapan dihapus" } });
});

export const sendMessage = asyncHandler(async (req: Request, res: Response) => {
  const content = (req.body?.content ?? "").trim();
  if (!content) throw ApiError.badRequest("Pesan tidak boleh kosong");
  if (content.length > 2000) throw ApiError.badRequest("Pesan terlalu panjang (maks. 2000 karakter)");

  const result = await aiTutorService.sendMessage(req.params.id, req.user!.id, content);
  res.status(201).json({ success: true, data: result });
});

export const regenerate = asyncHandler(async (req: Request, res: Response) => {
  const result = await aiTutorService.regenerateLastReply(req.params.id, req.user!.id);
  res.status(200).json({ success: true, data: result });
});
