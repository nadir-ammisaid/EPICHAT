import rateLimit from "express-rate-limit";

// Rate limit for auth routes
export const authRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes window
  limit: 50, // max requests per IP
  standardHeaders: true,
  legacyHeaders: false,
});
