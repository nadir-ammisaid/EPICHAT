import type { Request, Response } from "express";
import { requireUserId } from "../../shared/utils/requestUser.js";
import { createInvite, joinByInviteCode } from "./invites.service.js";
import { emitNewMemberSystemMessage } from "../servers/serverSystemMessages.js";

export async function createInviteController(req: Request, res: Response) {
  const serverId = (req.params.serverId ?? req.params.id) as string;
  const userId = requireUserId(req);
  const invite = await createInvite(serverId, userId);
  res.status(201).json(invite);
}

export async function joinByInviteCodeController(req: Request, res: Response) {
  const code = req.params.code as string;
  const userId = requireUserId(req);

  const member = await joinByInviteCode(code, userId);

  const io = req.app.locals.io;
  await emitNewMemberSystemMessage(io, member.serverId, userId);

  res.status(201).json(member);
}
