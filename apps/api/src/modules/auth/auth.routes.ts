import { Router } from "express";
import { forgotPasswordSchema, loginSchema, registerSchema, resetPasswordSchema } from "@bioverse/shared";
import { validateBody } from "../../middleware/validate";
import { requireAuth } from "../../middleware/auth";
import { authRateLimiter, csrfProtection } from "../../middleware/security";
import * as authController from "./auth.controller";

export const authRouter = Router();

authRouter.post("/register", authRateLimiter, validateBody(registerSchema), authController.register);
authRouter.post("/login", authRateLimiter, validateBody(loginSchema), authController.login);
authRouter.post("/refresh", authRateLimiter, authController.refresh);
authRouter.post("/logout", csrfProtection, authController.logout);
authRouter.get("/me", requireAuth, authController.me);
authRouter.post(
  "/forgot-password",
  authRateLimiter,
  validateBody(forgotPasswordSchema),
  authController.forgotPassword
);
authRouter.post(
  "/reset-password",
  authRateLimiter,
  validateBody(resetPasswordSchema),
  authController.resetPassword
);
