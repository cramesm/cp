import { useState, useMemo } from 'react';
import { 
  ChevronLeft, ChevronRight, Calendar as CalendarIcon, 
  RotateCcw, Sparkles, Check, Clock, ArrowRight, Info 
} from 'lucide-react';

// Helper date utilities
const toDate = (val) => {
  if (!val) return null;
  if (val instanceof Date) return isNaN(val.getTime()) ? null : val;
  const parsed = new Date(val);
  return isNaN(parsed.getTime()) ? null : parsed;
};

const toISODateString = (date) => {
  if (!date) return '';
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
};

const isSameDay = (d1, d2) => {
  if (!d1 || !d2) return false;
  return (
    d1.getFullYear() === d2.getFullYear() &&
    d1.getMonth() === d2.getMonth() &&
    d1.getDate() === d2.getDate()
  );
};

const isBeforeDay = (d1, d2) => {
  if (!d1 || !d2) return false;
  const a = new Date(d1.getFullYear(), d1.getMonth(), d1.getDate()).getTime();
  const b = new Date(d2.getFullYear(), d2.getMonth(), d2.getDate()).getTime();
  return a < b;
};

const isAfterDay = (d1, d2) => {
  if (!d1 || !d2) return false;
  const a = new Date(d1.getFullYear(), d1.getMonth(), d1.getDate()).getTime();
  const b = new Date(d2.getFullYear(), d2.getMonth(), d2.getDate()).getTime();
  return a > b;
};

const isBetweenDays = (date, start, end) => {
  if (!date || !start || !end) return false;
  return isAfterDay(date, start) && isBeforeDay(date, end);
};

const addDays = (date, n) => {
  const d = new Date(date);
  d.setDate(d.getDate() + n);
  return d;
};

const countBusinessDays = (start, end) => {
  if (!start || !end) return 0;
  let count = 0;
  const cur = new Date(start);
  while (cur <= end) {
    const dayOfWeek = cur.getDay();
    if (dayOfWeek !== 0 && dayOfWeek !== 6) {
      count++;
    }
    cur.setDate(cur.getDate() + 1);
  }
  return count;
};

const monthNames = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

const dayLabels = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];

