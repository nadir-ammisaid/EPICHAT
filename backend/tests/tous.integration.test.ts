import { io as ClientIO, Socket } from "socket.io-client";
import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { randomUUID } from "node:crypto";
import { generateTestToken } from "./utils/generateTestToken";
import { prisma } from "../src/prisma/client.js";

const API_URL = process.env.TEST_API_URL || "http://localhost:3001";

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
  const server = { id: serverId, name: "TestServer", ownerId: userA.id };

  beforeAll(async () => {
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
      where: { id: server.id },
      update: {},
      create: { id: server.id, name: server.name, ownerId: userA.id },
    });
    await prisma.channel.upsert({
      where: { id: channel.id },
      update: {},
      create: { id: channel.id, name: channel.name, serverId: server.id, createdBy: userA.id },
    });
    await prisma.serverMember.upsert({
      where: { serverId_userId: { serverId: server.id, userId: userA.id } },
      update: {},
      create: { serverId: server.id, userId: userA.id, role: "owner" },
    });
    await prisma.serverMember.upsert({
      where: { serverId_userId: { serverId: server.id, userId: userB.id } },
      update: {},
      create: { serverId: server.id, userId: userB.id, role: "member" },
    });

    // Génère des tokens JWT valides
    tokenA = generateTestToken(userA.id);
    tokenB = generateTestToken(userB.id);

    userASocket = ClientIO(API_URL, {
      path: "/ws",
      transports: ["websocket"],
      auth: { token: tokenA },
    });
    userBSocket = ClientIO(API_URL, {
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
    // Nettoie la base
    await prisma.serverMember.deleteMany({ where: { serverId: server.id } });
    await prisma.channel.deleteMany({ where: { id: channel.id } });
    await prisma.server.deleteMany({ where: { id: server.id } });
    await prisma.user.deleteMany({ where: { id: { in: [userA.id, userB.id] } } });
  });

  it("user B reçoit l'event message:new avec @Tous envoyé par user A", async () => {
    const messagePromise = waitForEvent(userBSocket, "message:new");

    const response = await fetch(`${API_URL}/channels/${channel.id}/messages`, {
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
