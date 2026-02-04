import type { Request, Response, NextFunction } from "express";
import HttpError from "../errors/httpError.js";

type AppUser = {
  userId: string;
  role: string;
};

export function authorize(allowedRoles: string[]) {
  return (req: Request, _res: Response, next: NextFunction) => {
    const user = (req as any).user as AppUser | undefined;

    // requireAuth must run before authorize()
    if (!user) {
      throw new HttpError(401, "Unauthorized");
    }

    if (!allowedRoles.includes(user.role)) {
      throw new HttpError(403, "Forbidden");
    }

    next();
  };
}
