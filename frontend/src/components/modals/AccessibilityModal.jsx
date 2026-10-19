import React, { useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAccessibility } from '../../context/AccessibilityContext';
import { 
    X, 
    Sparkles, 
    Eye, 
    Type, 
    SunMedium, 
    Info 
} from 'lucide-react';

const AccessibilityModal = () => {
    const {
        settingsModalOpen,
        setSettingsModalOpen,
        simpleMode,
        toggleSimpleMode,
        fontSize,
        setFontSize,
        highContrast,
        toggleHighContrast
    } = useAccessibility();

    const modalRef = useRef(null);
    const closeBtnRef = useRef(null);
    const previousFocusRef = useRef(null);

    // Auto-focus first element upon opening, restore focus upon closing
    useEffect(() => {
        if (settingsModalOpen) {
            previousFocusRef.current = document.activeElement;
            const timer = setTimeout(() => {
                if (closeBtnRef.current) {
                    closeBtnRef.current.focus();
                }
            }, 60);
            return () => clearTimeout(timer);
        } else if (previousFocusRef.current && typeof previousFocusRef.current.focus === 'function') {
            previousFocusRef.current.focus();
        }
    }, [settingsModalOpen]);

    // Handle Escape key and Tab focus trapping inside the modal
    useEffect(() => {
        if (!settingsModalOpen) return;

        const handleKeyDown = (e) => {
            if (e.key === 'Escape') {
                e.preventDefault();
                setSettingsModalOpen(false);
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
        return () => document.removeEventListener('keydown', handleKeyDown);
    }, [settingsModalOpen, setSettingsModalOpen]);

    const handleTextSizeKeyDown = (e, currentId) => {
        const order = ['normal', 'large', 'xl'];
        const currentIndex = order.indexOf(currentId);
        if (e.key === 'ArrowRight' || e.key === 'ArrowDown') {
            e.preventDefault();
            const nextIndex = (currentIndex + 1) % order.length;
            setFontSize(order[nextIndex]);
            const nextBtn = modalRef.current?.querySelector(`[data-size="${order[nextIndex]}"]`);
            if (nextBtn) nextBtn.focus();
        } else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
            e.preventDefault();
            const prevIndex = (currentIndex - 1 + order.length) % order.length;
            setFontSize(order[prevIndex]);
            const prevBtn = modalRef.current?.querySelector(`[data-size="${order[prevIndex]}"]`);
            if (prevBtn) prevBtn.focus();
        }
    };

    if (!settingsModalOpen) return null;

    return (
        <AnimatePresence>
            <div className="fixed inset-0 z-[10000] flex items-center justify-center p-4">
                {/* Backdrop */}
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    onClick={() => setSettingsModalOpen(false)}
                    className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm"
                />

                {/* Modal Window */}
                <motion.div
                    ref={modalRef}
                    initial={{ opacity: 0, scale: 0.95, y: 10 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95, y: 10 }}
                    transition={{ type: 'spring', duration: 0.3 }}
                    className="relative w-full max-w-lg bg-white rounded-3xl shadow-2xl border border-slate-200/80 overflow-hidden z-10 text-slate-800"
                    role="dialog"
                    aria-modal="true"
                    aria-labelledby="accessibility-title"
                >
                    {/* Header */}
                    <div className="bg-gradient-to-r from-[#2c3e50] to-[#3d5a73] p-5 text-white flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-2xl bg-white/10 backdrop-blur-md flex items-center justify-center border border-white/20 shadow-inner">
                                <Sparkles className="w-5 h-5 text-cyan-300" />
                            </div>
                            <div>
                                <h3 id="accessibility-title" className="text-lg font-bold tracking-tight">
                                    Display & Assistance
                                </h3>
                                <p className="text-xs text-slate-300 font-normal">
                                    Customize readability and simplified display preferences
                                </p>
                            </div>
                        </div>
                        <button
                            ref={closeBtnRef}
                            onClick={() => setSettingsModalOpen(false)}
                            className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-[#2c3e50] cursor-pointer"
                            aria-label="Close settings"
                        >
                            <X size={18} />
                        </button>
                    </div>

                    {/* Body */}
                    <div className="p-6 space-y-6 max-h-[80vh] overflow-y-auto custom-scrollbar">
                        
                        {/* 1. Simple Mode Card */}
                        <div className={`p-4 rounded-2xl border transition-all ${
                            simpleMode 
                                ? 'bg-blue-50/70 border-blue-300 shadow-sm' 
                                : 'bg-slate-50 border-slate-200'
                        }`}>
                            <div className="flex items-start justify-between gap-4">
                                <div className="flex items-start gap-3">
                                    <div className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 mt-0.5 ${
                                        simpleMode ? 'bg-blue-600 text-white' : 'bg-slate-200 text-slate-600'
                                    }`}>
                                        <Eye size={20} />
                                    </div>
                                    <div>
                                        <div className="flex items-center gap-2">
                                            <h4 className="font-bold text-sm text-slate-900">Simple Mode (Senior / Easy View)</h4>
                                            {simpleMode && (
                                                <span className="px-2 py-0.5 text-[10px] font-extrabold uppercase tracking-wider bg-blue-600 text-white rounded-full">
                                                    Active
                                                </span>
                                            )}
                                        </div>
                                        <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                                            Enlarges text and buttons, sharpens contrast, and simplifies technical blockchain terms into plain language.
                                        </p>
                                    </div>
                                </div>

                                {/* Switch Toggle */}
                                <button
                                    type="button"
                                    onClick={toggleSimpleMode}
                                    role="switch"
                                    aria-checked={simpleMode}
                                    aria-label="Toggle Simple Mode (Senior / Easy View)"
                                    className={`relative inline-flex h-7 w-12 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 focus-visible:ring-offset-2 ${
                                        simpleMode ? 'bg-blue-600' : 'bg-slate-300'
                                    }`}
                                >
                                    <span
                                        aria-hidden="true"
                                        className={`pointer-events-none inline-block h-6 w-6 transform rounded-full bg-white shadow-md ring-0 transition duration-200 ease-in-out ${
                                            simpleMode ? 'translate-x-5' : 'translate-x-0'
                                        }`}
                                    />
                                </button>
                            </div>
                        </div>

                        {/* 2. Text Size Selector */}
                        <div className="space-y-2">
                            <label className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-2">
                                <Type size={15} className="text-slate-500" />
                                <span>Text Size</span>
                            </label>
                            <div className="grid grid-cols-3 gap-2.5" role="radiogroup" aria-label="Text size options">
                                {[
                                    { id: 'normal', label: 'Standard', sub: '100%', sample: 'Aa' },
                                    { id: 'large', label: 'Large', sub: '115%', sample: 'Aa+' },
                                    { id: 'xl', label: 'Extra Large', sub: '130%', sample: 'Aa++' }
                                ].map(option => (
                                    <button
                                        key={option.id}
                                        type="button"
                                        data-size={option.id}
                                        role="radio"
                                        aria-checked={fontSize === option.id}
                                        aria-label={`Text size ${option.label} (${option.sub})`}
                                        onClick={() => setFontSize(option.id)}
                                        onKeyDown={(e) => handleTextSizeKeyDown(e, option.id)}
                                        className={`p-3 rounded-2xl border flex flex-col items-center justify-center gap-1 transition-all cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 focus-visible:ring-offset-2 ${
                                            fontSize === option.id
                                                ? 'bg-blue-50/80 border-blue-500 text-blue-800 shadow-sm ring-2 ring-blue-500/20'
                                                : 'bg-white border-slate-200 hover:border-slate-300 text-slate-700'
                                        }`}
                                    >
                                        <span className={`font-black ${option.id === 'xl' ? 'text-lg' : option.id === 'large' ? 'text-base' : 'text-sm'}`}>
                                            {option.sample}
                                        </span>
                                        <span className="text-xs font-bold">{option.label}</span>
                                        <span className="text-[10px] text-slate-600">{option.sub}</span>
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* 3. High Contrast Switch */}
                        <div className="flex items-center justify-between p-3.5 rounded-2xl border border-slate-200 bg-white">
                            <div className="flex items-center gap-3">
                                <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center">
                                    <SunMedium size={18} />
                                </div>
                                <div>
                                    <h5 className="text-xs font-bold text-slate-900">High Contrast Mode</h5>
                                    <p className="text-[11px] text-slate-600">Sharpen text and border lines for higher clarity</p>
                                </div>
                            </div>
                            <button
                                type="button"
                                onClick={toggleHighContrast}
                                role="switch"
                                aria-checked={highContrast}
                                aria-label="Toggle High Contrast Mode"
                                className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-600 focus-visible:ring-offset-2 ${
                                    highContrast ? 'bg-amber-600' : 'bg-slate-300'
                                }`}
                            >
                                <span
                                    aria-hidden="true"
                                    className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-md ring-0 transition duration-200 ease-in-out ${
                                        highContrast ? 'translate-x-5' : 'translate-x-0'
                                    }`}
                                />
                            </button>
                        </div>

                    </div>

                    {/* Footer */}
                    <div className="p-4 bg-slate-50 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
                        <span className="flex items-center gap-1.5">
                            <Info size={14} className="text-slate-400" />
                            <span>Preferences are saved automatically.</span>
                        </span>
                        <button
                            type="button"
                            onClick={() => setSettingsModalOpen(false)}
                            className="px-4 py-2 rounded-xl bg-slate-800 text-white font-bold hover:bg-slate-900 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-slate-800 focus-visible:ring-offset-2 cursor-pointer"
                        >
                            Done
                        </button>
                    </div>
                </motion.div>
            </div>
        </AnimatePresence>
    );
};

export default AccessibilityModal;
