import type { Request, Response } from "express";
import { createChannelService, getServerChannelsService, getChannelDetailsService } from "./channels.service.js";
import { createChannelBodySchema, serverIdParamsSchema, userIdHeaderSchema, channelIdParamsSchema } from "./channels.schemas.js";


    //Create a new channel in a server

export async function createChannelController(req: Request, res: Response) {

//Validate serverId from URL params
  const paramsResult = serverIdParamsSchema.safeParse(req.params);
  if (!paramsResult.success) {
    return res.status(400).json({ message: paramsResult.error.issues[0]?.message });
  }
  const { serverId } = paramsResult.data;

//Validate user-id header
  const headerResult = userIdHeaderSchema.safeParse(req.headers);
  if (!headerResult.success) {
    return res.status(401).json({ message: "Missing or invalid user-id header" });
  }
  const userId = headerResult.data["user-id"];
 
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