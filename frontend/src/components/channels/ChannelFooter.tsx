type Props = {
  serverId: string | null;
  count: number;
};

export default function ChannelFooter({ serverId, count }: Props) {
  return (
    <div className="border-border border-t px-4 py-3 text-center text-xs text-slate-500">
      {serverId ? `${count} canal(aux)` : "—"}
    </div>
  );
}
