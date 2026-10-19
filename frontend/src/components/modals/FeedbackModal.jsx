import React, { useEffect, useRef } from 'react';
import { X, AlertCircle, CheckCircle2, Info } from 'lucide-react';

const FeedbackModal = ({
  isOpen,
  onClose,
  title,
  message,
  type = 'error'
}) => {
  const modalRef = useRef(null);
  const actionBtnRef = useRef(null);
  const previousFocusRef = useRef(null);

  useEffect(() => {
    if (!isOpen) return;

    previousFocusRef.current = document.activeElement;

    const timer = setTimeout(() => {
      if (actionBtnRef.current) {
        actionBtnRef.current.focus();
      }
    }, 50);

    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
        return;
      }

      if (e.key === 'Tab' && modalRef.current) {
        const focusable = modalRef.current.querySelectorAll(
          'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'
        );
        if (focusable.length === 0) return;

        const firstEl = focusable[0];
        const lastEl = focusable[focusable.length - 1];

        if (e.shiftKey) {
          if (document.activeElement === firstEl) {
            e.preventDefault();
            lastEl.focus();
          }
        } else {
          if (document.activeElement === lastEl) {
            e.preventDefault();
            firstEl.focus();
          }
        }
      }
    };

    document.addEventListener('keydown', handleKeyDown);

    return () => {
      clearTimeout(timer);
      document.removeEventListener('keydown', handleKeyDown);
      if (previousFocusRef.current && typeof previousFocusRef.current.focus === 'function') {
        previousFocusRef.current.focus();
      }
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  // Configure appearance based on the modal type
  const typeConfig = {
    error: {
      icon: <AlertCircle className="w-6 h-6 text-red-600" />,
      iconBg: 'bg-red-50 border border-red-100',
      btnBg: 'bg-[#1D2D44] hover:bg-[#152030] text-white',
    },
    success: {
      icon: <CheckCircle2 className="w-6 h-6 text-green-600" />,
      iconBg: 'bg-green-50 border border-green-100',
      btnBg: 'bg-[#1D2D44] hover:bg-[#152030] text-white',
    },
    info: {
      icon: <Info className="w-6 h-6 text-[#6c4df6]" />,
      iconBg: 'bg-[#f4f2fe] border border-[#e8e4fd]',
      btnBg: 'bg-[#1D2D44] hover:bg-[#152030] text-white',
    }
  };

  const config = typeConfig[type] || typeConfig.info;

  // Handle overlay click to close
  const handleOverlayClick = (e) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  return (
    <div 
      className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[4000] flex items-center justify-center p-4 animate-fade-in"
      onClick={handleOverlayClick}
    >
      <div 
        ref={modalRef}
        className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden transform transition-all animate-scale-up border border-slate-100"
        role="dialog"
        aria-modal="true"
        aria-labelledby="feedback-modal-title"
      >
        <div className="p-6 pb-4">
          <div className="flex items-start gap-4">
            {/* Icon Wrapper */}
            <div className={`p-3 rounded-xl flex-shrink-0 flex items-center justify-center ${config.iconBg}`}>
              {config.icon}
            </div>

            {/* Content */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between gap-2">
                <h3 
                  id="feedback-modal-title" 
                  className="text-lg font-bold text-slate-800 leading-6"
                >
                  {title}
                </h3>
                <button 
                  onClick={onClose} 
                  className="p-1 rounded-lg text-slate-400 hover:bg-slate-50 hover:text-slate-600 transition-colors duration-150"
                  aria-label="Close modal"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
              <p className="mt-2.5 text-sm text-slate-500 leading-relaxed break-words whitespace-pre-line">
                {message}
              </p>
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="bg-slate-50 px-6 py-4 flex items-center justify-end border-t border-slate-100">
          <button
            ref={actionBtnRef}
            type="button"
            onClick={onClose}
            className={`px-5 py-2 rounded-xl text-sm font-semibold transition-all duration-150 focus:outline-none focus:ring-2 focus:ring-offset-2 ${config.btnBg}`}
          >
            Okay
          </button>
        </div>
      </div>
    </div>
  );
};

export default FeedbackModal;
