"use client";

import React, {
  createContext,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";
import { usePathname } from "next/navigation";
import parseDashboardPath from "@/lib/utils/parseDashboardPath";
import { getSocket } from "@/lib/socket/socket";
import {
  SOCKET_EVENTS,
  type MessagePayload,
  type DmMessagePayload,
} from "@/lib/socket/socket.events";
import { getNotificationPreferences } from "@/lib/notifications/preferences";
import { showNotification as showNativeNotification } from "@/lib/notifications/native";
import { apiClient } from "@/lib/api/client";
import { getConversations, getConversationMessages } from "@/lib/api/dm";
import { getChannelDetails } from "@/lib/api/channels";
import { getServerDetails } from "@/lib/api/servers";

const DEBUG_NOTIF = true;
const log = (...args: unknown[]) =>
  DEBUG_NOTIF && console.log("[Notifications]", ...args);

const MAX_BODY_LENGTH = 80;
const DM_NOTIFIED_IDS_STORAGE_KEY = "epichat:notifiedDmMessageIds";

function snippet(text: string): string {
  const t = text.replace(/\s+/g, " ").trim();
  return t.length <= MAX_BODY_LENGTH ? t : t.slice(0, MAX_BODY_LENGTH) + "…";
}

function isMention(content: string, username: string): boolean {
  if (/@Everybody\b/i.test(content)) return true;
  if (!username) return false;
  const regex = new RegExp(
    `@${username.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\b`,
    "i",
  );
  return regex.test(content);
}


type NotificationsContextValue = {
  hasUnread: boolean;
  markAllRead: () => void;
  notifications: NotificationItem[];
  clearAll: () => void;
  removeNotification: (id: string) => void;
};

const NotificationsContext = createContext<
  NotificationsContextValue | undefined
>(undefined);

type NotificationItem = {
  id: string;
  type: "channel" | "dm";
  title: string;
  body: string;
  href?: string;
  createdAt: string;
};

function readNotifiedDmIds(): Set<string> {
  if (typeof window === "undefined") return new Set();
  try {
    const raw = localStorage.getItem(DM_NOTIFIED_IDS_STORAGE_KEY);
    if (!raw) return new Set();
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return new Set();
    return new Set(parsed.filter((v) => typeof v === "string"));
  } catch {
    return new Set();
  }
}

function writeNotifiedDmIds(ids: Set<string>) {
  if (typeof window === "undefined") return;
  const arr = Array.from(ids).slice(-500);
  localStorage.setItem(DM_NOTIFIED_IDS_STORAGE_KEY, JSON.stringify(arr));
}

export function NotificationsProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [hasUnread, setHasUnread] = useState(false);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [myUsername, setMyUsername] = useState<string | null>(null);
  const [myUserId, setMyUserId] = useState<string | null>(null);
  const pathname = usePathname();
  const { serverId, channelId } = parseDashboardPath(pathname ?? "");

  const channelIdRef = useRef(channelId);
  const serverIdRef = useRef(serverId);
  const myUsernameRef = useRef(myUsername);
  const myUserIdRef = useRef(myUserId);
  const notifiedDmIdsRef = useRef<Set<string>>(new Set());

  useEffect(() => {
    channelIdRef.current = channelId;
    serverIdRef.current = serverId;
    myUsernameRef.current = myUsername;
    myUserIdRef.current = myUserId;
  }, [channelId, serverId, myUsername, myUserId]);

  log("Provider render", {
    pathname,
    serverId,
    channelId,
    myUsername,
    hasUnread,
  });

  useEffect(() => {
    notifiedDmIdsRef.current = readNotifiedDmIds();

    apiClient
      .request("/me")
      .then((data: { id?: string; username?: string }) => {
        setMyUsername(data?.username ?? null);
        setMyUserId(data?.id ?? null);
        log("GET /me", { id: data?.id ?? null, username: data?.username ?? null });
      })
      .catch((err) => log("GET /me error", err));
  }, []);

  useEffect(() => {
    const socket = getSocket();
    log("Socket ref", { connected: socket.connected, id: socket.id });
    const onConnect = () => {
      log("Socket connect", socket.id);
      apiClient
        .request("/servers")
        .then((servers: { id: string }[] | unknown) => {
          const list = Array.isArray(servers) ? servers : [];
          list.forEach((s) => socket.emit("server:join", s.id));
          log("server:join pour", list.length, "serveur(s)");
        })
        .catch(() => {});
      getConversations()
        .then(async (convs) => {
          convs.forEach((c) => socket.emit("dm:join", c.id));

          // Catch up missed DM notifications after reconnect/login.
          const userId = myUserIdRef.current;
          if (!userId) return;

          for (const conv of convs) {
            try {
              const { messages } = await getConversationMessages(conv.id, 1);
              const latest = messages[messages.length - 1];
              if (!latest) continue;
              if (latest.authorId === userId) continue;

              const alreadyNotified = notifiedDmIdsRef.current.has(latest.id);
              if (alreadyNotified) continue;

              const currentServerId = serverIdRef.current;
              const currentChannelId = channelIdRef.current;
              const isCurrentDm =
                currentServerId === "dm" && currentChannelId === conv.id;

              // Mark as seen for dedupe even if the user is already reading it.
              notifiedDmIdsRef.current.add(latest.id);
              writeNotifiedDmIds(notifiedDmIdsRef.current);

              if (isCurrentDm) continue;

              const authorName = latest.author?.username ?? "Quelqu'un";
              const body = snippet(latest.content || "");

              setHasUnread(true);
              setNotifications((prev) => {
                if (prev.some((n) => n.id === latest.id)) return prev;
                const next: NotificationItem = {
                  id: latest.id,
                  type: "dm",
                  title: `Nouveau message de ${authorName}`,
                  body,
                  href: `/dashboard/dm/${conv.id}`,
                  createdAt: new Date().toISOString(),
                };
                return [next, ...prev].slice(0, 20);
              });

              const prefs = getNotificationPreferences();
              if (prefs.enabled && prefs.dm) {
                showNativeNotification(`Nouveau DM de ${authorName}`, {
                  body,
                  tag: `dm-${conv.id}-${latest.id}`,
                });
              }
            } catch {
              // Ignore individual conversation fetch failures.
            }
          }
        })
        .catch(() => {});
    };
    socket.on("connect", onConnect);
    if (socket.connected) onConnect();
    return () => {
      socket.off("connect", onConnect);
    };
  }, []);

  useEffect(() => {
    const socket = getSocket();
    log("Listeners setup (once)");

    const onMessageNew = (message: MessagePayload) => {
      const currentChannelId = channelIdRef.current;
      const currentMyUsername = myUsernameRef.current;
      const isCurrentChannel =
        currentChannelId && message.channelId === currentChannelId;
      const prefs = getNotificationPreferences();

      log("message:new reçu", {
        messageChannelId: message.channelId,
        currentChannelId,
        isCurrentChannel,
        prefs,
        author: message.author?.username,
      });

      if (!isCurrentChannel) {
        const authorName = message.author?.username ?? "Quelqu'un";
        const body = snippet(message.content || "");
        const isMentionNotification =
          currentMyUsername &&
          isMention(message.content || "", currentMyUsername) &&
          prefs.mentions;

        // Pour les canaux, on ne badge + dropdown QUE pour les mentions
        if (isMentionNotification) {
          setHasUnread(true);
          log("→ setHasUnread(true) (mention)");

          (async () => {
            try {
              const channel = await getChannelDetails(message.channelId);
              const server = channel.serverId
                ? await getServerDetails(channel.serverId).catch(() => null)
                : null;

              const title = server
                ? `Nouvelle mention dans ${server.name}`
                : `Nouvelle mention dans #${channel.name}`;

              const href =
                channel.serverId && message.channelId
                  ? `/dashboard/${channel.serverId}/${message.channelId}`
                  : undefined;

              const next: NotificationItem = {
                id: message.id,
                type: "channel",
                title,
                body: `${authorName}: ${body}`,
                href,
                createdAt: new Date().toISOString(),
              };

              setNotifications((prev) => [next, ...prev].slice(0, 20));
            } catch (e) {
              log("Erreur lors de la récupération des infos canal/serveur", e);
              const fallback: NotificationItem = {
                id: message.id,
                type: "channel",
                title: "Nouvelle mention",
                body: `${authorName}: ${body}`,
                href: undefined,
                createdAt: new Date().toISOString(),
              };
              setNotifications((prev) => [fallback, ...prev].slice(0, 20));
            }
          })();
        }
      }

      if (!prefs.enabled || isCurrentChannel) {
        log(
          "→ pas de notif native",
          prefs.enabled ? "canal actuel" : "notifs désactivées",
        );
        return;
      }

      if (
        currentMyUsername &&
        isMention(message.content || "", currentMyUsername) &&
        prefs.mentions
      ) {
        const authorName = message.author?.username ?? "Quelqu'un";
        const body = snippet(message.content || "");
        log("→ notif mention", authorName);
        showNativeNotification("Tu as été mentionné", {
          body: `${authorName}: ${body}`,
          tag: `mention-${message.channelId}-${message.id}`,
        });
        return;
      }
    };

    const onDmMessageNew = (message: DmMessagePayload) => {
      const userId = myUserIdRef.current;
      const isOwnMessage = userId && message.authorId === userId;

      if (!isOwnMessage) {
        notifiedDmIdsRef.current.add(message.id);
        writeNotifiedDmIds(notifiedDmIdsRef.current);
      }

      const currentServerId = serverIdRef.current;
      const currentChannelId = channelIdRef.current;
      const isCurrentDm =
        currentServerId === "dm" && currentChannelId === message.conversationId;
      if (!isCurrentDm && !isOwnMessage) {
        setHasUnread(true);

        const authorName = message.author?.username ?? "Quelqu'un";
        const body = snippet(message.content || "");

        const next: NotificationItem = {
          id: message.id,
          type: "dm",
          title: `Nouveau message de ${authorName}`,
          body,
          href: `/dashboard/dm/${message.conversationId}`,
          createdAt: new Date().toISOString(),
        };

        setNotifications((prev) => [next, ...prev].slice(0, 20));
      }

      const prefs = getNotificationPreferences();
      if (!prefs.enabled || !prefs.dm || isCurrentDm || isOwnMessage) return;

      const authorName = message.author?.username ?? "Quelqu'un";
      showNativeNotification(`Nouveau DM de ${authorName}`, {
        body: snippet(message.content || ""),
        tag: `dm-${message.conversationId}-${message.id}`,
      });
    };

    socket.on(SOCKET_EVENTS.MESSAGE_NEW, onMessageNew);
    socket.on(SOCKET_EVENTS.DM_MESSAGE_NEW, onDmMessageNew);
    log("Socket events attachés: message:new, dm:message:new");

    return () => {
      socket.off(SOCKET_EVENTS.MESSAGE_NEW, onMessageNew);
      socket.off(SOCKET_EVENTS.DM_MESSAGE_NEW, onDmMessageNew);
      log("Socket events détachés");
    };
  }, []);

  const value: NotificationsContextValue = {
    hasUnread,
    markAllRead() {
      setHasUnread(false);
      setNotifications([]);
    },
    notifications,
    clearAll() {
      setHasUnread(false);
      setNotifications([]);
    },
    removeNotification(id) {
      setNotifications((prev) => {
        const next = prev.filter((n) => n.id !== id);
        setHasUnread(next.length > 0);
        return next;
      });
    },
  };

  return (
    <NotificationsContext.Provider value={value}>
      {children}
    </NotificationsContext.Provider>
  );
}

export function useNotifications() {
  const ctx = useContext(NotificationsContext);
  if (!ctx) {
    throw new Error(
      "useNotifications must be used within NotificationsProvider",
    );
  }
  return ctx;
}
