import "dotenv/config";
import http from "http";
import { createApp } from "./app.js";
import { Server } from "socket.io";

type TypingPayload = {
  channelId?: string;
  userId?: string;
};

const typingUsersByChannel = new Map<string, Set<string>>();
const typingTimeouts = new Map<string, NodeJS.Timeout>();

function toRoom(channelId: string) {
  return `channel:${channelId}`;
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
      const userId = payload?.userId?.trim();
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
      const userId = payload?.userId?.trim();
      if (!channelId || !userId) return;

      const key = `${channelId}:${userId}`;
      clearTimeoutKey(key);

      removeTypingUser(channelId, userId);

      // notify others only
      socket.to(toRoom(channelId)).emit("typing:update", {
        channelId,
        userIds: getTypingList(channelId),
      });
    });
  });

  const port = process.env.PORT ? Number(process.env.PORT) : 3001;

  server.listen(port, "0.0.0.0", () => {
    console.log(`Backend listening on http://localhost:${port}`);
    console.log(`Socket.IO listening on ws://localhost:${port}/ws`);
  });
}
