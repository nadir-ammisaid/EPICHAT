import { Router } from "express";
import asyncHandler from "../../shared/utils/asyncHandler.js";
import { createChannelController, getServerChannelsController, getChannelDetails, deleteChannelController, updateChannelController } from "./channels.controller.js";
import { requireAuth } from "../../shared/middlewares/auth.middleware.js";


export const channelsRouter = Router();
 
channelsRouter.post("/servers/:serverId/channels", requireAuth, asyncHandler(createChannelController));
 
channelsRouter.get("/servers/:serverId/channels", requireAuth, asyncHandler(getServerChannelsController));

channelsRouter.get("/channels/:channelId", requireAuth, asyncHandler(getChannelDetails));

channelsRouter.delete("/channels/:channelId", requireAuth, asyncHandler(deleteChannelController));

channelsRouter.put("/channels/:channelId", requireAuth, asyncHandler(updateChannelController));