import { Server, Socket } from "socket.io";

function toServerRoom(serverId: string) {
  return `server:${serverId}`;
}

export function registerKickHandlers(io: Server, socket: Socket) {

  socket.on("server:kick", ({ serverId, userId }) => {

    io.to(toServerRoom(serverId)).emit("server:kick", {
      serverId,
      userId,
    });
  });
}
