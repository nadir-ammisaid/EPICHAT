import type { Request, Response } from "express";
import asyncHandler from "../../shared/utils/asyncHandler.js";
import HttpError from "../../shared/errors/httpError.js";
import { toggleReaction, toggleDmReaction } from "./reactions.service.js";
import { reactionParamsSchema, reactionBodySchema } from "./reactions.schemas.js";

export const toggleMessageReaction = asyncHandler(async (req: Request, res: Response) => {
  const { id: messageId } = reactionParamsSchema.parse(req.params);
  const { emoji } = reactionBodySchema.parse(req.body);
  const userId = (req as any).user.userId;

  const result = await toggleReaction(userId, messageId, emoji);

  req.app.locals.io
    ?.to(`channel:${result.channelId}`)
    .emit("message:reaction", { messageId: result.messageId, reactions: result.reactions });

  res.json(result);
});

export const toggleDmMessageReaction = asyncHandler(async (req: Request, res: Response) => {
  const { id: messageId } = reactionParamsSchema.parse(req.params);
  const { emoji } = reactionBodySchema.parse(req.body);
  const userId = (req as any).user.userId;

  const result = await toggleDmReaction(userId, messageId, emoji);

  req.app.locals.io
    ?.to(`dm:${result.conversationId}`)
    .emit("dm:message:reaction", { messageId: result.messageId, reactions: result.reactions });

  res.json(result);
});
