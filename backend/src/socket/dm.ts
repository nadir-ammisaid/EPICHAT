import { Server, Socket } from "socket.io";

type DmTypingPayload = { conversationId?: string };

const dmTypingUsersByConversation = new Map<string, Set<string>>();
const dmTypingTimeouts = new Map<string, NodeJS.Timeout>();

function toRoom(conversationId: string) { return `dm:${conversationId}`; }

function getTypingList(conversationId: string) {
  return Array.from(dmTypingUsersByConversation.get(conversationId) ?? []);
}

function clearTimeoutKey(key: string) {
  const t = dmTypingTimeouts.get(key);
  if (t) clearTimeout(t);
  dmTypingTimeouts.delete(key);
}

function removeTypingUser(conversationId: string, userId: string) {
  const set = dmTypingUsersByConversation.get(conversationId);
  if (!set) return;
  set.delete(userId);
  if (set.size === 0) dmTypingUsersByConversation.delete(conversationId);
}

export function registerDmHandlers(io: Server, socket: Socket) {
  socket.on("dm:join", (rawConvId: string) => {
    if (typeof rawConvId !== "string") return;
    const conversationId = rawConvId.trim();
    if (!conversationId) return;
    socket.join(toRoom(conversationId));
  });

  socket.on("dm:leave", (rawConvId: string) => {
    if (typeof rawConvId !== "string") return;
    const conversationId = rawConvId.trim();
    if (!conversationId) return;
    socket.leave(toRoom(conversationId));
  });

  socket.on("dm:typing:start", (payload: DmTypingPayload) => {
    const userId = socket.data.user?.id;
    const conversationId = payload?.conversationId?.trim();
    if (!conversationId || !userId) return;

    const set = dmTypingUsersByConversation.get(conversationId) ?? new Set<string>();
    dmTypingUsersByConversation.set(conversationId, set);
    set.add(userId);

    const key = `${conversationId}:${userId}`;
    clearTimeoutKey(key);

    dmTypingTimeouts.set(key, setTimeout(() => {
      removeTypingUser(conversationId, userId);
      clearTimeoutKey(key);
      io.to(toRoom(conversationId)).emit("dm:typing:update", {
        conversationId,
        userIds: getTypingList(conversationId),
      });
    }, 5000));

    socket.to(toRoom(conversationId)).emit("dm:typing:update", {
      conversationId,
      userIds: getTypingList(conversationId),
    });
  });

  socket.on("dm:typing:stop", (payload: DmTypingPayload) => {
    const userId = socket.data.user?.id;
    const conversationId = payload?.conversationId?.trim();
    if (!conversationId || !userId) return;

    const key = `${conversationId}:${userId}`;
    clearTimeoutKey(key);
    removeTypingUser(conversationId, userId);

    socket.to(toRoom(conversationId)).emit("dm:typing:update", {
      conversationId,
      userIds: getTypingList(conversationId),
    });
  });
}
