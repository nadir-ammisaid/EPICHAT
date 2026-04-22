import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import NotificationBell from "@/components/ui/NotificationBell";
import {
  NotificationsProvider,
  useNotifications,
} from "@/lib/notifications/NotificationsProvider";
import { getSocket } from "@/lib/socket/socket";
import { getNotificationPreferences } from "@/lib/notifications/preferences";
import { showNotification } from "@/lib/notifications/native";
import { apiClient } from "@/lib/api/client";
import { getConversations, getConversationMessages } from "@/lib/api/dm";
import { getChannelDetails } from "@/lib/api/channels";
import { getServerDetails } from "@/lib/api/servers";
import { routerPushMock } from "@/test/mocks/nextNavigation";

const mockPathname = vi.hoisted(() => ({ value: "" }));

vi.mock("next/navigation", () => ({
  usePathname: () => mockPathname.value,
  useRouter: () => ({
    push: routerPushMock,
  }),
}));

vi.mock("@/lib/socket/socket", () => ({
  getSocket: vi.fn(),
}));

vi.mock("@/lib/notifications/preferences", () => ({
  getNotificationPreferences: vi.fn(),
}));

vi.mock("@/lib/notifications/native", () => ({
  showNotification: vi.fn(),
}));

vi.mock("@/lib/api/client", () => ({
  apiClient: {
    request: vi.fn(),
  },
}));

vi.mock("@/lib/api/dm", () => ({
  getConversations: vi.fn(),
  getConversationMessages: vi.fn(),
}));

vi.mock("@/lib/api/channels", () => ({
  getChannelDetails: vi.fn(),
}));

vi.mock("@/lib/api/servers", () => ({
  getServerDetails: vi.fn(),
}));

class FakeSocket {
  connected = false;
  id = "socket-test-id";
  auth: Record<string, unknown> = {};
  emit = vi.fn();

  private handlers = new Map<string, Set<(payload?: unknown) => void>>();

  on(event: string, cb: (payload?: unknown) => void) {
    const set = this.handlers.get(event) ?? new Set();
    set.add(cb);
    this.handlers.set(event, set);
    return this;
  }

  off(event: string, cb?: (payload?: unknown) => void) {
    if (!cb) {
      this.handlers.delete(event);
      return this;
    }
    const set = this.handlers.get(event);
    if (!set) return this;
    set.delete(cb);
    if (set.size === 0) this.handlers.delete(event);
    return this;
  }

  trigger(event: string, payload?: unknown) {
    const set = this.handlers.get(event);
    if (!set) return;
    for (const cb of set) cb(payload);
  }
}

