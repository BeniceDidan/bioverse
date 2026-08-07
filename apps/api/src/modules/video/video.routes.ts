import { Router } from "express";
import { requireAuth, requireRole } from "../../middleware/auth";
import { csrfProtection } from "../../middleware/security";
import * as videoController from "./video.controller";

export const teacherVideoRouter = Router();

teacherVideoRouter.use(requireAuth, requireRole("TEACHER"));

teacherVideoRouter.get("/videos", videoController.listVideos);
teacherVideoRouter.post("/videos", csrfProtection, videoController.createVideo);
teacherVideoRouter.patch("/videos/:id", csrfProtection, videoController.updateVideo);
teacherVideoRouter.post("/videos/:id/publish", csrfProtection, videoController.publishVideo);
teacherVideoRouter.post("/videos/:id/unpublish", csrfProtection, videoController.unpublishVideo);
teacherVideoRouter.delete("/videos/:id", csrfProtection, videoController.deleteVideo);

export const videoRouter = Router();

videoRouter.get("/videos", videoController.listPublicVideos);
videoRouter.get("/videos/:id", videoController.getPublicVideo);
