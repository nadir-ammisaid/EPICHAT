import { Router } from "express";
import asyncHandler from "../../shared/utils/asyncHandler.js";
import { createChannelController, getServerChannelsController } from "./channels.controller.js";
 
export const channelsRouter = Router();
 
channelsRouter.post("/servers/:serverId/channels",asyncHandler(createChannelController));
 
channelsRouter.get("/servers/:serverId/channels",asyncHandler(getServerChannelsController));