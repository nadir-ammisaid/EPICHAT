import type { Request, Response } from "express";
import { signupSchema } from "./auth.schemas.js";
import { signup } from "./auth.service.js";
import HttpError from "../../shared/errors/httpError.js";

function isPrismaUniqueError(e: unknown): boolean {
  return (
    typeof e === "object" &&
    e !== null &&
    (e as { code?: string }).code === "P2002"
  );
}

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
