import { z } from "zod";

export const paginationQuerySchema = z.object({
  limit: z.coerce.number().int().min(1).max(100).default(50),
  before: z.uuid().optional(),
});

export const messageContentSchema = z.string().trim().min(1).max(2000);

export const uuidParamSchema = z.object({
  id: z.uuid({ message: "id must be a valid UUID" }),
});
const textMessageSchema = z.object({
  type: z.literal("text"),
  content: messageContentSchema,
  mediaUrl: z.undefined().optional(),
});

const gifMessageSchema = z.object({
  type: z.literal("gif"),
  content: z.string().trim().max(2000).optional().default(""),
  mediaUrl: z.string().url("mediaUrl must be a valid URL"),
});

const legacyTextMessageSchema = z.object({
  content: messageContentSchema,
});

export const sendMessagePayloadSchema = z
  .union([textMessageSchema, gifMessageSchema, legacyTextMessageSchema])
  .transform((payload) => {
    if ("type" in payload) return payload;
    return { type: "text" as const, content: payload.content, mediaUrl: undefined };
  });
