"use client";

import { getSocket } from "./socket";

export type MessagePayload = {
  id: string;
  channelId: string;
  authorId: string;
  content: string;
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
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
