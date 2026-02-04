import { Router } from "express";
import { requireAuth } from "../../shared/middlewares/auth.middleware.js";
import { sendMessage } from "./messages.controller.js";
import { getChannelMessages } from "./messages.controller.js";
import { deleteMessage } from "./messages.controller.js";

const router = Router();

router.post("/channels/:id/messages", requireAuth, sendMessage);
router.get("/channels/:id/messages", requireAuth, getChannelMessages);
router.delete("/messages/:id", requireAuth, deleteMessage);

export default router;
