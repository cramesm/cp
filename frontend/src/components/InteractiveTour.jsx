import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAccessibility } from './AccessibilityContext';
import { 
    Compass, 
    ArrowRight, 
    ArrowLeft, 
    X, 
    Check, 
    Sparkles, 
    Layers, 
    Eye, 
    Bell, 
    SlidersHorizontal 
} from 'lucide-react';

const tourSteps = [
    {
        target: '[data-tour="sidebar"]',
        title: '1. Navigation Menu',
        description: 'Easily switch between your Requests, Transactions, Blockchain records, and User Management using this menu.',
        position: 'right'
    },
    {
        target: '[data-tour="header-title"]',
        title: '2. Page Header & Location',
        description: 'See your current section at a glance. You can also collapse or expand the navigation menu using the arrow button.',
        position: 'bottom'
    },
    {
        target: '[data-tour="notifications"]',
        title: '3. Notification Center',
        description: 'Stay informed on document status changes, payment confirmations, and system alerts in real-time.',
        position: 'bottom'
    },
    {
        target: '[data-tour="gear-settings"]',
        title: '4. Display & Simple Mode (⚙️)',
        description: 'Click this gear anytime to turn on Simple Mode (Senior View), increase text size (100% / 115% / 130%), or open the help guide.',
        position: 'bottom'
    },
    {
        target: '[data-tour="main-content"]',
        title: '5. Workspace & Actions',
        description: 'Your main workspace displays document queries, statistics, status filters, and one-click actions.',
        position: 'top'
    }
];

