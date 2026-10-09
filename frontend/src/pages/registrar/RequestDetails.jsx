import { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { ChevronRight, ArrowLeft, FileText, Upload, CheckCircle2, AlertCircle, ShieldCheck, ShieldAlert, FileSearch, Shield, Search, Download, Copy, Check, Lock, Unlock, XCircle, Clock, CreditCard, X, Eye, Calendar } from 'lucide-react';
import Layout from '../../components/Layout';
import ConfirmModal from '../../components/ConfirmModal';
import FeedbackModal from '../../components/FeedbackModal';
import DateRangePicker from '../../components/common/DateRangePicker';
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
    const userDept = (localStorage.getItem('userDepartment') || '').toLowerCase();
    const isSuperAdmin = userRole === 'super admin';
    const isAccounting = ['accounting admin', 'accounting staff'].includes(userRole) || userDept === 'accounting' || userRole.includes('accounting');
    const isRegistrar = ['registrar', 'registrar staff', 'registrar admin'].includes(userRole) || userDept === 'registrar' || userRole.includes('registrar');
    const isStaffOrAdmin = ['super admin', 'registrar', 'registrar staff', 'registrar admin', 'admin', 'staff', 'accounting admin', 'accounting staff'].includes(userRole);
    const hasProcessingAccess = isStaffOrAdmin;
    const canVerifyPayment = isSuperAdmin || isAccounting;

    // Core Data State
    const [requestData, setRequestData] = useState(null);
    const [paymentTx, setPaymentTx] = useState(null);
    const [loading, setLoading] = useState(true);
    const [actionLoading, setActionLoading] = useState(false);
    const [copiedId, setCopiedId] = useState(null);

    // Estimated Processing Window State (Date Range Picker)
    const [processingWindow, setProcessingWindow] = useState({
        startDate: '',
        endDate: ''
    });

    // Wizard State
    const [currentStep, setCurrentStep] = useState(1);
    const [uploadedFile, setUploadedFile] = useState(null);
    const [documentData, setDocumentData] = useState(null);
    const [rejectionReason, setRejectionReason] = useState('');
    const [manualRejectionReason, setManualRejectionReason] = useState('');
    const [showRejectForm, setShowRejectForm] = useState(false);
    const [paymentAction, setPaymentAction] = useState('Completed');
    const [paymentRemarks, setPaymentRemarks] = useState('');
    const [isEditingPayment, setIsEditingPayment] = useState(false);

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

            // Auto-populate blockchain form data from request details and user profile
            if (found) {
                const docType = (found.documentType || found.document_type || '').toLowerCase();
                const isDiploma = docType.includes('diploma');
                const detectedOwner = found.ownerType || (isDiploma ? 'Alumni' : 'Student');
                const rawId = found.studentId || found.studentIDNumber || found.userProfileStudentId || '';
                const cleanStudentId = (rawId && rawId !== 'N/A' && rawId !== 'None' && rawId !== 'n/a') ? rawId : '';

                setBlockchainData(prev => ({
                    ...prev,
                    ownerType: detectedOwner || prev.ownerType || 'Student',
                    studentIDNumber: cleanStudentId || prev.studentIDNumber || '',
                    course: found.course || prev.course || '',
                    yearLevel: found.yearLevel || prev.yearLevel || '',
                    nameOfSchool: found.nameOfSchool || found.schoolName || prev.nameOfSchool || 'VeriFitor University',
                }));
            }

            // Auto-populate estimated processing window from request details or standard default
            if (found) {
                if (found.estimatedProcessingStart) {
                    const s = new Date(found.estimatedProcessingStart).toISOString().split('T')[0];
                    const e = found.estimatedProcessingEnd ? new Date(found.estimatedProcessingEnd).toISOString().split('T')[0] : '';
                    setProcessingWindow({ startDate: s, endDate: e });
                } else {
                    const today = new Date();
                    const s = today.toISOString().split('T')[0];
                    const defaultEnd = new Date(today);
                    defaultEnd.setDate(defaultEnd.getDate() + 5);
                    const e = defaultEnd.toISOString().split('T')[0];
                    setProcessingWindow({ startDate: s, endDate: e });
                }
            }

            // If already released, attempt to load existing blockchain verification details
            if (found && found.status === 'Released' && (found.studentId || found.studentIDNumber)) {
                const sid = found.studentId || found.studentIDNumber;
                try {
                    const bcRes = await api.get(`/blockchain/transactions/verify-by-id/${sid}`);
                    const rec = bcRes.data?.databaseRecord || bcRes.data?.blockchainRecord;
                    if (rec) {
                        setBlockchainResult({
                            referenceNumber: rec.referenceNumber || `TXN-${Date.now()}`,
                            transactionHash: rec.blockchainTxHash || rec.txHash || rec.txID || 'Recorded on Ledger',
                            blockchainTimestamp: rec.createdAt ? new Date(rec.createdAt).toLocaleString() : (rec.date ? new Date(rec.date).toLocaleString() : new Date().toLocaleString()),
                            studentIDNumber: sid,
                        });
                    }
                } catch (bcErr) {
                    // Non-blocking: transaction might be newly created or not indexed yet
                    console.warn("Blockchain verify-by-id lookup:", bcErr);
                }
            }

            // Auto-initialize rejection form if payment was rejected but document request is not yet rejected
            if (foundTx && foundTx.status === 'Rejected' && found && found.status !== 'Rejected') {
                setShowRejectForm(true);
                setRejectionReason('unpaid');
                if (foundTx.adminRemarks) {
                    setManualRejectionReason(foundTx.adminRemarks);
                }
            }

            // Determine Step
            const docType = (found?.documentType || found?.document_type || '').toLowerCase();
            const isBlockchain = docType.includes('tor') || docType.includes('diploma');

            if (found && found.status === 'Released') {
                setCurrentStep(isBlockchain ? 4 : 3);
            } else if (foundTx && foundTx.status === 'Rejected' && found && found.status !== 'Rejected') {
                // Payment was rejected but document request has not been confirmed rejected yet:
                // keep on Step 1 (Stage 2: Verify Document Request) so admin can review remarks and confirm rejection
                setCurrentStep(1);
            } else if (found && found.status === 'In Process') {
                if (isBlockchain) {
                    // Do not auto-skip Step 2! Land on Step 2 so user can inspect the existing document,
                    // keep it as is, or replace it. Only preserve Step 3 if user has actively moved to Step 3.
                    setCurrentStep(prev => (prev === 3 ? 3 : 2));
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

    const handleStatusUpdate = async (newStatus, extraPayload = {}) => {
        setActionLoading(true);
        try {
            const updatePayload = { status: newStatus, ...extraPayload };
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
            console.error('Update status error:', err);
            showFeedback({
                title: 'Update Failed',
                message: err.response?.data?.message || 'Oops! We couldn\'t update the status of this request right now. Please try again.',
                type: 'error'
            });
        } finally {
            setActionLoading(false);
        }
    };

    const handleVerifyPayment = async (actionStatus) => {
        setActionLoading(true);
        try {
            await api.put(`/transactions/${paymentTx.transactionId}/verify`, {
                status: actionStatus,
                adminRemarks: paymentRemarks
            });
            await fetchData();
            setIsEditingPayment(false);

            if (actionStatus === 'Rejected') {
                setShowRejectForm(true);
                setRejectionReason('unpaid');
                if (paymentRemarks.trim()) {
                    setManualRejectionReason(paymentRemarks.trim());
                }
                setTimeout(() => {
                    const stage2 = document.getElementById('stage-2-verify');
                    if (stage2) stage2.scrollIntoView({ behavior: 'smooth' });
                }, 150);
                showFeedback({
                    title: 'Payment Marked as Rejected',
                    message: 'Payment has been marked as Rejected. Stage 2 is unlocked below — please review request details, verify your remarks, and confirm rejection of the document request to notify the student.',
                    type: 'warning'
                });
            } else if (actionStatus === 'Completed') {
                showFeedback({
                    title: 'Payment Status Updated',
                    message: 'Payment status has been set to "Completed". Stage 2 (Verify Document Request) is now unlocked below.',
                    type: 'info'
                });
            } else {
                showFeedback({
                    title: 'Payment Status Updated',
                    message: `Payment status has been set to "${actionStatus}". The student has been notified.`,
                    type: 'info'
                });
            }
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
        const windowText = processingWindow.startDate && processingWindow.endDate
            ? ` (${processingWindow.startDate} to ${processingWindow.endDate})`
            : '';
        showConfirm({
            title: 'Approve Document Request',
            message: `Are you sure you want to approve the document request for ${requestData?.name || 'the student'}? The student will receive a notification with the estimated processing window${windowText} and the request will move to document preparation.`,
            type: 'info',
            onConfirm: async () => {
                await handleStatusUpdate('In Process', {
                    estimatedProcessingStart: processingWindow.startDate || undefined,
                    estimatedProcessingEnd: processingWindow.endDate || undefined
                });
                setCurrentStep(2);
            }
        });
    };

    const handleSaveProcessingWindow = async () => {
        if (!processingWindow.startDate || !processingWindow.endDate) {
            showFeedback({
                title: 'Date Selection Required',
                message: 'Please select both a start date and an estimated completion date.',
                type: 'error'
            });
            return;
        }
        setActionLoading(true);
        try {
            await api.put(`/requests/${id}`, {
                estimatedProcessingStart: processingWindow.startDate,
                estimatedProcessingEnd: processingWindow.endDate
            });
            await fetchData();
            showFeedback({
                title: 'Processing Window Saved',
                message: `The estimated processing window has been updated (${processingWindow.startDate} to ${processingWindow.endDate}).`,
                type: 'info'
            });
        } catch (err) {
            console.error('Save processing window error:', err);
            showFeedback({
                title: 'Update Failed',
                message: 'Failed to update processing schedule.',
                type: 'error'
            });
        } finally {
            setActionLoading(false);
        }
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
            setUploadedFile(null);

            // Both blockchain and non-blockchain docs now go to step 3 for confirmation
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
                    ownerType: blockchainData.ownerType || 'Student',
                    course: blockchainData.ownerType === 'Alumni' ? "" : (blockchainData.course || ""),
                    yearLevel: blockchainData.ownerType === 'Alumni' ? "" : (blockchainData.yearLevel || ""),
                    studentIDNumber: (blockchainData.studentIDNumber || "").trim(),
                    typeOfDocument: requestData.documentType || requestData.document_type || "Document",
                    nameOfSchool: blockchainData.nameOfSchool,
                    yearGraduated: blockchainData.ownerType === 'Alumni' ? Number(blockchainData.yearGraduated) : 0
                });

                setBlockchainResult({
                    referenceNumber: blockchainRes.data.referenceNumber || blockchainRes.data.transaction?.referenceNumber || `TXN-${Date.now()}`,
                    transactionHash: blockchainRes.data.blockchainTxHash || blockchainRes.data.transactionHash || blockchainRes.data.transaction?.blockchainTxHash || 'Recorded on Ledger',
                    blockchainTimestamp: blockchainRes.data.timestamp || (blockchainRes.data.transaction?.createdAt ? new Date(blockchainRes.data.transaction.createdAt).toLocaleString() : new Date().toLocaleString()),
                    studentIDNumber: blockchainData.studentIDNumber,
                });
            }

            await api.put(`/requests/${id}`, { status: "Released" });
            setCurrentStep(isBlockchainEligible ? 4 : 3);
            await fetchData();
        } catch (err) {
            console.error('Finalize error:', err);
            showFeedback({
                title: 'Failed to Finalize',
                message: err.response?.data?.message || 'Oops! We ran into an issue while securing this document. Please try again later.',
                type: 'error'
            });
        } finally {
            setActionLoading(false);
        }
    };

    const base64ToBlob = (base64Data, contentType = 'application/pdf') => {
        const cleanBase64 = base64Data.includes(';base64,')
            ? base64Data.split(';base64,')[1]
            : base64Data;
        const byteCharacters = atob(cleanBase64);
        const byteNumbers = new Array(byteCharacters.length);
        for (let i = 0; i < byteCharacters.length; i++) {
            byteNumbers[i] = byteCharacters.charCodeAt(i);
        }
        const byteArray = new Uint8Array(byteNumbers);
        return new Blob([byteArray], { type: contentType });
    };

    const handlePreviewDocument = () => {
        if (!requestData?.documentFile) return;
        try {
            if (requestData.documentFile.startsWith('data:')) {
                const blob = base64ToBlob(requestData.documentFile, 'application/pdf');
                const blobUrl = URL.createObjectURL(blob);
                window.open(blobUrl, '_blank', 'noopener,noreferrer');
            } else {
                const fileUrl = requestData.documentFile.startsWith('http')
                    ? requestData.documentFile
                    : `${API_BASE}${requestData.documentFile}`;
                window.open(fileUrl, '_blank', 'noopener,noreferrer');
            }
        } catch (err) {
            console.error('Preview error:', err);
            showFeedback({
                title: 'Preview Failed',
                message: 'Failed to open document preview.',
                type: 'error'
            });
        }
    };

    const handleDownloadDocument = () => {
        if (!requestData?.documentFile) return;
        try {
            let blobUrl;
            let shouldRevoke = false;

            if (requestData.documentFile.startsWith('data:')) {
                const blob = base64ToBlob(requestData.documentFile, 'application/pdf');
                blobUrl = URL.createObjectURL(blob);
                shouldRevoke = true;
            } else {
                blobUrl = requestData.documentFile.startsWith('http')
                    ? requestData.documentFile
                    : `${API_BASE}${requestData.documentFile}`;
            }

            const downloadLink = document.createElement('a');
            downloadLink.href = blobUrl;
            downloadLink.download = `official-document-${requestData.requestId || 'export'}.pdf`;
            document.body.appendChild(downloadLink);
            downloadLink.click();
            document.body.removeChild(downloadLink);

            if (shouldRevoke) {
                setTimeout(() => URL.revokeObjectURL(blobUrl), 15000);
            }
        } catch (err) {
            console.error('Download error:', err);
            showFeedback({
                title: 'Download Failed',
                message: 'Failed to download document file. Please try again.',
                type: 'error'
            });
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
    const isPaymentRejected = paymentTx?.status === 'Rejected';
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
                            type="button"
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
                            </div>
                        </div>
                    )}

                    {/* View-Only Notice for Non-Processing Users */}
                    {!hasProcessingAccess && status !== 'Rejected' && (
                        <div className="bg-gradient-to-r from-amber-50 to-orange-50 p-3.5 sm:p-4 rounded-2xl border border-amber-200 mb-6 flex items-center gap-3 text-amber-900 shadow-2xs">
                            <ShieldAlert className="shrink-0 text-amber-600" size={18} />
                            <p className="text-xs text-amber-800 m-0 font-medium">
                                Read-only view. Processing actions are limited to authorized staff.
                            </p>
                        </div>
                    )}

                    {status !== 'Rejected' && (
                        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">

                            {/* Stepper Sidebar */}
                            <div className="lg:col-span-1">
                                <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 sticky top-8">
                                    <h3 className="font-bold text-slate-800 mb-6 uppercase tracking-wider text-xs">Processing Steps</h3>
                                    <div className="space-y-6">
                                        {(isBlockchainEligible ? [
                                            { step: 1, title: 'Review & Schedule', desc: 'Review request, accounting payment verification & schedule window' },
                                            { step: 2, title: 'Upload Document', desc: 'Upload the PDF document' },
                                            { step: 3, title: 'Secure on Blockchain', desc: 'Blockchain embedding and finalization' },
                                            { step: 4, title: 'Release', desc: 'Document ready for pickup' }
                                        ] : [
                                            { step: 1, title: 'Review & Schedule', desc: 'Review request, accounting payment verification & schedule window' },
                                            { step: 2, title: 'Finalize & Release', desc: 'Confirm and release request for issuance/pickup' },
                                            { step: 3, title: 'Release', desc: 'Document ready for pickup' }
                                        ]).map(s => (
                                            <div
                                                key={s.step}
                                                className={`flex gap-4 ${currentStep === s.step ? 'opacity-100' : 'opacity-40'} cursor-default select-none`}
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
                                    <div className="bg-white p-6 sm:p-8 rounded-2xl shadow-sm border border-slate-100 animate-in fade-in slide-in-from-right-4 duration-300 space-y-7">
                                        
                                        {/* Step 1 Header */}
                                        <div>
                                            <div className="flex items-center justify-between gap-4 flex-wrap mb-2">
                                                <div>
                                                    <span className="text-[11px] font-extrabold uppercase tracking-wider text-blue-600 bg-blue-50 px-2.5 py-0.5 rounded-full inline-block mb-1">
                                                        Step 1 of {isBlockchainEligible ? '4' : '3'}
                                                    </span>
                                                    <h2 className="text-2xl font-black text-slate-900 tracking-tight">Review Request &amp; Schedule Processing</h2>
                                                </div>
                                                
                                                {/* Header Badges */}
                                                <div className="flex items-center gap-2 flex-wrap">
                                                    {/* Accounting Payment Status Dynamic Badge */}
                                                    <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold ${
                                                        isPaymentCleared
                                                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                                            : isPaymentRejected
                                                            ? 'bg-red-50 text-red-700 border border-red-200'
                                                            : paymentTx?.status === 'Needs Update'
                                                            ? 'bg-amber-50 text-amber-700 border border-amber-200'
                                                            : 'bg-blue-50 text-blue-700 border border-blue-200'
                                                    }`}>
                                                        {isPaymentCleared ? (
                                                            <CheckCircle2 size={13} className="text-emerald-600" />
                                                        ) : isPaymentRejected ? (
                                                            <XCircle size={13} className="text-red-600" />
                                                        ) : (
                                                            <Clock size={13} className="text-blue-600" />
                                                        )}
                                                        <span>Payment: {isPaymentCleared ? 'Payment Verified' : (paymentTx?.status || 'Awaiting Accounting')}</span>
                                                    </span>

                                                    {/* Document Request Status Badge */}
                                                    <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold ${
                                                        status === 'Rejected'
                                                            ? 'bg-red-50 text-red-700 border border-red-200'
                                                            : status === 'In Process' || status === 'Released'
                                                            ? 'bg-purple-50 text-purple-700 border border-purple-200'
                                                            : isPaymentCleared
                                                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                                            : 'bg-slate-100 text-slate-500 border border-slate-200'
                                                    }`}>
                                                        {status === 'Rejected' ? (
                                                            <XCircle size={13} className="text-red-600" />
                                                        ) : status === 'In Process' || status === 'Released' ? (
                                                            <CheckCircle2 size={13} className="text-purple-600" />
                                                        ) : isPaymentCleared ? (
                                                            <Unlock size={13} className="text-emerald-600" />
                                                        ) : (
                                                            <Lock size={13} className="text-slate-400" />
                                                        )}
                                                        <span>
                                                            Request: {
                                                                status === 'Rejected' ? 'Rejected' :
                                                                status === 'In Process' ? 'Approved & Scheduled' :
                                                                status === 'Released' ? 'Released' :
                                                                isPaymentCleared ? 'Ready to Approve' : 'Awaiting Payment'
                                                            }
                                                        </span>
                                                    </span>
                                                </div>
                                            </div>
                                        </div>

                                        {/* ========================================================= */}
                                        {/* STUDENT REQUEST DETAILS */}
                                        {/* ========================================================= */}
                                        <div className="border border-slate-200/90 rounded-2xl overflow-hidden shadow-2xs bg-white">
                                            <div className="bg-slate-50/80 px-5 py-3.5 border-b border-slate-200 flex items-center justify-between gap-3">
                                                <div className="flex items-center gap-2.5">
                                                    <div className="w-7 h-7 rounded-lg bg-indigo-100 text-indigo-700 flex items-center justify-center font-bold">
                                                        <FileText size={15} />
                                                    </div>
                                                    <h3 className="font-bold text-slate-900 text-sm">Request Details</h3>
                                                </div>
                                                <span className="font-mono text-xs font-bold text-slate-500 bg-slate-100 px-2.5 py-1 rounded-md">
                                                    {requestData.requestId}
                                                </span>
                                            </div>

                                            <div className="p-5 space-y-4">
                                                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
                                                    <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
                                                        <p className="text-[10.5px] font-bold text-slate-400 uppercase tracking-wider mb-0.5">Student Name</p>
                                                        <p className="font-bold text-slate-900 text-sm">{requestData.name}</p>
                                                    </div>
                                                    <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
                                                        <p className="text-[10.5px] font-bold text-slate-400 uppercase tracking-wider mb-0.5">Student ID</p>
                                                        <p className="font-mono font-bold text-slate-900 text-sm">{requestData.studentId || 'N/A'}</p>
                                                    </div>
                                                    <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
                                                        <p className="text-[10.5px] font-bold text-slate-400 uppercase tracking-wider mb-0.5">Requested Document</p>
                                                        <p className="font-bold text-slate-900 text-sm">{requestData.documentType || requestData.document_type}</p>
                                                    </div>
                                                    <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
                                                        <p className="text-[10.5px] font-bold text-slate-400 uppercase tracking-wider mb-0.5">Course / Year</p>
                                                        <p className="font-bold text-slate-900 text-sm">{requestData.course || 'N/A'} - {requestData.yearLevel || 'N/A'}</p>
                                                    </div>
                                                </div>

                                                <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-100 text-xs">
                                                    <span className="font-bold text-slate-400 uppercase tracking-wider block mb-1">Purpose / Request Notes</span>
                                                    <p className="text-slate-800 font-semibold">{requestData.purpose || requestData.otherPurpose || 'Official issuance for employment / higher education.'}</p>
                                                </div>
                                            </div>
                                        </div>

                                        {/* ========================================================= */}
                                        {/* PAYMENT STATUS CARD (ACCOUNTING DEPARTMENT - READ-ONLY) */}
                                        {/* ========================================================= */}
                                        <div className="border border-slate-200/90 rounded-2xl overflow-hidden shadow-2xs bg-white">
                                            <div className="bg-slate-50/80 px-5 py-3.5 border-b border-slate-200 flex items-center justify-between gap-3 flex-wrap">
                                                <div className="flex items-center gap-2.5">
                                                    <div className="w-7 h-7 rounded-lg bg-blue-100 text-blue-700 flex items-center justify-center font-bold">
                                                        <CreditCard size={15} />
                                                    </div>
                                                    <div>
                                                        <h3 className="font-bold text-slate-900 text-sm">Payment Verification Status</h3>
                                                        <span className="text-[10px] text-slate-400 font-semibold block">Managed by Accounting Department</span>
                                                    </div>
                                                </div>

                                                <div className="flex items-center gap-2">
                                                    {isPaymentCleared ? (
                                                        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-extrabold uppercase tracking-wider bg-emerald-100 text-emerald-800 border border-emerald-300 shadow-2xs">
                                                            <CheckCircle2 size={13} className="text-emerald-600" />
                                                            <span>Payment Verified</span>
                                                        </span>
                                                    ) : isPaymentRejected ? (
                                                        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-extrabold uppercase tracking-wider bg-red-100 text-red-800 border border-red-300">
                                                            <XCircle size={13} className="text-red-600" />
                                                            <span>Payment Rejected</span>
                                                        </span>
                                                    ) : paymentTx?.status === 'Needs Update' ? (
                                                        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-extrabold uppercase tracking-wider bg-amber-100 text-amber-800 border border-amber-300">
                                                            <AlertCircle size={13} className="text-amber-600" />
                                                            <span>Needs Update</span>
                                                        </span>
                                                    ) : (
                                                        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-extrabold uppercase tracking-wider bg-blue-100 text-blue-800 border border-blue-300">
                                                            <Clock size={13} className="text-blue-600" />
                                                            <span>Awaiting Accounting</span>
                                                        </span>
                                                    )}

                                                    {/* In Registrar view, this is strictly Read-Only */}
                                                    <span className="px-2 py-0.5 bg-slate-200/80 text-slate-600 rounded-md text-[10px] font-extrabold uppercase tracking-wider">
                                                        Read-Only
                                                    </span>
                                                </div>
                                            </div>

                                            {paymentTx ? (
                                                <div className="p-5 space-y-4">
                                                    {/* Dynamic State Banner */}
                                                    {isPaymentCleared ? (
                                                        <div className="bg-emerald-50/90 border border-emerald-200 rounded-xl p-4 flex items-start gap-3.5 text-emerald-900 animate-in fade-in duration-200">
                                                            <div className="w-8 h-8 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0 mt-0.5">
                                                                <CheckCircle2 size={18} />
                                                            </div>
                                                            <div className="space-y-0.5 flex-1">
                                                                <div className="flex items-center justify-between gap-2 flex-wrap">
                                                                    <h4 className="font-extrabold text-sm text-emerald-950">Payment Verified by Accounting</h4>
                                                                    {paymentTx.verifiedAt && (
                                                                        <span className="text-[11px] font-medium text-emerald-700">
                                                                            Verified on {new Date(paymentTx.verifiedAt).toLocaleString()}
                                                                        </span>
                                                                    )}
                                                                </div>
                                                                <p className="text-xs text-emerald-800 leading-relaxed">
                                                                    The Accounting department has confirmed and approved the student&apos;s payment receipt. The document request is cleared for scheduling and approval below.
                                                                </p>
                                                            </div>
                                                        </div>
                                                    ) : isPaymentRejected ? (
                                                        <div className="bg-rose-50 border border-rose-200 rounded-xl p-4 flex items-start gap-3 text-rose-900">
                                                            <div className="w-8 h-8 rounded-full bg-rose-100 text-rose-700 flex items-center justify-center shrink-0 mt-0.5">
                                                                <XCircle size={18} />
                                                            </div>
                                                            <div className="space-y-1 flex-1">
                                                                <h4 className="font-extrabold text-sm text-rose-950">Payment Rejected by Accounting</h4>
                                                                <p className="text-xs text-rose-800 leading-relaxed">
                                                                    Accounting has reviewed the payment receipt and marked it as rejected: {paymentTx.adminRemarks ? `&quot;${paymentTx.adminRemarks}&quot;` : 'Invalid or unverified proof of payment'}. This document request cannot be approved.
                                                                </p>
                                                            </div>
                                                        </div>
                                                    ) : paymentTx.status === 'Needs Update' ? (
                                                        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex items-start gap-3 text-amber-900">
                                                            <div className="w-8 h-8 rounded-full bg-amber-100 text-amber-700 flex items-center justify-center shrink-0 mt-0.5">
                                                                <AlertCircle size={18} />
                                                            </div>
                                                            <div className="space-y-1 flex-1">
                                                                <h4 className="font-extrabold text-sm text-amber-950">Receipt Needs Update (Accounting Pending)</h4>
                                                                <p className="text-xs text-amber-800 leading-relaxed">
                                                                    Accounting notified the student to upload a clearer copy of their receipt. Once the updated receipt is uploaded and verified by Accounting, this request will unlock.
                                                                </p>
                                                            </div>
                                                        </div>
                                                    ) : (
                                                        <div className="bg-blue-50/80 border border-blue-200 rounded-xl p-4 flex items-start gap-3 text-blue-900">
                                                            <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center shrink-0 mt-0.5">
                                                                <Clock size={18} />
                                                            </div>
                                                            <div className="space-y-1 flex-1">
                                                                <h4 className="font-extrabold text-sm text-blue-950">Awaiting Accounting Payment Verification</h4>
                                                                <p className="text-xs text-blue-800 leading-relaxed">
                                                                    The student has submitted payment, but it is currently under review by the Accounting department. In accordance with the role separation policy, Registrar staff do not verify payments. This view will dynamically update to &apos;Payment Verified&apos; once Accounting completes verification.
                                                                </p>
                                                            </div>
                                                        </div>
                                                    )}

                                                    {/* Payment Details Meta Grid */}
                                                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                                                        <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
                                                            <p className="text-[10.5px] font-bold text-slate-400 uppercase tracking-wider mb-0.5">Payment Method &amp; Amount</p>
                                                            <p className="font-bold text-slate-900 text-sm">{paymentTx.paymentMode || 'Payment'} — ₱{Number(paymentTx.amount || 0).toLocaleString('en-PH', { minimumFractionDigits: 2 })}</p>
                                                        </div>
                                                        <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
                                                            <p className="text-[10.5px] font-bold text-slate-400 uppercase tracking-wider mb-0.5">Transaction Ref #</p>
                                                            <p className="font-mono font-bold text-slate-900 text-sm truncate" title={paymentTx.transactionId}>{paymentTx.transactionId || 'N/A'}</p>
                                                        </div>
                                                        <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
                                                            <p className="text-[10.5px] font-bold text-slate-400 uppercase tracking-wider mb-0.5">Payer Details</p>
                                                            <p className="font-bold text-slate-900 text-sm truncate" title={paymentTx.payerEmail}>{paymentTx.payerName || requestData.name} ({paymentTx.payerEmail || requestData.email || 'N/A'})</p>
                                                        </div>
                                                    </div>

                                                    {/* Uploaded Receipt Preview (Read-Only) */}
                                                    {(paymentTx.imageUrl || paymentTx.receiptImage) && (
                                                        <div className="pt-1">
                                                            <div className="flex items-center justify-between mb-2">
                                                                <span className="text-xs font-bold text-slate-600 flex items-center gap-1.5">
                                                                    <FileSearch size={14} className="text-slate-400" />
                                                                    <span>Uploaded Proof of Payment (Read-Only Inspection)</span>
                                                                </span>
                                                                <button
                                                                    type="button"
                                                                    onClick={() => window.open((paymentTx.imageUrl || paymentTx.receiptImage).startsWith('http') ? (paymentTx.imageUrl || paymentTx.receiptImage) : `${API_BASE}${paymentTx.receiptImage}`, '_blank')}
                                                                    className="text-xs font-bold text-blue-600 hover:text-blue-800 flex items-center gap-1 cursor-pointer"
                                                                >
                                                                    <Eye size={12} />
                                                                    <span>Open Full Receipt</span>
                                                                </button>
                                                            </div>
                                                            <div className="bg-slate-100/70 rounded-xl p-2.5 h-48 flex items-center justify-center border border-slate-200 overflow-hidden">
                                                                <img
                                                                    src={(paymentTx.imageUrl || paymentTx.receiptImage).startsWith('http') ? (paymentTx.imageUrl || paymentTx.receiptImage) : `${API_BASE}${paymentTx.receiptImage}`}
                                                                    alt="Payment Receipt"
                                                                    className="max-h-full max-w-full object-contain rounded-lg hover:scale-105 transition-transform cursor-pointer"
                                                                    onClick={() => window.open((paymentTx.imageUrl || paymentTx.receiptImage).startsWith('http') ? (paymentTx.imageUrl || paymentTx.receiptImage) : `${API_BASE}${paymentTx.receiptImage}`, '_blank')}
                                                                    title="Click to view full image in new tab"
                                                                />
                                                            </div>
                                                        </div>
                                                    )}

                                                    {/* Accounting Staff / Super Admin verification control ONLY if user is Accounting/SuperAdmin and NOT Registrar */}
                                                    {canVerifyPayment && !isRegistrar && (
                                                        <div className="pt-2 border-t border-slate-200/80">
                                                            {!isEditingPayment && (paymentTx.status === 'Pending Verification' || paymentTx.status === 'Needs Update') ? (
                                                                <div className="p-3.5 bg-blue-50/50 rounded-xl border border-blue-200 flex items-center justify-between gap-3">
                                                                    <span className="text-xs text-blue-900 font-semibold">
                                                                        You are signed in as Accounting / Administrator. You may verify this payment directly.
                                                                    </span>
                                                                    <button
                                                                        type="button"
                                                                        onClick={() => setIsEditingPayment(true)}
                                                                        className="px-3.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold transition-all shadow-xs cursor-pointer"
                                                                    >
                                                                        Verify Payment Now
                                                                    </button>
                                                                </div>
                                                            ) : isEditingPayment ? (
                                                                <div className="p-4 bg-slate-50 rounded-xl space-y-3 border border-slate-200">
                                                                    <div className="flex items-center justify-between">
                                                                        <span className="text-xs font-bold text-slate-800">
                                                                            Accounting Payment Verification Action
                                                                        </span>
                                                                        <button
                                                                            type="button"
                                                                            onClick={() => setIsEditingPayment(false)}
                                                                            className="text-xs text-slate-500 hover:text-slate-700 font-semibold cursor-pointer"
                                                                        >
                                                                            Cancel
                                                                        </button>
                                                                    </div>
                                                                    <div className="flex flex-col sm:flex-row gap-3">
                                                                        <select
                                                                            className="flex-1 py-2 px-3 border border-slate-200 rounded-xl outline-none focus:border-blue-500 text-xs font-bold text-slate-700 bg-white"
                                                                            value={paymentAction}
                                                                            onChange={(e) => setPaymentAction(e.target.value)}
                                                                            disabled={actionLoading}
                                                                        >
                                                                            <option value="Completed">Approve Payment (Receipt Valid)</option>
                                                                            <option value="Needs Update">Needs Update (Blurry / Incomplete Receipt)</option>
                                                                            <option value="Rejected">Reject Completely (Invalid / Fraudulent Receipt)</option>
                                                                        </select>
                                                                        <button
                                                                            className={`text-white py-2 px-5 rounded-xl font-bold text-xs transition-all shadow-sm cursor-pointer shrink-0 ${
                                                                                paymentAction === 'Completed' ? 'bg-emerald-600 hover:bg-emerald-700' : 'bg-red-600 hover:bg-red-700'
                                                                            }`}
                                                                            onClick={() => showConfirm({
                                                                                title: 'Confirm Payment Verification',
                                                                                message: `Are you sure you want to mark this payment as "${paymentAction}"?`,
                                                                                type: paymentAction === 'Completed' ? 'info' : 'warning',
                                                                                onConfirm: () => handleVerifyPayment(paymentAction)
                                                                            })}
                                                                            disabled={actionLoading}
                                                                        >
                                                                            {actionLoading ? 'Processing...' : 'Confirm Action'}
                                                                        </button>
                                                                    </div>
                                                                    {paymentAction !== 'Completed' && (
                                                                        <input
                                                                            type="text"
                                                                            placeholder="Payment remarks (optional)..."
                                                                            value={paymentRemarks}
                                                                            onChange={(e) => setPaymentRemarks(e.target.value)}
                                                                            className="w-full py-1.5 px-3 border border-slate-200 rounded-xl text-xs outline-none focus:border-blue-400 bg-white"
                                                                            disabled={actionLoading}
                                                                        />
                                                                    )}
                                                                </div>
                                                            ) : null}
                                                        </div>
                                                    )}
                                                </div>
                                            ) : (
                                                <div className="p-6 text-center text-amber-700 bg-amber-50 text-xs font-bold">
                                                    <AlertCircle className="inline mr-2" size={16} /> No payment transaction recorded for this request.
                                                </div>
                                            )}
                                        </div>

                                        {/* ========================================================= */}
                                        {/* ESTIMATED PROCESSING WINDOW (DATE RANGE PICKER) */}
                                        {/* ========================================================= */}
                                        <div className="border border-blue-200/80 rounded-2xl overflow-hidden shadow-2xs bg-white">
                                            <div className="bg-gradient-to-r from-blue-50/90 to-indigo-50/50 px-5 py-3.5 border-b border-blue-100 flex items-center justify-between gap-3 flex-wrap">
                                                <div className="flex items-center gap-2.5">
                                                    <div className="w-7 h-7 rounded-lg bg-blue-600 text-white flex items-center justify-center font-bold shadow-2xs">
                                                        <Calendar size={15} />
                                                    </div>
                                                    <div>
                                                        <h3 className="font-bold text-slate-900 text-sm">Estimated Processing Schedule</h3>
                                                    </div>
                                                </div>

                                                {processingWindow.startDate && processingWindow.endDate && (
                                                    <div className="flex items-center gap-2">
                                                        <span className="px-3 py-1 bg-white text-blue-900 rounded-full text-xs font-extrabold border border-blue-200 shadow-2xs flex items-center gap-1.5">
                                                            <Calendar size={12} className="text-blue-600" />
                                                            <span>{processingWindow.startDate} to {processingWindow.endDate}</span>
                                                        </span>
                                                    </div>
                                                )}
                                            </div>

                                            <div className="p-5 sm:p-6 space-y-4">

                                                {/* Date Range Picker Component */}
                                                <DateRangePicker
                                                    startDate={processingWindow.startDate}
                                                    endDate={processingWindow.endDate}
                                                    onChange={({ startDate, endDate }) => setProcessingWindow({ startDate, endDate })}
                                                    isReadOnly={status === 'Rejected' || !hasProcessingAccess}
                                                    minDate={new Date().toISOString().split('T')[0]}
                                                />

                                                {/* In Process: Allow updating processing schedule */}
                                                {status === 'In Process' && hasProcessingAccess && (
                                                    <div className="flex items-center justify-between gap-3 pt-3 border-t border-slate-100 flex-wrap">
                                                        <span className="text-xs text-slate-500 font-medium">
                                                            Need to adjust the processing schedule? Pick new dates above and save.
                                                        </span>
                                                        <button
                                                            type="button"
                                                            onClick={handleSaveProcessingWindow}
                                                            disabled={actionLoading}
                                                            className="bg-[#2c3543] hover:bg-[#1f2631] text-white font-bold text-xs px-5 py-2 rounded-full border-t border-t-white/20 border-b-2 border-b-black/50 shadow-sm cursor-pointer disabled:opacity-50 transition-all"
                                                        >
                                                            {actionLoading ? 'Saving...' : 'Save Updated Schedule'}
                                                        </button>
                                                    </div>
                                                )}
                                            </div>
                                        </div>

                                        {/* ========================================================= */}
                                        {/* DOCUMENT REQUEST DECISION & NEXT ACTION */}
                                        {/* ========================================================= */}
                                        <div className="border border-slate-200/90 rounded-2xl overflow-hidden shadow-2xs bg-white">
                                            <div className="bg-slate-50/80 px-5 py-3.5 border-b border-slate-200 flex items-center justify-between gap-3">
                                                <h3 className="font-bold text-slate-900 text-sm">Document Request Decision</h3>
                                                <span className="text-xs font-bold text-slate-500">
                                                    Status: <strong className="text-slate-800">{status}</strong>
                                                </span>
                                            </div>

                                            <div className="p-5 space-y-4">
                                                {/* When Pending & Payment Cleared */}
                                                {status === 'Pending' && isPaymentCleared && (
                                                    hasProcessingAccess ? (
                                                        <div className="space-y-4">
                                                            {!showRejectForm ? (
                                                                <div>
                                                                    <div className="bg-emerald-50/70 p-3.5 rounded-xl border border-emerald-200 text-xs text-emerald-900 font-medium mb-4 flex items-center gap-2.5">
                                                                        <CheckCircle2 size={16} className="text-emerald-600 shrink-0" />
                                                                        <span>
                                                                            Payment is verified by Accounting. The processing schedule is configured above ({processingWindow.startDate || 'Start'} to {processingWindow.endDate || 'End'}). Click below to approve the request and proceed to document preparation.
                                                                        </span>
                                                                    </div>
                                                                    <div className="flex items-center gap-3 flex-wrap">
                                                                        <button
                                                                            className="bg-[#2c3543] hover:bg-[#1f2631] text-white font-bold text-xs px-6 py-2.5 rounded-full border-t border-t-white/20 border-b-2 border-b-black/50 shadow-[0_2px_5px_rgba(0,0,0,0.2)] hover:-translate-y-0.5 active:translate-y-0.5 active:border-b-0 transition-all flex items-center gap-2 cursor-pointer disabled:opacity-50"
                                                                            onClick={handleApproveDocumentRequest}
                                                                            disabled={actionLoading}
                                                                        >
                                                                            <CheckCircle2 size={14} />
                                                                            <span>Approve Document Request &amp; Begin Processing</span>
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
                                                                /* Rejection Form */
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
                                                                        Select the reason and provide remarks for rejecting this document request. The student will receive a notification with this explanation.
                                                                    </p>

                                                                    <div className="space-y-2">
                                                                        {[
                                                                            { id: 'incomplete', label: 'Incomplete Requirements (Missing forms or credentials)' },
                                                                            { id: 'invalid', label: 'Invalid Information (Student data or program mismatch)' },
                                                                            { id: 'unpaid', label: 'Payment Issue' },
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
                                                                            Remarks / Explanation for Student {rejectionReason === 'others' && <span className="text-rose-600">*</span>}
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
                                                                            {actionLoading ? 'Rejecting...' : 'Confirm Document Rejection'}
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
                                                        <div className="p-4 bg-blue-50/70 rounded-xl border border-blue-200 text-xs text-blue-800 font-semibold">
                                                            View-only mode: Authorized staff can approve or reject this request.
                                                        </div>
                                                    )
                                                )}

                                                {/* When Pending & Payment NOT Cleared */}
                                                {status === 'Pending' && !isPaymentCleared && (
                                                    <div className="space-y-4">
                                                        <div className="p-5 bg-amber-50/70 rounded-xl border border-amber-200 space-y-2">
                                                            <div className="flex items-center gap-2.5 text-amber-900 font-bold text-sm">
                                                                <Lock size={18} className="text-amber-600 shrink-0" />
                                                                <span>Document Request Approval Locked</span>
                                                            </div>
                                                            <p className="text-xs text-amber-800 leading-relaxed">
                                                                This document request cannot be approved until Accounting completes payment verification. As soon as Accounting marks this payment as &apos;Completed&apos;, the &apos;Approve Document Request&apos; action will unlock automatically.
                                                            </p>
                                                        </div>

                                                        {/* Still allow rejecting if invalid request */}
                                                        {hasProcessingAccess && (
                                                            <div>
                                                                {!showRejectForm ? (
                                                                    <div className="flex items-center justify-between gap-3 pt-2">
                                                                        <span className="text-xs text-slate-500">
                                                                            Need to decline this request due to invalid student data or policy?
                                                                        </span>
                                                                        <button
                                                                            className="bg-white hover:bg-rose-50 text-rose-700 font-bold text-xs px-4 py-2 rounded-full border border-rose-200 cursor-pointer"
                                                                            onClick={() => {
                                                                                setShowRejectForm(true);
                                                                                setRejectionReason(isPaymentRejected ? 'unpaid' : 'invalid');
                                                                            }}
                                                                        >
                                                                            Reject Document Request
                                                                        </button>
                                                                    </div>
                                                                ) : (
                                                                    /* Rejection Form */
                                                                    <div className="bg-rose-50/60 p-5 rounded-2xl border border-rose-200 space-y-4 animate-in fade-in duration-200">
                                                                        <div className="flex items-center justify-between gap-3">
                                                                            <h4 className="font-bold text-sm text-rose-800">Reject Document Request</h4>
                                                                            <button
                                                                                type="button"
                                                                                onClick={() => setShowRejectForm(false)}
                                                                                className="text-xs font-bold text-slate-500 hover:text-slate-800 cursor-pointer"
                                                                            >
                                                                                Cancel
                                                                            </button>
                                                                        </div>
                                                                        <div className="space-y-2">
                                                                            {[
                                                                                { id: 'unpaid', label: 'Payment Issue (Unpaid or rejected payment)' },
                                                                                { id: 'incomplete', label: 'Incomplete Requirements' },
                                                                                { id: 'invalid', label: 'Invalid Information' },
                                                                                { id: 'others', label: 'Other Reason' }
                                                                            ].map((opt) => (
                                                                                <label
                                                                                    key={opt.id}
                                                                                    className={`flex items-center gap-3 p-3 rounded-xl border cursor-pointer text-xs font-semibold ${
                                                                                        rejectionReason === opt.id ? 'bg-white border-rose-400 text-rose-900' : 'bg-white/70 border-slate-200 text-slate-700'
                                                                                    }`}
                                                                                >
                                                                                    <input
                                                                                        type="radio"
                                                                                        name="rejectionReason"
                                                                                        value={opt.id}
                                                                                        checked={rejectionReason === opt.id}
                                                                                        onChange={(e) => setRejectionReason(e.target.value)}
                                                                                        className="text-rose-600"
                                                                                    />
                                                                                    <span>{opt.label}</span>
                                                                                </label>
                                                                            ))}
                                                                        </div>
                                                                        <textarea
                                                                            className="w-full p-3 border border-slate-200 rounded-xl text-xs outline-none bg-white"
                                                                            rows="2"
                                                                            placeholder="Optional remarks..."
                                                                            value={manualRejectionReason}
                                                                            onChange={(e) => setManualRejectionReason(e.target.value)}
                                                                        ></textarea>
                                                                        <div className="flex items-center gap-2">
                                                                            <button
                                                                                className="bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs px-5 py-2.5 rounded-full shadow-sm cursor-pointer"
                                                                                onClick={handleRejectDocumentRequest}
                                                                                disabled={actionLoading}
                                                                            >
                                                                                {actionLoading ? 'Rejecting...' : 'Confirm Document Rejection'}
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
                                                        )}
                                                    </div>
                                                )}

                                                {/* When In Process */}
                                                {status === 'In Process' && (
                                                    <div className="flex items-center justify-between gap-3 flex-wrap pt-1">
                                                        <div className="flex items-center gap-2 text-emerald-700 text-xs font-bold bg-emerald-50 px-3.5 py-2 rounded-xl border border-emerald-200">
                                                            <CheckCircle2 size={15} className="text-emerald-600" />
                                                            <span>Request Approved &amp; Processing Scheduled ({processingWindow.startDate || 'Start'} to {processingWindow.endDate || 'End'})</span>
                                                        </div>
                                                        {hasProcessingAccess && (
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
                                            </div>
                                        </div>

                                        {/* Super Admin Force Override (Bypass) */}
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
                                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-6">
                                            <div>
                                                <h2 className="text-2xl font-bold text-slate-800">
                                                    {requestData.documentFile ? 'Document Preparation & Verification' : 'Upload External PDF'}
                                                </h2>
                                                <p className="text-slate-500 text-sm mt-1">
                                                    {requestData.documentFile 
                                                        ? 'An official PDF document is already attached to this request. You can keep it as is or upload a new PDF to replace it.'
                                                        : 'Upload the requested document as a PDF. A verification QR code will be automatically embedded.'}
                                                </p>
                                            </div>
                                            {requestData.documentFile && (
                                                <span className="self-start sm:self-auto inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-full text-xs font-bold">
                                                    <CheckCircle2 size={13} className="text-emerald-600" />
                                                    <span>Document Attached</span>
                                                </span>
                                            )}
                                        </div>

                                        {/* Existing Attached Document Card */}
                                        {requestData.documentFile && (
                                            <div className="bg-emerald-50/60 border-2 border-emerald-200/80 rounded-2xl p-6 mb-8">
                                                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                                                    <div className="flex items-start gap-4">
                                                        <div className="w-12 h-12 rounded-xl bg-emerald-600 text-white flex items-center justify-center shrink-0 shadow-sm">
                                                            <FileText size={24} />
                                                        </div>
                                                        <div>
                                                            <div className="flex items-center gap-2 flex-wrap">
                                                                <h3 className="font-extrabold text-slate-800 text-base">Official PDF Document Attached</h3>
                                                                <span className="px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-bold text-[10px] uppercase tracking-wider">
                                                                    Verified & Ready
                                                                </span>
                                                            </div>
                                                            <p className="text-xs text-slate-600 mt-1">
                                                                This document already has a verification QR code embedded and is ready for blockchain recording.
                                                            </p>
                                                            {requestData.documentHash && (
                                                                <p className="text-[11px] font-mono text-slate-500 mt-1.5">
                                                                    <span className="font-bold text-slate-600">Verification Hash:</span> {formatShortId(requestData.documentHash, 'HASH')}
                                                                </p>
                                                            )}
                                                        </div>
                                                    </div>

                                                    <div className="flex items-center gap-2 flex-wrap sm:self-center">
                                                        <button
                                                            type="button"
                                                            onClick={handlePreviewDocument}
                                                            className="bg-white hover:bg-slate-50 text-slate-700 font-bold text-xs px-4 py-2.5 rounded-full border border-slate-200 shadow-2xs hover:-translate-y-0.5 transition-all flex items-center gap-1.5 cursor-pointer"
                                                        >
                                                            <Eye size={14} className="text-slate-500" />
                                                            <span>Preview Attached PDF</span>
                                                        </button>
                                                    </div>
                                                </div>
                                            </div>
                                        )}

                                        {hasProcessingAccess ? (
                                            <div>
                                                {requestData.documentFile && (
                                                    <div className="mb-4 flex items-center justify-between gap-3 flex-wrap">
                                                        <div>
                                                            <h4 className="font-bold text-slate-800 text-sm">Need to Change or Replace the Document?</h4>
                                                            <p className="text-xs text-slate-500">Upload a new PDF file below to replace the existing file and re-embed the QR code.</p>
                                                        </div>
                                                        {uploadedFile && (
                                                            <button
                                                                type="button"
                                                                onClick={() => {
                                                                    setUploadedFile(null);
                                                                    const fileInput = document.getElementById('pdfUpload');
                                                                    if (fileInput) fileInput.value = '';
                                                                }}
                                                                className="text-xs font-bold text-rose-600 hover:text-rose-700 underline cursor-pointer"
                                                            >
                                                                Cancel Replacement
                                                            </button>
                                                        )}
                                                    </div>
                                                )}

                                                <input type="file" id="pdfUpload" className="hidden" accept=".pdf" onChange={handleFileUpload} />
                                                <div
                                                    className={`border-2 border-dashed rounded-2xl text-center mb-6 transition-all group cursor-pointer ${
                                                        uploadedFile
                                                            ? 'border-blue-500 bg-blue-50/60 py-10 px-8'
                                                            : requestData.documentFile
                                                            ? 'border-slate-300 bg-slate-50/70 hover:border-blue-400 hover:bg-blue-50/30 py-10 px-8'
                                                            : 'border-slate-200 bg-slate-50 hover:border-blue-500 hover:bg-blue-50 py-16 px-8'
                                                    }`}
                                                    onClick={() => document.getElementById('pdfUpload').click()}
                                                >
                                                    <Upload size={uploadedFile ? 32 : (requestData.documentFile ? 32 : 40)} className={`mx-auto mb-3 transition-colors ${uploadedFile ? 'text-blue-600' : 'text-slate-400 group-hover:text-blue-600'}`} />
                                                    {uploadedFile ? (
                                                        <div>
                                                            <span className="inline-block px-3 py-1 bg-blue-100 text-blue-800 rounded-full font-bold text-xs mb-1.5">New PDF Selected to Replace</span>
                                                            <p className="text-blue-700 font-extrabold text-sm">{uploadedFile.name}</p>
                                                            <p className="text-xs text-slate-400 mt-1">Click to choose a different file or click Process & Replace below</p>
                                                        </div>
                                                    ) : (
                                                        <div>
                                                            <p className="text-slate-700 font-bold text-sm">
                                                                {requestData.documentFile ? 'Click to browse and choose a replacement PDF' : 'Click to browse for PDF file'}
                                                            </p>
                                                            <p className="text-xs text-slate-400 mt-1">Supported format: PDF only</p>
                                                        </div>
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

                                                    {requestData.documentFile && !uploadedFile ? (
                                                        <button
                                                            className="flex-1 bg-[#2c3543] hover:bg-[#1f2631] text-white py-2.5 px-6 rounded-full font-bold text-xs border-t border-t-white/20 border-b-2 border-b-black/50 shadow-[0_2px_5px_rgba(0,0,0,0.2)] hover:-translate-y-0.5 active:translate-y-0.5 active:border-b-0 transition-all flex items-center justify-center gap-2 cursor-pointer"
                                                            onClick={() => setCurrentStep(3)}
                                                        >
                                                            <span>Keep As Is & Proceed to Step 3</span>
                                                            <ChevronRight size={14} />
                                                        </button>
                                                    ) : (
                                                        <button
                                                            className="flex-1 text-white py-2.5 px-6 rounded-full font-bold text-xs border-t border-t-white/20 border-b-2 border-b-black/50 shadow-[0_2px_5px_rgba(0,0,0,0.2)] hover:-translate-y-0.5 active:translate-y-0.5 active:border-b-0 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 bg-[#2c3543] hover:bg-[#1f2631]"
                                                            disabled={!uploadedFile || actionLoading}
                                                            onClick={processUpload}
                                                        >
                                                            {actionLoading ? 'Uploading & Processing...' : (requestData.documentFile ? 'Process & Replace Document' : 'Process Document')}
                                                        </button>
                                                    )}
                                                </div>
                                            </div>
                                        ) : (
                                            <div className="space-y-6">
                                                <div className="border-2 border-dashed border-slate-200 bg-slate-50/70 rounded-2xl py-14 px-8 text-center">
                                                    <Upload size={36} className="mx-auto mb-3 text-slate-300" />
                                                    <p className="text-slate-700 font-bold text-sm">
                                                        {requestData.documentFile ? 'Official Document Attached' : 'No Official Document Uploaded Yet'}
                                                    </p>
                                                    <p className="text-slate-400 text-xs mt-1 max-w-md mx-auto">
                                                        View-Only View: Only authorized staff or administrators can upload and process the official PDF document for this request.
                                                    </p>
                                                </div>
                                                {requestData.documentFile && (
                                                    <div className="flex justify-center">
                                                        <button
                                                            type="button"
                                                            onClick={handlePreviewDocument}
                                                            className="bg-[#2c3543] hover:bg-[#1f2631] text-white px-6 py-2.5 rounded-full font-bold text-xs flex items-center gap-2 shadow-xs transition-all cursor-pointer"
                                                        >
                                                            <Eye size={14} />
                                                            <span>Preview Attached Document</span>
                                                        </button>
                                                    </div>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                )}

                                {/* Step 2 Content — Non-Blockchain: Direct Finalize & Release (No Upload Required) */}
                                {currentStep === 2 && !isBlockchainEligible && status !== 'Released' && (
                                    <div className="bg-white p-8 rounded-2xl shadow-sm border border-slate-100 animate-in fade-in slide-in-from-right-4 duration-300">
                                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
                                            <div>
                                                <h2 className="text-2xl font-bold text-slate-800">Finalize & Release Document</h2>
                                                <p className="text-slate-500 text-sm mt-1">Review request details and approve release for the student. No document upload is required for this standard document.</p>
                                            </div>
                                            <span className="self-start sm:self-auto px-3.5 py-1 bg-slate-100 text-slate-600 rounded-full text-xs font-bold uppercase tracking-wider whitespace-nowrap shrink-0">
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

                                        {hasProcessingAccess ? (
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
                                                    <span>Document request is ready for final release. Awaiting staff release.</span>
                                                </div>
                                                <span className="px-2.5 py-1 rounded-full bg-blue-100 text-blue-800 font-bold uppercase text-[10px] tracking-wider">
                                                    Awaiting Release
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

                                                <div className="grid grid-cols-2 gap-6 mb-8">
                                                    <div className="col-span-2">
                                                        <div className="flex items-center justify-between mb-2">
                                                            <label className="block text-xs font-bold text-slate-500 uppercase">Owner Type</label>
                                                            <span className="text-[11px] font-semibold text-slate-400">Auto-fetched from registered profile</span>
                                                        </div>
                                                        <div className="w-full bg-slate-50 border border-slate-200/90 rounded-xl p-3 flex items-center justify-between">
                                                            <span className="text-sm font-bold text-slate-800">
                                                                {blockchainData.ownerType || 'Student'}
                                                            </span>
                                                            <span className={`px-2.5 py-0.5 rounded-full text-[10.5px] font-extrabold uppercase tracking-wider ${
                                                                blockchainData.ownerType === 'Alumni'
                                                                    ? 'bg-amber-100 text-amber-800 border border-amber-200/60'
                                                                    : blockchainData.ownerType === 'Former Student'
                                                                    ? 'bg-purple-100 text-purple-800 border border-purple-200/60'
                                                                    : 'bg-blue-100 text-blue-800 border border-blue-200/60'
                                                            }`}>
                                                                {blockchainData.ownerType || 'Student'} Profile
                                                            </span>
                                                        </div>
                                                    </div>
                                                    <div>
                                                        <div className="flex items-center justify-between mb-2">
                                                            <label className="block text-xs font-bold text-slate-500 uppercase">ID Number *</label>
                                                            {blockchainData.studentIDNumber ? (
                                                                <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200/60">
                                                                    Auto-filled &bull; Editable
                                                                </span>
                                                            ) : (
                                                                <span className="text-[10px] font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200/60">
                                                                    ID Missing on File
                                                                </span>
                                                            )}
                                                        </div>
                                                        <input
                                                            type="text"
                                                            required
                                                            placeholder="Enter or override Student ID (e.g. 2023-001)"
                                                            value={blockchainData.studentIDNumber}
                                                            onChange={(e) => setBlockchainData({ ...blockchainData, studentIDNumber: e.target.value })}
                                                            disabled={!hasProcessingAccess}
                                                            className={`w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-sm outline-none ${!hasProcessingAccess ? 'opacity-75 cursor-not-allowed' : 'focus:border-blue-500'}`}
                                                        />
                                                        {!blockchainData.studentIDNumber && (
                                                            <p className="text-[11px] text-amber-600 font-medium mt-1">
                                                                No ID on account profile. Please enter the verified ID number to proceed.
                                                            </p>
                                                        )}
                                                    </div>

                                                    {blockchainData.ownerType === 'Alumni' ? (
                                                        <div>
                                                            <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Year Graduated *</label>
                                                            <input
                                                                type="number"
                                                                required
                                                                value={blockchainData.yearGraduated}
                                                                onChange={(e) => setBlockchainData({ ...blockchainData, yearGraduated: e.target.value })}
                                                                disabled={!hasProcessingAccess}
                                                                className={`w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-sm outline-none ${!hasProcessingAccess ? 'opacity-75 cursor-not-allowed' : 'focus:border-blue-500'}`}
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
                                                                    disabled={!hasProcessingAccess}
                                                                    className={`w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-sm outline-none ${!hasProcessingAccess ? 'opacity-75 cursor-not-allowed' : 'focus:border-blue-500'}`}
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
                                                                    disabled={!hasProcessingAccess}
                                                                    className={`w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-sm outline-none ${!hasProcessingAccess ? 'opacity-75 cursor-not-allowed' : 'focus:border-blue-500'}`}
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
                                                            disabled={!hasProcessingAccess}
                                                            className={`w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-sm outline-none ${!hasProcessingAccess ? 'opacity-75 cursor-not-allowed' : 'focus:border-blue-500'}`}
                                                        />
                                                    </div>
                                                </div>
                                            </div>

                                        {hasProcessingAccess ? (
                                            <div className="flex items-center gap-3 pt-6 border-t border-slate-100">
                                                <button
                                                    className="bg-white hover:bg-slate-50 text-slate-700 font-bold text-xs px-6 py-2.5 rounded-full border border-slate-200 shadow-2xs hover:-translate-y-0.5 active:translate-y-0.5 transition-all flex items-center gap-1.5 cursor-pointer"
                                                    onClick={() => setCurrentStep(2)}
                                                >
                                                    <ArrowLeft size={13} />
                                                    <span>Back to Step 2</span>
                                                </button>
                                                <button
                                                    className={`flex-1 text-white py-2.5 px-6 rounded-full font-bold text-xs border-t border-t-white/20 border-b-2 border-b-black/50 shadow-[0_2px_5px_rgba(0,0,0,0.2)] hover:-translate-y-0.5 active:translate-y-0.5 active:border-b-0 transition-all flex items-center justify-center gap-2 cursor-pointer ${
                                                        isBlockchainEligible ? 'bg-[#2c3543] hover:bg-[#1f2631]' : 'bg-emerald-600 hover:bg-emerald-700'
                                                    }`}
                                                    disabled={actionLoading || (isBlockchainEligible && !blockchainData.studentIDNumber?.trim())}
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
                                                    <span>Document is ready for blockchain recording. Awaiting staff recording.</span>
                                                </div>
                                                <span className="px-2.5 py-1 rounded-full bg-blue-100 text-blue-800 font-bold uppercase text-[10px] tracking-wider">
                                                    Awaiting Recording
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
                                                <>
                                                    <button
                                                        type="button"
                                                        onClick={handlePreviewDocument}
                                                        className="bg-white hover:bg-slate-50 text-slate-700 px-6 py-2.5 rounded-full font-bold text-xs flex items-center gap-2 border border-slate-200 shadow-2xs hover:-translate-y-0.5 active:translate-y-0.5 transition-all cursor-pointer"
                                                    >
                                                        <Eye size={14} className="text-slate-500" />
                                                        <span>Preview Official Document</span>
                                                    </button>
                                                    <button
                                                        type="button"
                                                        onClick={handleDownloadDocument}
                                                        className="bg-emerald-600 hover:bg-emerald-700 text-white px-6 py-2.5 rounded-full font-bold text-xs flex items-center gap-2 shadow-xs hover:-translate-y-0.5 active:translate-y-0.5 transition-all cursor-pointer"
                                                    >
                                                        <Download size={14} /> 
                                                        <span>Download Official Soft Copy</span>
                                                    </button>
                                                </>
                                            )}
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
                                                    <AlertCircle size={16} /> Super Admin: Revert to &quot;In Process&quot;
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
                                        { step: 1, label: 'Step 1: Review & Schedule' },
                                        { step: 2, label: 'Step 2: Upload Document' },
                                        { step: 3, label: 'Step 3: Secure Blockchain' },
                                        { step: 4, label: 'Step 4: Release & Pickup' }
                                    ] : [
                                        { step: 1, label: 'Step 1: Review & Schedule' },
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