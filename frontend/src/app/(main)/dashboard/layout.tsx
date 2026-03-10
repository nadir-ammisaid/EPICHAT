
import AuthGuard from "@/lib/auth/auth.guard";
import DashboardShell from "@/components/dashboard/DashboardShell";

export default function DashboardLayout() {
  return (
    <AuthGuard>
      <DashboardShell />
    </AuthGuard>
  );
}
