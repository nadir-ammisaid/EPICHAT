import { prisma } from "../../prisma/client.js";
import HttpError from "../../shared/errors/httpError.js";

export async function sendMessage(userId: string, channelId: string, content: string) {
  // Verify that the channel exists
  const channel = await prisma.channel.findUnique({ where: { id: channelId } });
  if (!channel) throw new HttpError(404, "Channel not found");

  // Verify that the user is a member of the server and channel
  const membership = await prisma.serverMember.findUnique({
    where: { serverId_userId: { serverId: channel.serverId, userId } },
  });
  if (!membership) throw new HttpError(403, "Access denied: You must be a member of this server to view this channel.");

  // Create the message
  return prisma.message.create({
    data: {
      channelId,
      authorId: userId,
      content,
    },
  });
}

export async function getChannelMessages(userId: string, channelId: string) {
  const channel = await prisma.channel.findUnique({ where: { id: channelId } });
  if (!channel) throw new HttpError(404, "Channel not found");

  const membership = await prisma.serverMember.findUnique({
    where: { serverId_userId: { serverId: channel.serverId, userId } },
  });
  if (!membership) throw new HttpError(403, "Access denied: You must be a member of this server to view this channel.");

  return prisma.message.findMany({
    where: { channelId },
    orderBy: { createdAt: "asc" }, // From oldest to newest
  });
}

export async function deleteMessage(userId: string, messageId: string) {
  const message = await prisma.message.findUnique({
    where: { id: messageId },
    include: { channel: true }, // To retrieve serverId
  });
  if (!message) throw new HttpError(404, "Message not found");

  const membership = await prisma.serverMember.findUnique({
    where: { serverId_userId: { serverId: message.channel.serverId, userId } },
  });
  if (!membership) throw new HttpError(403, "Access denied: You must be a member of this server to view this channel.");

  const isAuthor = message.authorId === userId;
  const isAdmin = membership.role === "admin" || membership.role === "owner";

  if (!isAuthor && !isAdmin) throw new HttpError(403, "Forbidden: Only the message author, admins, or owners can delete this message.");


  await prisma.message.update({
    where: { id: messageId },
    data: { deletedAt: new Date(), content: "" },
  });

    return message.channelId;
}