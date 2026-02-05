
import AuthGuard from "@/lib/auth/auth.guard";
import DashboardShell from "@/components/dashboard/DashboardShell";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <AuthGuard>
      <DashboardShell />
    </AuthGuard>
  );
}