describe("NotificationsProvider mention flow", () => {
  let socket: FakeSocket;
  let prefs = {
    enabled: true,
    dm: true,
    mentions: true,
    systemJoins: true,
  };

  beforeEach(() => {
    mockPathname.value = "";
    socket = new FakeSocket();
    prefs = {
      enabled: true,
      dm: true,
      mentions: true,
      systemJoins: true,
    };

    vi.mocked(getSocket).mockReturnValue(socket as unknown as ReturnType<typeof getSocket>);

    vi.mocked(getNotificationPreferences).mockImplementation(() => prefs);

    vi.mocked(apiClient.request).mockImplementation(async (endpoint: string) => {
      if (endpoint === "/me") return { id: "u-me", username: "alice" };
      if (endpoint === "/servers") return [];
      throw new Error(`Unexpected endpoint: ${endpoint}`);
    });

    vi.mocked(getConversations).mockResolvedValue([]);
    vi.mocked(getConversationMessages).mockResolvedValue({
      messages: [],
      nextCursor: null,
    });

    vi.mocked(getChannelDetails).mockResolvedValue({
      id: "ch-1",
      name: "general",
      serverId: "srv-1",
    });

    vi.mocked(getServerDetails).mockResolvedValue({
      id: "srv-1",
      name: "Test Server",
      ownerId: "u-owner",
    });
  });

  it("creates unread notification for @Tous mention from another user", async () => {
    const user = userEvent.setup();

    render(
      <NotificationsProvider>
        <NotificationBell />
      </NotificationsProvider>,
    );

    socket.trigger("message:new", {
      id: "msg-1",
      channelId: "ch-1",
      authorId: "u-bob",
      content: "Salut @Tous",
      author: { id: "u-bob", username: "Bob" },
    });

    await waitFor(() => {
      expect(
        screen.getByRole("button", { name: "Notifications non lues" }),
      ).toBeInTheDocument();
    });

    await user.click(screen.getByRole("button", { name: "Notifications non lues" }));

    expect(screen.getByText("Nouvelle mention dans Test Server")).toBeInTheDocument();
    expect(screen.getByText("Bob: Salut @Tous")).toBeInTheDocument();

    expect(showNotification).toHaveBeenCalledWith("Tu as été mentionné", {
      body: "Bob: Salut @Tous",
      tag: "mention-ch-1-msg-1",
    });
  });

  it("creates unread notification for @username mention from another user", async () => {
    const user = userEvent.setup();

    render(
      <NotificationsProvider>
        <NotificationBell />
      </NotificationsProvider>,
    );

    socket.trigger("message:new", {
      id: "msg-2",
      channelId: "ch-1",
      authorId: "u-bob",
      content: "Hello @alice",
      author: { id: "u-bob", username: "Bob" },
    });

    await waitFor(() => {
      expect(
        screen.getByRole("button", { name: "Notifications non lues" }),
      ).toBeInTheDocument();
    });

    await user.click(screen.getByRole("button", { name: "Notifications non lues" }));

    expect(screen.getByText("Nouvelle mention dans Test Server")).toBeInTheDocument();
    expect(screen.getByText("Bob: Hello @alice")).toBeInTheDocument();
  });

  it("does not create unread notification when message has no mention", async () => {
    const user = userEvent.setup();

    render(
      <NotificationsProvider>
        <NotificationBell />
      </NotificationsProvider>,
    );

    socket.trigger("message:new", {
      id: "msg-3",
      channelId: "ch-1",
      authorId: "u-bob",
      content: "Hello team",
      author: { id: "u-bob", username: "Bob" },
    });

    await waitFor(() => {
      expect(screen.getByRole("button", { name: "Notifications" })).toBeInTheDocument();
    });

    await user.click(screen.getByRole("button", { name: "Notifications" }));

    expect(screen.getByText("Aucune notification récente")).toBeInTheDocument();
    expect(showNotification).not.toHaveBeenCalled();
  });

  it("skips native mention notifications when preferences are disabled", async () => {
    const user = userEvent.setup();
    prefs.enabled = false;

    render(
      <NotificationsProvider>
        <NotificationBell />
      </NotificationsProvider>,
    );

    socket.trigger("message:new", {
      id: "msg-disabled",
      channelId: "ch-1",
      authorId: "u-bob",
      content: "Ping @alice",
      author: { id: "u-bob", username: "Bob" },
    });

    await waitFor(() => {
      expect(
        screen.getByRole("button", { name: "Notifications non lues" }),
      ).toBeInTheDocument();
    });

    await user.click(screen.getByRole("button", { name: "Notifications non lues" }));
    expect(screen.getByText("Nouvelle mention dans Test Server")).toBeInTheDocument();
    expect(showNotification).not.toHaveBeenCalled();
  });

  it("skips native notifications for the current channel", async () => {
    const user = userEvent.setup();
    mockPathname.value = "/dashboard/srv-1/ch-1";

    render(
      <NotificationsProvider>
        <NotificationBell />
      </NotificationsProvider>,
    );

    socket.trigger("message:new", {
      id: "msg-current-channel",
      channelId: "ch-1",
      authorId: "u-bob",
      content: "Hello @alice",
      author: { id: "u-bob", username: "Bob" },
    });

    await waitFor(() => {
      expect(
        screen.getByRole("button", { name: "Notifications non lues" }),
      ).toBeInTheDocument();
    });

    await user.click(screen.getByRole("button", { name: "Notifications non lues" }));
    expect(screen.getByText("Nouvelle mention dans Test Server")).toBeInTheDocument();
    expect(showNotification).not.toHaveBeenCalled();
  });

  it("uses fallback mention title when channel details lookup fails", async () => {
    const user = userEvent.setup();
    vi.mocked(getChannelDetails).mockRejectedValueOnce(new Error("boom"));

    render(
      <NotificationsProvider>
        <NotificationBell />
      </NotificationsProvider>,
    );

    socket.trigger("message:new", {
      id: "msg-fallback",
      channelId: "ch-unknown",
      authorId: "u-bob",
      content: "Ping @alice",
      author: { id: "u-bob", username: "Bob" },
    });

    await waitFor(() => {
      expect(
        screen.getByRole("button", { name: "Notifications non lues" }),
      ).toBeInTheDocument();
    });

    await user.click(screen.getByRole("button", { name: "Notifications non lues" }));
    expect(screen.getByText("Nouvelle mention")).toBeInTheDocument();
  });

  it("uses the channel name when no server details are available", async () => {
    const user = userEvent.setup();
    vi.mocked(getChannelDetails).mockResolvedValueOnce({
      id: "ch-1",
      name: "general",
      serverId: "",
    });

    render(
      <NotificationsProvider>
        <NotificationBell />
      </NotificationsProvider>,
    );

    socket.trigger("message:new", {
      id: "msg-channel-name",
      channelId: "ch-1",
      authorId: "u-bob",
      content: "Ping @alice",
      author: { id: "u-bob", username: "Bob" },
    });

    await waitFor(() => {
      expect(
        screen.getByRole("button", { name: "Notifications non lues" }),
      ).toBeInTheDocument();
    });

    await user.click(screen.getByRole("button", { name: "Notifications non lues" }));
    expect(screen.getByText("Nouvelle mention dans #general")).toBeInTheDocument();
    expect(getServerDetails).not.toHaveBeenCalled();
  });

  it("falls back to the channel name when server details fail", async () => {
    const user = userEvent.setup();
    vi.mocked(getServerDetails).mockRejectedValueOnce(new Error("boom"));

    render(
      <NotificationsProvider>
        <NotificationBell />
      </NotificationsProvider>,
    );

    socket.trigger("message:new", {
      id: "msg-server-fallback",
      channelId: "ch-1",
      authorId: "u-bob",
      content: "Ping @alice",
      author: { id: "u-bob", username: "Bob" },
    });

    await waitFor(() => {
      expect(
        screen.getByRole("button", { name: "Notifications non lues" }),
      ).toBeInTheDocument();
    });

    await user.click(screen.getByRole("button", { name: "Notifications non lues" }));
    expect(screen.getByText("Nouvelle mention dans #general")).toBeInTheDocument();
  });

  it("removes clicked notification and navigates when href exists", async () => {
    const user = userEvent.setup();

    render(
      <NotificationsProvider>
        <NotificationBell />
      </NotificationsProvider>,
    );

    socket.trigger("message:new", {
      id: "msg-click",
      channelId: "ch-1",
      authorId: "u-bob",
      content: "Hi @alice",
      author: { id: "u-bob", username: "Bob" },
    });

    await waitFor(() => {
      expect(
        screen.getByRole("button", { name: "Notifications non lues" }),
      ).toBeInTheDocument();
    });

    await user.click(screen.getByRole("button", { name: "Notifications non lues" }));
    await user.click(screen.getByRole("menuitem", { name: /Nouvelle mention dans Test Server/i }));

    expect(routerPushMock).toHaveBeenCalledWith("/dashboard/srv-1/ch-1");

    await user.click(screen.getByRole("button", { name: "Notifications" }));
    expect(screen.getByText("Aucune notification récente")).toBeInTheDocument();
  });

  it("clears all notifications from the bell", async () => {
    const user = userEvent.setup();

    render(
      <NotificationsProvider>
        <NotificationBell />
      </NotificationsProvider>,
    );

    socket.trigger("message:new", {
      id: "msg-clear-1",
      channelId: "ch-1",
      authorId: "u-bob",
      content: "one @alice",
      author: { id: "u-bob", username: "Bob" },
    });

    socket.trigger("message:new", {
      id: "msg-clear-2",
      channelId: "ch-1",
      authorId: "u-bob",
      content: "two @alice",
      author: { id: "u-bob", username: "Bob" },
    });

    await waitFor(() => {
      expect(
        screen.getByRole("button", { name: "Notifications non lues" }),
      ).toBeInTheDocument();
    });

    await user.click(screen.getByRole("button", { name: "Notifications non lues" }));
    await user.click(screen.getByRole("menuitem", { name: "Tout marquer comme lu" }));

    await user.click(screen.getByRole("button", { name: "Notifications" }));
    expect(screen.getByText("Aucune notification récente")).toBeInTheDocument();
  });

  it("creates DM notification and native alert for incoming DM", async () => {
    const user = userEvent.setup();

    render(
      <NotificationsProvider>
        <NotificationBell />
      </NotificationsProvider>,
    );

    socket.trigger("dm:message:new", {
      id: "dm-1",
      conversationId: "conv-1",
      authorId: "u-bob",
      content: "yo",
      author: { id: "u-bob", username: "Bob" },
    });

    await waitFor(() => {
      expect(
        screen.getByRole("button", { name: "Notifications non lues" }),
      ).toBeInTheDocument();
    });

    await user.click(screen.getByRole("button", { name: "Notifications non lues" }));
    expect(screen.getByText("Nouveau message de Bob")).toBeInTheDocument();

    expect(showNotification).toHaveBeenCalledWith("Nouveau DM de Bob", {
      body: "yo",
      tag: "dm-conv-1-dm-1",
    });
  });

  it("skips DM native alerts when DM notifications are disabled", async () => {
    const user = userEvent.setup();
    prefs.dm = false;

    render(
      <NotificationsProvider>
        <NotificationBell />
      </NotificationsProvider>,
    );

    await waitFor(() => {
      expect(apiClient.request).toHaveBeenCalledWith("/me");
    });

    socket.trigger("dm:message:new", {
      id: "dm-disabled",
      conversationId: "conv-1",
      authorId: "u-bob",
      content: "yo",
      author: { id: "u-bob", username: "Bob" },
    });

    await waitFor(() => {
      expect(
        screen.getByRole("button", { name: "Notifications non lues" }),
      ).toBeInTheDocument();
    });

    await user.click(screen.getByRole("button", { name: "Notifications non lues" }));
    expect(screen.getByText("Nouveau message de Bob")).toBeInTheDocument();
    expect(showNotification).not.toHaveBeenCalled();
  });

  it("skips notifications for the current dm conversation", async () => {
    mockPathname.value = "/dashboard/dm/conv-1";

    render(
      <NotificationsProvider>
        <NotificationBell />
      </NotificationsProvider>,
    );

    socket.trigger("dm:message:new", {
      id: "dm-current",
      conversationId: "conv-1",
      authorId: "u-bob",
      content: "yo",
      author: { id: "u-bob", username: "Bob" },
    });

    await waitFor(() => {
      expect(screen.getByRole("button", { name: "Notifications" })).toBeInTheDocument();
    });

    expect(showNotification).not.toHaveBeenCalled();
  });

  it("does not notify for own DM messages", async () => {
    render(
      <NotificationsProvider>
        <NotificationBell />
      </NotificationsProvider>,
    );

    await waitFor(() => {
      expect(apiClient.request).toHaveBeenCalledWith("/me");
    });

    socket.trigger("dm:message:new", {
      id: "dm-own",
      conversationId: "conv-1",
      authorId: "u-me",
      content: "mine",
      author: { id: "u-me", username: "alice" },
    });

    await waitFor(() => {
      expect(screen.getByRole("button", { name: "Notifications" })).toBeInTheDocument();
    });
    expect(showNotification).not.toHaveBeenCalled();
  });

  it("falls back cleanly when notified dm ids storage is invalid", async () => {
    vi.spyOn(Storage.prototype, "getItem").mockReturnValueOnce("not-json");

    render(
      <NotificationsProvider>
        <NotificationBell />
      </NotificationsProvider>,
    );

    await waitFor(() => {
      expect(apiClient.request).toHaveBeenCalledWith("/me");
    });
  });

  it("continues connecting even when the initial /me request fails", async () => {
    socket.connected = true;
    vi.mocked(apiClient.request).mockImplementation(async (endpoint: string) => {
      if (endpoint === "/me") throw new Error("boom");
      if (endpoint === "/servers") return [{ id: "srv-1" }];
      throw new Error(`Unexpected endpoint: ${endpoint}`);
    });
    vi.mocked(getConversations).mockResolvedValue([{ id: "conv-1" } as never]);

    render(
      <NotificationsProvider>
        <NotificationBell />
      </NotificationsProvider>,
    );

    await waitFor(() => {
      expect(socket.emit).toHaveBeenCalledWith("server:join", "srv-1");
      expect(socket.emit).toHaveBeenCalledWith("dm:join", "conv-1");
    });
  });

  it("handles ensureMeLoaded failures during dm notifications", async () => {
    prefs.dm = false;
    vi.mocked(apiClient.request).mockImplementation(async (endpoint: string) => {
      if (endpoint === "/me") throw new Error("boom");
      if (endpoint === "/servers") return [];
      throw new Error(`Unexpected endpoint: ${endpoint}`);
    });

    render(
      <NotificationsProvider>
        <NotificationBell />
      </NotificationsProvider>,
    );

    socket.trigger("dm:message:new", {
      id: "dm-ensure-error",
      conversationId: "conv-ensure",
      authorId: "u-bob",
      content: "yo",
      author: { id: "u-bob", username: "Bob" },
    });

    await waitFor(() => {
      expect(screen.getByRole("button", { name: "Notifications" })).toBeInTheDocument();
    });
    expect(apiClient.request).toHaveBeenCalledWith("/me");
  });

  it("joins server and dm rooms on connect", async () => {
    socket.connected = true;
    vi.mocked(apiClient.request).mockImplementation(async (endpoint: string) => {
      if (endpoint === "/me") return { id: "u-me", username: "alice" };
      if (endpoint === "/servers") return [{ id: "srv-1" }];
      throw new Error(`Unexpected endpoint: ${endpoint}`);
    });
    vi.mocked(getConversations).mockResolvedValue([{ id: "conv-1" } as never]);

    render(
      <NotificationsProvider>
        <NotificationBell />
      </NotificationsProvider>,
    );

    await waitFor(() => {
      expect(socket.emit).toHaveBeenCalledWith("server:join", "srv-1");
      expect(socket.emit).toHaveBeenCalledWith("dm:join", "conv-1");
    });
  });

  it("marks all notifications as read through the provider API", async () => {
    const user = userEvent.setup();

    function MarkAllReadConsumer() {
      const { markAllRead, hasUnread, notifications } = useNotifications();

      return (
        <div>
          <span>{hasUnread ? "unread" : "read"}</span>
          <span>{notifications.length}</span>
          <button type="button" onClick={markAllRead}>
            Mark all read
          </button>
        </div>
      );
    }

    render(
      <NotificationsProvider>
        <MarkAllReadConsumer />
      </NotificationsProvider>,
    );

    socket.trigger("message:new", {
      id: "msg-mark-all-read",
      channelId: "ch-1",
      authorId: "u-bob",
      content: "Ping @alice",
      author: { id: "u-bob", username: "Bob" },
    });

    await waitFor(() => {
      expect(screen.getByText("unread")).toBeInTheDocument();
    });

    await user.click(screen.getByRole("button", { name: "Mark all read" }));

    await waitFor(() => {
      expect(screen.getByText("read")).toBeInTheDocument();
      expect(screen.getByText("0")).toBeInTheDocument();
    });
  });

  it("keeps joining rooms when a dm catch-up fetch fails", async () => {
    socket.connected = true;
    vi.mocked(apiClient.request).mockImplementation(async (endpoint: string) => {
      if (endpoint === "/me") return { id: "u-me", username: "alice" };
      if (endpoint === "/servers") return [{ id: "srv-1" }];
      throw new Error(`Unexpected endpoint: ${endpoint}`);
    });
    vi.mocked(getConversations).mockResolvedValue([{ id: "conv-1" } as never]);
    vi.mocked(getConversationMessages).mockRejectedValueOnce(new Error("boom"));

    render(
      <NotificationsProvider>
        <NotificationBell />
      </NotificationsProvider>,
    );

    await waitFor(() => {
      expect(socket.emit).toHaveBeenCalledWith("server:join", "srv-1");
      expect(socket.emit).toHaveBeenCalledWith("dm:join", "conv-1");
    });
  });

  it("throws when useNotifications is used outside provider", () => {
    function BrokenConsumer() {
      useNotifications();
      return null;
    }

    expect(() => render(<BrokenConsumer />)).toThrow(
      "useNotifications must be used within NotificationsProvider",
    );
  });
});
