"use client";

import type { ReactNode } from "react";
import AuthGuard from "@/lib/auth/auth.guard";
import { NotificationsProvider } from "@/lib/notifications/NotificationsProvider";

export default function MainLayout({
  children,
}: {
  children: ReactNode;
}) {
  return (
    <AuthGuard>
      <NotificationsProvider>{children}</NotificationsProvider>
    </AuthGuard>
  );
}
