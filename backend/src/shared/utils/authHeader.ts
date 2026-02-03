import type { Request } from "express";

export function getBearerToken(req: Request): string | null {
  const header = req.headers.authorization;
  if (!header) return null;

  const [type, token] = header.split(" ");
  if (type !== "Bearer" || !token) return null;

  return token;
}
