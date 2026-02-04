import { Router } from "express";
import asyncHandler from "../../shared/utils/asyncHandler.js";
import { requireAuth } from "../../shared/middlewares/auth.middleware.js";
import { authorize } from "../../shared/middlewares/authorize.middleware.js";
import {
  createChannelController,
  getServerChannelsController,
  getChannelDetails,
  deleteChannelController,
  updateChannelController,
} from "./channels.controller.js";

export const channelsRouter = Router();

channelsRouter.post(
  "/servers/:serverId/channels",
  requireAuth,
  authorize(["user"]),
  asyncHandler(createChannelController),
);

channelsRouter.get(
  "/servers/:serverId/channels",
  requireAuth,
  authorize(["user"]),
  asyncHandler(getServerChannelsController),
);

channelsRouter.get(
  "/channels/:channelId",
  requireAuth,
  authorize(["user"]),
  asyncHandler(getChannelDetails),
);

channelsRouter.delete(
  "/channels/:channelId",
  requireAuth,
  authorize(["user"]),
  asyncHandler(deleteChannelController),
);

channelsRouter.put(
  "/channels/:channelId",
  requireAuth,
  authorize(["user"]),
  asyncHandler(updateChannelController),
);
