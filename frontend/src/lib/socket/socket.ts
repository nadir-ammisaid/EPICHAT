"use client";

import { io, type Socket } from "socket.io-client";

let socket: Socket | null = null;

export function getSocket() {
  const apiUrl = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001";
  const token = localStorage.getItem("token");

  if (socket) {
    // Si le token a changé, on reconnecte avec le bon token
    const currentToken = (socket.auth as { token?: string })?.token;
    if (token && currentToken !== token) {
      socket.auth = { token };
      socket.disconnect().connect();
    }
    return socket;
  }

  socket = io(apiUrl, {
    path: "/ws",
    transports: ["websocket"],
    autoConnect: true,
    withCredentials: true,
    auth: token ? { token } : undefined,
  });

  return socket;
}

export function joinChannel(channelId: string) {
  const s = getSocket();

  if (s.connected) {
    s.emit("channel:join", channelId);
    return;
  }

  s.once("connect", () => {
    s.emit("channel:join", channelId);
  });
}

export function leaveChannel(channelId: string) {
  const s = getSocket();
  s.emit("channel:leave", channelId);
}
