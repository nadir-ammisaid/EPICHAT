import cors from "cors";
import helmet from "helmet";
import express from "express";
import { authRouter } from "./modules/auth/auth.router.js";
import { authRateLimiter } from "./shared/middlewares/rateLimit.middleware.js";
import { notFound } from "./shared/middlewares/notFound.middleware.js";
import { errorMiddleware } from "./shared/middlewares/error.middleware.js";
import { serversRouter } from "./modules/servers/servers.router.js";

// Read and validate allowed client origin
function getClientUrl(): string {
  const url = process.env.CLIENT_URL;
  if (!url) throw new Error("CLIENT_URL is not defined");
  return url;
}

const clientUrl = getClientUrl();

export function createApp() {
  const app = express();

  // Hide server fingerprint
  app.disable("x-powered-by");

  // Limit JSON payload size
  app.use(express.json({ limit: "10kb" }));
  app.use(cors({
    origin: process.env.FRONTEND_URL || "http://localhost:3000",
    credentials: true,
  }));
  app.use(express.json());

  // Apply security headers
  app.use(helmet());

  // Configure CORS with strict origin check
  app.use(
    cors({
      origin(origin, callback) {
        if (!origin) return callback(null, true);
        if (origin === clientUrl) return callback(null, true);
        return callback(null, false);
      },
      credentials: true,
      methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
      allowedHeaders: ["Content-Type", "Authorization"],
    }),
  );

  // Auth routes with rate limiting
  app.use("/auth", authRateLimiter, authRouter);
  app.use("/auth", authRouter);
  app.use("/servers", serversRouter);

  // Test routes
  // app.get("/", (_req, res) => {
  //   res.send("OK");
  // });

  // app.get("/epichat", (_req, res) => {
  //   res.send("test etst");
  // });

  // Handle unknown routes
  app.use(notFound);

  // Centralized error handler
  app.use(errorMiddleware);

  return app;
}
