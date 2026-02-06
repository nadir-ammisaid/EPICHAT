import { Router } from "express";
import { requireAuth } from "../../shared/middlewares/auth.middleware.js";
import { authorize } from "../../shared/middlewares/authorize.middleware.js";
import {
  sendMessage,
  getChannelMessages,
  deleteMessage,
  updateMessage,
} from "./messages.controller.js";

const router = Router();

router.post(
  "/channels/:id/messages",
  requireAuth,
  authorize(["user"]),
  sendMessage,
);

router.get(
  "/channels/:id/messages",
  requireAuth,
  authorize(["user"]),
  getChannelMessages,
);

router.delete("/messages/:id", requireAuth, authorize(["user"]), deleteMessage);

router.put("/messages/:id", requireAuth, authorize(["user"]), updateMessage);

export default router;
