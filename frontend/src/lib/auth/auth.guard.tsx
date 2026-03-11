"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { hasStoredToken } from "@/lib/auth/token";

const LOGIN_PATH = "/login";

export default function AuthGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [isChecked, setIsChecked] = useState(false);

  useEffect(() => {
    if (!hasStoredToken()) {
      router.replace(`${LOGIN_PATH}?from=${encodeURIComponent(pathname ?? "")}`);
    }
    setIsChecked(true);
  }, [router, pathname]);

  if (!isChecked) {
    return (
      <div className="flex h-screen items-center justify-center bg-background">
        <p className="text-muted-foreground">Vérification de la session…</p>
      </div>
    );
  }

  return <>{children}</>;
}