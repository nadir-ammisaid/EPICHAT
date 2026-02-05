"use client";

import { MessageInput } from "@/components/ui";
import { useState } from "react";

export default function TestEmojiPage() {
  const [messages, setMessages] = useState<string[]>([]);

  const handleSend = (content: string) => {
    setMessages((prev) => [...prev, content]);
    console.log("Message sent:", content);
  };

  return (
    <div className="flex h-screen flex-col p-4">
      <h1 className="mb-4 text-2xl font-bold">Test Emoji Support</h1>

      {/* Messages list */}
      <div className="border-border mb-4 flex-1 overflow-y-auto rounded-lg border p-4">
        {messages.length === 0 ? (
          <p className="text-muted-foreground">Send a message with emojis...</p>
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
        placeholder="Type a message with emojis..."
      />
    </div>
  );
}
