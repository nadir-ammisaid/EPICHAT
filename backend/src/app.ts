import cors from "cors";
import helmet from "helmet";
import express from "express";

import { authRouter } from "./modules/auth/auth.router.js";
import {
  serversRouter,
  serverSingularRouter,
} from "./modules/servers/servers.router.js";
import { invitesRouter } from "./modules/invites/invites.router.js";
import { channelsRouter } from "./modules/channels/channels.router.js";
import messagesRouter from "./modules/messages/messages.router.js";
import {
  meController,
  updateProfileController,
  deleteAccountController,
} from "./modules/auth/auth.controller.js";
import asyncHandler from "./shared/utils/asyncHandler.js";

import { requireAuth } from "./shared/middlewares/auth.middleware.js";
import { authRateLimiter } from "./shared/middlewares/rateLimit.middleware.js";
import { notFound } from "./shared/middlewares/notFound.middleware.js";
import { errorMiddleware } from "./shared/middlewares/error.middleware.js";

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

  // Apply security headers
  app.use(helmet());

  // Configure CORS with strict origin check
  app.use(
    cors({
      origin(origin, callback) {
        // allow non-browser clients (curl, postman)
        if (!origin) return callback(null, true);

        // Allow localhost and 127.0.0.1 for development
        if (
          origin.startsWith("http://localhost") ||
          origin.startsWith("http://127.0.0.1") ||
          origin === clientUrl
        ) {
          return callback(null, true);
        }

        // block everything else
        return callback(null, false);
      },
      credentials: true,
      methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
      allowedHeaders: ["Content-Type", "Authorization"],
    }),
  );

  // /me routes
  app.get("/me", requireAuth, asyncHandler(meController));
  app.patch("/me", requireAuth, asyncHandler(updateProfileController));
  app.delete("/me", requireAuth, asyncHandler(deleteAccountController));

  // Auth routes with rate limiting
  app.use("/auth", authRateLimiter, authRouter);

  // Domain routes
  app.use("/servers", serversRouter);
  app.use("/server", serverSingularRouter);
  app.use("/invites", invitesRouter);

  // Routers that already define their own paths
  app.use(channelsRouter);
  app.use(messagesRouter);

  // Handle unknown routes
  app.use(notFound);

  // Centralized error handler
  app.use(errorMiddleware);

  return app;
}
