import { useState } from "react";
import { getMyUserIdFromToken } from "@/lib/utils/token";

export function useCurrentUserId(): string | null {
  const [myUserId] = useState<string | null>(() => {
    if (typeof window === "undefined") return null;
    const token = localStorage.getItem("token");
    return getMyUserIdFromToken(token);
  });
  return myUserId;
}
