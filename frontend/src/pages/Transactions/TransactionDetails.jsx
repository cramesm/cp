import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Layout from '../../components/Layout';
import api from '../../api';
import { ArrowLeft, CheckCircle, XCircle, Clock, Image as ImageIcon, Eye, CreditCard, AlertCircle, User, FileText, RefreshCw } from 'lucide-react';

const API_BASE = (import.meta.env.VITE_API_URL ? import.meta.env.VITE_API_URL.replace('/api', '') : '') || 'http://127.0.0.1:5000';

const TransactionDetails = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [txData, setTxData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [zoomedImage, setZoomedImage] = useState(false);

    useEffect(() => {
        const fetchTransaction = async () => {
            try {
                const res = await api.get(`/transactions/${id}`);
                setTxData(res.data);
            } catch (error) {
                console.error("Error fetching transaction:", error);
                // Fallback: try to find in list
                try {
                    const listRes = await api.get('/transactions');
                    const found = listRes.data.find(tx => tx.transactionId === id);
                    if (found) setTxData(found);
                } catch (e) {
                    console.error("Fallback also failed:", e);
                }
            } finally {
                setLoading(false);
            }
        };
        fetchTransaction();
    }, [id]);

    if (loading) {
        return (
            <Layout>
                <div className="p-8 flex items-center justify-center min-h-[400px] text-gray-400">
                    <div className="flex flex-col items-center gap-3">
                        <div className="w-8 h-8 border-3 border-gray-300 border-t-[#1D2D44] rounded-full animate-spin"></div>
                        <span className="text-sm font-medium">Loading Transaction...</span>
                    </div>
                </div>
            </Layout>
        );
    }

    if (!txData) {
        return (
            <Layout>
                <div className="flex flex-col items-center justify-center min-h-[500px] text-gray-500">
                    <AlertCircle size={48} className="mb-4 text-red-400" />
                    <h2 className="text-xl font-bold">Transaction Not Found</h2>
                    <p className="text-sm text-gray-400 mt-1">Transaction ID: {id}</p>
                    <button
                        onClick={() => navigate('/transactions')}
                        className="mt-6 bg-[#1D2D44] text-white px-6 py-2 rounded-full font-bold text-xs hover:bg-[#152030] transition-all uppercase tracking-widest"
                    >
                        Back to Transactions
                    </button>
                </div>
            </Layout>
        );
    }

    const getStatusBadge = (status) => {
        switch (status) {
            case 'Completed': return { style: 'text-[#2D6A8E] bg-[#C6E7FF]', icon: <CheckCircle size={14} /> };
            case 'Pending Verification': return { style: 'text-[#857A00] bg-[#FCF7B0]', icon: <Clock size={14} /> };
            case 'Needs Update': return { style: 'text-[#A32A2A] bg-[#FFC1C1]', icon: <RefreshCw size={14} /> };
            case 'Rejected': return { style: 'text-[#F04438] bg-[#FFD1D1]', icon: <XCircle size={14} /> };
            default: return { style: 'text-gray-600 bg-gray-100', icon: <Clock size={14} /> };
        }
    };

    const getPaymentModeStyle = (mode) => {
        switch (mode) {
            case 'GCash': return 'bg-[#E0F0FF] text-[#0070E0]';
            case 'Maya': return 'bg-[#E8F5E8] text-[#2E7D32]';
            case 'GoThyme': return 'bg-[#FFF3E0] text-[#E65100]';
            default: return 'bg-gray-100 text-gray-600';
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
            <div className="p-8 bg-[#F8FAFC] min-h-screen font-sans">

                {/* Header */}
                <div className="max-w-[1100px] mx-auto mb-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                        <h2 className="text-[22px] font-bold text-[#1D2D44] flex items-center gap-3">
                            Transaction: {txData.transactionId}
                            <span className={`inline-flex items-center gap-1.5 px-4 py-1 rounded-full text-xs uppercase tracking-widest font-bold ${statusBadge.style}`}>
                                {statusBadge.icon} {txData.status}
                            </span>
                        </h2>
                        <p className="text-sm text-gray-400 mt-1">
                            Submitted on {formattedDate} at {formattedTime}
                        </p>
                    </div>
                    <button
                        onClick={() => navigate('/transactions')}
                        className="flex items-center gap-2 bg-[#1D2D44] text-white px-6 py-2 rounded-full font-bold text-xs hover:bg-[#152030] transition-all uppercase tracking-widest shadow-md"
                    >
                        <ArrowLeft size={14} /> Back to List
                    </button>
                </div>

                <div className="max-w-[1100px] mx-auto space-y-6">

                    {/* Row 1: Payer Info + Payment Summary */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

                        {/* Payer Information */}
                        <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm">
                            <h4 className="text-[14px] font-bold text-[#1D2D44] mb-5 border-b border-gray-50 pb-3 uppercase tracking-wider flex items-center gap-2">
                                <User size={16} /> Payer Information
                            </h4>
                            <div className="grid grid-cols-[140px_1fr] gap-y-4 text-[13px]">
                                <span className="text-gray-400 font-bold">Payer Name:</span>
                                <span className="text-[#1D2D44] font-bold">{txData.payerName || txData.name}</span>

                                <span className="text-gray-400 font-bold">Email:</span>
                                <span className="text-gray-700">{txData.payerEmail || 'Not provided'}</span>

                                <span className="text-gray-400 font-bold">Type:</span>
                                <span className="text-gray-700 font-medium">{txData.payerType || 'Student'}</span>

                                <span className="text-gray-400 font-bold">Request ID:</span>
                                <span className="text-gray-700 font-mono">{txData.requestId}</span>
                            </div>
                        </div>

                        {/* Payment Summary */}
                        <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm">
                            <h4 className="text-[14px] font-bold text-[#1D2D44] mb-5 border-b border-gray-50 pb-3 uppercase tracking-wider flex items-center gap-2">
                                <CreditCard size={16} /> Payment Summary
                            </h4>
                            <div className="grid grid-cols-[140px_1fr] gap-y-4 text-[13px]">
                                <span className="text-gray-400 font-bold">Document:</span>
                                <span className="text-gray-800 font-medium">{txData.documentType}</span>

                                <span className="text-gray-400 font-bold">Amount:</span>
                                <span className="text-[#1D2D44] font-bold text-[16px]">₱{txData.amount || '0.00'}</span>

                                <span className="text-gray-400 font-bold">Payment Mode:</span>
                                <span className={`inline-flex items-center w-fit px-3 py-1 rounded text-[10px] font-bold uppercase ${getPaymentModeStyle(txData.paymentMode)}`}>
                                    {txData.paymentMode}
                                </span>

                                <span className="text-gray-400 font-bold">Status:</span>
                                <span className={`inline-flex items-center gap-1.5 w-fit px-3 py-1 rounded-full text-[10px] font-bold uppercase ${statusBadge.style}`}>
                                    {statusBadge.icon} {txData.status}
                                </span>
                            </div>
                        </div>
                    </div>

                    {/* Row 2: Receipt Image + Verification Status */}
                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">

                        {/* Receipt Image */}
                        <div className="lg:col-span-7 bg-white p-6 rounded-xl border border-gray-100 shadow-sm">
                            <h4 className="text-[14px] font-bold text-[#1D2D44] mb-5 border-b border-gray-50 pb-3 uppercase tracking-wider flex items-center gap-2">
                                <FileText size={16} /> Uploaded Payment Receipt
                            </h4>
                            <div className="bg-[#F9FAFF] border border-dashed border-gray-200 rounded-xl p-6">
                                {txData.receiptImage ? (
                                    <div className="flex flex-col items-center gap-4">
                                        <img
                                            src={txData.receiptImage.startsWith('http') ? txData.receiptImage : `${API_BASE}${txData.receiptImage}`}
                                            alt="Payment Receipt"
                                            className="max-h-[400px] object-contain rounded-lg shadow-sm cursor-pointer hover:shadow-md transition-shadow"
                                            onClick={() => setZoomedImage(true)}
                                        />
                                        <button
                                            onClick={() => setZoomedImage(true)}
                                            className="bg-[#1D2D44] text-white px-8 py-2.5 rounded-full font-bold text-xs flex items-center gap-2 hover:bg-[#152030] transition-all"
                                        >
                                            <Eye size={16} /> View Full Size
                                        </button>
                                    </div>
                                ) : (
                                    <div className="flex flex-col items-center text-center gap-4 py-10">
                                        <div className="bg-gray-200 p-4 rounded-full text-gray-400">
                                            <ImageIcon size={32} />
                                        </div>
                                        <p className="text-[14px] font-bold text-gray-400">No receipt image uploaded</p>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Verification Status */}
                        <div className="lg:col-span-5 bg-white p-6 rounded-xl border border-gray-100 shadow-sm flex flex-col">
                            <h4 className="text-[14px] font-bold text-[#1D2D44] mb-5 border-b border-gray-50 pb-3 uppercase tracking-wider">
                                Verification Status
                            </h4>

                            <div className="flex-1 space-y-5">
                                {/* Status Indicator */}
                                <div className={`flex items-center gap-3 p-4 rounded-lg border ${
                                    txData.status === 'Completed' ? 'bg-[#E1FFEB] border-[#C3E6CB]' :
                                    txData.status === 'Needs Update' ? 'bg-[#FFF3CD] border-[#FFEAA7]' :
                                    txData.status === 'Rejected' ? 'bg-[#FFE8E8] border-[#FFD1D1]' :
                                    'bg-[#FCF7B0] border-[#F0E68C]'
                                }`}>
                                    {txData.status === 'Completed' ? (
                                        <CheckCircle size={20} className="text-green-600" />
                                    ) : txData.status === 'Rejected' ? (
                                        <XCircle size={20} className="text-red-500" />
                                    ) : txData.status === 'Needs Update' ? (
                                        <RefreshCw size={20} className="text-amber-600" />
                                    ) : (
                                        <Clock size={20} className="text-amber-600" />
                                    )}
                                    <div>
                                        <p className="text-[12px] font-bold uppercase text-gray-500">Current Status</p>
                                        <p className="text-[14px] font-bold text-gray-800">{txData.status}</p>
                                    </div>
                                </div>

                                {/* Verified By */}
                                {txData.verifiedBy && (
                                    <div className="p-4 bg-gray-50 rounded-lg border border-gray-100">
                                        <p className="text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-1">Verified By</p>
                                        <p className="text-[13px] font-bold text-[#1D2D44]">{txData.verifiedBy}</p>
                                        {txData.verifiedAt && (
                                            <p className="text-[11px] text-gray-400 mt-1">
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
                                    <div className="p-4 bg-gray-50 rounded-lg border border-gray-100">
                                        <p className="text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-1">Admin Remarks</p>
                                        <p className="text-[13px] text-gray-700 leading-relaxed">{txData.adminRemarks}</p>
                                    </div>
                                )}

                                {/* Timestamps */}
                                <div className="p-4 bg-gray-50 rounded-lg border border-gray-100">
                                    <p className="text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-2">Timeline</p>
                                    <div className="space-y-2 text-[12px]">
                                        <div className="flex justify-between">
                                            <span className="text-gray-500">Submitted</span>
                                            <span className="text-gray-700 font-medium">{formattedDate}, {formattedTime}</span>
                                        </div>
                                        {txData.verifiedAt && (
                                            <div className="flex justify-between">
                                                <span className="text-gray-500">Verified</span>
                                                <span className="text-gray-700 font-medium">
                                                    {new Date(txData.verifiedAt).toLocaleDateString('en-US', {
                                                        year: 'numeric', month: 'long', day: 'numeric'
                                                    })}
                                                </span>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Image Zoom Overlay */}
                {zoomedImage && txData.receiptImage && (
                    <div
                        className="fixed inset-0 z-[1001] bg-black/80 flex items-center justify-center cursor-zoom-out"
                        onClick={() => setZoomedImage(false)}
                    >
                        <img
                            src={txData.receiptImage.startsWith('http') ? txData.receiptImage : `${API_BASE}${txData.receiptImage}`}
                            alt="Receipt Zoomed"
                            className="max-w-[90vw] max-h-[90vh] object-contain rounded-lg shadow-2xl"
                        />
                    </div>
                )}
            </div>
        </Layout>
    );
};

export default TransactionDetails;