const InteractiveTour = () => {
    const { tourActive, closeTour, tourStep, setTourStep } = useAccessibility();
    const [targetRect, setTargetRect] = useState(null);

    const currentStep = tourSteps[tourStep] || tourSteps[0];
    const isFirstStep = tourStep === 0;
    const isLastStep = tourStep === tourSteps.length - 1;

    useEffect(() => {
        if (!tourActive) {
            setTargetRect(null);
            return;
        }

        const updateTargetRect = () => {
            const el = document.querySelector(currentStep.target);
            if (el) {
                const rect = el.getBoundingClientRect();
                setTargetRect({
                    top: rect.top,
                    left: rect.left,
                    width: rect.width,
                    height: rect.height,
                    bottom: rect.bottom,
                    right: rect.right
                });
            } else {
                // Fallback to center if element is not in DOM
                setTargetRect({
                    top: window.innerHeight / 3,
                    left: window.innerWidth / 2 - 150,
                    width: 300,
                    height: 100,
                    bottom: window.innerHeight / 3 + 100,
                    right: window.innerWidth / 2 + 150
                });
            }
        };

        updateTargetRect();
        window.addEventListener('resize', updateTargetRect);
        window.addEventListener('scroll', updateTargetRect, true);

        return () => {
            window.removeEventListener('resize', updateTargetRect);
            window.removeEventListener('scroll', updateTargetRect, true);
        };
    }, [tourActive, tourStep, currentStep.target]);

    if (!tourActive) return null;

    const handleNext = () => {
        if (isLastStep) {
            closeTour();
        } else {
            setTourStep(prev => prev + 1);
        }
    };

    const handlePrev = () => {
        if (!isFirstStep) {
            setTourStep(prev => prev - 1);
        }
    };

    return (
        <AnimatePresence>
            <div className="fixed inset-0 z-[10000] pointer-events-none">
                {/* SVG Cutout / Dimmed Mask */}
                <svg className="fixed inset-0 w-full h-full pointer-events-auto transition-all duration-300">
                    <defs>
                        <mask id="tour-mask">
                            <rect x="0" y="0" width="100%" height="100%" fill="white" />
                            {targetRect && (
                                <rect
                                    x={Math.max(0, targetRect.left - 6)}
                                    y={Math.max(0, targetRect.top - 6)}
                                    width={targetRect.width + 12}
                                    height={targetRect.height + 12}
                                    rx="16"
                                    fill="black"
                                    className="transition-all duration-300"
                                />
                            )}
                        </mask>
                    </defs>
                    <rect
                        x="0"
                        y="0"
                        width="100%"
                        height="100%"
                        fill="rgba(15, 23, 42, 0.7)"
                        mask="url(#tour-mask)"
                        onClick={closeTour}
                    />
                </svg>

                {/* Highlight Halo around target */}
                {targetRect && (
                    <motion.div
                        layoutId="tour-highlight"
                        style={{
                            position: 'fixed',
                            top: Math.max(0, targetRect.top - 6),
                            left: Math.max(0, targetRect.left - 6),
                            width: targetRect.width + 12,
                            height: targetRect.height + 12,
                            borderRadius: '18px'
                        }}
                        className="pointer-events-none ring-4 ring-cyan-400 ring-offset-2 ring-offset-transparent shadow-[0_0_25px_rgba(34,211,238,0.5)] z-10 transition-all duration-300"
                    />
                )}

                {/* Tour Card Popover */}
                <div className="fixed inset-0 pointer-events-none flex items-center justify-center p-4 z-20">
                    <motion.div
                        key={tourStep}
                        initial={{ opacity: 0, scale: 0.9, y: 10 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.9, y: 10 }}
                        transition={{ duration: 0.25 }}
                        className="pointer-events-auto w-full max-w-sm bg-white rounded-3xl shadow-2xl border border-slate-200 p-6 text-slate-800"
                    >
                        {/* Header */}
                        <div className="flex items-center justify-between mb-3">
                            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-blue-50 text-blue-700 rounded-full text-[11px] font-extrabold uppercase tracking-wider border border-blue-200">
                                <Sparkles size={13} className="text-blue-600" />
                                <span>Step {tourStep + 1} of {tourSteps.length}</span>
                            </div>
                            <button
                                onClick={closeTour}
                                className="text-slate-400 hover:text-slate-700 p-1 rounded-full hover:bg-slate-100 transition-colors"
                                title="Skip Tour"
                            >
                                <X size={18} />
                            </button>
                        </div>

                        {/* Content */}
                        <h4 className="text-base font-black text-slate-900 mb-2">
                            {currentStep.title}
                        </h4>
                        <p className="text-xs text-slate-600 leading-relaxed mb-6">
                            {currentStep.description}
                        </p>

                        {/* Progress Dots */}
                        <div className="flex items-center justify-between pt-2 border-t border-slate-100">
                            <div className="flex items-center gap-1.5">
                                {tourSteps.map((_, idx) => (
                                    <div
                                        key={idx}
                                        className={`h-2 rounded-full transition-all ${
                                            idx === tourStep
                                                ? 'w-6 bg-blue-600'
                                                : 'w-2 bg-slate-200'
                                        }`}
                                    />
                                ))}
                            </div>

                            {/* Buttons */}
                            <div className="flex items-center gap-2">
                                {!isFirstStep && (
                                    <button
                                        type="button"
                                        onClick={handlePrev}
                                        className="px-3 py-1.5 rounded-xl border border-slate-200 text-slate-600 font-bold text-xs hover:bg-slate-50 transition-colors flex items-center gap-1"
                                    >
                                        <ArrowLeft size={13} />
                                        <span>Back</span>
                                    </button>
                                )}
                                <button
                                    type="button"
                                    onClick={handleNext}
                                    className="px-4 py-1.5 rounded-xl bg-blue-600 text-white font-bold text-xs hover:bg-blue-700 transition-colors shadow-sm flex items-center gap-1.5"
                                >
                                    <span>{isLastStep ? 'Finish' : 'Next'}</span>
                                    {isLastStep ? <Check size={14} /> : <ArrowRight size={13} />}
                                </button>
                            </div>
                        </div>
                    </motion.div>
                </div>
            </div>
        </AnimatePresence>
    );
};

export default InteractiveTour;
