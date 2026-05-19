import { useState, useEffect, useRef, useCallback } from 'react';
import { getPortalStats } from '../../services/dashboardService';
import { Building2, Users, Briefcase, Award } from 'lucide-react';

/* ── Count-up hook ─────────────────────────────────────────────────── */
function useCountUp(target, duration = 1200) {
  const [value, setValue] = useState(0);
  const rafRef = useRef(null);

  useEffect(() => {
    if (target === 0) { setValue(0); return; }
    const start = performance.now();
    const from  = 0;

    const tick = (now) => {
      const elapsed  = now - start;
      const progress = Math.min(elapsed / duration, 1);
      // Ease-out quad
      const eased    = 1 - (1 - progress) * (1 - progress);
      setValue(Math.round(from + eased * target));
      if (progress < 1) rafRef.current = requestAnimationFrame(tick);
    };

    rafRef.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafRef.current);
  }, [target, duration]);

  return value;
}

/* ── Single animated stat card ─────────────────────────────────────── */
function StatCard({ icon: Icon, label, value, suffix = '', color, loading }) {
  const displayed = useCountUp(loading ? 0 : value, 1400);

  return (
    <div className={`
      relative bg-white border border-slate-200 rounded-lg p-3.5 text-center
      shadow-sm hover:shadow-md cursor-default
      transition-all duration-200 hover:-translate-y-0.5
      ${loading ? 'animate-pulse' : ''}
    `}>
      {/* Icon */}
      <div className={`inline-flex items-center justify-center w-7 h-7 rounded-md mb-2 ${color}`}>
        <Icon size={14} className="text-white" />
      </div>

      {/* Number */}
      {loading ? (
        <div className="h-6 w-12 bg-slate-200 rounded mx-auto mb-1" />
      ) : (
        <p className="text-xl font-bold text-slate-800 leading-none tabular-nums">
          {displayed.toLocaleString('en-IN')}{suffix}
        </p>
      )}

      {/* Label */}
      {loading ? (
        <div className="h-3 w-16 bg-slate-200 rounded mx-auto mt-1.5" />
      ) : (
        <p className="text-xs text-slate-500 mt-1">{label}</p>
      )}
    </div>
  );
}

/* ── Main exported component ───────────────────────────────────────── */
const STAT_CONFIG = [
  { key: 'companies',  label: 'Companies',  icon: Building2, color: 'bg-blue-500',   suffix: '' },
  { key: 'students',   label: 'Students',   icon: Users,     color: 'bg-emerald-500', suffix: '' },
  { key: 'jobs',       label: 'Active Jobs', icon: Briefcase, color: 'bg-amber-500',  suffix: '' },
  { key: 'placements', label: 'Placements', icon: Award,     color: 'bg-purple-500', suffix: '' },
];

export default function PortalStats({ refreshInterval = 60_000 }) {
  const [stats, setStats]       = useState(null);
  const [loading, setLoading]   = useState(true);
  const [lastUpdated, setLastUpdated] = useState(null);
  const [error, setError]       = useState(false);

  const fetchStats = useCallback(async () => {
    try {
      const res = await getPortalStats();
      setStats(res.data);
      setLastUpdated(new Date());
      setError(false);
    } catch {
      setError(true);
    } finally {
      setLoading(false);
    }
  }, []);

  // Initial fetch
  useEffect(() => { fetchStats(); }, [fetchStats]);

  // Auto-refresh
  useEffect(() => {
    const id = setInterval(fetchStats, refreshInterval);
    return () => clearInterval(id);
  }, [fetchStats, refreshInterval]);

  // Human-readable "last updated"
  const relativeTime = lastUpdated
    ? (() => {
        const sec = Math.floor((Date.now() - lastUpdated) / 1000);
        if (sec < 5)  return 'just now';
        if (sec < 60) return `${sec}s ago`;
        return `${Math.floor(sec / 60)}m ago`;
      })()
    : null;

  return (
    <div>
      <div className="grid grid-cols-2 gap-2 mb-2">
        {STAT_CONFIG.map(({ key, label, icon, color, suffix }) => (
          <StatCard
            key={key}
            icon={icon}
            label={label}
            value={stats?.[key] ?? 0}
            suffix={suffix}
            color={color}
            loading={loading}
          />
        ))}
      </div>

      {/* Last updated + status */}
      <div className="flex items-center justify-between px-0.5">
        {error ? (
          <p className="text-xs text-red-400">⚠ Could not load live stats</p>
        ) : lastUpdated ? (
          <p className="text-xs text-slate-400">
            <span className="inline-block w-1.5 h-1.5 rounded-full bg-green-400 mr-1 align-middle" />
            Live data · updated {relativeTime}
          </p>
        ) : (
          <div className="h-3 w-32 bg-slate-200 rounded animate-pulse" />
        )}
        <button
          type="button"
          onClick={fetchStats}
          className="text-xs text-slate-400 hover:text-blue-500 transition-colors"
        >
          Refresh ↻
        </button>
      </div>
    </div>
  );
}
