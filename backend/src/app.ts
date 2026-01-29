import express from "express";
import { authRouter } from "./modules/auth/auth.router.js";

export function createApp() {
  const app = express();

  app.use(express.json());

  app.use("/auth", authRouter);

  app.get("/", (_req, res) => {
    res.send("OK");
  });

  app.get("/epichat", (_req, res) => {
    res.send("test etst");
  });

  return app;
}
