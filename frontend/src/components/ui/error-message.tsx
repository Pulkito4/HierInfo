import React from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface ErrorMessageProps {
  error: Error | null;
  onRetry?: () => void;
  title?: string;
  showRetry?: boolean;
  className?: string;
}

const ErrorMessage: React.FC<ErrorMessageProps> = ({
  error,
  onRetry,
  title = 'Something went wrong',
  showRetry = true,
  className = ''
}) => {
  if (!error) return null;

  const getErrorMessage = (error: Error) => {
    if (error.message.includes('fetch')) {
      return 'Unable to connect to the server. Please check your internet connection.';
    }
    if (error.message.includes('unauthorized') || error.message.includes('403')) {
      return 'You don\'t have permission to access this content.';
    }
    if (error.message.includes('404') || error.message.includes('not found')) {
      return 'The requested content could not be found.';
    }
    if (error.message.includes('timeout')) {
      return 'Request timed out. Please try again.';
    }
    
    return error.message || 'An unexpected error occurred.';
  };

  return (
    <div className={`flex flex-col items-center justify-center p-8 text-center bg-[#FEF2F2] border border-[#FECACA] rounded-xl ${className}`}>
      <div className="w-14 h-14 bg-[#FEE2E2] rounded-full flex items-center justify-center mb-4">
        <AlertTriangle className="w-7 h-7 text-[#DC2626]" />
      </div>
      
      <h3 className="text-lg font-semibold text-[#991B1B] mb-2">
        {title}
      </h3>
      
      <p className="text-[#DC2626] mb-6 max-w-md">
        {getErrorMessage(error)}
      </p>
      
      {showRetry && onRetry && (
        <Button 
          onClick={onRetry}
          variant="outline"
          size="sm"
          className="border-[#FCA5A5] text-[#DC2626] hover:bg-[#FEE2E2] hover:border-[#F87171]"
        >
          <RefreshCw className="w-4 h-4 mr-2" />
          Try Again
        </Button>
      )}
      
      <details className="mt-4 text-xs text-[#9CA3AF]">
        <summary className="cursor-pointer hover:text-[#6B6B6B] transition-colors">Technical Details</summary>
        <pre className="mt-2 p-3 bg-white border border-[#E5E5E5] rounded-lg text-left overflow-auto text-[#6B6B6B]">
          {error.stack || error.message}
        </pre>
      </details>
    </div>
  );
};

export default ErrorMessage;
