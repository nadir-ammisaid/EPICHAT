import { z } from "zod";

//Validate serverId from URL from params
export const serverIdParamsSchema = z.object({
  serverId: z.string().min(10, "serverId is required"),
});

//Validate channel name from body
export const createChannelBodySchema = z.object({
  name: z.string().min(1, "1 character min for the name").max(15, "15 characters max for the name"),
});

//Validate user-id from header
export const userIdHeaderSchema = z.object({
  "user-id": z.string().uuid("user-id must be a valid UUID"),
});

//Validate channelId from params
export const channelIdParamsSchema = z.object({
  channelId: z.string().uuid("channelId must be a valid UUID"),
});