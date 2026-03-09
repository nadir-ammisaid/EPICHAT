export default function Loading() {
    return (
        <main className="flex min-h-[100dvh] items-center justify-center bg-background px-4">
            <section className="w-full max-w-md rounded-2xl border bg-card p-6 shadow-sm">
                <div className="space-y-5">
                    <div className="h-6 w-32 animate-pulse rounded-md bg-muted" />
                    <div className="space-y-3">
                        <div className="h-10 w-full animate-pulse rounded-md bg-muted" />
                        <div className="h-10 w-full animate-pulse rounded-md bg-muted" />
                    </div>
                    <div className="h-10 w-full animate-pulse rounded-md bg-muted" />
                    <div className="mx-auto h-4 w-40 animate-pulse rounded-md bg-muted" />
                </div>
            </section>
        </main>
    );
}