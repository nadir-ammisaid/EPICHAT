import type { Request, Response } from "express";
import { createChannelService, getServerChannelsService, getChannelDetailsService, deleteChannelService, updateChannelService } from "./channels.service.js";
import { createChannelBodySchema, serverIdParamsSchema, channelIdParamsSchema, updateChannelBodySchema } from "./channels.schemas.js";


    //Create a new channel in a server

export async function createChannelController(req: Request, res: Response) {

//Validate serverId from URL params
  const paramsResult = serverIdParamsSchema.safeParse(req.params);
  if (!paramsResult.success) {
    return res.status(400).json({ message: paramsResult.error.issues[0]?.message });
  }
  const { serverId } = paramsResult.data;

//Validate user-id header
const userId = (req as any).user.userId;
 
//Validate request body : channel name
  const bodyResult = createChannelBodySchema.safeParse(req.body);
  if (!bodyResult.success) {
    return res.status(400).json({ message: bodyResult.error.issues[0]?.message });
  }
  const { name } = bodyResult.data;
 
//Call service to create the channel
  const channel = await createChannelService({
    serverId,
    userId,
    name,
  });
 
  return res.status(201).json(channel);
}


    //Get all channels for a given server
 
export async function getServerChannelsController(req: Request, res: Response) {

//Validate serverId from URL params
  const paramsResult = serverIdParamsSchema.safeParse(req.params);
  if (!paramsResult.success) {
    return res.status(400).json({ message: paramsResult.error.issues[0]?.message });
  }
  const { serverId } = paramsResult.data;
 
  const channels = await getServerChannelsService(serverId);

//Return channels list
  return res.status(200).json(channels);
}


    //Get channel details by id

export async function getChannelDetails(req: Request, res: Response) {
//Validate channelId from URL params
  const paramsResult = channelIdParamsSchema.safeParse(req.params);
  if (!paramsResult.success) {
    return res
      .status(400)
      .json({ message: paramsResult.error.issues[0]?.message });
  }
  const { channelId } = paramsResult.data;

  const channel = await getChannelDetailsService(channelId);

//Return channel details
  return res.status(200).json(channel);
}


    //Update channel name by id

export async function updateChannelController(req: Request, res: Response) {
//Validate channelId from URL params
  const paramsResult = channelIdParamsSchema.safeParse(req.params);
  if (!paramsResult.success) {
    return res.status(400).json({ message: paramsResult.error.issues[0]?.message });
  }
  const { channelId } = paramsResult.data;

//Validate user-id header
const userId = (req as any).user.userId;

//Validate request body
  const bodyResult = updateChannelBodySchema.safeParse(req.body);
  if (!bodyResult.success) {
    return res.status(400).json({ message: bodyResult.error.issues[0]?.message });
  }
  const { name } = bodyResult.data;

  const channel = await updateChannelService({
    channelId,
    userId,
    name,
  });

  return res.status(200).json(channel);
}


    //Delete a channel by id

export async function deleteChannelController(req: Request, res: Response) {
//Validate channelId from URL params
  const paramsResult = channelIdParamsSchema.safeParse(req.params);
  if (!paramsResult.success) {
    return res.status(400).json({ message: paramsResult.error.issues[0]?.message });
  }
  const { channelId } = paramsResult.data;

//Validate user-id
const userId = (req as any).user.userId;

await deleteChannelService({ channelId, userId });

return res.status(204).send();
}