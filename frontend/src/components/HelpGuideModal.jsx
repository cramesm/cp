import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAccessibility } from './AccessibilityContext';
import { 
    X, 
    FileSearch, 
    QrCode, 
    ShieldCheck, 
    CheckCircle2, 
    Clock, 
    AlertCircle, 
    Layers,
    BookOpen,
    HelpCircle
} from 'lucide-react';

const HelpGuideModal = () => {
    const { helpModalOpen, setHelpModalOpen } = useAccessibility();
    const [activeTab, setActiveTab] = useState('where'); // 'where' | 'how' | 'statuses'

    if (!helpModalOpen) return null;

    return (
        <AnimatePresence>
            <div className="fixed inset-0 z-[10000] flex items-center justify-center p-4">
                {/* Backdrop */}
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    onClick={() => setHelpModalOpen(false)}
                    className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm"
                />

                {/* Modal */}
                <motion.div
                    initial={{ opacity: 0, scale: 0.95, y: 15 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95, y: 15 }}
                    transition={{ type: 'spring', duration: 0.3 }}
                    className="relative w-full max-w-2xl bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden z-10 text-slate-800"
                    role="dialog"
                    aria-modal="true"
                    aria-labelledby="help-guide-title"
                >
                    {/* Header */}
                    <div className="bg-gradient-to-r from-[#2c3e50] via-[#3a4e63] to-[#47627d] p-5 text-white flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-2xl bg-white/10 backdrop-blur-md flex items-center justify-center border border-white/20">
                                <BookOpen className="w-5 h-5 text-cyan-300" />
                            </div>
                            <div>
                                <h3 id="help-guide-title" className="text-lg font-bold tracking-tight">
                                    System & Verification Guide
                                </h3>
                                <p className="text-xs text-slate-300 font-normal">
                                    Step-by-step assistance for students, alumni, and verifiers
                                </p>
                            </div>
                        </div>
                        <button
                            onClick={() => setHelpModalOpen(false)}
                            className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-colors focus:outline-none"
                            aria-label="Close help guide"
                        >
                            <X size={18} />
                        </button>
                    </div>

                    {/* Tab Navigation */}
                    <div className="flex border-b border-slate-100 bg-slate-50/80 px-4 pt-2 gap-2">
                        {[
                            { id: 'where', label: 'Where to Find Your Code', icon: QrCode },
                            { id: 'how', label: 'How to Verify', icon: FileSearch },
                            { id: 'statuses', label: 'Status Meanings', icon: Layers }
                        ].map(tab => {
                            const Icon = tab.icon;
                            const isActive = activeTab === tab.id;
                            return (
                                <button
                                    key={tab.id}
                                    onClick={() => setActiveTab(tab.id)}
                                    className={`flex items-center gap-2 px-4 py-3 text-xs font-bold rounded-t-xl transition-all border-b-2 ${
                                        isActive
                                            ? 'bg-white text-blue-700 border-blue-600 shadow-xs'
                                            : 'text-slate-500 border-transparent hover:text-slate-800'
                                    }`}
                                >
                                    <Icon size={16} />
                                    <span>{tab.label}</span>
                                </button>
                            );
                        })}
                    </div>

                    {/* Modal Content Body */}
                    <div className="p-6 max-h-[70vh] overflow-y-auto custom-scrollbar">
                        
                        {/* TAB 1: Where to find code */}
                        {activeTab === 'where' && (
                            <div className="space-y-4 animate-in fade-in duration-300">
                                <p className="text-sm text-slate-600 leading-relaxed">
                                    Every official Transcript of Records (TOR) or Diploma issued by the institution contains two tamper-proof security markers:
                                </p>

                                {/* Visual Diagram of a Certificate */}
                                <div className="p-5 bg-slate-50 rounded-2xl border-2 border-dashed border-slate-200 relative">
                                    <div className="bg-white rounded-xl shadow-md border border-slate-200 p-6 relative max-w-md mx-auto">
                                        {/* Mock Certificate Header */}
                                        <div className="text-center border-b border-slate-100 pb-3 mb-4">
                                            <div className="w-10 h-10 mx-auto rounded-full bg-blue-100 flex items-center justify-center text-blue-800 font-bold text-xs mb-1">
                                                ★
                                            </div>
                                            <div className="text-[11px] font-bold tracking-widest text-slate-400 uppercase">OFFICIAL TRANSCRIPT OF RECORDS</div>
                                            <div className="text-xs font-extrabold text-slate-800">STATE UNIVERSITY REGISTRAR</div>
                                        </div>

                                        {/* Certificate Body Lines */}
                                        <div className="space-y-2 mb-6">
                                            <div className="h-2 bg-slate-100 rounded w-3/4"></div>
                                            <div className="h-2 bg-slate-100 rounded w-1/2"></div>
                                            <div className="h-2 bg-slate-100 rounded w-5/6"></div>
                                        </div>

                                        {/* Highlight Marker 1: Top/Side QR Code */}
                                        <div className="absolute top-4 right-4 bg-emerald-50 border-2 border-emerald-500 rounded-lg p-1.5 shadow-sm">
                                            <QrCode size={30} className="text-emerald-700" />
                                            <span className="block text-[8px] font-extrabold text-emerald-800 text-center uppercase mt-0.5">QR Code</span>
                                        </div>

                                        {/* Highlight Marker 2: Bottom Verification Hash Code */}
                                        <div className="p-2.5 bg-blue-50 border-2 border-blue-500 rounded-lg text-center shadow-sm">
                                            <span className="text-[9px] font-extrabold text-blue-800 uppercase block tracking-wider">
                                                Security Verification Hash / Code
                                            </span>
                                            <code className="text-xs font-black text-blue-950 tracking-widest bg-blue-100/80 px-2 py-0.5 rounded inline-block mt-1">
                                                a1b2-c3d4-e5f6-7890
                                            </code>
                                        </div>
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                                    <div className="p-3 bg-emerald-50/60 rounded-xl border border-emerald-200">
                                        <div className="flex items-center gap-2 font-bold text-xs text-emerald-800">
                                            <QrCode size={16} />
                                            <span>Option A: Scan the QR Code</span>
                                        </div>
                                        <p className="text-[11px] text-emerald-700 mt-1">
                                            Point your smartphone camera at the QR code on the top-right of the physical document to instantly view verification results.
                                        </p>
                                    </div>
                                    <div className="p-3 bg-blue-50/60 rounded-xl border border-blue-200">
                                        <div className="flex items-center gap-2 font-bold text-xs text-blue-800">
                                            <ShieldCheck size={16} />
                                            <span>Option B: Type the Security Code</span>
                                        </div>
                                        <p className="text-[11px] text-blue-700 mt-1">
                                            Enter the 16-character code printed at the footer into the verification search bar.
                                        </p>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* TAB 2: How to Verify */}
                        {activeTab === 'how' && (
                            <div className="space-y-4 animate-in fade-in duration-300">
                                {[
                                    {
                                        step: '1',
                                        title: 'Upload File or Enter Code',
                                        desc: 'Navigate to the Verification Portal. You can either drag & drop your digital PDF transcript, or enter the unique 16-character code.'
                                    },
                                    {
                                        step: '2',
                                        title: 'Automatic Cryptographic Matching',
                                        desc: 'The system queries the immutable ledger to verify that the document matches the exact cryptographic record issued by the Registrar.'
                                    },
                                    {
                                        step: '3',
                                        title: 'View Official Authenticity Seal',
                                        desc: 'You will receive an instant validation report confirming the student name, degree program, issuance date, and validity status.'
                                    }
                                ].map(item => (
                                    <div key={item.step} className="flex items-start gap-4 p-4 rounded-2xl bg-slate-50 border border-slate-200">
                                        <div className="w-8 h-8 rounded-xl bg-blue-600 text-white font-black text-sm flex items-center justify-center flex-shrink-0">
                                            {item.step}
                                        </div>
                                        <div>
                                            <h4 className="font-bold text-sm text-slate-900">{item.title}</h4>
                                            <p className="text-xs text-slate-600 mt-1 leading-relaxed">{item.desc}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}

                        {/* TAB 3: Status Meanings */}
                        {activeTab === 'statuses' && (
                            <div className="space-y-3 animate-in fade-in duration-300">
                                <p className="text-xs text-slate-500 mb-2">
                                    Understand what each status badge means during document processing:
                                </p>
                                
                                <div className="p-3.5 rounded-2xl bg-amber-50/70 border border-amber-200 flex items-start gap-3">
                                    <Clock className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
                                    <div>
                                        <div className="text-xs font-bold text-amber-900 uppercase tracking-wider">Pending / Payment Required</div>
                                        <p className="text-xs text-amber-800 mt-0.5">Your request has been received and is waiting for payment confirmation or initial registrar queueing.</p>
                                    </div>
                                </div>

                                <div className="p-3.5 rounded-2xl bg-blue-50/70 border border-blue-200 flex items-start gap-3">
                                    <Layers className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                                    <div>
                                        <div className="text-xs font-bold text-blue-900 uppercase tracking-wider">In Process / Processing</div>
                                        <p className="text-xs text-blue-800 mt-0.5">The Registrar staff is actively preparing, certifying, and compiling your academic records.</p>
                                    </div>
                                </div>

                                <div className="p-3.5 rounded-2xl bg-emerald-50/70 border border-emerald-200 flex items-start gap-3">
                                    <CheckCircle2 className="w-5 h-5 text-emerald-600 flex-shrink-0 mt-0.5" />
                                    <div>
                                        <div className="text-xs font-bold text-emerald-900 uppercase tracking-wider">Approved / Released</div>
                                        <p className="text-xs text-emerald-800 mt-0.5">Your document is signed, published to the secure ledger, and ready for pickup or digital download.</p>
                                    </div>
                                </div>

                                <div className="p-3.5 rounded-2xl bg-red-50/70 border border-red-200 flex items-start gap-3">
                                    <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                                    <div>
                                        <div className="text-xs font-bold text-red-900 uppercase tracking-wider">Rejected / Cancelled</div>
                                        <p className="text-xs text-red-800 mt-0.5">The request could not be processed (e.g. missing clearance, unpaid dues). Check the notes for instructions.</p>
                                    </div>
                                </div>
                            </div>
                        )}

                    </div>

                    {/* Footer */}
                    <div className="p-4 bg-slate-50 border-t border-slate-100 flex items-center justify-end">
                        <button
                            onClick={() => setHelpModalOpen(false)}
                            className="px-5 py-2.5 rounded-xl bg-[#2c3e50] text-white font-bold text-xs hover:bg-[#1a252f] transition-colors shadow-sm"
                        >
                            Got it, close guide
                        </button>
                    </div>
                </motion.div>
            </div>
        </AnimatePresence>
    );
};

export default HelpGuideModal;
