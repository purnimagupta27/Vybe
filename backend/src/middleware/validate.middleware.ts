import type { NextFunction, Request, Response } from "express";
import type { ZodType } from "zod";

type ValidationTarget = "body" | "query" | "params";

// Reusable middleware factory that validates a request property against a Zod
// schema. On success, the parsed (and stripped) value is written back onto the
// request so handlers only ever see clean, type-safe data.
export const validate =
  (schema: ZodType, target: ValidationTarget = "body") =>
  (req: Request, res: Response, next: NextFunction): void => {
    const result = schema.safeParse(req[target]);

    if (!result.success) {
      const errors = result.error.issues.map((issue) => ({
        field: issue.path.length > 0 ? issue.path.join(".") : target,
        message: issue.message,
      }));

      res.status(400).json({
        status: "error",
        message: "Validation failed",
        errors,
      });
      return;
    }

    req[target] = result.data;
    next();
  };
