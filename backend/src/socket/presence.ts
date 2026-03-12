import { Server, Socket } from "socket.io";
import { prisma } from "../prisma/client.js";

const onlineUsersByServer = new Map<string, Set<string>>();
const userSockets = new Map<string, Set<string>>();

function toServerRoom(serverId: string) { return `server:${serverId}`; }
function normalizePresenceStatus(status?: string) {
  return status === "invisible" ? "offline" : (status ?? "offline");
}

async function emitInitialPresenceSnapshot(socket: Socket, serverIds: string[]) {
  if (serverIds.length === 0) {
    socket.emit("presence:snapshot", { presenceMap: {} });
    return;
  }

  const sharedMembers = await prisma.serverMember.findMany({
    where: { serverId: { in: serverIds } },
    select: { userId: true },
  });

  const sharedUserIds = Array.from(new Set(sharedMembers.map((m) => m.userId)));
  if (sharedUserIds.length === 0) {
    socket.emit("presence:snapshot", { presenceMap: {} });
    return;
  }

  const users = await prisma.user.findMany({
    where: { id: { in: sharedUserIds } },
    select: { id: true, status: true },
  });

  const presenceMap: Record<string, string> = {};
  for (const u of users) {
    presenceMap[u.id] = normalizePresenceStatus(u.status);
  }

  socket.emit("presence:snapshot", { presenceMap });
}

async function broadcastUserStatusToAll(io: Server, userId: string, status: "online" | "offline") {
  // Récupérer tous les serveurs de cet user
  const memberships = await prisma.serverMember.findMany({
    where: { userId },
    select: { serverId: true },
  });
  const serverIds = memberships.map((m) => m.serverId);

  // Broadcaster à TOUS les clients connectés avec la liste des serveurs concernés
  io.emit("presence:broadcast", {
    userId,
    status,
    serverIds,
  });

}

export function registerPresenceHandlers(io: Server, socket: Socket) {
  const userId = socket.data.user?.id;

  if (userId) {
    prisma.serverMember.findMany({
      where: { userId },
      select: { serverId: true },
    })
      .then(async (memberships) => {
        const memberServerIds = memberships.map((m) => m.serverId);

        // Rejoindre toutes les rooms des serveurs
        for (const m of memberships) {
          socket.join(toServerRoom(m.serverId));
          const serverUsers = onlineUsersByServer.get(m.serverId) ?? new Set();
          serverUsers.add(userId);
          onlineUsersByServer.set(m.serverId, serverUsers);
        }

        // Gérer les sockets pour cet utilisateur
        const sockets = userSockets.get(userId) ?? new Set();
        sockets.add(socket.id);
        userSockets.set(userId, sockets);

        // Mettre le statut à online
        const user = await prisma.user.findUnique({ 
          where: { id: userId }, 
          select: { status: true } 
        });
        
        if (user?.status === "offline") {
          await prisma.user.update({ where: { id: userId }, data: { status: "online" } });
        }

        // Envoyer un snapshot initial au nouvel utilisateur (inclut ceux déjà online)
        await emitInitialPresenceSnapshot(socket, memberServerIds);

        // Broadcaster le statut GLOBALEMENT (à tous les clients)
        await broadcastUserStatusToAll(io, userId, "online");
      })
      .catch((e) => console.log("[presence] erreur serverMember findMany:", e));
  }

  socket.on("server:join", async (rawServerId: string) => {
    const userId = socket.data.user?.id;
    if (typeof rawServerId !== "string") return;
    const serverId = rawServerId.trim();
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
        await prisma.user.update({ where: { id: userId }, data: { status: "online" } });
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
      presenceMap[u.id] = normalizePresenceStatus(u.status);
    }

    socket.emit("presence:init", { serverId, presenceMap });
  });

  socket.on("server:leave", (rawServerId: string) => {
    const userId = socket.data.user?.id;
    if (typeof rawServerId !== "string") return;
    const serverId = rawServerId.trim();
    if (!serverId || !userId) return;
    socket.leave(toServerRoom(serverId));
  });

  socket.on("disconnect", async () => {
    const userId = socket.data.user?.id;
    if (!userId) return;

    const sockets = userSockets.get(userId);
    if (!sockets) return;

    sockets.delete(socket.id);

    // Remove stale socket ids that may remain after reconnect/race conditions.
    for (const sid of Array.from(sockets)) {
      if (!io.sockets.sockets.has(sid)) {
        sockets.delete(sid);
      }
    }

    if (sockets.size > 0) return; // User a d'autres sockets connectés

    userSockets.delete(userId);

    try {
      await prisma.user.update({ where: { id: userId }, data: { status: "offline" } });
    } catch (e) {
    }

    // Nettoyer les serveurs et broadcaster globalement
    for (const [serverId, users] of onlineUsersByServer.entries()) {
      if (users.has(userId)) {
        users.delete(userId);
        if (users.size === 0) onlineUsersByServer.delete(serverId);
      }
    }

    // Broadcaster le statut offline GLOBALEMENT
    await broadcastUserStatusToAll(io, userId, "offline");
  });
}