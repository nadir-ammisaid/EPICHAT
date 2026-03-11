import asyncHandler from "../../shared/utils/asyncHandler.js";
import {
  sendMessageBodySchema,
  getMessagesQuerySchema,
  channelIdParamsSchema,
  messageIdParamsSchema,
  updateMessageBodySchema,
} from "./messages.schemas.js";

import { sendMessage as sendMessageService } from "./messages.service.js";
import { deleteMessage as deleteMessageService } from "./messages.service.js";
import { getChannelMessages as getChannelMessagesService } from "./messages.service.js";
import { updateMessage as updateMessageService } from "./messages.service.js";
import type { Request, Response } from "express";
import { prisma } from "../../prisma/client.js";

// Create msg
export const sendMessage = asyncHandler(async (req: Request, res: Response) => {
  const { id: channelId } = channelIdParamsSchema.parse(req.params);
  const userId = (req as any).user.userId;
  const payload = sendMessageBodySchema.parse(req.body);

  const normalizedPayload =
    payload.type === "gif"
      ? {
          type: "gif" as const,
          mediaUrl: payload.mediaUrl,
          content: payload.content,
        }
      : { type: "text" as const, content: payload.content };

  const message = await sendMessageService(
    userId,
    channelId,
    normalizedPayload,
  );

  const io = req.app.locals.io;
  if (io) {
    // Clients dans le canal courant
    io.to(`channel:${channelId}`).emit("message:new", message);

    // Clients connectés au serveur (vue /dashboard, autres canaux)
    const channel = await prisma.channel.findUnique({
      where: { id: channelId },
      select: { serverId: true },
    });
    if (channel?.serverId) {
      io.to(`server:${channel.serverId}`).emit("message:new", message);
    }
  }

  res.status(201).json(message);
});

// Read msg
export const getChannelMessages = asyncHandler(
  async (req: Request, res: Response) => {
    const { id: channelId } = channelIdParamsSchema.parse(req.params);
    const userId = (req as any).user.userId;
    const { limit, before } = getMessagesQuerySchema.parse(req.query);

    const result = await getChannelMessagesService(
      userId,
      channelId,
      limit,
      before,
    );

    res.json({ result });
  },
);

// Delete msg
export const deleteMessage = asyncHandler(
  async (req: Request, res: Response) => {
    const { id: messageId } = messageIdParamsSchema.parse(req.params);
    const userId = (req as any).user.userId;

    const channelId = await deleteMessageService(userId, messageId);

    req.app.locals.io
      ?.to(`channel:${channelId}`)
      .emit("message:deleted", { id: messageId, channelId });

    res.status(204).send();
  },
);

// Update msg
export const updateMessage = asyncHandler(
  async (req: Request, res: Response) => {
    const { id: messageId } = messageIdParamsSchema.parse(req.params);
    const userId = (req as any).user.userId;
    const { content } = updateMessageBodySchema.parse(req.body);

    const updated = await updateMessageService(userId, messageId, content);

    req.app.locals.io
      ?.to(`channel:${updated.channelId}`)
      .emit("message:updated", updated);

    res.json(updated);
  },
);
