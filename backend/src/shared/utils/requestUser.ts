import type { Request } from "express";
import HttpError from "../errors/httpError.js";

export function requireUserId(req: Request): string {
  const userId = (req as { user?: { userId?: string } }).user?.userId;
  if (!userId) {
    throw new HttpError(401, "Unauthorized");
  }
  return userId;
}
