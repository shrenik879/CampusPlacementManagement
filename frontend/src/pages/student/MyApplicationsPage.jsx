import { useEffect, useState, useCallback } from 'react';
import { getMyApplicationsPaged, getRounds } from '../../services/applicationService';
import { Badge } from '../../components/ui/Badge';
import { Spinner } from '../../components/ui/Spinner';
import { EmptyState } from '../../components/ui/EmptyState';
import { Button } from '../../components/ui/Button';
import PageHeader from '../../components/ui/PageHeader';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft, ChevronRight, ListChecks, ChevronDown, ChevronUp, CheckCircle, XCircle, Clock, MessageSquare } from 'lucide-react';
import toast from 'react-hot-toast';

const TABS = ['ALL', 'PENDING', 'IN_PROGRESS', 'SELECTED', 'REJECTED'];
const PAGE_SIZE = 10;

export default function MyApplicationsPage() {
  const [apps, setApps]     = useState([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab]       = useState('ALL');
  const [page, setPage]     = useState(0);
  const [totalPages, setTotalPages]     = useState(0);
  const [totalElements, setTotalElements] = useState(0);
  const navigate            = useNavigate();

  // Round tracking
  const [expandedApp, setExpandedApp] = useState(null);
  const [rounds, setRounds]           = useState([]);
  const [loadingRounds, setLoadingRounds] = useState(false);

  const fetchApps = useCallback(async () => {
    setLoading(true);
    try {
      const params = { page, size: PAGE_SIZE };
      if (tab !== 'ALL') params.status = tab;
      const res = await getMyApplicationsPaged(params);
      setApps(res.data.content || []);
      setTotalPages(res.data.totalPages || 0);
      setTotalElements(res.data.totalElements || 0);
    } catch {
      toast.error('Failed to load applications');
    } finally {
      setLoading(false);
    }
  }, [page, tab]);

  useEffect(() => { fetchApps(); }, [fetchApps]);

  const handleTabChange = (newTab) => {
    setTab(newTab);
    setPage(0);
    setExpandedApp(null);
  };

  // Toggle rounds view for an application
  const handleToggleRounds = async (applicationId) => {
    if (expandedApp === applicationId) {
      setExpandedApp(null);
      return;
    }
    setExpandedApp(applicationId);
    setLoadingRounds(true);
    try {
      const res = await getRounds(applicationId);
      setRounds(res.data || []);
    } catch {
      setRounds([]);
    } finally {
      setLoadingRounds(false);
    }
  };

  // Calculate progress
  const getProgress = () => {
    if (rounds.length === 0) return 0;
    const passed = rounds.filter(r => r.status === 'PASSED').length;
    return Math.round((passed / rounds.length) * 100);
  };

  return (
    <div>
      <PageHeader
        title="My Applications"
        subtitle={`${totalElements} total`}
        action={
          <Button variant="primary" size="sm" onClick={() => navigate('/jobs')}>
            + Apply to Jobs
          </Button>
        }
      />

      {/* Status filter tabs */}
      <div className="flex border-b border-slate-200 mb-4 overflow-x-auto">
        {TABS.map(s => (
          <button
            key={s}
            onClick={() => handleTabChange(s)}
            className={`px-3 py-2.5 text-sm font-medium border-b-2 transition-colors -mb-px whitespace-nowrap ${
              tab === s
                ? 'border-blue-600 text-blue-700'
                : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'
            }`}
          >
            {s === 'ALL' ? 'All' : s === 'IN_PROGRESS' ? 'In Progress' : s.charAt(0) + s.slice(1).toLowerCase()}
          </button>
        ))}
      </div>

      {/* Applications */}
      <div className="bg-white border border-slate-200 rounded-lg overflow-hidden">
        {loading ? (
          <Spinner />
        ) : apps.length === 0 ? (
          <EmptyState
            title={tab === 'ALL' ? 'No applications yet' : `No ${tab.toLowerCase()} applications`}
            description={tab === 'ALL' ? 'Browse jobs and apply to see them here' : ''}
            action={
              tab === 'ALL' ? (
                <Button variant="primary" size="sm" onClick={() => navigate('/jobs')}>Browse Jobs</Button>
              ) : null
            }
          />
        ) : (
          <div>
            {/* Table header */}
            <div className="grid grid-cols-12 gap-2 px-4 py-3 border-b border-slate-200 bg-slate-50">
              <div className="col-span-1 text-xs font-semibold text-slate-500 uppercase">#</div>
              <div className="col-span-3 text-xs font-semibold text-slate-500 uppercase">Company</div>
              <div className="col-span-3 text-xs font-semibold text-slate-500 uppercase">Role</div>
              <div className="col-span-2 text-xs font-semibold text-slate-500 uppercase">Status</div>
              <div className="col-span-3 text-xs font-semibold text-slate-500 uppercase">Rounds</div>
            </div>

            {/* Application rows */}
            {apps.map((app, i) => {
              const isExpanded = expandedApp === app.applicationId;
              const showRoundsBtn = app.hasRounds || app.status === 'IN_PROGRESS';

              return (
                <div key={app.applicationId || i}>
                  {/* Main row */}
                  <div className={`grid grid-cols-12 gap-2 px-4 py-3 items-center border-b border-slate-100 hover:bg-slate-50 transition-colors ${isExpanded ? 'bg-blue-50/50' : ''}`}>
                    <div className="col-span-1 text-sm text-slate-400">{page * PAGE_SIZE + i + 1}</div>
                    <div className="col-span-3 text-sm text-slate-700 font-medium">{app.company || '—'}</div>
                    <div className="col-span-3 text-sm text-slate-600">{app.jobTitle || '—'}</div>
                    <div className="col-span-2"><Badge status={app.status} /></div>
                    <div className="col-span-3">
                      {showRoundsBtn ? (
                        <Button variant="ghost" size="xs" onClick={() => handleToggleRounds(app.applicationId)}>
                          <ListChecks size={13} />
                          Track Rounds
                          {isExpanded ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
                        </Button>
                      ) : (
                        <span className="text-xs text-slate-400">—</span>
                      )}
                    </div>
                  </div>

                  {/* Expanded round tracker */}
                  {isExpanded && (
                    <div className="px-4 py-4 bg-gradient-to-b from-blue-50/50 to-white border-b border-slate-200">
                      {loadingRounds ? (
                        <div className="text-center py-3 text-xs text-slate-400">Loading rounds...</div>
                      ) : rounds.length === 0 ? (
                        <div className="text-center py-3 text-xs text-slate-400">No rounds found</div>
                      ) : (
                        <div>
                          {/* Progress bar */}
                          <div className="mb-4">
                            <div className="flex items-center justify-between mb-1.5">
                              <span className="text-xs font-medium text-slate-600">
                                Progress: {rounds.filter(r => r.status === 'PASSED').length} / {rounds.length} rounds
                              </span>
                              <span className="text-xs font-bold text-blue-600">{getProgress()}%</span>
                            </div>
                            <div className="w-full h-2 bg-slate-200 rounded-full overflow-hidden">
                              <div
                                className="h-full rounded-full transition-all duration-500"
                                style={{
                                  width: getProgress() + '%',
                                  background: rounds.some(r => r.status === 'FAILED') ? '#ef4444' : '#22c55e',
                                }}
                              />
                            </div>
                          </div>

                          {/* Round timeline */}
                          <div className="space-y-0">
                            {rounds.map((round, idx) => (
                              <div key={round.id} className="flex gap-3">
                                {/* Timeline line */}
                                <div className="flex flex-col items-center">
                                  <div className={`w-7 h-7 rounded-full flex items-center justify-center ${
                                    round.status === 'PASSED' ? 'bg-green-500 text-white' :
                                    round.status === 'FAILED' ? 'bg-red-500 text-white' :
                                    'bg-slate-200 text-slate-500'
                                  }`}>
                                    {round.status === 'PASSED' ? <CheckCircle size={14} /> :
                                     round.status === 'FAILED' ? <XCircle size={14} /> :
                                     <Clock size={14} />}
                                  </div>
                                  {idx < rounds.length - 1 && (
                                    <div className={`w-0.5 h-8 ${
                                      round.status === 'PASSED' ? 'bg-green-300' :
                                      round.status === 'FAILED' ? 'bg-red-300' :
                                      'bg-slate-200'
                                    }`} />
                                  )}
                                </div>

                                {/* Round details */}
                                <div className="flex-1 pb-4">
                                  <div className="flex items-center gap-2">
                                    <span className="text-sm font-medium text-slate-700">{round.roundName}</span>
                                    <Badge status={round.status} />
                                  </div>
                                  {(round.score != null || round.feedback) && (
                                    <div className="mt-1 flex items-center gap-3 text-xs text-slate-500">
                                      {round.score != null && <span>Score: <strong className="text-slate-700">{round.score}</strong></span>}
                                      {round.feedback && (
                                        <span className="flex items-center gap-1">
                                          <MessageSquare size={10} /> {round.feedback}
                                        </span>
                                      )}
                                    </div>
                                  )}
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
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
