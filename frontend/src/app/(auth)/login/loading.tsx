export default function Loading() {
  return (
    <main className="bg-background flex min-h-[100dvh] items-center justify-center px-4">
      <section className="bg-card w-full max-w-md rounded-2xl border p-6 shadow-sm">
        <div className="space-y-5">
          <div className="bg-muted h-6 w-32 animate-pulse rounded-md" />
          <div className="space-y-3">
            <div className="bg-muted h-10 w-full animate-pulse rounded-md" />
            <div className="bg-muted h-10 w-full animate-pulse rounded-md" />
          </div>
          <div className="bg-muted h-10 w-full animate-pulse rounded-md" />
          <div className="bg-muted mx-auto h-4 w-40 animate-pulse rounded-md" />
        </div>
      </section>
    </main>
  );
}
