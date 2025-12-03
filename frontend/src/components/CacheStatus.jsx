import { useMemo } from 'react';
import { LoadingSpinner } from './LoadingSpinner';

export function CacheStatus({ lastRefreshed, onRefreshCache, isRefreshing, needsRefresh }) {
  const timeAgo = useMemo(() => {
    if (!lastRefreshed) return 'Never synced';

    const seconds = Math.floor((Date.now() - lastRefreshed) / 1000);
    if (seconds < 5) return 'Just now';
    if (seconds < 60) return `${seconds}s ago`;

    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes}m ago`;

    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;

    const days = Math.floor(hours / 24);
    return `${days}d ago`;
  }, [lastRefreshed]);

  const statusColor = needsRefresh ? 'text-amber-400' : 'text-primary-400';
  const statusBg = needsRefresh ? 'bg-amber-500/20' : 'bg-primary-500/20';
  const pulseClass = needsRefresh ? 'animate-pulse' : '';

  return (
    <div className="glass-card p-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div
            className={`w-10 h-10 rounded-lg bg-gradient-to-br from-primary-500/20 to-accent-500/20 flex items-center justify-center ${statusBg}`}
          >
            <svg
              className={`w-5 h-5 ${statusColor}`}
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M5 12h14M5 12a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v4a2 2 0 01-2 2M5 12a2 2 0 00-2 2v4a2 2 0 002 2h14a2 2 0 002-2v-4a2 2 0 00-2-2m-2-4h.01M17 16h.01"
              />
            </svg>
          </div>
          <div>
            <p className="text-white/50 text-xs uppercase tracking-wide">Data Source</p>
            <p className="text-white text-lg font-semibold">Cache</p>
            <p className={`text-xs ${needsRefresh ? 'text-amber-300' : 'text-white/40'}`}>
              {needsRefresh ? 'Refresh needed!' : `Synced ${timeAgo}`}
            </p>
          </div>
        </div>
        <button
          onClick={onRefreshCache}
          disabled={isRefreshing}
          className={`icon-button p-2 rounded-full ${
            needsRefresh
              ? 'text-amber-400 hover:bg-amber-400/20'
              : 'text-white/60 hover:bg-white/10'
          } ${pulseClass} disabled:opacity-50`}
          title="Sync from DB"
        >
          {isRefreshing ? (
            <LoadingSpinner size="sm" />
          ) : (
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
              />
            </svg>
          )}
        </button>
      </div>
    </div>
  );
}

