import { Router } from "express";
import asyncHandler from "../../shared/utils/asyncHandler.js";
import { requireAuth } from "../../shared/middlewares/auth.middleware.js";
import { authorize } from "../../shared/middlewares/authorize.middleware.js";
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

serversRouter.get(
  "/",
  requireAuth,
  authorize(["user"]),
  asyncHandler(getManyServersController),
);

serversRouter.get(
  "/:id",
  requireAuth,
  authorize(["user"]),
  asyncHandler(getServerControllerById),
);

serversRouter.get(
  "/:id/members",
  requireAuth,
  authorize(["user"]),
  asyncHandler(getServerMembersController),
);

serversRouter.post(
  "/",
  requireAuth,
  authorize(["user"]),
  asyncHandler(createServerController),
);

serversRouter.put(
  "/:id",
  requireAuth,
  authorize(["user"]),
  asyncHandler(updateServerController),
);

serversRouter.put(
  "/:id/members/:userId",
  requireAuth,
  authorize(["user"]),
  asyncHandler(updateMemberRoleController),
);

serversRouter.delete(
  "/:id",
  requireAuth,
  authorize(["user"]),
  asyncHandler(deleteServerController),
);

serversRouter.delete(
  "/:id/leave",
  requireAuth,
  authorize(["user"]),
  asyncHandler(leaveServerController),
);
