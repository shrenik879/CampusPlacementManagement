import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { Input } from '../../components/ui/Input';
import { Button } from '../../components/ui/Button';
import {
  GraduationCap, User, Building2, ArrowRight,
  CheckCircle, Info
} from 'lucide-react';
import toast from 'react-hot-toast';

const ROLES = [
  {
    id: 'STUDENT',
    label: 'Student',
    icon: User,
    accent: 'border-blue-600 bg-blue-600 text-white',
    inactive: 'border-slate-300 text-slate-600 hover:border-blue-400 hover:bg-blue-50',
    badge: 'bg-blue-100 text-blue-700',
    note: null,
    namePlaceholder: 'Full Name (as per college records)',
    emailPlaceholder: 'student@college.edu',
  },
  {
    id: 'COMPANY',
    label: 'Company / Recruiter',
    icon: Building2,
    accent: 'border-emerald-600 bg-emerald-600 text-white',
    inactive: 'border-slate-300 text-slate-600 hover:border-emerald-400 hover:bg-emerald-50',
    badge: 'bg-emerald-100 text-emerald-700',
    note: 'Company accounts require admin approval before you can log in. You will receive access once the placement cell verifies your details.',
    namePlaceholder: 'Company / Organisation Name',
    emailPlaceholder: 'hr@yourcompany.com',
  },
];

