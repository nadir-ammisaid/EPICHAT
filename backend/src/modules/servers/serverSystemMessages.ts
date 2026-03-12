import type { Server as IOServer } from "socket.io";
import { prisma } from "../../prisma/client.js";

export async function emitNewMemberSystemMessage(
  io: IOServer | undefined,
  serverId: string,
  userId: string,
) {
  if (!io) return;

  // Trouver le premier canal du serveur
  const channel = await prisma.channel.findFirst({
    where: { serverId },
    orderBy: { createdAt: "asc" },
    select: { id: true },
  });

  if (!channel) {
    return;
  }

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, username: true },
  });

  if (!user) return;

  const content = `${user.username} a rejoint le serveur. Bienvenue !`;

  const message = await prisma.message.create({
    data: {
      channelId: channel.id,
      authorId: user.id,
      content,
      type: "system_new_member",
      mediaUrl: null,
    },
    include: {
      author: { select: { id: true, username: true } },
    },
  });

  io.to(`channel:${channel.id}`).emit("message:new", message);
  io.to(`server:${serverId}`).emit("message:new", message);
}
