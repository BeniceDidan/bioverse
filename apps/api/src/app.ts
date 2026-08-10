import express from "express";
import cookieParser from "cookie-parser";
import path from "node:path";
import { corsMiddleware, helmetMiddleware, apiRateLimiter } from "./middleware/security";
import { errorHandler, notFoundHandler } from "./middleware/errorHandler";
import { authRouter } from "./modules/auth/auth.routes";
import { materialsRouter } from "./modules/materials/materials.routes";
import { teacherMaterialsRouter } from "./modules/materials/upload.routes";
import { aiTutorRouter } from "./modules/ai-tutor/ai-tutor.routes";
import { microscopeRouter, teacherMicroscopeRouter } from "./modules/microscope/microscope.routes";
import { quizRouter, teacherQuizRouter } from "./modules/quiz/quiz.routes";
import { videoRouter, teacherVideoRouter } from "./modules/video/video.routes";
import { dashboardRouter } from "./modules/dashboard/dashboard.routes";
import { filesRouter } from "./modules/files/files.routes";

export function createApp() {
  const app = express();

  app.disable("x-powered-by");
  // Requests arrive through two reverse proxies in front of the app: Vercel's
  // edge (which now proxies /api/* same-origin from the web app, see
  // apps/web/next.config.ts) and Render's own load balancer. Without telling
  // Express how many hops to trust, it treats every request as coming from
  // the nearest proxy's IP, which collapses everyone behind them (e.g. a
  // whole school's shared network) into a single express-rate-limit bucket
  // instead of limiting per real client.
  app.set("trust proxy", 2);
  app.use(helmetMiddleware);
  app.use(corsMiddleware);
  app.use("/uploads", express.static(path.join(process.cwd(), "uploads")));
  app.use(express.json({ limit: "1mb" }));
  app.use(cookieParser());
  app.use(apiRateLimiter);

  app.get("/api/health", (_req, res) => {
    res.status(200).json({ success: true, data: { status: "ok", timestamp: new Date().toISOString() } });
  });

  app.use("/api/auth", authRouter);
  app.use("/api/materials", materialsRouter);
  app.use("/api/teacher/materials", teacherMaterialsRouter);
  app.use("/api/ai-tutor", aiTutorRouter);
  app.use("/api/microscope", microscopeRouter);
  app.use("/api/teacher/microscope", teacherMicroscopeRouter);
  app.use("/api/quiz", quizRouter);
  app.use("/api/teacher/quiz", teacherQuizRouter);
  app.use("/api/video", videoRouter);
  app.use("/api/teacher/video", teacherVideoRouter);
  app.use("/api/dashboard", dashboardRouter);
  app.use("/api/files", filesRouter);

  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}
