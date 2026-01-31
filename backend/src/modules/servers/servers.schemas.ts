import { z } from "zod";

export const createServerSchema = z.object({
  name: z.string().min(1, "name requis").max(100),
  userId: z.string().uuid("userId doit être un UUID"),
});

export type CreateServerInput = z.infer<typeof createServerSchema>;