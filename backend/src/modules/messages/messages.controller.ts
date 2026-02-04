import asyncHandler from "../../shared/utils/asyncHandler.js";
import { sendMessageBodySchema, getMessagesQuerySchema } from "./messages.schemas.js";
import { sendMessage as sendMessageService } from "./messages.service.js";
import { deleteMessage as deleteMessageService } from "./messages.service.js";
import { getChannelMessages as getChannelMessagesService } from "./messages.service.js";
import type { Request, Response } from "express";
import HttpError from "../../shared/errors/httpError.js";

// Create msg
export const sendMessage = asyncHandler(async (req: Request, res: Response) => {
  const channelId = req.params.id; // Get id from URL

  if (typeof channelId !== "string") throw new HttpError(400, "Invalid channel id"); // Check that the type is a string

  const userId = (req as any).user.userId; // Get userId from middleware

  const { content } = sendMessageBodySchema.parse(req.body); // Get content from JSON body

  const message = await sendMessageService(userId, channelId, content);

  req.app.locals.io?.to(`channel:${channelId}`).emit("message:new", message);


  res.status(201).json(message);
});


// Read msg
export const getChannelMessages = asyncHandler(async (req: Request, res: Response) => {
  const channelId = req.params.id;
  if (typeof channelId !== "string") throw new HttpError(400, "Invalid channel id");
  const userId = (req as any).user.userId;

  const { limit, before } = getMessagesQuerySchema.parse(req.query);

  const result = await getChannelMessagesService(userId, channelId, limit, before);

  res.json({ result });
});

//Delete msg
export const deleteMessage = asyncHandler(async (req: Request, res: Response) => {
  const messageId = req.params.id;
  if (typeof messageId !== "string") throw new HttpError(400, "Invalid message id");

  const userId = (req as any).user.userId;

  const channelId = await deleteMessageService(userId, messageId);

  req.app.locals.io?.to(`channel:${channelId}`).emit("message:deleted", { id: messageId, channelId });

  res.status(204).send();
});
