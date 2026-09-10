import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAccessibility } from './AccessibilityContext';
import { 
    X, 
    Sparkles, 
    Eye, 
    Type, 
    SunMedium, 
    Compass, 
    HelpCircle, 
    Check, 
    Info, 
    ArrowRight 
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
        toggleHighContrast,
        startTour,
        openHelpGuide
    } = useAccessibility();

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
                                    Customize readability, simplified views, and guided help
                                </p>
                            </div>
                        </div>
                        <button
                            onClick={() => setSettingsModalOpen(false)}
                            className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-colors focus:outline-none"
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
                                    className={`relative inline-flex h-7 w-12 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
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
                            <div className="grid grid-cols-3 gap-2.5">
                                {[
                                    { id: 'normal', label: 'Standard', sub: '100%', sample: 'Aa' },
                                    { id: 'large', label: 'Large', sub: '115%', sample: 'Aa+' },
                                    { id: 'xl', label: 'Extra Large', sub: '130%', sample: 'Aa++' }
                                ].map(option => (
                                    <button
                                        key={option.id}
                                        type="button"
                                        onClick={() => setFontSize(option.id)}
                                        className={`p-3 rounded-2xl border flex flex-col items-center justify-center gap-1 transition-all ${
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
                                className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
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

                        {/* Divider */}
                        <div className="h-px bg-slate-100 my-2" />

                        {/* 4. Tutorial & Interactive Guides */}
                        <div className="space-y-2.5">
                            <span className="text-xs font-bold text-slate-700 uppercase tracking-wider block">
                                Tutorials & Guides
                            </span>

                            {/* Start Tour Button */}
                            <button
                                type="button"
                                onClick={startTour}
                                className="w-full p-3.5 rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-600 text-white flex items-center justify-between font-bold text-sm shadow-md shadow-blue-500/20 hover:from-blue-700 hover:to-indigo-700 transition-all group"
                            >
                                <div className="flex items-center gap-3">
                                    <div className="w-8 h-8 rounded-xl bg-white/20 flex items-center justify-center">
                                        <Compass className="w-4 h-4 text-white" />
                                    </div>
                                    <div className="text-left">
                                        <div className="leading-tight">Start Interactive System Tour</div>
                                        <div className="text-[11px] text-blue-100 font-normal">Step-by-step guided walkthrough of the screen</div>
                                    </div>
                                </div>
                                <ArrowRight size={16} className="text-white/80 group-hover:translate-x-1 transition-transform" />
                            </button>

                            {/* Open Visual Guide Button */}
                            <button
                                type="button"
                                onClick={openHelpGuide}
                                className="w-full p-3.5 rounded-2xl bg-slate-100 hover:bg-slate-200/80 text-slate-800 flex items-center justify-between font-bold text-sm transition-all border border-slate-200 group"
                            >
                                <div className="flex items-center gap-3">
                                    <div className="w-8 h-8 rounded-xl bg-slate-200 text-slate-700 flex items-center justify-center">
                                        <HelpCircle className="w-4 h-4" />
                                    </div>
                                    <div className="text-left">
                                        <div className="leading-tight">Document Verification Guide</div>
                                        <div className="text-[11px] text-slate-600 font-normal">Where to find QR codes and tracking numbers</div>
                                    </div>
                                </div>
                                <ArrowRight size={16} className="text-slate-500 group-hover:translate-x-1 transition-transform" />
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
                            onClick={() => setSettingsModalOpen(false)}
                            className="px-4 py-2 rounded-xl bg-slate-800 text-white font-bold hover:bg-slate-900 transition-colors"
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
