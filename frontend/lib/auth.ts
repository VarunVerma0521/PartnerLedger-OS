"use client";

export type StoredUser = {
  id: string;
  email: string;
  fullName: string;
  role: "ADMIN" | "PARTNER" | "VIEWER";
  partnerId: string | null;
};

export type StoredAuthSession = {
  accessToken: string;
  refreshToken: string;
  user: StoredUser;
};

const AUTH_STORAGE_KEY = "partnerledger-os.auth";

function canUseStorage(): boolean {
  return typeof window !== "undefined";
}

export function getStoredAuthSession(): StoredAuthSession | null {
  if (!canUseStorage()) {
    return null;
  }

  const rawSession = window.localStorage.getItem(AUTH_STORAGE_KEY);

  if (!rawSession) {
    return null;
  }

  try {
    return JSON.parse(rawSession) as StoredAuthSession;
  } catch {
    window.localStorage.removeItem(AUTH_STORAGE_KEY);
    return null;
  }
}

export function saveAuthSession(session: StoredAuthSession): void {
  if (!canUseStorage()) {
    return;
  }

  window.localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(session));
}

export function clearAuthSession(): void {
  if (!canUseStorage()) {
    return;
  }

  window.localStorage.removeItem(AUTH_STORAGE_KEY);
}

export function getAccessToken(): string | null {
  return getStoredAuthSession()?.accessToken ?? null;
}

export function isAuthenticated(): boolean {
  return Boolean(getAccessToken());
}
