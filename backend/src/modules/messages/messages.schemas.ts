import { z } from "zod";

export const sendMessageBodySchema = z.object({
  content: z.string().min(1).max(2000),
});

export const channelIdParamsSchema = z.object({
  id: z.uuid({ message: "channel id must be a valid UUID" }),
});

export const messageIdParamsSchema = z.object({
  id: z.uuid({ message: "message id must be a valid UUID" }),
});

export const getMessagesQuerySchema = z.object({
  limit: z.coerce.number().int().min(1).max(100).default(50),
  before: z.uuid().optional(),
});
