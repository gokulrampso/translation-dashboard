import { useState, useEffect, useCallback } from 'react';
import { usageApi } from '../services/api';
import { LoadingSpinner } from './LoadingSpinner';

function StatCard({ icon, title, value, subtitle, color = 'primary' }) {
  const colorClasses = {
    primary: 'from-primary-500/20 to-accent-500/20 text-primary-400',
    green: 'from-green-500/20 to-emerald-500/20 text-green-400',
    amber: 'from-amber-500/20 to-orange-500/20 text-amber-400',
    purple: 'from-purple-500/20 to-pink-500/20 text-purple-400',
    blue: 'from-blue-500/20 to-cyan-500/20 text-blue-400',
  };

  return (
    <div className="glass-card p-5">
      <div className="flex items-center gap-4">
        <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${colorClasses[color]} flex items-center justify-center`}>
          {icon}
        </div>
        <div>
          <p className="text-white/50 text-xs uppercase tracking-wide">{title}</p>
          <p className="text-white text-2xl font-bold">{value}</p>
          {subtitle && <p className="text-white/40 text-xs">{subtitle}</p>}
        </div>
      </div>
    </div>
  );
}

function CostBreakdownCard({ title, icon, items, total, color = 'primary' }) {
  const colorClasses = {
    primary: 'border-primary-500/30',
    amber: 'border-amber-500/30',
  };

  return (
    <div className={`glass-card p-6 border-l-4 ${colorClasses[color]}`}>
      <div className="flex items-center gap-3 mb-4">
        {icon}
        <h3 className="text-lg font-semibold text-white">{title}</h3>
      </div>
      <div className="space-y-3">
        {items.map((item, index) => (
          <div key={index} className="flex items-center justify-between py-2 border-b border-white/5">
            <div className="flex items-center gap-2">
              <span className="text-white/70">{item.label}</span>
              {item.badge && (
                <span className="px-2 py-0.5 text-xs rounded-full bg-white/10 text-white/50">
                  {item.badge}
                </span>
              )}
            </div>
            <span className="font-mono text-white">{item.value}</span>
          </div>
        ))}
      </div>
      <div className="mt-4 pt-4 border-t border-white/10 flex justify-between items-center">
        <span className="text-white/70 font-medium">Estimated Cost</span>
        <span className="text-xl font-bold text-gradient">{total}</span>
      </div>
    </div>
  );
}

export function CostDashboard({ onBack }) {
  const [stats, setStats] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isResetting, setIsResetting] = useState(false);

  const fetchStats = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      const response = await usageApi.getUsageStats();
      setStats(response.data);
    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchStats();
    // Auto-refresh every 30 seconds
    const interval = setInterval(fetchStats, 30000);
    return () => clearInterval(interval);
  }, [fetchStats]);

  const handleReset = async () => {
    if (!confirm('Are you sure you want to reset all usage statistics?')) return;
    
    try {
      setIsResetting(true);
      await usageApi.resetUsageStats();
      await fetchStats();
    } catch (err) {
      setError(err.message);
    } finally {
      setIsResetting(false);
    }
  };

  const formatNumber = (num) => {
    if (num >= 1000000) return `${(num / 1000000).toFixed(2)}M`;
    if (num >= 1000) return `${(num / 1000).toFixed(2)}K`;
    return num.toLocaleString();
  };

  if (isLoading && !stats) {
    return (
      <div className="min-h-screen grid-pattern flex items-center justify-center">
        <div className="text-center">
          <LoadingSpinner size="lg" className="text-primary-400 mx-auto mb-4" />
          <p className="text-white/50">Loading cost data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen grid-pattern">
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        {/* Header */}
        <header className="glass-card mb-8 p-6">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            <div className="flex items-center gap-4">
              <button
                onClick={onBack}
                className="w-10 h-10 rounded-xl bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors"
              >
                <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </button>
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-amber-500 to-orange-500 flex items-center justify-center shadow-lg shadow-amber-500/25">
                <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gradient">Cost Dashboard</h1>
                <p className="text-white/50 text-sm">AWS usage and estimated costs</p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={fetchStats}
                disabled={isLoading}
                className="glass-button flex items-center gap-2 disabled:opacity-50"
              >
                {isLoading ? (
                  <LoadingSpinner size="sm" />
                ) : (
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                )}
                <span>Refresh</span>
              </button>
              <button
                onClick={handleReset}
                disabled={isResetting}
                className="glass-button flex items-center gap-2 hover:bg-red-500/20 hover:border-red-500/30 hover:text-red-400 disabled:opacity-50"
              >
                {isResetting ? (
                  <LoadingSpinner size="sm" />
                ) : (
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                )}
                <span>Reset Stats</span>
              </button>
            </div>
          </div>
        </header>

        {error && (
          <div className="glass-card p-4 mb-8 border-l-4 border-red-500 bg-red-500/10">
            <p className="text-red-400">{error}</p>
          </div>
        )}

        {stats && (
          <>
            {/* Overview Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
              <StatCard
                icon={<svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>}
                title="Total Estimated Cost"
                value={stats.costs.total}
                subtitle="This session"
                color="amber"
              />
              <StatCard
                icon={<svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4" /></svg>}
                title="DynamoDB Operations"
                value={formatNumber(stats.dynamodb.operations.total)}
                subtitle={`${stats.dynamodb.operations.reads} reads, ${stats.dynamodb.operations.writes} writes`}
                color="blue"
              />
              <StatCard
                icon={<svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5h12M9 3v2m1.048 9.5A18.022 18.022 0 016.412 9m6.088 9h7M11 21l5-10 5 10M12.751 5C11.783 10.77 8.07 15.61 3 18.129" /></svg>}
                title="Characters Translated"
                value={formatNumber(stats.translate.characters)}
                subtitle={`${stats.translate.requests} API requests`}
                color="purple"
              />
              <StatCard
                icon={<svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>}
                title="Session Duration"
                value={`${stats.session.durationMinutes}m`}
                subtitle={`Started ${new Date(stats.session.startTime).toLocaleTimeString()}`}
                color="green"
              />
            </div>

            {/* Cost Breakdown */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
              {/* DynamoDB Costs */}
              <CostBreakdownCard
                title="DynamoDB"
                icon={
                  <div className="w-10 h-10 rounded-lg bg-blue-500/20 flex items-center justify-center">
                    <svg className="w-5 h-5 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4" />
                    </svg>
                  </div>
                }
                items={[
                  { label: 'Read Operations', value: formatNumber(stats.dynamodb.operations.reads), badge: stats.costs.dynamodb.reads },
                  { label: 'Write Operations', value: formatNumber(stats.dynamodb.operations.writes), badge: stats.costs.dynamodb.writes },
                  { label: 'Delete Operations', value: formatNumber(stats.dynamodb.operations.deletes) },
                  { label: 'Scan Operations', value: formatNumber(stats.dynamodb.operations.scans) },
                  { label: 'Storage', value: `${stats.dynamodb.storage.kb} KB`, badge: stats.costs.dynamodb.storage },
                ]}
                total={stats.costs.dynamodb.total}
                color="primary"
              />

              {/* AWS Translate Costs */}
              <CostBreakdownCard
                title="AWS Translate"
                icon={
                  <div className="w-10 h-10 rounded-lg bg-purple-500/20 flex items-center justify-center">
                    <svg className="w-5 h-5 text-purple-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5h12M9 3v2m1.048 9.5A18.022 18.022 0 016.412 9m6.088 9h7M11 21l5-10 5 10M12.751 5C11.783 10.77 8.07 15.61 3 18.129" />
                    </svg>
                  </div>
                }
                items={[
                  { label: 'Characters Translated', value: formatNumber(stats.translate.characters) },
                  { label: 'API Requests', value: formatNumber(stats.translate.requests) },
                  { label: 'Price per Character', value: `$${stats.pricing.translate.perCharacter}` },
                ]}
                total={stats.costs.translate.total}
                color="amber"
              />
            </div>

            {/* Pricing Info */}
            <div className="glass-card p-6">
              <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                <svg className="w-5 h-5 text-white/50" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                AWS Pricing Reference (On-Demand)
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-white/5 rounded-xl p-4">
                  <p className="text-white/50 text-sm">DynamoDB Reads</p>
                  <p className="text-white font-mono">${stats.pricing.dynamodb.readRequestUnit}/million RRUs</p>
                </div>
                <div className="bg-white/5 rounded-xl p-4">
                  <p className="text-white/50 text-sm">DynamoDB Writes</p>
                  <p className="text-white font-mono">${stats.pricing.dynamodb.writeRequestUnit}/million WRUs</p>
                </div>
                <div className="bg-white/5 rounded-xl p-4">
                  <p className="text-white/50 text-sm">DynamoDB Storage</p>
                  <p className="text-white font-mono">${stats.pricing.dynamodb.storagePerGBMonth}/GB/month</p>
                </div>
                <div className="bg-white/5 rounded-xl p-4">
                  <p className="text-white/50 text-sm">Translate</p>
                  <p className="text-white font-mono">$15/million characters</p>
                </div>
              </div>
              <p className="text-white/30 text-xs mt-4">
                * Prices are approximate and may vary by region. Actual costs depend on your AWS pricing tier and region.
              </p>
            </div>
          </>
        )}

        {/* Footer */}
        <footer className="mt-8 text-center text-white/30 text-sm">
          <p>Translation Manager • Cost Dashboard</p>
        </footer>
      </div>
    </div>
  );
}

