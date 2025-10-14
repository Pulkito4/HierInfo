"use client";
import { useAuth } from '@/lib/authContext';
import LoadingSkeleton from '@/components/ui/loading-skeleton';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

interface ProtectedRouteProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

export default function ProtectedRoute({ 
  children, 
  fallback = <LoadingSkeleton type="profile" />
}: ProtectedRouteProps) {
  const { user, loading } = useAuth();
  const router = useRouter();

  // Handle redirect logic
  useEffect(() => {
    if (!loading && !user) {
      router.replace('/');
    }
  }, [user, loading, router]);

  // Show loading state while checking authentication
  if (loading) {
    return <>{fallback}</>;
  }

  // If not authenticated, show loading (redirect will happen via useEffect)
  if (!user) {
    return <>{fallback}</>;
  }

  // User is authenticated, render children
  return <>{children}</>;
}