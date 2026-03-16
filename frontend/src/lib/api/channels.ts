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

export type ServerMember = {
  id: string;
  username: string;
  role?: string;
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

export async function listServerMembers(serverId: string): Promise<ServerMember[]> {
  const data = await apiClient.request(`/servers/${serverId}/members`);
  const members = (data?.members ?? data ?? []) as Array<{
    user?: { id?: string; username?: string };
    userId?: string;
    username?: string;
    role?: string;
  }>;

  return members
    .map((member) => ({
      id: member.user?.id ?? member.userId ?? "",
      username: member.user?.username ?? member.username ?? "",
      role: member.role,
    }))
    .filter((member) => Boolean(member.id) && Boolean(member.username));
}

export async function sendChannelTextMessage(
  channelId: string,
  content: string,
): Promise<void> {
  await apiClient.request(`/channels/${channelId}/messages`, {
    method: "POST",
    body: JSON.stringify({ type: "text", content }),
  });
}

export async function sendChannelGifMessage(
  channelId: string,
  gif: { gifUrl: string; title: string },
): Promise<void> {
  await apiClient.request(`/channels/${channelId}/messages`, {
    method: "POST",
    body: JSON.stringify({
      type: "gif",
      mediaUrl: gif.gifUrl,
      content: gif.title,
    }),
  });
}
