import { useEffect, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { getJobs, postJob, closeJob } from '../../services/jobService';
import { getApplicants, updateStatus, downloadApplicantResume, getRounds, updateRound } from '../../services/applicationService';
import { StatCard } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { Spinner } from '../../components/ui/Spinner';
import { EmptyState } from '../../components/ui/EmptyState';
import Modal from '../../components/ui/Modal';
import { Input, Textarea } from '../../components/ui/Input';
import PageHeader from '../../components/ui/PageHeader';
import {
  Briefcase, Users, CheckCircle, XCircle, Download, Plus, Eye, Search,
  Trash2, ListChecks, ChevronDown, ChevronUp, MessageSquare
} from 'lucide-react';
import toast from 'react-hot-toast';

// Default round presets
const DEFAULT_ROUNDS = [
  'Aptitude Test', 'Coding Round', 'Technical Interview', 'HR Interview'
];

export default function CompanyDashboard() {
  const { user } = useAuth();

  const [jobs, setJobs]               = useState([]);
  const [loadingJobs, setLoadingJobs] = useState(true);
  const [showPostModal, setShowPostModal] = useState(false);
  const [form, setForm]               = useState({ title: '', description: '', rounds: [...DEFAULT_ROUNDS] });
  const [posting, setPosting]         = useState(false);
  const [customRound, setCustomRound] = useState('');

  const [selectedJob, setSelectedJob]     = useState(null);
  const [applicants, setApplicants]       = useState([]);
  const [loadingApps, setLoadingApps]     = useState(false);
  const [updating, setUpdating]           = useState(null);
  const [jobSearch, setJobSearch]         = useState('');
  const [jobFilter, setJobFilter]         = useState('ALL');

  // Round tracking for expanded applicant
  const [expandedApp, setExpandedApp]     = useState(null);
  const [rounds, setRounds]               = useState([]);
  const [loadingRounds, setLoadingRounds] = useState(false);
  const [feedbackInput, setFeedbackInput] = useState('');
  const [scoreInput, setScoreInput]       = useState('');

  // ── Fetch my jobs ─────────────────────────────────────────────────────────
  const fetchJobs = async () => {
    setLoadingJobs(true);
    try {
      const res = await getJobs({ size: 100 });
      const all = res.data?.content || [];
      setJobs(all.filter(j => j.company?.id === user?.id));
    } catch {
      toast.error('Failed to load jobs');
    } finally {
      setLoadingJobs(false);
    }
  };

  useEffect(() => { fetchJobs(); }, []);

  // ── Round management ──────────────────────────────────────────────────────
  const addRound = () => {
    if (!customRound.trim()) return;
    if (form.rounds.includes(customRound.trim())) return toast.error('Round already exists');
    setForm({ ...form, rounds: [...form.rounds, customRound.trim()] });
    setCustomRound('');
  };

  const removeRound = (index) => {
    setForm({ ...form, rounds: form.rounds.filter((_, i) => i !== index) });
  };

  // ── Post job ──────────────────────────────────────────────────────────────
  const handlePostJob = async (e) => {
    e.preventDefault();
    if (!form.title.trim() || !form.description.trim()) return toast.error('All fields required');
    if (form.rounds.length === 0) return toast.error('Add at least one recruitment round');
    setPosting(true);
    try {
      await postJob(form);
      toast.success('Job posted with ' + form.rounds.length + ' rounds');
      setShowPostModal(false);
      setForm({ title: '', description: '', rounds: [...DEFAULT_ROUNDS] });
      fetchJobs();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to post job');
    } finally {
      setPosting(false);
    }
  };

  // ── Close job ─────────────────────────────────────────────────────────────
  const handleCloseJob = async (jobId) => {
    if (!window.confirm("Are you sure you want to close this job?")) return;
    try {
      await closeJob(jobId);
      toast.success('Job closed successfully');
      fetchJobs();
      if (selectedJob?.id === jobId) {
        setSelectedJob(prev => ({ ...prev, status: 'CLOSED' }));
      }
    } catch {
      toast.error('Failed to close job');
    }
  };

  // ── View applicants ───────────────────────────────────────────────────────
  const handleViewApplicants = async (job) => {
    setSelectedJob(job);
    setExpandedApp(null);
    setLoadingApps(true);
    try {
      const res = await getApplicants(job.id);
      setApplicants(res.data || []);
    } catch {
      toast.error('Failed to load applicants');
    } finally {
      setLoadingApps(false);
    }
  };

  // ── Update applicant status ───────────────────────────────────────────────
  const handleStatus = async (appId, status) => {
    setUpdating(appId);
    try {
      await updateStatus(appId, status);
      toast.success(status === 'SELECTED' ? 'Resume shortlisted — rounds created!' : 'Applicant rejected');
      handleViewApplicants(selectedJob);
    } catch {
      toast.error('Failed to update status');
    } finally {
      setUpdating(null);
    }
  };

  // ── Download resume ───────────────────────────────────────────────────────
  const handleDownloadResume = async (resumeUrl) => {
    try {
      const res = await downloadApplicantResume(resumeUrl);
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const a = document.createElement('a');
      a.href = url; a.download = 'resume.pdf'; a.click();
    } catch {
      toast.error('Failed to download resume');
    }
  };

  // ── View rounds for applicant ─────────────────────────────────────────────
  const handleToggleRounds = async (appId) => {
    if (expandedApp === appId) {
      setExpandedApp(null);
      return;
    }
    setExpandedApp(appId);
    setLoadingRounds(true);
    setFeedbackInput('');
    setScoreInput('');
    try {
      const res = await getRounds(appId);
      setRounds(res.data || []);
    } catch {
      setRounds([]);
    } finally {
      setLoadingRounds(false);
    }
  };

  // ── Update round status ───────────────────────────────────────────────────
  const handleUpdateRound = async (roundId, status) => {
    try {
      await updateRound({
        roundId,
        status,
        feedback: feedbackInput || null,
        score: scoreInput ? parseInt(scoreInput) : null,
      });
      toast.success(`Round ${status.toLowerCase()}`);
      setFeedbackInput('');
      setScoreInput('');
      // Refresh rounds and applicants
      const res = await getRounds(expandedApp);
      setRounds(res.data || []);
      handleViewApplicants(selectedJob);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update round');
    }
  };

  const activeJobs = jobs.filter(j => j.status !== 'CLOSED').length;

  const filteredJobs = jobs
    .filter(j => !jobSearch || j.title?.toLowerCase().includes(jobSearch.toLowerCase()))
    .filter(j => jobFilter === 'ALL' || j.status === jobFilter);

  return (
    <div>
      <PageHeader
        title="Company Dashboard"
        subtitle={user?.name}
        action={
          <Button variant="primary" size="sm" onClick={() => setShowPostModal(true)}>
            <Plus size={14} /> Post Job
          </Button>
        }
      />

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-6">
        <StatCard icon={Briefcase} label="Jobs Posted"  value={jobs.length}  color="blue"  />
        <StatCard icon={Users}     label="Active Jobs"  value={activeJobs}   color="green" />
        <StatCard icon={Users}     label="Selected Job" value={selectedJob ? selectedJob.title : '—'} color="slate" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Posted jobs table */}
        <div className="bg-white border border-slate-200 rounded-lg overflow-hidden">
          <div className="flex items-center justify-between px-4 py-3 border-b border-slate-200">
            <h2 className="text-sm font-semibold text-slate-700">My Job Postings</h2>
            <span className="text-xs text-slate-400">{filteredJobs.length} of {jobs.length}</span>
          </div>

          {/* Search + filter */}
          {jobs.length > 0 && (
            <div className="flex items-center gap-2 px-4 py-2.5 border-b border-slate-100 bg-slate-50/50">
              <div className="relative flex-1">
                <Search size={12} className="absolute left-2 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search jobs..."
                  value={jobSearch}
                  onChange={(e) => setJobSearch(e.target.value)}
                  className="w-full border border-slate-200 rounded px-2.5 py-1.5 pl-7 text-xs text-slate-700 placeholder-slate-400 bg-white focus:outline-none focus:ring-1 focus:ring-blue-400"
                />
              </div>
              <div className="flex rounded border border-slate-200 bg-white overflow-hidden shrink-0">
                {['ALL', 'OPEN', 'CLOSED'].map(f => (
                  <button
                    key={f}
                    onClick={() => setJobFilter(f)}
                    className={`px-2 py-1.5 text-[10px] font-medium transition-colors ${
                      jobFilter === f ? 'bg-blue-600 text-white' : 'text-slate-500 hover:bg-slate-50'
                    }`}
                  >
                    {f === 'ALL' ? 'All' : f.charAt(0) + f.slice(1).toLowerCase()}
                  </button>
                ))}
              </div>
            </div>
          )}

          {loadingJobs ? (
            <Spinner />
          ) : jobs.length === 0 ? (
            <EmptyState
              title="No jobs posted"
              description="Post your first job to start receiving applications"
              action={
                <Button variant="primary" size="sm" onClick={() => setShowPostModal(true)}>
                  <Plus size={13} /> Post Job
                </Button>
              }
            />
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50">
                  <th className="px-4 py-2.5 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide">Role</th>
                  <th className="px-4 py-2.5 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide">Rounds</th>
                  <th className="px-4 py-2.5 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide">Status</th>
                  <th className="px-4 py-2.5 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredJobs.map(job => (
                  <tr
                    key={job.id}
                    className={`hover:bg-slate-50 transition-colors ${selectedJob?.id === job.id ? 'bg-blue-50' : ''}`}
                  >
                    <td className="px-4 py-3 text-slate-700 font-medium">{job.title}</td>
                    <td className="px-4 py-3 text-xs text-slate-500">
                      {job.rounds ? job.rounds.split(',').length + ' rounds' : '—'}
                    </td>
                    <td className="px-4 py-3"><Badge status={job.status || 'OPEN'} /></td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <Button variant="ghost" size="xs" onClick={() => handleViewApplicants(job)}>
                          <Eye size={13} /> Applicants
                        </Button>
                        {job.status !== 'CLOSED' && (
                          <Button variant="danger" size="xs" onClick={() => handleCloseJob(job.id)}>
                            <XCircle size={13} /> Close
                          </Button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* Applicants panel */}
        <div className="bg-white border border-slate-200 rounded-lg overflow-hidden">
          <div className="flex items-center justify-between px-4 py-3 border-b border-slate-200">
            <h2 className="text-sm font-semibold text-slate-700">
              {selectedJob ? `Applicants — ${selectedJob.title}` : 'Applicants'}
            </h2>
            {applicants.length > 0 && (
              <span className="text-xs text-slate-400">{applicants.length} total</span>
            )}
          </div>

          {!selectedJob ? (
            <EmptyState title="Select a job" description="Click a job row on the left to view its applicants" />
          ) : loadingApps ? (
            <Spinner />
          ) : applicants.length === 0 ? (
            <EmptyState title="No applicants yet" description="No one has applied to this job" />
          ) : (
            <div className="divide-y divide-slate-100">
              {applicants.map((app, i) => {
                const isPending = !app.status || app.status === 'PENDING';
                const isInProgress = app.status === 'IN_PROGRESS';
                const isExpanded = expandedApp === app.id;

                return (
                  <div key={app.id || i}>
                    {/* Applicant row */}
                    <div className={`flex items-center justify-between px-4 py-3 hover:bg-slate-50 transition-colors ${isExpanded ? 'bg-blue-50/50' : ''}`}>
                      <div>
                        <p className="text-sm text-slate-700 font-medium">{app.studentName || `Applicant ${i + 1}`}</p>
                        <p className="text-xs text-slate-400">{app.studentEmail || ''}</p>
                      </div>
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <Badge status={app.status || 'PENDING'} />
                        {app.resumeUrl && (
                          <Button variant="secondary" size="xs" onClick={() => handleDownloadResume(app.resumeUrl)}>
                            <Download size={12} />
                          </Button>
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
                        {(isInProgress || app.status === 'SELECTED' || app.status === 'REJECTED') && (
                          <Button variant="ghost" size="xs" onClick={() => handleToggleRounds(app.id)}>
                            <ListChecks size={13} />
                            {isExpanded ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
                          </Button>
                        )}
                      </div>
                    </div>

                    {/* Expanded rounds panel */}
                    {isExpanded && (
                      <div className="px-4 pb-4 bg-slate-50/80">
                        {loadingRounds ? (
                          <div className="py-3 text-center text-xs text-slate-400">Loading rounds...</div>
                        ) : rounds.length === 0 ? (
                          <div className="py-3 text-center text-xs text-slate-400">No rounds found</div>
                        ) : (
                          <div className="space-y-2 pt-2">
                            {rounds.map((round) => {
                              const isActive = round.status === 'PENDING'
                                && rounds.filter(r => r.roundOrder < round.roundOrder)
                                  .every(r => r.status === 'PASSED');
                              return (
                                <div key={round.id} className={`bg-white border rounded-lg p-3 ${
                                  round.status === 'PASSED' ? 'border-green-200' :
                                  round.status === 'FAILED' ? 'border-red-200' :
                                  isActive ? 'border-blue-300 ring-1 ring-blue-100' : 'border-slate-200'
                                }`}>
                                  <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                      <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold ${
                                        round.status === 'PASSED' ? 'bg-green-100 text-green-700' :
                                        round.status === 'FAILED' ? 'bg-red-100 text-red-700' :
                                        'bg-slate-100 text-slate-500'
                                      }`}>
                                        {round.roundOrder}
                                      </span>
                                      <span className="text-sm font-medium text-slate-700">{round.roundName}</span>
                                    </div>
                                    <Badge status={round.status} />
                                  </div>

                                  {/* Score & feedback display */}
                                  {(round.score != null || round.feedback) && (
                                    <div className="mt-2 flex items-center gap-3 text-xs text-slate-500">
                                      {round.score != null && <span>Score: <strong>{round.score}</strong></span>}
                                      {round.feedback && <span className="flex items-center gap-1"><MessageSquare size={10} /> {round.feedback}</span>}
                                    </div>
                                  )}

                                  {/* Action buttons for active round */}
                                  {isActive && (
                                    <div className="mt-3 space-y-2">
                                      <div className="flex gap-2">
                                        <input
                                          type="number"
                                          placeholder="Score"
                                          value={scoreInput}
                                          onChange={(e) => setScoreInput(e.target.value)}
                                          className="w-20 border border-slate-200 rounded px-2 py-1 text-xs focus:outline-none focus:ring-1 focus:ring-blue-400"
                                        />
                                        <input
                                          type="text"
                                          placeholder="Feedback (optional)"
                                          value={feedbackInput}
                                          onChange={(e) => setFeedbackInput(e.target.value)}
                                          className="flex-1 border border-slate-200 rounded px-2 py-1 text-xs focus:outline-none focus:ring-1 focus:ring-blue-400"
                                        />
                                      </div>
                                      <div className="flex gap-2">
                                        <Button variant="success" size="xs" onClick={() => handleUpdateRound(round.id, 'PASSED')}>
                                          <CheckCircle size={11} /> Pass
                                        </Button>
                                        <Button variant="danger" size="xs" onClick={() => handleUpdateRound(round.id, 'FAILED')}>
                                          <XCircle size={11} /> Fail
                                        </Button>
                                      </div>
                                    </div>
                                  )}
                                </div>
                              );
                            })}
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
      </div>

      {/* Post Job Modal — with Rounds */}
      <Modal isOpen={showPostModal} onClose={() => setShowPostModal(false)} title="Post a New Job" maxWidth="max-w-lg">
        <form onSubmit={handlePostJob} className="flex flex-col gap-4">
          <Input
            label="Job Title"
            placeholder="e.g. Software Engineer"
            value={form.title}
            onChange={e => setForm({ ...form, title: e.target.value })}
            required
          />
          <Textarea
            label="Job Description"
            placeholder="Describe the role, skills required, CTC, location..."
            rows={4}
            value={form.description}
            onChange={e => setForm({ ...form, description: e.target.value })}
            required
          />

          {/* Rounds builder */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">
              Recruitment Rounds ({form.rounds.length})
            </label>
            <div className="space-y-1.5 mb-2">
              {form.rounds.map((r, i) => (
                <div key={i} className="flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-lg px-3 py-2">
                  <span className="w-5 h-5 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center text-[10px] font-bold">{i + 1}</span>
                  <span className="flex-1 text-sm text-slate-700">{r}</span>
                  <button type="button" onClick={() => removeRound(i)} className="text-slate-400 hover:text-red-500 transition-colors">
                    <Trash2 size={13} />
                  </button>
                </div>
              ))}
            </div>
            <div className="flex gap-2">
              <input
                type="text"
                placeholder="Add custom round..."
                value={customRound}
                onChange={(e) => setCustomRound(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addRound(); } }}
                className="flex-1 border border-slate-200 rounded-lg px-3 py-2 text-sm placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-blue-400"
              />
              <Button type="button" variant="secondary" size="sm" onClick={addRound}>
                <Plus size={13} /> Add
              </Button>
            </div>
          </div>

          <div className="flex gap-2 pt-1">
            <Button type="button" variant="secondary" className="flex-1"
              onClick={() => setShowPostModal(false)}>Cancel</Button>
            <Button type="submit" variant="primary" className="flex-1" loading={posting}>
              Post Job
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
