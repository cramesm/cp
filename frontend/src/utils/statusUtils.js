/**
 * Centralized Status Color Coding & Badges for VeriFitor Web
 * Provides distinct, harmonious, high-contrast color palettes for all document, payment, and system statuses.
 */

export const STATUS_CONFIG = {
  // Document Request Statuses
  'Pending for Payment': {
    badge: 'bg-sky-50 text-sky-700 border-sky-200/80',
    dot: 'bg-sky-500',
    label: 'Pending for Payment',
  },
  'Pending': {
    badge: 'bg-amber-50 text-amber-700 border-amber-200/80',
    dot: 'bg-amber-500',
    label: 'Pending',
  },
  'Pending Verification': {
    badge: 'bg-amber-50 text-amber-700 border-amber-200/80',
    dot: 'bg-amber-500',
    label: 'Pending Verification',
  },
  'Needs Update': {
    badge: 'bg-orange-50 text-orange-700 border-orange-200/80',
    dot: 'bg-orange-500',
    label: 'Needs Update',
  },
  'In Process': {
    badge: 'bg-blue-50 text-blue-700 border-blue-200/80',
    dot: 'bg-blue-500',
    label: 'In Process',
  },
  'Ready to Claim': {
    badge: 'bg-teal-50 text-teal-700 border-teal-200/80',
    dot: 'bg-teal-500',
    label: 'Ready to Claim',
  },
  'Released': {
    badge: 'bg-emerald-50 text-emerald-700 border-emerald-200/80',
    dot: 'bg-emerald-500',
    label: 'Released',
  },
  'Claimed': {
    badge: 'bg-indigo-50 text-indigo-700 border-indigo-200/80',
    dot: 'bg-indigo-500',
    label: 'Claimed',
  },
  'Completed': {
    badge: 'bg-emerald-50 text-emerald-700 border-emerald-200/80',
    dot: 'bg-emerald-500',
    label: 'Completed',
  },
  'Approved': {
    badge: 'bg-emerald-50 text-emerald-700 border-emerald-200/80',
    dot: 'bg-emerald-500',
    label: 'Approved',
  },
  'Rejected': {
    badge: 'bg-red-50 text-red-700 border-red-200/80',
    dot: 'bg-red-500',
    label: 'Rejected',
  },
  'Refund Approved': {
    badge: 'bg-cyan-50 text-cyan-700 border-cyan-200/80',
    dot: 'bg-cyan-500',
    label: 'Refund Approved',
  },
  'Refunded': {
    badge: 'bg-purple-50 text-purple-700 border-purple-200/80',
    dot: 'bg-purple-500',
    label: 'Refunded',
  },
  'Recorded': {
    badge: 'bg-emerald-50 text-emerald-700 border-emerald-200/80',
    dot: 'bg-emerald-500',
    label: 'Recorded',
  },
  'Successful': {
    badge: 'bg-emerald-50 text-emerald-700 border-emerald-200/80',
    dot: 'bg-emerald-500',
    label: 'Successful',
  },
  'Active': {
    badge: 'bg-emerald-50 text-emerald-700 border-emerald-200/80',
    dot: 'bg-emerald-500',
    label: 'Active',
  },
  'Inactive': {
    badge: 'bg-slate-100 text-slate-600 border-slate-200/80',
    dot: 'bg-slate-400',
    label: 'Inactive',
  },
  'Failed': {
    badge: 'bg-red-50 text-red-700 border-red-200/80',
    dot: 'bg-red-500',
    label: 'Failed',
  },
};

/**
 * Returns the badge and dot styling configuration for any status string.
 * Supports exact and case-insensitive lookups with a safe fallback.
 */
export const getStatusConfig = (status) => {
  if (!status) {
    return {
      badge: 'bg-slate-100 text-slate-600 border-slate-200/80',
      dot: 'bg-slate-400',
      label: 'Unknown',
    };
  }

  const trimmed = String(status).trim();
  if (STATUS_CONFIG[trimmed]) {
    return STATUS_CONFIG[trimmed];
  }

  const lower = trimmed.toLowerCase();
  for (const [key, config] of Object.entries(STATUS_CONFIG)) {
    if (key.toLowerCase() === lower) {
      return { ...config, label: trimmed };
    }
  }

  return {
    badge: 'bg-slate-100 text-slate-600 border-slate-200/80',
    dot: 'bg-slate-400',
    label: trimmed,
  };
};
