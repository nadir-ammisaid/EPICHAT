import { Router } from "express";
import asyncHandler from "../../shared/utils/asyncHandler.js";
import { requireAuth } from "../../shared/middlewares/auth.middleware.js";
import { joinByInviteCodeController } from "./invites.controller.js";

export const invitesRouter = Router();

invitesRouter.post("/:code/join", requireAuth, asyncHandler(joinByInviteCodeController));
