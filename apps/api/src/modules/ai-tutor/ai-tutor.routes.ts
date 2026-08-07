import { Router } from "express";
import { requireAuth } from "../../middleware/auth";
import { csrfProtection } from "../../middleware/security";
import * as aiTutorController from "./ai-tutor.controller";

export const aiTutorRouter = Router();

aiTutorRouter.use(requireAuth);

aiTutorRouter.get("/sessions", aiTutorController.listSessions);
aiTutorRouter.post("/sessions", csrfProtection, aiTutorController.createSession);
aiTutorRouter.get("/sessions/:id", aiTutorController.getSession);
aiTutorRouter.delete("/sessions/:id", csrfProtection, aiTutorController.deleteSession);
aiTutorRouter.post("/sessions/:id/messages", csrfProtection, aiTutorController.sendMessage);
aiTutorRouter.post("/sessions/:id/regenerate", csrfProtection, aiTutorController.regenerate);
