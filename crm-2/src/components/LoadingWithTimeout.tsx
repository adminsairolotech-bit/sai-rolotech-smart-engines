import { useState, useEffect } from "react";
import { RefreshCw, AlertTriangle } from "lucide-react";

interface LoadingWithTimeoutProps {
  loading: boolean;
  timeoutMs?: number;
  onRetry?: () => void;
  children: React.ReactNode;
  loadingContent?: React.ReactNode;
}

export function LoadingWithTimeout({
  loading,
  timeoutMs = 15000,
  onRetry,
  children,
  loadingContent,
}: LoadingWithTimeoutProps) {
  const [timedOut, setTimedOut] = useState(false);

  useEffect(() => {
    if (!loading) {
      setTimedOut(false);
      return;
    }

    const timer = setTimeout(() => {
      setTimedOut(true);
    }, timeoutMs);

    return () => clearTimeout(timer);
  }, [loading, timeoutMs]);

  if (!loading) {
    return <>{children}</>;
  }

  if (timedOut) {
    return (
      <div className="flex flex-col items-center justify-center py-16 px-6 text-center">
        <div className="w-12 h-12 rounded-full bg-destructive/10 flex items-center justify-center mb-4">
          <AlertTriangle className="w-6 h-6 text-destructive" />
        </div>
        <h3 className="text-base font-semibold text-foreground mb-2">
          Loading timed out
        </h3>
        <p className="text-sm text-muted-foreground mb-4 max-w-sm">
          This is taking longer than expected. The server may be slow or
          unavailable.
        </p>
        {onRetry && (
          <button
            onClick={() => {
              setTimedOut(false);
              onRetry();
            }}
            className="inline-flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-md text-sm font-medium hover:bg-primary/90 transition-colors"
          >
            <RefreshCw className="w-4 h-4" />
            Try Again
          </button>
        )}
      </div>
    );
  }

  return (
    <>
      {loadingContent || (
        <div className="flex items-center justify-center py-20">
          <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
        </div>
      )}
    </>
  );
}
