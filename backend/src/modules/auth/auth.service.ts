import bcrypt from "bcrypt";
import { prisma } from "../../modules/servers/prisma/client.js";
import type { SignupInput } from "./auth.schemas.ts";

const SALT_ROUNDS = 10;

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
