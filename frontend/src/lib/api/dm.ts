"use client";

import { apiClient } from "./client";

export type Conversation = { id: string };

export async function getConversations(): Promise<Conversation[]> {
  try {
    const data = (await apiClient.request("/conversations")) as {
      result?: Conversation[];
      conversations?: Conversation[];
    };
    return data?.result ?? data?.conversations ?? [];
  } catch {
    return [];
  }
}
