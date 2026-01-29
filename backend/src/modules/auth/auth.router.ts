import { Router } from "express";
import asyncHandler from "../../shared/utils/asyncHandler.js";
import { signupController } from "./auth.controller.js";

export const authRouter = Router();

authRouter.post("/signup", asyncHandler(signupController));
