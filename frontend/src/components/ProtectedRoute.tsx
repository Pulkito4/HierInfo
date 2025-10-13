"use client";
import { useAuthNavigation } from '@/hooks/useAuth';
import LoadingSkeleton from '@/components/ui/loading-skeleton';

interface ProtectedRouteProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

export default function ProtectedRoute({ 
  children, 
  fallback = <LoadingSkeleton type="profile" />
}: ProtectedRouteProps) {
  const { isAuthenticated, isLoading } = useAuthNavigation();

  // Show loading state while checking authentication
  if (isLoading) {
    return <>{fallback}</>;
  }

  // If not authenticated, show loading (navigation guard will handle redirect)
  if (!isAuthenticated) {
    return <>{fallback}</>;
  }

  // User is authenticated, render children
  return <>{children}</>;
}