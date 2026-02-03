import type { Request, Response } from "express";
import HttpError from "../../shared/errors/httpError.js";
import { createServerSchema, updateServerSchema, updateMemberRoleSchema } from "./servers.schemas.js";
import { createServer, getManyServers, getServerById, getServerMember, updateServer, deleteServer, leaveServer, getServerMembers, updateMemberRole } from "./servers.service.js";

export async function createServerController(req: Request, res: Response) {
  const parsed = createServerSchema.safeParse(req.body ?? {});
  if (!parsed.success) {
    const message =
      parsed.error.issues.map((issue) => issue.message).join("; ") ||
      "name is required";
    throw new HttpError(400, message);
  }

  const userId = (req as any).user?.userId;
  if (!userId) throw new HttpError(401, "Unauthorized");

  const server = await createServer({ name: parsed.data.name, ownerId: userId });
  res.status(201).json(server);
}

export async function getManyServersController(req: Request, res: Response) {
    const userId = (req as any).user?.userId;
    if (!userId) throw new HttpError(401, "Unauthorized");

    const servers = await getManyServers(userId);
    res.status(200).json(servers);
}

export async function getServerControllerById(req: Request, res: Response) {
  const serverId = req.params.id as string;

    const server = await getServerById(serverId);

    if (!server) {
      throw new HttpError(404, "Server not found");
    }
    res.status(200).json(server);
}

export async function updateServerController(req: Request, res: Response) {
  const serverId = req.params.id as string;
  const userId = (req as any).user?.userId;

  if (!userId) {
    throw new HttpError(401, "Unauthorized");
  }

  const parsed = updateServerSchema.safeParse(req.body ?? {});
  if (!parsed.success) {
    const message =
      parsed.error.issues.map((issue) => issue.message).join("; ") ||
      "name is required";
    throw new HttpError(400, message);
  }

  const existingServer = await getServerById(serverId);
  if (!existingServer) {
    throw new HttpError(404, "Server not found");
  }

  const isOwner = existingServer.ownerId === userId;
  if (!isOwner) {
    const member = await getServerMember(serverId, userId);
    if (!member || member.role !== "admin") {
      throw new HttpError(403, "Forbidden");
    }
  }

  const server = await updateServer(serverId, parsed.data);
  res.status(200).json(server);
}

export async function deleteServerController(req: Request, res: Response) {
  const serverId = req.params.id as string;
  const userId = (req as any).user?.userId;

  if (!userId) {
    throw new HttpError(401, "Unauthorized");
  }

  const existingServer = await getServerById(serverId);
  if (!existingServer) {
    throw new HttpError(404, "Server not found");
  }

  if (existingServer.ownerId !== userId) {
    throw new HttpError(403, "Forbidden");
  }

  await deleteServer(serverId);
  res.status(200).json({ message: "Server deleted successfully" });
}

export async function leaveServerController(req: Request, res: Response) {
  const serverId = req.params.id as string;
  const userId = (req as any).user?.userId;

  if (!userId) {
    throw new HttpError(401, "Unauthorized");
  }

    const existingServer = await getServerById(serverId);
    if (!existingServer) {
      throw new HttpError(404, "Server not found");
    }

    await leaveServer(serverId, userId);
    res.status(200).json({ message: "Successfully left the server" });
}

export async function getServerMembersController(req: Request, res: Response) {
  const serverId = req.params.id as string;

    const existingServer = await getServerById(serverId);
    if (!existingServer) {
      throw new HttpError(404, "Server not found");
    }

    const members = await getServerMembers(serverId);
    res.status(200).json(members);
}

export async function updateMemberRoleController(req: Request, res: Response) {
  const serverId = req.params.id as string;
  const targetUserId = req.params.userId as string;
  const requesterUserId = (req as any).user?.userId;

  if (!requesterUserId) {
    throw new HttpError(401, "Unauthorized");
  }

  const parsed = updateMemberRoleSchema.safeParse(req.body ?? {});
  if (!parsed.success) {
    const message =
      parsed.error.issues.map((issue) => issue.message).join("; ") ||
      "role is required";
    throw new HttpError(400, message);
  }

    const member = await updateMemberRole(
      serverId,
      targetUserId,
      parsed.data.role,
      requesterUserId
    );
    res.status(200).json(member);
}