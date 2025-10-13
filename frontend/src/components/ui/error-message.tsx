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
    // Handle different types of errors
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
    <div className={`flex flex-col items-center justify-center p-8 text-center bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg ${className}`}>
      <AlertTriangle className="w-12 h-12 text-red-500 mb-4" />
      
      <h3 className="text-lg font-semibold text-red-800 dark:text-red-200 mb-2">
        {title}
      </h3>
      
      <p className="text-red-600 dark:text-red-300 mb-4 max-w-md">
        {getErrorMessage(error)}
      </p>
      
      {showRetry && onRetry && (
        <Button 
          onClick={onRetry}
          variant="outline"
          size="sm"
          className="border-red-300 text-red-700 hover:bg-red-100 dark:border-red-600 dark:text-red-300 dark:hover:bg-red-900/30"
        >
          <RefreshCw className="w-4 h-4 mr-2" />
          Try Again
        </Button>
      )}
      
      <details className="mt-4 text-xs text-red-500 dark:text-red-400">
        <summary className="cursor-pointer hover:underline">Technical Details</summary>
        <pre className="mt-2 p-2 bg-red-100 dark:bg-red-900/40 rounded text-left overflow-auto">
          {error.stack || error.message}
        </pre>
      </details>
    </div>
  );
};

export default ErrorMessage;