import { Router } from "express";
import { forgotPasswordSchema, loginSchema, registerSchema, resetPasswordSchema } from "@bioverse/shared";
import { validateBody } from "../../middleware/validate";
import { requireAuth } from "../../middleware/auth";
import { authIpRateLimiter, csrfProtection, loginRateLimiter } from "../../middleware/security";
import * as authController from "./auth.controller";

export const authRouter = Router();

authRouter.post("/register", authIpRateLimiter, validateBody(registerSchema), authController.register);

// Two limiters, deliberately: one per account to stop password guessing, one
// per address so a single machine can't work through a list of accounts.
authRouter.post(
  "/login",
  authIpRateLimiter,
  validateBody(loginSchema),
  loginRateLimiter,
  authController.login
);

// Refresh sits under the general API limit only. It fires on every full page
// load, so putting it behind the strict auth limiter meant a class browsing
// normally exhausted their shared allowance without a single failed password.
authRouter.post("/refresh", authController.refresh);

authRouter.post("/logout", csrfProtection, authController.logout);
authRouter.get("/me", requireAuth, authController.me);

authRouter.post(
  "/forgot-password",
  authIpRateLimiter,
  validateBody(forgotPasswordSchema),
  authController.forgotPassword
);
authRouter.post(
  "/reset-password",
  authIpRateLimiter,
  validateBody(resetPasswordSchema),
  authController.resetPassword
);
