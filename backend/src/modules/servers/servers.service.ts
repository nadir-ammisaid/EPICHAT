import { prisma } from "../../prisma/client.js";
import type { CreateServerInput } from "./servers.schemas.js";

export async function createServer(input: CreateServerInput) {
  return prisma.$transaction(async (tx: any) => {
    const server = await tx.server.create({
      data: { name: input.name, ownerId: input.userId },
    });
    await tx.serverMember.create({
      data: { serverId: server.id, userId: input.userId, role: "owner" },
    });
    return server;
  });
}

export async function getManyServers() {
  return prisma.server.findMany();
}