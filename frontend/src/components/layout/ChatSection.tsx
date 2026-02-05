"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import parseDashboardPath from "@/lib/utils/parseDashboardPath";
import { getSocket } from "@/lib/socket/socket";
import { SOCKET_EVENTS } from "@/lib/socket/socket.events";
import { Trash2 } from "lucide-react";


type Message = {
  id: string;
  channelId: string;
  authorId: string;
  content: string;
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
  author?: {
    username: string;
  };
};

function formatDate(iso: string) {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleString();
}

function getMyUserIdFromToken(token: string | null): string | null {
  if (!token) return null;
  try {
    const payloadPart = token.split(".")[1];
    if (!payloadPart) return null;

    const json = atob(payloadPart.replace(/-/g, "+").replace(/_/g, "/"));
    const payload = JSON.parse(json);

    return typeof payload?.userId === "string" ? payload.userId : null;
  } catch {
    return null;
  }
}

export default function ChatSection() {
  const pathname = usePathname();
  const { channelId } = parseDashboardPath(pathname ?? "");

  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [text, setText] = useState("");
  const [sending, setSending] = useState(false);

  const [typingUsers, setTypingUsers] = useState<string[]>([]);
  const [usernamesById, setUsernamesById] = useState<Record<string, string>>({});

  const typingStopTimer = useRef<number | null>(null);


  const scrollRef = useRef<HTMLDivElement | null>(null);
  const bottomRef = useRef<HTMLDivElement | null>(null);
  const isNearBottomRef = useRef(true);


  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;

    const onScroll = () => {
      const distanceFromBottom = el.scrollHeight - (el.scrollTop + el.clientHeight);
      isNearBottomRef.current = distanceFromBottom < 120; 
    };

    el.addEventListener("scroll", onScroll);
    onScroll();

    return () => el.removeEventListener("scroll", onScroll);
  }, [channelId]);


  useEffect(() => {
    isNearBottomRef.current = true;
    bottomRef.current?.scrollIntoView({ behavior: "auto" });
  }, [channelId]);


  useEffect(() => {
    if (!isNearBottomRef.current) return;
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages.length]);

 
  const [myUserId, setMyUserId] = useState<string | null>(null);

  useEffect(() => {
    const token = localStorage.getItem("token");
    setMyUserId(getMyUserIdFromToken(token));
  }, []);

  // Load initial messages (REST)
  useEffect(() => {
    if (!channelId) return;

    const controller = new AbortController();

    async function load() {
      setLoading(true);
      setError(null);

      try {
        const token = localStorage.getItem("token");

        const res = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL}/api/channels/${channelId}/messages?limit=50`,
          {
            method: "GET",
            headers: {
              "Content-Type": "application/json",
              ...(token ? { Authorization: `Bearer ${token}` } : {}),
            },
            signal: controller.signal,
          },
        );

        if (!res.ok) {
          const t = await res.text();
          throw new Error(`${res.status} ${res.statusText} - ${t}`);
        }

        const data = await res.json();
        const list = data?.result?.messages ?? data?.messages ?? [];
        setMessages(list);

        // build userId -> username map from fetched messages
        setUsernamesById((prev) => {
          const next = { ...prev };
          for (const m of list) {
            if (m?.authorId && m?.author?.username) {
              next[m.authorId] = m.author.username;
            }
          }
          return next;
        });
      } catch (e: any) {
        if (e.name !== "AbortError") {
          setError(e.message ?? "Failed to load messages");
        }
      } finally {
        setLoading(false);
      }
    }

    load();
    return () => controller.abort();
  }, [channelId]);

  //  Socket connect + join room after connect
  useEffect(() => {
    if (!channelId) return;

    const socket = getSocket();

    const onConnect = () => {
      socket.emit(SOCKET_EVENTS.CHANNEL_JOIN, channelId);
    };

    socket.on("connect", onConnect);

    // if already connected, join now
    if (socket.connected) onConnect();

    return () => {
      socket.emit(SOCKET_EVENTS.CHANNEL_LEAVE, channelId);
      socket.off("connect", onConnect);
    };
  }, [channelId]);

  // Socket listeners for realtime updates
  useEffect(() => {
    if (!channelId) return;

    const socket = getSocket();

    const onMessageNew = (message: Message) => {
      if (message.channelId !== channelId) return;

      // keep username map updated
      setUsernamesById((prev) => {
        if (message?.authorId && message?.author?.username) {
          if (prev[message.authorId] === message.author.username) return prev;
          return { ...prev, [message.authorId]: message.author.username };
        }
        return prev;
      });

      setMessages((prev) => {
        if (prev.some((m) => m.id === message.id)) return prev; // dedupe
        return [...prev, message];
      });
    };

    const onMessageDeleted = (payload: { id: string; channelId?: string }) => {
      if (payload.channelId && payload.channelId !== channelId) return;

      setMessages((prev) =>
        prev.map((m) =>
          m.id === payload.id
            ? { ...m, content: "", deletedAt: new Date().toISOString() }
            : m,
        ),
      );
    };

    const onTypingUpdate = (payload: { channelId: string; userIds: string[] }) => {
      if (payload.channelId !== channelId) return;
      setTypingUsers(payload.userIds ?? []);
    };

    socket.on(SOCKET_EVENTS.MESSAGE_NEW, onMessageNew);
    socket.on(SOCKET_EVENTS.MESSAGE_DELETED, onMessageDeleted);
    socket.on(SOCKET_EVENTS.TYPING_UPDATE, onTypingUpdate);

    return () => {
      socket.off(SOCKET_EVENTS.MESSAGE_NEW, onMessageNew);
      socket.off(SOCKET_EVENTS.MESSAGE_DELETED, onMessageDeleted);
      socket.off(SOCKET_EVENTS.TYPING_UPDATE, onTypingUpdate);
    };
  }, [channelId]);


  function handleTypingChange(nextValue: string) {
    setText(nextValue);

    if (!channelId) return;
    if (!myUserId) return;

    const socket = getSocket();

    socket.emit(SOCKET_EVENTS.TYPING_START, {
      channelId,
      userId: myUserId,
    });

    if (typingStopTimer.current) window.clearTimeout(typingStopTimer.current);
    typingStopTimer.current = window.setTimeout(() => {
      socket.emit(SOCKET_EVENTS.TYPING_STOP, {
        channelId,
        userId: myUserId,
      });
    }, 500);
  }
async function handleDelete(messageId: string) {
  if (!messageId) return;

  setError(null);

  try {
    const token = localStorage.getItem("token");

    const res = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/api/messages/${messageId}`,
      {
        method: "DELETE",
        headers: {
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
      },
    );

    if (!res.ok) {
      const t = await res.text();
      throw new Error(`${res.status} ${res.statusText} - ${t}`);
    }

    // soft delete
    setMessages((prev) =>
      prev.map((m) =>
        m.id === messageId
          ? { ...m, content: "", deletedAt: new Date().toISOString() }
          : m,
      ),
    );


  } catch (e: any) {
    setError(e.message ?? "Failed to delete message");
  }
}


  // Send message (REST)
  async function handleSend() {
    if (!channelId) return;

    const content = text.trim();
    if (!content) return;

    setSending(true);
    setError(null);

    try {
      const token = localStorage.getItem("token");

      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/channels/${channelId}/messages`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
          body: JSON.stringify({ content }),
        },
      );

      if (!res.ok) {
        const t = await res.text();
        throw new Error(`${res.status} ${res.statusText} - ${t}`);
      }


      setText("");

      if (myUserId) {
        const socket = getSocket();
        socket.emit(SOCKET_EVENTS.TYPING_STOP, { channelId, userId: myUserId });
      }
    } catch (e: any) {
      setError(e.message ?? "Failed to send message");
    } finally {
      setSending(false);
    }
  }

  const typingText = useMemo(() => {
    if (!typingUsers.length) return null;

    const others = myUserId ? typingUsers.filter((u) => u !== myUserId) : typingUsers;
    if (!others.length) return null;

    const names = others.map((id) => usernamesById[id] ?? id);

    if (names.length === 1) return `${names[0]} est en train de taper…`;
    return `${names.slice(0, 2).join(", ")} sont en train de taper…`;
  }, [typingUsers, myUserId, usernamesById]);

  if (!channelId) {
    return (
      <div className="flex min-h-0 flex-1 flex-col border border-border bg-background">
        <div className="flex-1 overflow-y-auto p-4">
          <p className="text-sm text-muted-foreground">Selectionnez un canal pour commencer à chatter.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col border border-border bg-background">

      <div ref={scrollRef} className="flex-1 overflow-y-auto p-4">
        {loading && <p className="text-sm">Loading…</p>}
        {error && <p className="text-red-500 text-sm">{error}</p>}

{messages.map((m) => {
  const canDelete = !!myUserId && m.authorId === myUserId && !m.deletedAt;

  return (
    <div
      key={m.id}
      className="group mb-2 flex items-start gap-1 px-1 py-1 hover:bg-muted/40"
    >

      <div className="w-6 shrink-0 flex justify-start">
        {canDelete ? (
          <button
            type="button"
            className="mt-0.5 opacity-0 group-hover:opacity-100 transition-opacity p-0.5 rounded hover:bg-background/70"
            title="Delete message"
            onClick={() => handleDelete(m.id)}
          >
            <Trash2 className="h-4 w-4 opacity-70 hover:opacity-100" />
          </button>
        ) : (

          <span className="mt-0.5 invisible p-0.5">
            <Trash2 className="h-4 w-4" />
          </span>
        )}
      </div>


      <div className="min-w-0 flex-1">
        <div className="text-[11px] opacity-60 flex gap-1">
          <span>{m.author?.username ?? m.authorId}</span>
          <span>-</span>
          <span>{formatDate(m.createdAt)}</span>
        </div>

        <div className="text-sm leading-5">
          {m.deletedAt ? <i className="opacity-60">(deleted)</i> : m.content}
        </div>
      </div>
    </div>
  );
})}


        <div ref={bottomRef} />
      </div>


      <div className="px-4 pb-2 text-xs opacity-70 h-5">{typingText ?? ""}</div>


      <div className="border-t border-border p-3">
        <div className="flex gap-2">
          <input
            className="flex-1 rounded border border-border bg-background px-3 py-2 text-sm"
            placeholder="Write a message…"
            value={text}
            onChange={(e) => handleTypingChange(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") handleSend();
            }}
            disabled={sending}
          />
          <button
            className="rounded bg-brand px-3 py-2 text-sm text-white disabled:opacity-50"
            onClick={handleSend}
            disabled={sending || !text.trim()}
          >
            Send
          </button>
        </div>
      </div>
    </div>
  );
}
