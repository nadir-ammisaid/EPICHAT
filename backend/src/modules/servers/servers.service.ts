import { prisma } from "../../prisma/client.js";
<<<<<<< HEAD
import type { CreateServerInput } from "./servers.schemas.js";

export async function createServer(input: CreateServerInput) {
  return prisma.$transaction(async (tx: any) => {
    const server = await tx.server.create({
      data: { name: input.name, ownerId: input.userId },
    });
    await tx.serverMember.create({
      data: { serverId: server.id, userId: input.userId, role: "owner" },
=======
import type { Prisma } from "../../generated/prisma/client.js";

import HttpError from "../../shared/errors/httpError.js";
import type { CreateServerServiceInput, UpdateServerInput, UpdateMemberRoleInput } from "./servers.schemas.js";

export async function createServer(input: CreateServerServiceInput) {
  return prisma.$transaction(async (tx: Prisma.TransactionClient) => {
    const server = await tx.server.create({
      data: { name: input.name, ownerId: input.ownerId },
    });
    await tx.serverMember.create({
      data: { serverId: server.id, userId: input.ownerId, role: "owner" },
>>>>>>> 4b61622d8dfa194ddd93ad2b39510f5e12392015
    });
    return server;
  });
}

<<<<<<< HEAD
export async function getManyServers() {
  return prisma.server.findMany();
=======
export async function getManyServers(userId: string) {
  return prisma.server.findMany({
    where: {
      members: {
        some: { userId },
      },
    },
  });
}

export async function getServerById(id: string) {
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

export async function updateServer(id: string, input: UpdateServerInput) {
  return prisma.server.update({
    where: { id },
    data: { name: input.name },
  });
}

export async function deleteServer(id: string) {
  return prisma.server.delete({
    where: { id },
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

export async function getServerMembers(serverId: string) {
  return prisma.serverMember.findMany({
    where: { serverId },
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
    orderBy: {
      joinedAt: "asc",
    },
  });
}

export async function updateMemberRole(
  serverId: string,
  targetUserId: string,
  newRole: UpdateMemberRoleInput["role"],
  requesterUserId: string
) {
  const server = await prisma.server.findUnique({
    where: { id: serverId },
    select: { ownerId: true },
  });

  if (!server) {
    throw new HttpError(404, "Server not found");
  }

  const requesterMember = await prisma.serverMember.findUnique({
    where: {
      serverId_userId: {
        serverId,
        userId: requesterUserId,
      },
    },
  });

  if (!requesterMember) {
    throw new HttpError(403, "You are not a member of this server");
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
    throw new HttpError(403, "Cannot assign owner role via this endpoint; use transfer ownership");
  }

  if (targetUserId === server.ownerId) {
    throw new HttpError(403, "Cannot change owner role");
  }

  if (!isOwner && targetMember.role === "owner") {
    throw new HttpError(403, "Only owner can modify owner role");
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
>>>>>>> 4b61622d8dfa194ddd93ad2b39510f5e12392015
}