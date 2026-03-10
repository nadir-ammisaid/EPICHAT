import { prisma } from "../../prisma/client.js";
import HttpError from "../../shared/errors/httpError.js";

// sorted ids to guarantee uniqueness
function sortedPair(a: string, b: string) {
  return a < b ? { p1: a, p2: b } : { p1: b, p2: a };
}

// Create or retrieve an existing conversation between two users
export async function getOrCreateConversation(userId: string, targetUserId: string) {
  if (userId === targetUserId)
    throw new HttpError(400, "Cannot create a conversation with yourself");

  // Checks that both users share a common server
  const sharedServer = await prisma.serverMember.findFirst({
    where: {
      userId,
      server: { members: { some: { userId: targetUserId } } },
    },
  });
  if (!sharedServer)
    throw new HttpError(403, "You must share a server with this user to message them");

  const { p1, p2 } = sortedPair(userId, targetUserId);

  // Upsert: creates it if it does not exist, otherwise returns the existing one
  return prisma.directConversation.upsert({
    where: { participant1Id_participant2Id: { participant1Id: p1, participant2Id: p2 } },
    create: { participant1Id: p1, participant2Id: p2 },
    update: {},
    include: {
      participant1: { select: { id: true, username: true, status: true } },
      participant2: { select: { id: true, username: true, status: true } },
    },
  });
}

// List all conversations of a user
export async function getConversations(userId: string) {
  return prisma.directConversation.findMany({
    where: {
      OR: [{ participant1Id: userId }, { participant2Id: userId }],
    },
    include: {
      participant1: { select: { id: true, username: true, status: true } },
      participant2: { select: { id: true, username: true, status: true } },
    },
    orderBy: { createdAt: "desc" },
  });
}

// Read messages from a conversation (with pagination)
export async function getConversationMessages(
  userId: string,
  conversationId: string,
  limit: number,
  before?: string,
) {
  const conversation = await prisma.directConversation.findUnique({
    where: { id: conversationId },
  });
  if (!conversation) throw new HttpError(404, "Conversation not found");

  // Checks that the user is indeed a participant
  if (conversation.participant1Id !== userId && conversation.participant2Id !== userId)
    throw new HttpError(403, "Access denied");

  const args: any = {
    where: { conversationId, deletedAt: null },
    orderBy: [{ createdAt: "desc" }, { id: "desc" }],
    take: limit,
    include: { author: { select: { id: true, username: true } } },
  };

  if (before) {
    args.cursor = { id: before };
    args.skip = 1;
  }

  const rows = await prisma.directMessage.findMany(args);
  const messages = rows.reverse();
  const nextCursor = messages.at(0)?.id ?? null;

  return { messages, nextCursor };
}

// Send a message in a conversation
export async function sendDmMessage(userId: string, conversationId: string, content: string) {
  const conversation = await prisma.directConversation.findUnique({
    where: { id: conversationId },
  });
  if (!conversation) throw new HttpError(404, "Conversation not found");

  if (conversation.participant1Id !== userId && conversation.participant2Id !== userId)
    throw new HttpError(403, "Access denied");

  return prisma.directMessage.create({
    data: { conversationId, authorId: userId, content },
    include: { author: { select: { id: true, username: true } } },
  });
}

// Delete a message (soft delete, author only)
export async function deleteDmMessage(userId: string, messageId: string) {
  const message = await prisma.directMessage.findUnique({ where: { id: messageId } });
  if (!message) throw new HttpError(404, "Message not found");
  if (message.authorId !== userId)
    throw new HttpError(403, "You can only delete your own messages");

  await prisma.directMessage.update({
    where: { id: messageId },
    data: { deletedAt: new Date(), content: "" },
  });

  return message.conversationId;
}

// Edit a message (author only)
export async function updateDmMessage(userId: string, messageId: string, content: string) {
  const message = await prisma.directMessage.findUnique({ where: { id: messageId } });
  if (!message) throw new HttpError(404, "Message not found");
  if (message.deletedAt) throw new HttpError(400, "Cannot edit a deleted message");
  if (message.authorId !== userId)
    throw new HttpError(403, "You can only edit your own messages");

  return prisma.directMessage.update({
    where: { id: messageId },
    data: { content, updatedAt: new Date() },
    include: { author: { select: { id: true, username: true } } },
  });
}