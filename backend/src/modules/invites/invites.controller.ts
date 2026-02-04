import type { Request, Response } from "express";
import HttpError from "../../shared/errors/httpError.js";
import { joinByInviteCode } from "./invites.service.js";

export async function joinByInviteCodeController(req: Request, res: Response) {
  const code = req.params.code as string;
  const userId = (req as any).user?.userId;

  if (!userId) {
    throw new HttpError(401, "Unauthorized");
  }

  const member = await joinByInviteCode(code, userId);
  res.status(201).json(member);
}
