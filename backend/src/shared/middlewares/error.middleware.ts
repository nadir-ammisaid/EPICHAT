import type { NextFunction, Request, Response } from "express";
import HttpError from "../errors/httpError.js";

// Check if app runs in production
function isProd(): boolean {
  return process.env.NODE_ENV === "production";
}

export function errorMiddleware(
  err: unknown,
  _req: Request,
  res: Response,
  _next: NextFunction,
) {
  // Handle known HTTP errors
  if (err instanceof HttpError) {
    res.status(err.statusCode).json({ message: err.message });
    return;
  }

  const message = "Internal server error";

  // Log full error only in non-production
  if (!isProd()) {
    console.error(err);
  }

  // Fallback for unexpected errors
  res.status(500).json({ message });
}
