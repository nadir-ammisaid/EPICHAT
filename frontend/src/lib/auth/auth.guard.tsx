"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";

const LOGIN_PATH = "/login";

export default function AuthGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted) return;
    const hasToken = Boolean(localStorage.getItem("token"));
    if (!hasToken) {
      router.replace(`${LOGIN_PATH}?from=${encodeURIComponent(pathname ?? "")}`);
    }
  }, [mounted, router, pathname]);

  if (!mounted || !localStorage.getItem("token")) {
    return (
      <div className="flex h-screen items-center justify-center bg-background">
        <p className="text-muted-foreground">Vérification de la session…</p>
      </div>
    );
  }

  return <>{children}</>;
}