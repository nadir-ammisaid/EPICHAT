"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { MessageSquareMore } from "lucide-react";
import { getConversations, openConversation } from "@/lib/api/dm";
import { apiClient } from "@/lib/api/client";
import { subscribeToPresence } from "@/lib/hooks/useGlobalPresence";
import getInitials from "@/lib/utils/getInitials";

function statusColor(status: string) {
  if (status === "online") return "bg-green-500";
  if (status === "away") return "bg-yellow-500";
  if (status === "busy") return "bg-red-500";
  return "bg-gray-400";
}

function getMyUserId(): string | null {
  try {
    const token = localStorage.getItem("token");
    if (!token) return null;
    const payload = JSON.parse(atob(token.split(".")[1]));
    return payload.userId ?? null;
  } catch {
    return null;
  }
}

type ContactUser = {
  userId: string;
  username: string;
  status: string;
  conversationId: string | null;
};

type Server = { id: string };
type Member = { userId: string; user: { id: string; username: string; status?: string } };

export default function DmBar() {
  const pathname = usePathname();
  const router = useRouter();
  const [contacts, setContacts] = useState<ContactUser[]>([]);

  const activeConversationId = pathname?.split("/").filter(Boolean)[2] ?? null;

  useEffect(() => {
    const uid = getMyUserId();
    if (!uid) return;

    async function load() {
      try {
        const [servers, conversations] = await Promise.all([
          apiClient.request("/servers") as Promise<Server[]>,
          getConversations(),
        ]);

        const memberLists = await Promise.all(
          (Array.isArray(servers) ? servers : []).map((s) =>
            apiClient.request(`/servers/${s.id}/members`) as Promise<Member[]>
          )
        );

        // userId → conversationId
        const convMap = new Map<string, string>();
        for (const conv of conversations) {
          const otherId = conv.participant1Id === uid ? conv.participant2Id : conv.participant1Id;
          convMap.set(otherId, conv.id);
        }

        // Dédupliquer, exclure soi-même
        const seen = new Set<string>();
        const result: ContactUser[] = [];
        for (const list of memberLists) {
          for (const m of (Array.isArray(list) ? list : [])) {
            if (m.userId === uid || seen.has(m.userId)) continue;
            seen.add(m.userId);
            result.push({
              userId: m.userId,
              username: m.user?.username ?? m.userId,
              status: m.user?.status ?? "offline",
              conversationId: convMap.get(m.userId) ?? null,
            });
          }
        }

        // Ceux avec conversation en premier, puis alphabétique
        result.sort((a, b) => {
          if (a.conversationId && !b.conversationId) return -1;
          if (!a.conversationId && b.conversationId) return 1;
          return a.username.localeCompare(b.username);
        });

        setContacts(result);
      } catch {
        setContacts([]);
      }
    }

    load();
  }, []);

  // S'inscrire aux mises à jour de présence globale
  useEffect(() => {
    const unsubscribe = subscribeToPresence((globalMap) => {
      // Mettre à jour les statuts basés sur la map globale
      setContacts((prev) =>
        prev.map((contact) => ({
          ...contact,
          status: globalMap.get(contact.userId) ?? "offline",
        }))
      );
    });

    return unsubscribe;
  }, []);

  async function handleClick(contact: ContactUser) {
    if (contact.conversationId) {
      router.push(`/dashboard/dm/${contact.conversationId}`);
    } else {
      try {
        const conv = await openConversation(contact.userId);
        router.push(`/dashboard/dm/${conv.id}`);
      } catch {}
    }
  }

  return (
    <aside className="flex h-full shrink-0 flex-col border-r border-border bg-[#F3F7FB] md:min-w-64 md:max-w-65">
      <div className="flex items-center gap-2 border-b border-border px-4 py-3">
        <MessageSquareMore className="h-4 w-4 text-brand" />
        <span className="text-sm font-semibold">Messages privés</span>
      </div>

      <div className="flex flex-col gap-1 overflow-y-auto p-2">
        {contacts.length === 0 && (
          <p className="px-2 py-4 text-center text-xs text-muted-foreground">
            Rejoignez un serveur pour voir vos contacts.
          </p>
        )}

        {contacts.map((contact) => {
          const isActive = contact.conversationId === activeConversationId;
          return (
            <button
              key={contact.userId}
              type="button"
              onClick={() => handleClick(contact)}
              className={`flex w-full items-center gap-3 rounded-lg px-3 py-2 text-left transition-colors hover:bg-brand-muted/30 ${
                isActive ? "bg-brand-muted font-medium" : ""
              }`}
            >
              <span className="relative flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-brand-muted/80 text-xs font-semibold text-foreground">
                {getInitials(contact.username) ?? "?"}
                <span
                  className={`absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full border-2 border-background ${statusColor(contact.status)}`}
                />
              </span>
              <span className="truncate text-sm">{contact.username}</span>
            </button>
          );
        })}
      </div>
    </aside>
  );
}
