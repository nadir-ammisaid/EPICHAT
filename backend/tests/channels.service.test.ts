import { describe, it, expect, vi, beforeEach } from "vitest";
import * as channelsService from "../src/modules/channels/channels.service.js";

// Mock prisma client
vi.mock("../src/prisma/client.js", () => ({
  prisma: {
    server: {
      findUnique: vi.fn(),
    },
    channel: {
      create: vi.fn(),
      findFirst: vi.fn(),
      findUnique: vi.fn(),
      findMany: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    },
    serverMember: {
      findUnique: vi.fn(),
    },
  },
}));

describe("channels.service", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("createChannelService", () => {
    it("should create channel for admin", async () => {
      const { prisma } = await import("../src/prisma/client.js");

      (prisma.server.findUnique as ReturnType<typeof vi.fn>).mockResolvedValue({
        id: "server-123",
      });

      (
        prisma.serverMember.findUnique as ReturnType<typeof vi.fn>
      ).mockResolvedValue({
        role: "admin",
      });

      (prisma.channel.findFirst as ReturnType<typeof vi.fn>).mockResolvedValue(
        null,
      );

      (prisma.channel.create as ReturnType<typeof vi.fn>).mockResolvedValue({
        id: "channel-123",
        name: "general",
        serverId: "server-123",
      });

      const result = await channelsService.createChannelService({
        serverId: "server-123",
        userId: "user-123",
        name: "general",
      });

      expect(result).toBeDefined();
      expect(result.id).toBe("channel-123");
    });

    it("should create channel for owner", async () => {
      const { prisma } = await import("../src/prisma/client.js");

      (prisma.server.findUnique as ReturnType<typeof vi.fn>).mockResolvedValue({
        id: "server-123",
      });

      (
        prisma.serverMember.findUnique as ReturnType<typeof vi.fn>
      ).mockResolvedValue({
        role: "owner",
      });

      (prisma.channel.findFirst as ReturnType<typeof vi.fn>).mockResolvedValue(
        null,
      );

      (prisma.channel.create as ReturnType<typeof vi.fn>).mockResolvedValue({
        id: "channel-123",
        name: "general",
      });

      const result = await channelsService.createChannelService({
        serverId: "server-123",
        userId: "user-123",
        name: "general",
      });

      expect(result).toBeDefined();
    });

    it("should throw 403 for member (insufficient permissions)", async () => {
      const { prisma } = await import("../src/prisma/client.js");

      (prisma.server.findUnique as ReturnType<typeof vi.fn>).mockResolvedValue({
        id: "server-123",
      });

      (
        prisma.serverMember.findUnique as ReturnType<typeof vi.fn>
      ).mockResolvedValue({
        role: "member",
      });

      await expect(
        channelsService.createChannelService({
          serverId: "server-123",
          userId: "user-123",
          name: "general",
        }),
      ).rejects.toThrow();
    });

    it("should throw 404 for non-existent server", async () => {
      const { prisma } = await import("../src/prisma/client.js");

      (prisma.server.findUnique as ReturnType<typeof vi.fn>).mockResolvedValue(
        null,
      );

      await expect(
        channelsService.createChannelService({
          serverId: "server-123",
          userId: "user-123",
          name: "general",
        }),
      ).rejects.toThrow();
    });

    it("should throw 409 for duplicate channel name", async () => {
      const { prisma } = await import("../src/prisma/client.js");

      (prisma.server.findUnique as ReturnType<typeof vi.fn>).mockResolvedValue({
        id: "server-123",
      });

      (
        prisma.serverMember.findUnique as ReturnType<typeof vi.fn>
      ).mockResolvedValue({
        role: "admin",
      });

      (prisma.channel.findFirst as ReturnType<typeof vi.fn>).mockResolvedValue({
        id: "existing-channel",
      });

      await expect(
        channelsService.createChannelService({
          serverId: "server-123",
          userId: "user-123",
          name: "general",
        }),
      ).rejects.toThrow();
    });
  });

  describe("getServerChannelsService", () => {
    it("should return channels for member", async () => {
      const { prisma } = await import("../src/prisma/client.js");

      (prisma.server.findUnique as ReturnType<typeof vi.fn>).mockResolvedValue({
        id: "server-123",
      });

      (
        prisma.serverMember.findUnique as ReturnType<typeof vi.fn>
      ).mockResolvedValue({
        role: "member",
      });

      (prisma.channel.findMany as ReturnType<typeof vi.fn>).mockResolvedValue([
        { id: "ch-1", name: "general" },
        { id: "ch-2", name: "random" },
      ]);

      const result = await channelsService.getServerChannelsService(
        "server-123",
        "user-123",
      );

      expect(result).toHaveLength(2);
    });
  });

  describe("deleteChannelService", () => {
    it("should delete channel for admin", async () => {
      const { prisma } = await import("../src/prisma/client.js");

      (prisma.channel.findUnique as ReturnType<typeof vi.fn>).mockResolvedValue(
        {
          id: "channel-123",
          serverId: "server-123",
        },
      );

      (
        prisma.serverMember.findUnique as ReturnType<typeof vi.fn>
      ).mockResolvedValue({
        role: "admin",
      });

      (prisma.channel.delete as ReturnType<typeof vi.fn>).mockResolvedValue({});

      await expect(
        channelsService.deleteChannelService({
          channelId: "channel-123",
          userId: "user-123",
        }),
      ).resolves.not.toThrow();
    });

    it("should throw 403 for member trying to delete", async () => {
      const { prisma } = await import("../src/prisma/client.js");

      (prisma.channel.findUnique as ReturnType<typeof vi.fn>).mockResolvedValue(
        {
          id: "channel-123",
          serverId: "server-123",
        },
      );

      (
        prisma.serverMember.findUnique as ReturnType<typeof vi.fn>
      ).mockResolvedValue({
        role: "member",
      });

      await expect(
        channelsService.deleteChannelService({
          channelId: "channel-123",
          userId: "user-123",
        }),
      ).rejects.toThrow();
    });

    describe("getChannelDetailsService", () => {
      it("should return channel details for member", async () => {
        const { prisma } = await import("../src/prisma/client.js");

        (
          prisma.channel.findUnique as ReturnType<typeof vi.fn>
        ).mockResolvedValue({
          id: "channel-123",
          serverId: "server-123",
          name: "general",
        });

        (
          prisma.serverMember.findUnique as ReturnType<typeof vi.fn>
        ).mockResolvedValue({
          role: "member",
        });

        const result = await channelsService.getChannelDetailsService(
          "channel-123",
          "user-123",
        );
        expect(result).toBeDefined();
        expect(result.id).toBe("channel-123");
      });

      it("should throw 404 if channel not found", async () => {
        const { prisma } = await import("../src/prisma/client.js");
        (
          prisma.channel.findUnique as ReturnType<typeof vi.fn>
        ).mockResolvedValue(null);

        await expect(
          channelsService.getChannelDetailsService("unknown", "user-123"),
        ).rejects.toThrow("Channel not found");
      });
    });

    describe("updateChannelService", () => {
      it("should update channel for admin", async () => {
        const { prisma } = await import("../src/prisma/client.js");

        (
          prisma.channel.findUnique as ReturnType<typeof vi.fn>
        ).mockResolvedValue({
          id: "channel-123",
          serverId: "server-123",
        });

        (
          prisma.serverMember.findUnique as ReturnType<typeof vi.fn>
        ).mockResolvedValue({
          role: "admin",
        });

        (prisma.channel.update as ReturnType<typeof vi.fn>).mockResolvedValue({
          id: "channel-123",
          name: "new-name",
        });

        const result = await channelsService.updateChannelService({
          channelId: "channel-123",
          userId: "user-123",
          name: "new-name",
        });

        expect(result.name).toBe("new-name");
      });

      it("should throw 403 for member", async () => {
        const { prisma } = await import("../src/prisma/client.js");

        (
          prisma.channel.findUnique as ReturnType<typeof vi.fn>
        ).mockResolvedValue({
          id: "channel-123",
          serverId: "server-123",
        });

        (
          prisma.serverMember.findUnique as ReturnType<typeof vi.fn>
        ).mockResolvedValue({
          role: "member",
        });

        await expect(
          channelsService.updateChannelService({
            channelId: "channel-123",
            userId: "user-123",
            name: "new-name",
          }),
        ).rejects.toThrow();
      });

      it("should throw 404 if channel not found", async () => {
        const { prisma } = await import("../src/prisma/client.js");
        (
          prisma.channel.findUnique as ReturnType<typeof vi.fn>
        ).mockResolvedValue(null);

        await expect(
          channelsService.updateChannelService({
            channelId: "unknown",
            userId: "user-123",
            name: "new-name",
          }),
        ).rejects.toThrow("Channel not found");
      });
    });
  });
});
