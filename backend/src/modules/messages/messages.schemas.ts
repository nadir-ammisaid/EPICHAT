import { z } from "zod";
import { paginationQuerySchema, messageContentSchema, uuidParamSchema, sendMessagePayloadSchema } from "../../shared/schemas/message.schemas.js";

export const sendMessageBodySchema = sendMessagePayloadSchema;

export const channelIdParamsSchema = uuidParamSchema;
export const messageIdParamsSchema = uuidParamSchema;
export const getMessagesQuerySchema = paginationQuerySchema;
export const updateMessageBodySchema = z.object({ content: messageContentSchema });
