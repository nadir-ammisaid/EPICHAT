import type { Request, Response } from "express";
import { loginSchema, signupSchema, updateProfileSchema } from "./auth.schemas.js";
import { login, signup, updateProfile, deleteAccount } from "./auth.service.js";
import HttpError from "../../shared/errors/httpError.js";
import { getBearerToken } from "../../shared/utils/authHeader.js";
import { revokeToken } from "./tokenBlacklist.js";
import { prisma } from "../../prisma/client.js";

function isPrismaUniqueError(e: unknown): boolean {
  return (
    typeof e === "object" &&
    e !== null &&
    (e as { code?: string }).code === "P2002"
  );
}

//Signup

export async function signupController(req: Request, res: Response) {
  const parsed = signupSchema.safeParse(req.body);
  if (!parsed.success) {
    throw new HttpError(400, "Invalid payload");
  }

  try {
    const result = await signup(parsed.data);
    res.status(201).json(result);
  } catch (e) {
    if (isPrismaUniqueError(e)) {
      throw new HttpError(409, "Email or username already exists");
    }
    throw e;
  }
}

//Login

export async function loginController(req: Request, res: Response) {
  const parsed = loginSchema.safeParse(req.body);
  if (!parsed.success) {
    throw new HttpError(400, "Invalid payload");
  }

  const result = await login(parsed.data);

  if (!result.accessToken) {
    throw new HttpError(401, "Invalid credentials");
  }

  res.status(200).json(result);
}

//Logout

export async function logoutController(_req: Request, res: Response) {
  const token = getBearerToken(_req);
  if (!token) {
    throw new HttpError(401, "Missing token");
  }

  revokeToken(token);
  res.status(204).send();
}

//Me

export async function meController(req: Request, res: Response) {
  const userId = (req as any).user?.userId;
  if (!userId) {
    throw new HttpError(401, "Unauthorized");
  }

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      email: true,
      username: true,
      status: true,
      createdAt: true,
    },
  });

  if (!user) {
    throw new HttpError(404, "User not found");
  }

  res.status(200).json(user);
}

// Update profile

export async function updateProfileController(req: Request, res: Response) {
  const userId = (req as any).user?.userId;
  if (!userId) throw new HttpError(401, "Unauthorized");

  const parsed = updateProfileSchema.safeParse(req.body);
  if (!parsed.success) {
    throw new HttpError(400, "Invalid payload");
  }

  try {
    const user = await updateProfile(userId, parsed.data);
    res.status(200).json(user);
  } catch (e) {
    if (isPrismaUniqueError(e)) {
      throw new HttpError(409, "Username already exists");
    }
    throw e;
  }
}

// Delete account

export async function deleteAccountController(req: Request, res: Response) {
  const userId = (req as any).user?.userId;
  if (!userId) throw new HttpError(401, "Unauthorized");

  await deleteAccount(userId);
  res.status(204).send();
}

const VALID_STATUSES = ["online", "away", "busy", "invisible", "offline"];

export async function updateStatusController(req: Request, res: Response) {
  const userId = (req as any).user?.userId;
  if (!userId) throw new HttpError(401, "Unauthorized");

  const { status } = req.body;
  if (!status || !VALID_STATUSES.includes(status)) {
    throw new HttpError(400, "Invalid status");
  }

  const user = await prisma.user.update({
    where: { id: userId },
    data: { status },
    select: { id: true, status: true },
  });

  const io = req.app.locals.io;
  if (io) {
    const memberships = await prisma.serverMember.findMany({
      where: { userId },
      select: { serverId: true },
    });
    for (const m of memberships) {
      io.to(`server:${m.serverId}`).emit("presence:update", {
        serverId: m.serverId,
        userId,
        status: status === "invisible" ? "offline" : status,
      });
    }
  }

  res.status(200).json(user);
}
