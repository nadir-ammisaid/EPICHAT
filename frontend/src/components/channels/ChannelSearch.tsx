"use client";

import { Search } from "lucide-react";

type Props = {
  query: string;
  setQuery: (value: string) => void;
  disabled: boolean;
};

export default function ChannelSearch({
  query,
  setQuery,
  disabled,
}: Props) {
  return (
    <div className="border-b border-border px-3 py-3">
      <div className="relative">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Rechercher un canal"
          disabled={disabled}
          className="w-full rounded-xl border border-border bg-white/70 py-2 pl-9 pr-3 text-sm text-slate-800 outline-none transition focus:bg-white focus:ring-2 focus:ring-blue-200 disabled:opacity-50"
        />
      </div>
    </div>
  );
}