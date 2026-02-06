"use client";

import { Plus } from "lucide-react";

type Props = {
  serverId: string | null;
  serverName: string | null;
  permissionError: string | null;
  activeLine: string | null;
  onCreate: () => void;
  canCreate: boolean;
};

export default function ChannelHeader({
  serverId,
  serverName,
  permissionError,
  activeLine,
  onCreate,
  canCreate,
}: Props) {
  return (
    <div className="border-b border-border px-4 py-3">
      <p className="truncate text-sm font-semibold text-slate-900">
        {serverId ? `Serveur : ${serverName ?? "—"}` : "Sélectionne un serveur"}
      </p>

      {permissionError && (
        <p className="mt-1 text-xs text-red-600">
          Seul le propriétaire peut gérer les canaux
        </p>
      )}

      {activeLine && (
        <p className="mt-1 truncate text-[11px] text-slate-500">
          {activeLine}
        </p>
      )}

      <div className="mt-3 flex items-center justify-between">
        <p className="text-xs font-semibold uppercase tracking-wide text-slate-600">
          Canaux
        </p>

        <button
          onClick={onCreate}
          disabled={!canCreate}
          className="grid h-7 w-7 place-items-center rounded-lg text-slate-500 transition hover:bg-white/60 hover:text-slate-800 disabled:opacity-40"
          title="Créer un canal"
        >
          <Plus className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}