import { useEffect, useMemo, useState } from "react";
import { getSocket } from "@/lib/socket/socket";
import { SOCKET_EVENTS } from "@/lib/socket/socket.events";
import type { Message, Reaction } from "@/lib/types/message";

export function useChannelMessages(channelId: string | null, myUserId: string | null) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [typingUsers, setTypingUsers] = useState<string[]>([]);
  const [usernamesById, setUsernamesById] = useState<Record<string, string>>({});
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editText, setEditText] = useState("");

  // REST fetch
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
            headers: { "Content-Type": "application/json", ...(token ? { Authorization: `Bearer ${token}` } : {}) },
            signal: controller.signal,
          },
        );
        if (!res.ok) { const t = await res.text(); throw new Error(`${res.status} ${res.statusText} - ${t}`); }
        const data = await res.json();
        const list = data?.result?.messages ?? data?.messages ?? [];
        setMessages(list);
        setUsernamesById((prev) => {
          const next = { ...prev };
          for (const m of list) {
            if (m?.authorId && m?.author?.username) next[m.authorId] = m.author.username;
          }
          return next;
        });
      } catch (e: unknown) {
        if (e instanceof Error && e.name !== "AbortError") setError(e.message ?? "Failed to load messages");
      } finally {
        setLoading(false);
      }
    }
    load();
    return () => controller.abort();
  }, [channelId]);

  // Socket join/leave
  useEffect(() => {
    if (!channelId) return;
    const socket = getSocket();
    const onConnect = () => { socket.emit(SOCKET_EVENTS.CHANNEL_JOIN, channelId); };
    socket.on("connect", onConnect);
    if (socket.connected) onConnect();
    return () => { socket.emit(SOCKET_EVENTS.CHANNEL_LEAVE, channelId); socket.off("connect", onConnect); };
  }, [channelId]);

  // Socket events
  useEffect(() => {
    if (!channelId) return;
    const socket = getSocket();

    const onMessageNew = (message: Message) => {
      if (message.channelId !== channelId) return;
      setUsernamesById((prev) => {
        if (message?.authorId && message?.author?.username) {
          if (prev[message.authorId] === message.author.username) return prev;
          return { ...prev, [message.authorId]: message.author.username };
        }
        return prev;
      });
      setMessages((prev) => { if (prev.some((m) => m.id === message.id)) return prev; return [...prev, message]; });
    };
    const onMessageDeleted = (payload: { id: string; channelId?: string }) => {
      if (payload.channelId && payload.channelId !== channelId) return;
      setMessages((prev) => prev.map((m) => m.id === payload.id ? { ...m, content: "", mediaUrl: null, deletedAt: new Date().toISOString() } : m));
    };
    const onTypingUpdate = (payload: { channelId: string; userIds: string[] }) => {
      if (payload.channelId !== channelId) return;
      setTypingUsers(payload.userIds ?? []);
    };
    const onMessageUpdated = (message: Message) => {
      if (message.channelId !== channelId) return;
      setMessages((prev) => prev.map((m) => (m.id === message.id ? { ...m, ...message } : m)));
    };

    socket.on(SOCKET_EVENTS.MESSAGE_NEW, onMessageNew);
    socket.on(SOCKET_EVENTS.MESSAGE_DELETED, onMessageDeleted);
    socket.on(SOCKET_EVENTS.TYPING_UPDATE, onTypingUpdate);
    socket.on("message:updated", onMessageUpdated);
    const onReactionUpdate = (payload: { messageId: string; reactions: Reaction[] }) => {
      setMessages((prev) =>
        prev.map((m) => m.id === payload.messageId ? { ...m, reactions: payload.reactions } : m)
      );
    };
    socket.on("message:reaction", onReactionUpdate);

    return () => {
      socket.off(SOCKET_EVENTS.MESSAGE_NEW, onMessageNew);
      socket.off(SOCKET_EVENTS.MESSAGE_DELETED, onMessageDeleted);
      socket.off(SOCKET_EVENTS.TYPING_UPDATE, onTypingUpdate);
      socket.off("message:updated", onMessageUpdated);
      socket.off("message:reaction", onReactionUpdate);

    };
  }, [channelId]);

  async function handleDelete(messageId: string) {
    if (!messageId) return;
    setError(null);
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/messages/${messageId}`, {
        method: "DELETE",
        headers: { ...(token ? { Authorization: `Bearer ${token}` } : {}) },
      });
      if (!res.ok) { const t = await res.text(); throw new Error(`${res.status} ${res.statusText} - ${t}`); }
      setMessages((prev) => prev.map((m) => m.id === messageId ? { ...m, content: "", mediaUrl: null, deletedAt: new Date().toISOString() } : m));
    } catch (e: unknown) { setError(e instanceof Error ? e.message : "Failed to delete message"); }
  }

  async function handleEdit(messageId: string) {
    if (!messageId || !editText.trim()) return;
    setError(null);
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/messages/${messageId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json", ...(token ? { Authorization: `Bearer ${token}` } : {}) },
        body: JSON.stringify({ content: editText.trim() }),
      });
      if (!res.ok) { const t = await res.text(); throw new Error(`${res.status} ${res.statusText} - ${t}`); }
      const updated = await res.json();
      setMessages((prev) => prev.map((m) => (m.id === messageId ? { ...m, ...updated } : m)));
      setEditingId(null);
      setEditText("");
    } catch (e: unknown) { setError(e instanceof Error ? e.message : "Failed to edit message"); }
  }
  async function handleToggleReaction(messageId: string, emoji: string) {
    const token = localStorage.getItem("token");
    await fetch(`${process.env.NEXT_PUBLIC_API_URL}/messages/${messageId}/reactions`, {
      method: "POST",
      headers: { "Content-Type": "application/json", ...(token ? { Authorization: `Bearer ${token}` } : {}) },
      body: JSON.stringify({ emoji }),
    });
  }

  function startEditing(message: Message) { setEditingId(message.id); setEditText(message.content); }
  function cancelEditing() { setEditingId(null); setEditText(""); }

  const typingText = useMemo(() => {
    if (!typingUsers.length) return null;
    const others = myUserId ? typingUsers.filter((u) => u !== myUserId) : typingUsers;
    if (!others.length) return null;
    const names = others.map((id) => usernamesById[id] ?? id);
    if (names.length === 1) return `${names[0]} est en train d'écrire…`;
    return `${names.slice(0, 2).join(", ")} sont en train d'écrire…`;
  }, [typingUsers, myUserId, usernamesById]);

  return { messages, loading, error, editingId, editText, setEditText, handleDelete, handleEdit, handleToggleReaction, startEditing, cancelEditing, typingText };

}
