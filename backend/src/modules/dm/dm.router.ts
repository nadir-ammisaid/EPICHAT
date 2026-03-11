import { Router } from "express";
import { requireAuth } from "../../shared/middlewares/auth.middleware.js";
import { authorize } from "../../shared/middlewares/authorize.middleware.js";
import {
  listConversations,
  openConversation,
  getMessages,
  sendMessage,
  deleteMessage,
  updateMessage,
} from "./dm.controller.js";

const router = Router();

router.get("/dm/conversations", requireAuth, authorize(["user"]), listConversations);
router.post("/dm/conversations", requireAuth, authorize(["user"]), openConversation);
router.get("/dm/conversations/:id/messages", requireAuth, authorize(["user"]), getMessages);
router.post("/dm/conversations/:id/messages", requireAuth, authorize(["user"]), sendMessage);
router.delete("/dm/messages/:id", requireAuth, authorize(["user"]), deleteMessage);
router.put("/dm/messages/:id", requireAuth, authorize(["user"]), updateMessage);

export default router;
