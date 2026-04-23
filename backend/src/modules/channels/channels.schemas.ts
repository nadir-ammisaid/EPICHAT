import { z } from "zod";

//Validate serverId from URL from params
export const serverIdParamsSchema = z.object({
  serverId: z.string().min(10, "serverId is required"),
});

//Validate channel name creation from body
export const createChannelBodySchema = z.object({
  name: z
    .string()
    .min(1, "1 caractère minimum pour le nom")
    .max(15, "15 caractères max pour le nom"),
});

//Validate channelId from params
export const channelIdParamsSchema = z.object({
  channelId: z.string().uuid("channelId must be a valid UUID"),
});

//Validate channel name update from body
export const updateChannelBodySchema = z.object({
  name: z
    .string()
    .min(1, "1 caractère minimum pour le nom")
    .max(15, "15 caractères max pour le nom"),
});
