import { useState } from 'react';
import { changePassword } from '../../services/authService';
import { useAuth } from '../../context/AuthContext';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import PageHeader from '../../components/ui/PageHeader';
import { Lock, Eye, EyeOff, CheckCircle } from 'lucide-react';
import toast from 'react-hot-toast';

export default function ChangePasswordPage() {
  const { user } = useAuth();
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [showOld, setShowOld] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [done, setDone] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (newPassword.length < 6) return toast.error('Password must be at least 6 characters');
    if (newPassword !== confirmPassword) return toast.error('Passwords do not match');
    if (oldPassword === newPassword) return toast.error('New password must be different');

    setLoading(true);
    try {
      await changePassword({
        email: user.email,
        oldPassword,
        newPassword,
      });
      toast.success('Password changed successfully!');
      setDone(true);
      setOldPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to change password');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-md">
      <PageHeader title="Change Password" subtitle="Update your account password" />

      <div className="bg-white border border-slate-200 rounded-lg p-6">
        {done && (
          <div className="flex items-center gap-2 px-4 py-3 mb-5 bg-green-50 border border-green-200 rounded-lg">
            <CheckCircle size={15} className="text-green-600 flex-shrink-0" />
            <p className="text-sm text-green-700">Password changed successfully!</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Old Password */}
          <div className="relative">
            <Input
              label="Current Password"
              type={showOld ? 'text' : 'password'}
              placeholder="Enter your current password"
              value={oldPassword}
              onChange={(e) => setOldPassword(e.target.value)}
              required
            />
            <button
              type="button"
              onClick={() => setShowOld(!showOld)}
              className="absolute right-3 top-8 text-slate-400 hover:text-slate-600"
            >
              {showOld ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          </div>

          {/* New Password */}
          <div className="relative">
            <Input
              label="New Password"
              type={showNew ? 'text' : 'password'}
              placeholder="Enter new password (min 6 chars)"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              required
            />
            <button
              type="button"
              onClick={() => setShowNew(!showNew)}
              className="absolute right-3 top-8 text-slate-400 hover:text-slate-600"
            >
              {showNew ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          </div>

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

          {/* Confirm Password */}
          <Input
            label="Confirm New Password"
            type="password"
            placeholder="Re-enter new password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            required
          />

          {confirmPassword && newPassword !== confirmPassword && (
            <p className="text-xs text-red-500">Passwords do not match</p>
          )}

          <Button
            variant="primary"
            size="md"
            loading={loading}
            className="w-full"
            disabled={!oldPassword || !newPassword || !confirmPassword || newPassword !== confirmPassword}
          >
            <Lock size={14} />
            {loading ? 'Changing...' : 'Change Password'}
          </Button>
        </form>
      </div>
    </div>
  );
}