export default function RegisterPage() {
  const { register } = useAuth();
  const navigate     = useNavigate();

  const [selectedRole, setSelectedRole] = useState('STUDENT');
  const [form, setForm]     = useState({ name: '', email: '', password: '' });
  const [loading, setLoading] = useState(false);

  const role = ROLES.find(r => r.id === selectedRole);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (form.password.length < 6) return toast.error('Password must be at least 6 characters');
    setLoading(true);
    try {
      await register({ ...form, role: selectedRole });
      toast.success(
        selectedRole === 'COMPANY'
          ? 'Account created. Awaiting admin approval.'
          : 'Account created successfully. Please sign in.'
      );
      navigate('/login');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-100 flex">

      {/* ── Left info panel ───────────────────────────────────────── */}
      <div className="hidden lg:flex lg:w-[400px] xl:w-[440px] bg-white border-r border-slate-200 flex-col p-10 shrink-0">
        {/* Logo */}
        <div className="flex items-center gap-2.5 mb-10">
          <div className="w-9 h-9 bg-blue-600 rounded-lg flex items-center justify-center shrink-0">
            <GraduationCap size={20} className="text-white" />
          </div>
          <div>
            <p className="text-sm font-bold text-slate-800 leading-none">Campus Placement</p>
            <p className="text-xs text-slate-400 mt-0.5">Management System</p>
          </div>
        </div>

        <div className="mb-8">
          <h2 className="text-2xl font-bold text-slate-800 leading-snug mb-2">
            Join the placement<br />ecosystem.
          </h2>
          <p className="text-sm text-slate-500 leading-relaxed">
            Register as a student to apply for jobs, or as a company to find the right talent from our campus.
          </p>
        </div>

        {/* How it works */}
        <div className="flex flex-col gap-4">
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">How it works</p>
          {[
            { step: '01', title: 'Create your account', sub: 'Register with your details and verify your role' },
            { step: '02', title: 'Complete your profile', sub: 'Students: upload resume · Companies: get approved' },
            { step: '03', title: 'Start connecting', sub: 'Apply to jobs or post openings and manage applicants' },
          ].map(({ step, title, sub }) => (
            <div key={step} className="flex items-start gap-3">
              <div className="w-7 h-7 bg-blue-600 text-white rounded-full flex items-center justify-center text-xs font-bold shrink-0 mt-0.5">
                {step}
              </div>
              <div>
                <p className="text-sm font-medium text-slate-700">{title}</p>
                <p className="text-xs text-slate-400 mt-0.5">{sub}</p>
              </div>
            </div>
          ))}
        </div>

        <p className="mt-auto text-xs text-slate-400">
          © 2024 Training &amp; Placement Cell. All rights reserved.
        </p>
      </div>

      {/* ── Right form ───────────────────────────────────────────── */}
      <div className="flex-1 flex items-center justify-center p-6">
        <div className="w-full max-w-sm">

          {/* Mobile logo */}
          <div className="lg:hidden flex items-center justify-center gap-2 mb-8">
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
              <GraduationCap size={16} className="text-white" />
            </div>
            <span className="text-sm font-bold text-slate-700">Campus Placement System</span>
          </div>

          <h1 className="text-xl font-bold text-slate-800 mb-1">Create Account</h1>
          <p className="text-sm text-slate-500 mb-5">Register for the campus placement portal</p>

          {/* Role selector */}
          <div className="flex gap-2 mb-4">
            {ROLES.map(({ id, label, icon: Icon, accent, inactive }) => (
              <button
                key={id}
                type="button"
                onClick={() => setSelectedRole(id)}
                className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 px-2 rounded-lg border-2 text-xs font-medium transition-all ${
                  selectedRole === id ? accent : inactive
                }`}
              >
                <Icon size={14} /> {label}
              </button>
            ))}
          </div>

          {/* Role badge */}
          <div className={`flex items-center gap-1.5 text-xs font-medium px-2.5 py-1.5 rounded mb-3 w-fit ${role.badge}`}>
            <role.icon size={11} />
            Registering as {role.label}
          </div>

          {/* Company approval note */}
          {role.note && (
            <div className="mb-4 flex items-start gap-2 px-3 py-2.5 bg-amber-50 border border-amber-200 rounded text-xs text-amber-700">
              <Info size={13} className="shrink-0 mt-0.5" />
              <p>{role.note}</p>
            </div>
          )}

          <div className="bg-white border border-slate-200 rounded-lg p-5 shadow-sm">
            <form onSubmit={handleSubmit} className="flex flex-col gap-3.5">
              <Input
                label={selectedRole === 'COMPANY' ? 'Company Name' : 'Full Name'}
                placeholder={role.namePlaceholder}
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                required
              />
              <Input
                label="Email Address"
                type="email"
                placeholder={role.emailPlaceholder}
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                required
              />
              <div>
                <Input
                  label="Password"
                  type="password"
                  placeholder="Minimum 6 characters"
                  value={form.password}
                  onChange={(e) => setForm({ ...form, password: e.target.value })}
                  required
                />
                {/* Password strength bar */}
                {form.password.length > 0 && (
                  <div className="flex gap-1 mt-1.5">
                    {[1, 2, 3].map(i => (
                      <div
                        key={i}
                        className={`h-1 flex-1 rounded-full transition-all ${
                          form.password.length >= i * 4
                            ? form.password.length < 6 ? 'bg-red-400' : form.password.length < 10 ? 'bg-amber-400' : 'bg-green-500'
                            : 'bg-slate-200'
                        }`}
                      />
                    ))}
                    <span className="text-xs text-slate-400 ml-1">
                      {form.password.length < 6 ? 'Weak' : form.password.length < 10 ? 'Good' : 'Strong'}
                    </span>
                  </div>
                )}
              </div>

              {/* Terms */}
              <p className="text-xs text-slate-400 leading-relaxed">
                By registering you agree to the placement cell's terms and privacy policy.
              </p>

              <Button type="submit" variant="primary" size="md" loading={loading} className="w-full">
                {loading ? 'Creating account...' : `Register as ${role.label}`}
                {!loading && <ArrowRight size={14} />}
              </Button>
            </form>

            <p className="text-center text-xs text-slate-500 mt-3">
              Already registered?{' '}
              <Link to="/login" className="text-blue-600 hover:underline font-medium">Sign in</Link>
            </p>
          </div>

          {/* What's next checklist */}
          <div className="mt-3 bg-white border border-slate-200 rounded-lg px-4 py-3">
            <p className="text-xs font-medium text-slate-500 mb-2">After registration you can:</p>
            <ul className="flex flex-col gap-1">
              {(selectedRole === 'STUDENT'
                ? ['Upload your resume', 'Browse all company listings', 'Apply with one click', 'Track application status']
                : ['Post job openings', 'Review student applications', 'Download resumes', 'Shortlist & hire candidates']
              ).map(f => (
                <li key={f} className="flex items-center gap-1.5 text-xs text-slate-400">
                  <CheckCircle size={10} className="text-green-500 shrink-0" />
                  {f}
                </li>
              ))}
            </ul>
          </div>

        </div>
      </div>
    </div>
  );
}
