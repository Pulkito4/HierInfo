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
        <div className="w-20 h-20 bg-gradient-to-br from-indigo-500/20 to-violet-600/20 rounded-2xl flex items-center justify-center mb-4 border border-indigo-500/30">
          <span className="text-4xl">{icon}</span>
        </div>
        <h3 className="text-xl font-bold text-white">
          {title}
        </h3>
        <p className="text-slate-400 max-w-md">
          {description}
        </p>
        <div className="flex items-center justify-center gap-3 pt-2">
          {primaryAction && (
            <button
              onClick={primaryAction.onClick}
              className="inline-flex items-center px-5 py-2.5 bg-gradient-to-r from-indigo-600 to-violet-600 text-white text-sm font-semibold rounded-xl hover:from-indigo-500 hover:to-violet-500 transition-all shadow-lg shadow-indigo-500/25"
            >
              {primaryAction.label}
            </button>
          )}
          {onRetry && (
            <button
              onClick={onRetry}
              className="inline-flex items-center px-5 py-2.5 bg-slate-800 text-slate-300 text-sm font-medium rounded-xl hover:bg-slate-700 transition-all border border-slate-700"
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
