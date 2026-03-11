"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";

const LOGIN_PATH = "/login";

const LoadingShell = () => (
  <div className="bg-background flex h-screen items-center justify-center">
    <p className="text-muted-foreground">Vérification de la session…</p>
  </div>
);

export default function AuthGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [mounted, setMounted] = useState(false);
  const [hasToken, setHasToken] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted) return;
    const token = Boolean(
      typeof window !== "undefined" && localStorage.getItem("token"),
    );
    setHasToken(token);
    if (!token) {
      router.replace(
        `${LOGIN_PATH}?from=${encodeURIComponent(pathname ?? "")}`,
      );
    }
  }, [mounted, router, pathname]);

  // Même rendu serveur et premier rendu client pour éviter le hydration mismatch
  if (!mounted || !hasToken) {
    return <LoadingShell />;
  }

  return <>{children}</>;
}
