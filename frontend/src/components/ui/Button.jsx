// Clean flat button — light theme
export function Button({
  children, variant = 'primary', size = 'md',
  className = '', loading = false, ...props
}) {
  const base = 'inline-flex items-center justify-center gap-1.5 font-medium rounded border transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed select-none focus:outline-none focus:ring-2 focus:ring-blue-400 focus:ring-offset-1';

  const variants = {
    primary:   'bg-blue-600 hover:bg-blue-700 text-white border-blue-600',
    secondary: 'bg-white hover:bg-slate-50 text-slate-700 border-slate-300',
    danger:    'bg-red-600 hover:bg-red-700 text-white border-red-600',
    success:   'bg-green-600 hover:bg-green-700 text-white border-green-600',
    outline:   'bg-white hover:bg-blue-50 text-blue-600 border-blue-300',
    ghost:     'bg-transparent hover:bg-slate-100 text-slate-600 border-transparent',
  };

  const sizes = {
    xs: 'px-2 py-1 text-xs',
    sm: 'px-3 py-1.5 text-sm',
    md: 'px-4 py-2 text-sm',
    lg: 'px-5 py-2.5 text-sm',
  };

  return (
    <button
      className={`${base} ${variants[variant]} ${sizes[size]} ${className}`}
      disabled={loading || props.disabled}
      {...props}
    >
      {loading && (
        <span className="w-3.5 h-3.5 border-2 border-current border-t-transparent rounded-full animate-spin shrink-0" />
      )}
      {children}
    </button>
  );
}
