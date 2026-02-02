import type { Request, Response } from "express";

// Fallback for unknown routes
export function notFound(_req: Request, res: Response) {
  res.status(404).json({ message: "Not found" });
}
