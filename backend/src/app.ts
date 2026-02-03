import express from "express";
import { authRouter } from "./modules/auth/auth.router.js";
import messagesRouter from './modules/messages/messages.router.js';

export function createApp() {
  const app = express();

  app.use(express.json());

  app.use("/auth", authRouter);
  app.use('/api', messagesRouter);



  return app;
}
