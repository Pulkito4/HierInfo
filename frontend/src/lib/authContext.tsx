"use client";
import React, { createContext, useContext, useEffect, useState } from 'react';
import { getAuthenticatedUser, invalidateAuthCache } from '@/lib/authManager';
import { useCallback } from 'react';

interface User {
  id: string;
  email?: string;
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  refetch: () => void;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const DEV_BYPASS_USER: User = {
  id: 'dev-local-user',
  email: 'dev@localhost',
};

const isLocalhostHost = (hostname: string) =>
  hostname === 'localhost' || hostname === '127.0.0.1' || hostname === '::1';

const isDevAuthBypassEnabled = () =>
  process.env.NEXT_PUBLIC_DEV_AUTH_BYPASS === 'true' || process.env.NODE_ENV !== 'production';

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  const shouldBypassAuth =
    typeof window !== 'undefined' &&
    isDevAuthBypassEnabled() &&
    isLocalhostHost(window.location.hostname);

  const fetchUser = useCallback(async () => {
    if (shouldBypassAuth) {
      setUser(DEV_BYPASS_USER);
      setLoading(false);
      return;
    }

    try {
      const { user: currentUser, loading: isValidating } = await getAuthenticatedUser();
      setUser(currentUser);
      setLoading(isValidating);
    } catch {
      setUser(null);
      setLoading(false);
    }
  }, [shouldBypassAuth]);

  useEffect(() => {
    fetchUser();
  }, [fetchUser]);

  const refetch = () => {
    setLoading(true);
    fetchUser();
  };

  const handleSignOut = async () => {
    try {
      if (!shouldBypassAuth) {
      // Import signOut function
      const { signOut } = await import('@/lib/supabaseAuth');
      await signOut();
      }
      
      // Clear centralized cache and local state
      invalidateAuthCache();
      setUser(null);
      
      // Clear any cached data and force a hard navigation
      if (typeof window !== 'undefined') {
        // Clear local storage items that might contain session data
        localStorage.clear();
        sessionStorage.clear();
        
        // Replace current history entry to prevent back navigation
        window.history.replaceState(null, '', '/');
      }
    } catch (error) {
      console.error('Error during sign out:', error);
    }
  };

  return (
    <AuthContext.Provider value={{ user, loading, refetch, signOut: handleSignOut }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}