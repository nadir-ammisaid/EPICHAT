import { Router } from "express";
import { requireAuth } from "../../shared/middlewares/auth.middleware.js";
import { authorize } from "../../shared/middlewares/authorize.middleware.js";
import { toggleMessageReaction, toggleDmMessageReaction } from "./reactions.controller.js";

const router = Router();

router.post("/messages/:id/reactions", requireAuth, authorize(["user"]), toggleMessageReaction);
router.post("/dm/messages/:id/reactions", requireAuth, authorize(["user"]), toggleDmMessageReaction);

export default router;
