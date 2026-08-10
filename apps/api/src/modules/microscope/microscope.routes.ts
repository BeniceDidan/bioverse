import { Router } from "express";
import { createHotspotSchema, updateHotspotSchema } from "@bioverse/shared";
import { requireAuth, requireRole } from "../../middleware/auth";
import { csrfProtection } from "../../middleware/security";
import { validateBody } from "../../middleware/validate";
import { uploadSlideImage } from "./microscope.storage";
import * as microscopeController from "./microscope.controller";

export const teacherMicroscopeRouter = Router();

teacherMicroscopeRouter.use(requireAuth, requireRole("TEACHER"));

teacherMicroscopeRouter.get("/slides", microscopeController.listSlides);
teacherMicroscopeRouter.post("/slides", csrfProtection, uploadSlideImage, microscopeController.createSlide);
teacherMicroscopeRouter.get("/slides/:id", microscopeController.getSlide);
teacherMicroscopeRouter.patch("/slides/:id", csrfProtection, microscopeController.updateSlide);
teacherMicroscopeRouter.post("/slides/:id/publish", csrfProtection, microscopeController.publishSlide);
teacherMicroscopeRouter.post("/slides/:id/unpublish", csrfProtection, microscopeController.unpublishSlide);
// Before "/slides/:id" so "all" isn't mistaken for a slide id.
teacherMicroscopeRouter.delete("/slides/all", csrfProtection, microscopeController.deleteAllSlides);
teacherMicroscopeRouter.delete("/slides/:id", csrfProtection, microscopeController.deleteSlide);

teacherMicroscopeRouter.post(
  "/slides/:id/hotspots",
  csrfProtection,
  validateBody(createHotspotSchema),
  microscopeController.createHotspot
);
teacherMicroscopeRouter.patch(
  "/hotspots/:hotspotId",
  csrfProtection,
  validateBody(updateHotspotSchema),
  microscopeController.updateHotspot
);
teacherMicroscopeRouter.delete("/hotspots/:hotspotId", csrfProtection, microscopeController.deleteHotspot);

export const microscopeRouter = Router();

microscopeRouter.get("/slides", microscopeController.listPublicSlides);
microscopeRouter.get("/slides/:id", microscopeController.getPublicSlide);
