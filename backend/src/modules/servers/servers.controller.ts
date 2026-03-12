import type { Request, Response } from "express";
import HttpError from "../../shared/errors/httpError.js";
import {
  createServerSchema,
  updateServerSchema,
  updateMemberRoleSchema,
} from "./servers.schemas.js";
import {
  createServer,
  getManyServers,
  getServerById,
  updateServer,
  deleteServer,
  joinServer,
  leaveServer,
  getServerMembers,
  updateMemberRole,
  getServerExists,
} from "./servers.service.js";
import { emitNewMemberSystemMessage } from "./serverSystemMessages.js";

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

  const server = await createServer({
    name: parsed.data.name,
    ownerId: userId,
  });
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
  const userId = (req as any).user?.userId;
  if (!userId) throw new HttpError(401, "Unauthorized");

  const server = await getServerById(serverId, userId);
  if (!server) throw new HttpError(404, "Server not found");

  res.status(200).json(server);
}

export async function joinServerController(req: Request, res: Response) {
  const serverId = req.params.id as string;
  const userId = (req as any).user?.userId;

  if (!userId) {
    throw new HttpError(401, "Unauthorized");
  }

  const existingServer = await getServerExists(serverId);

  if (!existingServer) {
    throw new HttpError(404, "Server not found");
  }

  const member = await joinServer(serverId, userId);

  // Message système "nouveau membre" dans le canal par défaut
  const io = req.app.locals.io;
  await emitNewMemberSystemMessage(io, serverId, userId);

  res.status(201).json(member);
}

export async function updateServerController(req: Request, res: Response) {
  const serverId = req.params.id as string;
  const userId = (req as any).user?.userId;
  if (!userId) throw new HttpError(401, "Unauthorized");

  const parsed = updateServerSchema.safeParse(req.body ?? {});
  if (!parsed.success) {
    const message =
      parsed.error.issues.map((issue) => issue.message).join("; ") ||
      "name is required";
    throw new HttpError(400, message);
  }

  const server = await updateServer(serverId, parsed.data, userId);
  res.status(200).json(server);
}

export async function deleteServerController(req: Request, res: Response) {
  const serverId = req.params.id as string;
  const userId = (req as any).user?.userId;
  if (!userId) throw new HttpError(401, "Unauthorized");

  await deleteServer(serverId, userId);
  res.status(200).json({ message: "Server deleted successfully" });
}

export async function leaveServerController(req: Request, res: Response) {
  const serverId = req.params.id as string;
  const userId = (req as any).user?.userId;
  if (!userId) throw new HttpError(401, "Unauthorized");

  await leaveServer(serverId, userId);
  res.status(200).json({ message: "Successfully left the server" });
}

export async function getServerMembersController(req: Request, res: Response) {
  const serverId = req.params.id as string;
  const userId = (req as any).user?.userId;
  if (!userId) throw new HttpError(401, "Unauthorized");

  const members = await getServerMembers(serverId, userId);
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
    requesterUserId,
  );

  res.status(200).json(member);
}
