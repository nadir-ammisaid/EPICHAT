import { prisma } from "../../prisma/client.js";
import HttpError from "../../shared/errors/httpError.js";

export function groupReactions(reactions: { userId: string; emoji: string }[]) {
  return Object.values(
    reactions.reduce((acc, r) => {
      if (!acc[r.emoji]) acc[r.emoji] = { emoji: r.emoji, count: 0, userIds: [] };
      const entry = acc[r.emoji]!;
      entry.count++;
      entry.userIds.push(r.userId);

      return acc;
    }, {} as Record<string, { emoji: string; count: number; userIds: string[] }>)
  );
}

export async function toggleReaction(userId: string, messageId: string, emoji: string) {
  const message = await prisma.message.findUnique({
    where: { id: messageId },
    include: { channel: true },
  });
  if (!message) throw new HttpError(404, "Message not found");
  if (message.deletedAt) throw new HttpError(400, "Cannot react to a deleted message");

  const membership = await prisma.serverMember.findUnique({
    where: { serverId_userId: { serverId: message.channel.serverId, userId } },
  });
  if (!membership) throw new HttpError(403, "Access denied");

  const existing = await prisma.messageReaction.findUnique({
    where: { messageId_userId_emoji: { messageId, userId, emoji } },
  });

  if (existing) {
    await prisma.messageReaction.delete({ where: { id: existing.id } });
  } else {
    await prisma.messageReaction.deleteMany({ where: { messageId, userId } });
    await prisma.messageReaction.create({ data: { messageId, userId, emoji } });
  }

  const reactions = await prisma.messageReaction.findMany({ where: { messageId } });
  return { messageId, channelId: message.channelId, reactions: groupReactions(reactions) };
}

export async function toggleDmReaction(userId: string, messageId: string, emoji: string) {
  const message = await prisma.directMessage.findUnique({
    where: { id: messageId },
    include: { conversation: true },
  });
  if (!message) throw new HttpError(404, "Message not found");
  if (message.deletedAt) throw new HttpError(400, "Cannot react to a deleted message");

  const { participant1Id, participant2Id } = message.conversation;
  if (userId !== participant1Id && userId !== participant2Id)
    throw new HttpError(403, "Access denied");

  const existing = await prisma.dmReaction.findUnique({
    where: { directMessageId_userId_emoji: { directMessageId: messageId, userId, emoji } },
  });

  if (existing) {
    await prisma.dmReaction.delete({ where: { id: existing.id } });
  } else {
    await prisma.dmReaction.deleteMany({ where: { directMessageId: messageId, userId } });
    await prisma.dmReaction.create({ data: { directMessageId: messageId, userId, emoji } });
  }

  const reactions = await prisma.dmReaction.findMany({ where: { directMessageId: messageId } });
  return { messageId, conversationId: message.conversationId, reactions: groupReactions(reactions) };
}
