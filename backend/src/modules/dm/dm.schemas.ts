import { paginationQuerySchema, messageContentSchema, uuidParamSchema, sendMessagePayloadSchema } from "../../shared/schemas/message.schemas.js";
import { z } from "zod";

export const conversationIdParamsSchema = uuidParamSchema;
export const dmMessageIdParamsSchema = uuidParamSchema;

export const createConversationBodySchema = z.object({
  targetUserId: z.uuid({ message: "targetUserId must be a valid UUID" }),
});

export const sendDmBodySchema = sendMessagePayloadSchema;
export const updateDmBodySchema = z.object({ content: messageContentSchema });
export const getDmMessagesQuerySchema = paginationQuerySchema;
