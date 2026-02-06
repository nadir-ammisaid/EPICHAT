"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import parseDashboardPath from "@/lib/utils/parseDashboardPath";
import { getSocket } from "@/lib/socket/socket";
import { SOCKET_EVENTS } from "@/lib/socket/socket.events";
import { Trash2, Pencil, Check, X } from "lucide-react";


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

type Member = {
  id: string;
  username: string;
};

function formatDate(iso: string) {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleString();
}

function renderContent(content: string) {
  const mentionRegex = /@(\w+)/g;
  const parts: (string | React.ReactNode)[] = [];
  let lastIndex = 0;
  let match;

  while ((match = mentionRegex.exec(content)) !== null) {
    if (match.index > lastIndex) {
      parts.push(content.slice(lastIndex, match.index));
    }
    parts.push(
      <span key={match.index} className="text-brand font-medium">
        {match[0]}
      </span>
    );
    lastIndex = match.index + match[0].length;
  }

  if (lastIndex < content.length) {
    parts.push(content.slice(lastIndex));
  }

  return parts.length > 0 ? parts : content;
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
  const { channelId, serverId } = parseDashboardPath(pathname ?? "");

  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [text, setText] = useState("");
  const [sending, setSending] = useState(false);

  const [typingUsers, setTypingUsers] = useState<string[]>([]);
  const [usernamesById, setUsernamesById] = useState<Record<string, string>>({});

  const [editingId, setEditingId] = useState<string | null>(null);
  const [editText, setEditText] = useState("");

  const [members, setMembers] = useState<Member[]>([]);
  const [showMentions, setShowMentions] = useState(false);
  const [mentionFilter, setMentionFilter] = useState("");
  const [mentionIndex, setMentionIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement | null>(null);

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

  useEffect(() => {
    if (!serverId) return;

    async function fetchMembers() {
      try {
        const token = localStorage.getItem("token");
        const res = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL}/servers/${serverId}/members`,
          {
            headers: {
              ...(token ? { Authorization: `Bearer ${token}` } : {}),
            },
          },
        );
        if (res.ok) {
          const data = await res.json();
          const list = data?.members ?? data ?? [];
          setMembers(
            list.map((m: { user?: { id: string; username: string }; userId?: string; username?: string }) => ({
              id: m.user?.id ?? m.userId,
              username: m.user?.username ?? m.username,
            })),
          );
        }
      } catch {}
    }

    fetchMembers();
  }, [serverId]);

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
          `${process.env.NEXT_PUBLIC_API_URL}/channels/${channelId}/messages?limit=50`,
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
      } catch (e: unknown) {
        if (e instanceof Error && e.name !== "AbortError") {
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

    const onMessageUpdated = (message: Message) => {
      if (message.channelId !== channelId) return;
      setMessages((prev) =>
        prev.map((m) => (m.id === message.id ? { ...m, ...message } : m)),
      );
    };

    socket.on(SOCKET_EVENTS.MESSAGE_NEW, onMessageNew);
    socket.on(SOCKET_EVENTS.MESSAGE_DELETED, onMessageDeleted);
    socket.on(SOCKET_EVENTS.TYPING_UPDATE, onTypingUpdate);
    socket.on("message:updated", onMessageUpdated);

    return () => {
      socket.off(SOCKET_EVENTS.MESSAGE_NEW, onMessageNew);
      socket.off(SOCKET_EVENTS.MESSAGE_DELETED, onMessageDeleted);
      socket.off(SOCKET_EVENTS.TYPING_UPDATE, onTypingUpdate);
      socket.off("message:updated", onMessageUpdated);
    };
  }, [channelId]);


  function handleTypingChange(nextValue: string) {
    setText(nextValue);

    const atMatch = nextValue.match(/@(\w*)$/);
    if (atMatch) {
      setShowMentions(true);
      setMentionFilter(atMatch[1].toLowerCase());
      setMentionIndex(0);
    } else {
      setShowMentions(false);
      setMentionFilter("");
    }

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

  const filteredMembers = useMemo(() => {
    if (!mentionFilter) return members;
    return members.filter((m) =>
      m.username?.toLowerCase().includes(mentionFilter),
    );
  }, [members, mentionFilter]);

  function insertMention(username: string) {
    const newText = text.replace(/@\w*$/, `@${username} `);
    setText(newText);
    setShowMentions(false);
    setMentionFilter("");
    inputRef.current?.focus();
  }
async function handleDelete(messageId: string) {
  if (!messageId) return;

  setError(null);

  try {
    const token = localStorage.getItem("token");

    const res = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/messages/${messageId}`,
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


  } catch (e: unknown) {
    setError(e instanceof Error ? e.message : "Failed to delete message");
  }
}

async function handleEdit(messageId: string) {
  if (!messageId || !editText.trim()) return;

  setError(null);

  try {
    const token = localStorage.getItem("token");

    const res = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/messages/${messageId}`,
      {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ content: editText.trim() }),
      },
    );

    if (!res.ok) {
      const t = await res.text();
      throw new Error(`${res.status} ${res.statusText} - ${t}`);
    }

    const updated = await res.json();
    setMessages((prev) =>
      prev.map((m) => (m.id === messageId ? { ...m, ...updated } : m)),
    );
    setEditingId(null);
    setEditText("");
  } catch (e: unknown) {
    setError(e instanceof Error ? e.message : "Failed to edit message");
  }
}

function startEditing(message: Message) {
  setEditingId(message.id);
  setEditText(message.content);
}

function cancelEditing() {
  setEditingId(null);
  setEditText("");
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
        `${process.env.NEXT_PUBLIC_API_URL}/channels/${channelId}/messages`,
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
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Failed to send message");
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
  const canEdit = !!myUserId && m.authorId === myUserId && !m.deletedAt;
  const isEditing = editingId === m.id;
  const wasEdited = m.updatedAt !== m.createdAt && !m.deletedAt;

  return (
    <div
      key={m.id}
      className="group mb-2 flex items-start gap-1 px-1 py-1 hover:bg-muted/40"
    >
      <div className="w-12 shrink-0 flex justify-start gap-0.5">
        {canEdit && !isEditing ? (
          <button
            type="button"
            className="mt-0.5 opacity-0 group-hover:opacity-100 transition-opacity p-0.5 rounded hover:bg-background/70"
            title="Edit message"
            onClick={() => startEditing(m)}
          >
            <Pencil className="h-4 w-4 opacity-70 hover:opacity-100" />
          </button>
        ) : (
          <span className="mt-0.5 invisible p-0.5">
            <Pencil className="h-4 w-4" />
          </span>
        )}
        {canDelete && !isEditing ? (
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
          {wasEdited && <span className="italic">(edited)</span>}
        </div>

        {isEditing ? (
          <div className="flex gap-2 items-center mt-1">
            <input
              className="flex-1 rounded border border-border bg-background px-2 py-1 text-sm"
              value={editText}
              onChange={(e) => setEditText(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") handleEdit(m.id);
                if (e.key === "Escape") cancelEditing();
              }}
              autoFocus
            />
            <button
              type="button"
              className="p-1 rounded hover:bg-muted"
              title="Save"
              onClick={() => handleEdit(m.id)}
            >
              <Check className="h-4 w-4 text-green-500" />
            </button>
            <button
              type="button"
              className="p-1 rounded hover:bg-muted"
              title="Cancel"
              onClick={cancelEditing}
            >
              <X className="h-4 w-4 text-red-500" />
            </button>
          </div>
        ) : (
          <div className="text-sm leading-5">
            {m.deletedAt ? <i className="opacity-60">(deleted)</i> : renderContent(m.content)}
          </div>
        )}
      </div>
    </div>
  );
})}


        <div ref={bottomRef} />
      </div>


      <div className="px-4 pb-2 text-xs opacity-70 h-5">{typingText ?? ""}</div>


      <div className="border-t border-border p-3">
        <div className="relative">
          {showMentions && filteredMembers.length > 0 && (
            <div className="absolute bottom-full left-0 mb-1 w-48 rounded border border-border bg-background shadow-lg max-h-40 overflow-y-auto">
              {filteredMembers.slice(0, 8).map((member, idx) => (
                <button
                  key={member.id}
                  type="button"
                  className={`w-full px-3 py-2 text-left text-sm hover:bg-muted ${
                    idx === mentionIndex ? "bg-brand/20 text-brand font-medium" : ""
                  }`}
                  onMouseDown={(e) => {
                    e.preventDefault();
                    insertMention(member.username);
                  }}
                >
                  @{member.username}
                </button>
              ))}
            </div>
          )}
          <div className="flex gap-2">
            <input
              ref={inputRef}
              className="flex-1 rounded border border-border bg-background px-3 py-2 text-sm"
              placeholder="Écrire un message..."
              value={text}
              onChange={(e) => handleTypingChange(e.target.value)}
              onKeyDown={(e) => {
                if (showMentions && filteredMembers.length > 0) {
                  if (e.key === "ArrowDown") {
                    e.preventDefault();
                    setMentionIndex((prev) =>
                      prev < Math.min(filteredMembers.length - 1, 7) ? prev + 1 : 0,
                    );
                    return;
                  }
                  if (e.key === "ArrowUp") {
                    e.preventDefault();
                    setMentionIndex((prev) =>
                      prev > 0 ? prev - 1 : Math.min(filteredMembers.length - 1, 7),
                    );
                    return;
                  }
                  if (e.key === "Enter" || e.key === "Tab") {
                    e.preventDefault();
                    insertMention(filteredMembers[mentionIndex].username);
                    return;
                  }
                  if (e.key === "Escape") {
                    setShowMentions(false);
                    return;
                  }
                }
                if (e.key === "Enter") handleSend();
              }}
              disabled={sending}
            />
            <button
              className="rounded bg-brand px-3 py-2 text-sm text-white disabled:opacity-50"
              onClick={handleSend}
              disabled={sending || !text.trim()}
            >
              Envoyer
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
