import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ChevronRight, FileText, Upload, CheckCircle2, AlertCircle, ShieldCheck, Printer, FileSearch, Trash2, Shield, Search } from 'lucide-react';
import Layout from '../../components/Layout';
import ConfirmModal from '../../components/ConfirmModal';
import api from '../../api';

const API_BASE = (import.meta.env.VITE_API_URL ? import.meta.env.VITE_API_URL.replace('/api', '') : '') || 'http://127.0.0.1:5000';

const RequestDetails = () => {
    const { id } = useParams();
    const navigate = useNavigate();

    const userRole = localStorage.getItem('userRole') || 'registrar';
    const isSuperAdmin = userRole === 'super admin';

    // Core Data State
    const [requestData, setRequestData] = useState(null);
    const [paymentTx, setPaymentTx] = useState(null);
    const [loading, setLoading] = useState(true);
    const [actionLoading, setActionLoading] = useState(false);

    // Wizard State
    const [currentStep, setCurrentStep] = useState(1);
    const [uploadedFile, setUploadedFile] = useState(null);
    const [documentData, setDocumentData] = useState(null);
    const [rejectionReason, setRejectionReason] = useState('');
    const [showRejectForm, setShowRejectForm] = useState(false);
    const [confirmConfig, setConfirmConfig] = useState(null);

    // Blockchain Data State
    const [blockchainData, setBlockchainData] = useState({
        studentIDNumber: "",
        nameOfSchool: "VeriFitor University",
        yearGraduated: new Date().getFullYear(),
    });
    const [blockchainResult, setBlockchainResult] = useState(null);

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
            if (found) setRequestData(found);

            const txRes = await api.get('/transactions');
            const foundTx = txRes.data.find(t => t.requestId === id);
            if (foundTx) setPaymentTx(foundTx);

            // Determine Step
            const docType = (found?.documentType || found?.document_type || '').toLowerCase();
            const isBlockchain = docType.includes('tor') || docType.includes('diploma');

            if (found && found.status === 'Released') {
                setCurrentStep(isBlockchain ? 4 : 3);
            } else if (found && found.status === 'In Process') {
                if (found.documentFile) {
                    setCurrentStep(3); // Has uploaded, moving to secure/finalize
                } else {
                    setCurrentStep(2); // Has verified payment/bypassed, moving to upload
                }
            } else if (foundTx && foundTx.status === 'Completed') {
                if (found && found.documentFile) {
                    setCurrentStep(3);
                } else {
                    setCurrentStep(2);
                }
            } else {
                setCurrentStep(1); // Pending payment verification
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
            if (newStatus === 'Rejected') setShowRejectForm(false);
        } catch (err) {
            alert(err.response?.data?.message || 'Update failed');
        } finally {
            setActionLoading(false);
        }
    };

    const handleVerifyPayment = async (status) => {
        setActionLoading(true);
        try {
            await api.put(`/transactions/${paymentTx.transactionId}/verify`, { status });
            // Note: The backend now automatically syncs the Request status to "In Process" when status === "Completed".
            // However, we still call the explicit /requests update here as well to ensure UI state syncs properly,
            // or we could just rely on the backend. Since the backend handles it, the following is slightly redundant but safe.
            if (status === 'Completed') {
                await api.put(`/requests/${id}`, { status: 'In Process' });
            }
            await fetchData();
            if (status === 'Completed') setCurrentStep(2);
        } catch (err) {
            console.error(err);
            alert('Failed to verify payment');
        } finally {
            setActionLoading(false);
        }
    };

    const handleFileUpload = async (e) => {
        if (!e.target.files || e.target.files.length === 0) return;
        const file = e.target.files[0];
        if (file.type !== 'application/pdf') {
            alert("Only PDF files are allowed.");
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

            if (!res.data.isBlockchainEligible) {
                await api.put(`/requests/${id}`, { status: "Released" });
                setCurrentStep(3); // Non-blockchain finishes at step 3 visually
            } else {
                setCurrentStep(3); // Blockchain moves to Secure step
            }
            await fetchData();
        } catch (err) {
            console.error(err);
            alert('Failed to upload document. Please ensure it is a valid PDF.');
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
                    studentIDNumber: blockchainData.studentIDNumber,
                    typeOfDocument: requestData.documentType || requestData.document_type || "Document",
                    nameOfSchool: blockchainData.nameOfSchool,
                    yearGraduated: Number(blockchainData.yearGraduated)
                });

                setBlockchainResult({
                    referenceNumber: blockchainRes.data.referenceNumber || `TXN-${Date.now()}`,
                    transactionHash: blockchainRes.data.blockchainTxHash || blockchainRes.data.transactionHash,
                    blockchainTimestamp: blockchainRes.data.timestamp || new Date().toLocaleString(),
                    studentIDNumber: blockchainData.studentIDNumber,
                });
            }

            await api.put(`/requests/${id}`, { status: "Released" });
            setCurrentStep(4);
            await fetchData();
        } catch (err) {
            alert(err.response?.data?.message || 'Failed to secure document');
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
            <div className="flex flex-col min-h-screen bg-[#f8fafc] font-sans">
                <div className="max-w-6xl mx-auto w-full p-8 flex-grow">
                    {/* Breadcrumb */}
                    <div className="flex items-center gap-2 text-[12px] mb-6 text-slate-500 uppercase tracking-widest font-bold">
                        <span className="cursor-pointer hover:text-blue-600 transition-colors" onClick={() => navigate('/requests')}>Requests</span>
                        <ChevronRight size={14} />
                        <span className="text-blue-600">Document Processing</span>
                    </div>

                    <div className="flex items-center justify-between mb-8">
                        <div>
                            <h1 className="text-3xl font-bold text-slate-800">Process Document Request</h1>
                            <p className="text-slate-500 mt-1">Request ID: <span className="font-mono">{requestData.requestId}</span></p>
                        </div>
                        <span className={`px-4 py-2 rounded-full text-xs font-bold uppercase tracking-widest shadow-sm border ${status === 'Pending' ? 'bg-amber-50 text-amber-600 border-amber-200' :
                                status === 'In Process' ? 'bg-blue-50 text-blue-600 border-blue-200' :
                                    status === 'Released' ? 'bg-green-50 text-green-600 border-green-200' :
                                        'bg-red-50 text-red-600 border-red-200'
                            }`}>
                            {status}
                        </span>
                    </div>

                    {status === 'Rejected' && (
                        <div className="bg-red-50 p-6 rounded-2xl border border-red-200 mb-8">
                            <h3 className="text-red-700 font-bold text-lg mb-2">Request Rejected</h3>
                            <p className="text-red-600">This document request has been rejected and requires no further action.</p>
                        </div>
                    )}

                    {!isSuperAdmin && status !== 'Rejected' && status !== 'Released' && (
                        <div className="bg-blue-50 p-4 rounded-xl border border-blue-200 mb-8 flex items-center gap-3 text-blue-700">
                            <Shield className="shrink-0" size={20} />
                            <div>
                                <h4 className="font-bold text-sm">Read-Only View</h4>
                                <p className="text-xs">Only Super Administrators have the permission to process document requests, upload files, and secure them on the blockchain.</p>
                            </div>
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
                                            { step: 1, title: 'Verify & Payment', desc: 'Review request details and verify payment receipt' },
                                            { step: 2, title: 'Upload Document', desc: 'Upload the PDF document' },
                                            { step: 3, title: 'Secure on Blockchain', desc: 'Blockchain embedding and finalization' },
                                            { step: 4, title: 'Release', desc: 'Document ready for pickup/delivery' }
                                        ] : [
                                            { step: 1, title: 'Verify & Payment', desc: 'Review request details and verify payment receipt' },
                                            { step: 2, title: 'Upload & Finalize', desc: 'Upload the PDF document and finalize request' },
                                            { step: 3, title: 'Release', desc: 'Document ready for pickup/delivery' }
                                        ]).map(s => (
                                            <div key={s.step} className={`flex gap-4 ${currentStep === s.step ? 'opacity-100' : 'opacity-40'}`}>
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
                                    <div className="bg-white p-8 rounded-2xl shadow-sm border border-slate-100 animate-in fade-in slide-in-from-right-4 duration-300">
                                        <h2 className="text-2xl font-bold text-slate-800 mb-6">Verify Request & Payment</h2>

                                        <div className="grid grid-cols-2 gap-6 mb-8">
                                            <div className="bg-slate-50 p-4 rounded-xl">
                                                <p className="text-xs font-bold text-slate-400 uppercase">Student Name</p>
                                                <p className="font-bold text-slate-700">{requestData.name}</p>
                                            </div>
                                            <div className="bg-slate-50 p-4 rounded-xl">
                                                <p className="text-xs font-bold text-slate-400 uppercase">Requested Document</p>
                                                <p className="font-bold text-slate-700">{requestData.documentType || requestData.document_type}</p>
                                            </div>
                                            <div className="bg-slate-50 p-4 rounded-xl">
                                                <p className="text-xs font-bold text-slate-400 uppercase">Course / Year</p>
                                                <p className="font-bold text-slate-700">{requestData.course || 'N/A'} - {requestData.yearLevel || 'N/A'}</p>
                                            </div>
                                        </div>

                                        {paymentTx && (
                                            <div className="border border-slate-200 rounded-xl overflow-hidden mb-8">
                                                <div className="bg-slate-50 p-4 border-b border-slate-200 flex justify-between items-center">
                                                    <h3 className="font-bold text-slate-700">Payment Verification</h3>
                                                    <span className={`px-2 py-1 rounded text-xs font-bold uppercase ${paymentTx.status === 'Completed' ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'}`}>
                                                        {paymentTx.status}
                                                    </span>
                                                </div>
                                                <div className="p-4 grid grid-cols-2 gap-4">
                                                    <div>
                                                        <p className="text-xs text-slate-500 mb-1">Method & Amount</p>
                                                        <p className="font-bold text-slate-800">{paymentTx.paymentMode} - ₱{paymentTx.amount}</p>
                                                    </div>
                                                    <div className="col-span-2">
                                                        <p className="text-xs text-slate-500 mb-2">Receipt Uploaded</p>
                                                        <div className="bg-slate-100 rounded-lg p-2 h-64 flex items-center justify-center border border-slate-200">
                                                            {paymentTx.receiptImage ? (
                                                                <img src={`${API_BASE}${paymentTx.receiptImage}`} alt="Receipt" className="max-h-full object-contain" />
                                                            ) : (
                                                                <span className="text-slate-400 font-bold text-sm">No image uploaded</span>
                                                            )}
                                                        </div>
                                                    </div>
                                                </div>

                                                {paymentTx.status === 'Pending Verification' && (
                                                    <div className="p-4 bg-slate-50 flex gap-4 border-t border-slate-200">
                                                        <button
                                                            className="flex-1 py-3 text-red-500 border border-red-200 font-bold text-sm hover:bg-red-50 rounded-xl transition-all"
                                                            onClick={() => showConfirm({
                                                                title: 'Reject Payment',
                                                                message: 'Are you sure you want to reject this payment receipt?',
                                                                type: 'danger',
                                                                onConfirm: () => handleVerifyPayment('Needs Update')
                                                            })}
                                                            disabled={actionLoading || !isSuperAdmin}
                                                        >
                                                            Reject Payment
                                                        </button>
                                                        <button
                                                            className={`flex-[2] text-white py-3 rounded-xl font-bold text-sm transition-all shadow-md ${!isSuperAdmin ? 'bg-slate-300 shadow-none' : 'bg-blue-600 hover:bg-blue-700 shadow-blue-100'}`}
                                                            onClick={() => handleVerifyPayment('Completed')}
                                                            disabled={actionLoading || !isSuperAdmin}
                                                        >
                                                            {actionLoading ? 'Approving...' : 'Approve & Proceed'}
                                                        </button>
                                                    </div>
                                                )}
                                            </div>
                                        )}

                                        {!paymentTx && (
                                            <div className="bg-amber-50 p-4 rounded-xl text-amber-700 font-bold mb-8">
                                                <AlertCircle className="inline mr-2" size={18} /> No payment transaction found for this request.
                                            </div>
                                        )}

                                        <div className="pt-6 border-t border-slate-100 flex flex-col gap-4">
                                            {(!paymentTx || paymentTx.status !== 'Completed') && !showRejectForm && (
                                                <div className="flex justify-end">
                                                    <button
                                                        className="bg-slate-100 text-slate-700 hover:bg-slate-200 px-6 py-3 rounded-xl font-bold text-sm flex items-center gap-2 transition-colors disabled:opacity-50"
                                                        onClick={() => showConfirm({
                                                            title: 'Bypass Verification',
                                                            message: 'Are you sure you want to bypass the payment verification step and forcefully start processing this request?',
                                                            type: 'warning',
                                                            onConfirm: async () => {
                                                                await api.put(`/requests/${id}`, { status: 'In Process' });
                                                                setCurrentStep(2);
                                                            }
                                                        })}
                                                        disabled={!isSuperAdmin}
                                                    >
                                                        Admin Override: Force Proceed <ChevronRight size={16} />
                                                    </button>
                                                </div>
                                            )}

                                            {showRejectForm ? (
                                                <div className="bg-red-50 p-4 rounded-xl border border-red-100 animate-in fade-in">
                                                    <p className="font-bold text-red-700 text-sm mb-2">Provide reason for rejection:</p>
                                                    <select
                                                        className="w-full py-3 px-4 bg-white border border-red-200 rounded-lg outline-none focus:border-red-500 mb-4"
                                                        value={rejectionReason}
                                                        onChange={(e) => setRejectionReason(e.target.value)}
                                                    >
                                                        <option value="" disabled>Select Reason</option>
                                                        <option value="incomplete">Incomplete Requirements</option>
                                                        <option value="invalid">Invalid Information</option>
                                                        <option value="unpaid">Payment Issue</option>
                                                    </select>
                                                    <div className="flex gap-2">
                                                        <button className="flex-1 py-2 text-slate-500 font-bold hover:bg-red-100 rounded-lg" onClick={() => setShowRejectForm(false)}>Cancel</button>
                                                        <button
                                                            className="flex-1 bg-red-600 text-white py-2 rounded-lg font-bold hover:bg-red-700 disabled:opacity-50"
                                                            disabled={!rejectionReason || actionLoading}
                                                            onClick={() => handleStatusUpdate('Rejected')}
                                                        >Confirm Reject</button>
                                                    </div>
                                                </div>
                                            ) : (
                                                <div className="flex justify-start">
                                                    <button
                                                        className="text-slate-400 hover:text-red-500 font-bold text-sm flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                                                        onClick={() => setShowRejectForm(true)}
                                                        disabled={!isSuperAdmin}
                                                    >
                                                        <Trash2 size={16} /> Reject Request
                                                    </button>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                )}

                                {/* Step 2 Content */}
                                {currentStep === 2 && (
                                    <div className="bg-white p-8 rounded-2xl shadow-sm border border-slate-100 animate-in fade-in slide-in-from-right-4 duration-300">
                                        <h2 className="text-2xl font-bold text-slate-800 mb-2">Upload External PDF</h2>
                                        <p className="text-slate-500 mb-8">Upload the requested document as a PDF. If it is a TOR or Diploma, a QR code will be automatically embedded.</p>

                                        <input type="file" id="pdfUpload" className="hidden" accept=".pdf" onChange={handleFileUpload} disabled={!isSuperAdmin} />
                                        <div
                                            className={`border-2 border-dashed border-slate-200 bg-slate-50 rounded-2xl py-16 px-8 text-center mb-8 transition-all group ${isSuperAdmin ? 'cursor-pointer hover:border-blue-500 hover:bg-blue-50' : 'opacity-70 cursor-not-allowed'}`}
                                            onClick={() => { if (isSuperAdmin) document.getElementById('pdfUpload').click() }}
                                        >
                                            <Upload size={40} className={`mx-auto mb-4 transition-colors ${isSuperAdmin ? 'text-slate-400 group-hover:text-blue-600' : 'text-slate-300'}`} />
                                            {uploadedFile ? (
                                                <p className="text-blue-600 font-bold">{uploadedFile.name}</p>
                                            ) : (
                                                <p className="text-slate-600 font-bold">Click to browse for PDF file</p>
                                            )}
                                        </div>

                                        <div className="flex gap-4 pt-6 border-t border-slate-100">
                                            <button
                                                className="flex-[1] bg-slate-100 text-slate-600 py-4 rounded-xl font-bold hover:bg-slate-200 transition-all"
                                                onClick={() => setCurrentStep(1)}
                                            >Back</button>
                                            <button
                                                className={`flex-[2] text-white py-4 rounded-xl font-bold transition-all shadow-md disabled:opacity-50 ${!isSuperAdmin ? 'bg-slate-300 shadow-none' : 'bg-blue-600 hover:bg-blue-700 shadow-blue-100'}`}
                                                disabled={!uploadedFile || actionLoading || !isSuperAdmin}
                                                onClick={processUpload}
                                            >
                                                {actionLoading ? 'Uploading & Processing...' : 'Process Document'}
                                            </button>
                                        </div>
                                    </div>
                                )}

                                {/* Step 3 Content */}
                                {currentStep === 3 && isBlockchainEligible && (
                                    <div className="bg-white p-8 rounded-2xl shadow-sm border border-slate-100 animate-in fade-in slide-in-from-right-4 duration-300">
                                        <h2 className="text-2xl font-bold text-slate-800 mb-2">Secure & Finalize</h2>

                                        {isBlockchainEligible && (
                                            <div>
                                                <div className="bg-blue-50 text-blue-800 p-4 rounded-xl border border-blue-100 mb-8 flex items-start gap-3">
                                                    <ShieldCheck className="mt-1 shrink-0" />
                                                    <div>
                                                        <h4 className="font-bold">Blockchain Eligible Document</h4>
                                                        <p className="text-sm">The uploaded PDF has been embedded with a unique QR code. Complete the details below to record this document immutably on the blockchain.</p>
                                                    </div>
                                                </div>

                                                <div className="grid grid-cols-2 gap-6 mb-8">
                                                    <div>
                                                        <label className="block text-xs font-bold text-slate-500 uppercase mb-2">ID Number *</label>
                                                        <input
                                                            type="text"
                                                            required
                                                            placeholder="e.g. ID-2023-001"
                                                            value={blockchainData.studentIDNumber}
                                                            onChange={(e) => setBlockchainData({ ...blockchainData, studentIDNumber: e.target.value })}
                                                            className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-sm focus:border-blue-500 outline-none"
                                                        />
                                                    </div>
                                                    <div>
                                                        <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Year Graduated *</label>
                                                        <input
                                                            type="number"
                                                            required
                                                            value={blockchainData.yearGraduated}
                                                            onChange={(e) => setBlockchainData({ ...blockchainData, yearGraduated: e.target.value })}
                                                            className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-sm focus:border-blue-500 outline-none"
                                                        />
                                                    </div>
                                                    <div className="col-span-2">
                                                        <label className="block text-xs font-bold text-slate-500 uppercase mb-2">School Name</label>
                                                        <input
                                                            type="text"
                                                            required
                                                            value={blockchainData.nameOfSchool}
                                                            onChange={(e) => setBlockchainData({ ...blockchainData, nameOfSchool: e.target.value })}
                                                            className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-sm focus:border-blue-500 outline-none"
                                                        />
                                                    </div>
                                                </div>
                                            </div>
                                        )}

                                        <div className="flex gap-4 pt-6 border-t border-slate-100">
                                            <button
                                                className="flex-[1] bg-slate-100 text-slate-600 py-4 rounded-xl font-bold hover:bg-slate-200 transition-all"
                                                onClick={() => setCurrentStep(2)}
                                            >Back</button>
                                            <button
                                                className={`flex-[2] text-white py-4 rounded-xl font-bold transition-all shadow-md disabled:opacity-50 ${(!isSuperAdmin) ? 'bg-slate-300 shadow-none' : (isBlockchainEligible ? 'bg-[#2c3e50] hover:bg-[#1a252f]' : 'bg-green-600 hover:bg-green-700')}`}
                                                disabled={actionLoading || !isSuperAdmin || (isBlockchainEligible && !blockchainData.studentIDNumber)}
                                                onClick={() => showConfirm({
                                                    title: isBlockchainEligible ? 'Secure to Blockchain' : 'Finalize Document',
                                                    message: 'Are you sure you want to finalize this request?',
                                                    onConfirm: handleSecureDocument
                                                })}
                                            >
                                                {actionLoading ? 'Processing...' : (isBlockchainEligible ? 'Secure on Blockchain' : 'Finalize Request')}
                                            </button>
                                        </div>
                                    </div>
                                )}

                                {/* Final Step Content */}
                                {((isBlockchainEligible && currentStep === 4) || (!isBlockchainEligible && currentStep === 3)) && (
                                    <div className="bg-white p-10 rounded-2xl shadow-sm border border-slate-100 animate-in fade-in slide-in-from-right-4 duration-300 text-center">
                                        <div className="w-24 h-24 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
                                            <CheckCircle2 size={48} className="text-green-600" />
                                        </div>
                                        <h2 className="text-3xl font-bold text-slate-800 mb-4">Request Completed</h2>
                                        <p className="text-slate-500 mb-8 max-w-md mx-auto">
                                            The document request has been successfully finalized. It is now marked as Released and is ready for the student.
                                        </p>

                                        {blockchainResult && (
                                            <div className="bg-slate-50 p-6 rounded-xl border border-slate-200 text-left mb-8 max-w-lg mx-auto">
                                                <h4 className="font-bold text-xs text-slate-400 uppercase tracking-widest mb-4">Blockchain Record</h4>
                                                <div className="space-y-3">
                                                    <div>
                                                        <p className="text-xs text-slate-500">Transaction Hash</p>
                                                        <p className="font-mono text-xs text-slate-700 truncate">{blockchainResult.transactionHash}</p>
                                                    </div>
                                                    <div>
                                                        <p className="text-xs text-slate-500">Reference / ID Number</p>
                                                        <p className="font-bold text-slate-700">{blockchainResult.referenceNumber} / {blockchainResult.studentIDNumber}</p>
                                                    </div>
                                                </div>
                                            </div>
                                        )}

                                        <div className="flex gap-4 justify-center">
                                            {requestData.documentFile && (
                                                <a
                                                    href={requestData.documentFile.startsWith('data:') ? requestData.documentFile : `${API_BASE}${requestData.documentFile}`}
                                                    download={requestData.documentFile.startsWith('data:') ? `document-${requestData.requestId}.pdf` : undefined}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="bg-blue-600 text-white px-8 py-4 rounded-xl font-bold hover:bg-blue-700 transition-colors shadow-lg flex items-center gap-2"
                                                >
                                                    <FileText size={20} /> View / Download Document
                                                </a>
                                            )}
                                            <button
                                                className="bg-slate-800 text-white px-8 py-4 rounded-xl font-bold hover:bg-slate-900 transition-colors shadow-lg"
                                                onClick={() => navigate('/requests')}
                                            >
                                                Return to Requests
                                            </button>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}
                </div>
            </div>
            {confirmConfig && (
                <ConfirmModal
                    isOpen={!!confirmConfig}
                    title={confirmConfig.title}
                    message={confirmConfig.message}
                    onConfirm={confirmConfig.onConfirm}
                    onClose={() => setConfirmConfig(null)}
                    type={confirmConfig.type}
                    confirmText={confirmConfig.confirmText}
                    cancelText={confirmConfig.cancelText}
                    isLoading={confirmConfig.isLoading}
                />
            )}
        </Layout>
    );
};

export default RequestDetails;