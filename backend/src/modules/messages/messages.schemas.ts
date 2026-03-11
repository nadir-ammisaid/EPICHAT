import { z } from "zod";

const textMessageSchema = z.object({
  type: z.literal("text"),
  content: z.string().trim().min(1).max(2000),
  mediaUrl: z.undefined().optional(),
});

const gifMessageSchema = z.object({
  type: z.literal("gif"),
  content: z.string().trim().max(2000).optional().default(""),
  mediaUrl: z.string().url("mediaUrl must be a valid URL"),
});

const legacyTextMessageSchema = z.object({
  content: z.string().trim().min(1).max(2000),
});

export const sendMessageBodySchema = z
  .union([textMessageSchema, gifMessageSchema, legacyTextMessageSchema])
  .transform((payload) => {
    if ("type" in payload) return payload;
    return {
      type: "text" as const,
      content: payload.content,
      mediaUrl: undefined,
    };
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

export const updateMessageBodySchema = z.object({
  content: z.string().trim().min(1).max(2000),
});
