import { Router } from "express";
import { requireAuth, requireRole } from "../../middleware/auth";
import { csrfProtection } from "../../middleware/security";
import * as dashboardController from "./dashboard.controller";

export const dashboardRouter = Router();

dashboardRouter.use(requireAuth);

dashboardRouter.get("/student", dashboardController.getStudentDashboard);
dashboardRouter.get("/teacher", requireRole("TEACHER"), dashboardController.getTeacherDashboard);
dashboardRouter.get("/teacher/export", requireRole("TEACHER"), dashboardController.exportGrades);
dashboardRouter.delete(
  "/teacher/students/:id",
  requireRole("TEACHER"),
  csrfProtection,
  dashboardController.deleteStudent
);
