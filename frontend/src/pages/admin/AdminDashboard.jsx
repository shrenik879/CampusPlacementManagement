import { useState, useEffect, useCallback } from 'react';
import { Users, Briefcase, Building2, FileText, Bell, Shield, BarChart2, AlertTriangle, CheckCircle, X, Trash2, Search, Flag, Lock, Unlock, Send, ClipboardList } from 'lucide-react';
import { Badge } from '../../components/ui/Badge';
import { Spinner } from '../../components/ui/Spinner';
import Modal from '../../components/ui/Modal';
import toast from 'react-hot-toast';
import {
  getAdminStats, getAdminUsers, getAdminJobs, getAdminApplications,
  getAuditLogs, approveCompany, rejectCompany, blockUser, unblockUser,
  deleteAdminUser, deleteAdminJob, updateJobStatus, toggleJobFlag, broadcastNotification
} from '../../services/adminService';

/* ── Small reusable pieces ─────────────────────────────────── */
function Stat({ icon: Icon, label, value, color = 'blue' }) {
  const c = { blue:'bg-blue-50 text-blue-600 border-blue-100', green:'bg-green-50 text-green-600 border-green-100', purple:'bg-purple-50 text-purple-600 border-purple-100', amber:'bg-amber-50 text-amber-600 border-amber-100', red:'bg-red-50 text-red-600 border-red-100', slate:'bg-slate-50 text-slate-600 border-slate-200' };
  return (
    <div className={`flex flex-col gap-1 p-4 rounded-xl border ${c[color]}`}>
      <Icon size={18}/><p className="text-2xl font-bold mt-1">{value ?? '—'}</p>
      <p className="text-xs font-medium opacity-75">{label}</p>
    </div>
  );
}

function Btn({ children, onClick, variant='default', size='sm', disabled, loading }) {
  const v = { default:'border border-slate-300 text-slate-600 hover:bg-slate-50', primary:'bg-blue-600 text-white hover:bg-blue-700', success:'bg-green-600 text-white hover:bg-green-700', danger:'bg-red-600 text-white hover:bg-red-700', ghost:'text-slate-500 hover:bg-slate-100' };
  const s = { sm:'px-3 py-1.5 text-xs', md:'px-4 py-2 text-sm' };
  return (
    <button onClick={onClick} disabled={disabled||loading}
      className={`flex items-center gap-1.5 rounded-lg font-medium transition-colors disabled:opacity-50 ${v[variant]} ${s[size]}`}>
      {loading ? <span className="w-3 h-3 border-2 border-current border-t-transparent rounded-full animate-spin"/> : children}
    </button>
  );
}

function SearchBar({ value, onChange, placeholder }) {
  return (
    <div className="relative">
      <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400"/>
      <input value={value} onChange={e=>onChange(e.target.value)} placeholder={placeholder}
        className="w-full border border-slate-200 rounded-lg pl-8 pr-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 bg-white"/>
    </div>
  );
}

