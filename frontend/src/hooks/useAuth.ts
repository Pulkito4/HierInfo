"use client";
import { useAuth } from '@/lib/authContext';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { getCurrentUser } from '@/lib/supabaseAuth';

interface UseAuthNavigationOptions {
  protectedRoutes?: string[];
  redirectOnAuth?: string;
  redirectOnNoAuth?: string;
  validateSession?: boolean;
}

export function useAuthNavigation(options: UseAuthNavigationOptions = {}) {
  const {
    protectedRoutes = ['/home', '/categories'],
    redirectOnAuth = '/home',
    redirectOnNoAuth = '/login',
    validateSession = true
  } = options;

  const { user, loading } = useAuth();
  const router = useRouter();
  const [sessionValid, setSessionValid] = useState<boolean | null>(null);
  const [isValidating, setIsValidating] = useState(false);
  const [lastValidatedAt, setLastValidatedAt] = useState<number>(0);

  // Session validation
  const validateUserSession = async () => {
    if (!user || !validateSession) return !!user;

    // Throttle validation to once every 60s to reduce Auth requests
    const now = Date.now();
    if (sessionValid === true && now - lastValidatedAt < 60_000) {
      return true;
    }

    setIsValidating(true);
    try {
      const { user: currentUser, error } = await getCurrentUser();
      const isValid = !error && !!currentUser;
      setSessionValid(isValid);
      setLastValidatedAt(now);
      return isValid;
    } catch {
      setSessionValid(false);
      return false;
    } finally {
      setIsValidating(false);
    }
  };

  // Navigation guard for protected routes
  useEffect(() => {
    if (loading || isValidating) return;

    const currentPath = window.location.pathname;
    const isProtected = protectedRoutes.some(route => currentPath.startsWith(route));

    if (isProtected && !user) {
      router.replace('/');
    }
  }, [user, loading, isValidating, protectedRoutes, router]);

  // Browser navigation guard
  useEffect(() => {
    const handlePopState = () => {
      if (!user) {
        const currentPath = window.location.pathname;
        if (protectedRoutes.some(route => currentPath.startsWith(route))) {
          router.replace('/');
        }
      }
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, [user, protectedRoutes, router]);

  // Smart navigation function
  const navigateBasedOnAuth = async () => {
    if (loading) return;

    try {
      if (user) {
        const isValid = await validateUserSession();
        router.push(isValid ? redirectOnAuth : redirectOnNoAuth);
      } else {
        router.push(redirectOnNoAuth);
      }
    } catch {
      router.push(redirectOnNoAuth);
    }
  };

  return {
    // Navigation
    navigateBasedOnAuth,
    
    // State
    user,
    isAuthenticated: !!user && (sessionValid !== false),
    isLoading: loading || isValidating,
    sessionValid,
    
    // Helpers
    validateSession: validateUserSession
  };
}

export default useAuthNavigation;