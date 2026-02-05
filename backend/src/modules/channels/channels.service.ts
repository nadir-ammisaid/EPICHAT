import { prisma } from "../../prisma/client.js";
import HttpError from "../../shared/errors/httpError.js";

type ServerRole = "owner" | "admin" | "member";

type CreateChannelInput = {
  serverId: string;
  userId: string; // requester
  name: string;
};

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

// Create a new channel in a server
export async function createChannelService(input: CreateChannelInput) {
  const { serverId, userId, name } = input;

  // Check server exists
  const server = await prisma.server.findUnique({
    where: { id: serverId },
    select: { id: true },
  });

  if (!server) {
    throw new HttpError(404, "Server not found");
  }

  // Only owner/admin can create channels
  await requireRole(serverId, userId, ["owner", "admin"]);

  // Check channel name uniqueness in this server
  const existing = await prisma.channel.findFirst({
    where: { serverId, name },
    select: { id: true },
  });

  if (existing) {
    throw new HttpError(409, "Channel already exists in this server");
  }

  // Create channel
  return prisma.channel.create({
    data: {
      serverId,
      name,
      createdBy: userId,
    },
  });
}

// Get all channels for a server (members only)
export async function getServerChannelsService(
  serverId: string,
  requesterUserId: string,
) {
  // Check server exists
  const server = await prisma.server.findUnique({
    where: { id: serverId },
    select: { id: true },
  });

  if (!server) {
    throw new HttpError(404, "Server not found");
  }

  // Members only
  await requireMember(serverId, requesterUserId);

  return prisma.channel.findMany({
    where: { serverId },
    orderBy: { createdAt: "asc" },
  });
}

// Get channel details by id (members only via channel.serverId)
export async function getChannelDetailsService(
  channelId: string,
  requesterUserId: string,
) {
  const channel = await prisma.channel.findUnique({
    where: { id: channelId },
    select: {
      id: true,
      serverId: true,
      name: true,
      createdBy: true,
      createdAt: true,
    },
  });

  if (!channel) {
    throw new HttpError(404, "Channel not found");
  }

  await requireMember(channel.serverId, requesterUserId);

  return channel;
}

// Update channel name by id (owner/admin only)
export async function updateChannelService(input: {
  channelId: string;
  userId: string; // requester
  name: string;
}) {
  const { channelId, userId, name } = input;

  const channel = await prisma.channel.findUnique({
    where: { id: channelId },
    select: { id: true, serverId: true },
  });

  if (!channel) {
    throw new HttpError(404, "Channel not found");
  }

  await requireRole(channel.serverId, userId, ["owner", "admin"]);

  return prisma.channel.update({
    where: { id: channelId },
    data: { name },
  });
}

// Delete a channel by id (owner/admin only)
export async function deleteChannelService(input: {
  channelId: string;
  userId: string; // requester
}) {
  const { channelId, userId } = input;

  const channel = await prisma.channel.findUnique({
    where: { id: channelId },
    select: { id: true, serverId: true },
  });

  if (!channel) {
    throw new HttpError(404, "Channel not found");
  }

  await requireRole(channel.serverId, userId, ["owner", "admin"]);

  await prisma.channel.delete({
    where: { id: channelId },
  });
}
