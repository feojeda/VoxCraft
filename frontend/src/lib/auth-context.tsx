"use client";

import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
} from "react";
import { apiClient } from "./api-client";
import type { User } from "./types";

interface AuthState {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
}

interface AuthContextValue extends AuthState {
  login: (email: string, password: string) => Promise<User>;
  register: (email: string, password: string) => Promise<User>;
  logout: () => Promise<void>;
  me: () => Promise<User | null>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const isAuthenticated = user !== null;

  const me = useCallback(async (): Promise<User | null> => {
    try {
      const userData = await apiClient.me();
      setUser(userData);
      return userData;
    } catch {
      setUser(null);
      try { await apiClient.logout(); } catch {}
      return null;
    }
  }, []);

  const login = useCallback(
    async (email: string, password: string): Promise<User> => {
      const userData = await apiClient.login({ email, password });
      setUser(userData);
      return userData;
    },
    []
  );

  const register = useCallback(
    async (email: string, password: string): Promise<User> => {
      const userData = await apiClient.register({ email, password });
      setUser(userData);
      return userData;
    },
    []
  );

  const logout = useCallback(async (): Promise<void> => {
    await apiClient.logout();
    setUser(null);
  }, []);

  // Check for existing session on mount
  useEffect(() => {
    me().finally(() => setIsLoading(false));
  }, [me]);

  return (
    <AuthContext.Provider
      value={{ user, isLoading, isAuthenticated, login, register, logout, me }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);
  if (context === null) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
