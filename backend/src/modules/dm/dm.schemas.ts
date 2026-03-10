import { z } from "zod";

export const conversationIdParamsSchema = z.object({
  id: z.uuid({ message: "conversation id must be a valid UUID" }),
});

export const dmMessageIdParamsSchema = z.object({
  id: z.uuid({ message: "message id must be a valid UUID" }),
});

export const createConversationBodySchema = z.object({
  targetUserId: z.uuid({ message: "targetUserId must be a valid UUID" }),
});

export const sendDmBodySchema = z.object({
  content: z.string().min(1).max(2000),
});

export const updateDmBodySchema = z.object({
  content: z.string().min(1).max(2000),
});

export const getDmMessagesQuerySchema = z.object({
  limit: z.coerce.number().int().min(1).max(100).default(50),
  before: z.uuid().optional(),
});
