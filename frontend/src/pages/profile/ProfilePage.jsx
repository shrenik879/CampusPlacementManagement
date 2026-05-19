import { useState, useEffect, useRef } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { getProfile, updateProfile } from '../../services/profileService';
import { updateSkills, uploadResume, downloadResume } from '../../services/applicationService';
import api from '../../services/api';
import {
  User, Mail, Shield, Briefcase, FileText, LogOut,
  Edit3, Save, X, KeyRound, CheckCircle, Upload,
  Download, Eye, Zap, BarChart2, TrendingUp,
  GraduationCap, Building2, Users, Star, Clock
} from 'lucide-react';
import toast from 'react-hot-toast';

/* ── helpers ─────────────────────────────────────────────────────── */
const ROLE_STYLE = {
  STUDENT: { bg: 'from-blue-600 to-blue-700',    badge: 'bg-blue-100 text-blue-700',    icon: GraduationCap },
  COMPANY: { bg: 'from-emerald-600 to-teal-700', badge: 'bg-emerald-100 text-emerald-700', icon: Building2 },
  ADMIN:   { bg: 'from-purple-600 to-purple-700',badge: 'bg-purple-100 text-purple-700', icon: Shield },
};

function StatCard({ icon: Icon, label, value, color = 'blue' }) {
  const colors = {
    blue:  'bg-blue-50 text-blue-600 border-blue-100',
    green: 'bg-green-50 text-green-600 border-green-100',
    red:   'bg-red-50 text-red-600 border-red-100',
    amber: 'bg-amber-50 text-amber-600 border-amber-100',
    purple:'bg-purple-50 text-purple-600 border-purple-100',
  };
  return (
    <div className={`flex flex-col gap-1 p-4 rounded-xl border ${colors[color]}`}>
      <Icon size={18} />
      <p className="text-2xl font-bold mt-1">{value ?? '—'}</p>
      <p className="text-xs font-medium opacity-75">{label}</p>
    </div>
  );
}

/* ── Change Password inline section ─────────────────────────────── */
function ChangePasswordSection() {
  const [form, setForm] = useState({ email: '', oldPassword: '', newPassword: '', confirmPassword: '' });
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);

  useEffect(() => { if (user?.email) setForm(f => ({ ...f, email: user.email })); }, [user]);

  const handle = async (e) => {
    e.preventDefault();
    if (form.newPassword !== form.confirmPassword) return toast.error('Passwords do not match');
    if (form.newPassword.length < 6) return toast.error('Minimum 6 characters');
    setLoading(true);
    try {
      await api.post('/auth/change-password', form);
      toast.success('Password changed successfully!');
      setForm(f => ({ ...f, oldPassword: '', newPassword: '', confirmPassword: '' }));
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to change password');
    } finally { setLoading(false); }
  };

  const inp = 'w-full border border-slate-200 rounded-lg px-3 py-2.5 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent transition bg-white';

  return (
    <form onSubmit={handle} className="space-y-3 max-w-md">
      <div>
        <label className="block text-xs font-medium text-slate-600 mb-1">Current Password</label>
        <input type="password" required className={inp} placeholder="••••••••"
          value={form.oldPassword} onChange={e => setForm(f => ({ ...f, oldPassword: e.target.value }))} />
      </div>
      <div>
        <label className="block text-xs font-medium text-slate-600 mb-1">New Password</label>
        <input type="password" required minLength={6} className={inp} placeholder="••••••••"
          value={form.newPassword} onChange={e => setForm(f => ({ ...f, newPassword: e.target.value }))} />
      </div>
      <div>
        <label className="block text-xs font-medium text-slate-600 mb-1">Confirm New Password</label>
        <input type="password" required className={inp} placeholder="••••••••"
          value={form.confirmPassword} onChange={e => setForm(f => ({ ...f, confirmPassword: e.target.value }))} />
      </div>
      <button type="submit" disabled={loading}
        className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white text-sm font-semibold rounded-lg hover:bg-blue-700 disabled:opacity-60 transition">
        <KeyRound size={14} />
        {loading ? 'Saving…' : 'Update Password'}
      </button>
    </form>
  );
}

