import http from "http";
import { createApp } from "./app.js";

export function startServer() {
  const app = createApp();
  const server = http.createServer(app);

  const port = process.env.PORT ? Number(process.env.PORT) : 3001;

  server.listen(port, () => {
    console.log(`Backend listening on http://localhost:${port}`);
  });
}
