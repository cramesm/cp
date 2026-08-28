import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Layout from '../../components/Layout';
import api from '../../api';
import { ArrowLeft, CheckCircle, XCircle, Clock, Image as ImageIcon, Eye, CreditCard, AlertCircle, User, FileText, RefreshCw, Edit3 } from 'lucide-react';
import ConfirmModal from '../../components/ConfirmModal';
import FeedbackModal from '../../components/FeedbackModal';

const API_BASE = (import.meta.env.VITE_API_URL ? import.meta.env.VITE_API_URL.replace('/api', '') : '') || 'http://127.0.0.1:5000';

const TransactionDetails = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [txData, setTxData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [zoomedImage, setZoomedImage] = useState(false);
    
    const userRole = localStorage.getItem('userRole') || 'registrar';
    const isSuperAdmin = userRole === 'super admin';
    const [isEditingStatus, setIsEditingStatus] = useState(false);
    const [newStatus, setNewStatus] = useState('');
    const [actionLoading, setActionLoading] = useState(false);

    // Confirm Modal
    const [confirmConfig, setConfirmConfig] = useState(null);
    let isExecuting = false;
    const showConfirm = ({ title, message, onConfirm, type = 'info', confirmText = 'Confirm', cancelText = 'Cancel' }) => {
        setConfirmConfig({
            title,
            message,
            onConfirm: async () => {
                if (isExecuting) return;
                isExecuting = true;
                setConfirmConfig(prev => ({ ...prev, isLoading: true }));
                try {
                    await onConfirm();
                } catch (err) {
                    console.error(err);
                } finally {
                    isExecuting = false;
                    setConfirmConfig(null);
                }
            },
            type,
            confirmText,
            cancelText,
            isLoading: false
        });
    };

    // Feedback Modal
    const [feedbackConfig, setFeedbackConfig] = useState(null);
    const showFeedback = ({ title, message, type = 'error' }) => {
        setFeedbackConfig({ title, message, type });
    };

    const handleUpdateStatus = () => {
        if (!newStatus) return;
        showConfirm({
            title: 'Update Payment Status',
            message: `Are you sure you want to force update this payment to "${newStatus}"?`,
            type: 'warning',
            confirmText: 'Update',
            onConfirm: async () => {
                setActionLoading(true);
                try {
                    await api.put(`/transactions/${txData.transactionId}/verify`, { status: newStatus });
                    const res = await api.get(`/transactions/${id}`);
                    setTxData(res.data);
                    setIsEditingStatus(false);
                } catch (err) {
                    showFeedback({
                        title: 'Update Failed',
                        message: 'We hit a snag updating this transaction\'s status. Please check your connection and try again.',
                        type: 'error'
                    });
                } finally {
                    setActionLoading(false);
                }
            }
        });
    };

    useEffect(() => {
        const fetchTransaction = async () => {
            try {
                const res = await api.get(`/transactions/${id}`);
                setTxData(res.data);
            } catch (error) {
                console.error("Error fetching transaction:", error);
            } finally {
                setLoading(false);
            }
        };
        fetchTransaction();
    }, [id]);

    if (loading) {
        return (
            <Layout>
                <div className="p-8 flex items-center justify-center min-h-[400px] text-slate-400">
                    <div className="flex flex-col items-center gap-3">
                        <div className="w-8 h-8 border-3 border-slate-200 border-t-[#2c3543] rounded-full animate-spin"></div>
                        <span className="text-xs font-bold text-slate-500">Loading Transaction...</span>
                    </div>
                </div>
            </Layout>
        );
    }

    if (!txData) {
        return (
            <Layout>
                <div className="flex flex-col items-center justify-center min-h-[500px] text-slate-500">
                    <AlertCircle size={48} className="mb-4 text-red-400" />
                    <h2 className="text-lg font-black text-slate-800">Transaction Not Found</h2>
                    <p className="text-xs text-slate-400 mt-1 font-mono">Transaction ID: {id}</p>
                    <button
                        onClick={() => navigate('/transactions')}
                        className="bg-[#2c3543] hover:bg-[#1f2631] text-white font-bold text-xs py-2 px-4 mt-6 rounded-full border-t border-white/20 border-b-2 border-black/50 shadow-[0_2px_6px_rgba(0,0,0,0.25)] hover:-translate-y-0.5 active:translate-y-0.5 active:border-b-0 transition-all flex items-center gap-2 cursor-pointer"
                    >
                        <ArrowLeft size={13} />
                        <span>Back to Transactions</span>
                    </button>
                </div>
            </Layout>
        );
    }

    const getStatusBadge = (status) => {
        const s = (status || '').toLowerCase();
        if (s === 'completed') {
            return {
                style: 'bg-emerald-50 text-emerald-700 border-emerald-200/80',
                dotColor: 'bg-emerald-500'
            };
        } else if (s === 'pending verification') {
            return {
                style: 'bg-amber-50 text-amber-700 border-amber-200/80',
                dotColor: 'bg-amber-500'
            };
        } else if (s === 'needs update') {
            return {
                style: 'bg-orange-50 text-orange-700 border-orange-200/80',
                dotColor: 'bg-orange-500'
            };
        } else if (s === 'rejected') {
            return {
                style: 'bg-red-50 text-red-700 border-red-200/80',
                dotColor: 'bg-red-500'
            };
        } else if (s === 'refunded') {
            return {
                style: 'bg-purple-50 text-purple-700 border-purple-200/80',
                dotColor: 'bg-purple-500'
            };
        }
        return {
            style: 'bg-slate-100 text-slate-600 border-slate-200/80',
            dotColor: 'bg-slate-400'
        };
    };

    const getPaymentModeStyle = (mode) => {
        switch (mode) {
            case 'GCash': return 'bg-[#E0F0FF] text-[#0070E0]';
            case 'Maya': return 'bg-[#E8F5E8] text-[#2E7D32]';
            case 'GoThyme': return 'bg-[#FFF3E0] text-[#E65100]';
            default: return 'bg-slate-100 text-slate-600';
        }
    };

    const statusBadge = getStatusBadge(txData.status);
    const formattedDate = new Date(txData.date).toLocaleDateString('en-US', {
        year: 'numeric', month: 'long', day: 'numeric'
    });
    const formattedTime = new Date(txData.date).toLocaleTimeString('en-US', {
        hour: '2-digit', minute: '2-digit'
    });

    return (
        <Layout>
            {confirmConfig && (
                <ConfirmModal 
                    {...confirmConfig} 
                    isOpen={!!confirmConfig} 
                    onClose={() => setConfirmConfig(null)} 
                />
            )}
            <div className="py-2 px-2 sm:px-4 font-sans space-y-4 relative">

                {/* Header */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-4 sm:p-5 rounded-[22px] shadow-[0_8px_24px_rgba(0,0,0,0.03),0_2px_6px_rgba(0,0,0,0.02)] border border-slate-100/90">
                    <div>
                        <div className="flex items-center gap-2.5 flex-wrap">
                            <h2 className="text-[18px] font-black text-slate-900 m-0">
                                Transaction: <span className="font-mono">{txData.transactionId}</span>
                            </h2>
                            <span className={`inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full text-[10.5px] uppercase tracking-wider font-extrabold border ${statusBadge.style}`}>
                                <span className={`w-1.5 h-1.5 rounded-full ${statusBadge.dotColor}`}></span>
                                <span>{txData.status}</span>
                            </span>
                        </div>
                        <p className="text-xs text-slate-400 font-medium m-0 mt-1">
                            Submitted on {formattedDate} at {formattedTime}
                        </p>
                    </div>
                    <button
                        onClick={() => navigate('/transactions')}
                        className="bg-white hover:bg-slate-50 text-slate-700 font-bold text-xs px-4 py-1.5 rounded-full border border-slate-200 shadow-2xs hover:-translate-y-0.5 active:translate-y-0.5 transition-all flex items-center gap-2 cursor-pointer w-fit"
                    >
                        <ArrowLeft size={13} />
                        <span>Back to Transactions</span>
                    </button>
                </div>

                <div className="space-y-4">

                    {/* Row 1: Payer Info + Payment Summary */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">

                        {/* Payer Information */}
                        <div className="bg-white p-6 rounded-[22px] border border-slate-100/90 shadow-[0_8px_24px_rgba(0,0,0,0.03),0_2px_6px_rgba(0,0,0,0.02)]">
                            <h4 className="text-[13px] font-black text-[#2c3543] mb-4 border-b border-slate-100 pb-3 uppercase tracking-wider flex items-center gap-2">
                                <User size={15} /> Payer Information
                            </h4>
                            <div className="grid grid-cols-[130px_1fr] gap-y-3 text-[12.5px]">
                                <span className="text-slate-400 font-bold">Payer Name:</span>
                                <span className="text-slate-900 font-bold">{txData.payerName || txData.name}</span>

                                <span className="text-slate-400 font-bold">Email:</span>
                                <span className="text-slate-700 font-medium">{txData.payerEmail || 'Not provided'}</span>

                                <span className="text-slate-400 font-bold">Type:</span>
                                <span className="text-slate-700 font-medium">{txData.payerType || 'Student'}</span>

                                <span className="text-slate-400 font-bold">Request ID:</span>
                                <span className="bg-slate-100 px-2 py-0.5 rounded-md text-slate-700 font-mono text-[11.5px] font-bold w-fit">
                                    {txData.requestId}
                                </span>
                            </div>
                        </div>

                        {/* Payment Summary */}
                        <div className="bg-white p-6 rounded-[22px] border border-slate-100/90 shadow-[0_8px_24px_rgba(0,0,0,0.03),0_2px_6px_rgba(0,0,0,0.02)]">
                            <h4 className="text-[13px] font-black text-[#2c3543] mb-4 border-b border-slate-100 pb-3 uppercase tracking-wider flex items-center gap-2">
                                <CreditCard size={15} /> Payment Summary
                            </h4>
                            <div className="grid grid-cols-[130px_1fr] gap-y-3 text-[12.5px]">
                                <span className="text-slate-400 font-bold">Document:</span>
                                <span className="text-slate-800 font-bold flex items-center gap-1.5">
                                    <i className="fa-solid fa-file-lines text-blue-500 text-xs"></i>
                                    <span>{txData.documentType}</span>
                                </span>

                                <span className="text-slate-400 font-bold">Amount:</span>
                                <span className="text-slate-900 font-black text-[15px]">₱{txData.amount || '0.00'}</span>

                                <span className="text-slate-400 font-bold">Payment Mode:</span>
                                <span className={`inline-flex items-center w-fit px-2.5 py-0.5 rounded-md text-[11px] font-extrabold uppercase ${getPaymentModeStyle(txData.paymentMode)}`}>
                                    {txData.paymentMode}
                                </span>

                                <span className="text-slate-400 font-bold">Status:</span>
                                <span className={`inline-flex items-center gap-1.5 w-fit px-3 py-0.5 rounded-full text-[10.5px] font-extrabold uppercase border ${statusBadge.style}`}>
                                    <span className={`w-1.5 h-1.5 rounded-full ${statusBadge.dotColor}`}></span>
                                    <span>{txData.status}</span>
                                </span>
                            </div>
                        </div>
                    </div>

                    {/* Row 2: Receipt Image + Verification Status */}
                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">

                        {/* Receipt Image */}
                        <div className="lg:col-span-7 bg-white p-6 rounded-[22px] border border-slate-100/90 shadow-[0_8px_24px_rgba(0,0,0,0.03),0_2px_6px_rgba(0,0,0,0.02)]">
                            <h4 className="text-[13px] font-black text-[#2c3543] mb-4 border-b border-slate-100 pb-3 uppercase tracking-wider flex items-center gap-2">
                                <FileText size={15} /> Uploaded Payment Receipt
                            </h4>
                            <div className="bg-slate-50 border border-dashed border-slate-200 rounded-2xl p-6">
                                {(txData.imageUrl || txData.receiptImage) && !(txData.imageUrl || txData.receiptImage).includes('undefined') ? (
                                    <div className="flex flex-col items-center gap-4">
                                        <img
                                            src={(txData.imageUrl || txData.receiptImage).startsWith('http') ? (txData.imageUrl || txData.receiptImage) : `${API_BASE}${txData.receiptImage}`}
                                            alt="Payment Receipt"
                                            className="max-h-[380px] object-contain rounded-xl shadow-xs cursor-pointer hover:shadow-md transition-shadow"
                                            onClick={() => setZoomedImage(true)}
                                        />
                                        <button
                                            onClick={() => setZoomedImage(true)}
                                            className="bg-[#2c3543] hover:bg-[#1f2631] text-white px-6 py-2 rounded-full font-bold text-xs flex items-center gap-2 border-t border-white/20 border-b-2 border-black/50 shadow-[0_2px_5px_rgba(0,0,0,0.2)] hover:-translate-y-0.5 active:translate-y-0.5 active:border-b-0 transition-all cursor-pointer"
                                        >
                                            <Eye size={14} /> 
                                            <span>View Full Size</span>
                                        </button>
                                    </div>
                                ) : (
                                    <div className="flex flex-col items-center text-center gap-3 py-10">
                                        <div className="bg-slate-200 p-3.5 rounded-full text-slate-400">
                                            <ImageIcon size={28} />
                                        </div>
                                        <p className="text-xs font-bold text-slate-400 m-0">No valid receipt image uploaded</p>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Verification Status */}
                        <div className="lg:col-span-5 bg-white p-6 rounded-[22px] border border-slate-100/90 shadow-[0_8px_24px_rgba(0,0,0,0.03),0_2px_6px_rgba(0,0,0,0.02)] flex flex-col">
                            <h4 className="text-[13px] font-black text-[#2c3543] mb-4 border-b border-slate-100 pb-3 uppercase tracking-wider">
                                Verification Status
                            </h4>

                            <div className="flex-1 space-y-4">
                                {/* Status Indicator */}
                                <div className={`flex items-center gap-3 p-3.5 rounded-xl border ${
                                    txData.status === 'Completed' ? 'bg-emerald-50/80 border-emerald-200' :
                                    txData.status === 'Needs Update' ? 'bg-amber-50/80 border-amber-200' :
                                    txData.status === 'Rejected' ? 'bg-red-50/80 border-red-200' :
                                    'bg-amber-50/80 border-amber-200'
                                }`}>
                                    <span className={`w-2.5 h-2.5 rounded-full ${statusBadge.dotColor}`}></span>
                                    <div>
                                        <p className="text-[10.5px] font-extrabold uppercase text-slate-400 m-0">Current Status</p>
                                        <p className="text-[13px] font-black text-slate-900 m-0">{txData.status}</p>
                                    </div>
                                    {isSuperAdmin && !isEditingStatus && (
                                        <button 
                                            onClick={() => {
                                                setNewStatus(txData.status);
                                                setIsEditingStatus(true);
                                            }}
                                            className="ml-auto text-xs font-bold text-blue-600 hover:text-blue-800 flex items-center gap-1 cursor-pointer"
                                        >
                                            <Edit3 size={12} /> 
                                            <span>Edit</span>
                                        </button>
                                    )}
                                </div>

                                {/* Super Admin Status Edit Mode */}
                                {isSuperAdmin && isEditingStatus && (
                                    <div className="bg-blue-50 p-4 rounded-xl border border-blue-100 animate-in fade-in">
                                        <p className="text-[10.5px] font-extrabold text-blue-800 mb-2 uppercase tracking-wide">Super Admin Override</p>
                                        <select 
                                            className="w-full p-2 border border-blue-200 rounded-lg text-xs mb-3 outline-none bg-white font-bold text-slate-800"
                                            value={newStatus}
                                            onChange={(e) => setNewStatus(e.target.value)}
                                        >
                                            <option value="Pending Verification">Pending Verification</option>
                                            <option value="Completed">Completed</option>
                                            <option value="Needs Update">Needs Update</option>
                                            <option value="Rejected">Rejected</option>
                                            <option value="Refunded">Refunded</option>
                                        </select>
                                        <div className="flex gap-2">
                                            <button 
                                                className="flex-1 py-1.5 text-xs font-bold text-slate-600 hover:bg-blue-100 rounded-lg transition-colors cursor-pointer"
                                                onClick={() => setIsEditingStatus(false)}
                                                disabled={actionLoading}
                                            >
                                                Cancel
                                            </button>
                                            <button 
                                                className="flex-1 py-1.5 text-xs font-bold bg-[#2c3543] text-white rounded-lg hover:bg-[#1f2631] transition-colors disabled:opacity-50 cursor-pointer"
                                                onClick={handleUpdateStatus}
                                                disabled={actionLoading}
                                            >
                                                {actionLoading ? 'Updating...' : 'Force Update'}
                                            </button>
                                        </div>
                                    </div>
                                )}

                                {/* Verified By */}
                                {txData.verifiedBy && (
                                    <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-100">
                                        <p className="text-[10.5px] font-bold text-slate-400 uppercase tracking-wider mb-0.5">Verified By</p>
                                        <p className="text-xs font-bold text-slate-900 m-0">{txData.verifiedBy}</p>
                                        {txData.verifiedAt && (
                                            <p className="text-[11px] text-slate-400 mt-1 m-0">
                                                {new Date(txData.verifiedAt).toLocaleString('en-US', {
                                                    year: 'numeric', month: 'long', day: 'numeric',
                                                    hour: '2-digit', minute: '2-digit'
                                                })}
                                            </p>
                                        )}
                                    </div>
                                )}

                                {/* Admin Remarks */}
                                {txData.adminRemarks && (
                                    <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-100">
                                        <p className="text-[10.5px] font-bold text-slate-400 uppercase tracking-wider mb-0.5">Admin Remarks</p>
                                        <p className="text-xs text-slate-700 leading-relaxed m-0 font-medium">{txData.adminRemarks}</p>
                                    </div>
                                )}

                                {/* Timestamps */}
                                <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-100">
                                    <p className="text-[10.5px] font-bold text-slate-400 uppercase tracking-wider mb-2">Timeline</p>
                                    <div className="space-y-1.5 text-xs">
                                        <div className="flex justify-between">
                                            <span className="text-slate-400 font-medium">Submitted</span>
                                            <span className="text-slate-700 font-bold">{formattedDate}, {formattedTime}</span>
                                        </div>
                                        {txData.verifiedAt && (
                                            <div className="flex justify-between">
                                                <span className="text-slate-400 font-medium">Verified</span>
                                                <span className="text-slate-700 font-bold">
                                                    {new Date(txData.verifiedAt).toLocaleDateString('en-US', {
                                                        year: 'numeric', month: 'long', day: 'numeric'
                                                    })}
                                                </span>
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {/* Needs Update Notification Info */}
                                {txData.status === 'Needs Update' && (
                                    <div className="p-3.5 bg-amber-50 rounded-xl border border-amber-200">
                                        <p className="text-[10.5px] font-bold text-amber-700 uppercase tracking-wider mb-1">Awaiting Re-upload</p>
                                        <p className="text-xs text-amber-600 m-0">The user has been notified to upload a new receipt via the mobile app.</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Image Zoom Overlay */}
                {zoomedImage && (txData.imageUrl || txData.receiptImage) && (
                    <div
                        className="fixed inset-0 z-[1001] bg-black/80 flex items-center justify-center cursor-zoom-out p-4"
                        onClick={() => setZoomedImage(false)}
                    >
                        <img
                            src={(txData.imageUrl || txData.receiptImage).startsWith('http') ? (txData.imageUrl || txData.receiptImage) : `${API_BASE}${txData.receiptImage}`}
                            alt="Receipt Zoomed"
                            className="max-w-[90vw] max-h-[90vh] object-contain rounded-2xl shadow-2xl"
                        />
                    </div>
                )}

                {/* Feedback Modal */}
                {feedbackConfig && (
                    <FeedbackModal 
                        {...feedbackConfig} 
                        isOpen={!!feedbackConfig} 
                        onClose={() => setFeedbackConfig(null)} 
                    />
                )}
            </div>
        </Layout>
    );
};

export default TransactionDetails;
