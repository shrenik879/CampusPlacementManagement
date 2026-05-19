import { useState } from 'react';
import { resetPassword } from '../../services/authService';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import Logo from '../../components/ui/Logo';
import { Link, useSearchParams, useNavigate } from 'react-router-dom';
import { Lock, ArrowLeft, CheckCircle, Eye, EyeOff } from 'lucide-react';
import toast from 'react-hot-toast';

export default function ResetPasswordPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const token = searchParams.get('token');

  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (newPassword.length < 6) return toast.error('Password must be at least 6 characters');
    if (newPassword !== confirmPassword) return toast.error('Passwords do not match');
    if (!token) return toast.error('Invalid reset link — no token found');

    setLoading(true);
    try {
      await resetPassword({ token, newPassword });
      setDone(true);
      toast.success('Password reset successfully!');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to reset password');
    } finally {
      setLoading(false);
    }
  };

  if (!token) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center px-4">
        <div className="bg-white border border-slate-200 rounded-xl p-8 shadow-sm max-w-md w-full text-center">
          <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-3">
            <Lock size={20} className="text-red-600" />
          </div>
          <h2 className="text-lg font-semibold text-slate-800 mb-2">Invalid Reset Link</h2>
          <p className="text-sm text-slate-500 mb-4">
            This reset link is invalid or missing a token. Please request a new one.
          </p>
          <Link to="/forgot-password">
            <Button variant="primary" size="md" className="w-full">Request New Link</Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <Logo />
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-8 shadow-sm">
          {!done ? (
            <>
              <div className="text-center mb-6">
                <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-3">
                  <Lock size={20} className="text-blue-600" />
                </div>
                <h1 className="text-xl font-semibold text-slate-800">Set New Password</h1>
                <p className="text-sm text-slate-500 mt-1">
                  Create a strong password for your account
                </p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="relative">
                  <Input
                    label="New Password"
                    type={showPassword ? 'text' : 'password'}
                    placeholder="Enter new password (min 6 chars)"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-8 text-slate-400 hover:text-slate-600"
                  >
                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>

                <Input
                  label="Confirm Password"
                  type="password"
                  placeholder="Re-enter new password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                />

                {/* Strength indicator */}
                {newPassword && (
                  <div className="flex items-center gap-2">
                    <div className="flex-1 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all duration-300"
                        style={{
                          width: newPassword.length < 6 ? '25%' : newPassword.length < 10 ? '60%' : '100%',
                          background: newPassword.length < 6 ? '#ef4444' : newPassword.length < 10 ? '#f59e0b' : '#22c55e',
                        }}
                      />
                    </div>
                    <span className={`text-[10px] font-medium ${
                      newPassword.length < 6 ? 'text-red-500' : newPassword.length < 10 ? 'text-amber-500' : 'text-green-500'
                    }`}>
                      {newPassword.length < 6 ? 'Weak' : newPassword.length < 10 ? 'Medium' : 'Strong'}
                    </span>
                  </div>
                )}

                <Button variant="primary" size="md" loading={loading} className="w-full">
                  Reset Password
                </Button>
              </form>
            </>
          ) : (
            <div className="text-center py-4">
              <div className="w-14 h-14 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <CheckCircle size={24} className="text-green-600" />
              </div>
              <h2 className="text-lg font-semibold text-slate-800 mb-2">Password Reset!</h2>
              <p className="text-sm text-slate-500 mb-6">
                Your password has been updated. You can now login.
              </p>
              <Button variant="primary" size="md" onClick={() => navigate('/login')} className="w-full">
                Go to Login
              </Button>
            </div>
          )}

          <div className="mt-6 pt-4 border-t border-slate-100 text-center">
            <Link to="/login" className="inline-flex items-center gap-1 text-sm text-slate-500 hover:text-blue-600 transition-colors">
              <ArrowLeft size={14} /> Back to Login
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
