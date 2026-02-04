import { Router } from "express";
import asyncHandler from "../../shared/utils/asyncHandler.js";
import { createChannelController, getServerChannelsController, getChannelDetails } from "./channels.controller.js";
 
export const channelsRouter = Router();
 
channelsRouter.post("/servers/:serverId/channels",asyncHandler(createChannelController));
 
channelsRouter.get("/servers/:serverId/channels",asyncHandler(getServerChannelsController));

channelsRouter.get("/channels/:channelId", asyncHandler(getChannelDetails));