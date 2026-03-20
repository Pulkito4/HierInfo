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
    <div className={`flex flex-col items-center justify-center p-8 text-center bg-rose-50 border border-rose-200 rounded-2xl ${className}`}>
      <div className="w-16 h-16 bg-rose-100 rounded-2xl flex items-center justify-center mb-4">
        <AlertTriangle className="w-8 h-8 text-rose-500" />
      </div>
      
      <h3 className="text-lg font-bold text-slate-800 mb-2">
        {title}
      </h3>
      
      <p className="text-rose-600 mb-6 max-w-md">
        {getErrorMessage(error)}
      </p>
      
      {showRetry && onRetry && (
        <Button 
          onClick={onRetry}
          variant="outline"
          size="sm"
          className="border-rose-300 text-rose-600 hover:bg-rose-50 hover:border-rose-400 rounded-xl"
        >
          <RefreshCw className="w-4 h-4 mr-2" />
          Try Again
        </Button>
      )}
    </div>
  );
};

export default ErrorMessage;
