export default function getInitials(
  username: string | null | undefined,
): string | null {
  if (!username || !username.trim()) return null;
  const parts = username.trim().split(/\s+/);
  if (parts.length >= 2) {
    return (parts[0][0] + parts[1][0]).toUpperCase().slice(0, 2);
  }
  return username.slice(0, 2).toUpperCase();
}
