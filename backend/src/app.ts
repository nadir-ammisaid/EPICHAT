import express from "express";
import { authRouter } from "./modules/auth/auth.router.js";
import { authRateLimiter } from "./shared/middlewares/rateLimit.middleware.js";
import { notFound } from "./shared/middlewares/notFound.middleware.js";
import { errorMiddleware } from "./shared/middlewares/error.middleware.js";
import { channelsRouter } from "./modules/channels/channels.router.js";
import { serversRouter } from "./modules/servers/servers.router.js";
import { invitesRouter } from "./modules/invites/invites.router.js";
import messagesRouter from './modules/messages/messages.router.js';

// Read and validate allowed client origin
function getClientUrl(): string {
  const url = process.env.CLIENT_URL;
  if (!url) throw new Error("CLIENT_URL is not defined");
  return url;
}

const clientUrl = getClientUrl();

export function createApp() {
  const app = express();

  app.use(express.json());

  app.use("/auth", authRouter);
  app.use("/servers", serversRouter);
  app.use("/invites", invitesRouter);

  app.use('/api', messagesRouter);
  app.use(channelsRouter);

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
