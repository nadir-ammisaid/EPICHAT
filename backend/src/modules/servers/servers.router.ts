import { Router } from "express";
import asyncHandler from "../../shared/utils/asyncHandler.js";
import { requireAuth } from "../../shared/middlewares/auth.middleware.js";
import {
  createServerController,
  getManyServersController,
  getServerControllerById,
  updateServerController,
  deleteServerController,
  leaveServerController,
  getServerMembersController,
  updateMemberRoleController,
} from "./servers.controller.js";

export const serversRouter = Router();

serversRouter.post("/", requireAuth, asyncHandler(createServerController));
serversRouter.get("/", requireAuth, asyncHandler(getManyServersController));
serversRouter.get("/:id", requireAuth, asyncHandler(getServerControllerById));
serversRouter.put("/:id", requireAuth, asyncHandler(updateServerController));
serversRouter.delete("/:id", requireAuth, asyncHandler(deleteServerController));
serversRouter.delete("/:id/leave", requireAuth, asyncHandler(leaveServerController));
serversRouter.get("/:id/members", requireAuth, asyncHandler(getServerMembersController));
serversRouter.put("/:id/members/:userId", requireAuth, asyncHandler(updateMemberRoleController));