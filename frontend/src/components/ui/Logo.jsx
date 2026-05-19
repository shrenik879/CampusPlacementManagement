import { Link } from 'react-router-dom';

/**
 * Portal logo — uses user-supplied image from /images/logo.png
 * Falls back to an inline SVG badge if the image fails to load.
 */
export default function Logo({ linkTo = '/', className = '' }) {
  return (
    <Link
      to={linkTo}
      className={`inline-flex items-center gap-2.5 group focus:outline-none ${className}`}
    >
      <img
        src="/images/logo.jpg"
        alt="CPS Logo"
        className="h-10 w-auto object-contain transition-opacity duration-200 group-hover:opacity-80"
        onError={(e) => {
          // Fallback: hide broken image and show text mark
          e.currentTarget.style.display = 'none';
        }}
      />
      <div className="leading-none">
        <p className="text-sm font-bold text-slate-800 tracking-tight">Campus Placement</p>
        <p className="text-[11px] text-slate-400 mt-0.5 font-normal">Management System</p>
      </div>
    </Link>
  );
}
