export default function ChannelBar({ className = "" }: { className?: string }) {
    return (
        <div className={`flex h-full min-w-64 max-w-[240px] shrink-0 flex-col border border-border bg-brand-muted ${className}`}>
            <h1>ChannelBar</h1>
        </div>
    );
}