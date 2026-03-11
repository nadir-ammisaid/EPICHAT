"use client";

import { usePathname } from "next/navigation";
import { useEffect, useState,useMemo } from "react";
import parseDashboardPath from "@/lib/utils/parseDashboardPath";
import { apiClient } from "@/lib/api/client";
import getInitials from "@/lib/utils/getInitials";
import { getSocket } from "@/lib/socket/socket";
import { useRouter } from "next/navigation";
import { openConversation } from "@/lib/api/dm";


type ServerMember = {
  userId: string;
  role: string;
  user: { id: string; username: string; email?: string; status?: string };
};

type PresenceUpdate = {
  serverId: string;
  userId: string;
  status: string;
};

const STATUS_COLORS: Record<string, string> = {
  online: "bg-green-500",
  away: "bg-yellow-500",
  busy: "bg-red-500",
  offline: "bg-gray-400",
};

export default function MemberSection() {
  const pathname = usePathname();
  const { serverId } = parseDashboardPath(pathname ?? "");
  const [members, setMembers] = useState<ServerMember[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [onlineStatus, setOnlineStatus] = useState<Record<string, string>>({});

  const router = useRouter();
const myUserId = useMemo(() => {
  try {
    const token = localStorage.getItem("token");
    if (!token) return null;
    return JSON.parse(atob(token.split(".")[1])).userId ?? null;
  } catch { return null; }
}, []);

  async function handleOpenDm(targetUserId: string) {
    try {
      const conv = await openConversation(targetUserId);
      router.push(`/dashboard/dm/${conv.id}`);
    } catch { }
  }


  useEffect(() => {
    if (!serverId) return;
    apiClient
      .request(`/servers/${serverId}/members`)
      .then((data: ServerMember[]) => {
        setError(null);
        const list = Array.isArray(data) ? data : [];
        setMembers(list);
        const statusMap: Record<string, string> = {};
        for (const m of list) {
          statusMap[m.userId] = m.user?.status ?? "offline";
        }
        setOnlineStatus(statusMap);
      })
      .catch((err: Error) => {
        setError(err.message ?? "Impossible de charger les membres");
        setMembers([]);
      });
  }, [serverId]);

  useEffect(() => {
    if (!serverId) return;

    const socket = getSocket();
    socket.emit("server:join", serverId);

    const onPresenceInit = (payload: { serverId: string; presenceMap: Record<string, string> }) => {
      if (payload.serverId !== serverId) return;
      setOnlineStatus((prev) => ({ ...prev, ...payload.presenceMap }));
    };

    const onPresenceUpdate = (payload: PresenceUpdate) => {
      if (payload.serverId !== serverId) return;
      setOnlineStatus((prev) => ({
        ...prev,
        [payload.userId]: payload.status,
      }));
    };

    socket.on("presence:init", onPresenceInit);
    socket.on("presence:update", onPresenceUpdate);

    return () => {
      socket.off("presence:init", onPresenceInit);
      socket.off("presence:update", onPresenceUpdate);
      socket.emit("server:leave", serverId);
    };
  }, [serverId]);

  const roleLabel: Record<string, string> = {
    owner: "Proprietaire",
    admin: "Admin",
    member: "Membre",
  };

  const sortedMembers = [...members].sort((a, b) => {
    const statusA = onlineStatus[a.userId] ?? "offline";
    const statusB = onlineStatus[b.userId] ?? "offline";
    const order = ["online", "away", "busy", "offline"];
    return order.indexOf(statusA) - order.indexOf(statusB);
  });

  return (
    <div className="flex min-w-60 max-w-[280px] shrink-0 flex-col overflow-auto border-l border-border bg-background md:min-w-60 md:max-w-[280px]">
      <h2 className="h3 shrink-0 border-b border-border px-3 py-2">Membres</h2>
      <div className="min-h-0 flex-1 overflow-auto p-2">
        {!serverId && (
          <p className="px-2 py-4 text-sm text-muted-foreground">
            Selectionnez un canal pour voir les membres du serveur.
          </p>
        )}
        {serverId && error && (
          <p className="px-2 py-4 text-sm text-error">{error}</p>
        )}
        {serverId && !error && members.length === 0 && (
          <p className="px-2 py-4 text-sm text-muted-foreground">Aucun membre.</p>
        )}
        {serverId && !error && members.length > 0 && (
          <ul className="space-y-1">
            {sortedMembers.map((m) => {
              const status = onlineStatus[m.userId] ?? "offline";
              return (
                <li
                  key={m.userId}
                  className={`group relative flex items-center gap-2 rounded-md px-2 py-1.5 text-sm hover:bg-muted/60 ${m.userId !== myUserId ? "cursor-pointer" : ""
                    }`}
                  onClick={() => { if (m.userId !== myUserId) handleOpenDm(m.userId); }}
                >

                  <span className="relative flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-brand-muted/80 text-xs font-semibold text-foreground">
                    {getInitials(m.user?.username) ?? "?"}
                    <span
                      className={`absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full border-2 border-background ${STATUS_COLORS[status] ?? STATUS_COLORS.offline}`}
                      title={status}
                    />
                  </span>
                  <span className="min-w-0 flex-1 truncate font-medium text-foreground">
                    {m.user?.username ?? "Utilisateur"}
                  </span>
                  {m.role && (
                    <span
                      className="shrink-0 rounded px-1.5 py-0.5 text-xs text-muted-foreground"
                      title={m.role}
                    >
                      {roleLabel[m.role] ?? m.role}
                    </span>
                  )}
                  {m.userId !== myUserId && (
                    <button
                      type="button"
                      onClick={(e) => { e.stopPropagation(); handleOpenDm(m.userId); }}
                      className="absolute right-2 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity z-10 rounded bg-brand px-2 py-1 text-xs text-white whitespace-nowrap"
                    >
                      Envoyer un message
                    </button>
                  )}

                </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
}
