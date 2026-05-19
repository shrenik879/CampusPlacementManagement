import { useEffect, useState } from 'react';
import { getCompanyAnalytics } from '../../services/analyticsService';
import { Spinner } from '../../components/ui/Spinner';
import PageHeader from '../../components/ui/PageHeader';
import { Badge } from '../../components/ui/Badge';
import {
  Users, TrendingUp, CheckCircle, XCircle, BarChart2,
  Briefcase, ArrowRight, Award
} from 'lucide-react';
import toast from 'react-hot-toast';

/* ── Animated counter ──────────────────────────────────────────────────── */
function AnimatedNumber({ value, suffix = '' }) {
  const [display, setDisplay] = useState(0);
  useEffect(() => {
    if (!value) return;
    let start = 0;
    const end = Number(value);
    if (end === 0) { setDisplay(0); return; }
    const duration = 800;
    const step = Math.ceil(end / (duration / 16));
    const timer = setInterval(() => {
      start += step;
      if (start >= end) { setDisplay(end); clearInterval(timer); }
      else setDisplay(start);
    }, 16);
    return () => clearInterval(timer);
  }, [value]);
  return <>{display}{suffix}</>;
}

/* ── Funnel bar ────────────────────────────────────────────────────────── */
function FunnelBar({ label, count, percentage, color }) {
  return (
    <div className="flex items-center gap-3 mb-2">
      <span className="text-xs text-slate-500 w-24 flex-shrink-0 text-right">{label}</span>
      <div className="flex-1 h-5 bg-slate-100 rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full flex items-center justify-end pr-2 transition-all duration-700 ease-out ${color}`}
          style={{ width: `${Math.max(percentage, 4)}%` }}
        >
          <span className="text-[10px] font-bold text-white">{count}</span>
        </div>
      </div>
      <span className="text-xs font-semibold text-slate-600 w-10">{percentage}%</span>
    </div>
  );
}

/* ── Summary stat card ─────────────────────────────────────────────────── */
function SummaryCard({ icon: Icon, label, value, suffix = '', color }) {
  const colorMap = {
    blue:  'bg-blue-50 text-blue-600 border-blue-100',
    green: 'bg-green-50 text-green-600 border-green-100',
    red:   'bg-red-50 text-red-600 border-red-100',
    amber: 'bg-amber-50 text-amber-600 border-amber-100',
  };
  return (
    <div className={`flex items-center gap-3 p-4 rounded-lg border ${colorMap[color] || colorMap.blue}`}>
      <Icon size={22} />
      <div>
        <p className="text-2xl font-bold leading-tight">
          <AnimatedNumber value={value} suffix={suffix} />
        </p>
        <p className="text-xs font-medium mt-0.5 opacity-80">{label}</p>
      </div>
    </div>
  );
}

