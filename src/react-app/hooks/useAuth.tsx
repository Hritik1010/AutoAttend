import React, { createContext, useContext, useEffect, useMemo, useState, useCallback } from 'react';

type User = { username: string; role: string } | null;

type AuthContextType = {
  user: User;
  isPending: boolean;
  login: (username: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User>(null);
  const [isPending, setIsPending] = useState(true);

  const fetchMe = async () => {
    try {
      setIsPending(true);
      const res = await fetch('/api/auth/me');
      if (res.ok) {
        const data = await res.json();
        setUser(data);
      } else {
        setUser(null);
      }
    } catch {
      setUser(null);
    } finally {
      setIsPending(false);
    }
  };

  useEffect(() => {
    fetchMe();
  }, []);

  const login = useCallback(async (username: string, password: string) => {
    const res = await fetch('/api/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password }),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'Login failed');
    }
    await fetchMe();
  }, []);

  const logout = useCallback(async () => {
    await fetch('/api/logout');
    setUser(null);
  }, []);

  const value = useMemo(() => ({ user, isPending, login, logout }), [user, isPending, login, logout]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
