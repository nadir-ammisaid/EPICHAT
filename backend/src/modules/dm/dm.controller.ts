import asyncHandler from "../../shared/utils/asyncHandler.js";
import type { Request, Response } from "express";
import {
  conversationIdParamsSchema,
  dmMessageIdParamsSchema,
  createConversationBodySchema,
  sendDmBodySchema,
  updateDmBodySchema,
  getDmMessagesQuerySchema,
} from "./dm.schemas.js";
import {
  getOrCreateConversation,
  getConversations,
  getConversationMessages,
  sendDmMessage,
  deleteDmMessage,
  updateDmMessage,
} from "./dm.service.js";

export const listConversations = asyncHandler(
  async (req: Request, res: Response) => {
    const userId = (req as any).user.userId;
    const conversations = await getConversations(userId);
    res.json(conversations);
  },
);

export const openConversation = asyncHandler(
  async (req: Request, res: Response) => {
    const userId = (req as any).user.userId;
    const { targetUserId } = createConversationBodySchema.parse(req.body);
    const conversation = await getOrCreateConversation(userId, targetUserId);
    res.status(201).json(conversation);
  },
);

export const getMessages = asyncHandler(async (req: Request, res: Response) => {
  const userId = (req as any).user.userId;
  const { id: conversationId } = conversationIdParamsSchema.parse(req.params);
  const { limit, before } = getDmMessagesQuerySchema.parse(req.query);
  const result = await getConversationMessages(
    userId,
    conversationId,
    limit,
    before,
  );
  res.json({ result });
});

export const sendMessage = asyncHandler(async (req: Request, res: Response) => {
  const userId = (req as any).user.userId;
  const { id: conversationId } = conversationIdParamsSchema.parse(req.params);
  const payload = sendDmBodySchema.parse(req.body);
  const message = await sendDmMessage(userId, conversationId, payload);
  req.app.locals.io?.to(`dm:${conversationId}`).emit("dm:message:new", message);

  res.status(201).json(message);
});

export const deleteMessage = asyncHandler(
  async (req: Request, res: Response) => {
    const userId = (req as any).user.userId;
    const { id: messageId } = dmMessageIdParamsSchema.parse(req.params);
    const conversationId = await deleteDmMessage(userId, messageId);

    req.app.locals.io
      ?.to(`dm:${conversationId}`)
      .emit("dm:message:deleted", { id: messageId, conversationId });

    res.status(204).send();
  },
);

export const updateMessage = asyncHandler(
  async (req: Request, res: Response) => {
    const userId = (req as any).user.userId;
    const { id: messageId } = dmMessageIdParamsSchema.parse(req.params);
    const { content } = updateDmBodySchema.parse(req.body);
    const updated = await updateDmMessage(userId, messageId, content);

    req.app.locals.io
      ?.to(`dm:${updated.conversationId}`)
      .emit("dm:message:updated", updated);

    res.json(updated);
  },
);
