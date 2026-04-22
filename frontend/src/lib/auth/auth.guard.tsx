"use client";

import { useEffect, useSyncExternalStore } from "react";
import { useRouter, usePathname } from "next/navigation";
import { hasStoredToken } from "@/lib/auth/token";
import { useTranslation } from "react-i18next";

const LOGIN_PATH = "/login";
const subscribe = () => () => {};

const LoadingShell = ({ label }: { label: string }) => (
  <div className="bg-background flex h-screen items-center justify-center">
    <p className="text-muted-foreground">{label}</p>
  </div>
);

export default function AuthGuard({ children }: { children: React.ReactNode }) {
  const { t } = useTranslation("common");
  const router = useRouter();
  const pathname = usePathname();
  const isClient = useSyncExternalStore(subscribe, () => true, () => false);
  const hasToken = isClient && hasStoredToken();

  useEffect(() => {
    if (!isClient || hasToken) return;

    if (!hasToken) {
      router.replace(`${LOGIN_PATH}?from=${encodeURIComponent(pathname ?? "")}`);
    }
  }, [hasToken, isClient, router, pathname]);

  if (!isClient || !hasToken) {
    return <LoadingShell label={t("auth.checkingSession")} />;
  }

  return <>{children}</>;
}