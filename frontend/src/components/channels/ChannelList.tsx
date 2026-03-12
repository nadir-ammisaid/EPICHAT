"use client";

import Link from "next/link";
import { Hash, Settings, PencilLine, Trash2 } from "lucide-react";
import type { Channel } from "@/lib/api/channels";

type Props = {
  serverId: string | null;
  channelId: string | null;
  channels: Channel[];
  loading: boolean;
  query: string;
  menuFor: string | null;
  setMenuFor: (id: string | null) => void;
  onOpenRename: (ch: Channel) => void;
  onOpenDelete: (ch: Channel) => void;
};

export default function ChannelList({
  serverId,
  channelId,
  channels,
  loading,
  query,
  menuFor,
  setMenuFor,
  onOpenRename,
  onOpenDelete,
}: Props) {
  if (!serverId) {
    return (
      <p className="px-2 py-3 text-sm text-slate-500">
        Sélectionne un serveur pour afficher les canaux.
      </p>
    );
  }

  if (loading) {
    return <p className="px-2 py-3 text-sm text-slate-500">Chargement…</p>;
  }

  if (!channels.length) {
    return (
      <p className="px-2 py-3 text-sm text-slate-500">
        Aucun canal pour le moment.
      </p>
    );
  }

  return (
    <div className="min-h-0 flex-1 overflow-y-auto px-3 py-3">
      <ul className="space-y-1">
        {channels.map((ch) => {
          const isActive = channelId === ch.id;
          const isMenuOpen = menuFor === ch.id;

          return (
            <li key={ch.id} className="relative">
              <div
                className={[
                  "group flex items-center justify-between gap-2 rounded-xl border px-3 py-2 transition",
                  isActive
                    ? "border-blue-200 bg-white/80"
                    : "border-transparent bg-white/40 hover:border-blue-200 hover:bg-white/70",
                ].join(" ")}
              >
                <Link
                  href={`/dashboard/${serverId}/${ch.id}`}
                  className="flex-1"
                >
                  <span className="flex items-center gap-2 truncate text-sm">
                    <Hash className="h-4 w-4 text-slate-400" />
                    {ch.name}
                  </span>
                </Link>

                <button
                  onClick={() => setMenuFor(isMenuOpen ? null : ch.id)}
                  className="grid h-8 w-8 place-items-center rounded-lg text-slate-400 hover:bg-white/70 hover:text-slate-700"
                >
                  <Settings className="h-4 w-4" />
                </button>
              </div>

              {isMenuOpen && (
                <div className="absolute top-12 right-2 z-20 w-44 rounded-xl border bg-white shadow">
                  <button
                    onClick={() => onOpenRename(ch)}
                    className="flex w-full items-center gap-2 px-3 py-2 text-sm hover:bg-slate-50"
                  >
                    <PencilLine className="h-4 w-4" />
                    Renommer
                  </button>
                  <button
                    onClick={() => onOpenDelete(ch)}
                    className="flex w-full items-center gap-2 px-3 py-2 text-sm text-red-600 hover:bg-red-50"
                  >
                    <Trash2 className="h-4 w-4" />
                    Supprimer
                  </button>
                </div>
              )}
            </li>
          );
        })}
      </ul>

      {!channels.length && query && (
        <p className="px-2 py-3 text-sm text-slate-500">
          Aucun résultat pour “{query}”.
        </p>
      )}
    </div>
  );
}
