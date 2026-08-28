import { useState } from "react";
import Layout from "../../components/Layout";
import API from "../../components/config/axiosConfig";
import { CheckCircle, AlertCircle, Copy, ArrowLeft, Search, Check } from 'lucide-react';
import { useNavigate } from "react-router-dom";

function VerifyTransaction() {
    const [studentIDNumber, setStudentIDNumber] = useState("");
    const [result, setResult] = useState(null);
    const [toast, setToast] = useState({ show: false, message: '', type: 'info' });
    const [loading, setLoading] = useState(false);
    const [copiedHash, setCopiedHash] = useState(false);
    const navigate = useNavigate();

    const triggerToast = (message, type = 'info') => {
        setToast({ show: true, message, type });
        setTimeout(() => setToast({ show: false, message: '', type: 'info' }), 4000);
    };

    const handleVerify = async (event) => {
        event.preventDefault();
        setLoading(true);

        try {
            const response = await API.get(
                `/blockchain/transactions/verify-by-id/${studentIDNumber}`
            );

            setResult(response.data);
            triggerToast(
                response.data.message || (response.data.verified ? 'Verification completed successfully.' : 'Verification failed.'),
                response.data.verified ? 'success' : 'error'
            );
        } catch (error) {
            setResult(null);
            triggerToast(error.response?.data?.message || "Verification failed", 'error');
        } finally {
            setLoading(false);
        }
    };

    const copyToClipboard = (text) => {
        if (!text) return;
        navigator.clipboard.writeText(text);
        setCopiedHash(true);
        triggerToast('Hash copied to clipboard', 'success');
        setTimeout(() => setCopiedHash(false), 3000);
    };

    return (
        <Layout>
            <div className="py-2 px-2 sm:px-4 font-sans space-y-4 relative">
                
                {/* Back Button */}
                <div className="flex items-center justify-between">
                    <button
                        onClick={() => navigate('/blockchain')}
                        className="bg-white hover:bg-slate-50 text-slate-700 font-bold text-xs px-4 py-1.5 rounded-full border border-slate-200 shadow-2xs hover:-translate-y-0.5 active:translate-y-0.5 transition-all flex items-center gap-2 cursor-pointer"
                    >
                        <ArrowLeft size={13} />
                        <span>Back to Blockchain</span>
                    </button>
                </div>

                {/* Toast Notification */}
                {toast.show && (
                    <div className={`fixed top-5 left-1/2 -translate-x-1/2 z-[10001] flex items-center gap-3 px-6 py-3 rounded-2xl shadow-2xl transition-all border border-slate-700/50 ${
                        toast.type === 'success' ? 'bg-[#2c3543] text-white' : 'bg-red-600 text-white'
                    } animate-fade-in`}>
                        {toast.type === 'success' ? <CheckCircle size={18} className="text-emerald-400" /> : <AlertCircle size={18} />}
                        <p className="font-bold text-xs tracking-wide">{toast.message}</p>
                    </div>
                )}

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                    {/* Search Card */}
                    <div className="lg:col-span-1 bg-white rounded-[22px] shadow-[0_8px_24px_rgba(0,0,0,0.03),0_2px_6px_rgba(0,0,0,0.02)] border border-slate-100/90 p-5 h-fit">
                        <div className="flex items-center gap-2.5 mb-4 pb-3 border-b border-slate-100">
                            <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center text-xs font-bold border border-blue-200/60">
                                <Search size={15} />
                            </div>
                            <h3 className="text-[16px] font-black text-slate-900 tracking-tight m-0">Verify Record</h3>
                        </div>

                        <form onSubmit={handleVerify} className="space-y-4">
                            <div>
                                <label className="block text-xs font-bold text-slate-700 mb-1.5">Student ID Number *</label>
                                <input
                                    type="text"
                                    placeholder="e.g., ID-2023-0001"
                                    value={studentIDNumber}
                                    onChange={(e) => setStudentIDNumber(e.target.value)}
                                    required
                                    className="w-full border border-slate-200 rounded-xl px-3.5 py-2 text-xs font-medium outline-none focus:border-blue-500 shadow-2xs bg-white text-slate-800"
                                />
                            </div>

                            <button
                                type="submit"
                                disabled={loading}
                                className="w-full bg-[#2c3543] hover:bg-[#1f2631] text-white font-bold text-xs py-2.5 px-4 rounded-full border-t border-white/20 border-b-2 border-black/50 shadow-[0_2px_6px_rgba(0,0,0,0.25)] hover:-translate-y-0.5 active:translate-y-0.5 active:border-b-0 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                            >
                                {loading ? (
                                    <span>Verifying Record...</span>
                                ) : (
                                    <>
                                        <CheckCircle size={14} />
                                        <span>Verify Record</span>
                                    </>
                                )}
                            </button>
                        </form>
                    </div>

                    {/* Result Card */}
                    {result && (
                        <div className="lg:col-span-2">
                            <div className="bg-white rounded-[22px] shadow-[0_8px_24px_rgba(0,0,0,0.03),0_2px_6px_rgba(0,0,0,0.02)] border border-slate-100/90 overflow-hidden">

                                {/* Header */}
                                <div className={`p-4 sm:p-5 border-b ${result.verified
                                    ? 'bg-emerald-50/80 border-emerald-200 text-emerald-900'
                                    : 'bg-red-50/80 border-red-200 text-red-900'
                                    }`}>
                                    <div className="flex items-center gap-3">
                                        {result.verified ? (
                                            <>
                                                <div className="w-9 h-9 rounded-xl bg-emerald-500 text-white flex items-center justify-center flex-shrink-0 shadow-sm">
                                                    <CheckCircle size={20} />
                                                </div>
                                                <div>
                                                    <h3 className="text-[16px] font-black text-emerald-900 m-0">Cryptographically Verified ✓</h3>
                                                    <p className="text-xs text-emerald-700 m-0 mt-0.5 font-medium">Record confirmed and authenticated on smart contract ledger</p>
                                                </div>
                                            </>
                                        ) : (
                                            <>
                                                <div className="w-9 h-9 rounded-xl bg-red-500 text-white flex items-center justify-center flex-shrink-0 shadow-sm">
                                                    <AlertCircle size={20} />
                                                </div>
                                                <div>
                                                    <h3 className="text-[16px] font-black text-red-900 m-0">Verification Failed</h3>
                                                    <p className="text-xs text-red-700 m-0 mt-0.5 font-medium">No matching blockchain ledger record found for this ID</p>
                                                </div>
                                            </>
                                        )}
                                    </div>
                                </div>

                                {/* Content */}
                                <div className="p-5 space-y-5">
                                    <div>
                                        <h4 className="text-xs font-extrabold text-slate-400 uppercase tracking-wider mb-3">Academic Record Details</h4>

                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                                            <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
                                                <p className="text-[10.5px] font-bold text-slate-400 uppercase mb-1">Reference Number</p>
                                                <p className="text-xs font-mono font-bold text-slate-900 break-all">
                                                    {result.blockchainRecord?.referenceNumber}
                                                </p>
                                            </div>

                                            <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
                                                <p className="text-[10.5px] font-bold text-slate-400 uppercase mb-1">Student Name</p>
                                                <p className="text-xs font-bold text-slate-900">
                                                    {result.blockchainRecord?.nameOfStudent}
                                                </p>
                                            </div>

                                            <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
                                                <p className="text-[10.5px] font-bold text-slate-400 uppercase mb-1">ID Number</p>
                                                <p className="text-xs font-mono font-bold text-slate-900">
                                                    {result.blockchainRecord?.studentIDNumber}
                                                </p>
                                            </div>

                                            <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
                                                <p className="text-[10.5px] font-bold text-slate-400 uppercase mb-1">Document Type</p>
                                                <p className="text-xs font-semibold text-slate-900">
                                                    {result.blockchainRecord?.typeOfDocument}
                                                </p>
                                            </div>

                                            <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
                                                <p className="text-[10.5px] font-bold text-slate-400 uppercase mb-1">School / Institution</p>
                                                <p className="text-xs font-semibold text-slate-900">
                                                    {result.blockchainRecord?.nameOfSchool}
                                                </p>
                                            </div>

                                            <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
                                                <p className="text-[10.5px] font-bold text-slate-400 uppercase mb-1">Year Graduated</p>
                                                <p className="text-xs font-semibold text-slate-900">
                                                    {result.blockchainRecord?.yearGraduated}
                                                </p>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="border-t border-slate-100 pt-4">
                                        <h4 className="text-xs font-extrabold text-slate-400 uppercase tracking-wider mb-3">Blockchain Ledger Details</h4>

                                        <div className="space-y-3">
                                            <div className="bg-slate-50 p-3 rounded-xl border border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                                                <div>
                                                    <p className="text-[10.5px] font-bold text-slate-400 uppercase mb-0.5">Recorded By</p>
                                                    <p className="text-xs font-mono font-medium text-slate-700 break-all m-0">
                                                        {result.blockchainRecord?.recordedBy}
                                                    </p>
                                                </div>
                                                <div>
                                                    <p className="text-[10.5px] font-bold text-slate-400 uppercase mb-0.5">Timestamp</p>
                                                    <p className="text-xs font-mono font-medium text-slate-700 m-0">
                                                        {new Date(result.blockchainRecord?.timestamp * 1000).toLocaleString()}
                                                    </p>
                                                </div>
                                            </div>

                                            {result.databaseRecord?.blockchainTxHash && (
                                                <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
                                                    <p className="text-[10.5px] font-bold text-slate-400 uppercase mb-1">Transaction Hash</p>
                                                    <div className="flex items-center gap-2">
                                                        <p className="text-xs font-mono bg-white border border-slate-200 px-3 py-1.5 rounded-lg text-slate-700 break-all flex-1 m-0">
                                                            {result.databaseRecord.blockchainTxHash}
                                                        </p>
                                                        <button
                                                            onClick={() => copyToClipboard(result.databaseRecord.blockchainTxHash)}
                                                            className="bg-white hover:bg-slate-100 text-slate-700 px-3 py-1.5 rounded-lg border border-slate-200 font-bold text-xs transition-colors flex items-center gap-1.5 cursor-pointer shadow-2xs"
                                                            title="Copy hash"
                                                        >
                                                            {copiedHash ? <Check size={13} className="text-emerald-600" /> : <Copy size={13} />}
                                                            <span>{copiedHash ? 'Copied' : 'Copy'}</span>
                                                        </button>
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Empty State */}
                    {!result && (
                        <div className="lg:col-span-2 bg-white rounded-[22px] shadow-[0_8px_24px_rgba(0,0,0,0.03),0_2px_6px_rgba(0,0,0,0.02)] border border-slate-100/90 p-12 flex flex-col items-center justify-center text-center">
                            <div className="w-14 h-14 rounded-2xl bg-slate-50 text-slate-400 flex items-center justify-center text-xl mb-3 border border-slate-100">
                                <Search size={24} />
                            </div>
                            <h4 className="text-sm font-black text-slate-800 mb-1">Awaiting Student ID</h4>
                            <p className="text-slate-400 text-xs max-w-sm m-0">
                                Enter a student ID number on the left panel to verify and authenticate academic records directly on the blockchain.
                            </p>
                        </div>
                    )}
                </div>
            </div>
        </Layout>
    );
}

export default VerifyTransaction;