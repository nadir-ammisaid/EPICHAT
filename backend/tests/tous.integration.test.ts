import { io as ClientIO, Socket } from "socket.io-client";
import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { randomUUID } from "node:crypto";
import http from "node:http";
import { generateTestToken } from "./utils/generateTestToken";
import { createApp } from "../src/app.js";
import { initSocket } from "../src/socket/index.js";
import { prisma } from "../src/prisma/client.js";

let apiUrl = process.env.TEST_API_URL || "http://localhost:3001";
let httpServer: http.Server;

function waitForEvent<T = any>(socket: Socket, event: string): Promise<T> {
  return new Promise((resolve) => {
    socket.once(event, (data: T) => resolve(data));
  });
}

describe("@Tous socket delivery integration", () => {
  let userASocket: Socket;
  let userBSocket: Socket;
  let tokenA = "";
  let tokenB = "";
  const serverId = randomUUID();
  const channelId = randomUUID();
  const userA = { id: "user-a", username: "Alice" };
  const userB = { id: "user-b", username: "Bob" };
  const channel = { id: channelId, name: "test", serverId };
  const seedServer = { id: serverId, name: "TestServer", ownerId: userA.id };

  beforeAll(async () => {
    const app = createApp();
    httpServer = http.createServer(app);
    const io = initSocket(httpServer);
    app.locals.io = io;

    await new Promise<void>((resolve) => {
      httpServer.listen(0, "127.0.0.1", () => resolve());
    });

    const address = httpServer.address();
    if (!address || typeof address === "string") {
      throw new Error("Unable to start test server");
    }
    apiUrl = `http://127.0.0.1:${address.port}`;

    // Prépare la base : users, server, channel, membres
    await prisma.user.upsert({
      where: { id: userA.id },
      update: {},
      create: { id: userA.id, username: userA.username, email: "a@test.com", passwordHash: "x" },
    });
    await prisma.user.upsert({
      where: { id: userB.id },
      update: {},
      create: { id: userB.id, username: userB.username, email: "b@test.com", passwordHash: "x" },
    });
    await prisma.server.upsert({
      where: { id: seedServer.id },
      update: {},
      create: { id: seedServer.id, name: seedServer.name, ownerId: userA.id },
    });
    await prisma.channel.upsert({
      where: { id: channel.id },
      update: {},
      create: { id: channel.id, name: channel.name, serverId: seedServer.id, createdBy: userA.id },
    });
    await prisma.serverMember.upsert({
      where: { serverId_userId: { serverId: seedServer.id, userId: userA.id } },
      update: {},
      create: { serverId: seedServer.id, userId: userA.id, role: "owner" },
    });
    await prisma.serverMember.upsert({
      where: { serverId_userId: { serverId: seedServer.id, userId: userB.id } },
      update: {},
      create: { serverId: seedServer.id, userId: userB.id, role: "member" },
    });

    // Génère des tokens JWT valides
    tokenA = generateTestToken(userA.id);
    tokenB = generateTestToken(userB.id);

    userASocket = ClientIO(apiUrl, {
      path: "/ws",
      transports: ["websocket"],
      auth: { token: tokenA },
    });
    userBSocket = ClientIO(apiUrl, {
      path: "/ws",
      transports: ["websocket"],
      auth: { token: tokenB },
    });
    await new Promise<void>((res) => userASocket.on("connect", () => res()));
    await new Promise<void>((res) => userBSocket.on("connect", () => res()));
    userASocket.emit("channel:join", channel.id);
    userBSocket.emit("channel:join", channel.id);
  });

  afterAll(async () => {
    userASocket.disconnect();
    userBSocket.disconnect();
    await new Promise<void>((resolve) => httpServer.close(() => resolve()));
    // Nettoie la base
    await prisma.serverMember.deleteMany({ where: { serverId: seedServer.id } });
    await prisma.channel.deleteMany({ where: { id: channel.id } });
    await prisma.server.deleteMany({ where: { id: seedServer.id } });
    await prisma.user.deleteMany({ where: { id: { in: [userA.id, userB.id] } } });
  });

  it("user B reçoit l'event message:new avec @Tous envoyé par user A", async () => {
    const messagePromise = waitForEvent(userBSocket, "message:new");

    const response = await fetch(`${apiUrl}/channels/${channel.id}/messages`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${tokenA}`,
      },
      body: JSON.stringify({
        content: "Hello @Tous!",
        type: "text",
      }),
    });

    expect(response.ok).toBe(true);

    const message = await messagePromise;
    expect(message.content).toContain("@Tous");
  });
});
