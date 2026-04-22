"use client";

import { useRef, useState, useEffect } from "react";
import { flushSync } from "react-dom";
import { usePathname } from "next/navigation";
import { getSocket } from "@/lib/socket/socket";
import { MessageInputBar } from "@/components/messages/MessageInputBar";
import { MessageItem } from "@/components/messages/MessageItem";
import { sendDmMessage } from "@/lib/api/dm";
import { useCurrentUserId } from "@/lib/hooks/useCurrentUserId";
import { useScrollToBottom } from "@/lib/hooks/useScrollToBottom";
import { useDmMessages } from "@/lib/hooks/useDmMessages";
import { useTranslation } from "react-i18next";

export default function DmSection() {
  const pathname = usePathname();
  const conversationId = pathname?.split("/").filter(Boolean)[2] ?? null;
  const myUserId = useCurrentUserId();
  const { t } = useTranslation("dm");
  const [text, setText] = useState("");
  const [sending, setSending] = useState(false);
  const inputRef = useRef<HTMLInputElement | null>(null);
  const typingStopTimer = useRef<number | null>(null);
  const { messages, loading, error, editingId, editText, setEditText,
        handleDelete, handleEdit, handleToggleDmReaction, startEditing, cancelEditing, typingText }
    = useDmMessages(conversationId, myUserId);
  const { scrollRef, bottomRef } = useScrollToBottom(conversationId, messages.length);

useEffect(() => {
  inputRef.current?.focus();
}, [conversationId]);

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

  async function handleSend() {
    if (!conversationId || !text.trim()) return;
    setSending(true);
    try {
      await sendDmMessage(conversationId, { type: "text", content: text.trim() });
      setText("");
      if (myUserId) getSocket().emit("dm:typing:stop", { conversationId });
    } catch (e) {
      console.error(e instanceof Error ? e.message : "Send error");
    } finally {
      flushSync(() => setSending(false));
      inputRef.current?.focus();

    }
  }

  if (!conversationId) {
    return (
      <div className="flex min-h-0 flex-1 flex-col border border-border bg-background">
        <div className="flex-1 overflow-y-auto p-4">
          <p className="text-sm text-muted-foreground">
            {t("section.empty")}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col border border-border bg-background">
      <div ref={scrollRef} className="flex-1 overflow-y-auto p-4">
        {loading && <p className="text-sm">{t("loading")}</p>}
        {error && <p className="text-red-500 text-sm">{error}</p>}
        {messages.map((m) => (
          <MessageItem
            key={m.id}
            id={m.id}
            authorName={m.author?.username ?? m.authorId}
            content={m.content}
            createdAt={m.createdAt}
            updatedAt={m.updatedAt}
            deletedAt={m.deletedAt}
            type={m.type}
            mediaUrl={m.mediaUrl}
            canEdit={!!myUserId && m.authorId === myUserId && !m.deletedAt && m.type === "text"}
            canDelete={!!myUserId && m.authorId === myUserId && !m.deletedAt}
            isEditing={editingId === m.id}
            editText={editText}
            onEditStart={() => startEditing(m)}
            onEditCancel={cancelEditing}
            onEditConfirm={() => handleEdit(m.id)}
            onEditTextChange={setEditText}
            onDelete={() => handleDelete(m.id)}
            reactions={m.reactions}
            myUserId={myUserId ?? undefined}
            onToggleReaction={(emoji) => handleToggleDmReaction(m.id, emoji)}
          />
        ))}
        <div ref={bottomRef} />
      </div>

      <div className="px-4 pb-2 text-xs opacity-70 h-5">{typingText ?? ""}</div>

      <MessageInputBar
        value={text}
        onChange={handleTypingChange}
        onSend={handleSend}
        onSendGif={async (gif) => {
          await sendDmMessage(conversationId!, { type: "gif", mediaUrl: gif.gifUrl, content: gif.title });
        }}
        disabled={sending}
        placeholder={t("inputPlaceholder")}
        inputRef={inputRef}
      />
    </div>
  );
}
