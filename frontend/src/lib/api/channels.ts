import { apiClient } from "./client";

export type Channel = {
  id: string;
  name: string;
  serverId: string;
  createdAt?: string;
};

export type ChannelDetails = {
  id: string;
  name: string;
  serverId: string;
  createdAt?: string;
  creator?: { id: string; username: string };
};

export async function listServerChannels(serverId: string): Promise<Channel[]> {
  const data = await apiClient.request(`/servers/${serverId}/channels`);
  return Array.isArray(data) ? (data as Channel[]) : [];
}

export async function createChannel(
  serverId: string,
  name: string,
): Promise<Channel> {
  return apiClient.request(`/servers/${serverId}/channels`, {
    method: "POST",
    body: JSON.stringify({ name }),
  });
}

export async function getChannelDetails(
  channelId: string,
): Promise<ChannelDetails> {
  return apiClient.request(`/channels/${channelId}`);
}

export async function renameChannel(
  channelId: string,
  name: string,
): Promise<Partial<Channel>> {
  return apiClient.request(`/channels/${channelId}`, {
    method: "PUT",
    body: JSON.stringify({ name }),
  });
}

export async function deleteChannel(channelId: string): Promise<void> {
  await apiClient.request(`/channels/${channelId}`, {
    method: "DELETE",
  });
}
