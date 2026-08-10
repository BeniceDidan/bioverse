import type { Request, Response } from "express";
import { asyncHandler } from "../../utils/asyncHandler";
import * as dashboardService from "./dashboard.service";
import { buildGradesWorkbook, gradesFileName } from "./dashboard.export";

export const getStudentDashboard = asyncHandler(async (req: Request, res: Response) => {
  const dashboard = await dashboardService.getStudentDashboard(req.user!.id);
  res.status(200).json({ success: true, data: { dashboard } });
});

export const getTeacherDashboard = asyncHandler(async (_req: Request, res: Response) => {
  const dashboard = await dashboardService.getTeacherDashboard();
  res.status(200).json({ success: true, data: { dashboard } });
});

export const exportGrades = asyncHandler(async (_req: Request, res: Response) => {
  const buffer = await buildGradesWorkbook();
  res.setHeader("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
  res.setHeader("Content-Disposition", `attachment; filename="${gradesFileName()}"`);
  res.setHeader("Content-Length", String(buffer.length));
  res.setHeader("Cache-Control", "no-store");
  res.status(200).send(buffer);
});

export const deleteStudent = asyncHandler(async (req: Request, res: Response) => {
  const name = await dashboardService.deleteStudent(req.params.id);
  res.status(200).json({ success: true, data: { message: `Akun ${name} dihapus` } });
});
