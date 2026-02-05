import { prisma } from "../../prisma/client.js";
import HttpError from "../../shared/errors/httpError.js";

export async function sendMessage(
  userId: string,
  channelId: string,
  content: string,
) {
  // Verify channel existence
  const channel = await prisma.channel.findUnique({ where: { id: channelId } });
  if (!channel) throw new HttpError(404, "Channel not found");

  // Check user permissions
  const membership = await prisma.serverMember.findUnique({
    where: { serverId_userId: { serverId: channel.serverId, userId } },
  });
  if (!membership)
    throw new HttpError(
      403,
      "Access denied: You must be a member of this server to view this channel.",
    );

  // Create the message
  return prisma.message.create({
    data: {
      channelId,
      authorId: userId,
      content,
    },
    include: {
      author: { select: { id: true, username: true } },
    },
  });
}

export async function getChannelMessages(
  userId: string,
  channelId: string,
  limit: number,
  before?: string,
) {
  //Verify channel existence
  const channel = await prisma.channel.findUnique({ where: { id: channelId } });
  if (!channel) throw new HttpError(404, "Channel not found");

  //Check user permissions
  const membership = await prisma.serverMember.findUnique({
    where: { serverId_userId: { serverId: channel.serverId, userId } },
  });
  if (!membership) throw new HttpError(403, "Access denied: You must be a member of this server to view this channel.");




  // Configure pagination and fetching
  const args: any = {
    // where: { channelId },
    where: { channelId, deletedAt: null },
    orderBy: [{ createdAt: "desc" }, { id: "desc" }],
    take: limit,
  };

  if (before) {
    args.cursor = { id: before };
    args.skip = 1;
  }

  const rows = await prisma.message.findMany({
  ...args,
  include: {
    author: { select: { id: true, username: true } },
  },
});

  // Format order (Oldest to Newest)
  const messages = rows.reverse();

  
  const nextCursor = messages.at(0)?.id ?? null;


  return { messages, nextCursor };
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
  if (!membership)
    throw new HttpError(
      403,
      "Access denied: You must be a member of this server to view this channel.",
    );

  const isAuthor = message.authorId === userId;
  const isAdmin = membership.role === "admin" || membership.role === "owner";

  if (!isAuthor && !isAdmin)
    throw new HttpError(
      403,
      "Forbidden: Only the message author, admins, or owners can delete this message.",
    );

  await prisma.message.update({
    where: { id: messageId },
    data: { deletedAt: new Date(), content: "" },
  });

  return message.channelId;
}

export async function updateMessage(
  userId: string,
  messageId: string,
  content: string,
) {
  const message = await prisma.message.findUnique({
    where: { id: messageId },
    include: { channel: true },
  });
  if (!message) throw new HttpError(404, "Message not found");
  if (message.deletedAt) throw new HttpError(400, "Cannot edit a deleted message");

  if (message.authorId !== userId) {
    throw new HttpError(403, "You can only edit your own messages");
  }

  const updated = await prisma.message.update({
    where: { id: messageId },
    data: { content, updatedAt: new Date() },
    include: {
      author: { select: { id: true, username: true } },
    },
  });

  return updated;
}