/* ── Skills editor ───────────────────────────────────────────────── */
function SkillsEditor({ value, onChange, onSave, saving }) {
  const tags = value ? value.split(',').map(s => s.trim()).filter(Boolean) : [];
  const [input, setInput] = useState('');

  const add = () => {
    const trimmed = input.trim();
    if (!trimmed || tags.includes(trimmed)) { setInput(''); return; }
    onChange([...tags, trimmed].join(', '));
    setInput('');
  };

  const remove = (tag) => onChange(tags.filter(t => t !== tag).join(', '));

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-2 min-h-[40px] p-2 border border-slate-200 rounded-lg bg-slate-50">
        {tags.map(tag => (
          <span key={tag} className="flex items-center gap-1 px-2.5 py-1 bg-blue-100 text-blue-700 rounded-full text-xs font-medium">
            {tag}
            <button type="button" onClick={() => remove(tag)} className="hover:text-red-500 transition-colors">
              <X size={11} />
            </button>
          </span>
        ))}
        {tags.length === 0 && <span className="text-xs text-slate-400 p-1">No skills added yet</span>}
      </div>
      <div className="flex gap-2">
        <input
          className="flex-1 border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 transition"
          placeholder="Type a skill and press Enter…"
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); add(); } }}
        />
        <button type="button" onClick={add}
          className="px-3 py-2 bg-slate-100 text-slate-600 rounded-lg hover:bg-blue-50 hover:text-blue-600 text-sm transition">
          Add
        </button>
      </div>
      <button onClick={onSave} disabled={saving}
        className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white text-sm font-semibold rounded-lg hover:bg-blue-700 disabled:opacity-60 transition">
        <Save size={14} />{saving ? 'Saving…' : 'Save Skills'}
      </button>
    </div>
  );
}

