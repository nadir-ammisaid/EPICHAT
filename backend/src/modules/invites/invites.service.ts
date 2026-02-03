import { prisma } from "../../prisma/client.js";
import HttpError from "../../shared/errors/httpError.js";
import { joinServer } from "../servers/servers.service.js";

export async function joinByInviteCode(code: string, userId: string) {
  const invite = await prisma.invite.findUnique({
    where: { code },
  });

  if (!invite) {
    throw new HttpError(404, "Invite not found");
  }

  if (invite.expiresAt && invite.expiresAt < new Date()) {
    throw new HttpError(410, "Invite has expired");
  }

  if (invite.maxUses != null && invite.uses >= invite.maxUses) {
    throw new HttpError(400, "Invite has reached maximum uses");
  }

  const member = await joinServer(invite.serverId, userId);

  await prisma.invite.update({
    where: { id: invite.id },
    data: { uses: invite.uses + 1 },
  });

  return member;
}
