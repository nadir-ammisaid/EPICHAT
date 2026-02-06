import { describe, it, expect, vi, beforeEach } from "vitest";
import * as messagesService from "../src/modules/messages/messages.service.js";

// Mock prisma client
vi.mock("../src/prisma/client.js", () => ({
  prisma: {
    channel: {
      findUnique: vi.fn(),
    },
    serverMember: {
      findUnique: vi.fn(),
    },
    message: {
      create: vi.fn(),
      findUnique: vi.fn(),
      findMany: vi.fn(),
      update: vi.fn(),
    },
  },
}));

describe("messages.service", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("sendMessage", () => {
    it("should send message for server member", async () => {
      const { prisma } = await import("../src/prisma/client.js");

      (prisma.channel.findUnique as ReturnType<typeof vi.fn>).mockResolvedValue({
        id: "channel-123",
        serverId: "server-123",
      });

      (prisma.serverMember.findUnique as ReturnType<typeof vi.fn>).mockResolvedValue({
        role: "member",
      });

      (prisma.message.create as ReturnType<typeof vi.fn>).mockResolvedValue({
        id: "msg-123",
        content: "Hello world",
        authorId: "user-123",
        channelId: "channel-123",
      });

      const result = await messagesService.sendMessage("user-123", "channel-123", "Hello world");

      expect(result).toBeDefined();
      expect(result.id).toBe("msg-123");
      expect(result.content).toBe("Hello world");
    });

    it("should throw 403 for non-member", async () => {
      const { prisma } = await import("../src/prisma/client.js");

      (prisma.channel.findUnique as ReturnType<typeof vi.fn>).mockResolvedValue({
        id: "channel-123",
        serverId: "server-123",
      });

      (prisma.serverMember.findUnique as ReturnType<typeof vi.fn>).mockResolvedValue(null);

      await expect(
        messagesService.sendMessage("user-123", "channel-123", "Hello")
      ).rejects.toThrow();
    });

    it("should throw 404 for non-existent channel", async () => {
      const { prisma } = await import("../src/prisma/client.js");

      (prisma.channel.findUnique as ReturnType<typeof vi.fn>).mockResolvedValue(null);

      await expect(
        messagesService.sendMessage("user-123", "channel-123", "Hello")
      ).rejects.toThrow();
    });
  });

  describe("getChannelMessages", () => {
    it("should return messages for member", async () => {
      const { prisma } = await import("../src/prisma/client.js");

      (prisma.channel.findUnique as ReturnType<typeof vi.fn>).mockResolvedValue({
        id: "channel-123",
        serverId: "server-123",
      });

      (prisma.serverMember.findUnique as ReturnType<typeof vi.fn>).mockResolvedValue({
        role: "member",
      });

      (prisma.message.findMany as ReturnType<typeof vi.fn>).mockResolvedValue([
        { id: "msg-1", content: "First" },
        { id: "msg-2", content: "Second" },
      ]);

      const result = await messagesService.getChannelMessages("user-123", "channel-123", 50);

      expect(result.messages).toHaveLength(2);
    });

    it("should throw 403 for non-member", async () => {
      const { prisma } = await import("../src/prisma/client.js");

      (prisma.channel.findUnique as ReturnType<typeof vi.fn>).mockResolvedValue({
        id: "channel-123",
        serverId: "server-123",
      });

      (prisma.serverMember.findUnique as ReturnType<typeof vi.fn>).mockResolvedValue(null);

      await expect(
        messagesService.getChannelMessages("user-123", "channel-123", 50)
      ).rejects.toThrow();
    });
  });

  describe("deleteMessage", () => {
    it("should allow author to delete own message", async () => {
      const { prisma } = await import("../src/prisma/client.js");

      (prisma.message.findUnique as ReturnType<typeof vi.fn>).mockResolvedValue({
        id: "msg-123",
        authorId: "user-123",
        channel: { serverId: "server-123" },
      });

      (prisma.serverMember.findUnique as ReturnType<typeof vi.fn>).mockResolvedValue({
        role: "member",
      });

      (prisma.message.update as ReturnType<typeof vi.fn>).mockResolvedValue({});

      await expect(
        messagesService.deleteMessage("user-123", "msg-123")
      ).resolves.not.toThrow();
    });

    it("should allow admin to delete any message", async () => {
      const { prisma } = await import("../src/prisma/client.js");

      (prisma.message.findUnique as ReturnType<typeof vi.fn>).mockResolvedValue({
        id: "msg-123",
        authorId: "other-user",
        channelId: "channel-123",
        channel: { serverId: "server-123" },
      });

      (prisma.serverMember.findUnique as ReturnType<typeof vi.fn>).mockResolvedValue({
        role: "admin",
      });

      (prisma.message.update as ReturnType<typeof vi.fn>).mockResolvedValue({});

      await expect(
        messagesService.deleteMessage("user-123", "msg-123")
      ).resolves.not.toThrow();
    });

    it("should allow owner to delete any message", async () => {
      const { prisma } = await import("../src/prisma/client.js");

      (prisma.message.findUnique as ReturnType<typeof vi.fn>).mockResolvedValue({
        id: "msg-123",
        authorId: "other-user",
        channelId: "channel-123",
        channel: { serverId: "server-123" },
      });

      (prisma.serverMember.findUnique as ReturnType<typeof vi.fn>).mockResolvedValue({
        role: "owner",
      });

      (prisma.message.update as ReturnType<typeof vi.fn>).mockResolvedValue({});

      await expect(
        messagesService.deleteMessage("user-123", "msg-123")
      ).resolves.not.toThrow();
    });

    it("should throw 403 for member trying to delete others message", async () => {
      const { prisma } = await import("../src/prisma/client.js");

      (prisma.message.findUnique as ReturnType<typeof vi.fn>).mockResolvedValue({
        id: "msg-123",
        authorId: "other-user",
        channel: { serverId: "server-123" },
      });

      (prisma.serverMember.findUnique as ReturnType<typeof vi.fn>).mockResolvedValue({
        role: "member",
      });

      await expect(
        messagesService.deleteMessage("user-123", "msg-123")
      ).rejects.toThrow();
    });

    it("should throw 404 for non-existent message", async () => {
      const { prisma } = await import("../src/prisma/client.js");

      (prisma.message.findUnique as ReturnType<typeof vi.fn>).mockResolvedValue(null);

      await expect(
        messagesService.deleteMessage("user-123", "msg-123")
      ).rejects.toThrow();
    });

    it("should return messages with cursor pagination", async () => {
      const { prisma } = await import("../src/prisma/client.js");

      (prisma.channel.findUnique as ReturnType<typeof vi.fn>).mockResolvedValue({
        id: "channel-123",
        serverId: "server-123",
      });

      (prisma.serverMember.findUnique as ReturnType<typeof vi.fn>).mockResolvedValue({
        role: "member",
      });

      (prisma.message.findMany as ReturnType<typeof vi.fn>).mockResolvedValue([
        { id: "msg-3", content: "Third" },
      ]);

      const result = await messagesService.getChannelMessages("user-123", "channel-123", 50, "msg-oldest");

      expect(prisma.message.findMany).toHaveBeenCalledWith(expect.objectContaining({
        cursor: { id: "msg-oldest" },
        skip: 1,
      }));
      expect(result.messages).toHaveLength(1);
    });
  });

  describe("updateMessage", () => {
    it("should update own message", async () => {
      const { prisma } = await import("../src/prisma/client.js");

      (prisma.message.findUnique as ReturnType<typeof vi.fn>).mockResolvedValue({
        id: "msg-123",
        authorId: "user-123",
        channel: { serverId: "server-123" },
        deletedAt: null
      });

       (prisma.message.update as ReturnType<typeof vi.fn>).mockResolvedValue({
        id: "msg-123",
        content: "updated content"
       });

       const result = await messagesService.updateMessage("user-123", "msg-123", "updated content");
       expect(result.content).toBe("updated content");
    });

    it("should throw 403 if updating others message", async () => {
       const { prisma } = await import("../src/prisma/client.js");

      (prisma.message.findUnique as ReturnType<typeof vi.fn>).mockResolvedValue({
        id: "msg-123",
        authorId: "other-user",
        channel: { serverId: "server-123" },
        deletedAt: null
      });

      await expect(messagesService.updateMessage("user-123", "msg-123", "new"))
        .rejects.toThrow("You can only edit your own messages");
    });

    it("should throw 400 if message is deleted", async () => {
       const { prisma } = await import("../src/prisma/client.js");

      (prisma.message.findUnique as ReturnType<typeof vi.fn>).mockResolvedValue({
        id: "msg-123",
        authorId: "user-123",
        deletedAt: new Date()
      });

      await expect(messagesService.updateMessage("user-123", "msg-123", "new"))
        .rejects.toThrow("Cannot edit a deleted message");
    });
    
    it("should throw 404 if message not found", async () => {
       const { prisma } = await import("../src/prisma/client.js");
       (prisma.message.findUnique as ReturnType<typeof vi.fn>).mockResolvedValue(null);

       await expect(messagesService.updateMessage("user-123", "unknown", "new"))
        .rejects.toThrow("Message not found");
    });
  });
});