export default function AirbnbDateRangePicker({
  startDate: propStartDate = null,
  endDate: propEndDate = null,
  onChange,
  readOnly = false,
  minDate = null,
  label = 'Estimated Document Processing Window',
  hint = 'Select start and completion dates to establish the student processing schedule.'
}) {
  const today = useMemo(() => {
    if (minDate) {
      const md = toDate(minDate);
      if (md) return new Date(md.getFullYear(), md.getMonth(), md.getDate());
    }
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), now.getDate());
  }, [minDate]);

  const parsedStart = toDate(propStartDate);
  const parsedEnd = toDate(propEndDate);

  // Current view offset: displayed month for Left calendar
  const initialMonth = parsedStart ? new Date(parsedStart.getFullYear(), parsedStart.getMonth(), 1) : new Date(today.getFullYear(), today.getMonth(), 1);
  const [currentMonthDate, setCurrentMonthDate] = useState(initialMonth);
  const [hoveredDate, setHoveredDate] = useState(null);
  const [activeInput, setActiveInput] = useState('start'); // 'start' | 'end'

  // Standard document processing presets
  const presets = [
    { label: '3 Days (Rush)', days: 3, desc: 'Expedited processing' },
    { label: '5 Days (Standard)', days: 5, desc: 'TOR, Certifications' },
    { label: '7 Days (Comprehensive)', days: 7, desc: 'CTC, Verification' },
    { label: '10 Days (Diploma Copy)', days: 10, desc: 'Archived records' }
  ];

  const handlePrevMonth = () => {
    setCurrentMonthDate(prev => new Date(prev.getFullYear(), prev.getMonth() - 1, 1));
  };

  const handleNextMonth = () => {
    setCurrentMonthDate(prev => new Date(prev.getFullYear(), prev.getMonth() + 1, 1));
  };

  // Month 1 and Month 2
  const month1 = currentMonthDate;
  const month2 = new Date(currentMonthDate.getFullYear(), currentMonthDate.getMonth() + 1, 1);

  const handleDateClick = (clickedDate) => {
    if (readOnly) return;
    if (isBeforeDay(clickedDate, today)) return;

    if (!parsedStart || (parsedStart && parsedEnd)) {
      // Starting new selection
      if (onChange) {
        onChange({
          startDate: toISODateString(clickedDate),
          endDate: null,
          startDateObj: clickedDate,
          endDateObj: null
        });
      }
      setActiveInput('end');
    } else if (parsedStart && !parsedEnd) {
      if (isBeforeDay(clickedDate, parsedStart)) {
        // User clicked a date before current start date -> make it the new start date
        if (onChange) {
          onChange({
            startDate: toISODateString(clickedDate),
            endDate: null,
            startDateObj: clickedDate,
            endDateObj: null
          });
        }
        setActiveInput('end');
      } else {
        // Complete the range
        if (onChange) {
          onChange({
            startDate: toISODateString(parsedStart),
            endDate: toISODateString(clickedDate),
            startDateObj: parsedStart,
            endDateObj: clickedDate
          });
        }
        setActiveInput('start');
      }
    }
  };

  const handleApplyPreset = (days) => {
    if (readOnly) return;
    const start = parsedStart && !isBeforeDay(parsedStart, today) ? parsedStart : today;
    const end = addDays(start, days);
    if (onChange) {
      onChange({
        startDate: toISODateString(start),
        endDate: toISODateString(end),
        startDateObj: start,
        endDateObj: end
      });
    }
    setActiveInput('start');
  };

  const handleClear = () => {
    if (readOnly) return;
    if (onChange) {
      onChange({
        startDate: null,
        endDate: null,
        startDateObj: null,
        endDateObj: null
      });
    }
    setActiveInput('start');
  };

  // Render a single calendar month grid
  const renderMonth = (monthDate) => {
    const year = monthDate.getFullYear();
    const month = monthDate.getMonth();
    const firstDayIndex = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();

    const days = [];
    // Blank offsets for start of month
    for (let i = 0; i < firstDayIndex; i++) {
      days.push(
        <div key={`blank-${i}`} className="h-10 w-full" />
      );
    }

    // Days in current month
    for (let dayNum = 1; dayNum <= daysInMonth; dayNum++) {
      const date = new Date(year, month, dayNum);
      const isPast = isBeforeDay(date, today);
      const isStart = isSameDay(date, parsedStart);
      const isEnd = isSameDay(date, parsedEnd);
      const isCurrentToday = isSameDay(date, today);

      // Range evaluation
      const effectiveEnd = parsedEnd || (hoveredDate && isAfterDay(hoveredDate, parsedStart) ? hoveredDate : null);
      const inRange = parsedStart && effectiveEnd && isBetweenDays(date, parsedStart, effectiveEnd);
      const isHoverEnd = hoveredDate && isSameDay(date, hoveredDate) && !parsedEnd && parsedStart && isAfterDay(hoveredDate, parsedStart);

      let cellTrackClasses = '';
      if (inRange) {
        cellTrackClasses = 'bg-blue-50/80 text-blue-900';
      }
      if (isStart && (parsedEnd || isHoverEnd)) {
        cellTrackClasses = 'bg-gradient-to-r from-transparent via-blue-50/50 to-blue-50/80';
      }
      if (isEnd || isHoverEnd) {
        cellTrackClasses = 'bg-gradient-to-l from-transparent via-blue-50/50 to-blue-50/80';
      }

      let btnClasses = 'relative z-10 w-9 h-9 rounded-full flex items-center justify-center text-xs font-semibold transition-all duration-150 ';

      if (isPast) {
        btnClasses += 'text-slate-300 cursor-not-allowed';
      } else if (isStart || isEnd) {
        btnClasses += 'bg-[#1e293b] text-white font-extrabold shadow-md scale-105 hover:bg-[#0f172a]';
      } else if (isHoverEnd) {
        btnClasses += 'bg-blue-600 text-white font-bold shadow-sm scale-105';
      } else if (inRange) {
        btnClasses += 'text-blue-900 font-bold hover:bg-blue-100 rounded-lg';
      } else {
        btnClasses += 'text-slate-700 hover:bg-slate-100 cursor-pointer';
      }

      days.push(
        <div
          key={`day-${dayNum}`}
          className={`h-10 w-full flex items-center justify-center relative ${cellTrackClasses}`}
          onMouseEnter={() => {
            if (!readOnly && parsedStart && !parsedEnd && !isPast) {
              setHoveredDate(date);
            }
          }}
          onMouseLeave={() => setHoveredDate(null)}
        >
          <button
            type="button"
            disabled={isPast || readOnly}
            onClick={() => handleDateClick(date)}
            className={btnClasses}
            title={date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
          >
            <span>{dayNum}</span>
            {isCurrentToday && !isStart && !isEnd && (
              <span className="absolute bottom-1 w-1 h-1 rounded-full bg-blue-600"></span>
            )}
          </button>
        </div>
      );
    }

    return (
      <div className="flex-1 min-w-[270px]">
        <div className="text-center font-bold text-slate-800 text-sm py-2 mb-1 tracking-tight">
          {monthNames[month]} {year}
        </div>
        <div className="grid grid-cols-7 mb-1 text-center">
          {dayLabels.map(d => (
            <span key={d} className="text-[11px] font-bold text-slate-400 py-1">
              {d}
            </span>
          ))}
        </div>
        <div className="grid grid-cols-7 gap-y-0.5">
          {days}
        </div>
      </div>
    );
  };

  const totalCalendarDays = useMemo(() => {
    if (!parsedStart || !parsedEnd) return null;
    const diffTime = Math.abs(parsedEnd - parsedStart);
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  }, [parsedStart, parsedEnd]);

  const totalBusinessDays = useMemo(() => {
    if (!parsedStart || !parsedEnd) return null;
    return countBusinessDays(parsedStart, parsedEnd);
  }, [parsedStart, parsedEnd]);

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden transition-all">
      {/* Header Bar */}
      <div className="p-4 sm:p-5 bg-gradient-to-r from-slate-50 to-blue-50/40 border-b border-slate-200">
        <div className="flex items-center justify-between gap-3 flex-wrap mb-3">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-blue-600 text-white flex items-center justify-center shadow-xs">
              <CalendarIcon size={16} />
            </div>
            <div>
              <h3 className="font-extrabold text-slate-800 text-sm tracking-tight">{label}</h3>
              <p className="text-[11px] text-slate-500 font-medium">{hint}</p>
            </div>
          </div>

          {/* Duration Badge & Reset */}
          <div className="flex items-center gap-2">
            {parsedStart && parsedEnd && (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-blue-100 text-blue-800 border border-blue-200">
                <Clock size={12} className="text-blue-600" />
                <span>{totalCalendarDays} Days Window ({totalBusinessDays} Working Days)</span>
              </span>
            )}
            {!readOnly && (parsedStart || parsedEnd) && (
              <button
                type="button"
                onClick={handleClear}
                className="text-xs font-bold text-slate-500 hover:text-slate-800 flex items-center gap-1 px-2.5 py-1 rounded-lg hover:bg-slate-200/60 transition-colors cursor-pointer"
                title="Reset date selection"
              >
                <RotateCcw size={12} />
                <span>Reset</span>
              </button>
            )}
          </div>
        </div>

        {/* Airbnb-style Split Date Inputs */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 bg-white p-1 rounded-xl border border-slate-200 shadow-2xs">
          <div
            onClick={() => !readOnly && setActiveInput('start')}
            className={`p-3 rounded-lg transition-all flex items-center justify-between cursor-pointer ${
              activeInput === 'start' && !readOnly
                ? 'bg-blue-50/70 border border-blue-300 ring-2 ring-blue-500/20'
                : 'hover:bg-slate-50 border border-transparent'
            }`}
          >
            <div>
              <span className="block text-[10px] font-extrabold uppercase tracking-wider text-slate-400">
                Processing Start Date
              </span>
              <span className="block text-sm font-bold text-slate-800 mt-0.5">
                {parsedStart
                  ? parsedStart.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })
                  : 'Select start date'}
              </span>
            </div>
            <CalendarIcon size={16} className={activeInput === 'start' ? 'text-blue-600' : 'text-slate-400'} />
          </div>

          <div
            onClick={() => !readOnly && setActiveInput('end')}
            className={`p-3 rounded-lg transition-all flex items-center justify-between cursor-pointer ${
              activeInput === 'end' && !readOnly
                ? 'bg-blue-50/70 border border-blue-300 ring-2 ring-blue-500/20'
                : 'hover:bg-slate-50 border border-transparent'
            }`}
          >
            <div>
              <span className="block text-[10px] font-extrabold uppercase tracking-wider text-slate-400">
                Estimated Ready / Completion
              </span>
              <span className="block text-sm font-bold text-slate-800 mt-0.5">
                {parsedEnd
                  ? parsedEnd.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })
                  : 'Select completion date'}
              </span>
            </div>
            <ArrowRight size={16} className={activeInput === 'end' ? 'text-blue-600' : 'text-slate-400'} />
          </div>
        </div>

        {/* Quick Presets */}
        {!readOnly && (
          <div className="flex items-center gap-1.5 flex-wrap mt-3 pt-2 border-t border-slate-200/60">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mr-1 flex items-center gap-1">
              <Sparkles size={11} className="text-amber-500" />
              <span>Standard Presets:</span>
            </span>
            {presets.map(p => (
              <button
                key={p.days}
                type="button"
                onClick={() => handleApplyPreset(p.days)}
                className="text-[11px] font-bold px-3 py-1 rounded-full bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 hover:border-slate-300 transition-all shadow-2xs cursor-pointer flex items-center gap-1"
                title={p.desc}
              >
                <span>{p.label}</span>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Dual Month Calendar View */}
      <div className="p-4 sm:p-6 space-y-4">
        {/* Navigation arrows */}
        <div className="flex items-center justify-between px-2">
          <button
            type="button"
            onClick={handlePrevMonth}
            disabled={isBeforeDay(month1, new Date(today.getFullYear(), today.getMonth(), 1))}
            className="w-8 h-8 rounded-full border border-slate-200 flex items-center justify-center text-slate-600 hover:bg-slate-100 hover:text-slate-900 transition-colors disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer shadow-2xs"
            title="Previous month"
          >
            <ChevronLeft size={16} />
          </button>
          <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
            Navigate Months
          </span>
          <button
            type="button"
            onClick={handleNextMonth}
            className="w-8 h-8 rounded-full border border-slate-200 flex items-center justify-center text-slate-600 hover:bg-slate-100 hover:text-slate-900 transition-colors cursor-pointer shadow-2xs"
            title="Next month"
          >
            <ChevronRight size={16} />
          </button>
        </div>

        {/* Side-by-side Months Container */}
        <div className="flex flex-col md:flex-row gap-8 justify-between">
          {renderMonth(month1)}
          <div className="hidden md:block w-px bg-slate-100 self-stretch my-2"></div>
          {renderMonth(month2)}
        </div>
      </div>

      {/* Footer Info / Processing Notice */}
      <div className="px-5 py-3.5 bg-slate-50/80 border-t border-slate-200 flex items-center justify-between gap-3 text-xs flex-wrap">
        <div className="flex items-center gap-2 text-slate-600">
          <Info size={14} className="text-blue-500 shrink-0" />
          {parsedStart && parsedEnd ? (
            <span>
              Processing window is established from <strong>{parsedStart.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</strong> to <strong>{parsedEnd.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</strong>.
            </span>
          ) : (
            <span className="text-slate-500">
              Click on a start date, then click on the target completion date to set the processing window.
            </span>
          )}
        </div>
        {parsedStart && parsedEnd && (
          <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200">
            <Check size={12} className="text-emerald-600" />
            <span>Schedule Configured</span>
          </span>
        )}
      </div>
    </div>
  );
}
