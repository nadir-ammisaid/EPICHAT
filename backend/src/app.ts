import express from "express";

export function createApp() {
  const app = express();

  app.use(express.json());

  app.get("/", (_req, res) => {
    res.send("OK");
  });

  app.get("/epichat", (_req, res) => {
    res.send("test etst");
  });

  return app;
}
