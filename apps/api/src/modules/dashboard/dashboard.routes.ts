import { Router } from "express";
import { requireAuth, requireRole } from "../../middleware/auth";
import * as dashboardController from "./dashboard.controller";

export const dashboardRouter = Router();

dashboardRouter.use(requireAuth);

dashboardRouter.get("/student", dashboardController.getStudentDashboard);
dashboardRouter.get("/teacher", requireRole("TEACHER"), dashboardController.getTeacherDashboard);
