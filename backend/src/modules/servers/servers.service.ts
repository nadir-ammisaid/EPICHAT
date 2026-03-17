import { prisma } from "../../prisma/client.js";
import type { Prisma } from "../../generated/prisma/client.js";
import { getIO } from "../../socket/index.js";

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
  // Check if the server exists
  const existingBan = await prisma.ban.findUnique({
    where: {
      serverId_userId: {
        serverId,
        userId
      }
    }
  });

  if (existingBan) {
    throw new HttpError(403, "You are banned from this server");
  }

  // Check if the user is already a member
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

  // Add the user
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

  // Update
  const updatedMember = await prisma.serverMember.update({
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

  // Emit WebSocket event
  const io = getIO();
  io.to(serverId).emit("member:roleUpdated", {
    userId: targetUserId,
    role: newRole,
  });

  return updatedMember;
}


export async function kickMember(
  serverId: string,
  targetUserId: string,
  requesterUserId: string,
) {
  const server = await prisma.server.findUnique({
    where: { id: serverId },
    select: { ownerId: true },
  });

  if (!server) {
    throw new HttpError(404, "Server not found");
  }

  // Check that the person is owner ou admin
  const requesterMembership = await getMembership(serverId, requesterUserId);
  if (!requesterMembership) {
    throw new HttpError(403, "Forbidden");
  }

  const requesterRole = requesterMembership.role as ServerRole;

  if (requesterRole !== "owner" && requesterRole !== "admin") {
    throw new HttpError(403, "Only owner or admin can kick members");
  }

  // Check that the person is member 
  const targetMembership = await getMembership(serverId, targetUserId);
  if (!targetMembership) {
    throw new HttpError(404, "Member not found");
  }

  //  Don't kick the owner
  if (targetUserId === server.ownerId) {
    throw new HttpError(403, "Cannot kick the server owner");
  }

  // Stop an admin to kick another admin
  if (
    requesterRole === "admin" &&
    targetMembership.role === "admin"
  ) {
    throw new HttpError(403, "Admins cannot kick other admins");
  }

  // Delete member
  await prisma.serverMember.delete({
    where: {
      serverId_userId: {
        serverId,
        userId: targetUserId,
      },
    },
  });

  return true;
}

export async function banMemberPermanent(
  serverId: string,
  targetUserId: string,
  requesterUserId: string
) {
  // Check that the server exist
  const server = await prisma.server.findUnique({
    where: { id: serverId },
    select: { ownerId: true },
  });

  if (!server) {
    throw new HttpError(404, "Server not found");
  }

  // Check that the person is owner or admin
  const requesterMembership = await prisma.serverMember.findUnique({
    where: {
      serverId_userId: { serverId, userId: requesterUserId },
    },
  });

  if (!requesterMembership) {
    throw new HttpError(403, "Forbidden");
  }

  const requesterRole = requesterMembership.role;

  if (requesterRole !== "owner" && requesterRole !== "admin") {
    throw new HttpError(403, "Only owner or admin can ban members");
  }

  // Check that the person (banned) is member
  const targetMembership = await prisma.serverMember.findUnique({
    where: {
      serverId_userId: { serverId, userId: targetUserId },
    },
  });

  if (!targetMembership) {
    throw new HttpError(404, "Member not found");
  }

  // Don't ban the owner
  if (targetUserId === server.ownerId) {
    throw new HttpError(403, "Cannot ban the server owner");
  }

  // Check that the person (banned) is already banned
  const existingBan = await prisma.ban.findUnique({
    where: {
      serverId_userId: { serverId, userId: targetUserId },
    },
  });

  if (existingBan) {
    throw new HttpError(409, "User is already banned");
  }

  // Create the permanent ban
  const ban = await prisma.ban.create({
    data: {
      serverId,
      userId: targetUserId,
      permanent: true,
      expiresAt: null,
    },
  });

  // Delete the member from the server
  await prisma.serverMember.delete({
    where: {
      serverId_userId: { serverId, userId: targetUserId },
    },
  });

  const io = getIO();
  io.to(serverId).emit("member:banned", {
    userId: targetUserId,
  });

  return ban;
}

export async function banMemberTemporary(
  serverId: string,
  targetUserId: string,
  requesterUserId: string,
  duration: number,
  unit: "minutes" | "hours" | "days"
) {
  if (!duration || duration <= 0) {
    throw new HttpError(400, "Invalid duration");
  }

  // Convert in millisecondes
  let durationMs = 0;

  switch (unit) {
    case "minutes":
      durationMs = duration * 60 * 1000;
      break;
    case "hours":
      durationMs = duration * 60 * 60 * 1000;
      break;
    case "days":
      durationMs = duration * 24 * 60 * 60 * 1000;
      break;
    default:
      throw new HttpError(400, "Invalid unit");
  }

  const expiresAt = new Date(Date.now() + durationMs);

  // Check server
  const server = await prisma.server.findUnique({
    where: { id: serverId },
    select: { ownerId: true },
  });

  if (!server) throw new HttpError(404, "Server not found");

  // Check requester role
  const requesterMembership = await prisma.serverMember.findUnique({
    where: {
      serverId_userId: { serverId, userId: requesterUserId },
    },
  });

  if (!requesterMembership) throw new HttpError(403, "Forbidden");

  if (
    requesterMembership.role !== "owner" &&
    requesterMembership.role !== "admin"
  ) {
    throw new HttpError(403, "Only owner or admin can ban members");
  }

  // Check target member
  const targetMembership = await prisma.serverMember.findUnique({
    where: {
      serverId_userId: { serverId, userId: targetUserId },
    },
  });

  if (!targetMembership) throw new HttpError(404, "Member not found");

  if (targetUserId === server.ownerId) {
    throw new HttpError(403, "Cannot ban the server owner");
  }

  // Check if already banned
  const existingBan = await prisma.ban.findUnique({
    where: {
      serverId_userId: { serverId, userId: targetUserId },
    },
  });

  if (existingBan) throw new HttpError(409, "User is already banned");

  // Create ban
  const ban = await prisma.ban.create({
    data: {
      serverId,
      userId: targetUserId,
      permanent: false,
      expiresAt,
    },
  });

  // Delete member
  await prisma.serverMember.delete({
    where: {
      serverId_userId: { serverId, userId: targetUserId },
    },
  });

  // WebSocket
  const io = getIO();
  io.to(serverId).emit("member:tempbanned", {
    userId: targetUserId,
    expiresAt,
  });

  return ban;
}

export async function getServerBans(serverId: string) {
  const bans = await prisma.ban.findMany({
    where: { serverId },
    select: {
      userId: true,
      permanent: true,
      expiresAt: true,
      user: {
        select: { username: true },
      },
    },
  });

  const now = Date.now();

  return bans.map(ban => {
    let remaining: string | null = null;

    if (!ban.permanent && ban.expiresAt) {
      const diffMs = ban.expiresAt.getTime() - now;

      if (diffMs > 0) {
        const diffSec = Math.floor(diffMs / 1000);
        const days = Math.floor(diffSec / 86400);
        const hours = Math.floor((diffSec % 86400) / 3600);
        const minutes = Math.floor((diffSec % 3600) / 60);

        remaining = `${days}d ${hours}h ${minutes}m`;
      } else {
        remaining = "expired";
      }
    }

    return {
      userId: ban.userId,
      username: ban.user?.username ?? null,
      permanent: ban.permanent,
      expiresAt: ban.expiresAt,
      remaining,
    };
  });
}

export async function unbanMember(serverId: string, userId: string) {
  const existingBan = await prisma.ban.findUnique({
    where: {
      serverId_userId: {
        serverId,
        userId
      }
    }
  });

  if (!existingBan) {
    throw new HttpError(404, "User is not banned");
  }

  await prisma.ban.delete({
    where: {
      serverId_userId: {
        serverId,
        userId
      }
    }
  });

  await prisma.serverMember.create({
    data: {
      serverId,
      userId,
      role: "member"
    }
  });

  return { success: true };
}

