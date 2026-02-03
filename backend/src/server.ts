import "dotenv/config";
import http from "http";
import { createApp } from "./app.js";
import { Server } from "socket.io";

export function startServer() {
  const app = createApp();
  const server = http.createServer(app);

   // Socket.IO serveur HTTP
  const io = new Server(server, {
    path: "/ws", 
    cors: {
      origin: true,
      credentials: true,
    },
  });

  app.locals.io = io;

  // logs
  io.on("connection", (socket) => {
  console.log("[socket] connected:", socket.id);

  socket.on("channel:join", (channelId: string) => {
    socket.join(`channel:${channelId}`);
    console.log(`[socket] ${socket.id} joined channel:${channelId}`);
  });

  socket.on("channel:leave", (channelId: string) => {
    socket.leave(`channel:${channelId}`);
    console.log(`[socket] ${socket.id} left channel:${channelId}`);
  });

  socket.on("disconnect", () => {
    console.log("[socket] disconnected:", socket.id);
  });
});


  const port = process.env.PORT ? Number(process.env.PORT) : 3001;

  
  server.listen(port, "0.0.0.0", () => {
    console.log(`Backend listening on http://localhost:${port}`);
    console.log(`Socket.IO listening on ws://localhost:${port}/ws`);
  });
}