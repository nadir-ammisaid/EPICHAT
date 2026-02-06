import { prisma } from "../../prisma/client.js";
import type { Prisma } from "../../generated/prisma/client.js";

import HttpError from "../../shared/errors/httpError.js";
import type {
  CreateServerServiceInput,
  UpdateServerInput,
  UpdateMemberRoleInput,
} from "./servers.schemas.js";

type ServerRole = "owner" | "admin" | "member";

async function getMembership(serverId: string, userId: string) {
  return prisma.serverMember.findUnique({
    where: {
      serverId_userId: { serverId, userId },
    },
    select: { role: true },
  });
}

async function requireMember(serverId: string, userId: string) {
  const membership = await getMembership(serverId, userId);
  if (!membership) {
    throw new HttpError(403, "Forbidden");
  }
  return membership;
}

async function requireRole(
  serverId: string,
  userId: string,
  roles: ServerRole[],
) {
  const membership = await requireMember(serverId, userId);
  if (!roles.includes(membership.role as ServerRole)) {
    throw new HttpError(403, "Forbidden");
  }
  return membership;
}

export async function createServer(input: CreateServerServiceInput) {
  return prisma.$transaction(async (tx: Prisma.TransactionClient) => {
    const server = await tx.server.create({
      data: { name: input.name, ownerId: input.ownerId },
    });
    await tx.serverMember.create({
      data: { serverId: server.id, userId: input.ownerId, role: "owner" },
    });
    return server;
  });
}

export async function getManyServers(userId: string) {
  return prisma.server.findMany({
    where: {
      members: {
        some: { userId },
      },
    },
  });
}

export async function getServerById(id: string, requesterUserId: string) {
  await requireMember(id, requesterUserId);

  return prisma.server.findUnique({
    where: { id },
  });
}

export async function getServerMember(serverId: string, userId: string) {
  return prisma.serverMember.findUnique({
    where: {
      serverId_userId: { serverId, userId },
    },
    select: { role: true },
  });
}

export async function updateServer(
  serverId: string,
  input: UpdateServerInput,
  requesterUserId: string,
) {
  const server = await prisma.server.findUnique({
    where: { id: serverId },
    select: { ownerId: true },
  });

  if (!server) {
    throw new HttpError(404, "Server not found");
  }

  const isOwner = server.ownerId === requesterUserId;
  if (!isOwner) {
    await requireRole(serverId, requesterUserId, ["admin"]);
  }

  return prisma.server.update({
    where: { id: serverId },
    data: { name: input.name },
  });
}

export async function deleteServer(serverId: string, requesterUserId: string) {
  const server = await prisma.server.findUnique({
    where: { id: serverId },
    select: { ownerId: true },
  });

  if (!server) {
    throw new HttpError(404, "Server not found");
  }

  if (server.ownerId !== requesterUserId) {
    throw new HttpError(403, "Forbidden");
  }

  return prisma.server.delete({
    where: { id: serverId },
  });
}

export async function joinServer(serverId: string, userId: string) {
  const existingMember = await prisma.serverMember.findUnique({
    where: {
      serverId_userId: {
        serverId,
        userId,
      },
    },
  });

  if (existingMember) {
    throw new HttpError(409, "User is already a member of this server");
  }

  return prisma.serverMember.create({
    data: {
      serverId,
      userId,
      role: "member",
    },
  });
}

export async function getServerExists(serverId: string) {
  return prisma.server.findUnique({
    where: { id: serverId },
    select: { id: true },
  });
}

export async function leaveServer(serverId: string, userId: string) {
  const existingMember = await prisma.serverMember.findUnique({
    where: {
      serverId_userId: {
        serverId,
        userId,
      },
    },
  });

  if (!existingMember) {
    throw new HttpError(404, "User is not a member of this server");
  }

  const server = await prisma.server.findUnique({
    where: { id: serverId },
    select: { ownerId: true },
  });

  if (server && server.ownerId === userId) {
    throw new HttpError(403, "Server owner cannot leave the server");
  }

  return prisma.serverMember.delete({
    where: {
      serverId_userId: {
        serverId,
        userId,
      },
    },
  });
}

export async function getServerMembers(
  serverId: string,
  requesterUserId: string,
) {
  await requireMember(serverId, requesterUserId);

  return prisma.serverMember.findMany({
    where: { serverId },
    include: {
      user: {
        select: {
          id: true,
          email: true,
          username: true,
          status: true,
          createdAt: true,
        },
      },
    },
    orderBy: {
      joinedAt: "asc",
    },
  });
}

export async function updateMemberRole(
  serverId: string,
  targetUserId: string,
  newRole: UpdateMemberRoleInput["role"],
  requesterUserId: string,
) {
  const server = await prisma.server.findUnique({
    where: { id: serverId },
    select: { ownerId: true },
  });

  if (!server) {
    throw new HttpError(404, "Server not found");
  }

  const isOwner = server.ownerId === requesterUserId;

  if (!isOwner) {
    throw new HttpError(403, "Only the server owner can update member roles");
  }

  const targetMember = await prisma.serverMember.findUnique({
    where: {
      serverId_userId: {
        serverId,
        userId: targetUserId,
      },
    },
  });

  if (!targetMember) {
    throw new HttpError(404, "Member not found");
  }

  if (newRole === "owner") {
    throw new HttpError(
      403,
      "Cannot assign owner role via this endpoint; use transfer ownership",
    );
  }

  if (targetUserId === server.ownerId) {
    throw new HttpError(403, "Cannot change owner role");
  }

  return prisma.serverMember.update({
    where: {
      serverId_userId: {
        serverId,
        userId: targetUserId,
      },
    },
    data: { role: newRole },
    include: {
      user: {
        select: {
          id: true,
          email: true,
          username: true,
          createdAt: true,
        },
      },
    },
  });
}
