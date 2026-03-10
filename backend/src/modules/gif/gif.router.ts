import { Router } from "express";
import { requireAuth } from "../../shared/middlewares/auth.middleware.js";
import { authorize } from "../../shared/middlewares/authorize.middleware.js";
import { searchGifController } from "./gif.controller.js";

export const gifRouter = Router();

gifRouter.get(
  "/gif/search",
  requireAuth,
  authorize(["user"]),
  searchGifController,
);
