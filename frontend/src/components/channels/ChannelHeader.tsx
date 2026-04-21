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
    <div className="border-border px-4 py-3 mt-3">
      <p className="truncate text-lg font-bold text-slate-900 text-center">
        {serverId ? ` ${serverName ?? "—"}` : ""}
      </p>

      {permissionError && (
        <p className="mt-1 text-xs text-red-600">
          Seul le propriétaire peut gérer les canaux
        </p>
      )}

      {activeLine && (
        <p className="mt-1 truncate text-[11px] text-slate-500">{activeLine}</p>
      )}

      <div className="mt-5 flex items-center gap-2">
  <hr className="border-border-muted flex-1" />
  <span className="text-muted-foreground text-lg font-bold uppercase">
    Canaux
  </span>
  <hr className="border-border-muted flex-1" />

  <button
    onClick={onCreate}
    disabled={!canCreate}
    className="grid h-7 w-7 shrink-0 place-items-center rounded-lg text-slate-500 transition hover:bg-white/60 hover:text-slate-800 disabled:opacity-40"
    title="Créer un canal"
  >
    <Plus className="h-4 w-4" />
  </button>
</div>

    </div>
  );
}
