"use client";

import { getSocket } from "./socket";

export const SOCKET_EVENTS = {
  CHANNEL_JOIN: "channel:join",
  CHANNEL_LEAVE: "channel:leave",

  MESSAGE_NEW: "message:new",
  MESSAGE_DELETED: "message:deleted",

  DM_JOIN: "dm:join",
  DM_MESSAGE_NEW: "dm:message:new",

  TYPING_START: "typing:start",
  TYPING_STOP: "typing:stop",
  TYPING_UPDATE: "typing:update",
} as const;

export type MessagePayload = {
  id: string;
  channelId: string;
  authorId: string;
  content: string;
  type: "text" | "gif" | "system_new_member";
  mediaUrl: string | null;
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
  author?: { id: string; username: string };
};

export type DmMessagePayload = {
  id: string;
  conversationId: string;
  authorId: string;
  content: string;
  author: { id: string; username: string };
};

export function onMessageNew(handler: (msg: MessagePayload) => void) {
  const s = getSocket();
  s.on("message:new", handler);

  return () => {
    s.off("message:new", handler);
  };
}

export function onMessageDeleted(handler: (payload: { id: string }) => void) {
  const s = getSocket();
  s.on("message:deleted", handler);

  return () => {
    s.off("message:deleted", handler);
  };
}
