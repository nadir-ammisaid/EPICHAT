"use client";

import AuthGuard from "@/lib/auth/auth.guard";
import DashboardShell from "@/components/dashboard/DashboardShell";
import { NotificationsProvider } from "@/lib/notifications/NotificationsProvider";

export default function DashboardLayout() {
  return (
    <AuthGuard>
      <NotificationsProvider>
        <DashboardShell />
      </NotificationsProvider>
    </AuthGuard>
  );
}
