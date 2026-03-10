import "dotenv/config";
import http from "http";
import { createApp } from "./app.js";
import { initSocket } from "./socket/index.js";

export function startServer() {
  const app = createApp();
  const server = http.createServer(app);
  const io = initSocket(server);

  app.locals.io = io;

  const port = process.env.PORT ? Number(process.env.PORT) : 3001;
  server.listen(port, "0.0.0.0", () => {
    console.log(`Backend listening on http://localhost:${port}`);
    console.log(`Socket.IO listening on ws://localhost:${port}/ws`);
  });
}