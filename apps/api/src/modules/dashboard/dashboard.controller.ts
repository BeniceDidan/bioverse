import type { Request, Response } from "express";
import { asyncHandler } from "../../utils/asyncHandler";
import * as dashboardService from "./dashboard.service";

export const getStudentDashboard = asyncHandler(async (req: Request, res: Response) => {
  const dashboard = await dashboardService.getStudentDashboard(req.user!.id);
  res.status(200).json({ success: true, data: { dashboard } });
});

export const getTeacherDashboard = asyncHandler(async (_req: Request, res: Response) => {
  const dashboard = await dashboardService.getTeacherDashboard();
  res.status(200).json({ success: true, data: { dashboard } });
});
