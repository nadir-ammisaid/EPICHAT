"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import { getSocket } from "@/lib/socket/socket";
import { Trash2, Pencil, Check, X, Smile } from "lucide-react";
import { EmojiPicker } from "@/components/ui/EmojiPicker";
import {
  getConversations,
  getConversationMessages,
  sendDmMessage,
  deleteDmMessage,
  updateDmMessage,
} from "@/lib/api/dm";
import type { DirectMessage } from "@/lib/types/dm";

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

export default function DmSection() {
  const pathname = usePathname();

  // The conversation ID is the 3rd segment of /dashboard/dm/<conversationId>
  const conversationId = pathname?.split("/").filter(Boolean)[2] ?? null;

  const [messages, setMessages] = useState<DirectMessage[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [text, setText] = useState("");
  const [sending, setSending] = useState(false);
  const [typingUsers, setTypingUsers] = useState<string[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editText, setEditText] = useState("");
  const [isEmojiPickerOpen, setIsEmojiPickerOpen] = useState(false);
  const [myUserId, setMyUserId] = useState<string | null>(null);
  const [userMap, setUserMap] = useState<Map<string, string>>(new Map());


  const inputRef = useRef<HTMLInputElement | null>(null);
  const scrollRef = useRef<HTMLDivElement | null>(null);
  const bottomRef = useRef<HTMLDivElement | null>(null);
  const isNearBottomRef = useRef(true);
  const typingStopTimer = useRef<number | null>(null);

  // Retrieve the userId from the token
  useEffect(() => {
    const token = localStorage.getItem("token");
    setMyUserId(getMyUserIdFromToken(token));
  }, []);

  useEffect(() => {
    if (!conversationId) return;
    getConversations()
      .then((convs) => {
        const conv = convs.find((c) => c.id === conversationId);
        if (!conv) return;
        const map = new Map<string, string>();
        map.set(conv.participant1.id, conv.participant1.username);
        map.set(conv.participant2.id, conv.participant2.username);
        setUserMap(map);
      })
      .catch(() => { });
  }, [conversationId]);

  // Handle automatic scrolling
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
  }, [conversationId]);

  useEffect(() => {
    isNearBottomRef.current = true;
    bottomRef.current?.scrollIntoView({ behavior: "auto" });
  }, [conversationId]);

  useEffect(() => {
    if (!isNearBottomRef.current) return;
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages.length]);

  // Initial message loading (REST)
  useEffect(() => {
    if (!conversationId) return;

    async function load() {
      setLoading(true);
      setError(null);
      setMessages([]);
      try {
        const data = await getConversationMessages(conversationId!);
        setMessages(data.messages);
      } catch (e) {
        if (e instanceof Error) setError(e.message);
      } finally {
        setLoading(false);
      }
    }

    load();
  }, [conversationId]);

  // Join the conversation Socket.IO room
  useEffect(() => {
    if (!conversationId) return;
    const socket = getSocket();

    const onConnect = () => {
      socket.emit("dm:join", conversationId);
    };

    socket.on("connect", onConnect);
    if (socket.connected) onConnect();

    return () => {
      socket.emit("dm:leave", conversationId);
      socket.off("connect", onConnect);
    };
  }, [conversationId]);

  // Listen for DM Socket.IO events
  useEffect(() => {
    if (!conversationId) return;
    const socket = getSocket();

    const onMessageNew = (message: DirectMessage) => {
      if (message.conversationId !== conversationId) return;
      setMessages((prev) => {
        if (prev.some((m) => m.id === message.id)) return prev;
        return [...prev, message];
      });
    };

    const onMessageDeleted = (payload: { id: string; conversationId: string }) => {
      if (payload.conversationId !== conversationId) return;
      setMessages((prev) =>
        prev.map((m) =>
          m.id === payload.id ? { ...m, content: "", deletedAt: new Date().toISOString() } : m
        )
      );
    };

    const onMessageUpdated = (message: DirectMessage) => {
      if (message.conversationId !== conversationId) return;
      setMessages((prev) =>
        prev.map((m) => (m.id === message.id ? { ...m, ...message } : m))
      );
    };

    const onTypingUpdate = (payload: { conversationId: string; userIds: string[] }) => {
      if (payload.conversationId !== conversationId) return;
      setTypingUsers(payload.userIds ?? []);
    };

    socket.on("dm:message:new", onMessageNew);
    socket.on("dm:message:deleted", onMessageDeleted);
    socket.on("dm:message:updated", onMessageUpdated);
    socket.on("dm:typing:update", onTypingUpdate);

    return () => {
      socket.off("dm:message:new", onMessageNew);
      socket.off("dm:message:deleted", onMessageDeleted);
      socket.off("dm:message:updated", onMessageUpdated);
      socket.off("dm:typing:update", onTypingUpdate);
    };
  }, [conversationId]);

  // Typing indicator
  function handleTypingChange(nextValue: string) {
    setText(nextValue);
    if (!conversationId || !myUserId) return;
    const socket = getSocket();
    socket.emit("dm:typing:start", { conversationId });
    if (typingStopTimer.current) window.clearTimeout(typingStopTimer.current);
    typingStopTimer.current = window.setTimeout(() => {
      socket.emit("dm:typing:stop", { conversationId });
    }, 500);
  }

  // Send a message
  async function handleSend() {
    if (!conversationId || !text.trim()) return;
    setSending(true);
    setError(null);
    try {
      await sendDmMessage(conversationId, text.trim());
      setText("");
      if (myUserId) {
        const socket = getSocket();
        socket.emit("dm:typing:stop", { conversationId });
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Send error");
    } finally {
      setSending(false);
    }
  }

  // Delete a message
  async function handleDelete(messageId: string) {
    setError(null);
    try {
      await deleteDmMessage(messageId);
      setMessages((prev) =>
        prev.map((m) =>
          m.id === messageId ? { ...m, content: "", deletedAt: new Date().toISOString() } : m
        )
      );
    } catch (e) {
      setError(e instanceof Error ? e.message : "Delete error");
    }
  }

  // Edit a message
  async function handleEdit(messageId: string) {
    if (!editText.trim()) return;
    setError(null);
    try {
      const updated = await updateDmMessage(messageId, editText.trim());
      setMessages((prev) =>
        prev.map((m) => (m.id === messageId ? { ...m, ...updated } : m))
      );
      setEditingId(null);
      setEditText("");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Edit error");
    }
  }

const typingText = useMemo(() => {
  const others = myUserId ? typingUsers.filter((u) => u !== myUserId) : typingUsers;
  if (!others.length) return null;
  const names = others.map((id) => userMap.get(id) ?? id);
  return `${names.join(", ")} est en train d'écrire…`;
}, [typingUsers, myUserId, userMap]);



  if (!conversationId) {
    return (
      <div className="flex min-h-0 flex-1 flex-col border border-border bg-background">
        <div className="flex-1 overflow-y-auto p-4">
          <p className="text-sm text-muted-foreground">
            Selectionnez une conversation pour commencer à chatter.
          </p>
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
          const canAct = !!myUserId && m.authorId === myUserId && !m.deletedAt;
          const isEditing = editingId === m.id;
          const wasEdited = m.updatedAt && m.updatedAt !== m.createdAt && !m.deletedAt;

          return (
            <div key={m.id} className="group mb-2 flex items-start gap-1 px-1 py-1 hover:bg-muted/40">
              <div className="w-12 shrink-0 flex justify-start gap-0.5">
                {canAct && !isEditing ? (
                  <button
                    type="button"
                    className="mt-0.5 opacity-0 group-hover:opacity-100 transition-opacity p-0.5 rounded hover:bg-background/70"
                    onClick={() => { setEditingId(m.id); setEditText(m.content); }}
                  >
                    <Pencil className="h-4 w-4 opacity-70 hover:opacity-100" />
                  </button>
                ) : (
                  <span className="mt-0.5 invisible p-0.5"><Pencil className="h-4 w-4" /></span>
                )}
                {canAct && !isEditing ? (
                  <button
                    type="button"
                    className="mt-0.5 opacity-0 group-hover:opacity-100 transition-opacity p-0.5 rounded hover:bg-background/70"
                    onClick={() => handleDelete(m.id)}
                  >
                    <Trash2 className="h-4 w-4 opacity-70 hover:opacity-100" />
                  </button>
                ) : (
                  <span className="mt-0.5 invisible p-0.5"><Trash2 className="h-4 w-4" /></span>
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
                        if (e.key === "Escape") { setEditingId(null); setEditText(""); }
                      }}
                      autoFocus
                    />
                    <button type="button" className="p-1 rounded hover:bg-muted" onClick={() => handleEdit(m.id)}>
                      <Check className="h-4 w-4 text-green-500" />
                    </button>
                    <button type="button" className="p-1 rounded hover:bg-muted" onClick={() => { setEditingId(null); setEditText(""); }}>
                      <X className="h-4 w-4 text-red-500" />
                    </button>
                  </div>
                ) : (
                  <div className="text-sm leading-5">
                    {m.deletedAt ? <i className="opacity-60">(deleted)</i> : m.content}
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
        <div className="flex gap-2 items-center">
          <div className="relative">
            <button
              type="button"
              onClick={() => setIsEmojiPickerOpen(!isEmojiPickerOpen)}
              className="p-2 text-muted-foreground hover:text-foreground hover:bg-muted rounded-md transition-colors"
            >
              <Smile className="w-5 h-5" />
            </button>
            <EmojiPicker
              isOpen={isEmojiPickerOpen}
              onClose={() => setIsEmojiPickerOpen(false)}
              onEmojiSelect={(emoji) => {
                setText((prev) => prev + emoji);
                setIsEmojiPickerOpen(false);
                inputRef.current?.focus();
              }}
            />
          </div>
          <input
            ref={inputRef}
            className="flex-1 rounded border border-border bg-background px-3 py-2 text-sm"
            placeholder="Write a message…"
            value={text}
            onChange={(e) => handleTypingChange(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter") handleSend(); }}
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