export default function AnalyticsPage() {
  const [data, setData]       = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getCompanyAnalytics()
      .then(res => setData(res.data))
      .catch(() => toast.error('Failed to load analytics'))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return (
    <div>
      <PageHeader title="Analytics" subtitle="Recruitment performance dashboard" />
      <Spinner />
    </div>
  );

  if (!data) return null;

  const { summary, jobs } = data;

  return (
    <div>
      <PageHeader title="Analytics" subtitle="Recruitment performance & conversion insights" />

      {/* ── Summary cards ──────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
        <SummaryCard icon={Briefcase}   label="Total Jobs"       value={summary.totalJobs}        color="blue"  />
        <SummaryCard icon={Users}       label="Total Applicants" value={summary.totalApplicants}  color="blue"  />
        <SummaryCard icon={CheckCircle} label="Selected"         value={summary.totalSelected}    color="green" />
        <SummaryCard icon={TrendingUp}  label="Conversion Rate"  value={summary.conversionRate}   suffix="%" color="amber" />
      </div>

      {/* ── Per-job breakdown ───────────────────────────────────────────── */}
      {jobs.length === 0 ? (
        <div className="bg-white border border-slate-200 rounded-lg p-12 text-center">
          <BarChart2 size={36} className="mx-auto mb-3 text-slate-300" />
          <p className="text-slate-500 font-medium">No applicant data yet</p>
          <p className="text-xs text-slate-400 mt-1">Post jobs and receive applications to see analytics here.</p>
        </div>
      ) : (
        <div className="space-y-5">
          {jobs.map((job, idx) => (
            <div
              key={job.jobId}
              className="bg-white border border-slate-200 rounded-lg overflow-hidden"
              style={{ animation: `fadeInUp 0.3s ease-out ${idx * 0.07}s both` }}
            >
              {/* Job header */}
              <div className="flex items-center justify-between px-5 py-3 border-b border-slate-100 bg-slate-50">
                <div className="flex items-center gap-2">
                  <Award size={15} className="text-blue-500" />
                  <h2 className="text-sm font-semibold text-slate-800">{job.jobTitle}</h2>
                  <Badge status={job.status || 'OPEN'} />
                </div>
                <span className="text-xs text-slate-400">{job.totalApplicants} applicant{job.totalApplicants !== 1 ? 's' : ''}</span>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-0 divide-y lg:divide-y-0 lg:divide-x divide-slate-100">

                {/* LEFT — Funnel */}
                <div className="px-5 py-4">
                  <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-3 flex items-center gap-1">
                    <ArrowRight size={11} /> Application Funnel
                  </p>
                  {job.funnelStages.map(stage => {
                    const colors = { Applied: 'bg-blue-500', Shortlisted: 'bg-amber-400', Selected: 'bg-green-500' };
                    return (
                      <FunnelBar
                        key={stage.stage}
                        label={stage.stage}
                        count={stage.count}
                        percentage={stage.percentage}
                        color={colors[stage.stage] || 'bg-slate-400'}
                      />
                    );
                  })}

                  {/* Mini status breakdown */}
                  <div className="flex gap-3 mt-3 flex-wrap">
                    <span className="flex items-center gap-1 text-[11px] text-slate-500">
                      <span className="w-2 h-2 rounded-full bg-amber-400" /> Pending: <b>{job.pending}</b>
                    </span>
                    <span className="flex items-center gap-1 text-[11px] text-slate-500">
                      <span className="w-2 h-2 rounded-full bg-blue-400" /> In Progress: <b>{job.inProgress}</b>
                    </span>
                    <span className="flex items-center gap-1 text-[11px] text-slate-500">
                      <span className="w-2 h-2 rounded-full bg-green-500" /> Selected: <b>{job.selected}</b>
                    </span>
                    <span className="flex items-center gap-1 text-[11px] text-slate-500">
                      <span className="w-2 h-2 rounded-full bg-red-400" /> Rejected: <b>{job.rejected}</b>
                    </span>
                  </div>
                </div>

                {/* RIGHT — Round conversion */}
                <div className="px-5 py-4">
                  <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-3 flex items-center gap-1">
                    <BarChart2 size={11} /> Round Conversion
                  </p>
                  {job.roundStats.length === 0 ? (
                    <p className="text-xs text-slate-400 italic">No round data yet — shortlist candidates to begin rounds.</p>
                  ) : (
                    <table className="w-full text-xs">
                      <thead>
                        <tr className="text-slate-400 border-b border-slate-100">
                          <th className="text-left pb-1.5 font-medium">Round</th>
                          <th className="text-center pb-1.5 font-medium">Total</th>
                          <th className="text-center pb-1.5 font-medium text-green-600">Pass</th>
                          <th className="text-center pb-1.5 font-medium text-red-500">Fail</th>
                          <th className="text-right pb-1.5 font-medium text-blue-600">Rate</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-50">
                        {job.roundStats.map(rs => (
                          <tr key={rs.roundName} className="hover:bg-slate-50">
                            <td className="py-1.5 font-medium text-slate-700">{rs.roundName}</td>
                            <td className="py-1.5 text-center text-slate-500">{rs.total}</td>
                            <td className="py-1.5 text-center text-green-600 font-semibold">{rs.passed}</td>
                            <td className="py-1.5 text-center text-red-500 font-semibold">{rs.failed}</td>
                            <td className="py-1.5 text-right">
                              <span className={`font-bold ${
                                rs.passRate >= 70 ? 'text-green-600' :
                                rs.passRate >= 40 ? 'text-amber-600' : 'text-red-500'
                              }`}>{rs.passRate}%</span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  )}

                  {/* Conversion rate badge */}
                  <div className="mt-3 flex items-center gap-1.5">
                    <TrendingUp size={12} className="text-slate-400" />
                    <span className="text-xs text-slate-500">
                      Overall conversion:{' '}
                      <span className={`font-bold ${
                        job.conversionRate >= 50 ? 'text-green-600' :
                        job.conversionRate >= 25 ? 'text-amber-600' : 'text-red-500'
                      }`}>{job.conversionRate}%</span>
                    </span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <style>{`
        @keyframes fadeInUp {
          from { opacity: 0; transform: translateY(10px); }
          to   { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
}
