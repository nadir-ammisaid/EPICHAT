import { beforeEach, describe, expect, it, vi } from "vitest";
import { login, signup } from "@/lib/api/auth";

function jsonResponse(payload: unknown, ok = true): Response {
  return {
    ok,
    json: vi.fn().mockResolvedValue(payload),
  } as unknown as Response;
}

describe("auth api", () => {
  const fetchMock = vi.spyOn(global, "fetch");
  const originalApiUrl = process.env.NEXT_PUBLIC_API_URL;

  beforeEach(() => {
    fetchMock.mockReset();
    process.env.NEXT_PUBLIC_API_URL = originalApiUrl;
  });

  it("uses the default api url when NEXT_PUBLIC_API_URL is not set", async () => {
    delete process.env.NEXT_PUBLIC_API_URL;
    fetchMock.mockResolvedValueOnce(jsonResponse({ accessToken: "token" }));

    const token = await login("john@doe.com", "password123");

    expect(token).toBe("token");
    expect(fetchMock).toHaveBeenCalledWith(
      "http://localhost:3001/auth/login",
      expect.objectContaining({ method: "POST" }),
    );
  });

  it("uses NEXT_PUBLIC_API_URL for signup", async () => {
    process.env.NEXT_PUBLIC_API_URL = "https://api.example.test";
    fetchMock.mockResolvedValueOnce(jsonResponse({}));

    await signup("john@doe.com", "john", "password123");

    expect(fetchMock).toHaveBeenCalledWith(
      "https://api.example.test/auth/signup",
      expect.objectContaining({ method: "POST" }),
    );
  });
});
