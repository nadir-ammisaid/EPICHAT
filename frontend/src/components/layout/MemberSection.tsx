"use client";

import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import parseDashboardPath from "@/lib/utils/parseDashboardPath";
import { apiClient } from "@/lib/api/client";
import getInitials from "@/lib/utils/getInitials";

type ServerMember = {
  userId: string;
  role: string;
  user: { id: string; username: string; email?: string };
};

export default function MemberSection() {
  const pathname = usePathname();
  const { serverId } = parseDashboardPath(pathname ?? "");
  const [members, setMembers] = useState<ServerMember[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!serverId) {
      setMembers([]);
      setError(null);
      return;
    }
    setLoading(true);
    setError(null);
    apiClient
      .request(`/servers/${serverId}/members`)
      .then((data: ServerMember[]) => {
        setMembers(Array.isArray(data) ? data : []);
      })
      .catch((err: Error) => {
        setError(err.message ?? "Impossible de charger les membres");
        setMembers([]);
      })
      .finally(() => setLoading(false));
  }, [serverId]);

  const roleLabel: Record<string, string> = {
    owner: "Propriétaire",
    admin: "Admin",
    member: "Membre",
  };

  return (
    <div className="flex min-w-60 max-w-[280px] shrink-0 flex-col overflow-auto border-l border-border bg-background md:min-w-60 md:max-w-[280px]">
      <h2 className="h3 shrink-0 border-b border-border px-3 py-2">Membres</h2>
      <div className="min-h-0 flex-1 overflow-auto p-2">
        {!serverId && (
          <p className="px-2 py-4 text-sm text-muted-foreground">
            Sélectionnez un canal pour voir les membres du serveur.
          </p>
        )}
        {serverId && loading && (
          <p className="px-2 py-4 text-sm text-muted-foreground">Chargement…</p>
        )}
        {serverId && error && (
          <p className="px-2 py-4 text-sm text-error">{error}</p>
        )}
        {serverId && !loading && !error && members.length === 0 && (
          <p className="px-2 py-4 text-sm text-muted-foreground">Aucun membre.</p>
        )}
        {serverId && !loading && !error && members.length > 0 && (
          <ul className="space-y-1">
            {members.map((m) => (
              <li
                key={m.userId}
                className="flex items-center gap-2 rounded-md px-2 py-1.5 text-sm hover:bg-muted/60"
              >
                <span
                  className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-brand-muted/80 text-xs font-semibold text-foreground"
                  title={m.user.username}
                >
                  {getInitials(m.user?.username) ?? "?"}
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
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
