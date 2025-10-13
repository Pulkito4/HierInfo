"use client";
import React, { createContext, useContext, useEffect, useState } from 'react';
import { getCurrentUser } from '@/lib/supabaseAuth';

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

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchUser = async () => {
    try {
      const { user: currentUser } = await getCurrentUser();
      setUser(currentUser);
    } catch {
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUser();
  }, []);

  const refetch = () => {
    setLoading(true);
    fetchUser();
  };

  const handleSignOut = async () => {
    try {
      // Import signOut function
      const { signOut } = await import('@/lib/supabaseAuth');
      await signOut();
      
      // Clear user state immediately
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