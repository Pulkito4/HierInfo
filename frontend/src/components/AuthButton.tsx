"use client";
import { useAuthNavigation } from '@/hooks/useAuth';
import { Clock } from 'lucide-react';

interface AuthButtonProps {
  className?: string;
  children?: React.ReactNode;
}

export default function AuthButton({ 
  className = "text-white transition-all duration-200", 
  children = "Get Started"
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
          <span className="border-2 p-3 rounded-2xl hover:border-teal-400 hover:text-teal-400   border-white">
            Continue to Home
          </span>
        </div>
      );
    }

    return (
      <div className="flex flex-col items-end gap-1">
        <span className=" border-2 p-3 rounded-2xl hover:border-teal-400 hover:text-teal-400   border-white">{children}</span>
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