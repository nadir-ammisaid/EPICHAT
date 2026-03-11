"use client";

import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import parseDashboardPath from "@/lib/utils/parseDashboardPath";
import { apiClient } from "@/lib/api/client";
import getInitials from "@/lib/utils/getInitials";
import { getSocket } from "@/lib/socket/socket";

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

    const joinServer = () => {
      socket.emit("server:join", serverId);
    };
    joinServer();
    socket.on("connect", joinServer);

    const onPresenceInit = (payload: {
      serverId: string;
      presenceMap: Record<string, string>;
    }) => {
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
      socket.off("connect", joinServer);
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
    <div className="border-border bg-background flex max-w-[280px] min-w-60 shrink-0 flex-col overflow-auto border-l md:max-w-[280px] md:min-w-60">
      <h2 className="h3 border-border shrink-0 border-b px-3 py-2">Membres</h2>
      <div className="min-h-0 flex-1 overflow-auto p-2">
        {!serverId && (
          <p className="text-muted-foreground px-2 py-4 text-sm">
            Selectionnez un canal pour voir les membres du serveur.
          </p>
        )}
        {serverId && error && (
          <p className="text-error px-2 py-4 text-sm">{error}</p>
        )}
        {serverId && !error && members.length === 0 && (
          <p className="text-muted-foreground px-2 py-4 text-sm">
            Aucun membre.
          </p>
        )}
        {serverId && !error && members.length > 0 && (
          <ul className="space-y-1">
            {sortedMembers.map((m) => {
              const status = onlineStatus[m.userId] ?? "offline";
              return (
                <li
                  key={m.userId}
                  className="hover:bg-muted/60 flex items-center gap-2 rounded-md px-2 py-1.5 text-sm"
                >
                  <span className="bg-brand-muted/80 text-foreground relative flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-semibold">
                    {getInitials(m.user?.username) ?? "?"}
                    <span
                      className={`border-background absolute -right-0.5 -bottom-0.5 h-3 w-3 rounded-full border-2 ${STATUS_COLORS[status] ?? STATUS_COLORS.offline}`}
                      title={status}
                    />
                  </span>
                  <span className="text-foreground min-w-0 flex-1 truncate font-medium">
                    {m.user?.username ?? "Utilisateur"}
                  </span>
                  {m.role && (
                    <span
                      className="text-muted-foreground shrink-0 rounded px-1.5 py-0.5 text-xs"
                      title={m.role}
                    >
                      {roleLabel[m.role] ?? m.role}
                    </span>
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
