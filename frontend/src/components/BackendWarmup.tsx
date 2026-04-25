"use client";

import { useEffect } from "react";

export function BackendWarmup() {
  useEffect(() => {
    const apiUrl = process.env.NEXT_PUBLIC_API_URL;

    if (!apiUrl) {
      return;
    }

    void fetch(`${apiUrl}/health`, {
      method: "GET",
      cache: "no-store",
    }).catch(() => {});
  }, []);

  return null;
}
