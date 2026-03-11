"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { hasStoredToken } from "@/lib/auth/token";

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

    const token = hasStoredToken();
    setHasToken(token);

    if (!token) {
      router.replace(`${LOGIN_PATH}?from=${encodeURIComponent(pathname ?? "")}`);
    }
  }, [mounted, router, pathname]);

  if (!mounted || !hasToken) {
    return <LoadingShell />;
  }

  return <>{children}</>;
}
