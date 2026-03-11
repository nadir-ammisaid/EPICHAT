import { apiClient } from "./client";
import type { DirectConversation, DirectMessage } from "../types/dm";

export async function getConversations(): Promise<DirectConversation[]> {
  return apiClient.request("/dm/conversations");
}

export async function openConversation(targetUserId: string): Promise<DirectConversation> {
  return apiClient.request("/dm/conversations", {
    method: "POST",
    body: JSON.stringify({ targetUserId }),
  });
}

export async function getConversationMessages(
  conversationId: string,
  limit = 50,
  before?: string
): Promise<{ messages: DirectMessage[]; nextCursor: string | null }> {
  const params = new URLSearchParams({ limit: String(limit) });
  if (before) params.set("before", before);
  const data = await apiClient.request(`/dm/conversations/${conversationId}/messages?${params}`);
  return data.result;
}

type SendDmPayload =
  | { type: "text"; content: string }
  | { type: "gif"; mediaUrl: string; content?: string };

export async function sendDmMessage(conversationId: string, payload: SendDmPayload): Promise<DirectMessage> {
  return apiClient.request(`/dm/conversations/${conversationId}/messages`, {
    method: "POST",
    body: JSON.stringify(payload),
  });
}


export async function deleteDmMessage(messageId: string): Promise<void> {
  return apiClient.request(`/dm/messages/${messageId}`, { method: "DELETE" });
}

export async function updateDmMessage(messageId: string, content: string): Promise<DirectMessage> {
  return apiClient.request(`/dm/messages/${messageId}`, {
    method: "PUT",
    body: JSON.stringify({ content }),
  });
}
