// Spinner — small, light theme
export function Spinner({ size = 'md' }) {
  const sz = { sm: 'w-4 h-4', md: 'w-6 h-6', lg: 'w-9 h-9' };
  return (
    <div className="flex items-center justify-center py-8">
      <span className={`${sz[size]} border-2 border-slate-200 border-t-blue-600 rounded-full animate-spin`} />
    </div>
  );
}

export function PageLoader() {
  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center">
      <div className="flex flex-col items-center gap-3">
        <span className="w-8 h-8 border-2 border-slate-200 border-t-blue-600 rounded-full animate-spin" />
        <p className="text-sm text-slate-400">Loading...</p>
      </div>
    </div>
  );
}

// Skeleton shimmer rows for tables
export function SkeletonRow({ cols = 4 }) {
  return (
    <tr>
      {Array.from({ length: cols }).map((_, i) => (
        <td key={i} className="px-4 py-3">
          <div className="h-3.5 rounded shimmer" style={{ width: `${60 + (i % 3) * 20}%` }} />
        </td>
      ))}
    </tr>
  );
}
