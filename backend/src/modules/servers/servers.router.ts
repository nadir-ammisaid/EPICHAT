import { Router } from "express";
import asyncHandler from "../../shared/utils/asyncHandler.js";
import { createServerController } from "./servers.controller.js";

export const serversRouter = Router();

serversRouter.post("/", asyncHandler(createServerController));
