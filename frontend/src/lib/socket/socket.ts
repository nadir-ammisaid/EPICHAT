"use client";

import { io, type Socket } from "socket.io-client";

let socket: Socket | null = null;

export function getSocket() {
  if (socket) return socket;


  const url = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001";

  socket = io(url, {
    path: "/ws", 
    transports: ["websocket"],
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
