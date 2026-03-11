"use client";

import { useState } from "react";

export function useToast() {
  const [message, setMessage] = useState<string | null>(null);

  function toast({ title }: { title: string }) {
    setMessage(title);
    setTimeout(() => setMessage(null), 2500);
  }

  function ToastContainer() {
    if (!message) return null;

    return (
      <div className="fixed bottom-4 right-4 rounded-md bg-neutral-800 px-4 py-2 text-white shadow-lg">
        {message}
      </div>
    );
  }

  return { toast, ToastContainer };
}
