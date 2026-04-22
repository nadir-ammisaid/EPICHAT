import type { Request, Response } from "express";
import asyncHandler from "../../shared/utils/asyncHandler.js";
import { gifSearchQuerySchema } from "./gif.schemas.js";
import { searchGifs } from "./gif.service.js";

export const searchGifController = asyncHandler(
  async (req: Request, res: Response) => {
    const { q, limit, offset } = gifSearchQuerySchema.parse(req.query);
    const result = await searchGifs(q, limit, offset);
    res.json(result);
  },
);
