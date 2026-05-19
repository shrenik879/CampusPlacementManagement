import { useEffect, useState, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getApplicantsPaged, updateStatus } from '../../services/applicationService';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { Spinner } from '../../components/ui/Spinner';
import { EmptyState } from '../../components/ui/EmptyState';
import PageHeader from '../../components/ui/PageHeader';
import { CheckCircle, XCircle, Download, ArrowLeft, ChevronLeft, ChevronRight } from 'lucide-react';
import toast from 'react-hot-toast';

const TABS = ['ALL', 'PENDING', 'IN_PROGRESS', 'SELECTED', 'REJECTED'];
const PAGE_SIZE = 10;

export default function ApplicantsPage() {
  const { jobId } = useParams();
  const navigate  = useNavigate();

  const [applicants, setApplicants] = useState([]);
  const [loading, setLoading]       = useState(true);
  const [updating, setUpdating]     = useState(null);
  const [tab, setTab]               = useState('ALL');
  const [page, setPage]             = useState(0);
  const [totalPages, setTotalPages]     = useState(0);
  const [totalElements, setTotalElements] = useState(0);

  const fetchApplicants = useCallback(async () => {
    setLoading(true);
    try {
      const params = { page, size: PAGE_SIZE };
      if (tab !== 'ALL') params.status = tab;
      const res = await getApplicantsPaged(jobId, params);
      setApplicants(res.data.content || []);
      setTotalPages(res.data.totalPages || 0);
      setTotalElements(res.data.totalElements || 0);
    } catch {
      toast.error('Failed to load applicants');
    } finally {
      setLoading(false);
    }
  }, [jobId, page, tab]);

  useEffect(() => { fetchApplicants(); }, [fetchApplicants]);

  const handleTabChange = (newTab) => { setTab(newTab); setPage(0); };

  const handleStatus = async (id, status) => {
    setUpdating(id);
    try {
      await updateStatus(id, status);
      toast.success(`Marked as ${status}`);
      fetchApplicants();
    } catch {
      toast.error('Failed to update');
    } finally {
      setUpdating(null);
    }
  };

  return (
    <div>
      <PageHeader
        title="Applicants"
        subtitle={`${totalElements} total`}
        action={
          <Button variant="secondary" size="sm" onClick={() => navigate(-1)}>
            <ArrowLeft size={13} /> Back
          </Button>
        }
      />

      {/* Status filter tabs */}
      <div className="flex border-b border-slate-200 mb-4 overflow-x-auto">
        {TABS.map(s => (
          <button key={s} onClick={() => handleTabChange(s)}
            className={`px-4 py-2.5 text-sm font-medium border-b-2 -mb-px transition-colors whitespace-nowrap ${
              tab === s
                ? 'border-blue-600 text-blue-700'
                : 'border-transparent text-slate-500 hover:text-slate-700'
            }`}
          >
            {s === 'ALL' ? 'All' : s === 'IN_PROGRESS' ? 'In Progress' : s.charAt(0) + s.slice(1).toLowerCase()}
          </button>
        ))}
      </div>

      {/* Table */}
      <div className="bg-white border border-slate-200 rounded-lg overflow-hidden">
        {loading ? (
          <Spinner />
        ) : applicants.length === 0 ? (
          <EmptyState
            title="No applicants"
            description={tab !== 'ALL' ? `No ${tab.toLowerCase()} applicants` : 'No one has applied yet'}
          />
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50">
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide">#</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide">Name</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide">Email</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide">Status</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {applicants.map((app, i) => {
                const isPending = !app.status || app.status === 'PENDING';
                return (
                  <tr key={app.id || i} className="hover:bg-slate-50 transition-colors">
                    <td className="px-4 py-3 text-slate-400">{page * PAGE_SIZE + i + 1}</td>
                    <td className="px-4 py-3 text-slate-700 font-medium">{app.studentName || `Applicant ${i + 1}`}</td>
                    <td className="px-4 py-3 text-slate-500">{app.studentEmail || '—'}</td>
                    <td className="px-4 py-3"><Badge status={app.status || 'PENDING'} /></td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1.5">
                        {app.resumeUrl && (
                          <a href={`/api/applications/download-resume/admin?publicId=${encodeURIComponent(app.resumeUrl)}`}
                            target="_blank" rel="noopener noreferrer">
                            <Button variant="secondary" size="xs"><Download size={12} /> Resume</Button>
                          </a>
                        )}
                        {isPending && (
                          <>
                            <Button variant="success" size="xs"
                              loading={updating === app.id}
                              onClick={() => handleStatus(app.id, 'SELECTED')}>
                              <CheckCircle size={12} /> Select
                            </Button>
                            <Button variant="danger" size="xs"
                              loading={updating === app.id}
                              onClick={() => handleStatus(app.id, 'REJECTED')}>
                              <XCircle size={12} /> Reject
                            </Button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between mt-4">
          <p className="text-xs text-slate-500">
            Page {page + 1} of {totalPages} · {totalElements} total applicants
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
