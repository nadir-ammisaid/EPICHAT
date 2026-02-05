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
    },
  },
}));

describe("auth.service", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Set JWT_SECRET for tests
    process.env.JWT_SECRET = "test_secret";
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
});
