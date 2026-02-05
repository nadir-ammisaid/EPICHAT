import { Router } from "express";
import asyncHandler from "../../shared/utils/asyncHandler.js";
import {
  meController,
  loginController,
  logoutController,
  signupController,
  updateProfileController,
  deleteAccountController,
} from "./auth.controller.js";
import { requireAuth } from "../../shared/middlewares/auth.middleware.js";

export const authRouter = Router();

authRouter.post("/signup", asyncHandler(signupController));
authRouter.post("/login", asyncHandler(loginController));
authRouter.post("/logout", requireAuth, asyncHandler(logoutController));
authRouter.get("/me", requireAuth, asyncHandler(meController));
authRouter.patch("/me", requireAuth, asyncHandler(updateProfileController));
authRouter.delete("/me", requireAuth, asyncHandler(deleteAccountController));
