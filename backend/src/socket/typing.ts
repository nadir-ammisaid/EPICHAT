import { Server, Socket } from "socket.io";

type TypingPayload = { channelId?: string };

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

function removeTypingUser(channelId: string, userId: string) {
  const set = typingUsersByChannel.get(channelId);
  if (!set) return;
  set.delete(userId);
  if (set.size === 0) typingUsersByChannel.delete(channelId);
}

export function registerTypingHandlers(io: Server, socket: Socket) {

  socket.on("typing:start", (payload: TypingPayload) => {
    const userId = socket.data.user?.id;
    const channelId = payload?.channelId?.trim();
    console.log(
      "[typing] typing:start - channelId:",
      channelId,
      "userId:",
      userId,
    );
    if (!channelId || !userId) return;

    ensureSet(channelId).add(userId);
    const key = `${channelId}:${userId}`;
    clearTimeoutKey(key);

    typingTimeouts.set(
      key,
      setTimeout(() => {
        removeTypingUser(channelId, userId);
        clearTimeoutKey(key);
        io.to(toRoom(channelId)).emit("typing:update", {
          channelId,
          userIds: getTypingList(channelId),
        });
      }, 5000),
    );

    socket.to(toRoom(channelId)).emit("typing:update", {
      channelId,
      userIds: getTypingList(channelId),
    });
  });

  socket.on("typing:stop", (payload: TypingPayload) => {
    const userId = socket.data.user?.id;
    const channelId = payload?.channelId?.trim();
    console.log(
      "[typing] typing:stop - channelId:",
      channelId,
      "userId:",
      userId,
    );
    if (!channelId || !userId) return;

    const key = `${channelId}:${userId}`;
    clearTimeoutKey(key);
    removeTypingUser(channelId, userId);

    socket.to(toRoom(channelId)).emit("typing:update", {
      channelId,
      userIds: getTypingList(channelId),
    });
  });
}
