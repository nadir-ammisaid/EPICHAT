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

let ioInstance: Server | null = null;

function userRoom(userId: string) {
  return `user:${userId}`;
}

async function joinRealtimeRoomsForUser(socket: Socket, userId: string) {
  socket.join(userRoom(userId));

  const memberships = await prisma.serverMember.findMany({
    where: { userId },
    select: { serverId: true },
  });

  let conversations: Array<{ id: string }> = [];
  try {
    conversations = await prisma.directConversation.findMany({
      where: {
        OR: [{ participant1Id: userId }, { participant2Id: userId }],
      },
      select: { id: true },
    });
  } catch (error) {
    // Do not block server-room subscriptions if DM tables are unavailable.
    console.log("[socket] failed to hydrate DM rooms", error);
  }

  memberships.forEach((membership) => {
    socket.join(`server:${membership.serverId}`);
  });

  conversations.forEach((conversation) => {
    socket.join(`dm:${conversation.id}`);
  });

  // Log volumétrie
  console.log(`[socket] joinRealtimeRoomsForUser: userId=${userId}, servers=${memberships.length}, dms=${conversations.length}`);
}

export function initSocket(server: http.Server) {
  const io = new Server(server, {
    path: "/ws",
    cors: { origin: true, credentials: true },
  });

  ioInstance = io;

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
      void joinRealtimeRoomsForUser(socket, userId).catch((error) => {
        console.log("[socket] failed to hydrate realtime rooms", error);
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

export function getIO() {
  if (!ioInstance) {
    throw new Error("Socket.io has not been initialized");
  }
  return ioInstance;
}
