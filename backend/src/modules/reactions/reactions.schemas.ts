import { z } from "zod";

export const reactionParamsSchema = z.object({ id: z.string().uuid() });
export const reactionBodySchema = z.object({ emoji: z.string().min(1).max(10) });
