"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";

type Role = "manager";

type AuthUser = {
  id: string;
  fullName: string;
  email: string;
  role: Role;
};

type AuthResponse = {
  access_token: string;
  token_type: "bearer";
  user?: AuthUser;
  message?: string;
};

type AuthContextValue = {
  user: AuthUser | null;
  token: string | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  role: Role | null;
  login: (email: string, password: string) => Promise<void>;
  register: (fullName: string, email: string, password: string) => Promise<void>;
  logout: () => void;
  authFetch: (input: RequestInfo | URL, init?: RequestInit) => Promise<Response>;
};

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

const TOKEN_STORAGE_KEY = "hr_auth_token";

function normalizeRole(value: unknown): Role | null {
  if (typeof value !== "string") {
    return null;
  }

  const normalized = value.trim().toLowerCase();
  const managerAliases = new Set(["manager", "admin", "superadmin", "super_admin", "hr_manager"]);
  return managerAliases.has(normalized) ? "manager" : null;
}

function normalizeUser(value: unknown): AuthUser | null {
  if (!value || typeof value !== "object") {
    return null;
  }

  const candidate = value as Record<string, unknown>;
  const id = typeof candidate.id === "string" || typeof candidate.id === "number"
    ? String(candidate.id)
    : null;
  const firstName = typeof candidate.firstName === "string"
    ? candidate.firstName
    : (typeof candidate.first_name === "string" ? candidate.first_name : "");
  const lastName = typeof candidate.lastName === "string"
    ? candidate.lastName
    : (typeof candidate.last_name === "string" ? candidate.last_name : "");
  const derivedFullName = `${firstName} ${lastName}`.trim();
  const fullName = typeof candidate.fullName === "string"
    ? candidate.fullName
    : (typeof candidate.full_name === "string"
      ? candidate.full_name
      : (typeof candidate.name === "string" ? candidate.name : derivedFullName || null));
  const email = typeof candidate.email === "string" ? candidate.email : null;
  const role = normalizeRole(candidate.role);

  if (!id || !fullName || !email || !role) {
    return null;
  }

  return { id, fullName, email, role };
}

function extractApiErrorMessage(payload: unknown, fallback: string): string {
  if (!payload || typeof payload !== "object") {
    return fallback;
  }

  const candidate = payload as Record<string, unknown>;

  if (typeof candidate.error === "string" && candidate.error.trim()) {
    return candidate.error;
  }

  if (typeof candidate.message === "string" && candidate.message.trim()) {
    return candidate.message;
  }

  if (Array.isArray(candidate.message)) {
    const firstMessage = candidate.message.find((item) => typeof item === "string" && item.trim());
    if (typeof firstMessage === "string") {
      return firstMessage;
    }
  }

  return fallback;
}

function extractAccessToken(payload: unknown): string | null {
  if (!payload || typeof payload !== "object") {
    return null;
  }

  const candidate = payload as Record<string, unknown>;
  const tokenCandidates = [
    candidate.access_token,
    candidate.accessToken,
    candidate.token,
    candidate.jwt,
  ];

  for (const token of tokenCandidates) {
    if (typeof token === "string" && token.trim()) {
      return token;
    }
  }

  return null;
}

async function readApiPayload(response: Response): Promise<unknown> {
  const rawBody = await response.text();
  if (!rawBody) {
    return null;
  }

  try {
    return JSON.parse(rawBody) as unknown;
  } catch {
    return null;
  }
}

function getApiErrorMessage(payload: unknown, fallback: string) {
  if (!payload || typeof payload !== "object") {
    return fallback;
  }

  if ("message" in payload) {
    const message = payload.message;
    if (typeof message === "string" && message.trim()) {
      return message;
    }

    if (Array.isArray(message)) {
      const firstMessage = message.find((item) => typeof item === "string" && item.trim());
      if (typeof firstMessage === "string") {
        return firstMessage;
      }
    }
  }

  if ("error" in payload && typeof payload.error === "string" && payload.error.trim()) {
    return payload.error;
  }

  return fallback;
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const persistToken = (nextToken: string | null) => {
    if (typeof window === "undefined") return;
    if (nextToken) {
      localStorage.setItem(TOKEN_STORAGE_KEY, nextToken);
    } else {
      localStorage.removeItem(TOKEN_STORAGE_KEY);
    }
  };

  const logout = useCallback(() => {
    setToken(null);
    setUser(null);
    persistToken(null);
  }, []);

  const fetchCurrentUser = useCallback(async (accessToken: string) => {
    const response = await fetch("/api/auth/me", {
      headers: { Authorization: `Bearer ${accessToken}` },
    });

    if (!response.ok) {
      throw new Error("Unauthorized");
    }

    const data = (await response.json()) as unknown;
    const payload = (data && typeof data === "object") ? data as Record<string, unknown> : null;
    const userCandidate = payload
      ? (payload.user ?? (payload.data && typeof payload.data === "object"
        ? (payload.data as Record<string, unknown>).user ?? payload.data
        : payload))
      : null;
    const normalizedUser = normalizeUser(userCandidate);
    if (!normalizedUser) {
      throw new Error("Unauthorized");
    }

    return normalizedUser;
  }, []);

  useEffect(() => {
    const restore = async () => {
      try {
        const savedToken = localStorage.getItem(TOKEN_STORAGE_KEY);
        if (!savedToken) return;

        const currentUser = await fetchCurrentUser(savedToken);
        setToken(savedToken);
        setUser(currentUser);
      } catch {
        logout();
      } finally {
        setIsLoading(false);
      }
    };

    void restore();
  }, [fetchCurrentUser, logout]);

  const login = useCallback(
    async (email: string, password: string) => {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const payload = await readApiPayload(response);

      if (!response.ok) {
        throw new Error(getApiErrorMessage(payload, "Не удалось войти"));
      }

      const accessToken = extractAccessToken(payload);

      if (!accessToken) {
        throw new Error("Не удалось войти");
      }

      const data = payload as AuthResponse;
      const currentUser = normalizeUser(data.user) ?? (await fetchCurrentUser(accessToken));
      setToken(accessToken);
      setUser(currentUser);
      persistToken(accessToken);
    },
    [fetchCurrentUser],
  );

  const register = useCallback(
    async (fullName: string, email: string, password: string) => {
      const response = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ fullName, email, password }),
      });
      const payload = await readApiPayload(response);

      if (!response.ok) {
        throw new Error(getApiErrorMessage(payload, "Не удалось зарегистрироваться"));
      }

      const accessToken = extractAccessToken(payload);

      if (!accessToken) {
        throw new Error("Не удалось зарегистрироваться");
      }

      const data = payload as AuthResponse;
      const currentUser = normalizeUser(data.user) ?? (await fetchCurrentUser(accessToken));
      setToken(accessToken);
      setUser(currentUser);
      persistToken(accessToken);
    },
    [fetchCurrentUser],
  );

  const authFetch = useCallback(
    async (input: RequestInfo | URL, init?: RequestInit) => {
      if (!token) {
        return new Response(JSON.stringify({ error: "Unauthorized" }), {
          status: 401,
          headers: { "Content-Type": "application/json" },
        });
      }

      const response = await fetch(input, {
        ...init,
        headers: {
          ...(init?.headers ?? {}),
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.status === 401) {
        logout();
      }

      return response;
    },
    [logout, token],
  );

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      token,
      isLoading,
      isAuthenticated: Boolean(user && token),
      role: user?.role ?? null,
      login,
      register,
      logout,
      authFetch,
    }),
    [authFetch, isLoading, login, logout, register, token, user],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return context;
}
