import { useEffect, useState } from "react";
import { getMyUserIdFromToken } from "@/lib/utils/token";

export function useCurrentUserId(): string | null {
  const [myUserId, setMyUserId] = useState<string | null>(null);

  useEffect(() => {
    const token = localStorage.getItem("token");
    setMyUserId(getMyUserIdFromToken(token));
  }, []);

  return myUserId;
}
