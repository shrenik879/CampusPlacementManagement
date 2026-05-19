import { useState } from 'react';
import { forgotPassword } from '../../services/authService';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import Logo from '../../components/ui/Logo';
import { Link } from 'react-router-dom';
import { Mail, ArrowLeft, CheckCircle } from 'lucide-react';
import toast from 'react-hot-toast';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email.trim()) return toast.error('Please enter your email');
    setLoading(true);
    try {
      await forgotPassword({ email });
      setSent(true);
      toast.success('Reset link sent to your email!');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to send reset link');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <Logo />
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-8 shadow-sm">
          {!sent ? (
            <>
              <div className="text-center mb-6">
                <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-3">
                  <Mail size={20} className="text-blue-600" />
                </div>
                <h1 className="text-xl font-semibold text-slate-800">Forgot Password?</h1>
                <p className="text-sm text-slate-500 mt-1">
                  Enter your email and we'll send you a reset link
                </p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                <Input
                  label="Email Address"
                  type="email"
                  placeholder="Enter your registered email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
                <Button variant="primary" size="md" loading={loading} className="w-full">
                  Send Reset Link
                </Button>
              </form>
            </>
          ) : (
            <div className="text-center py-4">
              <div className="w-14 h-14 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <CheckCircle size={24} className="text-green-600" />
              </div>
              <h2 className="text-lg font-semibold text-slate-800 mb-2">Check Your Email</h2>
              <p className="text-sm text-slate-500 mb-1">
                We've sent a password reset link to:
              </p>
              <p className="text-sm font-medium text-blue-600 mb-4">{email}</p>
              <p className="text-xs text-slate-400">
                The link expires in 15 minutes. Check spam if you don't see it.
              </p>
              <button
                onClick={() => { setSent(false); setEmail(''); }}
                className="mt-4 text-sm text-blue-600 hover:underline"
              >
                Try a different email
              </button>
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
