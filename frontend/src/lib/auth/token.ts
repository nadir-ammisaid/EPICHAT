const TOKEN_STORAGE_KEY = "token";

type JwtPayload = {
  exp?: number;
};

function decodeBase64Url(value: string): string {
  const normalized = value.replace(/-/g, "+").replace(/_/g, "/");
  const padded = normalized.padEnd(Math.ceil(normalized.length / 4) * 4, "=");
  return atob(padded);
}

export function parseTokenPayload(token: string): JwtPayload | null {
  try {
    const [, payload] = token.split(".");
    if (!payload) return null;
    return JSON.parse(decodeBase64Url(payload)) as JwtPayload;
  } catch {
    return null;
  }
}

export function getStoredToken(): string | null {
  if (typeof window === "undefined") return null;

  const token = localStorage.getItem(TOKEN_STORAGE_KEY);
  if (!token) return null;

  const payload = parseTokenPayload(token);
  if (!payload?.exp) {
    localStorage.removeItem(TOKEN_STORAGE_KEY);
    return null;
  }

  if (payload.exp * 1000 <= Date.now()) {
    localStorage.removeItem(TOKEN_STORAGE_KEY);
    return null;
  }

  return token;
}

export function hasStoredToken(): boolean {
  return Boolean(getStoredToken());
}

export function clearStoredToken(): void {
  if (typeof window === "undefined") return;
  localStorage.removeItem(TOKEN_STORAGE_KEY);
}