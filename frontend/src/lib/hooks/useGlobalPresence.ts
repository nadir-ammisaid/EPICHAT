import { useEffect } from "react";
import { getSocket, globalPresenceMap, presenceSubscribers } from "@/lib/socket/socket";

export function subscribeToPresence(callback: (statusMap: Map<string, string>) => void) {
  presenceSubscribers.add(callback);
  // Envoyer la map actuelle immédiatement
  callback(new Map(globalPresenceMap));
  return () => presenceSubscribers.delete(callback);
}

export function getPresenceMap() {
  return new Map(globalPresenceMap);
}

export function useInitializeGlobalPresence() {
  useEffect(() => {
    // Just ensure socket is initialized (which sets up listeners)
    getSocket();
  }, []);
}
