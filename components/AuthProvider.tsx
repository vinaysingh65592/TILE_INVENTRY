'use client';

import { createContext, useContext, useEffect, useState, useCallback, type ReactNode } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import type { AuthUserInfo } from '@/lib/types';

interface AuthContextType {
  user: AuthUserInfo | null;
  loading: boolean;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  logout: async () => {},
  refreshUser: async () => {},
});

export function useAuth() {
  return useContext(AuthContext);
}

export default function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUserInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const pathname = usePathname();

  const fetchUser = useCallback(async () => {
    try {
      const res = await fetch('/api/auth/me');
      const data = await res.json();
      if (data.success && data.user) {
        setUser(data.user);
        if (data.user.mustChangePassword && pathname !== '/change-password') {
          router.push('/change-password');
        }
      } else {
        setUser(null);
        if (pathname !== '/login' && pathname !== '/register') {
          router.push('/login');
        }
      }
    } catch {
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, [pathname, router]);

  useEffect(() => {
    if (pathname === '/login' || pathname === '/register') {
      setLoading(false);
      return;
    }
    fetchUser();
  }, [pathname, fetchUser]);

  const logout = useCallback(async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
    } catch {
      // ignore
    }
    setUser(null);
    router.push('/login');
  }, [router]);

  const refreshUser = useCallback(async () => {
    await fetchUser();
  }, [fetchUser]);

  return (
    <AuthContext.Provider value={{ user, loading, logout, refreshUser }}>
      {children}
    </AuthContext.Provider>
  );
}
