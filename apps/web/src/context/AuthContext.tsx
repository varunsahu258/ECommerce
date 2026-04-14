import { createContext, type ReactNode, useEffect, useState } from "react";
import type { AuthUser } from "@ecommerce/shared";
import { authApi } from "../api/client";

interface AuthContextValue {
  token: string | null;
  user: AuthUser | null;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string) => Promise<void>;
  logout: () => void;
}

const storageKey = "ecommerce.auth";

export const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [token, setToken] = useState<string | null>(null);
  const [user, setUser] = useState<AuthUser | null>(null);

  useEffect(() => {
    const stored = localStorage.getItem(storageKey);
    if (!stored) {
      return;
    }

    const parsed = JSON.parse(stored) as { token: string; user: AuthUser };
    setToken(parsed.token);
    setUser(parsed.user);
  }, []);

  const persist = (nextToken: string, nextUser: AuthUser) => {
    setToken(nextToken);
    setUser(nextUser);
    localStorage.setItem(
      storageKey,
      JSON.stringify({
        token: nextToken,
        user: nextUser
      })
    );
  };

  const login = async (email: string, password: string) => {
    const response = await authApi.login(email, password);
    persist(response.token, response.user);
  };

  const register = async (email: string, password: string) => {
    const response = await authApi.register(email, password);
    persist(response.token, response.user);
  };

  const logout = () => {
    setToken(null);
    setUser(null);
    localStorage.removeItem(storageKey);
  };

  return (
    <AuthContext.Provider
      value={{
        token,
        user,
        isAuthenticated: Boolean(token && user),
        login,
        register,
        logout
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};
