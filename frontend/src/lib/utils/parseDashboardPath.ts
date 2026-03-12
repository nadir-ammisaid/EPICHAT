export default function parseDashboardPath(pathname: string): {
  serverId: string | null;
  channelId: string | null;
} {
  const segments = pathname.split("/").filter(Boolean);
  const dashboardIndex = segments.indexOf("dashboard");

  return {
    serverId: segments[dashboardIndex + 1] ?? null,
    channelId: segments[dashboardIndex + 2] ?? null,
  };
}
