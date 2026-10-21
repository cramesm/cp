import React, { useEffect, useRef } from 'react';
import { X, RotateCcw } from 'lucide-react';

const FilterDrawer = ({ isOpen, onClose, onClearAll, children, title = "Filters & Sort" }) => {
  const drawerRef = useRef(null);

  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === 'Escape' && isOpen) onClose();
    };

    if (isOpen) {
      document.body.style.overflow = 'hidden';
      document.addEventListener('keydown', handleEscape);
    } else {
      document.body.style.overflow = 'unset';
    }

    return () => {
      document.body.style.overflow = 'unset';
      document.removeEventListener('keydown', handleEscape);
    };
  }, [isOpen, onClose]);

  // Handle clicking on the backdrop to close
  const handleBackdropClick = (e) => {
    if (drawerRef.current && !drawerRef.current.contains(e.target)) {
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 z-[1000] bg-black/40 backdrop-blur-sm flex justify-end animate-fade-in"
      onClick={handleBackdropClick}
    >
      <div 
        ref={drawerRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="filter-drawer-title"
        className="w-full max-w-md h-full bg-white shadow-2xl flex flex-col animate-slide-left"
        onClick={(e) => e.stopPropagation()} 
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-100">
          <h2 id="filter-drawer-title" className="text-lg font-bold text-[#1D2D44]">{title}</h2>
          <div className="flex items-center gap-2">
            {onClearAll && (
              <button 
                onClick={onClearAll}
                className="flex items-center gap-1.5 px-3 py-1.5 min-h-[36px] touch-target text-xs font-bold text-slate-700 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors uppercase tracking-wider cursor-pointer"
              >
                <RotateCcw size={14} /> Clear All
              </button>
            )}
            <button 
              onClick={onClose}
              aria-label="Close filters"
              className="w-10 h-10 min-w-[40px] min-h-[40px] touch-target flex items-center justify-center rounded-full hover:bg-gray-100 text-slate-600 hover:text-slate-900 transition-colors cursor-pointer"
            >
              <X size={20} />
            </button>
          </div>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto p-6">
          <div className="flex flex-col gap-6">
            {children}
          </div>
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-gray-100 bg-gray-50">
          <button 
            onClick={onClose}
            className="w-full py-3 min-h-[44px] touch-target bg-[#1D2D44] text-white font-bold rounded-xl hover:bg-[#2A3F5C] transition-colors shadow-md cursor-pointer"
          >
            Apply Filters
          </button>
        </div>
      </div>
    </div>
  );
};

export default FilterDrawer;
