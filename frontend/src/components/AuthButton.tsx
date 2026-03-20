"use client";
import { useAuthNavigation } from '@/hooks/useAuth';
import { Loader2, ArrowRight } from 'lucide-react';

interface AuthButtonProps {
  className?: string;
  children?: React.ReactNode;
}

export default function AuthButton({ 
  className = "", 
  children
}: AuthButtonProps) {
  const { navigateBasedOnAuth, isAuthenticated, isLoading } = useAuthNavigation();

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
          <span>Continue to Home</span>
          <ArrowRight className="w-4 h-4" />
        </div>
      );
    }

    return children;
  };

  return (
    <button 
      onClick={navigateBasedOnAuth}
      className={className}
      disabled={isLoading}
    >
      {getContent()}
    </button>
  );
}
