import { useEffect, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { getMyApplications, applyJob } from '../../services/applicationService';
import { getRecommendedJobs } from '../../services/jobService';
import { StatCard } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { Spinner } from '../../components/ui/Spinner';
import { EmptyState } from '../../components/ui/EmptyState';
import PageHeader from '../../components/ui/PageHeader';
import { useNavigate } from 'react-router-dom';
import {
  Briefcase, Clock, CheckCircle, XCircle, TrendingUp,
  Sparkles, Building2, ArrowRight, Star, Zap, Send
} from 'lucide-react';
import toast from 'react-hot-toast';

export default function StudentDashboard() {
  const { user }   = useAuth();
  const navigate   = useNavigate();
  const [applications, setApplications] = useState([]);
  const [loading, setLoading]           = useState(true);
  const [recommendations, setRecommendations] = useState([]);
  const [recsLoading, setRecsLoading]         = useState(true);
  const [applying, setApplying]               = useState(null);

  useEffect(() => {
    getMyApplications()
      .then(res => setApplications(res.data || []))
      .catch(() => toast.error('Failed to load applications'))
      .finally(() => setLoading(false));

    getRecommendedJobs()
      .then(res => setRecommendations(res.data || []))
      .catch(() => {/* silent – recommendations are a bonus feature */})
      .finally(() => setRecsLoading(false));
  }, []);

  const handleQuickApply = async (jobId) => {
    if (!user?.resumeUrl) {
      toast.error('Please upload your resume first');
      navigate('/student/resume');
      return;
    }
    setApplying(jobId);
    try {
      await applyJob(jobId);
      toast.success('Application submitted!');
      // Remove from recommendations
      setRecommendations(prev => prev.filter(j => j.id !== jobId));
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to apply');
    } finally {
      setApplying(null);
    }
  };

  const total    = applications.length;
  const pending  = applications.filter(a => a.status === 'PENDING').length;
  const selected = applications.filter(a => a.status === 'SELECTED').length;
  const rejected = applications.filter(a => a.status === 'REJECTED').length;

  return (
    <div>
      {/* Welcome */}
      <div className="mb-5 flex items-start justify-between">
        <div>
          <h1 className="text-lg font-semibold text-slate-800">
            Welcome, {user?.name}
          </h1>
          <p className="text-sm text-slate-500 mt-0.5">
            {user?.role === 'STUDENT' ? 'Student Dashboard — Placement Portal' : ''}
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="primary" size="sm" onClick={() => navigate('/jobs')}>
            Browse Jobs
          </Button>
          <Button variant="secondary" size="sm" onClick={() => navigate('/student/resume')}>
            {user?.resumeUrl ? 'Update Resume' : 'Upload Resume'}
          </Button>
        </div>
      </div>

      {/* Resume missing warning */}
      {!user?.resumeUrl && (
        <div className="mb-5 flex items-center gap-2 px-4 py-3 bg-amber-50 border border-amber-200 rounded text-sm text-amber-700">
          <span className="font-medium">Action required:</span>
          Upload your resume to start applying for jobs.
          <button onClick={() => navigate('/student/resume')} className="ml-auto text-xs underline text-amber-700 hover:text-amber-900">
            Upload now →
          </button>
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
        <StatCard icon={TrendingUp}  label="Total Applied" value={total}    color="blue"  />
        <StatCard icon={Clock}       label="Pending"        value={pending}  color="amber" />
        <StatCard icon={CheckCircle} label="Selected"       value={selected} color="green" />
        <StatCard icon={XCircle}     label="Rejected"       value={rejected} color="red"   />
      </div>

      {/* ── Recommended For You ─────────────────────────────────────────────── */}
      <div className="bg-white border border-slate-200 rounded-lg mb-5">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-slate-200">
          <div className="flex items-center gap-2">
            <Sparkles size={15} className="text-blue-500" />
            <h2 className="text-sm font-semibold text-slate-700">Recommended For You</h2>
            <span className="text-[10px] bg-blue-50 text-blue-600 px-1.5 py-0.5 rounded-full font-medium border border-blue-100">
              AI Matched
            </span>
          </div>
          <Button variant="ghost" size="xs" onClick={() => navigate('/student/resume')}>
            Update skills →
          </Button>
        </div>

        {recsLoading ? (
          <Spinner />
        ) : recommendations.length === 0 ? (
          <div className="px-4 py-8 text-center">
            <Sparkles size={28} className="mx-auto mb-2 text-slate-300" />
            <p className="text-sm font-medium text-slate-500">No recommendations yet</p>
            <p className="text-xs text-slate-400 mt-1">
              Add your skills on the{' '}
              <button
                onClick={() => navigate('/student/resume')}
                className="text-blue-500 underline hover:text-blue-700"
              >
                Resume & Skills page
              </button>{' '}
              to get personalised job suggestions.
            </p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {recommendations.map((job, i) => (
              <div
                key={job.id}
                className="px-4 py-3 hover:bg-slate-50 transition-colors group"
                style={{ animation: `fadeInUp 0.3s ease-out ${i * 0.05}s both` }}
              >
                <div className="flex items-start gap-3">
                  {/* Rank badge */}
                  <div className={`flex-shrink-0 w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold mt-0.5 ${
                    i === 0
                      ? 'bg-amber-100 text-amber-700'
                      : i === 1
                      ? 'bg-slate-100 text-slate-600'
                      : 'bg-slate-50 text-slate-400'
                  }`}>
                    {i === 0 ? <Star size={12} /> : i + 1}
                  </div>

                  {/* Job info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-medium text-slate-800 truncate">{job.title}</p>
                      {job.matchPercentage > 0 && (
                        <span className="text-[10px] font-semibold text-blue-600">
                          {job.matchPercentage}% match
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-1.5 mt-0.5">
                      <Building2 size={11} className="text-slate-400 flex-shrink-0" />
                      <span className="text-xs text-slate-500 truncate">{job.companyName}</span>
                    </div>

                    {/* Match percentage bar */}
                    {job.matchPercentage > 0 && (
                      <div className="mt-2 w-full max-w-[200px]">
                        <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                          <div
                            className="h-full rounded-full transition-all duration-700 ease-out"
                            style={{
                              width: `${job.matchPercentage}%`,
                              background: job.matchPercentage >= 70
                                ? 'linear-gradient(90deg, #22c55e, #16a34a)'
                                : job.matchPercentage >= 40
                                ? 'linear-gradient(90deg, #3b82f6, #2563eb)'
                                : 'linear-gradient(90deg, #94a3b8, #64748b)'
                            }}
                          />
                        </div>
                      </div>
                    )}

                    {/* Matched skill chips */}
                    {job.matchedSkills?.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-2">
                        {job.matchedSkills.slice(0, 5).map((skill, si) => (
                          <span
                            key={si}
                            className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-full text-[10px] font-medium bg-green-50 text-green-700 border border-green-100"
                          >
                            <Zap size={8} />
                            {skill}
                          </span>
                        ))}
                        {job.matchedSkills.length > 5 && (
                          <span className="text-[10px] text-slate-400 self-center">
                            +{job.matchedSkills.length - 5} more
                          </span>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Quick apply button */}
                  <div className="flex items-center gap-2 flex-shrink-0 mt-0.5">
                    <Button
                      variant="primary"
                      size="xs"
                      loading={applying === job.id}
                      onClick={() => handleQuickApply(job.id)}
                    >
                      <Send size={11} /> Apply
                    </Button>
                    <button
                      onClick={() => navigate('/jobs')}
                      className="p-1.5 rounded-md text-slate-300 hover:text-blue-500 hover:bg-blue-50 transition-colors group-hover:text-slate-400"
                      title="View job"
                    >
                      <ArrowRight size={14} />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Recent applications table */}
      <div className="bg-white border border-slate-200 rounded-lg">
        <div className="flex items-center justify-between px-4 py-3 border-b border-slate-200">
          <h2 className="text-sm font-semibold text-slate-700">Recent Applications</h2>
          <Button variant="ghost" size="xs" onClick={() => navigate('/student/applications')}>
            View all →
          </Button>
        </div>

        {loading ? (
          <Spinner />
        ) : applications.length === 0 ? (
          <EmptyState
            title="No applications yet"
            description="Browse jobs and apply to get started"
            action={
              <Button variant="primary" size="sm" onClick={() => navigate('/jobs')}>
                Browse Jobs
              </Button>
            }
          />
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50">
                <th className="px-4 py-2.5 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide">#</th>
                <th className="px-4 py-2.5 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide">Company</th>
                <th className="px-4 py-2.5 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide">Role</th>
                <th className="px-4 py-2.5 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {applications.slice(0, 5).map((app, i) => (
                <tr key={app.jobId || i} className="hover:bg-slate-50 transition-colors">
                  <td className="px-4 py-3 text-slate-400">{i + 1}</td>
                  <td className="px-4 py-3 text-slate-700 font-medium">{app.company || '—'}</td>
                  <td className="px-4 py-3 text-slate-600">{app.jobTitle || '—'}</td>
                  <td className="px-4 py-3"><Badge status={app.status} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <style>{`
        @keyframes fadeInUp {
          from { opacity: 0; transform: translateY(8px); }
          to   { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
}