/* ── Resume section ──────────────────────────────────────────────── */
function ResumeSection({ profile }) {
  const { user, updateUser } = useAuth();
  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const fileRef = useRef();
  const hasResume = profile?.stats?.hasResume || user?.resumeUrl;

  const handleUpload = async () => {
    if (!file) return toast.error('Select a PDF file');
    if (file.type !== 'application/pdf') return toast.error('PDF only');
    if (file.size > 5 * 1024 * 1024) return toast.error('Max 5 MB');
    setUploading(true);
    try {
      const res = await uploadResume(file);
      const updated = { ...user };
      if (res.data?.resumeUrl) updated.resumeUrl = res.data.resumeUrl;
      if (res.data?.skills)    updated.skills    = res.data.skills;
      updateUser(updated);
      setFile(null);
      toast.success('Resume uploaded!');
    } catch (err) { toast.error(err.response?.data?.message || 'Upload failed'); }
    finally { setUploading(false); }
  };

  const handleView = async () => {
    try {
      const res = await downloadResume();
      const url = URL.createObjectURL(new Blob([res.data], { type: 'application/pdf' }));
      window.open(url, '_blank');
      setTimeout(() => URL.revokeObjectURL(url), 30000);
    } catch { toast.error('Could not load resume'); }
  };

  const handleDownload = async () => {
    setDownloading(true);
    try {
      const res = await downloadResume();
      const url = URL.createObjectURL(new Blob([res.data], { type: 'application/pdf' }));
      const a = document.createElement('a'); a.href = url; a.download = 'resume.pdf'; a.click();
      URL.revokeObjectURL(url);
    } catch { toast.error('Download failed'); }
    finally { setDownloading(false); }
  };

  return (
    <div className="space-y-4">
      {hasResume ? (
        <div className="flex items-center justify-between px-4 py-3 bg-green-50 border border-green-200 rounded-xl">
          <div className="flex items-center gap-2">
            <CheckCircle size={16} className="text-green-600" />
            <div>
              <p className="text-sm font-medium text-green-700">Resume on file</p>
              <p className="text-xs text-green-500">Ready for job applications</p>
            </div>
          </div>
          <div className="flex gap-2">
            <button onClick={handleView} className="flex items-center gap-1 text-xs px-2.5 py-1.5 border border-slate-300 rounded-lg hover:bg-white text-slate-600 transition">
              <Eye size={11} /> View
            </button>
            <button onClick={handleDownload} disabled={downloading} className="flex items-center gap-1 text-xs px-2.5 py-1.5 border border-slate-300 rounded-lg hover:bg-white text-slate-600 transition">
              <Download size={11} /> {downloading ? '…' : 'Download'}
            </button>
          </div>
        </div>
      ) : (
        <div className="px-4 py-3 bg-amber-50 border border-amber-200 rounded-xl text-sm text-amber-700">
          No resume uploaded yet. Upload a PDF to start applying.
        </div>
      )}
      <div className="border-2 border-dashed border-slate-200 rounded-xl p-6 flex flex-col items-center gap-3 cursor-pointer hover:border-blue-400 hover:bg-blue-50 transition"
        onClick={() => fileRef.current.click()}>
        <FileText size={28} className={file ? 'text-blue-500' : 'text-slate-300'} />
        {file ? (
          <div className="text-center">
            <p className="text-sm font-medium text-slate-700">{file.name}</p>
            <p className="text-xs text-slate-400">{(file.size / 1024).toFixed(0)} KB</p>
            <button type="button" onClick={e => { e.stopPropagation(); setFile(null); }}
              className="text-xs text-red-500 hover:underline mt-1">Remove</button>
          </div>
        ) : (
          <>
            <p className="text-sm text-slate-500">Click to select PDF</p>
            <p className="text-xs text-slate-400">PDF only · Max 5 MB</p>
          </>
        )}
        <input ref={fileRef} type="file" accept=".pdf" className="hidden" onChange={e => setFile(e.target.files[0])} />
      </div>
      <button onClick={handleUpload} disabled={!file || uploading}
        className="flex items-center gap-2 w-full justify-center py-2.5 bg-blue-600 text-white text-sm font-semibold rounded-xl hover:bg-blue-700 disabled:opacity-50 transition">
        <Upload size={14} />{uploading ? 'Uploading…' : hasResume ? 'Replace Resume' : 'Upload Resume'}
      </button>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════
   MAIN ProfilePage
══════════════════════════════════════════════════════════════ */
export default function ProfilePage() {
  const { user, updateUser, logout } = useAuth();
  const navigate = useNavigate();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [tab, setTab]         = useState('overview');

  // Edit mode
  const [editing, setEditing]   = useState(false);
  const [editName, setEditName] = useState('');
  const [savingProfile, setSavingProfile] = useState(false);

  // Skills
  const [skills, setSkills]       = useState('');
  const [savingSkills, setSavingSkills] = useState(false);

  useEffect(() => {
    getProfile()
      .then(res => {
        setProfile(res.data);
        setSkills(res.data.skills || '');
        setEditName(res.data.name || '');
      })
      .catch(() => toast.error('Failed to load profile'))
      .finally(() => setLoading(false));
  }, []);

  const handleSaveProfile = async () => {
    if (!editName.trim()) return toast.error('Name cannot be empty');
    setSavingProfile(true);
    try {
      const res = await updateProfile({ name: editName.trim() });
      setProfile(res.data);
      updateUser({ ...user, name: res.data.name });
      setEditing(false);
      toast.success('Profile updated!');
    } catch { toast.error('Update failed'); }
    finally { setSavingProfile(false); }
  };

  const handleSaveSkills = async () => {
    setSavingSkills(true);
    try {
      const res = await updateSkills(skills);
      const merged = res.data?.skills ?? skills;
      setSkills(merged);
      setProfile(p => ({ ...p, skills: merged }));
      updateUser({ ...user, skills: merged });
      toast.success('Skills saved!');
    } catch { toast.error('Failed to save skills'); }
    finally { setSavingSkills(false); }
  };

  const handleLogout = () => { logout(); navigate('/login'); };

  if (loading) return (
    <div className="flex items-center justify-center py-20">
      <span className="w-8 h-8 border-2 border-slate-200 border-t-blue-600 rounded-full animate-spin" />
    </div>
  );
  if (!profile) return null;

  const rs = ROLE_STYLE[profile.role] || ROLE_STYLE.STUDENT;
  const RoleIcon = rs.icon;
  const initials = profile.name.slice(0, 2).toUpperCase();
  const st = profile.stats || {};

  /* ── Tab definitions per role ─────────────────────────────────── */
  const TABS = [
    { id: 'overview', label: 'Overview',  icon: User },
    ...(profile.role === 'STUDENT' ? [
      { id: 'skills',  label: 'Skills',   icon: Zap },
      { id: 'resume',  label: 'Resume',   icon: FileText },
    ] : []),
    { id: 'security', label: 'Security',  icon: KeyRound },
  ];

  return (
    <div className="max-w-4xl mx-auto space-y-6">

      {/* ── Header card ──────────────────────────────────────────── */}
      <div className={`bg-gradient-to-br ${rs.bg} rounded-2xl overflow-hidden shadow-lg`}>
        <div className="px-6 py-8 flex flex-col sm:flex-row items-start sm:items-center gap-5">

          {/* Avatar */}
          <div className="w-20 h-20 rounded-2xl bg-white/20 flex items-center justify-center
            text-white text-2xl font-bold ring-4 ring-white/30 flex-shrink-0">
            {initials}
          </div>

          {/* Info */}
          <div className="flex-1 min-w-0">
            {editing ? (
              <div className="flex items-center gap-2 mb-1">
                <input
                  className="text-xl font-bold bg-white/20 text-white placeholder-white/60 rounded-lg px-3 py-1
                    border border-white/30 focus:outline-none focus:ring-2 focus:ring-white/50 w-full max-w-xs"
                  value={editName}
                  onChange={e => setEditName(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && handleSaveProfile()}
                  autoFocus
                />
                <button onClick={handleSaveProfile} disabled={savingProfile}
                  className="p-1.5 rounded-lg bg-white/20 hover:bg-white/30 text-white transition">
                  <Save size={15} />
                </button>
                <button onClick={() => { setEditing(false); setEditName(profile.name); }}
                  className="p-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white transition">
                  <X size={15} />
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-2 mb-1">
                <h1 className="text-2xl font-bold text-white truncate">{profile.name}</h1>
                <button onClick={() => setEditing(true)}
                  className="p-1.5 rounded-lg bg-white/10 hover:bg-white/25 text-white transition flex-shrink-0">
                  <Edit3 size={13} />
                </button>
              </div>
            )}

            <p className="text-white/70 text-sm flex items-center gap-1.5 mb-2">
              <Mail size={12} />{profile.email}
            </p>

            <div className="flex flex-wrap items-center gap-2">
              <span className={`flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-full ${rs.badge}`}>
                <RoleIcon size={11} />{profile.role}
              </span>
              {profile.approved && (
                <span className="flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-full bg-green-100 text-green-700">
                  <CheckCircle size={11} /> Approved
                </span>
              )}
            </div>
          </div>

          {/* Actions */}
          <div className="flex flex-col gap-2 flex-shrink-0">
            <button onClick={handleLogout}
              className="flex items-center gap-2 px-4 py-2 bg-white/15 hover:bg-white/25 text-white text-sm
                font-medium rounded-xl transition border border-white/20">
              <LogOut size={13} /> Sign out
            </button>
          </div>
        </div>
      </div>

      {/* ── Stats row ─────────────────────────────────────────────── */}
      {profile.role === 'STUDENT' && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <StatCard icon={Briefcase}   label="Total Applied"  value={st.totalApplications} color="blue" />
          <StatCard icon={CheckCircle} label="Selected"       value={st.selected}           color="green" />
          <StatCard icon={X}           label="Rejected"       value={st.rejected}           color="red" />
          <StatCard icon={Clock}       label="Pending"        value={st.pending}            color="amber" />
        </div>
      )}
      {profile.role === 'COMPANY' && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <StatCard icon={Briefcase}   label="Jobs Posted"   value={st.totalJobsPosted}   color="blue" />
          <StatCard icon={Star}        label="Active Jobs"   value={st.activeJobs}        color="green" />
          <StatCard icon={Users}       label="Applicants"    value={st.totalApplicants}   color="amber" />
          <StatCard icon={TrendingUp}  label="Conversion"    value={`${st.conversionRate ?? 0}%`} color="purple" />
        </div>
      )}
      {profile.role === 'ADMIN' && (
        <div className="grid grid-cols-3 gap-3">
          <StatCard icon={Users}       label="Total Users"     value={st.totalUsers}     color="blue" />
          <StatCard icon={Building2}   label="Companies"       value={st.totalCompanies} color="green" />
          <StatCard icon={GraduationCap} label="Students"      value={st.totalStudents}  color="purple" />
        </div>
      )}

      {/* ── Tabs ──────────────────────────────────────────────────── */}
      <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
        {/* Tab nav */}
        <div className="flex border-b border-slate-100 overflow-x-auto">
          {TABS.map(({ id, label, icon: Icon }) => (
            <button key={id} onClick={() => setTab(id)}
              className={`flex items-center gap-1.5 px-5 py-3.5 text-sm font-medium whitespace-nowrap transition-colors
                ${tab === id
                  ? 'border-b-2 border-blue-600 text-blue-600 bg-blue-50/50'
                  : 'text-slate-500 hover:text-slate-700 hover:bg-slate-50'}`}>
              <Icon size={14} />{label}
            </button>
          ))}
        </div>

        {/* Tab content */}
        <div className="p-6">

          {/* OVERVIEW ─────────────────────────────────────────────── */}
          {tab === 'overview' && (
            <div className="space-y-5">
              <h2 className="text-sm font-semibold text-slate-700">Account Information</h2>
              <div className="grid sm:grid-cols-2 gap-4">
                {[
                  { label: 'Full Name',  value: profile.name,  icon: User  },
                  { label: 'Email',      value: profile.email, icon: Mail  },
                  { label: 'Role',       value: profile.role,  icon: Shield },
                  { label: 'Account Status', value: profile.approved ? 'Approved' : 'Pending Approval', icon: CheckCircle },
                ].map(({ label, value, icon: Icon }) => (
                  <div key={label} className="flex items-start gap-3 p-4 bg-slate-50 rounded-xl border border-slate-100">
                    <div className="w-8 h-8 rounded-lg bg-white border border-slate-200 flex items-center justify-center flex-shrink-0">
                      <Icon size={14} className="text-slate-500" />
                    </div>
                    <div>
                      <p className="text-xs text-slate-400 font-medium">{label}</p>
                      <p className="text-sm font-semibold text-slate-700 mt-0.5">{value}</p>
                    </div>
                  </div>
                ))}
              </div>

              {/* Skills preview for student */}
              {profile.role === 'STUDENT' && skills && (
                <div>
                  <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2 flex items-center gap-1">
                    <Zap size={11} /> Skills
                  </p>
                  <div className="flex flex-wrap gap-1.5">
                    {skills.split(',').map(s => s.trim()).filter(Boolean).map(skill => (
                      <span key={skill}
                        className="px-2.5 py-1 bg-blue-50 text-blue-700 text-xs font-medium rounded-full border border-blue-100">
                        {skill}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* SKILLS ───────────────────────────────────────────────── */}
          {tab === 'skills' && profile.role === 'STUDENT' && (
            <div className="space-y-4">
              <div>
                <h2 className="text-sm font-semibold text-slate-700 mb-0.5">Skills Management</h2>
                <p className="text-xs text-slate-400">
                  Add your skills to get better job recommendations. Auto-populated from your resume.
                </p>
              </div>
              <SkillsEditor
                value={skills}
                onChange={setSkills}
                onSave={handleSaveSkills}
                saving={savingSkills}
              />
            </div>
          )}

          {/* RESUME ───────────────────────────────────────────────── */}
          {tab === 'resume' && profile.role === 'STUDENT' && (
            <div className="space-y-4">
              <div>
                <h2 className="text-sm font-semibold text-slate-700 mb-0.5">Resume Management</h2>
                <p className="text-xs text-slate-400">Upload your resume (PDF). It will be visible to recruiters when you apply.</p>
              </div>
              <ResumeSection profile={profile} />
            </div>
          )}

          {/* SECURITY ─────────────────────────────────────────────── */}
          {tab === 'security' && (
            <div className="space-y-4">
              <div>
                <h2 className="text-sm font-semibold text-slate-700 mb-0.5">Change Password</h2>
                <p className="text-xs text-slate-400">Use a strong password with at least 6 characters.</p>
              </div>
              <ChangePasswordSection />
            </div>
          )}

        </div>
      </div>
    </div>
  );
}
