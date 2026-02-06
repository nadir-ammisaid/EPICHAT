import { describe, it, expect, vi, beforeEach } from "vitest";
import * as authService from "../src/modules/auth/auth.service.js";

// Mock bcrypt to avoid actual hashing
vi.mock("bcrypt", () => ({
  default: {
    hash: vi.fn().mockResolvedValue("hashed_password"),
    compare: vi.fn().mockResolvedValue(true),
  },
}));

// Mock jsonwebtoken
vi.mock("jsonwebtoken", () => ({
  default: {
    sign: vi.fn().mockReturnValue("mock_jwt_token"),
  },
}));

// Mock prisma client
vi.mock("../src/prisma/client.js", () => ({
  prisma: {
    user: {
      findUnique: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    },
    $transaction: vi.fn(),
    serverMember: { deleteMany: vi.fn() },
    message: { deleteMany: vi.fn() },
    invite: { deleteMany: vi.fn() },
    channel: { deleteMany: vi.fn() },
    server: { deleteMany: vi.fn() },
  },
}));

describe("auth.service", () => {
  beforeEach(async () => {
    vi.clearAllMocks();
    // Set JWT_SECRET for tests
    process.env.JWT_SECRET = "test_secret";
    
    // Reset bcrypt mock default
    const bcrypt = await import("bcrypt");
    (bcrypt.default.compare as ReturnType<typeof vi.fn>).mockResolvedValue(true);
  });

  describe("signup", () => {
    it("should create a new user successfully", async () => {
      const { prisma } = await import("../src/prisma/client.js");

      (prisma.user.create as ReturnType<typeof vi.fn>).mockResolvedValue({
        id: "user-123",
        email: "test@example.com",
        username: "testuser",
      });

      const result = await authService.signup({
        email: "test@example.com",
        username: "testuser",
        password: "password123",
      });

      expect(result).toBeDefined();
      expect(result.userId).toBe("user-123");
      expect(prisma.user.create).toHaveBeenCalledWith({
        data: {
          email: "test@example.com",
          username: "testuser",
          passwordHash: "hashed_password",
        },
        select: { id: true },
      });
    });
  });

  describe("login", () => {
    it("should return access token for valid credentials", async () => {
      const { prisma } = await import("../src/prisma/client.js");

      (prisma.user.findUnique as ReturnType<typeof vi.fn>).mockResolvedValue({
        id: "user-123",
        passwordHash: "hashed_password",
      });

      const result = await authService.login({
        email: "test@example.com",
        password: "password123",
      });

      expect(result).toBeDefined();
      expect(result.accessToken).toBe("mock_jwt_token");
    });

    it("should return empty token for non-existent user", async () => {
      const { prisma } = await import("../src/prisma/client.js");

      (prisma.user.findUnique as ReturnType<typeof vi.fn>).mockResolvedValue(null);

      const result = await authService.login({
        email: "unknown@example.com",
        password: "password123",
      });

      expect(result.accessToken).toBe("");
    });

    it("should return empty token for invalid password", async () => {
      const { prisma } = await import("../src/prisma/client.js");
      const bcrypt = await import("bcrypt");

      (prisma.user.findUnique as ReturnType<typeof vi.fn>).mockResolvedValue({
        id: "user-123",
        passwordHash: "hashed_password",
      });

      (bcrypt.default.compare as ReturnType<typeof vi.fn>).mockResolvedValue(false);

      const result = await authService.login({
        email: "test@example.com",
        password: "wrongpassword",
      });

      expect(result.accessToken).toBe("");
    });
  });

  describe("updateProfile", () => {
    it("should update username successfully", async () => {
      const { prisma } = await import("../src/prisma/client.js");

      (prisma.user.update as ReturnType<typeof vi.fn>).mockResolvedValue({
        id: "user-123",
        username: "newname",
      });

      const result = await authService.updateProfile("user-123", {
        username: "newname",
      });

      expect(result).toBeDefined();
      expect(prisma.user.update).toHaveBeenCalledWith({
        where: { id: "user-123" },
        data: { username: "newname" },
        select: { id: true, email: true, username: true, createdAt: true },
      });
    });
  });

  describe("deleteAccount", () => {
    it("should delete account and related data", async () => {
      const { prisma } = await import("../src/prisma/client.js");

      // Mock transaction
      (prisma.$transaction as ReturnType<typeof vi.fn>).mockImplementation(
        async (callback) => {
          await callback(prisma);
        }
      );

      (prisma.serverMember.deleteMany as ReturnType<typeof vi.fn>).mockResolvedValue({});
      (prisma.message.deleteMany as ReturnType<typeof vi.fn>).mockResolvedValue({});
      (prisma.invite.deleteMany as ReturnType<typeof vi.fn>).mockResolvedValue({});
      (prisma.channel.deleteMany as ReturnType<typeof vi.fn>).mockResolvedValue({});
      (prisma.server.deleteMany as ReturnType<typeof vi.fn>).mockResolvedValue({});
      (prisma.user.delete as ReturnType<typeof vi.fn>).mockResolvedValue({});

      await authService.deleteAccount("user-123");

      expect(prisma.serverMember.deleteMany).toHaveBeenCalledWith({ where: { userId: "user-123" } });
      expect(prisma.message.deleteMany).toHaveBeenCalledWith({ where: { authorId: "user-123" } });
      expect(prisma.user.delete).toHaveBeenCalledWith({ where: { id: "user-123" } });
    });
  });

  describe("configuration", () => {
    it("should throw if JWT_SECRET is undefined", async () => {
      process.env.JWT_SECRET = ""; // Empty string looks falsy
      
      const { prisma } = await import("../src/prisma/client.js");
      (prisma.user.findUnique as ReturnType<typeof vi.fn>).mockResolvedValue({
        id: "user-123",
        passwordHash: "hashed_password",
      });

      await expect(authService.login({
        email: "test@example.com",
        password: "password123"
      })).rejects.toThrow("JWT_SECRET is not defined");
    });

    it("should parse JWT expiration correctly", async () => {
       const { prisma } = await import("../src/prisma/client.js");
       (prisma.user.findUnique as ReturnType<typeof vi.fn>).mockResolvedValue({
         id: "user-123",
         passwordHash: "hashed_password",
       });

       // Test 'h' unit
       process.env.JWT_SECRET = "secret";
       process.env.JWT_EXPIRES_IN = "2h";
       await authService.login({ email: "t", password: "p" });
       
       // Test 'm' unit 
       process.env.JWT_EXPIRES_IN = "30m";
       await authService.login({ email: "t", password: "p" });

       // Test 's' unit
       process.env.JWT_EXPIRES_IN = "60s";
       await authService.login({ email: "t", password: "p" });

       // Test numeric only
       process.env.JWT_EXPIRES_IN = "120";
       await authService.login({ email: "t", password: "p" });

       // Test invalid
       process.env.JWT_EXPIRES_IN = "invalid";
       await authService.login({ email: "t", password: "p" });
    });
  });
});
