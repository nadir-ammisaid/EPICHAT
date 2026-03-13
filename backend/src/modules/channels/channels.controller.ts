import type { Request, Response } from "express";
import { requireUserId } from "../../shared/utils/requestUser.js";
import {
  createChannelService,
  getServerChannelsService,
  getChannelDetailsService,
  deleteChannelService,
  updateChannelService,
} from "./channels.service.js";
import {
  createChannelBodySchema,
  serverIdParamsSchema,
  channelIdParamsSchema,
  updateChannelBodySchema,
} from "./channels.schemas.js";

// Create a new channel in a server
export async function createChannelController(req: Request, res: Response) {
  const paramsResult = serverIdParamsSchema.safeParse(req.params);
  if (!paramsResult.success) {
    return res
      .status(400)
      .json({ message: paramsResult.error.issues[0]?.message });
  }
  const { serverId } = paramsResult.data;

  const userId = requireUserId(req);

  const bodyResult = createChannelBodySchema.safeParse(req.body);
  if (!bodyResult.success) {
    return res
      .status(400)
      .json({ message: bodyResult.error.issues[0]?.message });
  }
  const { name } = bodyResult.data;

  const channel = await createChannelService({
    serverId,
    userId,
    name,
  });

  return res.status(201).json(channel);
}

// Get all channels for a given server
export async function getServerChannelsController(req: Request, res: Response) {
  const paramsResult = serverIdParamsSchema.safeParse(req.params);
  if (!paramsResult.success) {
    return res
      .status(400)
      .json({ message: paramsResult.error.issues[0]?.message });
  }
  const { serverId } = paramsResult.data;

  const userId = requireUserId(req);

  const channels = await getServerChannelsService(serverId, userId);

  return res.status(200).json(channels);
}

// Get channel details by id
export async function getChannelDetails(req: Request, res: Response) {
  const paramsResult = channelIdParamsSchema.safeParse(req.params);
  if (!paramsResult.success) {
    return res
      .status(400)
      .json({ message: paramsResult.error.issues[0]?.message });
  }
  const { channelId } = paramsResult.data;

  const userId = requireUserId(req);

  const channel = await getChannelDetailsService(channelId, userId);

  return res.status(200).json(channel);
}

// Update channel name by id
export async function updateChannelController(req: Request, res: Response) {
  const paramsResult = channelIdParamsSchema.safeParse(req.params);
  if (!paramsResult.success) {
    return res
      .status(400)
      .json({ message: paramsResult.error.issues[0]?.message });
  }
  const { channelId } = paramsResult.data;

  const userId = requireUserId(req);

  const bodyResult = updateChannelBodySchema.safeParse(req.body);
  if (!bodyResult.success) {
    return res
      .status(400)
      .json({ message: bodyResult.error.issues[0]?.message });
  }
  const { name } = bodyResult.data;

  const channel = await updateChannelService({
    channelId,
    userId,
    name,
  });

  return res.status(200).json(channel);
}

// Delete a channel by id
export async function deleteChannelController(req: Request, res: Response) {
  const paramsResult = channelIdParamsSchema.safeParse(req.params);
  if (!paramsResult.success) {
    return res
      .status(400)
      .json({ message: paramsResult.error.issues[0]?.message });
  }
  const { channelId } = paramsResult.data;

  const userId = requireUserId(req);

  await deleteChannelService({ channelId, userId });

  return res.status(204).send();
}
