import { Server, Socket } from "socket.io";
import { prisma } from "../prisma/client.js";

const onlineUsersByServer = new Map<string, Set<string>>();
const userSockets = new Map<string, Set<string>>();

function toServerRoom(serverId: string) {
  return `server:${serverId}`;
}

export function registerPresenceHandlers(io: Server, socket: Socket) {
  console.log("[presence] register pour user:", socket.data.user?.id);

  const userId = socket.data.user?.id;

  if (userId) {
    prisma.user
      .findUnique({ where: { id: userId }, select: { status: true } })
      .then(async (user) => {
        console.log("[presence] status actuel:", user?.status);
        if (user?.status === "offline") {
          await prisma.user.update({
            where: { id: userId },
            data: { status: "online" },
          });
          console.log("[presence] status mis à jour: online");
        }
      })
      .catch((e) => console.log("[presence] erreur findUnique:", e));
  }

  socket.on("server:join", async (rawServerId: string) => {
    const userId = socket.data.user?.id;
    console.log(
      "[presence] server:join - serverId:",
      rawServerId,
      "userId:",
      userId,
    );
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
        await prisma.user.update({
          where: { id: userId },
          data: { status: "online" },
        });
        status = "online";
      }

      const broadcastStatus = status === "invisible" ? "offline" : status;
      console.log(
        "[presence] broadcast status:",
        broadcastStatus,
        "pour serverId:",
        serverId,
      );
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

    console.log("[presence] presence:init envoyé:", presenceMap);
    socket.emit("presence:init", { serverId, presenceMap });
  });

  socket.on("server:leave", (rawServerId: string) => {
    const userId = socket.data.user?.id;
    console.log(
      "[presence] server:leave - serverId:",
      rawServerId,
      "userId:",
      userId,
    );
    if (typeof rawServerId !== "string") return;
    const serverId = rawServerId.trim();
    if (!serverId || !userId) return;
    socket.leave(toServerRoom(serverId));
  });

  socket.on("disconnect", async () => {
    const userId = socket.data.user?.id;
    console.log("[presence] disconnect - userId:", userId);
    if (!userId) return;

    const sockets = userSockets.get(userId);
    if (!sockets) return;

    sockets.delete(socket.id);
    if (sockets.size > 0) return;

    userSockets.delete(userId);

    try {
      await prisma.user.update({
        where: { id: userId },
        data: { status: "offline" },
      });
      console.log("[presence] status mis à jour: offline");
    } catch (e) {
      console.log("[presence] erreur disconnect:", e);
    }

    for (const [serverId, users] of onlineUsersByServer.entries()) {
      if (users.has(userId)) {
        users.delete(userId);
        if (users.size === 0) onlineUsersByServer.delete(serverId);
        console.log("[presence] broadcast offline pour serverId:", serverId);
        io.to(toServerRoom(serverId)).emit("presence:update", {
          serverId,
          userId,
          status: "offline",
        });
      }
    }
  });
}
