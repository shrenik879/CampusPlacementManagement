import { useState, useEffect, useCallback } from 'react';
import { getJobs } from '../../services/jobService';
import { applyJob } from '../../services/applicationService';
import { useAuth } from '../../context/AuthContext';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { EmptyState } from '../../components/ui/EmptyState';
import { SkeletonRow } from '../../components/ui/Spinner';
import PageHeader from '../../components/ui/PageHeader';
import { Search, ChevronLeft, ChevronRight } from 'lucide-react';
import toast from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';

export default function JobListingsPage() {
  const { user }   = useAuth();
  const navigate   = useNavigate();
  const [jobs, setJobs]         = useState([]);
  const [loading, setLoading]   = useState(true);
  const [applying, setApplying] = useState(null);
  const [title, setTitle]       = useState('');
  const [status, setStatus]     = useState('');
  const [page, setPage]         = useState(0);
  const [totalPages, setTotalPages]     = useState(0);
  const [totalElements, setTotalElements] = useState(0);

  const fetchJobs = useCallback(async () => {
    setLoading(true);
    try {
      const params = { page, size: 10 };
      if (title)  params.title  = title;
      if (status) params.status = status;
      const res = await getJobs(params);
      setJobs(res.data.content || []);
      setTotalPages(res.data.totalPages || 0);
      setTotalElements(res.data.totalElements || 0);
    } catch {
      toast.error('Failed to load jobs');
    } finally {
      setLoading(false);
    }
  }, [page, title, status]);

  useEffect(() => { fetchJobs(); }, [fetchJobs]);

  const handleApply = async (jobId) => {
    if (!user?.resumeUrl) {
      toast.error('Please upload your resume before applying');
      navigate('/student/resume');
      return;
    }
    setApplying(jobId);
    try {
      await applyJob(jobId);
      toast.success('Application submitted successfully');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to apply');
    } finally {
      setApplying(null);
    }
  };

  return (
    <div>
      <PageHeader
        title="Job Listings"
        subtitle={`${totalElements} position${totalElements !== 1 ? 's' : ''} available`}
      />

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-2 mb-4">
        <div className="relative flex-1">
          <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search by job title..."
            value={title}
            onChange={(e) => { setTitle(e.target.value); setPage(0); }}
            className="w-full border border-slate-300 rounded px-3 py-2 pl-8 text-sm text-slate-700 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-blue-400 bg-white"
          />
        </div>
        <select
          value={status}
          onChange={(e) => { setStatus(e.target.value); setPage(0); }}
          className="border border-slate-300 bg-white rounded px-3 py-2 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-blue-400"
        >
          <option value="">All Statuses</option>
          <option value="OPEN">Open</option>
          <option value="CLOSED">Closed</option>
        </select>
      </div>

      {/* Table */}
      <div className="bg-white border border-slate-200 rounded-lg overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-slate-200 bg-slate-50">
              <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide">Company</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide">Role</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide">Description</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide">Status</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide">Posted</th>
              {user?.role === 'STUDENT' && (
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide">Action</th>
              )}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {loading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <SkeletonRow key={i} cols={user?.role === 'STUDENT' ? 6 : 5} />
              ))
            ) : jobs.length === 0 ? (
              <tr>
                <td colSpan={user?.role === 'STUDENT' ? 6 : 5} className="py-0">
                  <EmptyState title="No jobs found" description="Try adjusting your search or filters" />
                </td>
              </tr>
            ) : (
              jobs.map((job) => (
                <tr key={job.id} className="hover:bg-slate-50 transition-colors">
                  <td className="px-4 py-3 font-medium text-slate-700">
                    {job.company?.name || '—'}
                  </td>
                  <td className="px-4 py-3 text-slate-700">{job.title}</td>
                  <td className="px-4 py-3 text-slate-500 min-w-[300px] whitespace-pre-wrap">
                    {job.description}
                  </td>
                  <td className="px-4 py-3">
                    <Badge status={job.status || 'OPEN'} />
                  </td>
                  <td className="px-4 py-3 text-slate-400 whitespace-nowrap">
                    {job.createdAt
                      ? new Date(job.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })
                      : '—'}
                  </td>
                  {user?.role === 'STUDENT' && (
                    <td className="px-4 py-3">
                      {job.status !== 'CLOSED' ? (
                        <Button
                          variant="primary"
                          size="xs"
                          loading={applying === job.id}
                          onClick={() => handleApply(job.id)}
                        >
                          Apply
                        </Button>
                      ) : (
                        <span className="text-xs text-slate-400">Closed</span>
                      )}
                    </td>
                  )}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between mt-4">
          <p className="text-xs text-slate-500">
            Page {page + 1} of {totalPages} · {totalElements} total
          </p>
          <div className="flex items-center gap-1">
            <Button variant="secondary" size="xs" disabled={page === 0} onClick={() => setPage(p => p - 1)}>
              <ChevronLeft size={13} /> Prev
            </Button>
            <Button variant="secondary" size="xs" disabled={page >= totalPages - 1} onClick={() => setPage(p => p + 1)}>
              Next <ChevronRight size={13} />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
