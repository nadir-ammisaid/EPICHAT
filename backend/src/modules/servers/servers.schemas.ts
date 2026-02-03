import { z } from "zod";

export const createServerSchema = z.object({
  name: z.string().min(1, "name is required").max(100),
});

export type CreateServerInput = z.infer<typeof createServerSchema>;
export type CreateServerServiceInput = CreateServerInput & { ownerId: string };

export const updateServerSchema = z.object({
  name: z.string().min(1, "name is required").max(100),
});

export type UpdateServerInput = z.infer<typeof updateServerSchema>;

export const updateMemberRoleSchema = z.object({
  role: z.enum(["owner", "admin", "member"]),
});

export type UpdateMemberRoleInput = z.infer<typeof updateMemberRoleSchema>;