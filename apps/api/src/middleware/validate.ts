import type { NextFunction, Request, Response } from "express";
import type { ZodSchema } from "zod";
import { ApiError } from "../utils/ApiError";

export function validateBody(schema: ZodSchema) {
  return (req: Request, _res: Response, next: NextFunction) => {
    const result = schema.safeParse(req.body);
    if (!result.success) {
      const errors: Record<string, string[]> = {};
      for (const issue of result.error.issues) {
        const key = issue.path.join(".") || "_";
        errors[key] = [...(errors[key] ?? []), issue.message];
      }
      return next(ApiError.badRequest("Data yang dikirim tidak valid", errors));
    }
    req.body = result.data;
    next();
  };
}
