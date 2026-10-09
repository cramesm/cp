import PropTypes from 'prop-types';
import { X } from 'lucide-react';

const isDefaultFilterValue = (item) => {
  if (!item) return true;
  const val = item.value;
  if (val === undefined || val === null) return true;

  if (item.defaultValue !== undefined && item.defaultValue !== null) {
    if (val === item.defaultValue) return true;
    if (
      typeof val === 'string' &&
      typeof item.defaultValue === 'string' &&
      val.trim().toLowerCase() === item.defaultValue.trim().toLowerCase()
    ) {
      return true;
    }
  }

  if (typeof val === 'string') {
    const trimmed = val.trim();
    if (!trimmed) return true;
    const lower = trimmed.toLowerCase();
    if (
      lower === 'all' ||
      lower.startsWith('all ') ||
      lower.startsWith('all-') ||
      lower === 'none' ||
      lower === 'default'
    ) {
      return true;
    }
  }

  return false;
};

const ActiveFilterChips = ({ filters, onRemove, onClearAll }) => {
  if (!Array.isArray(filters)) return null;

  const activeFilters = filters.filter((f) => f && !isDefaultFilterValue(f));

  if (activeFilters.length === 0) return null;

  return (
    <div className="flex flex-wrap items-center gap-2 mt-4 mb-2">
      <span className="text-xs font-bold text-gray-600 uppercase tracking-wider mr-1">
        Active Filters:
      </span>
      {activeFilters.map((filter, index) => (
        <div 
          key={filter.key || `${filter.label}-${index}`} 
          className="flex items-center gap-1.5 px-3 py-1 bg-blue-50 border border-blue-100 text-blue-700 text-xs font-semibold rounded-full shadow-sm"
        >
          <span>
            <span className="text-blue-700 font-bold">{filter.label}:</span>{' '}
            {filter.value}
          </span>
          <button 
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onRemove?.(filter.key);
            }}
            className="p-0.5 hover:bg-blue-200 rounded-full transition-colors text-blue-700 hover:text-blue-900 cursor-pointer"
            aria-label={`Remove ${filter.label} filter`}
            title={`Remove ${filter.label} filter`}
          >
            <X size={12} />
          </button>
        </div>
      ))}
      {onClearAll && (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onClearAll();
          }}
          className="text-[11px] font-bold text-slate-500 hover:text-rose-600 px-2 py-0.5 rounded transition-colors cursor-pointer"
        >
          Clear all
        </button>
      )}
    </div>
  );
};

ActiveFilterChips.propTypes = {
  filters: PropTypes.arrayOf(
    PropTypes.shape({
      label: PropTypes.string,
      value: PropTypes.any,
      key: PropTypes.string,
      defaultValue: PropTypes.any,
    })
  ),
  onRemove: PropTypes.func.isRequired,
  onClearAll: PropTypes.func,
};

export default ActiveFilterChips;
