import { z } from "zod";
 
export const serverIdParamsSchema = z.object({
  serverId: z.string().min(10, "serverId is required"),
});
 
export const createChannelBodySchema = z.object({
  name: z.string().min(1, "1 character min for the name").max(15, "15 characters max for the name"),
});
 
 
export const userIdHeaderSchema = z.object({
  "user-id": z.string().uuid("user-id must be a valid UUID"),
});