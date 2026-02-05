"use client";

import { useState, useRef, useEffect, KeyboardEvent as ReactKeyboardEvent } from "react";
import { Smile, Send } from "lucide-react";
import { EmojiPicker } from "./EmojiPicker";

type MessageInputProps = {
  onSendMessage: (content: string) => void;
  onTypingStart?: () => void;
  onTypingStop?: () => void;
  placeholder?: string;
  disabled?: boolean;
};

export function MessageInput({
  onSendMessage,
  onTypingStart,
  onTypingStop,
  placeholder = "Type a message...",
  disabled = false,
}: MessageInputProps) {
  const [message, setMessage] = useState("");
  const [isEmojiPickerOpen, setIsEmojiPickerOpen] = useState(false);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Auto-resize textarea
  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.style.height = "auto";
      inputRef.current.style.height = `${Math.min(inputRef.current.scrollHeight, 120)}px`;
    }
  }, [message]);

  // Handle typing indicators
  const handleTyping = () => {
    if (onTypingStart) {
      onTypingStart();
    }

    // Clear existing timeout
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    // Set new timeout to stop typing
    typingTimeoutRef.current = setTimeout(() => {
      if (onTypingStop) {
        onTypingStop();
      }
    }, 2000);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setMessage(e.target.value);
    handleTyping();
  };

  const handleSend = () => {
    const trimmedMessage = message.trim();
    if (!trimmedMessage || disabled) return;

    onSendMessage(trimmedMessage);
    setMessage("");

    // Stop typing indicator
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }
    if (onTypingStop) {
      onTypingStop();
    }

    // Focus back to input
    inputRef.current?.focus();
  };

  const handleKeyDown = (e: ReactKeyboardEvent<HTMLTextAreaElement>) => {
    // Send on Enter (without Shift)
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleEmojiSelect = (emoji: string) => {
    const textarea = inputRef.current;
    if (textarea) {
      const start = textarea.selectionStart;
      const end = textarea.selectionEnd;
      const newMessage = message.slice(0, start) + emoji + message.slice(end);
      setMessage(newMessage);

      // Move cursor after emoji
      setTimeout(() => {
        textarea.selectionStart = textarea.selectionEnd = start + emoji.length;
        textarea.focus();
      }, 0);
    } else {
      setMessage((prev) => prev + emoji);
    }
    handleTyping();
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
    };
  }, []);

  return (
    <div className="relative flex items-end gap-2 p-3 border-t border-border bg-background">
      {/* Emoji picker toggle */}
      <div className="relative">
        <button
          type="button"
          onClick={() => setIsEmojiPickerOpen(!isEmojiPickerOpen)}
          disabled={disabled}
          className="p-2 text-muted-foreground hover:text-foreground hover:bg-muted rounded-md transition-colors disabled:opacity-50"
          aria-label="Open emoji picker"
        >
          <Smile className="w-5 h-5" />
        </button>

        <EmojiPicker
          isOpen={isEmojiPickerOpen}
          onClose={() => setIsEmojiPickerOpen(false)}
          onEmojiSelect={handleEmojiSelect}
        />
      </div>

      {/* Message input */}
      <textarea
        ref={inputRef}
        value={message}
        onChange={handleInputChange}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        disabled={disabled}
        rows={1}
        className="flex-1 px-3 py-2 text-sm bg-muted border border-border rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-primary disabled:opacity-50"
        style={{ maxHeight: "120px" }}
      />

      {/* Send button */}
      <button
        type="button"
        onClick={handleSend}
        disabled={disabled || !message.trim()}
        className="p-2 text-primary-foreground bg-primary hover:bg-primary/90 rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        aria-label="Send message"
      >
        <Send className="w-5 h-5" />
      </button>
    </div>
  );
}

export default MessageInput;
