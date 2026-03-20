"use client";
import { useAuthNavigation } from '@/hooks/useAuth';
import { useAuth } from '@/lib/authContext';
import { Loader2, ArrowRight, Home, Sparkles } from 'lucide-react';

interface AuthButtonProps {
  className?: string;
  children?: React.ReactNode;
}

export default function AuthButton({ 
  className = "", 
  children
}: AuthButtonProps) {
  const { navigateBasedOnAuth, isAuthenticated, isLoading } = useAuthNavigation();
  const { user } = useAuth();

  // Don't render anything if user is authenticated (for header buttons)
  // This hides login/signup when logged in
  if (user && !children) {
    return null;
  }

  const getContent = () => {
    if (isLoading) {
      return (
        <div className="flex items-center gap-2">
          <Loader2 className="w-4 h-4 animate-spin" />
          <span>Loading...</span>
        </div>
      );
    }

    if (isAuthenticated) {
      return (
        <div className="flex items-center gap-2">
          <Home className="w-5 h-5" />
          <span>Go to Feed</span>
          <ArrowRight className="w-4 h-4" />
        </div>
      );
    }

    // Default content for not authenticated
    if (!children) {
      return (
        <div className="flex items-center gap-2">
          <Sparkles className="w-5 h-5" />
          <span>Get Started</span>
        </div>
      );
    }

    return children;
  };

  return (
    <button 
      onClick={navigateBasedOnAuth}
      className={className || "btn-primary"}
      disabled={isLoading}
    >
      {getContent()}
    </button>
  );
}
