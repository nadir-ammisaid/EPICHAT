import "dotenv/config";
import http from "http";
import { createApp } from "./app.js";
import { Server } from "socket.io";
import jwt from "jsonwebtoken";
import { prisma } from "./prisma/client.js";

type TypingPayload = {
  channelId?: string;
  userId?: string;
};

const typingUsersByChannel = new Map<string, Set<string>>();
const typingTimeouts = new Map<string, NodeJS.Timeout>();

const onlineUsersByServer = new Map<string, Set<string>>();
const userSockets = new Map<string, Set<string>>();

function toRoom(channelId: string) {
  return `channel:${channelId}`;
}

function toServerRoom(serverId: string) {
  return `server:${serverId}`;
}

function getTypingList(channelId: string) {
  return Array.from(typingUsersByChannel.get(channelId) ?? []);
}

function ensureSet(channelId: string) {
  const set = typingUsersByChannel.get(channelId) ?? new Set<string>();
  typingUsersByChannel.set(channelId, set);
  return set;
}

function clearTimeoutKey(key: string) {
  const t = typingTimeouts.get(key);
  if (t) clearTimeout(t);
  typingTimeouts.delete(key);
}

export function startServer() {
  const app = createApp();
  const server = http.createServer(app);

  const io = new Server(server, {
    path: "/ws",
    cors: { origin: true, credentials: true },
  });
  function getJwtSecret(): string {
    const secret = process.env.JWT_SECRET;
    if (!secret) throw new Error("JWT_SECRET is not defined");
    return secret;
  }

  io.use((socket, next) => {
    try {
      const token = socket.handshake.auth?.token;
      if (!token) return next(); 

      const decoded = jwt.verify(token, getJwtSecret()) as { userId: string; role: string };

      
      socket.data.user = {
        id: decoded.userId,
        role: decoded.role,
      };

      return next();
    } catch {
      return next(); 
    }
  });


  app.locals.io = io;

  // Used for timeout cleanup 
  function emitTypingUpdateToAll(channelId: string) {
    const room = toRoom(channelId);
    io.to(room).emit("typing:update", { channelId, userIds: getTypingList(channelId) });
  }

  function removeTypingUser(channelId: string, userId: string) {
    const set = typingUsersByChannel.get(channelId);
    if (!set) return;

    set.delete(userId);
    if (set.size === 0) typingUsersByChannel.delete(channelId);
  }

  io.on("connection", (socket) => {
    // console.log("[socket] connected:", socket.id);
    // console.log(socket.handshake.auth);

    socket.on("channel:join", (rawChannelId: string) => {
      if (typeof rawChannelId !== "string") return;
      const channelId = rawChannelId.trim();
      if (!channelId) return;

      socket.join(toRoom(channelId));
    });

    socket.on("channel:leave", (rawChannelId: string) => {
      if (typeof rawChannelId !== "string") return;
      const channelId = rawChannelId.trim();
      if (!channelId) return;

      socket.leave(toRoom(channelId));
    });

    socket.on("typing:start", (payload: TypingPayload) => {
      const channelId = payload?.channelId?.trim();
      const userId = socket.data.user?.id;
      if (!channelId || !userId) return;

      // add user
      ensureSet(channelId).add(userId);

      // reset per user timeout
      const key = `${channelId}:${userId}`;
      clearTimeoutKey(key);

      typingTimeouts.set(
        key,
        setTimeout(() => {
          removeTypingUser(channelId, userId);
          clearTimeoutKey(key);
          emitTypingUpdateToAll(channelId);
        }, 5000), //5s
      );

      // notify others only
      socket.to(toRoom(channelId)).emit("typing:update", {
        channelId,
        userIds: getTypingList(channelId),
      });
    });

    socket.on("typing:stop", (payload: TypingPayload) => {
      const channelId = payload?.channelId?.trim();
      const userId = socket.data.user?.id;
      if (!channelId || !userId) return;

      const key = `${channelId}:${userId}`;
      clearTimeoutKey(key);

      removeTypingUser(channelId, userId);

      socket.to(toRoom(channelId)).emit("typing:update", {
        channelId,
        userIds: getTypingList(channelId),
      });
    });

    socket.on("server:join", async (rawServerId: string) => {
      if (typeof rawServerId !== "string") return;
      const serverId = rawServerId.trim();
      const userId = socket.data.user?.id;
      if (!serverId || !userId) return;

      socket.join(toServerRoom(serverId));

      const sockets = userSockets.get(userId) ?? new Set();
      sockets.add(socket.id);
      userSockets.set(userId, sockets);

      const serverUsers = onlineUsersByServer.get(serverId) ?? new Set();
      const wasOnline = serverUsers.has(userId);
      serverUsers.add(userId);
      onlineUsersByServer.set(serverId, serverUsers);

      if (!wasOnline) {
        const user = await prisma.user.findUnique({
          where: { id: userId },
          select: { status: true },
        });

        let status = user?.status ?? "online";
        if (status === "offline") {
          await prisma.user.update({
            where: { id: userId },
            data: { status: "online" },
          });
          status = "online";
        }

        const broadcastStatus = status === "invisible" ? "offline" : status;
        io.to(toServerRoom(serverId)).emit("presence:update", {
          serverId,
          userId,
          status: broadcastStatus,
        });
      }

      const onlineUserIds = Array.from(serverUsers);
      const onlineUsersData = await prisma.user.findMany({
        where: { id: { in: onlineUserIds } },
        select: { id: true, status: true },
      });

      const presenceMap: Record<string, string> = {};
      for (const u of onlineUsersData) {
        presenceMap[u.id] = u.status === "invisible" ? "offline" : u.status;
      }

      socket.emit("presence:init", { serverId, presenceMap });
    });

    socket.on("server:leave", (rawServerId: string) => {
      if (typeof rawServerId !== "string") return;
      const serverId = rawServerId.trim();
      const userId = socket.data.user?.id;
      if (!serverId || !userId) return;

      socket.leave(toServerRoom(serverId));
    });

    socket.on("disconnect", async () => {
      const userId = socket.data.user?.id;
      if (!userId) return;

      const sockets = userSockets.get(userId);
      if (sockets) {
        sockets.delete(socket.id);
        if (sockets.size === 0) {
          userSockets.delete(userId);

          await prisma.user.update({
            where: { id: userId },
            data: { status: "offline" },
          });

          for (const [serverId, users] of onlineUsersByServer.entries()) {
            if (users.has(userId)) {
              users.delete(userId);
              if (users.size === 0) onlineUsersByServer.delete(serverId);

              io.to(toServerRoom(serverId)).emit("presence:update", {
                serverId,
                userId,
                status: "offline",
              });
            }
          }
        }
      }
    });
  });

  const port = process.env.PORT ? Number(process.env.PORT) : 3001;

  server.listen(port, "0.0.0.0", () => {
    console.log(`Backend listening on http://localhost:${port}`);
    console.log(`Socket.IO listening on ws://localhost:${port}/ws`);
  });
}
