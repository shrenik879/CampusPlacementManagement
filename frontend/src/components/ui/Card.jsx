// Card — white box with thin border, no heavy shadows
export function Card({ children, className = '', ...props }) {
  return (
    <div
      className={`bg-white border border-slate-200 rounded-lg ${className}`}
      {...props}
    >
      {children}
    </div>
  );
}

// Stat box — used in dashboards
export function StatCard({ icon: Icon, label, value, color = 'blue' }) {
  const colors = {
    blue:   { bg: 'bg-blue-50',   text: 'text-blue-600',   border: 'border-blue-100'   },
    green:  { bg: 'bg-green-50',  text: 'text-green-600',  border: 'border-green-100'  },
    amber:  { bg: 'bg-amber-50',  text: 'text-amber-600',  border: 'border-amber-100'  },
    red:    { bg: 'bg-red-50',    text: 'text-red-600',     border: 'border-red-100'    },
    purple: { bg: 'bg-purple-50', text: 'text-purple-600', border: 'border-purple-100' },
    slate:  { bg: 'bg-slate-50',  text: 'text-slate-600',  border: 'border-slate-200'  },
  };
  const c = colors[color] || colors.blue;
  return (
    <div className={`bg-white border ${c.border} rounded-lg p-4 flex items-center gap-3`}>
      {Icon && (
        <div className={`w-9 h-9 rounded ${c.bg} flex items-center justify-center shrink-0`}>
          <Icon size={18} className={c.text} />
        </div>
      )}
      <div>
        <p className="text-xs text-slate-500 font-medium uppercase tracking-wide">{label}</p>
        <p className="text-2xl font-semibold text-slate-800 leading-tight">{value}</p>
      </div>
    </div>
  );
}
