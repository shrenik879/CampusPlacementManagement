import { useState, useRef, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Logo from './ui/Logo';
import NotificationBell from './NotificationBell';
import useNotifications from '../hooks/useNotifications';
import {
  GraduationCap, LayoutDashboard, Briefcase, FileText,
  User, ShieldCheck, LogOut, Menu, X, Building2, Lock,
  BarChart2, Mail, ChevronDown, Tag, KeyRound, Zap
} from 'lucide-react';

/* ── Role colour config ─────────────────────────────────────────── */
const ROLE_STYLE = {
  STUDENT: { bg: 'bg-blue-600',   ring: 'ring-blue-300',   badge: 'bg-blue-100 text-blue-700',   icon: GraduationCap },
  COMPANY: { bg: 'bg-emerald-600', ring: 'ring-emerald-300', badge: 'bg-emerald-100 text-emerald-700', icon: Building2 },
  ADMIN:   { bg: 'bg-purple-600',  ring: 'ring-purple-300',  badge: 'bg-purple-100 text-purple-700',  icon: ShieldCheck },
};

/* ── Profile Dropdown ───────────────────────────────────────────── */
function ProfileDropdown({ user, onLogout }) {
  const [open, setOpen] = useState(false);
  const ref  = useRef(null);
  const rs   = ROLE_STYLE[user.role] || ROLE_STYLE.STUDENT;
  const RoleIcon = rs.icon;
  const initials = (user.name || '?').slice(0, 2).toUpperCase();

  // Close on outside click
  useEffect(() => {
    const handler = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const skills = user.skills
    ? user.skills.split(',').map(s => s.trim()).filter(Boolean)
    : [];

  return (
    <div className="relative" ref={ref}>
      {/* Avatar trigger */}
      <button
        id="profile-btn"
        onClick={() => setOpen(v => !v)}
        className={`flex items-center gap-2 px-2 py-1 rounded-lg hover:bg-slate-100
          transition-colors focus:outline-none focus:ring-2 ${rs.ring}`}
      >
        <span className={`w-7 h-7 rounded-full ${rs.bg} text-white text-xs font-bold
          flex items-center justify-center flex-shrink-0`}>
          {initials}
        </span>
        <span className="hidden md:block text-sm font-medium text-slate-700 max-w-[100px] truncate">
          {user.name}
        </span>
        <ChevronDown size={13} className={`hidden md:block text-slate-400 transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>

      {/* Dropdown panel */}
      {open && (
        <div className="absolute right-0 top-full mt-2 w-72 bg-white rounded-xl border border-slate-200
          shadow-xl z-50 overflow-hidden animate-fade-in">

          {/* Header — avatar + name + email */}
          <div className={`${rs.bg} px-4 py-4`}>
            <div className="flex items-center gap-3">
              <span className="w-12 h-12 rounded-full bg-white/20 text-white text-lg font-bold
                flex items-center justify-center ring-2 ring-white/40 flex-shrink-0">
                {initials}
              </span>
              <div className="min-w-0">
                <p className="text-sm font-semibold text-white truncate">{user.name}</p>
                {user.email && (
                  <p className="text-xs text-white/70 truncate flex items-center gap-1 mt-0.5">
                    <Mail size={10} />{user.email}
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Role badge */}
          <div className="px-4 pt-3 pb-1 flex items-center gap-2">
            <RoleIcon size={13} className="text-slate-400" />
            <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${rs.badge}`}>
              {user.role}
            </span>
          </div>

          {/* Skills (only shown if present) */}
          {skills.length > 0 && (
            <div className="px-4 py-2 border-t border-slate-100 mt-1">
              <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wide mb-1.5
                flex items-center gap-1">
                <Zap size={10} /> Skills
              </p>
              <div className="flex flex-wrap gap-1">
                {skills.slice(0, 8).map(skill => (
                  <span key={skill}
                    className="text-[11px] px-2 py-0.5 bg-slate-100 text-slate-600 rounded-full font-medium">
                    {skill}
                  </span>
                ))}
                {skills.length > 8 && (
                  <span className="text-[11px] px-2 py-0.5 bg-slate-100 text-slate-400 rounded-full">
                    +{skills.length - 8} more
                  </span>
                )}
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="border-t border-slate-100 mt-1 p-2">
            <Link
              to="/profile"
              onClick={() => setOpen(false)}
              className="flex items-center gap-2.5 w-full px-3 py-2 rounded-lg text-sm text-slate-600
                hover:bg-slate-50 hover:text-blue-600 transition-colors"
            >
              <User size={14} className="text-slate-400" />
              View Profile
            </Link>
            <Link
              to="/change-password"
              onClick={() => setOpen(false)}
              className="flex items-center gap-2.5 w-full px-3 py-2 rounded-lg text-sm text-slate-600
                hover:bg-slate-50 hover:text-blue-600 transition-colors"
            >
              <KeyRound size={14} className="text-slate-400" />
              Change Password
            </Link>
            <button
              onClick={() => { setOpen(false); onLogout(); }}
              className="flex items-center gap-2.5 w-full px-3 py-2 rounded-lg text-sm text-red-600
                hover:bg-red-50 transition-colors mt-0.5"
            >
              <LogOut size={14} />
              Sign out
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);

  // SSE notifications — only for students
  const { notifications, unreadCount, connected, markAllRead } = useNotifications(
    user?.role === 'STUDENT'
  );

  const handleLogout = () => { logout(); navigate('/login'); setMobileOpen(false); };

  const navLinks = {
    STUDENT: [
      { to: '/student/dashboard',    label: 'Dashboard',     icon: LayoutDashboard },
      { to: '/jobs',                 label: 'Jobs',          icon: Briefcase       },
      { to: '/student/applications', label: 'Applications',  icon: FileText        },
      { to: '/student/resume',       label: 'Resume',        icon: User            },
    ],
    COMPANY: [
      { to: '/company/dashboard',  label: 'Dashboard',  icon: LayoutDashboard },
      { to: '/jobs',               label: 'Browse Jobs', icon: Briefcase       },
      { to: '/company/analytics',  label: 'Analytics',  icon: BarChart2       },
    ],
    ADMIN: [
      { to: '/admin/dashboard',      label: 'Dashboard',     icon: ShieldCheck     },
    ],
  };

  const links = user ? (navLinks[user.role] || []) : [];

  return (
    <>
      <header className="bg-white border-b border-slate-200 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-14 flex items-center justify-between">
          {/* Logo */}
          <Logo />

          {/* Desktop nav */}
          {user && (
            <nav className="hidden md:flex items-center gap-0.5">
              {links.map(({ to, label, icon: Icon }) => {
                const active = location.pathname === to;
                return (
                  <Link
                    key={to}
                    to={to}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded text-sm transition-colors ${
                      active
                        ? 'bg-blue-50 text-blue-700 font-medium'
                        : 'text-slate-600 hover:bg-slate-100 hover:text-slate-800'
                    }`}
                  >
                    <Icon size={14} />
                    {label}
                  </Link>
                );
              })}
            </nav>
          )}

          {/* Right side */}
          <div className="flex items-center gap-2">
            {user ? (
              <>
                {user.role === 'STUDENT' && (
                  <NotificationBell
                    notifications={notifications}
                    unreadCount={unreadCount}
                    connected={connected}
                    markAllRead={markAllRead}
                  />
                )}
                {/* Profile dropdown — desktop */}
                <div className="hidden md:flex">
                  <ProfileDropdown user={user} onLogout={handleLogout} />
                </div>
                {/* Mobile hamburger */}
                <button className="md:hidden p-1.5 rounded text-slate-500 hover:bg-slate-100"
                  onClick={() => setMobileOpen(true)}>
                  <Menu size={18} />
                </button>
              </>
            ) : (
              <div className="flex gap-2">
                <button onClick={() => navigate('/login')} className="text-sm text-slate-600 px-3 py-1.5 rounded border border-slate-300 hover:bg-slate-50 transition-colors">Login</button>
                <button onClick={() => navigate('/register')} className="text-sm text-white bg-blue-600 px-3 py-1.5 rounded hover:bg-blue-700 transition-colors">Register</button>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Mobile drawer */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 md:hidden">
          <div className="absolute inset-0 bg-black/20" onClick={() => setMobileOpen(false)} />
          <div className="absolute left-0 top-0 bottom-0 w-72 bg-white border-r border-slate-200 flex flex-col">
            <div className="flex items-center justify-between px-4 py-3 border-b border-slate-200">
              <span className="text-sm font-semibold text-slate-700">Menu</span>
              <button onClick={() => setMobileOpen(false)} className="p-1 rounded text-slate-400 hover:bg-slate-100">
                <X size={16} />
              </button>
            </div>
            {/* Mobile profile header */}
            {user && (() => {
              const rs = ROLE_STYLE[user.role] || ROLE_STYLE.STUDENT;
              const RoleIcon = rs.icon;
              return (
                <div className={`${rs.bg} px-4 py-4`}>
                  <div className="flex items-center gap-3">
                    <span className="w-10 h-10 rounded-full bg-white/20 text-white font-bold flex items-center justify-center text-sm ring-2 ring-white/30">
                      {(user.name || '?').slice(0, 2).toUpperCase()}
                    </span>
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-white truncate">{user.name}</p>
                      {user.email && <p className="text-xs text-white/70 truncate">{user.email}</p>}
                      <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded-full mt-1 inline-flex items-center gap-1 ${rs.badge}`}>
                        <RoleIcon size={9} />{user.role}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })()}
            <nav className="flex-1 px-2 py-3 flex flex-col gap-0.5 overflow-y-auto">
              {links.map(({ to, label, icon: Icon }) => {
                const active = location.pathname === to;
                return (
                  <Link key={to} to={to} onClick={() => setMobileOpen(false)}
                    className={`flex items-center gap-2 px-3 py-2 rounded text-sm transition-colors ${
                      active ? 'bg-blue-50 text-blue-700 font-medium' : 'text-slate-600 hover:bg-slate-50'
                    }`}>
                    <Icon size={14} /> {label}
                  </Link>
                );
              })}
            </nav>
            <div className="px-2 py-3 border-t border-slate-200 space-y-0.5">
              <Link to="/profile" onClick={() => setMobileOpen(false)}
                className="flex items-center gap-2 px-3 py-2 rounded text-sm text-slate-600 hover:bg-slate-50 transition-colors">
                <User size={14} className="text-slate-400" /> View Profile
              </Link>
              <Link to="/change-password" onClick={() => setMobileOpen(false)}
                className="flex items-center gap-2 px-3 py-2 rounded text-sm text-slate-600 hover:bg-slate-50 transition-colors">
                <KeyRound size={14} className="text-slate-400" /> Change Password
              </Link>
              <button onClick={handleLogout}
                className="flex items-center gap-2 w-full px-3 py-2 rounded text-sm text-red-600 hover:bg-red-50 transition-colors">
                <LogOut size={14} /> Sign out
              </button>
            </div>
          </div>
        </div>
      )}
      <style>{`
        @keyframes fadeInDown { from { opacity:0; transform:translateY(-6px);} to { opacity:1; transform:translateY(0);} }
        .animate-fade-in { animation: fadeInDown 0.18s ease-out both; }
      `}</style>
    </>
  );
}
