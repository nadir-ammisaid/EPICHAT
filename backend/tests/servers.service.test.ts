import { describe, it, expect, vi, beforeEach } from "vitest";
import * as serversService from "../src/modules/servers/servers.service.js";

// Mock prisma client
vi.mock("../src/prisma/client.js", () => ({
  prisma: {
    server: {
      create: vi.fn(),
      findUnique: vi.fn(),
      findMany: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    },
    serverMember: {
      findUnique: vi.fn(),
      findMany: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    },
    ban: {
      findUnique: vi.fn(),
      findMany: vi.fn(),
      create: vi.fn(),
      delete: vi.fn(),
    },
    $transaction: vi.fn(),
  },
}));

// Mock Socket.io
vi.mock("../src/socket/index.js", () => ({
  getIO: vi.fn(() => ({
    to: vi.fn(() => ({ emit: vi.fn() })),
  })),
}));

describe("servers.service", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("createServer", () => {
    it("should create a server with owner as member", async () => {
      const { prisma } = await import("../src/prisma/client.js");

      const mockServer = {
        id: "server-123",
        name: "Test Server",
        ownerId: "user-123",
      };

      (prisma.$transaction as ReturnType<typeof vi.fn>).mockImplementation(
        async (fn) => {
          const tx = {
            server: {
              create: vi.fn().mockResolvedValue(mockServer),
            },
            serverMember: {
              create: vi.fn().mockResolvedValue({
                serverId: "server-123",
                userId: "user-123",
                role: "owner",
              }),
            },
          };
          return fn(tx);
        },
      );

      const result = await serversService.createServer({
        name: "Test Server",
        ownerId: "user-123",
      });

      expect(result).toBeDefined();
      expect(result.name).toBe("Test Server");
    });
  });

  describe("getServerById", () => {
    it("should return server for member", async () => {
      const { prisma } = await import("../src/prisma/client.js");

      (
        prisma.serverMember.findUnique as ReturnType<typeof vi.fn>
      ).mockResolvedValue({
        role: "member",
      });

      (prisma.server.findUnique as ReturnType<typeof vi.fn>).mockResolvedValue({
        id: "server-123",
        name: "Test Server",
      });

      const result = await serversService.getServerById(
        "server-123",
        "user-123",
      );

      expect(result).toBeDefined();
      expect(result?.id).toBe("server-123");
    });

    it("should throw 403 for non-member", async () => {
      const { prisma } = await import("../src/prisma/client.js");

      (
        prisma.serverMember.findUnique as ReturnType<typeof vi.fn>
      ).mockResolvedValue(null);

      await expect(
        serversService.getServerById("server-123", "user-123"),
      ).rejects.toThrow();
    });
  });

  describe("getServerMember", () => {
    it("should return member role", async () => {
      const { prisma } = await import("../src/prisma/client.js");

      (
        prisma.serverMember.findUnique as ReturnType<typeof vi.fn>
      ).mockResolvedValue({
        role: "admin",
      });

      const result = await serversService.getServerMember(
        "server-123",
        "user-123",
      );

      expect(result).toBeDefined();
      expect(result?.role).toBe("admin");
    });

    it("should return null for non-member", async () => {
      const { prisma } = await import("../src/prisma/client.js");

      (
        prisma.serverMember.findUnique as ReturnType<typeof vi.fn>
      ).mockResolvedValue(null);

      const result = await serversService.getServerMember(
        "server-123",
        "user-123",
      );

      expect(result).toBeNull();
    });
  });

  describe("updateServer", () => {
    it("should update server for owner", async () => {
      const { prisma } = await import("../src/prisma/client.js");

      (prisma.server.findUnique as ReturnType<typeof vi.fn>).mockResolvedValue({
        ownerId: "user-123",
      });

      (prisma.server.update as ReturnType<typeof vi.fn>).mockResolvedValue({
        id: "server-123",
        name: "Updated Name",
      });

      const result = await serversService.updateServer(
        "server-123",
        { name: "Updated Name" },
        "user-123",
      );

      expect(result.name).toBe("Updated Name");
    });

    it("should update server for admin (non-owner)", async () => {
      const { prisma } = await import("../src/prisma/client.js");

      // Server exists, owner is different
      (prisma.server.findUnique as ReturnType<typeof vi.fn>).mockResolvedValue({
        ownerId: "other-user",
      });

      // User is admin
      (
        prisma.serverMember.findUnique as ReturnType<typeof vi.fn>
      ).mockResolvedValue({
        role: "admin",
      });

      (prisma.server.update as ReturnType<typeof vi.fn>).mockResolvedValue({
        id: "server-123",
        name: "Updated Name",
      });

      const result = await serversService.updateServer(
        "server-123",
        { name: "Updated Name" },
        "user-123",
      );

      expect(result.name).toBe("Updated Name");
    });

    it("should throw 404 for non-existent server", async () => {
      const { prisma } = await import("../src/prisma/client.js");

      (prisma.server.findUnique as ReturnType<typeof vi.fn>).mockResolvedValue(
        null,
      );

      await expect(
        serversService.updateServer(
          "server-123",
          { name: "New Name" },
          "user-123",
        ),
      ).rejects.toThrow();
    });

    it("should throw 403 for non-member (not owner, not admin)", async () => {
      const { prisma } = await import("../src/prisma/client.js");

      (prisma.server.findUnique as ReturnType<typeof vi.fn>).mockResolvedValue({
        ownerId: "other-user",
      });

      // User is not a member
      (
        prisma.serverMember.findUnique as ReturnType<typeof vi.fn>
      ).mockResolvedValue(null);

      await expect(
        serversService.updateServer(
          "server-123",
          { name: "New Name" },
          "user-123",
        ),
      ).rejects.toThrow();
    });

    it("should throw 403 for member (not admin)", async () => {
      const { prisma } = await import("../src/prisma/client.js");

      (prisma.server.findUnique as ReturnType<typeof vi.fn>).mockResolvedValue({
        ownerId: "other-user",
      });

      // User is just a member, not admin
      (
        prisma.serverMember.findUnique as ReturnType<typeof vi.fn>
      ).mockResolvedValue({
        role: "member",
      });

      await expect(
        serversService.updateServer(
          "server-123",
          { name: "New Name" },
          "user-123",
        ),
      ).rejects.toThrow();
    });
  });

  describe("deleteServer", () => {
    it("should delete server for owner", async () => {
      const { prisma } = await import("../src/prisma/client.js");

      (prisma.server.findUnique as ReturnType<typeof vi.fn>).mockResolvedValue({
        ownerId: "user-123",
      });

      (prisma.server.delete as ReturnType<typeof vi.fn>).mockResolvedValue({
        id: "server-123",
      });

      await expect(
        serversService.deleteServer("server-123", "user-123"),
      ).resolves.not.toThrow();
    });

    it("should throw 403 for non-owner", async () => {
      const { prisma } = await import("../src/prisma/client.js");

      (prisma.server.findUnique as ReturnType<typeof vi.fn>).mockResolvedValue({
        ownerId: "other-user",
      });

      await expect(
        serversService.deleteServer("server-123", "user-123"),
      ).rejects.toThrow();
    });

    it("should throw 403 for admin (not owner)", async () => {
      const { prisma } = await import("../src/prisma/client.js");

      (prisma.server.findUnique as ReturnType<typeof vi.fn>).mockResolvedValue({
        ownerId: "other-user",
      });

      await expect(
        serversService.deleteServer("server-123", "admin-user"),
      ).rejects.toThrow();
    });

    it("should throw 404 for non-existent server", async () => {
      const { prisma } = await import("../src/prisma/client.js");

      (prisma.server.findUnique as ReturnType<typeof vi.fn>).mockResolvedValue(
        null,
      );

      await expect(
        serversService.deleteServer("server-123", "user-123"),
      ).rejects.toThrow();
    });
  });

  describe("getManyServers", () => {
    it("should return all servers user is a member of", async () => {
      const { prisma } = await import("../src/prisma/client.js");

      (prisma.server.findMany as ReturnType<typeof vi.fn>).mockResolvedValue([
        { id: "server-1", name: "Server 1" },
        { id: "server-2", name: "Server 2" },
      ]);

      const result = await serversService.getManyServers("user-123");

      expect(result).toHaveLength(2);
    });
  });

  describe("joinServer", () => {
    it("should allow user to join server", async () => {
      const { prisma } = await import("../src/prisma/client.js");

      // Not banned
      (prisma.ban.findUnique as ReturnType<typeof vi.fn>).mockResolvedValue(null);
      // Not already a member
      (prisma.serverMember.findUnique as ReturnType<typeof vi.fn>).mockResolvedValue(null);
      (prisma.serverMember.create as ReturnType<typeof vi.fn>).mockResolvedValue({
        serverId: "server-123",
        userId: "user-123",
        role: "member",
      });

      const result = await serversService.joinServer("server-123", "user-123");

      expect(result.role).toBe("member");
    });

    it("should throw 403 if user is banned", async () => {
      const { prisma } = await import("../src/prisma/client.js");

      (prisma.ban.findUnique as ReturnType<typeof vi.fn>).mockResolvedValue({
        userId: "user-123",
        permanent: true,
        expiresAt: null,
      });

      await expect(
        serversService.joinServer("server-123", "user-123"),
      ).rejects.toThrow();
    });

    it("should throw 409 if already a member", async () => {
      const { prisma } = await import("../src/prisma/client.js");

      // Not banned
      (prisma.ban.findUnique as ReturnType<typeof vi.fn>).mockResolvedValue(null);
      // Already a member
      (prisma.serverMember.findUnique as ReturnType<typeof vi.fn>).mockResolvedValue({
        role: "member",
      });

      await expect(
        serversService.joinServer("server-123", "user-123"),
      ).rejects.toThrow();
    });
  });

  describe("getServerExists", () => {
    it("should return server id if exists", async () => {
      const { prisma } = await import("../src/prisma/client.js");

      (prisma.server.findUnique as ReturnType<typeof vi.fn>).mockResolvedValue({
        id: "server-123",
      });

      const result = await serversService.getServerExists("server-123");

      expect(result?.id).toBe("server-123");
    });

    it("should return null if not exists", async () => {
      const { prisma } = await import("../src/prisma/client.js");

      (prisma.server.findUnique as ReturnType<typeof vi.fn>).mockResolvedValue(
        null,
      );

      const result = await serversService.getServerExists("server-123");

      expect(result).toBeNull();
    });
  });

  describe("leaveServer", () => {
    it("should allow member to leave", async () => {
      const { prisma } = await import("../src/prisma/client.js");

      (
        prisma.serverMember.findUnique as ReturnType<typeof vi.fn>
      ).mockResolvedValue({
        role: "member",
      });

      (prisma.server.findUnique as ReturnType<typeof vi.fn>).mockResolvedValue({
        ownerId: "other-user",
      });

      (
        prisma.serverMember.delete as ReturnType<typeof vi.fn>
      ).mockResolvedValue({});

      await expect(
        serversService.leaveServer("server-123", "user-123"),
      ).resolves.not.toThrow();
    });

    it("should throw 404 if not a member", async () => {
      const { prisma } = await import("../src/prisma/client.js");

      (
        prisma.serverMember.findUnique as ReturnType<typeof vi.fn>
      ).mockResolvedValue(null);

      await expect(
        serversService.leaveServer("server-123", "user-123"),
      ).rejects.toThrow();
    });

    it("should throw 403 for owner trying to leave", async () => {
      const { prisma } = await import("../src/prisma/client.js");

      (
        prisma.serverMember.findUnique as ReturnType<typeof vi.fn>
      ).mockResolvedValue({
        role: "owner",
      });

      (prisma.server.findUnique as ReturnType<typeof vi.fn>).mockResolvedValue({
        ownerId: "user-123",
      });

      await expect(
        serversService.leaveServer("server-123", "user-123"),
      ).rejects.toThrow();
    });
  });

  describe("getServerMembers", () => {
    it("should return members for server member", async () => {
      const { prisma } = await import("../src/prisma/client.js");

      (
        prisma.serverMember.findUnique as ReturnType<typeof vi.fn>
      ).mockResolvedValue({
        role: "member",
      });

      (
        prisma.serverMember.findMany as ReturnType<typeof vi.fn>
      ).mockResolvedValue([
        {
          userId: "user-1",
          role: "owner",
          user: { id: "user-1", username: "owner" },
        },
        {
          userId: "user-2",
          role: "member",
          user: { id: "user-2", username: "member" },
        },
      ]);

      const result = await serversService.getServerMembers(
        "server-123",
        "user-123",
      );

      expect(result).toHaveLength(2);
    });

    it("should throw 403 for non-member", async () => {
      const { prisma } = await import("../src/prisma/client.js");

      (
        prisma.serverMember.findUnique as ReturnType<typeof vi.fn>
      ).mockResolvedValue(null);

      await expect(
        serversService.getServerMembers("server-123", "user-123"),
      ).rejects.toThrow();
    });
  });

  describe("updateMemberRole", () => {
    it("should allow owner to update member role to admin", async () => {
      const { prisma } = await import("../src/prisma/client.js");

      (prisma.server.findUnique as ReturnType<typeof vi.fn>).mockResolvedValue({
        ownerId: "owner-123",
      });

      (
        prisma.serverMember.findUnique as ReturnType<typeof vi.fn>
      ).mockResolvedValue({
        role: "member",
      });

      (
        prisma.serverMember.update as ReturnType<typeof vi.fn>
      ).mockResolvedValue({
        userId: "target-user",
        role: "admin",
        user: { id: "target-user", username: "target" },
      });

      const result = await serversService.updateMemberRole(
        "server-123",
        "target-user",
        "admin",
        "owner-123",
      );

      expect(result.role).toBe("admin");
    });

    it("should throw 404 for non-existent server", async () => {
      const { prisma } = await import("../src/prisma/client.js");

      (prisma.server.findUnique as ReturnType<typeof vi.fn>).mockResolvedValue(
        null,
      );

      await expect(
        serversService.updateMemberRole(
          "server-123",
          "target-user",
          "admin",
          "owner-123",
        ),
      ).rejects.toThrow();
    });

    it("should throw 403 for non-owner", async () => {
      const { prisma } = await import("../src/prisma/client.js");

      (prisma.server.findUnique as ReturnType<typeof vi.fn>).mockResolvedValue({
        ownerId: "real-owner",
      });

      await expect(
        serversService.updateMemberRole(
          "server-123",
          "target-user",
          "admin",
          "not-owner",
        ),
      ).rejects.toThrow();
    });

    it("should throw 404 for non-existent target member", async () => {
      const { prisma } = await import("../src/prisma/client.js");

      (prisma.server.findUnique as ReturnType<typeof vi.fn>).mockResolvedValue({
        ownerId: "owner-123",
      });

      (
        prisma.serverMember.findUnique as ReturnType<typeof vi.fn>
      ).mockResolvedValue(null);

      await expect(
        serversService.updateMemberRole(
          "server-123",
          "target-user",
          "admin",
          "owner-123",
        ),
      ).rejects.toThrow();
    });

    it("should throw 403 when trying to assign owner role", async () => {
      const { prisma } = await import("../src/prisma/client.js");

      (prisma.server.findUnique as ReturnType<typeof vi.fn>).mockResolvedValue({
        ownerId: "owner-123",
      });

      (
        prisma.serverMember.findUnique as ReturnType<typeof vi.fn>
      ).mockResolvedValue({
        role: "member",
      });

      await expect(
        serversService.updateMemberRole(
          "server-123",
          "target-user",
          "owner",
          "owner-123",
        ),
      ).rejects.toThrow();
    });

    it("should throw 403 when trying to change owner's role", async () => {
      const { prisma } = await import("../src/prisma/client.js");

      (prisma.server.findUnique as ReturnType<typeof vi.fn>).mockResolvedValue({
        ownerId: "owner-123",
      });

      (
        prisma.serverMember.findUnique as ReturnType<typeof vi.fn>
      ).mockResolvedValue({
        role: "owner",
      });

      await expect(
        serversService.updateMemberRole(
          "server-123",
          "owner-123",
          "admin",
          "owner-123",
        ),
      ).rejects.toThrow();
    });
  });

  describe("kickMember", () => {
    it("should throw 404 when server does not exist", async () => {
      const { prisma } = await import("../src/prisma/client.js");

      (prisma.server.findUnique as ReturnType<typeof vi.fn>).mockResolvedValue(
        null,
      );

      await expect(
        serversService.kickMember("server-123", "target-user", "requester"),
      ).rejects.toThrow();
    });

    it("should throw 403 when requester is not a member", async () => {
      const { prisma } = await import("../src/prisma/client.js");

      (prisma.server.findUnique as ReturnType<typeof vi.fn>).mockResolvedValue({
        ownerId: "owner-123",
      });
      (
        prisma.serverMember.findUnique as ReturnType<typeof vi.fn>
      ).mockResolvedValueOnce(null);

      await expect(
        serversService.kickMember("server-123", "target-user", "requester"),
      ).rejects.toThrow();
    });

    it("should throw 403 when requester is only a member", async () => {
      const { prisma } = await import("../src/prisma/client.js");

      (prisma.server.findUnique as ReturnType<typeof vi.fn>).mockResolvedValue({
        ownerId: "owner-123",
      });
      (
        prisma.serverMember.findUnique as ReturnType<typeof vi.fn>
      ).mockResolvedValueOnce({ role: "member" });

      await expect(
        serversService.kickMember("server-123", "target-user", "requester"),
      ).rejects.toThrow();
    });

    it("should throw 404 when target member does not exist", async () => {
      const { prisma } = await import("../src/prisma/client.js");

      (prisma.server.findUnique as ReturnType<typeof vi.fn>).mockResolvedValue({
        ownerId: "owner-123",
      });
      (
        prisma.serverMember.findUnique as ReturnType<typeof vi.fn>
      )
        .mockResolvedValueOnce({ role: "admin" })
        .mockResolvedValueOnce(null);

      await expect(
        serversService.kickMember("server-123", "target-user", "requester"),
      ).rejects.toThrow();
    });

    it("should throw 403 when target user is the server owner", async () => {
      const { prisma } = await import("../src/prisma/client.js");

      (prisma.server.findUnique as ReturnType<typeof vi.fn>).mockResolvedValue({
        ownerId: "owner-123",
      });
      (
        prisma.serverMember.findUnique as ReturnType<typeof vi.fn>
      )
        .mockResolvedValueOnce({ role: "admin" })
        .mockResolvedValueOnce({ role: "member" });

      await expect(
        serversService.kickMember("server-123", "owner-123", "requester"),
      ).rejects.toThrow();
    });

    it("should throw 403 when admin tries to kick another admin", async () => {
      const { prisma } = await import("../src/prisma/client.js");

      (prisma.server.findUnique as ReturnType<typeof vi.fn>).mockResolvedValue({
        ownerId: "owner-123",
      });
      (
        prisma.serverMember.findUnique as ReturnType<typeof vi.fn>
      )
        .mockResolvedValueOnce({ role: "admin" })
        .mockResolvedValueOnce({ role: "admin" });

      await expect(
        serversService.kickMember("server-123", "target-user", "requester"),
      ).rejects.toThrow();
    });

    it("should delete target member when requester can kick", async () => {
      const { prisma } = await import("../src/prisma/client.js");

      (prisma.server.findUnique as ReturnType<typeof vi.fn>).mockResolvedValue({
        ownerId: "owner-123",
      });
      (
        prisma.serverMember.findUnique as ReturnType<typeof vi.fn>
      )
        .mockResolvedValueOnce({ role: "owner" })
        .mockResolvedValueOnce({ role: "admin" });
      (prisma.serverMember.delete as ReturnType<typeof vi.fn>).mockResolvedValue(
        {},
      );

      await expect(
        serversService.kickMember("server-123", "target-user", "owner-123"),
      ).resolves.toBe(true);

      expect(prisma.serverMember.delete).toHaveBeenCalledWith({
        where: {
          serverId_userId: {
            serverId: "server-123",
            userId: "target-user",
          },
        },
      });
    });
  });

  describe("banMemberPermanent", () => {
    it("should ban a member permanently", async () => {
      const { prisma } = await import("../src/prisma/client.js");

      (prisma.server.findUnique as ReturnType<typeof vi.fn>).mockResolvedValue({ ownerId: "owner-123" });
      (prisma.serverMember.findUnique as ReturnType<typeof vi.fn>)
        .mockResolvedValueOnce({ role: "owner" })   // requester
        .mockResolvedValueOnce({ role: "member" });  // target
      (prisma.ban.findUnique as ReturnType<typeof vi.fn>).mockResolvedValue(null);
      (prisma.ban.create as ReturnType<typeof vi.fn>).mockResolvedValue({
        userId: "target-user",
        permanent: true,
        expiresAt: null,
      });
      (prisma.serverMember.delete as ReturnType<typeof vi.fn>).mockResolvedValue({});

      const result = await serversService.banMemberPermanent("server-123", "target-user", "owner-123");

      expect(result.permanent).toBe(true);
    });

    it("should throw 404 if server not found", async () => {
      const { prisma } = await import("../src/prisma/client.js");
      (prisma.server.findUnique as ReturnType<typeof vi.fn>).mockResolvedValue(null);

      await expect(
        serversService.banMemberPermanent("server-123", "target-user", "owner-123"),
      ).rejects.toThrow();
    });

    it("should throw 403 if requester is not a member", async () => {
      const { prisma } = await import("../src/prisma/client.js");
      (prisma.server.findUnique as ReturnType<typeof vi.fn>).mockResolvedValue({ ownerId: "owner-123" });
      (prisma.serverMember.findUnique as ReturnType<typeof vi.fn>).mockResolvedValueOnce(null);

      await expect(
        serversService.banMemberPermanent("server-123", "target-user", "requester"),
      ).rejects.toThrow();
    });

    it("should throw 403 if requester is only a member", async () => {
      const { prisma } = await import("../src/prisma/client.js");
      (prisma.server.findUnique as ReturnType<typeof vi.fn>).mockResolvedValue({ ownerId: "owner-123" });
      (prisma.serverMember.findUnique as ReturnType<typeof vi.fn>).mockResolvedValueOnce({ role: "member" });

      await expect(
        serversService.banMemberPermanent("server-123", "target-user", "requester"),
      ).rejects.toThrow();
    });

    it("should throw 404 if target member not found", async () => {
      const { prisma } = await import("../src/prisma/client.js");
      (prisma.server.findUnique as ReturnType<typeof vi.fn>).mockResolvedValue({ ownerId: "owner-123" });
      (prisma.serverMember.findUnique as ReturnType<typeof vi.fn>)
        .mockResolvedValueOnce({ role: "owner" })
        .mockResolvedValueOnce(null);

      await expect(
        serversService.banMemberPermanent("server-123", "target-user", "owner-123"),
      ).rejects.toThrow();
    });

    it("should throw 403 if trying to ban the owner", async () => {
      const { prisma } = await import("../src/prisma/client.js");
      (prisma.server.findUnique as ReturnType<typeof vi.fn>).mockResolvedValue({ ownerId: "owner-123" });
      (prisma.serverMember.findUnique as ReturnType<typeof vi.fn>)
        .mockResolvedValueOnce({ role: "owner" })
        .mockResolvedValueOnce({ role: "owner" });

      await expect(
        serversService.banMemberPermanent("server-123", "owner-123", "owner-123"),
      ).rejects.toThrow();
    });

    it("should throw 409 if user is already banned", async () => {
      const { prisma } = await import("../src/prisma/client.js");
      (prisma.server.findUnique as ReturnType<typeof vi.fn>).mockResolvedValue({ ownerId: "owner-123" });
      (prisma.serverMember.findUnique as ReturnType<typeof vi.fn>)
        .mockResolvedValueOnce({ role: "owner" })
        .mockResolvedValueOnce({ role: "member" });
      (prisma.ban.findUnique as ReturnType<typeof vi.fn>).mockResolvedValue({ userId: "target-user" });

      await expect(
        serversService.banMemberPermanent("server-123", "target-user", "owner-123"),
      ).rejects.toThrow();
    });
  });

  describe("banMemberTemporary", () => {
    it("should ban a member temporarily", async () => {
      const { prisma } = await import("../src/prisma/client.js");

      (prisma.server.findUnique as ReturnType<typeof vi.fn>).mockResolvedValue({ ownerId: "owner-123" });
      (prisma.serverMember.findUnique as ReturnType<typeof vi.fn>)
        .mockResolvedValueOnce({ role: "owner" })
        .mockResolvedValueOnce({ role: "member" });
      (prisma.ban.findUnique as ReturnType<typeof vi.fn>).mockResolvedValue(null);
      (prisma.ban.create as ReturnType<typeof vi.fn>).mockResolvedValue({
        userId: "target-user",
        permanent: false,
        expiresAt: new Date(Date.now() + 3600000),
      });
      (prisma.serverMember.delete as ReturnType<typeof vi.fn>).mockResolvedValue({});

      const result = await serversService.banMemberTemporary("server-123", "target-user", "owner-123", 1, "hours");

      expect(result.permanent).toBe(false);
    });

    it("should throw 400 for invalid duration", async () => {
      await expect(
        serversService.banMemberTemporary("server-123", "target-user", "owner-123", 0, "hours"),
      ).rejects.toThrow();
    });

    it("should throw 404 if server not found", async () => {
      const { prisma } = await import("../src/prisma/client.js");
      (prisma.server.findUnique as ReturnType<typeof vi.fn>).mockResolvedValue(null);

      await expect(
        serversService.banMemberTemporary("server-123", "target-user", "owner-123", 1, "hours"),
      ).rejects.toThrow();
    });

    it("should throw 403 if requester is not a member", async () => {
      const { prisma } = await import("../src/prisma/client.js");
      (prisma.server.findUnique as ReturnType<typeof vi.fn>).mockResolvedValue({ ownerId: "owner-123" });
      (prisma.serverMember.findUnique as ReturnType<typeof vi.fn>).mockResolvedValueOnce(null);

      await expect(
        serversService.banMemberTemporary("server-123", "target-user", "requester", 1, "hours"),
      ).rejects.toThrow();
    });

    it("should throw 403 if requester is only a member", async () => {
      const { prisma } = await import("../src/prisma/client.js");
      (prisma.server.findUnique as ReturnType<typeof vi.fn>).mockResolvedValue({ ownerId: "owner-123" });
      (prisma.serverMember.findUnique as ReturnType<typeof vi.fn>).mockResolvedValueOnce({ role: "member" });

      await expect(
        serversService.banMemberTemporary("server-123", "target-user", "requester", 1, "hours"),
      ).rejects.toThrow();
    });

    it("should throw 404 if target member not found", async () => {
      const { prisma } = await import("../src/prisma/client.js");
      (prisma.server.findUnique as ReturnType<typeof vi.fn>).mockResolvedValue({ ownerId: "owner-123" });
      (prisma.serverMember.findUnique as ReturnType<typeof vi.fn>)
        .mockResolvedValueOnce({ role: "owner" })
        .mockResolvedValueOnce(null);

      await expect(
        serversService.banMemberTemporary("server-123", "target-user", "owner-123", 1, "hours"),
      ).rejects.toThrow();
    });

    it("should throw 403 if trying to ban the owner", async () => {
      const { prisma } = await import("../src/prisma/client.js");
      (prisma.server.findUnique as ReturnType<typeof vi.fn>).mockResolvedValue({ ownerId: "owner-123" });
      (prisma.serverMember.findUnique as ReturnType<typeof vi.fn>)
        .mockResolvedValueOnce({ role: "owner" })
        .mockResolvedValueOnce({ role: "owner" });

      await expect(
        serversService.banMemberTemporary("server-123", "owner-123", "owner-123", 1, "hours"),
      ).rejects.toThrow();
    });

    it("should throw 409 if user is already banned", async () => {
      const { prisma } = await import("../src/prisma/client.js");
      (prisma.server.findUnique as ReturnType<typeof vi.fn>).mockResolvedValue({ ownerId: "owner-123" });
      (prisma.serverMember.findUnique as ReturnType<typeof vi.fn>)
        .mockResolvedValueOnce({ role: "owner" })
        .mockResolvedValueOnce({ role: "member" });
      (prisma.ban.findUnique as ReturnType<typeof vi.fn>).mockResolvedValue({ userId: "target-user" });

      await expect(
        serversService.banMemberTemporary("server-123", "target-user", "owner-123", 1, "hours"),
      ).rejects.toThrow();
    });

    it("should work with days unit", async () => {
      const { prisma } = await import("../src/prisma/client.js");
      (prisma.server.findUnique as ReturnType<typeof vi.fn>).mockResolvedValue({ ownerId: "owner-123" });
      (prisma.serverMember.findUnique as ReturnType<typeof vi.fn>)
        .mockResolvedValueOnce({ role: "owner" })
        .mockResolvedValueOnce({ role: "member" });
      (prisma.ban.findUnique as ReturnType<typeof vi.fn>).mockResolvedValue(null);
      (prisma.ban.create as ReturnType<typeof vi.fn>).mockResolvedValue({
        userId: "target-user", permanent: false, expiresAt: new Date(),
      });
      (prisma.serverMember.delete as ReturnType<typeof vi.fn>).mockResolvedValue({});

      await expect(
        serversService.banMemberTemporary("server-123", "target-user", "owner-123", 2, "days"),
      ).resolves.not.toThrow();
    });

    it("should work with minutes unit", async () => {
      const { prisma } = await import("../src/prisma/client.js");
      (prisma.server.findUnique as ReturnType<typeof vi.fn>).mockResolvedValue({ ownerId: "owner-123" });
      (prisma.serverMember.findUnique as ReturnType<typeof vi.fn>)
        .mockResolvedValueOnce({ role: "admin" })
        .mockResolvedValueOnce({ role: "member" });
      (prisma.ban.findUnique as ReturnType<typeof vi.fn>).mockResolvedValue(null);
      (prisma.ban.create as ReturnType<typeof vi.fn>).mockResolvedValue({
        userId: "target-user", permanent: false, expiresAt: new Date(),
      });
      (prisma.serverMember.delete as ReturnType<typeof vi.fn>).mockResolvedValue({});

      await expect(
        serversService.banMemberTemporary("server-123", "target-user", "admin-123", 30, "minutes"),
      ).resolves.not.toThrow();
    });
  });

  describe("getServerBans", () => {
    it("should return bans with remaining time for active temp ban", async () => {
      const { prisma } = await import("../src/prisma/client.js");

      const futureDate = new Date(Date.now() + 3600000); // 1h from now
      (prisma.ban.findMany as ReturnType<typeof vi.fn>).mockResolvedValue([
        { userId: "user-1", permanent: false, expiresAt: futureDate, user: { username: "alice" } },
      ]);

      const result = await serversService.getServerBans("server-123");

      expect(result).toHaveLength(1);
      expect(result[0].username).toBe("alice");
      expect(result[0].remaining).not.toBeNull();
      expect(result[0].remaining).not.toBe("expired");
    });

    it("should return expired for past temp ban", async () => {
      const { prisma } = await import("../src/prisma/client.js");

      const pastDate = new Date(Date.now() - 3600000); // 1h ago
      (prisma.ban.findMany as ReturnType<typeof vi.fn>).mockResolvedValue([
        { userId: "user-1", permanent: false, expiresAt: pastDate, user: { username: "bob" } },
      ]);

      const result = await serversService.getServerBans("server-123");

      expect(result[0].remaining).toBe("expired");
    });

    it("should return null remaining for permanent ban", async () => {
      const { prisma } = await import("../src/prisma/client.js");

      (prisma.ban.findMany as ReturnType<typeof vi.fn>).mockResolvedValue([
        { userId: "user-1", permanent: true, expiresAt: null, user: { username: "carol" } },
      ]);

      const result = await serversService.getServerBans("server-123");

      expect(result[0].remaining).toBeNull();
      expect(result[0].permanent).toBe(true);
    });

    it("should return empty array when no bans", async () => {
      const { prisma } = await import("../src/prisma/client.js");

      (prisma.ban.findMany as ReturnType<typeof vi.fn>).mockResolvedValue([]);

      const result = await serversService.getServerBans("server-123");

      expect(result).toHaveLength(0);
    });
  });

  describe("unbanMember", () => {
    it("should unban a member successfully", async () => {
      const { prisma } = await import("../src/prisma/client.js");

      (prisma.ban.findUnique as ReturnType<typeof vi.fn>).mockResolvedValue({
        userId: "user-123",
        serverId: "server-123",
      });
      (prisma.ban.delete as ReturnType<typeof vi.fn>).mockResolvedValue({});
      (prisma.serverMember.create as ReturnType<typeof vi.fn>).mockResolvedValue({
        serverId: "server-123",
        userId: "user-123",
        role: "member",
      });

      const result = await serversService.unbanMember("server-123", "user-123");

      expect(result.success).toBe(true);
    });

    it("should throw 404 if user is not banned", async () => {
      const { prisma } = await import("../src/prisma/client.js");

      (prisma.ban.findUnique as ReturnType<typeof vi.fn>).mockResolvedValue(null);

      await expect(
        serversService.unbanMember("server-123", "user-123"),
      ).rejects.toThrow();
    });
  });
});