function Table({ cols, rows, empty='No records found' }) {
  if (!rows.length) return <div className="py-10 text-center text-sm text-slate-400">{empty}</div>;
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead><tr className="border-b border-slate-200 bg-slate-50">
          {cols.map(c=><th key={c} className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide">{c}</th>)}
        </tr></thead>
        <tbody className="divide-y divide-slate-100">{rows}</tbody>
      </table>
    </div>
  );
}

/* ── TAB: Overview ─────────────────────────────────────────── */
function OverviewTab({ stats, pending }) {
  return (
    <div className="space-y-4">
      {pending > 0 && (
        <div className="flex items-center gap-2 px-4 py-3 bg-amber-50 border border-amber-200 rounded-xl text-sm text-amber-700">
          <AlertTriangle size={15}/><strong>{pending}</strong>&nbsp;company account{pending!==1?'s':''} awaiting approval
        </div>
      )}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <Stat icon={Users}     label="Total Users"   value={stats.totalUsers}       color="blue"/>
        <Stat icon={Users}     label="Students"      value={stats.students}         color="green"/>
        <Stat icon={Building2} label="Companies"     value={stats.companies}        color="purple"/>
        <Stat icon={Briefcase} label="Jobs"          value={stats.jobs}             color="amber"/>
        <Stat icon={FileText}  label="Applications"  value={stats.applications}     color="blue"/>
        <Stat icon={AlertTriangle} label="Pending Approvals" value={stats.pendingApprovals} color="amber"/>
        <Stat icon={Lock}      label="Blocked Users" value={stats.blockedUsers}     color="red"/>
        <Stat icon={Flag}      label="Flagged Jobs"  value={stats.flaggedJobs}      color="red"/>
      </div>
    </div>
  );
}

/* ── TAB: Users ─────────────────────────────────────────────── */
function UsersTab({ onRefresh }) {
  const [users, setUsers]         = useState([]);
  const [search, setSearch]       = useState('');
  const [roleFilter, setRoleFilter] = useState('ALL');
  const [page, setPage]           = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [totalElements, setTotalElements] = useState(0);
  const [loading, setLoading]     = useState(true);
  const [confirm, setConfirm]     = useState(null);
  const [busy, setBusy]           = useState({});

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    try {
      const res = await getAdminUsers({ page, size: 20 });
      setUsers(res.data.content || []);
      setTotalPages(res.data.totalPages || 0);
      setTotalElements(res.data.totalElements || 0);
    } catch { toast.error('Failed to load users'); }
    finally { setLoading(false); }
  }, [page]);

  useEffect(() => { fetchUsers(); }, [fetchUsers]);

  const act = async (fn, id, key) => {
    setBusy(b=>({...b,[key]:true}));
    try { await fn(id); toast.success('Done'); fetchUsers(); onRefresh(); }
    catch { toast.error('Action failed'); }
    finally { setBusy(b=>({...b,[key]:false})); }
  };

  const list = users
    .filter(u => roleFilter === 'ALL' || u.role === roleFilter)
    .filter(u => !search || u.name?.toLowerCase().includes(search.toLowerCase()) || u.email?.toLowerCase().includes(search.toLowerCase()));

  return (
    <div className="space-y-3">
      <div className="flex flex-col sm:flex-row gap-2">
        <div className="flex-1"><SearchBar value={search} onChange={setSearch} placeholder="Search name or email…"/></div>
        <div className="flex rounded-lg border border-slate-200 bg-white overflow-hidden">
          {['ALL','STUDENT','COMPANY','ADMIN'].map(r=>(
            <button key={r} onClick={()=>{setRoleFilter(r);setPage(0);}}
              className={`px-3 py-2 text-xs font-medium transition-colors ${roleFilter===r?'bg-blue-600 text-white':'text-slate-500 hover:bg-slate-50'}`}>
              {r==='ALL'?'All':r.charAt(0)+r.slice(1).toLowerCase()}
            </button>
          ))}
        </div>
      </div>
      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
        {loading ? <Spinner/> : (
          <Table cols={['#','Name','Email','Role','Status','Actions']} empty="No users found" rows={list.map((u,i)=>(
            <tr key={u.id} className="hover:bg-slate-50 transition-colors">
              <td className="px-4 py-3 text-slate-400 text-xs">{page * 20 + i + 1}</td>
              <td className="px-4 py-3 font-medium text-slate-700">{u.name}</td>
              <td className="px-4 py-3 text-slate-500 text-xs">{u.email}</td>
              <td className="px-4 py-3"><Badge status={u.role}/></td>
              <td className="px-4 py-3">
                {u.blocked ? <span className="text-xs font-semibold text-red-600 bg-red-50 px-2 py-0.5 rounded-full">Blocked</span>
                 : u.role==='COMPANY' ? <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${u.approved?'text-green-700 bg-green-50':'text-amber-700 bg-amber-50'}`}>{u.approved?'Approved':'Pending'}</span>
                 : <span className="text-xs text-green-600 bg-green-50 px-2 py-0.5 rounded-full">Active</span>}
              </td>
              <td className="px-4 py-3">
                <div className="flex gap-1.5 flex-wrap">
                  {u.blocked
                    ? <Btn variant="success" onClick={()=>act(unblockUser,u.id,`ub${u.id}`)} loading={busy[`ub${u.id}`]}><Unlock size={11}/>Unblock</Btn>
                    : <Btn variant="default" onClick={()=>act(blockUser,u.id,`b${u.id}`)} loading={busy[`b${u.id}`]}><Lock size={11}/>Block</Btn>}
                  <Btn variant="ghost" onClick={()=>setConfirm(u)}><Trash2 size={11} className="text-red-400"/></Btn>
                </div>
              </td>
            </tr>
          ))}/>
        )}
      </div>
      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-xs text-slate-500">Page {page + 1} of {totalPages} · {totalElements} users</p>
          <div className="flex gap-1">
            <Btn disabled={page===0} onClick={()=>setPage(p=>p-1)}>‹ Prev</Btn>
            <Btn disabled={page>=totalPages-1} onClick={()=>setPage(p=>p+1)}>Next ›</Btn>
          </div>
        </div>
      )}
      <Modal isOpen={!!confirm} onClose={()=>setConfirm(null)} title="Delete User?" maxWidth="max-w-sm">
        <p className="text-sm text-slate-600 mb-4">Delete <strong>{confirm?.name}</strong>? This removes all their data.</p>
        <div className="flex gap-2">
          <Btn variant="default" onClick={()=>setConfirm(null)}>Cancel</Btn>
          <Btn variant="danger" onClick={async()=>{await act(deleteAdminUser,confirm.id,'del');setConfirm(null);}}>Delete</Btn>
        </div>
      </Modal>
    </div>
  );
}

/* ── TAB: Companies ─────────────────────────────────────────── */
function CompaniesTab({ onRefresh }) {
  const [companies, setCompanies] = useState([]);
  const [loading, setLoading]     = useState(true);
  const [busy, setBusy]           = useState({});

  const fetchCompanies = useCallback(async () => {
    setLoading(true);
    try {
      const res = await getAdminUsers({ page: 0, size: 200 });
      const all = res.data.content || [];
      setCompanies(all.filter(u => u.role === 'COMPANY'));
    } catch { toast.error('Failed to load companies'); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchCompanies(); }, [fetchCompanies]);

  const act = async (fn, id, key) => {
    setBusy(b=>({...b,[key]:true}));
    try { await fn(id); toast.success('Done'); fetchCompanies(); onRefresh(); }
    catch { toast.error('Failed'); }
    finally { setBusy(b=>({...b,[key]:false})); }
  };

  const pending  = companies.filter(u => !u.approved);
  const approved = companies.filter(u =>  u.approved);

  const Row = ({u}) => (
    <tr className="hover:bg-slate-50 transition-colors">
      <td className="px-4 py-3 font-medium text-slate-700">{u.name}</td>
      <td className="px-4 py-3 text-slate-500 text-xs">{u.email}</td>
      <td className="px-4 py-3">
        {u.approved
          ? <span className="text-xs font-semibold px-2 py-0.5 rounded-full text-green-700 bg-green-50">Approved</span>
          : <span className="text-xs font-semibold px-2 py-0.5 rounded-full text-amber-700 bg-amber-50">Pending</span>}
      </td>
      <td className="px-4 py-3">
        <div className="flex gap-1.5">
          {!u.approved && <Btn variant="success" onClick={()=>act(approveCompany,u.id,`a${u.id}`)} loading={busy[`a${u.id}`]}><CheckCircle size={11}/>Approve</Btn>}
          {u.approved  && <Btn variant="default" onClick={()=>act(rejectCompany,u.id,`r${u.id}`)}  loading={busy[`r${u.id}`]}><X size={11}/>Revoke</Btn>}
        </div>
      </td>
    </tr>
  );

  if (loading) return <Spinner/>;

  return (
    <div className="space-y-5">
      {pending.length > 0 && (
        <div>
          <h3 className="text-sm font-semibold text-amber-700 mb-2 flex items-center gap-1"><AlertTriangle size={14}/>Pending Approval ({pending.length})</h3>
          <div className="bg-white border border-amber-200 rounded-xl overflow-hidden">
            <Table cols={['Company','Email','Status','Action']} rows={pending.map(u=><Row key={u.id} u={u}/>)}/>
          </div>
        </div>
      )}
      <div>
        <h3 className="text-sm font-semibold text-slate-600 mb-2">Approved Companies ({approved.length})</h3>
        <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
          <Table cols={['Company','Email','Status','Action']} rows={approved.map(u=><Row key={u.id} u={u}/>)} empty="No approved companies"/>
        </div>
      </div>
    </div>
  );
}


/* ── TAB: Jobs ───────────────────────────────────────────────── */
function JobsTab({ onRefresh }) {
  const [jobs, setJobs]           = useState([]);
  const [search, setSearch]       = useState('');
  const [page, setPage]           = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [totalElements, setTotalElements] = useState(0);
  const [loading, setLoading]     = useState(true);
  const [busy, setBusy]           = useState({});
  const [confirm, setConfirm]     = useState(null);

  const fetchJobs = useCallback(async () => {
    setLoading(true);
    try {
      const res = await getAdminJobs({ page, size: 15 });
      setJobs(res.data.content || []);
      setTotalPages(res.data.totalPages || 0);
      setTotalElements(res.data.totalElements || 0);
    } catch { toast.error('Failed to load jobs'); }
    finally { setLoading(false); }
  }, [page]);

  useEffect(() => { fetchJobs(); }, [fetchJobs]);

  const act = async (fn, ...args) => {
    const key = args[0]; setBusy(b=>({...b,[key]:true}));
    try { await fn(...args.slice(1)); toast.success('Done'); fetchJobs(); onRefresh(); }
    catch { toast.error('Failed'); }
    finally { setBusy(b=>({...b,[key]:false})); }
  };

  const list = jobs.filter(j=>!search||j.title?.toLowerCase().includes(search.toLowerCase()));

  return (
    <div className="space-y-3">
      <SearchBar value={search} onChange={setSearch} placeholder="Search jobs…"/>
      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
        {loading ? <Spinner/> : (
          <Table cols={['#','Title','Company','Status','Flagged','Actions']} rows={list.map((j,i)=>(
            <tr key={j.id} className="hover:bg-slate-50">
              <td className="px-4 py-3 text-slate-400 text-xs">{page * 15 + i + 1}</td>
              <td className="px-4 py-3 font-medium text-slate-700">{j.title}</td>
              <td className="px-4 py-3 text-slate-500 text-xs">{j.company?.name||'—'}</td>
              <td className="px-4 py-3"><Badge status={j.status||'OPEN'}/></td>
              <td className="px-4 py-3">{j.flagged?<span className="text-xs font-bold text-red-600 flex items-center gap-1"><Flag size={11}/>Flagged</span>:<span className="text-xs text-slate-400">—</span>}</td>
              <td className="px-4 py-3">
                <div className="flex gap-1.5 flex-wrap">
                  <Btn onClick={()=>act(updateJobStatus,`s${j.id}`,j.id,j.status==='OPEN'?'CLOSED':'OPEN')} loading={busy[`s${j.id}`]}>
                    {j.status==='OPEN'?'Close':'Reopen'}
                  </Btn>
                  <Btn variant={j.flagged?'default':'ghost'} onClick={()=>act(toggleJobFlag,`f${j.id}`,j.id)} loading={busy[`f${j.id}`]}>
                    <Flag size={11}/>{j.flagged?'Unflag':'Flag'}
                  </Btn>
                  <Btn variant="ghost" onClick={()=>setConfirm(j)}><Trash2 size={11} className="text-red-400"/></Btn>
                </div>
              </td>
            </tr>
          ))} empty="No jobs found"/>
        )}
      </div>
      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-xs text-slate-500">Page {page + 1} of {totalPages} · {totalElements} jobs</p>
          <div className="flex gap-1">
            <Btn disabled={page===0} onClick={()=>setPage(p=>p-1)}>‹ Prev</Btn>
            <Btn disabled={page>=totalPages-1} onClick={()=>setPage(p=>p+1)}>Next ›</Btn>
          </div>
        </div>
      )}
      <Modal isOpen={!!confirm} onClose={()=>setConfirm(null)} title="Delete Job?" maxWidth="max-w-sm">
        <p className="text-sm text-slate-600 mb-4">Delete <strong>{confirm?.title}</strong>? All applications will be removed.</p>
        <div className="flex gap-2">
          <Btn variant="default" onClick={()=>setConfirm(null)}>Cancel</Btn>
          <Btn variant="danger" onClick={async()=>{ await act(deleteAdminJob,`del${confirm.id}`,confirm.id); setConfirm(null); }}>Delete</Btn>
        </div>
      </Modal>
    </div>
  );
}

/* ── TAB: Applications ──────────────────────────────────────── */
function ApplicationsTab() {
  const [apps, setApps] = useState([]);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [loading, setLoading] = useState(true);

  useEffect(()=>{ getAdminApplications().then(r=>setApps(r.data||[])).finally(()=>setLoading(false)); },[]);

  const list = apps
    .filter(a=>statusFilter==='ALL'||a.status===statusFilter)
    .filter(a=>!search||a.studentName?.toLowerCase().includes(search.toLowerCase())||a.jobTitle?.toLowerCase().includes(search.toLowerCase())||a.company?.toLowerCase().includes(search.toLowerCase()));

  return (
    <div className="space-y-3">
      <div className="flex flex-col sm:flex-row gap-2">
        <div className="flex-1"><SearchBar value={search} onChange={setSearch} placeholder="Search student, job, company…"/></div>
        <div className="flex rounded-lg border border-slate-200 bg-white overflow-hidden">
          {['ALL','PENDING','IN_PROGRESS','SELECTED','REJECTED'].map(s=>(
            <button key={s} onClick={()=>setStatusFilter(s)}
              className={`px-3 py-2 text-xs font-medium transition-colors ${statusFilter===s?'bg-blue-600 text-white':'text-slate-500 hover:bg-slate-50'}`}>
              {s==='ALL'?'All':s.charAt(0)+s.slice(1).toLowerCase().replace('_',' ')}
            </button>
          ))}
        </div>
      </div>
      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
        {loading ? <Spinner/> : (
          <Table cols={['Student','Job','Company','Status']} rows={list.map(a=>(
            <tr key={a.id} className="hover:bg-slate-50">
              <td className="px-4 py-3"><p className="font-medium text-slate-700 text-sm">{a.studentName}</p><p className="text-xs text-slate-400">{a.studentEmail}</p></td>
              <td className="px-4 py-3 text-slate-600 text-sm">{a.jobTitle}</td>
              <td className="px-4 py-3 text-slate-500 text-xs">{a.company}</td>
              <td className="px-4 py-3"><Badge status={a.status}/></td>
            </tr>
          ))} empty="No applications found"/>
        )}
      </div>
    </div>
  );
}

/* ── TAB: Notifications ─────────────────────────────────────── */
function NotificationsTab() {
  const [msg, setMsg] = useState('');
  const [target, setTarget] = useState('ALL');
  const [sending, setSending] = useState(false);

  const send = async () => {
    if (!msg.trim()) return toast.error('Enter a message');
    setSending(true);
    try { const r = await broadcastNotification(msg.trim(), target); toast.success(r.data); setMsg(''); }
    catch { toast.error('Broadcast failed'); }
    finally { setSending(false); }
  };

  return (
    <div className="max-w-lg space-y-4">
      <div className="bg-blue-50 border border-blue-100 rounded-xl p-4 text-sm text-blue-700">
        Send a notification to all users or a specific role. Students and companies receive it in their notification bell.
      </div>
      <div>
        <label className="block text-xs font-semibold text-slate-600 mb-1">Target Audience</label>
        <div className="flex rounded-lg border border-slate-200 bg-white overflow-hidden w-fit">
          {['ALL','STUDENT','COMPANY'].map(r=>(
            <button key={r} onClick={()=>setTarget(r)}
              className={`px-4 py-2 text-sm font-medium transition-colors ${target===r?'bg-blue-600 text-white':'text-slate-500 hover:bg-slate-50'}`}>
              {r==='ALL'?'Everyone':r.charAt(0)+r.slice(1).toLowerCase()+'s'}
            </button>
          ))}
        </div>
      </div>
      <div>
        <label className="block text-xs font-semibold text-slate-600 mb-1">Message</label>
        <textarea rows={4} value={msg} onChange={e=>setMsg(e.target.value)} placeholder="e.g. System maintenance scheduled for Sunday 2am–4am"
          className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 resize-none"/>
        <p className="text-xs text-slate-400 mt-1">{msg.length}/500 characters</p>
      </div>
      <Btn variant="primary" size="md" onClick={send} loading={sending} disabled={!msg.trim()}>
        <Send size={14}/>Send Broadcast
      </Btn>
    </div>
  );
}

/* ── TAB: Audit Logs ────────────────────────────────────────── */
function AuditLogsTab() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(()=>{ getAuditLogs().then(r=>setLogs(r.data||[])).finally(()=>setLoading(false)); },[]);

  const ACTION_COLOR = { USER_DELETED:'text-red-600 bg-red-50', USER_BLOCKED:'text-red-600 bg-red-50', USER_UNBLOCKED:'text-green-600 bg-green-50', COMPANY_APPROVED:'text-green-600 bg-green-50', COMPANY_REJECTED:'text-amber-600 bg-amber-50', JOB_DELETED:'text-red-600 bg-red-50', JOB_FLAGGED:'text-amber-600 bg-amber-50', JOB_UNFLAGGED:'text-slate-600 bg-slate-100', BROADCAST_SENT:'text-blue-600 bg-blue-50', JOB_STATUS_UPDATED:'text-slate-600 bg-slate-100' };

  return (
    <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
      {loading ? <Spinner/> : (
        <Table cols={['Action','Admin','Target','Details','Time']} empty="No audit logs yet" rows={logs.map(l=>(
          <tr key={l.id} className="hover:bg-slate-50">
            <td className="px-4 py-3">
              <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${ACTION_COLOR[l.action]||'text-slate-600 bg-slate-100'}`}>
                {l.action.replace(/_/g,' ')}
              </span>
            </td>
            <td className="px-4 py-3 text-xs text-slate-500">{l.adminEmail}</td>
            <td className="px-4 py-3 text-sm font-medium text-slate-700">{l.targetName}</td>
            <td className="px-4 py-3 text-xs text-slate-400 max-w-[200px] truncate">{l.details}</td>
            <td className="px-4 py-3 text-xs text-slate-400 whitespace-nowrap">
              {l.timestamp ? new Date(l.timestamp).toLocaleString() : '—'}
            </td>
          </tr>
        ))}/>
      )}
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════
   MAIN AdminDashboard
══════════════════════════════════════════════════════════════ */
const TABS = [
  { id:'overview',      label:'Overview',      icon:BarChart2 },
  { id:'users',         label:'Users',         icon:Users },
  { id:'companies',     label:'Companies',     icon:Building2 },
  { id:'jobs',          label:'Jobs',          icon:Briefcase },
  { id:'applications',  label:'Applications',  icon:FileText },
  { id:'notifications', label:'Broadcast',     icon:Bell },
  { id:'audit',         label:'Audit Logs',    icon:ClipboardList },
];

export default function AdminDashboard() {
  const [tab, setTab] = useState('overview');
  const [stats, setStats] = useState({});
  const [loading, setLoading] = useState(true);

  const refresh = async () => {
    try {
      const [s] = await Promise.all([getAdminStats()]);
      setStats(s.data || {});
    } catch { toast.error('Failed to load data'); }
    finally { setLoading(false); }
  };

  useEffect(()=>{ refresh(); }, []);

  const pending = stats.pendingApprovals || 0;

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-lg font-bold text-slate-800 flex items-center gap-2"><Shield size={18} className="text-purple-600"/>Admin Panel</h1>
          <p className="text-xs text-slate-500 mt-0.5">Manage users, companies, jobs, and platform settings</p>
        </div>
        {pending>0&&<span className="flex items-center gap-1 px-3 py-1.5 bg-amber-50 border border-amber-200 rounded-full text-xs font-semibold text-amber-700"><AlertTriangle size={12}/>{pending} pending</span>}
      </div>

      {/* Tab nav */}
      <div className="flex border-b border-slate-200 overflow-x-auto gap-0">
        {TABS.map(({id,label,icon:Icon})=>(
          <button key={id} onClick={()=>setTab(id)}
            className={`flex items-center gap-1.5 px-4 py-3 text-sm font-medium whitespace-nowrap border-b-2 -mb-px transition-colors
              ${tab===id?'border-blue-600 text-blue-700 bg-blue-50/40':'border-transparent text-slate-500 hover:text-slate-700 hover:bg-slate-50'}`}>
            <Icon size={14}/>{label}
            {id==='companies'&&pending>0&&<span className="ml-1 px-1.5 py-0.5 bg-amber-500 text-white text-[10px] font-bold rounded-full">{pending}</span>}
          </button>
        ))}
      </div>

      {/* Tab content */}
      <div>
        {loading && tab==='overview' ? <Spinner/> : (
          <>
            {tab==='overview'      && <OverviewTab stats={stats} pending={pending}/>}
            {tab==='users'         && <UsersTab onRefresh={refresh}/>}
            {tab==='companies'     && <CompaniesTab onRefresh={refresh}/>}
            {tab==='jobs'          && <JobsTab onRefresh={refresh}/>}
            {tab==='applications'  && <ApplicationsTab/>}
            {tab==='notifications' && <NotificationsTab/>}
            {tab==='audit'         && <AuditLogsTab/>}
          </>
        )}
      </div>
    </div>
  );
}
