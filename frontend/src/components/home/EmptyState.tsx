import React from 'react';

interface EmptyStateProps {
  icon: string;
  title: string;
  description: string;
  onRetry?: () => void;
  primaryAction?: {
    label: string;
    onClick: () => void;
  };
}

const EmptyState: React.FC<EmptyStateProps> = ({
  icon,
  title,
  description,
  onRetry,
  primaryAction,
}) => {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-4">
      <div className="text-center space-y-4">
        <div className="w-20 h-20 bg-[#F5F5F4] rounded-full flex items-center justify-center mx-auto mb-4">
          <span className="text-4xl">{icon}</span>
        </div>
        <h3 className="text-xl font-semibold text-[#1A1A1A]">
          {title}
        </h3>
        <p className="text-[#6B6B6B] max-w-md">
          {description}
        </p>
        <div className="flex items-center justify-center gap-3 pt-2">
          {primaryAction && (
            <button
              onClick={primaryAction.onClick}
              className="inline-flex items-center px-5 py-2.5 bg-[#1A1A1A] text-white text-sm font-medium rounded-lg hover:bg-[#2D2D2D] transition-colors"
            >
              {primaryAction.label}
            </button>
          )}
          {onRetry && (
            <button
              onClick={onRetry}
              className="inline-flex items-center px-5 py-2.5 bg-[#F5F5F4] text-[#1A1A1A] text-sm font-medium rounded-lg hover:bg-[#EBEBEA] transition-colors"
            >
              Retry
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default EmptyState;
