import { createServer } from "http";
import { Server } from "socket.io";
import type { Express } from "express";

export function setupSocket(app: Express) {
  // Create HTTP server 
  const httpServer = createServer(app);

  // Initialize Socket.IO connection on the server
  const io = new Server(httpServer, {
    path: "/ws",
    cors: {
      origin: true, 
      credentials: true,
    },
  });

  // Store io in app.locals to make it accessible in controllers
  app.locals.io = io;

 
  io.on("connection", (socket) => {
    console.log("[socket] connected:", socket.id);

    socket.on("disconnect", () => {
      console.log("[socket] disconnected:", socket.id);
    });
  });

  return httpServer;
}