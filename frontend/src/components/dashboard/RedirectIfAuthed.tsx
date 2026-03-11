"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { getStoredToken } from "@/lib/auth/token";

export default function RedirectIfAuthed() {
  const router = useRouter();

  useEffect(() => {
    const token = getStoredToken();
    if (token) router.replace("/dashboard");
  }, [router]);

  return null;
}