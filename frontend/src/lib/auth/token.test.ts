import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  clearStoredToken,
  getStoredToken,
  hasStoredToken,
  parseTokenPayload,
  setStoredToken,
} from "./token";

function toBase64Url(value: string): string {
  return btoa(value).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
}

function createToken(payload: Record<string, unknown>): string {
  const header = toBase64Url(JSON.stringify({ alg: "HS256", typ: "JWT" }));
  const body = toBase64Url(JSON.stringify(payload));
  return `${header}.${body}.signature`;
}

describe("token helpers", () => {
  const originalWindow = globalThis.window;

  beforeEach(() => {
    localStorage.clear();
    vi.useRealTimers();
    Object.defineProperty(globalThis, "window", {
      value: originalWindow,
      configurable: true,
    });
  });

  describe("parseTokenPayload", () => {
    it("returns payload when token is valid", () => {
      const token = createToken({ exp: 1234567890 });
      expect(parseTokenPayload(token)).toEqual({ exp: 1234567890 });
    });

    it("returns null when payload part is missing", () => {
      expect(parseTokenPayload("header")).toBeNull();
    });

    it("returns null when payload is malformed", () => {
      expect(parseTokenPayload("header.invalid-json.signature")).toBeNull();
    });
  });

  describe("getStoredToken / hasStoredToken", () => {
    it("returns null when no token is stored", () => {
      expect(getStoredToken()).toBeNull();
      expect(hasStoredToken()).toBe(false);
    });

    it("removes token and returns null when exp is missing", () => {
      const token = createToken({ sub: "user-1" });
      localStorage.setItem("token", token);

      expect(getStoredToken()).toBeNull();
      expect(localStorage.getItem("token")).toBeNull();
      expect(hasStoredToken()).toBe(false);
    });

    it("removes token and returns null when token is expired", () => {
      vi.setSystemTime(new Date("2026-03-15T18:00:00.000Z"));
      const expiredSeconds = Math.floor(Date.now() / 1000) - 10;
      const token = createToken({ exp: expiredSeconds });
      localStorage.setItem("token", token);

      expect(getStoredToken()).toBeNull();
      expect(localStorage.getItem("token")).toBeNull();
    });

    it("returns token when it is still valid", () => {
      vi.setSystemTime(new Date("2026-03-15T18:00:00.000Z"));
      const validSeconds = Math.floor(Date.now() / 1000) + 3600;
      const token = createToken({ exp: validSeconds });
      localStorage.setItem("token", token);

      expect(getStoredToken()).toBe(token);
      expect(hasStoredToken()).toBe(true);
    });
  });

  describe("setStoredToken / clearStoredToken", () => {
    it("stores and clears token", () => {
      const token = createToken({ exp: Math.floor(Date.now() / 1000) + 3600 });

      setStoredToken(token);
      expect(localStorage.getItem("token")).toBe(token);

      clearStoredToken();
      expect(localStorage.getItem("token")).toBeNull();
    });

    it("returns safely when window is unavailable", () => {
      Object.defineProperty(globalThis, "window", {
        value: undefined,
        configurable: true,
      });

      expect(getStoredToken()).toBeNull();
      expect(() => setStoredToken("abc")).not.toThrow();
      expect(() => clearStoredToken()).not.toThrow();
    });
  });
});
