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

async function readApiPayload(response: Response): Promise<unknown> {
  const contentType = response.headers.get("content-type") ?? "";
  if (!contentType.toLowerCase().includes("application/json")) {
    return null;
  }

  try {
    return await response.json();
  } catch {
    return null;
  }
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

    const data = (await response.json()) as { user: AuthUser };
    return data.user;
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
        const message =
          payload && typeof payload === "object" && "error" in payload && typeof payload.error === "string"
            ? payload.error
            : "Не удалось войти";
        throw new Error(message);
      }

      if (!payload || typeof payload !== "object" || !("access_token" in payload) || typeof payload.access_token !== "string") {
        throw new Error("Не удалось войти");
      }

      const data = payload as AuthResponse;
      const currentUser = data.user ?? (await fetchCurrentUser(data.access_token));
      setToken(data.access_token);
      setUser(currentUser);
      persistToken(data.access_token);
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
        const message =
          payload && typeof payload === "object" && "error" in payload && typeof payload.error === "string"
            ? payload.error
            : "Не удалось зарегистрироваться";
        throw new Error(message);
      }

      if (!payload || typeof payload !== "object" || !("access_token" in payload) || typeof payload.access_token !== "string") {
        throw new Error("Не удалось зарегистрироваться");
      }

      const data = payload as AuthResponse;
      const currentUser = data.user ?? (await fetchCurrentUser(data.access_token));
      setToken(data.access_token);
      setUser(currentUser);
      persistToken(data.access_token);
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
