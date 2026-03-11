import { Socket } from "socket.io";

function toRoom(channelId: string) {
  return `channel:${channelId}`;
}

export function registerChannelHandlers(socket: Socket) {
  console.log("[channel] register pour socket:", socket.id);

  socket.on("channel:join", (rawChannelId: string) => {
    console.log("[channel] channel:join - channelId:", rawChannelId);
    if (typeof rawChannelId !== "string") return;
    const channelId = rawChannelId.trim();
    if (!channelId) return;
    socket.join(toRoom(channelId));
  });

  socket.on("channel:leave", (rawChannelId: string) => {
    console.log("[channel] channel:leave - channelId:", rawChannelId);
    if (typeof rawChannelId !== "string") return;
    const channelId = rawChannelId.trim();
    if (!channelId) return;
    socket.leave(toRoom(channelId));
  });
}
