"use client";

import { Search } from "lucide-react";

type Props = {
  query: string;
  setQuery: (value: string) => void;
  disabled: boolean;
};

export default function ChannelSearch({ query, setQuery, disabled }: Props) {
  return (
    <div className="border-border border-b px-3 py-3">
      <div className="relative">
        <Search className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-slate-400" />
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Rechercher un canal"
          disabled={disabled}
          className="border-border w-full rounded-xl border bg-white/70 py-2 pr-3 pl-9 text-sm text-slate-800 transition outline-none focus:bg-white focus:ring-2 focus:ring-blue-200 disabled:opacity-50"
        />
      </div>
    </div>
  );
}
