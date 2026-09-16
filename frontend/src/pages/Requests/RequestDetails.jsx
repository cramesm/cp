import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { ChevronRight, ArrowLeft, FileText, Upload, CheckCircle2, AlertCircle, ShieldCheck, Printer, FileSearch, Trash2, Shield, Search, Download, Copy, Check, Lock, Unlock, XCircle, Clock, CreditCard, X } from 'lucide-react';
import Layout from '../../components/Layout';
import ConfirmModal from '../../components/ConfirmModal';
import FeedbackModal from '../../components/FeedbackModal';
import api from '../../api';
import { useModals } from '../../hooks/useModals';

const API_BASE = (import.meta.env.VITE_API_URL ? import.meta.env.VITE_API_URL.replace('/api', '') : '') || 'http://127.0.0.1:5000';

const RequestDetails = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const location = useLocation();

    // Read the page number passed from the Requests list so the Back button returns to the correct page
    const fromPage = new URLSearchParams(location.search).get('fromPage') || '1';
    const backToRequests = `/requests?page=${fromPage}`;

    const userRole = (localStorage.getItem('userRole') || '').toLowerCase();
    const isSuperAdmin = userRole === 'super admin';
    const hasProcessingAccess = isSuperAdmin;

    // Core Data State
    const [requestData, setRequestData] = useState(null);
    const [paymentTx, setPaymentTx] = useState(null);
    const [loading, setLoading] = useState(true);
    const [actionLoading, setActionLoading] = useState(false);
    const [copiedId, setCopiedId] = useState(null);

    // Wizard State
    const [currentStep, setCurrentStep] = useState(1);
    const [uploadedFile, setUploadedFile] = useState(null);
    const [documentData, setDocumentData] = useState(null);
    const [rejectionReason, setRejectionReason] = useState('');
    const [manualRejectionReason, setManualRejectionReason] = useState('');
    const [showRejectForm, setShowRejectForm] = useState(false);
    const [paymentAction, setPaymentAction] = useState('Completed');

    // Super Admin Force Override State (Available Anywhere)
    const [showSuperAdminModal, setShowSuperAdminModal] = useState(false);
    const [overrideStatus, setOverrideStatus] = useState('In Process');
    const [overrideStep, setOverrideStep] = useState(1);
    const [overrideRemarks, setOverrideRemarks] = useState('');

    // Modals
    const { confirmConfig, feedbackConfig, showConfirm, showFeedback, closeConfirm, closeFeedback } = useModals();

    const handleCopy = (text, idKey) => {
        if (!text) return;
        navigator.clipboard.writeText(text);
        setCopiedId(idKey);
        setTimeout(() => setCopiedId(null), 2000);
    };

    const formatShortId = (val, prefix = 'REQ') => {
        if (!val) return `#${prefix}-001`;
        const str = String(val);
        if (str.length <= 10) return str.startsWith('#') ? str : `#${str}`;
        const lastPart = str.split('-').pop() || str.slice(-4);
        return `#${prefix}-${lastPart.length > 6 ? lastPart.slice(-4) : lastPart}`;
    };

    // Blockchain Data State
    const [blockchainData, setBlockchainData] = useState({
        ownerType: "Student",
        course: "",
        yearLevel: "",
        studentIDNumber: "",
        nameOfSchool: "VeriFitor University",
        yearGraduated: new Date().getFullYear(),
    });
    const [blockchainResult, setBlockchainResult] = useState(null);

    const fetchData = async () => {
        try {
            const res = await api.get(`/requests/${id}`);
            if (res.data) setRequestData(res.data);

            const txRes = await api.get(`/transactions/by-request/${id}`);
            if (txRes.data) setPaymentTx(txRes.data);

            const found = res.data;
            const foundTx = txRes.data;

            // Determine Step
            const docType = (found?.documentType || found?.document_type || '').toLowerCase();
            const isBlockchain = docType.includes('tor') || docType.includes('diploma');

            if (found && found.status === 'Released') {
                setCurrentStep(isBlockchain ? 4 : 3);
            } else if (found && found.status === 'In Process') {
                if (isBlockchain) {
                    if (found.documentFile) {
                        setCurrentStep(3); // Has uploaded, moving to secure
                    } else {
                        setCurrentStep(2); // Has verified payment & request, moving to upload
                    }
                } else {
                    setCurrentStep(2); // Non-blockchain: moving directly to finalize & release
                }
            } else {
                setCurrentStep(1); // Pending payment or document request verification
            }

        } catch (error) {
            console.error("Error fetching request:", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, [id]);

    const handleStatusUpdate = async (newStatus) => {
        setActionLoading(true);
        try {
            const updatePayload = { status: newStatus };
            if (newStatus === 'Rejected') {
                const trimmedManual = manualRejectionReason.trim();
                let combinedReason = rejectionReason;
                if (rejectionReason === 'others') {
                    combinedReason = trimmedManual || 'Others';
                } else if (trimmedManual) {
                    combinedReason = `${rejectionReason}: ${trimmedManual}`;
                }
                updatePayload.rejectionReason = combinedReason;
            }
            await api.put(`/requests/${id}`, updatePayload);
            await fetchData();
            if (newStatus === 'Rejected') setShowRejectForm(false);
        } catch (err) {
            showFeedback({
                title: 'Update Failed',
                message: 'Oops! We couldn\'t update the status of this request right now. Please try again.',
                type: 'error'
            });
        } finally {
            setActionLoading(false);
        }
    };

    const handleVerifyPayment = async (status) => {
        setActionLoading(true);
        try {
            await api.put(`/transactions/${paymentTx.transactionId}/verify`, { status });
            await fetchData();
            showFeedback({
                title: 'Payment Status Updated',
                message: `Payment status has been set to "${status}". ${status === 'Completed' ? 'Stage 2 (Verify Document Request) is now unlocked.' : ''}`,
                type: 'info'
            });
        } catch (err) {
            console.error(err);
            showFeedback({
                title: 'Payment Verification Failed',
                message: 'We were unable to verify this payment. Please check your connection and try again.',
                type: 'error'
            });
        } finally {
            setActionLoading(false);
        }
    };

    const handleApproveDocumentRequest = () => {
        showConfirm({
            title: 'Approve Document Request',
            message: `Are you sure you want to approve the document request for ${requestData?.name || 'the student'}? The student will receive a notification and the request will move to document preparation.`,
            type: 'info',
            onConfirm: async () => {
                await handleStatusUpdate('In Process');
                setCurrentStep(2);
            }
        });
    };

    const handleRejectDocumentRequest = () => {
        if (!rejectionReason) {
            showFeedback({
                title: 'Reason Required',
                message: 'Please select a reason before rejecting this document request.',
                type: 'error'
            });
            return;
        }
        if (rejectionReason === 'others' && !manualRejectionReason.trim()) {
            showFeedback({
                title: 'Remarks Required',
                message: 'Please provide specific remarks explaining the rejection to the student.',
                type: 'error'
            });
            return;
        }

        showConfirm({
            title: 'Reject Document Request',
            message: 'Are you sure you want to reject this document request? The student will receive a notification detailing your decision.',
            type: 'warning',
            onConfirm: async () => {
                await handleStatusUpdate('Rejected');
            }
        });
    };

    const handleOpenSuperAdminModal = () => {
        setOverrideStatus(requestData?.status || 'In Process');
        setOverrideStep(currentStep);
        setOverrideRemarks('');
        setShowSuperAdminModal(true);
    };

    const handleApplySuperAdminOverride = async () => {
        setActionLoading(true);
        try {
            const payload = {
                status: overrideStatus,
                forceOverride: true
            };
            if (overrideRemarks.trim()) {
                payload.adminRemarks = overrideRemarks.trim();
            }
            if (overrideStatus === 'Rejected') {
                payload.rejectionReason = overrideRemarks.trim() || 'Super Admin Override';
            }

            await api.put(`/requests/${id}`, payload);
            await fetchData();
            setCurrentStep(overrideStep);
            setShowSuperAdminModal(false);
            showFeedback({
                title: 'Force Override Applied',
                message: `Request status has been forcefully set to "${overrideStatus}" and step set to Step ${overrideStep}.`,
                type: 'info'
            });
        } catch (err) {
            console.error(err);
            showFeedback({
                title: 'Override Failed',
                message: err.response?.data?.message || 'Failed to apply super admin override. Please try again.',
                type: 'error'
            });
        } finally {
            setActionLoading(false);
        }
    };

    const handleFileUpload = async (e) => {
        if (!e.target.files || e.target.files.length === 0) return;
        const file = e.target.files[0];
        if (file.type !== 'application/pdf') {
            showFeedback({
                title: 'Invalid File Type',
                message: 'Please select a PDF document. Other file types are not supported.',
                type: 'info'
            });
            return;
        }
        setUploadedFile(file);
    };

    const processUpload = async () => {
        if (!uploadedFile) return;
        setActionLoading(true);
        const formData = new FormData();
        formData.append('document', uploadedFile);

        try {
            const res = await api.post(`/requests/${id}/upload`, formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });
            setDocumentData(res.data);

            // Bug 5: Both blockchain and non-blockchain docs now go to step 3 for confirmation
            // Non-blockchain docs show a "Finalize" confirmation, blockchain shows "Secure on Blockchain"
            setCurrentStep(3);
            await fetchData();
        } catch (err) {
            console.error(err);
            showFeedback({
                title: 'Upload Failed',
                message: 'We couldn\'t upload your document. Please ensure it is a valid PDF and try again.',
                type: 'error'
            });
        } finally {
            setActionLoading(false);
        }
    };

    const handleSecureDocument = async () => {
        setActionLoading(true);
        const isBlockchainEligible = documentData?.isBlockchainEligible || (requestData.documentType || requestData.document_type || '').toLowerCase().includes('tor') || (requestData.documentType || requestData.document_type || '').toLowerCase().includes('diploma');

        try {
            if (isBlockchainEligible) {
                const blockchainRes = await api.post('/blockchain/transactions', {
                    nameOfStudent: requestData.name || "Unknown",
                    ownerType: blockchainData.ownerType,
                    course: blockchainData.ownerType === 'Student' ? blockchainData.course : "",
                    yearLevel: blockchainData.ownerType === 'Student' ? blockchainData.yearLevel : "",
                    studentIDNumber: blockchainData.studentIDNumber,
                    typeOfDocument: requestData.documentType || requestData.document_type || "Document",
                    nameOfSchool: blockchainData.nameOfSchool,
                    yearGraduated: blockchainData.ownerType === 'Alumni' ? Number(blockchainData.yearGraduated) : 0
                });

                setBlockchainResult({
                    referenceNumber: blockchainRes.data.referenceNumber || `TXN-${Date.now()}`,
                    transactionHash: blockchainRes.data.blockchainTxHash || blockchainRes.data.transactionHash,
                    blockchainTimestamp: blockchainRes.data.timestamp || new Date().toLocaleString(),
                    studentIDNumber: blockchainData.studentIDNumber,
                });
            }

            await api.put(`/requests/${id}`, { status: "Released" });
            setCurrentStep(isBlockchainEligible ? 4 : 3);
            await fetchData();
        } catch (err) {
            showFeedback({
                title: 'Failed to Finalize',
                message: 'Oops! We ran into an issue while securing this document. Please try again later.',
                type: 'error'
            });
        } finally {
            setActionLoading(false);
        }
    };

    if (loading) return (
        <Layout>
            <div className="flex justify-center items-center h-full min-h-screen">
                <div className="animate-spin text-blue-500"><Search size={32} /></div>
            </div>
        </Layout>
    );

    if (!requestData) return <Layout><div className="p-8 text-center text-red-500 font-bold">Request not found.</div></Layout>;

    const status = requestData.status || 'Pending';
    const isPaymentCleared = paymentTx?.status === 'Completed';
    const isBlockchainEligible = documentData?.isBlockchainEligible || (requestData.documentType || requestData.document_type || '').toLowerCase().includes('tor') || (requestData.documentType || requestData.document_type || '').toLowerCase().includes('diploma');

    return (
        <Layout>
            <div className="py-2 px-2 sm:px-4 font-sans space-y-4 relative">
                
                {/* Header */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-4 sm:p-5 rounded-[22px] shadow-[0_8px_24px_rgba(0,0,0,0.03),0_2px_6px_rgba(0,0,0,0.02)] border border-slate-100/90">
                    <div>
                        <div className="flex items-center gap-2.5 flex-wrap">
                            <h1 className="text-[18px] font-black text-slate-900 m-0">Process Document Request</h1>
                            <span className={`inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full text-[10.5px] uppercase tracking-wider font-extrabold border ${
                                status === 'Pending' ? 'bg-amber-50 text-amber-700 border-amber-200' :
                                status === 'In Process' ? 'bg-purple-50 text-purple-700 border-purple-200' :
                                status === 'Released' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' :
                                'bg-red-50 text-red-700 border-red-200'
                            }`}>
                                <span className={`w-1.5 h-1.5 rounded-full ${
                                    status === 'Pending' ? 'bg-amber-500' :
                                    status === 'In Process' ? 'bg-purple-500' :
                                    status === 'Released' ? 'bg-emerald-500' :
                                    'bg-red-500'
                                }`}></span>
                                <span>{status}</span>
                            </span>

                            {/* Super Admin Override Trigger in Header - ALWAYS AVAILABLE ANYWHERE */}
                            {isSuperAdmin && (
                                <button
                                    type="button"
                                    onClick={handleOpenSuperAdminModal}
                                    className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-extrabold bg-indigo-50 text-indigo-700 border border-indigo-200 hover:bg-indigo-100 transition-all cursor-pointer shadow-2xs hover:-translate-y-0.5"
                                    title="Super Admin Force Override (Status & Steps)"
                                >
                                    <Shield size={12} className="text-indigo-600" />
                                    <span>Super Admin Override</span>
                                </button>
                            )}
                        </div>
                        <div className="flex items-center gap-2 mt-1">
                            <span className="text-xs text-slate-400 font-medium">Request ID:</span>
                            <span className="bg-slate-100 px-2 py-0.5 rounded-md text-slate-800 font-mono text-[11.5px] font-bold" title={requestData.requestId}>
                                {formatShortId(requestData.requestId, 'REQ')}
                            </span>
                            <button
                                type="button"
                                onClick={() => handleCopy(requestData.requestId, 'hdr-req')}
                                className="text-slate-400 hover:text-slate-700 transition-colors p-1 rounded hover:bg-slate-200/60 cursor-pointer"
                                title="Copy Full Request ID"
                            >
                                {copiedId === 'hdr-req' ? <Check size={11} className="text-emerald-600" /> : <Copy size={11} />}
                            </button>
                        </div>
                    </div>
                    <div className="flex items-center gap-2.5 flex-wrap">
                        <button 
                            onClick={() => navigate(backToRequests)}
                            className="bg-[#2c3543] hover:bg-[#1f2631] text-white font-bold text-xs px-4 py-2 rounded-full border-t border-t-white/20 border-b-2 border-b-black/50 shadow-[0_2px_5px_rgba(0,0,0,0.2)] hover:-translate-y-0.5 active:translate-y-0.5 active:border-b-0 transition-all flex items-center gap-2 cursor-pointer w-fit"
                        >
                            <ArrowLeft size={13} />
                            <span>Back to Document Requests</span>
                        </button>
                    </div>
                </div>

                    {status === 'Rejected' && (
                        <div className="bg-red-50 p-6 rounded-2xl border border-red-200 mb-8 flex flex-col md:flex-row md:items-start justify-between gap-4">
                            <div>
                                <h3 className="text-red-700 font-bold text-lg mb-2">Request Rejected</h3>
                                <p className="text-red-600 mb-2">This document request has been rejected and requires no further action.</p>
                                {requestData.rejectionReason && (
                                    <p className="text-red-800 bg-red-100/50 p-3 rounded-lg border border-red-100 text-sm">
                                        <span className="font-bold">Reason:</span> {
                                            requestData.rejectionReason === 'incomplete' ? 'Incomplete Requirements' :
                                             requestData.rejectionReason === 'invalid' ? 'Invalid Information' :
                                            requestData.rejectionReason === 'unpaid' ? 'Payment Issue' :
                                            requestData.rejectionReason
                                        }
                                    </p>
                                )}
                            </div>
                            <div className="flex flex-col gap-2 shrink-0">
                                {isSuperAdmin && (
                                    <button
                                        className="bg-red-600 hover:bg-red-700 text-white px-6 py-2 rounded-xl font-bold transition-all shadow-sm whitespace-nowrap"
                                        onClick={() => showConfirm({
                                            title: 'Re-open Request',
                                            message: 'Are you sure you want to re-open this rejected request? The status will be changed back to "In Process".',
                                            type: 'warning',
                                            onConfirm: async () => {
                                                await api.put(`/requests/${id}`, { status: 'In Process', forceOverride: true });
                                                await fetchData();
                                            }
                                        })}
                                    >
                                        Super Admin: Re-open
                                    </button>
                                )}
                                <button
                                    className="bg-slate-800 hover:bg-slate-900 text-white px-6 py-2 rounded-xl font-bold transition-all shadow-sm whitespace-nowrap"
                                    onClick={() => navigate(backToRequests)}
                                >
                                    Return to Requests
                                </button>
                            </div>
                        </div>
                    )}

                    {!isSuperAdmin && status !== 'Rejected' && (
                        <div className="bg-gradient-to-r from-amber-50 to-orange-50 p-4 sm:p-5 rounded-2xl border border-amber-200 mb-8 flex items-start gap-3.5 text-amber-900 shadow-2xs">
                            <ShieldAlert className="shrink-0 text-amber-600 mt-0.5" size={22} />
                            <div>
                                <div className="flex items-center gap-2">
                                    <h4 className="font-extrabold text-sm text-amber-950">Staff View-Only Access</h4>
                                    <span className="px-2 py-0.5 bg-amber-200/70 text-amber-900 rounded-md text-[10px] font-extrabold uppercase tracking-wider">Read Only</span>
                                </div>
                                <p className="text-xs text-amber-800 mt-1 leading-relaxed">
                                    Staff accounts have view-only access to this document request. Only the <strong className="text-amber-950 font-bold">Super Admin</strong> can change the process, verify payments, approve or reject requests, and upload or release documents.
                                </p>
                            </div>
                        </div>
                    )}

                    {status !== 'Rejected' && (
                        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">

                            {/* Stepper Sidebar */}
                            <div className="lg:col-span-1">
                                <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 sticky top-8">
                                    <div className="flex items-center justify-between mb-6">
                                        <h3 className="font-bold text-slate-800 uppercase tracking-wider text-xs">Processing Steps</h3>
                                        {isSuperAdmin ? (
                                            <span className="text-[10px] font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full">Interactive</span>
                                        ) : (
                                            <span className="text-[10px] font-bold text-slate-400 bg-slate-100 px-2 py-0.5 rounded-full">View Only</span>
                                        )}
                                    </div>
                                    <div className="space-y-6">
                                        {(isBlockchainEligible ? [
                                            { step: 1, title: 'Verify & Payment', desc: 'Review request details and verify payment receipt' },
                                            { step: 2, title: 'Upload Document', desc: 'Upload the PDF document' },
                                            { step: 3, title: 'Secure on Blockchain', desc: 'Blockchain embedding and finalization' },
                                            { step: 4, title: 'Release', desc: 'Document ready for pickup/delivery' }
                                        ] : [
                                            { step: 1, title: 'Verify & Payment', desc: 'Review request details and verify payment receipt' },
                                            { step: 2, title: 'Finalize & Release', desc: 'Confirm and release request for issuance/pickup' },
                                            { step: 3, title: 'Release', desc: 'Document ready for pickup/delivery' }
                                        ]).map(s => (
                                            <div
                                                key={s.step}
                                                onClick={() => {
                                                    if (isSuperAdmin) setCurrentStep(s.step);
                                                }}
                                                className={`flex gap-4 ${currentStep === s.step ? 'opacity-100' : 'opacity-40'} ${
                                                    isSuperAdmin ? 'cursor-pointer hover:opacity-100 transition-opacity' : 'cursor-default select-none'
                                                }`}
                                                title={isSuperAdmin ? `Super Admin: Click to jump to Step ${s.step}` : 'Staff view: Step navigation is restricted to Super Admin'}
                                            >
                                                <div className={`w-8 h-8 shrink-0 rounded-full flex items-center justify-center font-bold text-sm ${currentStep >= s.step ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-400'}`}>
                                                    {currentStep > s.step ? <CheckCircle2 size={16} /> : s.step}
                                                </div>
                                                <div>
                                                    <p className={`text-sm font-bold ${currentStep >= s.step ? 'text-slate-800' : 'text-slate-500'}`}>{s.title}</p>
                                                    <p className="text-xs text-slate-400">{s.desc}</p>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>

                            {/* Main Content Area */}
                            <div className="lg:col-span-3">

                                {/* Step 1 Content */}
                                {currentStep === 1 && (
                                    <div className="bg-white p-6 sm:p-8 rounded-2xl shadow-sm border border-slate-100 animate-in fade-in slide-in-from-right-4 duration-300 space-y-8">
                                        <div>
                                            <div className="flex items-center justify-between gap-4 flex-wrap mb-2">
                                                <h2 className="text-2xl font-black text-slate-800 tracking-tight">Step 1: Verify Request & Payment</h2>
                                                <div className="flex items-center gap-2">
                                                    <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold ${
                                                        paymentTx?.status === 'Completed'
                                                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                                            : 'bg-amber-50 text-amber-700 border border-amber-200'
                                                    }`}>
                                                        {paymentTx?.status === 'Completed' ? <CheckCircle2 size={13} className="text-emerald-600" /> : <Clock size={13} className="text-amber-600" />}
                                                        <span>Payment: {paymentTx?.status || 'Pending'}</span>
                                                    </span>
                                                    <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold ${
                                                        status === 'In Process' || status === 'Released'
                                                            ? 'bg-purple-50 text-purple-700 border border-purple-200'
                                                            : status === 'Rejected'
                                                            ? 'bg-red-50 text-red-700 border border-red-200'
                                                            : paymentTx?.status === 'Completed'
                                                            ? 'bg-blue-50 text-blue-700 border border-blue-200'
                                                            : 'bg-slate-100 text-slate-500 border border-slate-200'
                                                    }`}>
                                                        {status === 'In Process' || status === 'Released' ? (
                                                            <CheckCircle2 size={13} className="text-purple-600" />
                                                        ) : paymentTx?.status === 'Completed' ? (
                                                            <Unlock size={13} className="text-blue-600" />
                                                        ) : (
                                                            <Lock size={13} className="text-slate-400" />
                                                        )}
                                                        <span>Request: {status === 'In Process' ? 'Approved' : status}</span>
                                                    </span>
                                                </div>
                                            </div>
                                            <p className="text-sm text-slate-500">
                                                Complete two-stage verification: verify and approve the payment receipt first, then approve or reject the document request to proceed.
                                            </p>
                                        </div>

                                        {/* ========================================================= */}
                                        {/* STAGE 1: VERIFY PAYMENT */}
                                        {/* ========================================================= */}
                                        <div className="border border-slate-200 rounded-2xl overflow-hidden shadow-2xs">
                                            <div className="bg-slate-50 px-5 py-4 border-b border-slate-200 flex items-center justify-between gap-3 flex-wrap">
                                                <div className="flex items-center gap-2.5">
                                                    <span className="w-6 h-6 rounded-full bg-blue-600 text-white text-xs font-extrabold flex items-center justify-center">1</span>
                                                    <h3 className="font-bold text-slate-800 text-base">Stage 1: Verify Payment Receipt</h3>
                                                </div>
                                                <span className={`px-2.5 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${
                                                    paymentTx?.status === 'Completed'
                                                        ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                                                        : paymentTx?.status === 'Needs Update'
                                                        ? 'bg-amber-100 text-amber-800 border border-amber-200'
                                                        : paymentTx?.status === 'Rejected'
                                                        ? 'bg-red-100 text-red-800 border border-red-200'
                                                        : 'bg-amber-100 text-amber-800 border border-amber-200'
                                                }`}>
                                                    {paymentTx?.status || 'No Transaction'}
                                                </span>
                                            </div>

                                            {paymentTx ? (
                                                <div className="p-5 space-y-5">
                                                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                                                        <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-100">
                                                            <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1">Payment Method & Amount</p>
                                                            <p className="font-bold text-slate-800 text-sm">{paymentTx.paymentMode || 'Payment'} — ₱{Number(paymentTx.amount || 0).toLocaleString('en-PH', { minimumFractionDigits: 2 })}</p>
                                                        </div>
                                                        <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-100">
                                                            <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1">Transaction Ref #</p>
                                                            <p className="font-mono font-bold text-slate-800 text-sm truncate" title={paymentTx.transactionId}>{paymentTx.transactionId || 'N/A'}</p>
                                                        </div>
                                                        <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-100">
                                                            <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1">Payer Name / Email</p>
                                                            <p className="font-bold text-slate-800 text-sm truncate" title={paymentTx.payerEmail}>{paymentTx.payerName || requestData.name} ({paymentTx.payerEmail || requestData.email || 'N/A'})</p>
                                                        </div>
                                                    </div>

                                                    <div>
                                                        <p className="text-xs font-bold text-slate-500 mb-2">Uploaded Proof of Payment</p>
                                                        <div className="bg-slate-100/70 rounded-xl p-3 h-72 flex items-center justify-center border border-slate-200 overflow-hidden">
                                                            {(paymentTx.imageUrl || paymentTx.receiptImage) ? (
                                                                <img
                                                                    src={(paymentTx.imageUrl || paymentTx.receiptImage).startsWith('http') ? (paymentTx.imageUrl || paymentTx.receiptImage) : `${API_BASE}${paymentTx.receiptImage}`}
                                                                    alt="Payment Receipt"
                                                                    className="max-h-full max-w-full object-contain rounded-lg hover:scale-105 transition-transform cursor-pointer"
                                                                    onClick={() => window.open((paymentTx.imageUrl || paymentTx.receiptImage).startsWith('http') ? (paymentTx.imageUrl || paymentTx.receiptImage) : `${API_BASE}${paymentTx.receiptImage}`, '_blank')}
                                                                    title="Click to view full image in new tab"
                                                                />
                                                            ) : (
                                                                <div className="text-center text-slate-400">
                                                                    <FileSearch size={32} className="mx-auto mb-1 opacity-50" />
                                                                    <span className="font-bold text-xs">No receipt image uploaded</span>
                                                                </div>
                                                            )}
                                                        </div>
                                                    </div>

                                                    {paymentTx.status === 'Completed' && (
                                                        <div className="bg-emerald-50 p-3.5 rounded-xl border border-emerald-200 flex items-center gap-2.5 text-emerald-800 text-xs font-semibold">
                                                            <CheckCircle2 size={16} className="text-emerald-600 shrink-0" />
                                                            <span>Payment receipt is verified and approved. Stage 2 (Document Request Verification) is now unlocked below.</span>
                                                        </div>
                                                    )}

                                                    {paymentTx.status === 'Needs Update' && (
                                                        <div className="bg-amber-50 p-3.5 rounded-xl border border-amber-200 flex items-center gap-2.5 text-amber-800 text-xs font-semibold">
                                                            <AlertCircle size={16} className="text-amber-600 shrink-0" />
                                                            <span>Receipt needs update: The student has been notified to re-upload a clear copy.</span>
                                                        </div>
                                                    )}

                                                    {paymentTx.status === 'Pending Verification' && (
                                                        isSuperAdmin ? (
                                                            <div className="p-4 bg-slate-50 rounded-xl flex flex-col sm:flex-row gap-3 border border-slate-200">
                                                                <select
                                                                    className="flex-1 py-2.5 px-4 border border-slate-200 rounded-xl outline-none focus:border-blue-500 text-xs font-bold text-slate-700 bg-white"
                                                                    value={paymentAction}
                                                                    onChange={(e) => setPaymentAction(e.target.value)}
                                                                    disabled={actionLoading}
                                                                >
                                                                    <option value="Completed">Approve Payment (Receipt Valid)</option>
                                                                    <option value="Needs Update">Needs Update (Blurry / Incomplete Receipt)</option>
                                                                    <option value="Rejected">Reject Completely (Invalid / Fraudulent Receipt)</option>
                                                                </select>
                                                                <button
                                                                    className={`text-white py-2.5 px-6 rounded-xl font-bold text-xs transition-all shadow-sm cursor-pointer ${
                                                                        paymentAction === 'Completed' ? 'bg-emerald-600 hover:bg-emerald-700' : 'bg-red-600 hover:bg-red-700'
                                                                    }`}
                                                                    onClick={() => showConfirm({
                                                                        title: 'Confirm Payment Verification',
                                                                        message: `Are you sure you want to mark this payment as "${paymentAction}"? ${paymentAction === 'Completed' ? 'This will verify payment and unlock Stage 2: Verify Document Request.' : 'The student will be notified.'}`,
                                                                        type: paymentAction === 'Completed' ? 'info' : 'warning',
                                                                        onConfirm: () => handleVerifyPayment(paymentAction)
                                                                    })}
                                                                    disabled={actionLoading}
                                                                >
                                                                    {actionLoading ? 'Processing...' : 'Confirm Payment Action'}
                                                                </button>
                                                            </div>
                                                        ) : (
                                                            <div className="p-4 bg-amber-50/70 rounded-xl border border-amber-200 text-xs flex items-center justify-between gap-3 flex-wrap">
                                                                <div className="flex items-center gap-2 text-amber-800 font-semibold">
                                                                    <Clock size={16} className="text-amber-600 shrink-0" />
                                                                    <span>Payment receipt is pending verification. Only the Super Admin can approve or reject payment receipts.</span>
                                                                </div>
                                                                <span className="px-2.5 py-1 rounded-full bg-amber-100 text-amber-800 font-bold uppercase text-[10px] tracking-wider">
                                                                    Awaiting Super Admin Verification
                                                                </span>
                                                            </div>
                                                        )
                                                    )}
                                                </div>
                                            ) : (
                                                <div className="p-6 text-center text-amber-700 bg-amber-50 text-xs font-bold">
                                                    <AlertCircle className="inline mr-2" size={16} /> No payment transaction recorded for this request.
                                                </div>
                                            )}
                                        </div>

                                        {/* ========================================================= */}
                                        {/* STAGE 2: VERIFY DOCUMENT REQUEST */}
                                        {/* ========================================================= */}
                                        <div className={`border rounded-2xl overflow-hidden transition-all ${
                                            paymentTx?.status === 'Completed'
                                                ? 'border-blue-200 bg-white shadow-2xs'
                                                : 'border-slate-200 bg-slate-50/70 opacity-90'
                                        }`}>
                                            <div className={`px-5 py-4 border-b flex items-center justify-between gap-3 flex-wrap ${
                                                paymentTx?.status === 'Completed'
                                                    ? 'bg-blue-50/60 border-blue-100'
                                                    : 'bg-slate-100/60 border-slate-200'
                                            }`}>
                                                <div className="flex items-center gap-2.5">
                                                    <span className={`w-6 h-6 rounded-full text-xs font-extrabold flex items-center justify-center ${
                                                        paymentTx?.status === 'Completed' ? 'bg-blue-600 text-white' : 'bg-slate-300 text-slate-600'
                                                    }`}>2</span>
                                                    <h3 className="font-bold text-slate-800 text-base">Stage 2: Verify Document Request</h3>
                                                </div>
                                                {paymentTx?.status === 'Completed' ? (
                                                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
                                                        <Unlock size={12} className="text-emerald-700" />
                                                        <span>Ready for Verification</span>
                                                    </span>
                                                ) : (
                                                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-slate-200 text-slate-600">
                                                        <Lock size={12} className="text-slate-500" />
                                                        <span>Locked (Awaiting Payment Verification)</span>
                                                    </span>
                                                )}
                                            </div>

                                            <div className="p-5 space-y-6">
                                                {/* When Payment is NOT Completed -> Locked Message */}
                                                {paymentTx?.status !== 'Completed' && (
                                                    <div className="p-6 text-center rounded-xl bg-white border border-slate-200/80 space-y-2">
                                                        <div className="w-10 h-10 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center mx-auto mb-2">
                                                            <Lock size={20} />
                                                        </div>
                                                        <h4 className="font-bold text-slate-700 text-sm">Document Request Decision Locked</h4>
                                                        <p className="text-xs text-slate-500 max-w-md mx-auto">
                                                            Before approving or rejecting this request, the student's payment receipt must be verified and approved in Stage 1 above.
                                                        </p>
                                                    </div>
                                                )}

                                                {/* When Payment IS Completed -> Unlocked Review & Decision */}
                                                {paymentTx?.status === 'Completed' && (
                                                    <>
                                                        {/* Request Details Review Grid */}
                                                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                                                            <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-100">
                                                                <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1">Student Name</p>
                                                                <p className="font-bold text-slate-800 text-sm">{requestData.name}</p>
                                                            </div>
                                                            <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-100">
                                                                <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1">Student ID</p>
                                                                <p className="font-mono font-bold text-slate-800 text-sm">{requestData.studentId || 'N/A'}</p>
                                                            </div>
                                                            <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-100">
                                                                <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1">Requested Document</p>
                                                                <p className="font-bold text-slate-800 text-sm">{requestData.documentType || requestData.document_type}</p>
                                                            </div>
                                                            <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-100">
                                                                <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1">Course / Year</p>
                                                                <p className="font-bold text-slate-800 text-sm">{requestData.course || 'N/A'} - {requestData.yearLevel || 'N/A'}</p>
                                                            </div>
                                                        </div>

                                                        {/* Purpose and Additional Info */}
                                                        <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 text-xs space-y-1">
                                                            <span className="font-bold text-slate-400 uppercase tracking-wider block">Purpose / Request Details</span>
                                                            <p className="text-slate-700 font-semibold">{requestData.purpose || requestData.otherPurpose || 'Standard issuance'}</p>
                                                        </div>

                                                        {/* Request Status Decision Area */}
                                                        {status === 'Pending' && (
                                                            isSuperAdmin ? (
                                                                <div className="space-y-4 pt-2">
                                                                    {!showRejectForm ? (
                                                                        <div>
                                                                            <div className="bg-blue-50/70 p-3.5 rounded-xl border border-blue-100 text-xs text-blue-800 font-medium mb-4 flex items-center gap-2">
                                                                                <ShieldCheck size={16} className="text-blue-600 shrink-0" />
                                                                                <span>Payment is verified. Review the student's request details above and choose whether to approve or reject this document request.</span>
                                                                            </div>
                                                                            <div className="flex items-center gap-3 flex-wrap">
                                                                                <button
                                                                                    className="bg-[#2c3543] hover:bg-[#1f2631] text-white font-bold text-xs px-6 py-2.5 rounded-full border-t border-t-white/20 border-b-2 border-b-black/50 shadow-[0_2px_5px_rgba(0,0,0,0.2)] hover:-translate-y-0.5 active:translate-y-0.5 active:border-b-0 transition-all flex items-center gap-2 cursor-pointer disabled:opacity-50"
                                                                                    onClick={handleApproveDocumentRequest}
                                                                                    disabled={actionLoading}
                                                                                >
                                                                                    <CheckCircle2 size={14} />
                                                                                    <span>Approve Document Request</span>
                                                                                </button>
                                                                                <button
                                                                                    className="bg-white hover:bg-rose-50 text-rose-700 font-bold text-xs px-6 py-2.5 rounded-full border border-rose-200 shadow-2xs hover:-translate-y-0.5 active:translate-y-0.5 transition-all flex items-center gap-2 cursor-pointer disabled:opacity-50"
                                                                                    onClick={() => {
                                                                                        setShowRejectForm(true);
                                                                                        setRejectionReason('incomplete');
                                                                                    }}
                                                                                    disabled={actionLoading}
                                                                                >
                                                                                    <XCircle size={14} />
                                                                                    <span>Reject Document Request</span>
                                                                                </button>
                                                                            </div>
                                                                        </div>
                                                                    ) : (
                                                                        /* Rejection Form Panel */
                                                                        <div className="bg-rose-50/60 p-5 rounded-2xl border border-rose-200 space-y-4 animate-in fade-in duration-200">
                                                                            <div className="flex items-center justify-between gap-3">
                                                                                <div className="flex items-center gap-2 text-rose-800">
                                                                                    <AlertCircle size={16} />
                                                                                    <h4 className="font-bold text-sm">Reject Document Request</h4>
                                                                                </div>
                                                                                <button
                                                                                    type="button"
                                                                                    onClick={() => setShowRejectForm(false)}
                                                                                    className="text-xs font-bold text-slate-500 hover:text-slate-800 cursor-pointer"
                                                                                >
                                                                                    Cancel
                                                                                </button>
                                                                            </div>
                                                                            <p className="text-xs text-rose-700">
                                                                                Select the reason for rejecting this document request. The student will receive a notification with this explanation.
                                                                            </p>

                                                                            <div className="space-y-2">
                                                                                {[
                                                                                    { id: 'incomplete', label: 'Incomplete Requirements (Missing forms or credentials)' },
                                                                                    { id: 'invalid', label: 'Invalid Information (Student data or program mismatch)' },
                                                                                    { id: 'others', label: 'Other Reason (Specify detailed reason below)' }
                                                                                ].map((opt) => (
                                                                                    <label
                                                                                        key={opt.id}
                                                                                        className={`flex items-center gap-3 p-3 rounded-xl border cursor-pointer text-xs font-semibold transition-all ${
                                                                                            rejectionReason === opt.id
                                                                                                ? 'bg-white border-rose-400 text-rose-900 shadow-xs'
                                                                                                : 'bg-white/70 border-slate-200 text-slate-700 hover:bg-white'
                                                                                        }`}
                                                                                    >
                                                                                        <input
                                                                                            type="radio"
                                                                                            name="rejectionReason"
                                                                                            value={opt.id}
                                                                                            checked={rejectionReason === opt.id}
                                                                                            onChange={(e) => setRejectionReason(e.target.value)}
                                                                                            className="text-rose-600 focus:ring-rose-500"
                                                                                        />
                                                                                        <span>{opt.label}</span>
                                                                                    </label>
                                                                                ))}
                                                                            </div>

                                                                            <div>
                                                                                <label className="block text-xs font-bold text-slate-600 mb-1">
                                                                                    Additional Remarks {rejectionReason === 'others' && <span className="text-rose-600">*</span>}
                                                                                </label>
                                                                                <textarea
                                                                                    className="w-full p-3 border border-slate-200 rounded-xl text-xs outline-none focus:border-rose-400 bg-white"
                                                                                    rows="2"
                                                                                    placeholder={rejectionReason === 'others' ? 'Please explain the specific reason for rejecting this request...' : 'Optional specific notes for the student...'}
                                                                                    value={manualRejectionReason}
                                                                                    onChange={(e) => setManualRejectionReason(e.target.value)}
                                                                                ></textarea>
                                                                            </div>

                                                                            <div className="flex items-center gap-2 pt-1">
                                                                                <button
                                                                                    className="bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs px-5 py-2.5 rounded-full shadow-sm cursor-pointer disabled:opacity-50"
                                                                                    onClick={handleRejectDocumentRequest}
                                                                                    disabled={actionLoading}
                                                                                >
                                                                                    {actionLoading ? 'Rejecting...' : 'Confirm Rejection'}
                                                                                </button>
                                                                                <button
                                                                                    className="bg-white hover:bg-slate-100 text-slate-700 font-bold text-xs px-4 py-2.5 rounded-full border border-slate-200 cursor-pointer"
                                                                                    onClick={() => setShowRejectForm(false)}
                                                                                >
                                                                                    Cancel
                                                                                </button>
                                                                            </div>
                                                                        </div>
                                                                    )}
                                                                </div>
                                                            ) : (
                                                                <div className="p-4 bg-blue-50/70 rounded-xl border border-blue-200 text-xs flex items-center justify-between gap-3 flex-wrap">
                                                                    <div className="flex items-center gap-2 text-blue-800 font-semibold">
                                                                        <ShieldCheck size={16} className="text-blue-600 shrink-0" />
                                                                        <span>Payment is verified. Document request review is awaiting Super Admin decision.</span>
                                                                    </div>
                                                                    <span className="px-2.5 py-1 rounded-full bg-blue-100 text-blue-800 font-bold uppercase text-[10px] tracking-wider">
                                                                        Awaiting Super Admin Decision
                                                                    </span>
                                                                </div>
                                                            )
                                                        )}

                                                        {status === 'In Process' && (
                                                            <div className="flex items-center justify-between gap-3 flex-wrap pt-2 border-t border-slate-100">
                                                                <div className="flex items-center gap-2 text-emerald-700 text-xs font-bold bg-emerald-50 px-3.5 py-2 rounded-xl border border-emerald-200">
                                                                    <CheckCircle2 size={15} className="text-emerald-600" />
                                                                    <span>Document Request Approved & In Process</span>
                                                                </div>
                                                                {isSuperAdmin && (
                                                                    <button
                                                                        className="bg-[#2c3543] hover:bg-[#1f2631] text-white font-bold text-xs px-6 py-2.5 rounded-full border-t border-t-white/20 border-b-2 border-b-black/50 shadow-[0_2px_5px_rgba(0,0,0,0.2)] hover:-translate-y-0.5 active:translate-y-0.5 active:border-b-0 transition-all flex items-center gap-2 cursor-pointer"
                                                                        onClick={() => setCurrentStep(2)}
                                                                    >
                                                                        <span>Proceed to {isBlockchainEligible ? 'Document Upload' : 'Finalize & Release'}</span>
                                                                        <ChevronRight size={14} />
                                                                    </button>
                                                                )}
                                                            </div>
                                                        )}
                                                    </>
                                                )}
                                            </div>
                                        </div>

                                        {/* Super Admin Bypass Override (if needed) */}
                                        {isSuperAdmin && status === 'Pending' && (
                                            <div className="pt-2 flex justify-end">
                                                <button
                                                    className="bg-slate-100 text-slate-700 hover:bg-slate-200 px-5 py-2 rounded-full font-bold text-xs flex items-center gap-1.5 transition-colors cursor-pointer"
                                                    onClick={() => showConfirm({
                                                        title: 'Super Admin Override',
                                                        message: 'Bypass payment verification and forcefully set this request to In Process?',
                                                        type: 'warning',
                                                        onConfirm: async () => {
                                                            await api.put(`/requests/${id}`, { status: 'In Process', forceOverride: true });
                                                            await fetchData();
                                                            setCurrentStep(2);
                                                        }
                                                    })}
                                                >
                                                    <span>Super Admin Override: Force Proceed</span>
                                                    <ChevronRight size={13} />
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                )}

                                {/* Step 2 Content — Blockchain Eligible: Upload External PDF */}
                                {currentStep === 2 && isBlockchainEligible && (
                                    <div className="bg-white p-8 rounded-2xl shadow-sm border border-slate-100 animate-in fade-in slide-in-from-right-4 duration-300">
                                        <h2 className="text-2xl font-bold text-slate-800 mb-2">Upload External PDF</h2>
                                        <p className="text-slate-500 mb-8">Upload the requested document as a PDF. If it is a TOR or Diploma, a QR code will be automatically embedded.</p>

                                        {isSuperAdmin ? (
                                            <>
                                                <input type="file" id="pdfUpload" className="hidden" accept=".pdf" onChange={handleFileUpload} />
                                                <div
                                                    className="border-2 border-dashed border-slate-200 bg-slate-50 rounded-2xl py-16 px-8 text-center mb-8 transition-all group cursor-pointer hover:border-blue-500 hover:bg-blue-50"
                                                    onClick={() => document.getElementById('pdfUpload').click()}
                                                >
                                                    <Upload size={40} className="mx-auto mb-4 transition-colors text-slate-400 group-hover:text-blue-600" />
                                                    {uploadedFile ? (
                                                        <p className="text-blue-600 font-bold">{uploadedFile.name}</p>
                                                    ) : (
                                                        <p className="text-slate-600 font-bold">Click to browse for PDF file</p>
                                                    )}
                                                </div>

                                                <div className="flex items-center gap-3 pt-6 border-t border-slate-100">
                                                    <button
                                                        className="bg-white hover:bg-slate-50 text-slate-700 font-bold text-xs px-6 py-2.5 rounded-full border border-slate-200 shadow-2xs hover:-translate-y-0.5 active:translate-y-0.5 transition-all flex items-center gap-1.5 cursor-pointer"
                                                        onClick={() => setCurrentStep(1)}
                                                    >
                                                        <ArrowLeft size={13} />
                                                        <span>Back to Step 1</span>
                                                    </button>
                                                    <button
                                                        className="flex-1 text-white py-2.5 px-6 rounded-full font-bold text-xs border-t border-t-white/20 border-b-2 border-b-black/50 shadow-[0_2px_5px_rgba(0,0,0,0.2)] hover:-translate-y-0.5 active:translate-y-0.5 active:border-b-0 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 bg-[#2c3543] hover:bg-[#1f2631]"
                                                        disabled={!uploadedFile || actionLoading}
                                                        onClick={processUpload}
                                                    >
                                                        {actionLoading ? 'Uploading & Processing...' : 'Process Document'}
                                                    </button>
                                                </div>
                                            </>
                                        ) : (
                                            <div className="space-y-6">
                                                <div className="border-2 border-dashed border-slate-200 bg-slate-50/70 rounded-2xl py-14 px-8 text-center">
                                                    <Upload size={36} className="mx-auto mb-3 text-slate-300" />
                                                    <p className="text-slate-700 font-bold text-sm">
                                                        {requestData.documentFile ? 'Official Document Attached' : 'No Official Document Uploaded Yet'}
                                                    </p>
                                                    <p className="text-slate-400 text-xs mt-1 max-w-md mx-auto">
                                                        Staff Read-Only View: Only the Super Admin can upload and process the official PDF document for this request.
                                                    </p>
                                                </div>
                                                {requestData.documentFile && (
                                                    <div className="flex justify-center">
                                                        <a
                                                            href={requestData.documentFile.startsWith('data:') ? requestData.documentFile : `${API_BASE}${requestData.documentFile}`}
                                                            target="_blank"
                                                            rel="noopener noreferrer"
                                                            className="bg-[#2c3543] hover:bg-[#1f2631] text-white px-6 py-2.5 rounded-full font-bold text-xs flex items-center gap-2 shadow-xs transition-all"
                                                        >
                                                            <Eye size={14} />
                                                            <span>Preview Attached Document</span>
                                                        </a>
                                                    </div>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                )}

                                {/* Step 2 Content — Non-Blockchain: Direct Finalize & Release (No Upload Required) */}
                                {currentStep === 2 && !isBlockchainEligible && status !== 'Released' && (
                                    <div className="bg-white p-8 rounded-2xl shadow-sm border border-slate-100 animate-in fade-in slide-in-from-right-4 duration-300">
                                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-6">
                                            <div>
                                                <h2 className="text-2xl font-bold text-slate-800">Finalize & Release Document</h2>
                                                <p className="text-slate-500 text-sm mt-1">Review request details and approve release for the student. No document upload is required for this standard document.</p>
                                            </div>
                                            <span className="self-start sm:self-auto px-3 py-1 bg-slate-100 text-slate-600 rounded-full text-xs font-bold uppercase tracking-wider">
                                                Standard Document
                                            </span>
                                        </div>

                                        <div className="bg-slate-50 rounded-2xl p-6 border border-slate-200/80 mb-8">
                                            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-4">Request Summary</h3>
                                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 text-xs">
                                                <div>
                                                    <span className="text-slate-400 font-bold block mb-1">STUDENT NAME</span>
                                                    <span className="font-bold text-slate-800 text-sm">{requestData.name}</span>
                                                </div>
                                                <div>
                                                    <span className="text-slate-400 font-bold block mb-1">STUDENT ID</span>
                                                    <span className="font-bold text-slate-800 text-sm">{requestData.studentId || 'N/A'}</span>
                                                </div>
                                                <div>
                                                    <span className="text-slate-400 font-bold block mb-1">DOCUMENT TYPE</span>
                                                    <span className="font-bold text-slate-800 text-sm">{requestData.documentType || requestData.document_type}</span>
                                                </div>
                                                <div>
                                                    <span className="text-slate-400 font-bold block mb-1">PROGRAM / COURSE</span>
                                                    <span className="font-semibold text-slate-700">{requestData.course || 'N/A'}</span>
                                                </div>
                                                <div>
                                                    <span className="text-slate-400 font-bold block mb-1">PURPOSE</span>
                                                    <span className="font-semibold text-slate-700">{requestData.purpose || requestData.otherPurpose || 'Official Copy'}</span>
                                                </div>
                                                <div>
                                                    <span className="text-slate-400 font-bold block mb-1">QUANTITY</span>
                                                    <span className="font-semibold text-slate-700">{requestData.quantity || 1} copy/copies</span>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="bg-emerald-50 text-emerald-800 p-4 rounded-xl border border-emerald-200 mb-8 flex items-start gap-3 text-xs">
                                            <CheckCircle2 className="mt-0.5 shrink-0 text-emerald-600" size={18} />
                                            <div>
                                                <p className="font-bold text-emerald-900 mb-0.5">Payment Verified & Requirements Ready</p>
                                                <p className="text-emerald-700 leading-relaxed">
                                                    Payment has been verified. Finalizing will mark this request as <span className="font-bold">Released</span> and notify the student that their document is ready for issuance or pickup.
                                                </p>
                                            </div>
                                        </div>

                                        {isSuperAdmin ? (
                                            <div className="flex items-center gap-3 pt-6 border-t border-slate-100">
                                                <button
                                                    className="bg-white hover:bg-slate-50 text-slate-700 font-bold text-xs px-6 py-2.5 rounded-full border border-slate-200 shadow-2xs hover:-translate-y-0.5 active:translate-y-0.5 transition-all flex items-center gap-1.5 cursor-pointer"
                                                    onClick={() => setCurrentStep(1)}
                                                >
                                                    <ArrowLeft size={13} />
                                                    <span>Back to Step 1</span>
                                                </button>
                                                <button
                                                    className="flex-1 text-white py-2.5 px-6 rounded-full font-bold text-xs border-t border-t-white/20 border-b-2 border-b-black/50 shadow-[0_2px_5px_rgba(0,0,0,0.2)] hover:-translate-y-0.5 active:translate-y-0.5 active:border-b-0 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 bg-emerald-600 hover:bg-emerald-700"
                                                    disabled={actionLoading}
                                                    onClick={() => showConfirm({
                                                        title: 'Finalize & Release Request',
                                                        message: `Are you sure you want to finalize and release the ${requestData.documentType || 'document'} for ${requestData.name}?`,
                                                        onConfirm: handleSecureDocument
                                                    })}
                                                >
                                                    {actionLoading ? 'Finalizing...' : 'Finalize & Release Request'}
                                                </button>
                                            </div>
                                        ) : (
                                            <div className="p-4 bg-blue-50/70 rounded-xl border border-blue-200 text-xs text-blue-800 font-medium flex items-center justify-between gap-3 flex-wrap">
                                                <div className="flex items-center gap-2">
                                                    <Clock size={16} className="text-blue-600 shrink-0" />
                                                    <span>Document request is ready for final release. Only the Super Admin can finalize and release this request.</span>
                                                </div>
                                                <span className="px-2.5 py-1 rounded-full bg-blue-100 text-blue-800 font-bold uppercase text-[10px] tracking-wider">
                                                    Awaiting Super Admin Release
                                                </span>
                                            </div>
                                        )}
                                    </div>
                                )}

                                {/* Step 3 Content — Blockchain Eligible: Secure & Finalize */}
                                {currentStep === 3 && isBlockchainEligible && status !== 'Released' && (
                                    <div className="bg-white p-8 rounded-2xl shadow-sm border border-slate-100 animate-in fade-in slide-in-from-right-4 duration-300">
                                        <h2 className="text-2xl font-bold text-slate-800 mb-2">Secure & Finalize</h2>

                                        <div>
                                            <div className="bg-blue-50 text-blue-800 p-4 rounded-xl border border-blue-100 mb-8 flex items-start gap-3">
                                                <ShieldCheck className="mt-1 shrink-0" />
                                                <div>
                                                    <h4 className="font-bold">Blockchain Eligible Document</h4>
                                                    <p className="text-sm">The uploaded PDF has been embedded with a unique QR code. Complete the details below to record this document immutably on the blockchain.</p>
                                                </div>
                                            </div>

                                                <div className="grid grid-cols-2 gap-6 mb-8">
                                                    <div className="col-span-2">
                                                        <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Owner Type *</label>
                                                        <select
                                                            value={blockchainData.ownerType}
                                                            onChange={(e) => setBlockchainData({ ...blockchainData, ownerType: e.target.value })}
                                                            disabled={!isSuperAdmin}
                                                            className={`w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-sm outline-none ${!isSuperAdmin ? 'opacity-75 cursor-not-allowed' : 'focus:border-blue-500'}`}
                                                        >
                                                            <option value="Student">Student</option>
                                                            <option value="Alumni">Alumni</option>
                                                        </select>
                                                    </div>
                                                    <div>
                                                        <label className="block text-xs font-bold text-slate-500 uppercase mb-2">ID Number *</label>
                                                        <input
                                                            type="text"
                                                            required
                                                            placeholder="e.g. ID-2023-001"
                                                            value={blockchainData.studentIDNumber}
                                                            onChange={(e) => setBlockchainData({ ...blockchainData, studentIDNumber: e.target.value })}
                                                            disabled={!isSuperAdmin}
                                                            className={`w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-sm outline-none ${!isSuperAdmin ? 'opacity-75 cursor-not-allowed' : 'focus:border-blue-500'}`}
                                                        />
                                                    </div>

                                                    {blockchainData.ownerType === 'Alumni' ? (
                                                        <div>
                                                            <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Year Graduated *</label>
                                                            <input
                                                                type="number"
                                                                required
                                                                value={blockchainData.yearGraduated}
                                                                onChange={(e) => setBlockchainData({ ...blockchainData, yearGraduated: e.target.value })}
                                                                disabled={!isSuperAdmin}
                                                                className={`w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-sm outline-none ${!isSuperAdmin ? 'opacity-75 cursor-not-allowed' : 'focus:border-blue-500'}`}
                                                            />
                                                        </div>
                                                    ) : (
                                                        <>
                                                            <div>
                                                                <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Course *</label>
                                                                <input
                                                                    type="text"
                                                                    required
                                                                    placeholder="e.g. BSCS"
                                                                    value={blockchainData.course}
                                                                    onChange={(e) => setBlockchainData({ ...blockchainData, course: e.target.value })}
                                                                    disabled={!isSuperAdmin}
                                                                    className={`w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-sm outline-none ${!isSuperAdmin ? 'opacity-75 cursor-not-allowed' : 'focus:border-blue-500'}`}
                                                                />
                                                            </div>
                                                            <div>
                                                                <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Year Level *</label>
                                                                <input
                                                                    type="text"
                                                                    required
                                                                    placeholder="e.g. 3rd Year"
                                                                    value={blockchainData.yearLevel}
                                                                    onChange={(e) => setBlockchainData({ ...blockchainData, yearLevel: e.target.value })}
                                                                    disabled={!isSuperAdmin}
                                                                    className={`w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-sm outline-none ${!isSuperAdmin ? 'opacity-75 cursor-not-allowed' : 'focus:border-blue-500'}`}
                                                                />
                                                            </div>
                                                        </>
                                                    )}

                                                    <div className="col-span-2">
                                                        <label className="block text-xs font-bold text-slate-500 uppercase mb-2">School Name</label>
                                                        <input
                                                            type="text"
                                                            required
                                                            value={blockchainData.nameOfSchool}
                                                            onChange={(e) => setBlockchainData({ ...blockchainData, nameOfSchool: e.target.value })}
                                                            disabled={!isSuperAdmin}
                                                            className={`w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-sm outline-none ${!isSuperAdmin ? 'opacity-75 cursor-not-allowed' : 'focus:border-blue-500'}`}
                                                        />
                                                    </div>
                                                </div>
                                            </div>

                                        {isSuperAdmin ? (
                                            <div className="flex items-center gap-3 pt-6 border-t border-slate-100">
                                                <button
                                                    className="bg-white hover:bg-slate-50 text-slate-700 font-bold text-xs px-6 py-2.5 rounded-full border border-slate-200 shadow-2xs hover:-translate-y-0.5 active:translate-y-0.5 transition-all flex items-center gap-1.5 cursor-pointer"
                                                    onClick={() => setCurrentStep(2)}
                                                >
                                                    <ArrowLeft size={13} />
                                                    <span>Back to Step 2</span>
                                                </button>
                                                <button
                                                    className="flex-1 text-white py-2.5 px-6 rounded-full font-bold text-xs border-t border-t-white/20 border-b-2 border-b-black/50 shadow-[0_2px_5px_rgba(0,0,0,0.2)] hover:-translate-y-0.5 active:translate-y-0.5 active:border-b-0 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 bg-[#2c3543] hover:bg-[#1f2631]"
                                                    disabled={actionLoading || (isBlockchainEligible && !blockchainData.studentIDNumber)}
                                                    onClick={() => showConfirm({
                                                        title: isBlockchainEligible ? 'Secure to Blockchain' : 'Finalize Document',
                                                        message: 'Are you sure you want to finalize this request?',
                                                        onConfirm: handleSecureDocument
                                                    })}
                                                >
                                                    {actionLoading ? 'Processing...' : (isBlockchainEligible ? 'Secure on Blockchain' : 'Finalize Request')}
                                                </button>
                                            </div>
                                        ) : (
                                            <div className="p-4 bg-blue-50/70 rounded-xl border border-blue-200 text-xs text-blue-800 font-medium flex items-center justify-between gap-3 flex-wrap">
                                                <div className="flex items-center gap-2">
                                                    <ShieldCheck size={16} className="text-blue-600 shrink-0" />
                                                    <span>Document is ready for blockchain recording. Only the Super Admin can secure and finalize this document.</span>
                                                </div>
                                                <span className="px-2.5 py-1 rounded-full bg-blue-100 text-blue-800 font-bold uppercase text-[10px] tracking-wider">
                                                    Awaiting Super Admin Recording
                                                </span>
                                            </div>
                                        )}
                                    </div>
                                )}

                                {/* Final Step Content */}
                                {((isBlockchainEligible && currentStep === 4) || (!isBlockchainEligible && currentStep === 3)) && (
                                    <div className="bg-white p-10 rounded-2xl shadow-sm border border-slate-100 animate-in fade-in slide-in-from-right-4 duration-300 text-center">
                                        <div className="w-24 h-24 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-6">
                                            <CheckCircle2 size={48} className="text-emerald-600" />
                                        </div>
                                        <h2 className="text-2xl font-bold text-slate-800 mb-2">Request Completed</h2>
                                        <p className="text-slate-500 mb-8 max-w-md mx-auto text-xs">
                                            The document request has been successfully finalized. It is now marked as Released and is ready for the student.
                                        </p>

                                        {blockchainResult && (
                                            <div className="bg-slate-50 p-5 rounded-xl border border-slate-200 text-left mb-8 max-w-lg mx-auto">
                                                <h4 className="font-bold text-xs text-slate-500 uppercase tracking-widest mb-3 flex items-center gap-1.5">
                                                    <ShieldCheck size={14} className="text-blue-600" />
                                                    <span>Secured Digital Ledger Record</span>
                                                </h4>
                                                <div className="space-y-2.5">
                                                    <div>
                                                        <p className="text-[10.5px] font-bold text-slate-400 uppercase">Verification Hash</p>
                                                        <div className="flex items-center gap-1.5 mt-0.5">
                                                            <span className="font-mono text-xs text-slate-800 bg-white border border-slate-200 px-2 py-0.5 rounded font-bold" title={blockchainResult.transactionHash}>
                                                                {formatShortId(blockchainResult.transactionHash, 'SEC')}
                                                            </span>
                                                            <button
                                                                type="button"
                                                                onClick={() => handleCopy(blockchainResult.transactionHash, 'sec-hash')}
                                                                className="text-slate-400 hover:text-slate-700 transition-colors p-1 rounded hover:bg-slate-200/60 cursor-pointer"
                                                                title="Copy Full Transaction Hash"
                                                            >
                                                                {copiedId === 'sec-hash' ? <Check size={11} className="text-emerald-600" /> : <Copy size={11} />}
                                                            </button>
                                                        </div>
                                                    </div>
                                                    <div>
                                                        <p className="text-[10.5px] font-bold text-slate-400 uppercase">Reference / Student ID</p>
                                                        <p className="font-bold text-slate-700 text-xs mt-0.5">{blockchainResult.referenceNumber} / {blockchainResult.studentIDNumber}</p>
                                                    </div>
                                                </div>
                                            </div>
                                        )}

                                        <div className="flex flex-wrap gap-3 justify-center">
                                            {requestData.documentFile && (
                                                <a
                                                    href={requestData.documentFile.startsWith('data:') ? requestData.documentFile : `${API_BASE}${requestData.documentFile}`}
                                                    download={requestData.documentFile.startsWith('data:') ? `official-document-${requestData.requestId}.pdf` : undefined}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="bg-emerald-600 hover:bg-emerald-700 text-white px-6 py-2.5 rounded-full font-bold text-xs flex items-center gap-2 shadow-xs hover:-translate-y-0.5 active:translate-y-0.5 transition-all cursor-pointer"
                                                >
                                                    <Download size={14} /> 
                                                    <span>Download Official Soft Copy</span>
                                                </a>
                                            )}
                                            <button
                                                className="bg-[#2c3543] hover:bg-[#1f2631] text-white px-6 py-2.5 rounded-full font-bold text-xs border-t border-t-white/20 border-b-2 border-b-black/50 shadow-[0_2px_5px_rgba(0,0,0,0.2)] hover:-translate-y-0.5 active:translate-y-0.5 active:border-b-0 transition-all flex items-center gap-1.5 cursor-pointer"
                                                onClick={() => navigate(backToRequests)}
                                            >
                                                Return to Requests
                                            </button>
                                        </div>
                                        {isSuperAdmin && (
                                            <div className="mt-8 pt-6 border-t border-slate-100">
                                                <button
                                                    className="text-slate-500 hover:text-amber-600 font-bold text-sm flex items-center justify-center gap-2 w-full transition-colors"
                                                    onClick={() => showConfirm({
                                                        title: 'Revert Status',
                                                        message: 'Are you sure you want to revert this completed request back to "In Process"? You can re-upload documents if needed.',
                                                        type: 'warning',
                                                        onConfirm: async () => {
                                                            await api.put(`/requests/${id}`, { status: 'In Process', forceOverride: true });
                                                            await fetchData();
                                                        }
                                                    })}
                                                >
                                                    <AlertCircle size={16} /> Super Admin: Revert to "In Process"
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>
                        </div>
                    )}
                </div>

            {/* ====== SUPER ADMIN FORCE OVERRIDE MODAL ====== */}
            {showSuperAdminModal && (
                <div className="fixed inset-0 z-[1100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
                    <div className="bg-white w-full max-w-lg rounded-2xl shadow-2xl border border-slate-200 overflow-hidden animate-in zoom-in-95 duration-200">
                        {/* Modal Header */}
                        <div className="bg-[#1D2D44] p-5 text-white flex justify-between items-center">
                            <div className="flex items-center gap-2.5">
                                <Shield className="text-amber-400" size={20} />
                                <div>
                                    <h3 className="text-base font-bold">Super Admin Force Override</h3>
                                    <p className="text-[11px] text-slate-300 font-medium">Override request status, steps, and process restrictions</p>
                                </div>
                            </div>
                            <button
                                onClick={() => setShowSuperAdminModal(false)}
                                className="text-white/60 hover:text-white transition-colors cursor-pointer p-1"
                            >
                                <X size={20} />
                            </button>
                        </div>

                        {/* Modal Body */}
                        <div className="p-6 space-y-5 text-xs">
                            {/* Current Status Preview */}
                            <div className="flex items-center justify-between p-3.5 bg-slate-50 rounded-xl border border-slate-100">
                                <div>
                                    <span className="text-slate-400 font-bold block mb-0.5 text-[10.5px] uppercase tracking-wider">Current Request State</span>
                                    <span className="font-bold text-slate-800 text-sm">{requestData?.name} — {requestData?.documentType}</span>
                                </div>
                                <span className="px-2.5 py-1 rounded-full text-xs font-extrabold uppercase bg-slate-200 text-slate-700">
                                    {status}
                                </span>
                            </div>

                            {/* Target Status Selection */}
                            <div>
                                <label className="block text-slate-700 font-bold text-xs mb-2 uppercase tracking-wider">
                                    Set Target Status
                                </label>
                                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                                    {[
                                        { value: 'Pending', label: 'Pending', color: 'border-amber-400 text-amber-800 bg-amber-50/50' },
                                        { value: 'In Process', label: 'In Process', color: 'border-purple-400 text-purple-800 bg-purple-50/50' },
                                        { value: 'Released', label: 'Released', color: 'border-emerald-400 text-emerald-800 bg-emerald-50/50' },
                                        { value: 'Rejected', label: 'Rejected', color: 'border-red-400 text-red-800 bg-red-50/50' }
                                    ].map(st => (
                                        <button
                                            key={st.value}
                                            type="button"
                                            onClick={() => setOverrideStatus(st.value)}
                                            className={`py-2 px-3 rounded-xl border font-bold text-xs transition-all cursor-pointer text-center ${
                                                overrideStatus === st.value
                                                    ? `${st.color} border-2 shadow-xs`
                                                    : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                                            }`}
                                        >
                                            {st.label}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Target Step Selection */}
                            <div>
                                <label className="block text-slate-700 font-bold text-xs mb-2 uppercase tracking-wider">
                                    Jump to Processing Step
                                </label>
                                <div className="grid grid-cols-2 gap-2">
                                    {(isBlockchainEligible ? [
                                        { step: 1, label: 'Step 1: Verify & Payment' },
                                        { step: 2, label: 'Step 2: Upload Document' },
                                        { step: 3, label: 'Step 3: Secure Blockchain' },
                                        { step: 4, label: 'Step 4: Release & Pickup' }
                                    ] : [
                                        { step: 1, label: 'Step 1: Verify & Payment' },
                                        { step: 2, label: 'Step 2: Finalize & Release' },
                                        { step: 3, label: 'Step 3: Release & Pickup' }
                                    ]).map(s => (
                                        <button
                                            key={s.step}
                                            type="button"
                                            onClick={() => setOverrideStep(s.step)}
                                            className={`py-2 px-3 rounded-xl border text-left font-bold text-xs transition-all cursor-pointer ${
                                                overrideStep === s.step
                                                    ? 'border-blue-600 bg-blue-50 text-blue-800 border-2 shadow-xs'
                                                    : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                                            }`}
                                        >
                                            {s.label}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Audit Remarks */}
                            <div>
                                <label className="block text-slate-700 font-bold text-xs mb-1 uppercase tracking-wider">
                                    Override Remarks / Audit Note
                                </label>
                                <textarea
                                    className="w-full p-3 border border-slate-200 rounded-xl text-xs outline-none focus:border-blue-500 bg-white"
                                    rows="2"
                                    placeholder="Reason for override (recorded in audit logs)..."
                                    value={overrideRemarks}
                                    onChange={(e) => setOverrideRemarks(e.target.value)}
                                ></textarea>
                            </div>

                            {/* Actions */}
                            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                                <button
                                    type="button"
                                    onClick={() => setShowSuperAdminModal(false)}
                                    className="bg-white hover:bg-slate-100 text-slate-700 font-bold text-xs px-4 py-2 rounded-full border border-slate-200 cursor-pointer"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="button"
                                    onClick={handleApplySuperAdminOverride}
                                    disabled={actionLoading}
                                    className="bg-[#2c3543] hover:bg-[#1f2631] text-white font-bold text-xs px-5 py-2 rounded-full shadow-sm cursor-pointer disabled:opacity-50 flex items-center gap-1.5"
                                >
                                    <Shield size={13} className="text-amber-400" />
                                    <span>{actionLoading ? 'Applying...' : 'Apply Force Override'}</span>
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {confirmConfig && (
                <ConfirmModal
                    isOpen={!!confirmConfig}
                    title={confirmConfig.title}
                    message={confirmConfig.message}
                    onConfirm={confirmConfig.onConfirm}
                    onClose={closeConfirm}
                    type={confirmConfig.type}
                    confirmText={confirmConfig.confirmText}
                    cancelText={confirmConfig.cancelText}
                    isLoading={confirmConfig.isLoading}
                />
            )}
            {/* Feedback Modal */}
            {feedbackConfig && (
                <FeedbackModal 
                    {...feedbackConfig} 
                    isOpen={!!feedbackConfig} 
                    onClose={closeFeedback} 
                />
            )}
        </Layout>
    );
};

export default RequestDetails;