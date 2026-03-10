import { z } from "zod";

export const gifSearchQuerySchema = z.object({
  q: z.string().trim().min(1, "q is required").max(100),
  limit: z.coerce.number().int().min(1).max(25).default(20),
  offset: z.coerce.number().int().min(0).default(0),
});
