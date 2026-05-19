// Status badge — small coloured label, light theme
export function Badge({ status }) {
  const styles = {
    PENDING:      'bg-amber-50 text-amber-700 border border-amber-200',
    IN_PROGRESS:  'bg-blue-50 text-blue-700 border border-blue-200',
    SELECTED:     'bg-green-50 text-green-700 border border-green-200',
    REJECTED:     'bg-red-50 text-red-700 border border-red-200',
    PASSED:       'bg-green-50 text-green-700 border border-green-200',
    FAILED:       'bg-red-50 text-red-700 border border-red-200',
    SHORTLISTED:  'bg-blue-50 text-blue-700 border border-blue-200',
    ACTIVE:       'bg-blue-50 text-blue-700 border border-blue-200',
    OPEN:         'bg-green-50 text-green-700 border border-green-200',
    CLOSED:       'bg-slate-100 text-slate-500 border border-slate-200',
    ADMIN:        'bg-purple-50 text-purple-700 border border-purple-200',
    COMPANY:      'bg-indigo-50 text-indigo-700 border border-indigo-200',
    STUDENT:      'bg-sky-50 text-sky-700 border border-sky-200',
  };
  const label = {
    PENDING: 'Pending', IN_PROGRESS: 'In Progress', SELECTED: 'Selected', REJECTED: 'Rejected',
    PASSED: 'Passed', FAILED: 'Failed',
    SHORTLISTED: 'Shortlisted', ACTIVE: 'Active', OPEN: 'Open',
    CLOSED: 'Closed', ADMIN: 'Admin', COMPANY: 'Company', STUDENT: 'Student',
  };
  return (
    <span className={`inline-block px-2 py-0.5 rounded text-xs font-medium ${styles[status] || 'bg-slate-100 text-slate-600 border border-slate-200'}`}>
      {label[status] || status}
    </span>
  );
}
