"use client";
import { useAuthNavigation } from '@/hooks/useAuth';
import { CheckCircle2, User, Clock } from 'lucide-react';

interface AuthButtonProps {
  className?: string;
  children?: React.ReactNode;
  showStatus?: boolean;
}

export default function AuthButton({ 
  className = "text-white hover:underline transition-all duration-200", 
  children = "Get Started",
  showStatus = true
}: AuthButtonProps) {
  const { navigateBasedOnAuth, isAuthenticated, isLoading } = useAuthNavigation();

  const getContent = () => {
    if (isLoading) {
      return (
        <div className="flex items-center gap-2">
          <Clock className="w-4 h-4 animate-spin" />
          <span>Loading...</span>
        </div>
      );
    }

    if (isAuthenticated) {
      return (
        <div className="flex flex-col items-end gap-1">
          {showStatus && (
            <div className="flex items-center gap-2 text-green-300 text-xs">
              <CheckCircle2 className="w-3 h-3" />
              <span>Welcome back!</span>
            </div>
          )}
          <span className="bg-green-600 hover:bg-green-700 px-4 py-2 rounded-md font-medium">
            Continue to Home
          </span>
        </div>
      );
    }

    return (
      <div className="flex flex-col items-end gap-1">
        {/* {showStatus && (
          <div className="flex items-center gap-2 text-blue-300 text-xs">
            <User className="w-3 h-3" />
            <span>Sign in to personalize</span>
          </div>
        )} */}
        <span className="pt-4 pr-4">{children}</span>
      </div>
    );
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