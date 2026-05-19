import { useState, useRef, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import ImageSlider from '../../components/ui/ImageSlider';
import Logo from '../../components/ui/Logo';
import {
  User, Building2, ShieldCheck,
  Eye, EyeOff, ArrowRight, AlertCircle,
} from 'lucide-react';
import toast from 'react-hot-toast';

/* ── Slider images (place files in frontend/public/images/) ─────── */
const SLIDER_IMAGES = [
  '/images/slider1.jpg',
  '/images/slider2.jpg',
  '/images/slider3.jpg',
];

/* ── Role configuration ─────────────────────────────────────────── */
const ROLES = [
  {
    id: 'STUDENT',
    label: 'Student',
    icon: User,
    activeTab: 'border-b-2 border-blue-600 text-blue-700 font-semibold',
    inactiveTab: 'text-slate-500 hover:text-blue-600 hover:border-b-2 hover:border-blue-300',
    btnClass: 'bg-blue-600 hover:bg-blue-700 active:bg-blue-800 focus:ring-blue-400',
    emailPh: 'student@college.edu',
    demoCreds: { email: 'student@gmail.com', password: '123456' },
  },
  {
    id: 'COMPANY',
    label: 'Company',
    icon: Building2,
    activeTab: 'border-b-2 border-emerald-600 text-emerald-700 font-semibold',
    inactiveTab: 'text-slate-500 hover:text-emerald-600 hover:border-b-2 hover:border-emerald-300',
    btnClass: 'bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 focus:ring-emerald-400',
    emailPh: 'hr@company.com',
    demoCreds: { email: 'company@gmail.com', password: '123456' },
  },
  {
    id: 'ADMIN',
    label: 'Admin',
    icon: ShieldCheck,
    activeTab: 'border-b-2 border-purple-600 text-purple-700 font-semibold',
    inactiveTab: 'text-slate-500 hover:text-purple-600 hover:border-b-2 hover:border-purple-300',
    btnClass: 'bg-purple-600 hover:bg-purple-700 active:bg-purple-800 focus:ring-purple-400',
    emailPh: 'admin@placement.edu',
    demoCreds: { email: 'admin@gmail.com', password: '123456' },
  },
];

/* ── Shake CSS ──────────────────────────────────────────────────── */
const SHAKE_CSS = `
@keyframes shake{0%,100%{transform:translateX(0)}20%{transform:translateX(-5px)}40%{transform:translateX(5px)}60%{transform:translateX(-3px)}80%{transform:translateX(3px)}}
.shake{animation:shake .4s ease-out;}
@keyframes fadeInUp{from{opacity:0;transform:translateY(6px)}to{opacity:1;transform:translateY(0)}}
.animate-fade-in{animation:fadeInUp .4s ease-out both;}
`;

export default function LoginPage() {
  const { login }  = useAuth();
  const navigate   = useNavigate();

  const [roleId, setRoleId]       = useState('STUDENT');
  const [email, setEmail]         = useState('');
  const [password, setPassword]   = useState('');
  const [showPass, setShowPass]   = useState(false);
  const [remember, setRemember]   = useState(false);
  const [loading, setLoading]     = useState(false);
  const [emailErr, setEmailErr]   = useState('');
  const [passErr, setPassErr]     = useState('');
  const [shaking, setShaking]     = useState(false);
  const [rateLimited, setRateLimited] = useState(false); // 429 lockout
  const [countdown, setCountdown]     = useState(0);     // seconds remaining

  const emailRef = useRef(null);
  const role = ROLES.find(r => r.id === roleId);

  // Countdown timer — decrements every second while rate-limited
  useEffect(() => {
    if (countdown <= 0) { setRateLimited(false); return; }
    const t = setTimeout(() => setCountdown(c => c - 1), 1000);
    return () => clearTimeout(t);
  }, [countdown]);

  // Inject CSS once
  useEffect(() => {
    const id = 'cps-anim';
    if (!document.getElementById(id)) {
      const s = document.createElement('style');
      s.id = id; s.textContent = SHAKE_CSS;
      document.head.appendChild(s);
    }
    emailRef.current?.focus();
  }, []);

  /* ── Validation ─────────────────────────────────────────────── */
  const validateEmail = (v) => {
    if (!v)                              { setEmailErr('Email is required');            return false; }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v)) { setEmailErr('Enter a valid email address'); return false; }
    setEmailErr(''); return true;
  };
  const validatePass = (v) => {
    if (!v)       { setPassErr('Password is required'); return false; }
    if (v.length < 4) { setPassErr('Password too short');    return false; }
    setPassErr(''); return true;
  };

  /* ── Demo fill ──────────────────────────────────────────────── */
  const fillDemo = (r) => {
    setRoleId(r.id); setEmailErr(''); setPassErr('');
    setEmail(''); setPassword('');
    setTimeout(() => { setEmail(r.demoCreds.email); setPassword(r.demoCreds.password); }, 80);
  };

  /* ── Submit ─────────────────────────────────────────────────── */
  const handleSubmit = async (e) => {
    e?.preventDefault();
    if (rateLimited) return;
    if (!validateEmail(email) | !validatePass(password)) return;   // bitwise OR to run both
    setLoading(true);
    try {
      const user = await login({ email, password });
      toast.success(`Welcome back, ${user.name}! 👋`);
      const routes = { STUDENT: '/student/dashboard', COMPANY: '/company/dashboard', ADMIN: '/admin/dashboard' };
      navigate(routes[user.role] || '/');
    } catch (err) {
      if (err.response?.status === 429) {
        const retryAfter = err.response?.data?.retryAfterSeconds || 60;
        setRateLimited(true);
        setCountdown(retryAfter);
        toast.error(`Too many login attempts. Try again in ${retryAfter}s.`);
      } else {
        const msg = err.response?.data?.message || 'Invalid email or password';
        toast.error(msg);
        setShaking(true);
        setPassErr('Incorrect credentials. Please try again.');
        setTimeout(() => setShaking(false), 500);
      }
    } finally {
      setLoading(false);
    }
  };

  /* ── Render ─────────────────────────────────────────────────── */
  return (
    <div className="min-h-screen flex bg-white">

      {/* ══════════════════════════════════
          LEFT — Image Slider (45%)
      ══════════════════════════════════ */}
      <div className="hidden lg:block lg:w-[45%] xl:w-[42%] relative flex-shrink-0">
        <ImageSlider images={SLIDER_IMAGES} interval={4500} />
      </div>

      {/* ══════════════════════════════════
          RIGHT — Login Form (55%)
      ══════════════════════════════════ */}
      <div className="flex-1 flex flex-col min-h-screen bg-slate-50 overflow-y-auto">

        {/* Top bar */}
        <header className="flex items-center justify-between px-8 py-5 bg-white border-b border-slate-100">
          <Logo />
          <span className="text-xs text-slate-400 hidden sm:block">
            Training &amp; Placement Cell
          </span>
        </header>

        {/* Scrollable content area */}
        <div className="flex-1 flex items-center justify-center px-6 py-10">
          <div className="w-full max-w-[400px]">

            {/* Welcome heading */}
            <div className="mb-6">
              <h1 className="text-2xl font-bold text-slate-800">Welcome back</h1>
              <p className="text-sm text-slate-500 mt-1">
                Sign in to your account to continue
              </p>
            </div>

            {/* ── Role tab switcher ─────────────────────────── */}
            <div className="flex border-b border-slate-200 mb-6 gap-0">
              {ROLES.map((r) => (
                <button
                  key={r.id}
                  type="button"
                  onClick={() => { setRoleId(r.id); setEmailErr(''); setPassErr(''); }}
                  className={`flex items-center gap-1.5 px-4 py-2.5 text-sm cursor-pointer
                    transition-all duration-150 select-none
                    ${roleId === r.id ? r.activeTab : r.inactiveTab}`}
                >
                  <r.icon size={13} />
                  {r.label}
                </button>
              ))}
            </div>

            {/* ── Form card ───────────────────────────────────── */}
            <div
              className={`bg-white border border-slate-200 rounded-xl shadow-sm p-6
                transition-shadow duration-200 hover:shadow-md ${shaking ? 'shake' : ''}`}
            >
              <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-4">

                {/* Email */}
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Email address
                  </label>
                  <input
                    ref={emailRef}
                    type="email"
                    autoComplete="email"
                    placeholder={role.emailPh}
                    value={email}
                    onChange={e => { setEmail(e.target.value); if (emailErr) validateEmail(e.target.value); }}
                    onBlur={e => validateEmail(e.target.value)}
                    className={`w-full border rounded-lg px-3 py-2.5 text-sm text-slate-800
                      placeholder-slate-400 bg-white outline-none transition-all duration-150
                      focus:ring-2 focus:ring-blue-400 focus:border-blue-400
                      ${emailErr ? 'border-red-400 bg-red-50 focus:ring-red-300 focus:border-red-400' : 'border-slate-300'}`}
                  />
                  {emailErr && (
                    <p className="flex items-center gap-1 text-xs text-red-500 mt-1">
                      <AlertCircle size={11} />{emailErr}
                    </p>
                  )}
                </div>

                {/* Password */}
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Password
                  </label>
                  <div className="relative">
                    <input
                      type={showPass ? 'text' : 'password'}
                      autoComplete="current-password"
                      placeholder="Enter your password"
                      value={password}
                      onChange={e => { setPassword(e.target.value); if (passErr) validatePass(e.target.value); }}
                      onBlur={e => validatePass(e.target.value)}
                      className={`w-full border rounded-lg px-3 py-2.5 pr-10 text-sm text-slate-800
                        placeholder-slate-400 bg-white outline-none transition-all duration-150
                        focus:ring-2 focus:ring-blue-400 focus:border-blue-400
                        ${passErr ? 'border-red-400 bg-red-50 focus:ring-red-300 focus:border-red-400' : 'border-slate-300'}`}
                    />
                    <button
                      type="button"
                      tabIndex={-1}
                      onClick={() => setShowPass(v => !v)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400
                        hover:text-slate-600 transition-colors"
                    >
                      {showPass ? <EyeOff size={15} /> : <Eye size={15} />}
                    </button>
                  </div>
                  {passErr && (
                    <p className="flex items-center gap-1 text-xs text-red-500 mt-1">
                      <AlertCircle size={11} />{passErr}
                    </p>
                  )}
                </div>

                {/* Remember me + Forgot password */}
                <div className="flex items-center justify-between">
                  <label className="flex items-center gap-2 cursor-pointer select-none group">
                    <input
                      type="checkbox"
                      checked={remember}
                      onChange={e => setRemember(e.target.checked)}
                      className="w-3.5 h-3.5 rounded border-slate-300 accent-blue-600 cursor-pointer"
                    />
                    <span className="text-xs text-slate-500 group-hover:text-slate-700 transition-colors">
                      Remember me
                    </span>
                  </label>
                  <Link to="/forgot-password" className="text-xs text-blue-600 hover:underline">
                    Forgot Password?
                  </Link>
                </div>

                {/* Rate limit warning */}
                {rateLimited && (
                  <div className="flex items-center gap-2 px-3 py-2 bg-orange-50 border border-orange-200 rounded-lg text-xs text-orange-700">
                    <AlertCircle size={13} className="flex-shrink-0" />
                    <span>
                      Too many attempts — locked out for{' '}
                      <strong>{countdown}s</strong>. Please wait.
                    </span>
                  </div>
                )}

                {/* Submit */}
                <button
                  type="submit"
                  disabled={loading || rateLimited}
                  className={`w-full flex items-center justify-center gap-2 py-2.5 rounded-lg
                    text-sm font-semibold text-white transition-all duration-150 cursor-pointer
                    focus:outline-none focus:ring-2 focus:ring-offset-1 select-none
                    disabled:opacity-60 disabled:cursor-not-allowed
                    ${role.btnClass}`}
                >
                  {rateLimited ? (
                    <>🔒 Locked — retry in {countdown}s</>
                  ) : loading ? (
                    <>
                      <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      Signing in…
                    </>
                  ) : (
                    <>
                      Sign in as {role.label}
                      <ArrowRight size={14} />
                    </>
                  )}
                </button>
              </form>

              <p className="text-center text-xs text-slate-500 mt-4">
                Don't have an account?{' '}
                <Link to="/register" className="text-blue-600 hover:underline font-medium">
                  Register now
                </Link>
              </p>
            </div>

          </div>
        </div>

        {/* Footer */}
        <footer className="px-8 py-4 text-center text-xs text-slate-400 border-t border-slate-100 bg-white">
          © {new Date().getFullYear()} Training &amp; Placement Cell — All rights reserved.
        </footer>
      </div>
    </div>
  );
}
