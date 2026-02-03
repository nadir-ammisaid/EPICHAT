import type { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import HttpError from "../errors/httpError.js";
import { getBearerToken } from "../utils/authHeader.js";
import { isTokenRevoked } from "../../modules/auth/tokenBlacklist.js";

// JWT payloadstructure
type JwtPayload = {
  userId: string;
  role: string;
};

// Read JWT secret from envir.
function getJwtSecret(): string {
  const secret = process.env.JWT_SECRET;
  if (!secret) throw new Error("JWT_SECRET is not defined");
  return secret;
}

// middleware protecting routes
export function requireAuth(req: Request, _res: Response, next: NextFunction) {
  // Extract Bearer token from Authorization header
  const token = getBearerToken(req);
  if (!token) {
    throw new HttpError(401, "Missing token");
  }

  // Reject revoked tokens
  if (isTokenRevoked(token)) {
    throw new HttpError(401, "Token revoked");
  }

  try {
    // Verify and decode JWT
    const decoded = jwt.verify(token, getJwtSecret()) as JwtPayload;

    // Attach authenticated user to request
    (req as any).user = {
      userId: decoded.userId,
      role: decoded.role,
    };

    next();
  } catch {
    // Invalid or expired token
    throw new HttpError(401, "Invalid token");
  }
}
