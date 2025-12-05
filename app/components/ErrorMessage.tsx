'use client';

interface ErrorMessageProps {
  message: string;
  onDismiss?: () => void;
}

export function ErrorMessage({ message, onDismiss }: ErrorMessageProps) {
  return (
    <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg dark:bg-red-900/20 dark:border-red-800">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <p className="text-sm font-medium text-red-800 dark:text-red-200">{message}</p>
        </div>
        {onDismiss && (
          <button
            onClick={onDismiss}
            className="ml-4 text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-200"
            aria-label="Dismiss error"
          >
            ×
          </button>
        )}
      </div>
    </div>
  );
}

