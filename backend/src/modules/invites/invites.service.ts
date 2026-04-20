import { randomBytes } from "node:crypto";
import { prisma } from "../../prisma/client.js";
import HttpError from "../../shared/errors/httpError.js";
import { joinServer } from "../servers/servers.service.js";

function generateInviteCode(): string {
  return randomBytes(8).toString("base64url");
}

export async function createInvite(serverId: string, userId: string) {
  const membership = await prisma.serverMember.findUnique({
    where: {
      serverId_userId: { serverId, userId },
    },
  });

  if (!membership) {
    throw new HttpError(
      403,
      "You must be a member of this server to create an invite",
    );
  }

  if (membership.role !== "owner" && membership.role !== "admin") {
    throw new HttpError
      (403, 
      "Only owners and admins can create invites"
      );
  }

  let code: string;
  let existing: { id: string } | null;
  do {
    code = generateInviteCode();
    existing = await prisma.invite.findUnique({
      where: { code },
      select: { id: true },
    });
  } while (existing);

  const invite = await prisma.invite.create({
    data: {
      serverId,
      code,
      createdBy: userId,
      uses: 0,
    },
  });
  return invite;
}

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
