import { Socket } from "socket.io";

function toRoom(channelId: string) {
  return `channel:${channelId}`;
}

export function registerChannelHandlers(socket: Socket) {
  socket.on("channel:join", (rawChannelId: string) => {
    if (typeof rawChannelId !== "string") return;
    const channelId = rawChannelId.trim();
    if (!channelId) return;
    socket.join(toRoom(channelId));
  });

  socket.on("channel:leave", (rawChannelId: string) => {
    if (typeof rawChannelId !== "string") return;
    const channelId = rawChannelId.trim();
    if (!channelId) return;
    socket.leave(toRoom(channelId));
  });
}
