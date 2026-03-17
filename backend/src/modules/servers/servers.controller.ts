import type { Request, Response, NextFunction } from "express";
import HttpError from "../../shared/errors/httpError.js";
import {
  createServerSchema,
  updateServerSchema,
  updateMemberRoleSchema,
} from "./servers.schemas.js";
import { requireUserId } from "../../shared/utils/requestUser.js";
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
  kickMember,
  banMemberPermanent,
  banMemberTemporary,
  getServerBans,
  unbanMember,
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

  const userId = requireUserId(req);

  const server = await createServer({
    name: parsed.data.name,
    ownerId: userId,
  });
  res.status(201).json(server);
}

export async function getManyServersController(req: Request, res: Response) {
  const userId = requireUserId(req);

  const servers = await getManyServers(userId);
  res.status(200).json(servers);
}

export async function getServerControllerById(req: Request, res: Response) {
  const serverId = req.params.id as string;
  const userId = requireUserId(req);

  const server = await getServerById(serverId, userId);
  if (!server) throw new HttpError(404, "Server not found");

  res.status(200).json(server);
}

export async function joinServerController(req: Request, res: Response) {
  const serverId = req.params.id as string;
  const userId = requireUserId(req);

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
  const userId = requireUserId(req);

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
  const userId = requireUserId(req);

  await deleteServer(serverId, userId);
  res.status(200).json({ message: "Server deleted successfully" });
}

export async function leaveServerController(req: Request, res: Response) {
  const serverId = req.params.id as string;
  const userId = requireUserId(req);

  await leaveServer(serverId, userId);
  res.status(200).json({ message: "Successfully left the server" });
}

export async function getServerMembersController(req: Request, res: Response) {
  const serverId = req.params.id as string;
  const userId = requireUserId(req);

  const members = await getServerMembers(serverId, userId);
  res.status(200).json(members);
}

export async function updateMemberRoleController(req: Request, res: Response) {
  const serverId = req.params.id as string;
  const targetUserId = req.params.userId as string;
  const requesterUserId = requireUserId(req);

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

export async function kickMemberController(req: Request, res: Response) {
  const serverId = req.params.id as string;
  const targetUserId = req.params.userId as string;
  const requesterUserId = requireUserId(req);

  await kickMember(serverId, targetUserId, requesterUserId);

  const io = req.app.locals.io;
  io.to(`server:${serverId}`).emit("server:kick", {
    serverId,
    userId: targetUserId,
  });

  res.status(200).json({ message: "Member kicked successfully" });
}

export async function banMemberPermanentController(
  req: Request & { user: { userId: string; role: string } },
  res: Response,
  next: NextFunction
) {
  try {
    const serverId = req.params.id as string;
    const { userId } = req.body as { userId: string };
    const requesterUserId = req.user.userId;

    const ban = await banMemberPermanent(serverId, userId, requesterUserId);

    res.json(ban);
  } catch (err) {
    next(err);
  }
}

export async function banMemberTemporaryController(
  req: Request & { user: { userId: string; role: string } },
  res: Response,
  next: NextFunction
) {
  try {
    const serverId = req.params.id as string;
    const { userId, duration, unit } = req.body as {
      userId: string;
      duration: number;
      unit: "minutes" | "hours" | "days";
    };

    const requesterUserId = req.user.userId;

    const ban = await banMemberTemporary(
      serverId,
      userId,
      requesterUserId,
      duration,
      unit
    );

    res.json(ban);
  } catch (err) {
    next(err);
  }
}

export async function getServerBansController(
  req: Request & { user: { userId: string; role: string } },
  res: Response,
  next: NextFunction
) {
  try {
    const serverId = req.params.id as string;
    const bans = await getServerBans(serverId);
    res.json(bans);
  } catch (err) {
    next(err);
  }
}

export async function unbanMemberController(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const serverId = req.params.id as string;
    const userId = req.params.userId as string;

    const result = await unbanMember(serverId, userId);

    const io = req.app.locals.io;
    io.to(serverId).emit("member:unbanned", { userId });

    res.json(result);
  } catch (err) {
    next(err);
  }
}

