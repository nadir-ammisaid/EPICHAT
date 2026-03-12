import { Server } from "socket.io";
import http from "http";
import jwt from "jsonwebtoken";
import { registerTypingHandlers } from "./typing.js";
import { registerPresenceHandlers } from "./presence.js";
import { registerChannelHandlers } from "./channel.js";
import { registerDmHandlers } from "./dm.js";
import { registerKickHandlers } from "./kick.js";

function getJwtSecret(): string {
  const secret = process.env.JWT_SECRET;
  if (!secret) throw new Error("JWT_SECRET is not defined");
  return secret;
}

export function initSocket(server: http.Server) {
  const io = new Server(server, {
    path: "/ws",
    cors: { origin: true, credentials: true },
  });

  io.use((socket, next) => {
    try {
      const token = socket.handshake.auth?.token;
      if (!token) return next();
      const decoded = jwt.verify(token, getJwtSecret()) as {
        userId: string;
        role: string;
      };
      socket.data.user = { id: decoded.userId, role: decoded.role };
      return next();
    } catch (e) {
      return next();
    }
  });

  io.on("connection", (socket) => {
    registerChannelHandlers(socket);
    registerTypingHandlers(io, socket);
    registerPresenceHandlers(io, socket);
    registerDmHandlers(io, socket);
    registerKickHandlers(io, socket);
  });

  return io;
}
