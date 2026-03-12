"use client";

import { io, type Socket } from "socket.io-client";

let socket: Socket | null = null;
let presenceListenerSetup = false;
let unloadHookSetup = false;

export const globalPresenceMap = new Map<string, string>();
export const presenceSubscribers = new Set<(map: Map<string, string>) => void>();

function setupPresenceListener(s: Socket) {
  if (presenceListenerSetup) return;
  presenceListenerSetup = true;

  s.on("presence:snapshot", (payload: { presenceMap: Record<string, string> }) => {
    for (const [uid, status] of Object.entries(payload.presenceMap ?? {})) {
      globalPresenceMap.set(uid, status);
    }
    presenceSubscribers.forEach((cb) => cb(new Map(globalPresenceMap)));
  });

  s.on("presence:broadcast", (payload: { userId: string; status: string; serverIds: string[] }) => {
    globalPresenceMap.set(payload.userId, payload.status);
    presenceSubscribers.forEach((cb) => cb(new Map(globalPresenceMap)));
  });
}

function setupUnloadDisconnect(s: Socket) {
  if (unloadHookSetup || typeof window === "undefined") return;
  unloadHookSetup = true;

  const forceDisconnect = () => {
    if (s.connected) {
      s.disconnect();
    }
  };

  // Helps avoid waiting for ping timeout when a tab is closed or refreshed.
  window.addEventListener("pagehide", forceDisconnect);
  window.addEventListener("beforeunload", forceDisconnect);
}

export function getSocket() {
  const apiUrl = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001";
  const token = localStorage.getItem("token");

  if (socket) {
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

  setupPresenceListener(socket);
  setupUnloadDisconnect(socket);
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

export function disconnectSocket() {
  if (!socket) return;
  socket.disconnect();
}
