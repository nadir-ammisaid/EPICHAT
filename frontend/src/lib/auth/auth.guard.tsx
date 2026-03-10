"use client";

import { useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";

const LOGIN_PATH = "/login";

export default function AuthGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const hasToken = typeof window !== "undefined" && Boolean(localStorage.getItem("token"));

  useEffect(() => {
    if (!hasToken) {
      router.replace(`${LOGIN_PATH}?from=${encodeURIComponent(pathname ?? "")}`);
    }
  }, [hasToken, router, pathname]);

  if (!hasToken) {
    return (
      <div className="flex h-screen items-center justify-center bg-background">
        <p className="text-muted-foreground">Vérification de la session…</p>
      </div>
    );
  }

  return <>{children}</>;
}