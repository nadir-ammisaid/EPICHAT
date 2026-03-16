import { Server, type Socket } from "socket.io";
import http from "http";
import jwt from "jsonwebtoken";
import { registerTypingHandlers } from "./typing.js";
import { registerPresenceHandlers } from "./presence.js";
import { registerChannelHandlers } from "./channel.js";
import { registerDmHandlers } from "./dm.js";
import { registerKickHandlers } from "./kick.js";
import { getJwtSecret } from "../shared/utils/env.js";
import { prisma } from "../prisma/client.js";

function userRoom(userId: string) {
  return `user:${userId}`;
}

async function joinRealtimeRoomsForUser(socket: Socket, userId: string) {
  socket.join(userRoom(userId));

  const [memberships, conversations] = await Promise.all([
    prisma.serverMember.findMany({
      where: { userId },
      select: { serverId: true },
    }),
    prisma.directConversation.findMany({
      where: {
        OR: [{ participant1Id: userId }, { participant2Id: userId }],
      },
      select: { id: true },
    }),
  ]);

  memberships.forEach((membership) => {
    socket.join(`server:${membership.serverId}`);
  });

  conversations.forEach((conversation) => {
    socket.join(`dm:${conversation.id}`);
  });
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
    } catch {
      return next();
    }
  });

  io.on("connection", (socket) => {
    const userId = socket.data.user?.id;
    if (userId) {
      void joinRealtimeRoomsForUser(socket, userId).catch(() => {
        // Keep socket alive even if room hydration fails.
      });
    }

    registerChannelHandlers(socket);
    registerTypingHandlers(io, socket);
    registerPresenceHandlers(io, socket);
    registerDmHandlers(io, socket);
    registerKickHandlers(io, socket);
  });

  return io;
}
