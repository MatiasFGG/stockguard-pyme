import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";

import {
  getCurrentUser,
  login,
} from "../api/authApi";

import type {
  AuthUser,
  LoginCredentials,
} from "../types/auth";

import {
  getAccessToken,
  removeAccessToken,
  setAccessToken,
} from "../utils/tokenStorage";

interface AuthContextValue {
  user: AuthUser | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  signIn: (
    credentials: LoginCredentials,
  ) => Promise<AuthUser>;
  refreshUser: () => Promise<AuthUser>;
  signOut: () => void;
}

interface AuthProviderProps {
  children: ReactNode;
}

const AuthContext =
  createContext<AuthContextValue | null>(null);

export function AuthProvider({
  children,
}: AuthProviderProps) {
  const [user, setUser] =
    useState<AuthUser | null>(null);

  const [isLoading, setIsLoading] =
    useState(true);

  useEffect(() => {
    async function restoreSession() {
      const token = getAccessToken();

      if (!token) {
        setIsLoading(false);
        return;
      }

      try {
        const currentUser =
          await getCurrentUser();

        setUser(currentUser);
      } catch {
        removeAccessToken();
        setUser(null);
      } finally {
        setIsLoading(false);
      }
    }

    void restoreSession();
  }, []);

  async function signIn(
    credentials: LoginCredentials,
  ): Promise<AuthUser> {
    const loginData = await login(credentials);

    setAccessToken(loginData.access_token);
    setUser(loginData.user);

    return loginData.user;
  }

  async function refreshUser(): Promise<AuthUser> {
    const currentUser =
      await getCurrentUser();

    setUser(currentUser);

    return currentUser;
  }

  function signOut(): void {
    removeAccessToken();
    setUser(null);
  }

  const value: AuthContextValue = {
    user,
    isAuthenticated: user !== null,
    isLoading,
    signIn,
    refreshUser,
    signOut,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error(
      "useAuth debe utilizarse dentro de AuthProvider",
    );
  }

  return context;
}