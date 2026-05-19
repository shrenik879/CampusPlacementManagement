import { useState, useRef, useEffect } from 'react';
import { Bell, Briefcase, CheckCircle, XCircle, Wifi, WifiOff, ListChecks, ArrowRightCircle } from 'lucide-react';

export default function NotificationBell({ notifications, unreadCount, connected, markAllRead }) {
  const [open, setOpen] = useState(false);
  const dropdownRef = useRef(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClick = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  const toggle = () => {
    setOpen(!open);
    if (!open && unreadCount > 0) markAllRead();
  };

  const formatTime = (ts) => {
    if (!ts) return '';
    const d = new Date(ts);
    const now = new Date();
    const diffMs = now - d;
    const diffMin = Math.floor(diffMs / 60000);
    if (diffMin < 1) return 'just now';
    if (diffMin < 60) return `${diffMin}m ago`;
    const diffHr = Math.floor(diffMin / 60);
    if (diffHr < 24) return `${diffHr}h ago`;
    return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
  };

  const getIcon = (n) => {
    if (n.type === 'new_job') return { bg: 'bg-blue-100 text-blue-600', icon: <Briefcase size={12} /> };
    if (n.type === 'broadcast') return { bg: 'bg-purple-100 text-purple-600', icon: <Bell size={12} /> };
    if (n.type === 'round_update') {
      return n.roundStatus === 'PASSED'
        ? { bg: 'bg-green-100 text-green-600', icon: <CheckCircle size={12} /> }
        : { bg: 'bg-red-100 text-red-600', icon: <XCircle size={12} /> };
    }
    if (n.type === 'status_update') {
      if (n.status === 'SELECTED') return { bg: 'bg-green-100 text-green-600', icon: <CheckCircle size={12} /> };
      if (n.status === 'IN_PROGRESS') return { bg: 'bg-blue-100 text-blue-600', icon: <ListChecks size={12} /> };
      if (n.status === 'REJECTED') return { bg: 'bg-red-100 text-red-600', icon: <XCircle size={12} /> };
    }
    return { bg: 'bg-slate-100 text-slate-600', icon: <ArrowRightCircle size={12} /> };
  };

  const getText = (n) => {
    if (n.type === 'new_job') {
      return <><strong>{n.jobTitle}</strong> posted by {n.companyName}</>;
    }
    if (n.type === 'broadcast') {
      return <>{n.message}</>;
    }
    if (n.type === 'round_update') {
      const label = n.roundStatus === 'PASSED' ? 'Passed' : 'Failed';
      return <>{label}: <strong>{n.roundName}</strong> — {n.jobTitle}</>;
    }
    if (n.type === 'status_update') {
      if (n.status === 'IN_PROGRESS') return <>Rounds started for <strong>{n.jobTitle}</strong></>;
      return <><strong>{n.jobTitle}</strong> — {n.status === 'SELECTED' ? 'Selected! 🎉' : 'Rejected'}</>;
    }
    return n.message || 'Notification';
  };

  const getLabel = (n) => {
    if (n.type === 'new_job')      return 'New Job';
    if (n.type === 'broadcast')    return 'Admin Announcement';
    if (n.type === 'round_update') return 'Round Update';
    if (n.type === 'status_update') {
      if (n.status === 'IN_PROGRESS') return 'Rounds Scheduled';
      return 'Status Update';
    }
    return 'Update';
  };

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Bell button */}
      <button
        onClick={toggle}
        className="relative p-1.5 rounded-md text-slate-500 hover:bg-slate-100 hover:text-slate-700 transition-colors"
        title="Notifications"
      >
        <Bell size={16} />
        {unreadCount > 0 && (
          <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center animate-pulse">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
        {/* Connection indicator */}
        <span className={`absolute bottom-0 right-0 w-2 h-2 rounded-full border border-white ${connected ? 'bg-green-400' : 'bg-slate-300'}`} />
      </button>

      {/* Dropdown */}
      {open && (
        <div className="absolute right-0 top-full mt-2 w-80 bg-white border border-slate-200 rounded-lg shadow-lg z-50 overflow-hidden"
          style={{ animation: 'fadeInDown 0.15s ease-out' }}
        >
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-2.5 border-b border-slate-100">
            <h3 className="text-sm font-semibold text-slate-700">Notifications</h3>
            <div className="flex items-center gap-1.5">
              {connected ? (
                <span className="flex items-center gap-1 text-[10px] text-green-600">
                  <Wifi size={10} /> Active
                </span>
              ) : (
                <span className="flex items-center gap-1 text-[10px] text-slate-400">
                  <WifiOff size={10} /> Offline
                </span>
              )}
            </div>
          </div>

          {/* Notification list */}
          <div className="max-h-80 overflow-y-auto">
            {notifications.length === 0 ? (
              <div className="px-4 py-8 text-center">
                <Bell size={24} className="mx-auto mb-2 text-slate-200" />
                <p className="text-sm text-slate-400">No notifications yet</p>
                <p className="text-xs text-slate-300 mt-0.5">
                  You'll see real-time updates here
                </p>
              </div>
            ) : (
              notifications.map((n) => {
                const { bg, icon } = getIcon(n);
                return (
                  <div
                    key={n.id}
                    className={`flex items-start gap-2.5 px-4 py-3 border-b border-slate-50 transition-colors ${
                      !n.read ? 'bg-blue-50/50' : 'hover:bg-slate-50'
                    }`}
                  >
                    {/* Icon */}
                    <div className={`mt-0.5 flex-shrink-0 w-7 h-7 rounded-full flex items-center justify-center ${bg}`}>
                      {icon}
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-400 mb-0.5">
                        {getLabel(n)}
                      </p>
                      <p className="text-xs font-medium text-slate-700 leading-snug">
                        {getText(n)}
                      </p>
                      <p className="text-[10px] text-slate-400 mt-0.5">
                        {formatTime(n.timestamp)}
                      </p>
                    </div>

                    {/* Unread dot */}
                    {!n.read && (
                      <span className="mt-1.5 w-2 h-2 bg-blue-500 rounded-full flex-shrink-0" />
                    )}
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}

      <style>{`
        @keyframes fadeInDown {
          from { opacity: 0; transform: translateY(-8px); }
          to   { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
}
