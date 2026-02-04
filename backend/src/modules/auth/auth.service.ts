import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { prisma } from "../../prisma/client.js";
import type { LoginInput, SignupInput } from "./auth.schemas.js";

const SALT_ROUNDS = 10;

// JWT

function getJwtSecret(): string {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    throw new Error("JWT_SECRET is not defined");
  }
  return secret;
}

function getJwtExpiresInSeconds(): number {
  const raw = process.env.JWT_EXPIRES_IN;
  if (!raw) return 3600;

  const trimmed = raw.trim();

  const numeric = Number(trimmed);
  if (Number.isFinite(numeric) && numeric > 0) {
    return Math.floor(numeric);
  }

  const unit = trimmed.slice(-1);
  const value = Number(trimmed.slice(0, -1));

  if (!Number.isFinite(value) || value <= 0) return 3600;

  if (unit === "h") return Math.floor(value * 3600);
  if (unit === "m") return Math.floor(value * 60);
  if (unit === "s") return Math.floor(value);

  return 3600;
}

// Signup

export async function signup(input: SignupInput): Promise<{ userId: string }> {
  const passwordHash = await bcrypt.hash(input.password, SALT_ROUNDS);

  const user = await prisma.user.create({
    data: {
      email: input.email,
      username: input.username,
      passwordHash,
    },
    select: { id: true },
  });

  return { userId: user.id };
}

// Login

export async function login(
  input: LoginInput,
): Promise<{ accessToken: string }> {
  const user = await prisma.user.findUnique({
    where: { email: input.email },
    select: { id: true, passwordHash: true },
  });

  if (!user) {
    return { accessToken: "" };
  }

  const ok = await bcrypt.compare(input.password, user.passwordHash);
  if (!ok) {
    return { accessToken: "" };
  }

  const payload = {
    userId: user.id,
    role: "user",
  };

  const token = jwt.sign(payload, getJwtSecret(), {
    expiresIn: getJwtExpiresInSeconds(),
  });

  return { accessToken: token };
}
