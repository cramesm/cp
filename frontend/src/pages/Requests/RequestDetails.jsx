import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Info, Plus, CheckCircle2, Circle, Clock, FileText, Send, ShieldCheck, ChevronRight, AlertCircle, FileSearch, Trash2, Printer, ExternalLink, Key, Receipt, QrCode, X } from 'lucide-react';
import Layout from '../../components/Layout';
import ConfirmModal from '../../components/ConfirmModal';
import api from '../../api';
import QRCode from 'react-qr-code'; // Assuming react-qr-code is installed or we can just render a placeholder/img if not. We can use a simple generic icon if the library isn't there, but usually it's standard. Wait, to be safe from missing dependencies, I'll use an img tag to a public QR code generator API.

const API_BASE = (import.meta.env.VITE_API_URL ? import.meta.env.VITE_API_URL.replace('/api', '') : '') || 'http://127.0.0.1:5000';

const RequestDetails = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [requestData, setRequestData] = useState(null);
    const [paymentTx, setPaymentTx] = useState(null);
    const [loading, setLoading] = useState(true);

    // Status and Step tracking
    const [actionLoading, setActionLoading] = useState(false);
    const [activeModal, setActiveModal] = useState(null); // 'process', 'reject', 'verify_payment'
    const [processingStep, setProcessingStep] = useState(1); // 1: Verify, 2: Upload, 3: Secure, 4: Release
    const [uploadedFiles, setUploadedFiles] = useState([]);
    const [rejectionReason, setRejectionReason] = useState('');
    const [confirmConfig, setConfirmConfig] = useState(null);
    const [result, setResult] = useState(null);
    const [showBlockchainResult, setShowBlockchainResult] = useState(false);

    // Blockchain Form State (for Step 3)
    const [blockchainData, setBlockchainData] = useState({
        studentSONumber: "",
        nameOfSchool: "VeriFitor University",
        yearGraduated: new Date().getFullYear(),
    });



    const showConfirm = ({ title, message, onConfirm, type = 'info', confirmText = 'Confirm', cancelText = 'Cancel' }) => {
        setConfirmConfig({
            title,
            message,
            onConfirm: async () => {
                setConfirmConfig(prev => ({ ...prev, isLoading: true }));
                try {
                    await onConfirm();
                } catch (err) {
                    console.error(err);
                } finally {
                    setConfirmConfig(null);
                }
            },
            type,
            confirmText,
            cancelText,
            isLoading: false
        });
    };



    const fetchData = async () => {
        try {
            const res = await api.get('/requests');
            const found = res.data.find(r => r.requestId === id);

            if (found) {
                setRequestData(found);
            } else {
                setRequestData({
                    requestId: id,
                    name: 'Guest User',
                    status: 'Pending',
                    dateRequested: new Date().toISOString()
                });
            }

            // Fetch transaction
            try {
                const txRes = await api.get('/transactions');
                const foundTx = txRes.data.find(t => t.requestId === id);
                if (foundTx) setPaymentTx(foundTx);
            } catch (txErr) {
                console.error("Failed to fetch transactions", txErr);
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
            await api.put(`/requests/${id}`, { status: newStatus });
            await fetchData();
            if (newStatus === 'Rejected') {
                closeModal();
            }
        } catch (err) {
            alert(err.response?.data?.message || 'Update failed');
        } finally {
            setActionLoading(false);
        }
    };

    const handleSecureDocument = async () => {
        setActionLoading(true);

        const docType = (
            requestData.documentType ||
            requestData.document_type ||
            ''
        ).toLowerCase();

        const isBlockchainEligible =
            docType.includes('transcript') ||
            docType.includes('tor') ||
            docType.includes('diploma');

        try {

            if (isBlockchainEligible) {
                const blockchainRes = await api.post(
                    '/blockchain/transactions',
                    {
                        nameOfStudent: requestData.name || "Unknown",
                        studentSONumber: blockchainData.studentSONumber,
                        typeOfDocument:
                            requestData.documentType ||
                            requestData.document_type ||
                            "Document",

                        nameOfSchool:
                            blockchainData.nameOfSchool,

                        yearGraduated:
                            Number(blockchainData.yearGraduated)
                    }
                );

                await api.post(`/requests/${id}/generate-hash`);

                const blockchainResult = {
                    referenceNumber:
                        blockchainRes.data.referenceNumber ||
                        `TXN-${Date.now()}`,

                    studentName:
                        requestData.name,

                    studentSONumber:
                        blockchainData.studentSONumber,

                    documentType:
                        requestData.documentType ||
                        requestData.document_type,

                    school:
                        blockchainData.nameOfSchool,

                    yearGraduated:
                        blockchainData.yearGraduated,

                    recordedBy:
                        blockchainRes.data.recordedBy ||
                        blockchainRes.data.walletAddress ||
                        "0x1702e1Ca825ba2FB91C7D72015e98D9F63bca91",

                    blockchainTimestamp:
                        blockchainRes.data.timestamp ||
                        new Date().toLocaleString(),

                    transactionHash:
                        blockchainRes.data.blockchainTxHash ||
                        blockchainRes.data.transactionHash,

                    blockchainStatus: "Recorded"
                };

                setResult(blockchainResult);

                setShowBlockchainResult(true);

                await api.put(`/requests/${id}`, {
                    status: "Approved"
                });

                fetchData();
            }


            await handleStatusUpdate('Approved');
            setProcessingStep(4);
        } catch (err) {
            alert(
                err.response?.data?.message ||
                'Failed to secure document.'
            );
        } finally {
            setActionLoading(false);
        }
    };



    const handleRelease = async () => {
        await handleStatusUpdate('Released');
        closeModal();
    };

    const handleVerifyPayment = async (status) => {
        if (!paymentTx) return;
        setActionLoading(true);
        try {
            await api.put(`/transactions/${paymentTx.transactionId}/verify`, {
                status: status,
                adminRemarks: status === 'Needs Update' ? 'Receipt is unreadable or invalid.' : 'Verified'
            });
            await fetchData();
            closeModal();
        } catch (err) {
            alert('Failed to verify payment.');
        } finally {
            setActionLoading(false);
        }
    };

    const openProcessModal = () => {
        setActiveModal('process');
        const s = requestData?.status?.toLowerCase();
        if (s === 'pending') setProcessingStep(1);
        else if (s === 'in process') setProcessingStep(2);
        else if (s === 'approved') setProcessingStep(4);
    };

    const closeModal = () => {
        setActiveModal(null);
    };

    const handleFileUpload = (e) => {
        const files = Array.from(e.target.files);
        setUploadedFiles(files);
    };

    if (loading) {
        return <Layout><div className="p-5">Loading Request Details...</div></Layout>;
    }

    if (!requestData) {
        return <Layout><div className="p-5 text-red-500">Request not found.</div></Layout>;
    }

    const { name, status, dateRequested, documentHash, documentType, document_type, purpose } = requestData;
    const docTypeRaw = documentType || document_type || 'Transcript of Records';
    const isBlockchainEligible = docTypeRaw.toLowerCase().includes('transcript') || docTypeRaw.toLowerCase().includes('tor') || docTypeRaw.toLowerCase().includes('diploma');

    const baseSteps = [
        { id: 'Pending', label: 'Received', icon: Clock },
        { id: 'In Process', label: 'Processing', icon: FileSearch }
    ];

    if (isBlockchainEligible) {
        baseSteps.push({ id: 'Approved', label: 'Secured', icon: ShieldCheck });
    }

    baseSteps.push({ id: 'Released', label: 'Released', icon: Send });
    const steps = baseSteps;

    let currentStepIndex = steps.findIndex(s => s.id.toLowerCase() === status.toLowerCase());
    if (currentStepIndex === -1) {
        currentStepIndex = 1; // Fallback to Processing if status mismatches
    }
    const isRejected = status.toLowerCase() === 'rejected';

    const isPaymentCleared = !paymentTx || paymentTx.status === 'Completed';

    const userRole = localStorage.getItem('userRole');
    const isSuperAdmin = userRole === 'super admin';

    return (
        <Layout>
            <div className="p-8 bg-[#f8fafc] min-h-screen">



                {/* Header (No Print) */}
                <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 mb-8 bg-white p-6 rounded-2xl shadow-sm border border-slate-100 print:hidden">
                    <div>
                        <div className="flex items-center gap-3 mb-1">
                            <h1 className="text-2xl font-bold text-slate-800 tracking-tight">Request #{id}</h1>
                            {isRejected && <span className="bg-red-50 text-red-600 text-[10px] font-bold uppercase px-3 py-1 rounded-full border border-red-100 flex items-center gap-1"><AlertCircle size={12} /> Rejected</span>}
                        </div>
                        <p className="text-slate-500 text-sm flex items-center gap-2">
                            <FileText size={14} className="text-slate-400" />
                            {docTypeRaw}
                            <span className="text-slate-300">|</span>
                            Requested on {new Date(dateRequested).toLocaleDateString()}
                        </p>
                    </div>


                </div>

                {/* Progress Stepper */}
                {!isRejected && (
                    <div className="bg-white p-8 rounded-2xl shadow-sm border border-slate-100 mb-8 print:hidden">
                        <div className="relative flex justify-between items-start max-w-4xl mx-auto">
                            <div className="absolute top-5 left-0 w-full h-[2px] bg-slate-100 -z-0"></div>
                            <div
                                className="absolute top-5 left-0 h-[2px] bg-blue-600 transition-all duration-700 -z-0"
                                style={{ width: `${(Math.max(0, currentStepIndex) / (steps.length - 1)) * 100}%` }}
                            ></div>

                            {steps.map((step, index) => {
                                const Icon = step.icon;
                                const isCompleted = index <= currentStepIndex;
                                const isActive = index === currentStepIndex;

                                return (
                                    <div key={step.id} className="relative z-10 flex flex-col items-center group">
                                        <div className={`w-10 h-10 rounded-full flex items-center justify-center transition-all duration-500 ${isCompleted ? 'bg-blue-600 text-white shadow-lg shadow-blue-100' :
                                            'bg-slate-100 text-slate-400 border-4 border-white'
                                            }`}>
                                            {isCompleted ? <CheckCircle2 size={20} /> : <Icon size={20} />}
                                        </div>
                                        <div className="mt-4 text-center">
                                            <p className={`text-xs font-bold uppercase tracking-wider ${isCompleted ? 'text-blue-600' : 'text-slate-400'}`}>{step.label}</p>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                )}

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 print:hidden">
                    {/* Main Details */}
                    <div className="lg:col-span-2 space-y-8">
                        <section className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
                            <div className="p-6 border-b border-slate-50 bg-slate-50/50">
                                <h3 className="text-sm font-bold text-slate-700 uppercase tracking-widest flex items-center gap-2">
                                    <Info size={16} className="text-blue-500" /> Requester Information
                                </h3>
                            </div>
                            <div className="p-8">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                    <div className="space-y-6">
                                        <div>
                                            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-1">Full Name</label>
                                            <p className="text-slate-800 font-semibold text-lg">{name}</p>
                                        </div>
                                        {requestData.studentId && (
                                            <div>
                                                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-1">Student ID</label>
                                                <p className="text-slate-800 font-semibold text-slate-700">{requestData.studentId}</p>
                                            </div>
                                        )}
                                        {requestData.course && (
                                            <div>
                                                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-1">Course & Year Level</label>
                                                <p className="text-slate-800 font-semibold text-slate-700">{requestData.course} {requestData.yearLevel ? `(Year ${requestData.yearLevel})` : ''}</p>
                                            </div>
                                        )}
                                        <div>
                                            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-1">Purpose of Request</label>
                                            <p className="text-slate-700">{purpose || 'General Requirement'}</p>
                                        </div>
                                    </div>
                                    <div className="space-y-6">
                                        <div>
                                            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-1">Document Requested</label>
                                            <p className="text-slate-800 font-semibold">{docTypeRaw}</p>
                                        </div>
                                        <div>
                                            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-1">Blockchain Eligibility</label>
                                            {isBlockchainEligible ? (
                                                <span className="inline-flex items-center gap-1 bg-green-100 text-green-700 px-2 py-1 rounded text-xs font-bold">
                                                    <ShieldCheck size={14} /> Eligible
                                                </span>
                                            ) : (
                                                <span className="inline-flex items-center gap-1 bg-slate-100 text-slate-600 px-2 py-1 rounded text-xs font-bold">
                                                    Standard Document
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </section>
                    </div>

                    {/* Sidebar Actions */}
                    <div className="space-y-6">
                        {/* Payment Verification Card */}
                        {paymentTx && (
                            <section className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
                                <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                                    <Receipt size={14} /> Payment Status
                                </h3>
                                <div className="space-y-3">
                                    <div className="flex justify-between items-center text-sm">
                                        <span className="text-slate-500">Method</span>
                                        <span className="font-bold text-slate-700">{paymentTx.paymentMode}</span>
                                    </div>
                                    <div className="flex justify-between items-center text-sm">
                                        <span className="text-slate-500">Amount</span>
                                        <span className="font-bold text-slate-700">₱{paymentTx.amount}</span>
                                    </div>
                                    <div className="flex justify-between items-center text-sm">
                                        <span className="text-slate-500">Status</span>
                                        <span className={`px-2 py-1 rounded text-[10px] font-bold uppercase ${paymentTx.status === 'Completed' ? 'bg-green-100 text-green-700' :
                                            paymentTx.status === 'Pending Verification' ? 'bg-amber-100 text-amber-700' :
                                                'bg-red-100 text-red-700'
                                            }`}>
                                            {paymentTx.status}
                                        </span>
                                    </div>
                                </div>
                                {paymentTx.status === 'Pending Verification' && (
                                    <button
                                        className="w-full mt-4 bg-amber-500 text-white py-3 rounded-xl font-bold text-sm hover:bg-amber-600 transition-all flex items-center justify-center gap-2 shadow-lg shadow-amber-100"
                                        onClick={() => setActiveModal('verify_payment')}
                                    >
                                        <CheckCircle2 size={16} /> Verify Payment
                                    </button>
                                )}
                            </section>
                        )}

                        <section className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
                            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4">Request Action</h3>

                            {isRejected ? (
                                <div className="p-4 bg-red-50 rounded-xl border border-red-100">
                                    <p className="text-red-700 font-bold text-sm mb-1">Request Rejected</p>
                                    <p className="text-red-600 text-xs italic">"{rejectionReason || 'No reason provided'}"</p>
                                </div>
                            ) : (
                                <div className="space-y-4">
                                    {status !== 'Released' && (
                                        <button
                                            className={`w-full py-4 rounded-xl font-bold text-sm transition-all flex items-center justify-center gap-3 shadow-lg ${isPaymentCleared
                                                ? 'bg-[#2c3e50] text-white hover:bg-[#1a252f] shadow-slate-200'
                                                : 'bg-slate-100 text-slate-400 cursor-not-allowed border border-slate-200'
                                                }`}
                                            onClick={openProcessModal}
                                            disabled={!isPaymentCleared}
                                            title={!isPaymentCleared ? "You must verify the payment first" : ""}
                                        >
                                            {status === 'Pending' ? 'Start Processing' : status === 'In Process' ? 'Continue Processing' : 'Release Document'}
                                        </button>
                                    )}

                                    {!isPaymentCleared && status !== 'Released' && (
                                        <p className="text-[10px] text-amber-600 font-bold text-center flex items-center justify-center gap-1">
                                            <AlertCircle size={12} /> Verify payment above to unlock
                                        </p>
                                    )}

                                    {status === 'Released' && (
                                        <div className="p-4 bg-green-50 rounded-xl border border-green-100 text-center">
                                            <CheckCircle2 size={32} className="text-green-500 mx-auto mb-2" />
                                            <p className="text-green-800 font-bold text-sm">Process Completed</p>
                                            <p className="text-green-600 text-xs mt-1">Document released successfully.</p>
                                        </div>
                                    )}

                                    {status === 'Pending' && (
                                        <div className="pt-4 mt-4 border-t border-slate-50">
                                            <button
                                                className="w-full py-3 text-slate-400 hover:text-red-500 transition-colors text-xs font-bold uppercase tracking-widest flex items-center justify-center gap-2"
                                                onClick={() => setActiveModal('reject')}
                                            >
                                                <Trash2 size={14} /> Reject Request
                                            </button>
                                        </div>
                                    )}
                                </div>
                            )}
                        </section>

                        {isSuperAdmin && (
                            <section className="bg-white p-6 rounded-2xl shadow-sm border border-red-100 bg-red-50/5">
                                <h3 className="text-xs font-bold text-red-500 uppercase tracking-widest mb-4 flex items-center gap-2">
                                    <Key size={14} /> Super Admin Panel
                                </h3>
                                <p className="text-slate-500 text-xs mb-4">
                                    Manipulate request status directly. Reverting the status will reset processing steps.
                                </p>
                                <div className="space-y-3">
                                    <div>
                                        <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Set Status</label>
                                        <select
                                            value={status}
                                            onChange={(e) => {
                                                const newStatus = e.target.value;
                                                showConfirm({
                                                    title: 'Override Request Status',
                                                    message: `Are you sure you want to change the status of this request to "${newStatus}"? This will bypass standard validation steps.`,
                                                    type: 'warning',
                                                    confirmText: 'Override Status',
                                                    onConfirm: () => handleStatusUpdate(newStatus)
                                                });
                                            }}
                                            className="w-full bg-white border border-slate-200 rounded-xl p-3 text-sm font-semibold text-slate-700 focus:border-red-500 outline-none shadow-sm"
                                        >
                                            <option value="Pending">Pending (Received)</option>
                                            <option value="In Process">In Process (Processing)</option>
                                            <option value="Approved">Approved (Secured)</option>
                                            <option value="Released">Released (Released)</option>
                                            <option value="Rejected">Rejected</option>
                                        </select>
                                    </div>

                                    {documentHash && (
                                        <button
                                            className="w-full py-2.5 bg-red-50 text-red-600 hover:bg-red-100 rounded-xl font-bold text-xs transition-all flex items-center justify-center gap-2 border border-red-200"
                                            onClick={() => {
                                                showConfirm({
                                                    title: 'Clear Cryptographic Hash',
                                                    message: 'Are you sure you want to clear the generated cryptographic hash? This is a high-risk action that will invalidate online checks.',
                                                    type: 'danger',
                                                    confirmText: 'Clear Hash',
                                                    onConfirm: async () => {
                                                        setActionLoading(true);
                                                        try {
                                                            await api.put(`/requests/${id}`, { documentHash: "" });
                                                            await fetchData();
                                                        } catch (err) {
                                                            alert("Failed to clear hash.");
                                                        } finally {
                                                            setActionLoading(false);
                                                        }
                                                    }
                                                });
                                            }}
                                            disabled={actionLoading}
                                        >
                                            Clear Cryptographic Hash
                                        </button>
                                    )}
                                </div>
                            </section>
                        )}
                    </div>
                </div>

                {/* Modals */}

                {/* Verify Payment Modal */}
                {activeModal === 'verify_payment' && paymentTx && (
                    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[2000] flex justify-center items-center p-6 animate-in fade-in duration-300 print:hidden">
                        <button
                            onClick={() => {
                                setShowBlockchainResult(false);
                                setProcessingStep(4);
                            }}
                            className="
                                            absolute
                                            top-5
                                            right-5
                                            text-slate-400
                                            hover:text-red-500
                                            "
                        >
                            <X size={22} />
                        </button>
                        <div className="bg-white rounded-3xl p-8 shadow-2xl w-full max-w-lg animate-in zoom-in-95 duration-300">


                            <h3 className="text-2xl font-bold mb-1 text-slate-800">Verify Payment</h3>
                            <p className="text-slate-500 text-sm mb-6">Review the receipt for ₱{paymentTx.amount} via {paymentTx.paymentMode}.</p>

                            <div className="bg-slate-100 rounded-xl p-2 mb-6 h-64 flex items-center justify-center overflow-hidden border border-slate-200">
                                {paymentTx.receiptImage ? (
                                    <img src={`${API_BASE}${paymentTx.receiptImage}`} alt="Receipt" className="max-h-full object-contain" />
                                ) : (
                                    <span className="text-slate-400 font-bold text-sm">No image uploaded</span>
                                )}
                            </div>

                            <div className="flex gap-3">
                                <button
                                    className="flex-[1] py-4 text-red-500 border border-red-200 font-bold text-sm hover:bg-red-50 rounded-2xl transition-all"
                                    onClick={() => {
                                        showConfirm({
                                            title: 'Reject Payment Receipt',
                                            message: 'Are you sure you want to reject this payment receipt? The student will be prompted to upload a new receipt.',
                                            type: 'danger',
                                            confirmText: 'Reject Receipt',
                                            onConfirm: () => handleVerifyPayment('Needs Update')
                                        });
                                    }}
                                    disabled={actionLoading}
                                >
                                    Reject
                                </button>
                                <button
                                    className="flex-[2] bg-green-600 text-white py-4 rounded-2xl font-bold text-sm hover:bg-green-700 transition-all shadow-lg shadow-green-100"
                                    onClick={() => {
                                        showConfirm({
                                            title: 'Approve Payment Receipt',
                                            message: 'Are you sure you want to approve this payment receipt? This will unlock the processing steps for this request.',
                                            type: 'success',
                                            confirmText: 'Approve & Unlock',
                                            onConfirm: () => handleVerifyPayment('Completed')
                                        });
                                    }}
                                    disabled={actionLoading}
                                >
                                    Approve & Unlock
                                </button>
                            </div>
                            <button className="w-full mt-4 py-2 text-slate-400 text-xs font-bold hover:text-slate-600" onClick={closeModal}>Cancel</button>
                        </div>
                    </div>
                )}

                {/* Main Processing Wizard */}
                {activeModal === 'process' && (
                    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[2000] flex justify-center items-center p-6 animate-in fade-in duration-300 print:hidden">
                        <button
                            onClick={closeModal}
                            className="absolute top-5 right-5 text-slate-400 hover:text-red-500 transition">
                            <X size={22} />
                        </button>
                        <div className="bg-white rounded-3xl p-10 shadow-2xl w-full max-w-2xl animate-in zoom-in-95 duration-300">

                            {/* Wizard Header */}
                            <div className="flex items-center justify-between mb-10 px-4">
                                {(isBlockchainEligible ? [1, 2, 3, 4] : [1, 2, 4]).map((s, idx, arr) => (
                                    <React.Fragment key={s}>
                                        <div className={`flex flex-col items-center gap-2 relative`}>
                                            <div className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-black transition-all ${processingStep >= s ? 'bg-blue-600 text-white shadow-lg shadow-blue-100' : 'bg-slate-100 text-slate-400'
                                                }`}>
                                                {processingStep > s ? <CheckCircle2 size={20} /> : (idx + 1)}
                                            </div>
                                            <span className={`text-[10px] font-bold uppercase tracking-widest ${processingStep >= s ? 'text-blue-600' : 'text-slate-300'}`}>
                                                {s === 1 ? 'Verify' : s === 2 ? 'Upload' : s === 3 ? 'Secure' : 'Release'}
                                            </span>
                                        </div>
                                        {idx < arr.length - 1 && <div className={`flex-1 h-[2px] mx-2 ${processingStep > s ? 'bg-blue-600' : 'bg-slate-100'}`}></div>}
                                    </React.Fragment>
                                ))}
                            </div>


                            {/* Step 1: Verify */}
                            {processingStep === 1 && (
                                <div className="animate-in slide-in-from-right-4 duration-300">

                                    <h3 className="text-2xl font-bold mb-2 text-slate-800">Step 1: Verify Information</h3>
                                    <p className="text-slate-500 text-sm mb-8">Confirm student details before preparing documents.</p>

                                    <div className="space-y-4 bg-slate-50 p-6 rounded-2xl border border-slate-100 mb-8">
                                        <div className="flex justify-between border-b border-slate-200 pb-3">
                                            <span className="text-xs text-slate-400 font-bold uppercase">Student Name</span>
                                            <span className="text-sm text-slate-700 font-bold">{name}</span>
                                        </div>
                                        <div className="flex justify-between border-b border-slate-200 pb-3">
                                            <span className="text-xs text-slate-400 font-bold uppercase">Document</span>
                                            <span className="text-sm text-slate-700 font-bold">{docTypeRaw}</span>
                                        </div>
                                    </div>

                                    <div className="flex gap-3">
                                        <button className="flex-1 py-4 text-slate-400 font-bold text-sm hover:bg-slate-50 rounded-2xl transition-all" onClick={closeModal}>Cancel</button>
                                        <button
                                            className="flex-[2] bg-blue-600 text-white py-4 rounded-2xl font-bold text-sm hover:bg-blue-700 transition-all shadow-lg shadow-blue-100"
                                            onClick={async () => {
                                                if (status === 'Pending') {
                                                    showConfirm({
                                                        title: 'Start Processing Request',
                                                        message: 'Are you sure you want to start processing this request? This will mark the status as "In Process" and notify the student.',
                                                        type: 'info',
                                                        confirmText: 'Start Processing',
                                                        onConfirm: async () => {
                                                            await handleStatusUpdate('In Process');
                                                            setProcessingStep(2);
                                                        }
                                                    });
                                                } else {
                                                    setProcessingStep(2);
                                                }
                                            }}
                                            disabled={actionLoading}
                                        >
                                            {actionLoading ? 'Processing...' : 'Looks Good, Continue'}
                                        </button>
                                    </div>
                                </div>
                            )}

                            {/* Step 2: Upload */}
                            {processingStep === 2 && (
                                <div className="animate-in slide-in-from-right-4 duration-300">

                                    <h3 className="text-2xl font-bold mb-2 text-slate-800">Step 2: Attach Documents</h3>

                                    <p className="text-slate-500 text-sm mb-8">Attach the prepared digital copies if necessary.</p>

                                    <input type="file" id="fileInput" className="hidden" accept=".pdf,.jpg,.png" multiple onChange={handleFileUpload} />
                                    <div
                                        className="border-2 border-dashed border-slate-200 bg-slate-50 rounded-3xl py-12 px-8 text-center mb-8 cursor-pointer hover:border-blue-500 hover:bg-blue-50/30 transition-all group"
                                        onClick={() => document.getElementById('fileInput').click()}
                                    >
                                        <Plus size={32} className="mx-auto text-slate-400 mb-4 group-hover:text-blue-600 group-hover:scale-110 transition-all" />
                                        <p className="text-sm text-slate-700 font-bold mb-1">Click to browse files (Optional)</p>
                                    </div>

                                    {uploadedFiles.length > 0 && (
                                        <div className="space-y-2 mb-8 max-h-[150px] overflow-y-auto pr-2 custom-scrollbar border border-slate-100 p-4 rounded-2xl">
                                            {uploadedFiles.map((file, i) => (
                                                <div key={i} className="flex items-center gap-3">
                                                    <FileText className="text-blue-500" size={14} />
                                                    <p className="text-[11px] font-bold text-slate-700 truncate flex-1">{file.name}</p>
                                                </div>
                                            ))}
                                        </div>
                                    )}

                                    <div className="flex gap-3">
                                        <button className="flex-1 py-4 text-slate-400 font-bold text-sm hover:bg-slate-50 rounded-2xl transition-all" onClick={() => setProcessingStep(1)}>Back</button>
                                        <button
                                            className="flex-[2] bg-blue-600 text-white py-4 rounded-2xl font-bold text-sm hover:bg-blue-700 transition-all shadow-lg shadow-blue-100"
                                            onClick={async () => {
                                                if (!isBlockchainEligible) {
                                                    setActionLoading(true);
                                                    try {
                                                        await handleStatusUpdate('Approved');
                                                        setProcessingStep(4);
                                                    } catch (err) {
                                                        alert('Failed to update status.');
                                                    } finally {
                                                        setActionLoading(false);
                                                    }
                                                } else {
                                                    setProcessingStep(3);
                                                }
                                            }}
                                            disabled={actionLoading}
                                        >
                                            {actionLoading ? 'Processing...' : 'Continue'}
                                        </button>
                                    </div>
                                </div>
                            )}

                            {/* Step 3: Secure (Blockchain or Hash) */}
                            {processingStep === 3 && (
                                <div className="animate-in slide-in-from-right-4 duration-300">
                                    <div className="flex items-center gap-4 mb-2">
                                        <ShieldCheck size={32} className={isBlockchainEligible ? 'text-green-500' : 'text-blue-500'} />
                                        <h3 className="text-2xl font-bold text-slate-800">Step 3: Secure Document</h3>
                                    </div>

                                    {isBlockchainEligible ? (
                                        <div className="mb-8 mt-4">
                                            <p className="text-green-600 text-sm font-semibold mb-4 bg-green-50 p-4 rounded-xl border border-green-100">
                                                This document is eligible for immutable blockchain recording. Please confirm the payload details below.
                                            </p>

                                            <div className="grid grid-cols-2 gap-4">
                                                <div>
                                                    <label className="block text-xs font-bold text-slate-500 mb-1">Student Name</label>
                                                    <input type="text" disabled value={name} className="w-full bg-slate-50 border border-slate-200 rounded-lg p-3 text-sm text-slate-500" />
                                                </div>
                                                <div>
                                                    <label className="block text-xs font-bold text-slate-500 mb-1">Document Type</label>
                                                    <input type="text" disabled value={docTypeRaw} className="w-full bg-slate-50 border border-slate-200 rounded-lg p-3 text-sm text-slate-500" />
                                                </div>
                                                <div>
                                                    <label className="block text-xs font-bold text-slate-700 mb-1">S.O. Number *</label>
                                                    <input
                                                        type="text"
                                                        required
                                                        placeholder="e.g. SO-2023-001"
                                                        value={blockchainData.studentSONumber}
                                                        onChange={(e) => setBlockchainData({ ...blockchainData, studentSONumber: e.target.value })}
                                                        className="w-full bg-white border border-slate-300 rounded-lg p-3 text-sm focus:border-blue-500 outline-none"
                                                    />
                                                </div>
                                                <div>
                                                    <label className="block text-xs font-bold text-slate-700 mb-1">Year Graduated *</label>
                                                    <input
                                                        type="number"
                                                        required
                                                        value={blockchainData.yearGraduated}
                                                        onChange={(e) => setBlockchainData({ ...blockchainData, yearGraduated: e.target.value })}
                                                        className="w-full bg-white border border-slate-300 rounded-lg p-3 text-sm focus:border-blue-500 outline-none"
                                                    />
                                                </div>
                                                <div className="col-span-2">
                                                    <label className="block text-xs font-bold text-slate-700 mb-1">School Name *</label>
                                                    <input
                                                        type="text"
                                                        required
                                                        value={blockchainData.nameOfSchool}
                                                        onChange={(e) => setBlockchainData({ ...blockchainData, nameOfSchool: e.target.value })}
                                                        className="w-full bg-white border border-slate-300 rounded-lg p-3 text-sm focus:border-blue-500 outline-none"
                                                    />
                                                </div>
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="mb-8 mt-4">
                                            <p className="text-slate-600 text-sm bg-slate-50 p-4 rounded-xl border border-slate-100">
                                                This document will be secured using local SHA-256 hashing.
                                            </p>
                                        </div>
                                    )}

                                    <div className="flex gap-3">
                                        <button className="flex-1 py-4 text-slate-400 font-bold text-sm hover:bg-slate-50 rounded-2xl transition-all" onClick={() => setProcessingStep(2)}>Back</button>
                                        <button
                                            className="flex-[2] bg-[#2c3e50] text-white py-4 rounded-2xl font-bold text-sm hover:bg-[#1a252f] transition-all shadow-lg shadow-slate-200 disabled:opacity-50"
                                            onClick={() => {
                                                showConfirm({
                                                    title: isBlockchainEligible ? 'Record to Blockchain' : 'Generate Cryptographic Hash',
                                                    message: isBlockchainEligible
                                                        ? 'Are you sure you want to record this document payload to the blockchain? This action is immutable.'
                                                        : 'Are you sure you want to generate a cryptographic hash for this document?',
                                                    type: isBlockchainEligible ? 'warning' : 'info',
                                                    confirmText: isBlockchainEligible ? 'Record & Secure' : 'Generate Hash',
                                                    onConfirm: handleSecureDocument
                                                });
                                            }}
                                            disabled={actionLoading || (isBlockchainEligible && (!blockchainData.studentSONumber || !blockchainData.yearGraduated || !blockchainData.nameOfSchool))}
                                        >
                                            {actionLoading ? 'Securing...' : isBlockchainEligible ? 'Record to Blockchain' : 'Generate Local Hash'}
                                        </button>
                                    </div>
                                </div>
                            )}

                            {/* Step 4: Release */}
                            {processingStep === 4 && (
                                <div className="animate-in slide-in-from-right-4 duration-300 text-center">
                                    <div className="bg-green-50 w-20 h-20 rounded-full flex items-center justify-center text-green-600 mb-6 mx-auto">
                                        <Send size={40} />
                                    </div>
                                    <h3 className="text-2xl font-bold mb-2 text-slate-800">Ready for Release</h3>
                                    <p className="text-slate-500 text-sm mb-8">
                                        The document has been successfully processed and is ready for release.
                                    </p>

                                    <div className="flex gap-3">
                                        <button
                                            className="w-full bg-green-600 text-white py-4 rounded-2xl font-bold text-sm hover:bg-green-700 transition-all shadow-lg shadow-green-100"
                                            onClick={() => {
                                                showConfirm({
                                                    title: 'Release Document',
                                                    message: 'Are you sure you want to finalize and release this document to the student?',
                                                    type: 'success',
                                                    confirmText: 'Finalize & Release',
                                                    onConfirm: handleRelease
                                                });
                                            }}
                                            disabled={actionLoading}
                                        >
                                            {actionLoading ? 'Releasing...' : 'Finalize & Release'}
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {/* Reject Modal */}
                {activeModal === 'reject' && (
                    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[2000] flex justify-center items-center p-6 animate-in fade-in duration-300 print:hidden">
                        <button
                            onClick={() => {
                                setShowBlockchainResult(false);
                                setProcessingStep(4);
                            }}
                            className="
                                            absolute
                                            top-5
                                            right-5
                                            text-slate-400
                                            hover:text-red-500
                                            "
                        >
                            <X size={22} />
                        </button>
                        <div className="bg-white rounded-3xl p-10 shadow-2xl w-full max-w-md animate-in zoom-in-95 duration-300">

                            <h3 className="text-xl font-bold mb-2 text-slate-800">Reject Request</h3>
                            <p className="text-slate-500 text-sm mb-8">Provide a reason for rejection.</p>

                            <select
                                className="w-full py-4 px-5 bg-slate-50 border border-slate-200 rounded-2xl outline-none focus:border-red-500 mb-8"
                                value={rejectionReason}
                                onChange={(e) => setRejectionReason(e.target.value)}
                            >
                                <option value="" disabled>Select Reason</option>
                                <option value="incomplete">Incomplete Documents</option>
                                <option value="invalid">Invalid Information</option>
                            </select>

                            <div className="flex gap-3">
                                <button className="flex-1 py-4 text-slate-400 font-bold text-sm hover:bg-slate-50 rounded-2xl transition-all" onClick={closeModal}>Cancel</button>
                                <button
                                    className="flex-[2] bg-red-600 text-white py-4 rounded-2xl font-bold text-sm hover:bg-red-700 transition-all shadow-lg shadow-red-100"
                                    onClick={() => handleStatusUpdate('Rejected')}
                                    disabled={!rejectionReason || actionLoading}
                                >
                                    Reject
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {showBlockchainResult && result && (

                    <div className="
fixed
inset-0
bg-black/60
backdrop-blur-sm
z-[3000]
flex
justify-center
items-center
p-6
">

                        <div className="
bg-white
rounded-3xl
shadow-2xl
w-full
max-w-2xl
relative
overflow-hidden
">

                            <button
                                onClick={() => {
                                    setShowBlockchainResult(false);
                                    setProcessingStep(4);
                                }}
                                className="
absolute
top-5
right-5
text-gray-400
hover:text-red-500
"
                            >
                                <X size={22} />
                            </button>

                            <div className="bg-[#E1FFEB] p-6 border-b">

                                <h3 className="
text-[22px]
font-bold
text-[#28A745]
mb-2
">
                                    ✓ Recorded
                                </h3>

                                <p className="text-sm text-gray-700">
                                    Transaction Recorded on Blockchain
                                </p>

                            </div>


                            <div className="p-6">

                                <h4 className="
font-bold
text-[13px]
text-gray-500
uppercase
mb-4
">
                                    BLOCKCHAIN RECORD
                                </h4>

                                <div className="
grid
grid-cols-2
gap-5
text-sm
mb-8
">

                                    <div>
                                        <p className="text-gray-500 text-xs">
                                            REFERENCE NUMBER
                                        </p>

                                        <p className="font-mono font-bold">
                                            {result.referenceNumber}
                                        </p>
                                    </div>


                                    <div>
                                        <p className="text-gray-500 text-xs">
                                            STUDENT NAME
                                        </p>

                                        <p className="font-semibold">
                                            {result.studentName}
                                        </p>
                                    </div>


                                    <div>
                                        <p className="text-gray-500 text-xs">
                                            S.O. NUMBER
                                        </p>

                                        <p className="font-semibold">
                                            {result.studentSONumber}
                                        </p>
                                    </div>


                                    <div>
                                        <p className="text-gray-500 text-xs">
                                            DOCUMENT TYPE
                                        </p>

                                        <p className="font-semibold">
                                            {result.documentType}
                                        </p>
                                    </div>


                                    <div>
                                        <p className="text-gray-500 text-xs">
                                            SCHOOL / INSTITUTION
                                        </p>

                                        <p className="font-semibold">
                                            {result.school}
                                        </p>
                                    </div>


                                    <div>
                                        <p className="text-gray-500 text-xs">
                                            YEAR GRADUATED
                                        </p>

                                        <p className="font-semibold">
                                            {result.yearGraduated}
                                        </p>
                                    </div>

                                </div>


                                <h4 className="
font-bold
text-[13px]
text-gray-500
uppercase
mb-4
">
                                    BLOCKCHAIN DETAILS
                                </h4>

                                <div className="space-y-4">

                                    <div>

                                        <p className="text-gray-500 text-xs">
                                            RECORDED BY
                                        </p>

                                        <p className="
font-mono
bg-gray-50
p-3
rounded
break-all
text-[11px]
">
                                            {result.recordedBy}
                                        </p>

                                    </div>


                                    <div>

                                        <p className="text-gray-500 text-xs">
                                            BLOCKCHAIN TIMESTAMP
                                        </p>

                                        <p className="font-semibold">
                                            {result.blockchainTimestamp}
                                        </p>

                                    </div>


                                    <div>

                                        <p className="text-gray-500 text-xs">
                                            TRANSACTION HASH
                                        </p>

                                        <p className="
font-mono
bg-gray-50
p-3
rounded
break-all
text-[11px]
">
                                            {result.transactionHash}
                                        </p>

                                    </div>

                                </div>


                                <button
                                    className="
w-full
mt-8
bg-green-600
text-white
py-4
rounded-2xl
font-bold
hover:bg-green-700
"
                                    onClick={() => {
                                        setShowBlockchainResult(false);
                                        setProcessingStep(4);
                                    }}
                                >
                                    Continue to Release
                                </button>

                            </div>

                        </div>
                    </div>

                )}

                <ConfirmModal
                    isOpen={confirmConfig !== null}
                    onClose={() => setConfirmConfig(null)}
                    onConfirm={confirmConfig?.onConfirm}
                    title={confirmConfig?.title}
                    message={confirmConfig?.message}
                    type={confirmConfig?.type}
                    confirmText={confirmConfig?.confirmText}
                    cancelText={confirmConfig?.cancelText}
                    isLoading={confirmConfig?.isLoading}
                />



            </div>
        </Layout>
    );
};

export default RequestDetails;