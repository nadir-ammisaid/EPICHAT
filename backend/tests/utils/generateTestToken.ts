import { sign } from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET || "NadirInEpitech2026";

export function generateTestToken(userId: string, role: string = "user") {
  return sign({ userId, role }, JWT_SECRET, { expiresIn: 3600 });
}
