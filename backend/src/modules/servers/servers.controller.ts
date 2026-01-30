import type { Request, Response } from "express";
import HttpError from "../../shared/errors/httpError.js";
import { createServerSchema } from "./servers.schemas.js";
import { createServer } from "./servers.service.js";

export async function createServerController(req: Request, res: Response) {
  const parsed = createServerSchema.safeParse(req.body ?? {});
  if (!parsed.success) {
    const message =
      parsed.error.issues.map((issue) => issue.message).join("; ") ||
      "name et userId requis";
    throw new HttpError(400, message);
  }

  const server = await createServer(parsed.data);
  res.status(201).json(server);
}
