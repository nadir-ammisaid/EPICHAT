"use client";

import { MessageInput } from "@/components/ui";
import { useState } from "react";
import { useTranslation } from "react-i18next";

export default function TestEmojiPage() {
  const [messages, setMessages] = useState<string[]>([]);
  const { t } = useTranslation("common");

  const handleSend = (content: string) => {
    setMessages((prev) => [...prev, content]);
    console.log("Message sent:", content);
  };

  return (
    <div className="flex h-screen flex-col p-4">
      <h1 className="mb-4 text-2xl font-bold">{t("pages.testEmoji.title")}</h1>

      <div className="border-border mb-4 flex-1 overflow-y-auto rounded-lg border p-4">
        {messages.length === 0 ? (
          <p className="text-muted-foreground">{t("pages.testEmoji.empty")}</p>
        ) : (
          messages.map((msg, i) => (
            <div key={i} className="bg-muted mb-2 rounded-lg p-2">
              {msg}
            </div>
          ))
        )}
      </div>

      {/* Message input with emoji picker */}
      <MessageInput
        onSendMessage={handleSend}
        onTypingStart={() => console.log("Started typing...")}
        onTypingStop={() => console.log("Stopped typing...")}
        placeholder={t("pages.testEmoji.placeholder")}
      />
    </div>
  );
}
