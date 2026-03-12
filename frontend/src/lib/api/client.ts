import { getStoredToken, clearStoredToken } from "@/lib/auth/token";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";

export async function api(endpoint: string, options: RequestInit = {}) {
  const token = getStoredToken();
  const res = await fetch(`${API_URL}${endpoint}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(token && { Authorization: `Bearer ${token}` }),
      ...options.headers,
    },
  });
  const data = await res.json().catch(() => ({}));
  if (res.status === 401) {
    clearStoredToken();
  }
  if (!res.ok) throw new Error(data.message || "Request failed");
  return data;
};

export const apiClient = {
  async request(endpoint: string, options: RequestInit = {}) {
    const token = getStoredToken();
    const headers: HeadersInit = {
      "Content-Type": "application/json",
      ...(token && { Authorization: `Bearer ${token}` }),
      ...options.headers,
    };

    const response = await fetch(`${API_URL}${endpoint}`, {
      ...options,
      headers,
    });

    const data = await response.json().catch(() => ({}));
    if (response.status === 401) {
      clearStoredToken();
    }
    if (!response.ok) {
      throw new Error(data.message || "Erreur lors de la requête");
    }

    return data;
  },
};
