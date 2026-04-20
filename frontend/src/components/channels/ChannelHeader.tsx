"use client";

import { Plus } from "lucide-react";
import { useTranslation } from "react-i18next";

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
  const { t } = useTranslation("common");

  return (
    <div className="border-border border-b px-4 py-3">
      <p className="truncate text-sm font-semibold text-slate-900">
        {serverId
          ? t("channels.header.serverLabel", {
              name: serverName ?? "—",
            })
          : t("channels.header.noServer")}
      </p>

      {permissionError && (
        <p className="mt-1 text-xs text-red-600">
          {t("channels.header.permissionError")}
        </p>
      )}

      {activeLine && (
        <p className="mt-1 truncate text-[11px] text-slate-500">
          {activeLine}
        </p>
      )}

      <div className="mt-3 flex items-center justify-between">
        <p className="text-xs font-semibold tracking-wide text-slate-600 uppercase">
          {t("channels.header.listTitle")}
        </p>

        <button
          onClick={onCreate}
          disabled={!canCreate}
          className="grid h-7 w-7 place-items-center rounded-lg text-slate-500 transition hover:bg-white/60 hover:text-slate-800 disabled:opacity-40"
          title={t("channels.header.create")}
        >
          <Plus className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}