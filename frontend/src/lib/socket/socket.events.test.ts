import { describe, expect, it, vi, beforeEach } from "vitest";
import { onMessageDeleted, onMessageNew } from "@/lib/socket/socket.events";
import { getSocket } from "@/lib/socket/socket";

vi.mock("@/lib/socket/socket", () => ({
  getSocket: vi.fn(),
}));

describe("socket.events helpers", () => {
  const on = vi.fn();
  const off = vi.fn();

  beforeEach(() => {
    on.mockReset();
    off.mockReset();
    vi.mocked(getSocket).mockReturnValue({ on, off } as never);
  });

  it("subscribes and unsubscribes message:new", () => {
    const handler = vi.fn();
    const cleanup = onMessageNew(handler);

    expect(on).toHaveBeenCalledWith("message:new", handler);

    cleanup();
    expect(off).toHaveBeenCalledWith("message:new", handler);
  });

  it("subscribes and unsubscribes message:deleted", () => {
    const handler = vi.fn();
    const cleanup = onMessageDeleted(handler);

    expect(on).toHaveBeenCalledWith("message:deleted", handler);

    cleanup();
    expect(off).toHaveBeenCalledWith("message:deleted", handler);
  });
});
