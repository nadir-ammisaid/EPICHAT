import { apiClient } from "./client";

export type ServerDetails = {
  id: string;
  name: string;
  ownerId?: string;
  createdAt?: string;
};

export async function getServerDetails(
  serverId: string,
): Promise<ServerDetails> {
  return apiClient.request(`/servers/${serverId}`);
}
