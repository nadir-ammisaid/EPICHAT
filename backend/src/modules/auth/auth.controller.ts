import type { Request, Response } from "express";
import { loginSchema, signupSchema } from "./auth.schemas.js";
import { login, signup } from "./auth.service.js";
import HttpError from "../../shared/errors/httpError.js";

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
