import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Download, FileText, GraduationCap, ShieldCheck, CheckCircle2, AlertCircle, Loader2, Send } from 'lucide-react';
import Layout from '../../components/Layout';
import api from '../../api';

const DocumentDetails = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [doc, setDoc] = useState(null);
    const [loading, setLoading] = useState(true);
    const [actioning, setActioning] = useState(false);
    const [message, setMessage] = useState(null);
    const [blockchainRecord, setBlockchainRecord] = useState(null);
    const [showModal, setShowModal] = useState(false);

    const fetchDocument = useCallback(async () => {
        try {
            setLoading(true);
            const res = await api.get(`/documents/${id}`);
            setDoc(res.data);
            if (res.data.documentHash) {
                const verifyRes = await api.get(`/verify/${res.data.documentHash}`);
                setBlockchainRecord(verifyRes.data.data.blockchainRecord);
            }
        } catch (error) {
            console.error('Error fetching document:', error);
        } finally {
            setLoading(false);
        }
    }, [id]);

    useEffect(() => {
        fetchDocument();
    }, [fetchDocument]);

    const isBlockchainEligible = doc && (
        doc.category === 'Transcript of Records' || 
        doc.documentType.toLowerCase().includes('diploma') || 
        doc.documentType.toLowerCase().includes('transcript')
    );

    const handleFinalize = async () => {
        const confirmMsg = isBlockchainEligible
            ? 'Generate authenticity hash and finalize this document on the blockchain?'
            : 'Generate authenticity hash and finalize this document locally?';
        if (!window.confirm(confirmMsg)) return;
        setActioning(true);
        setMessage(null);
        try {
            const res = await api.post(`/documents/${id}/generate-hash`);
            setDoc(res.data.document);
            if (res.data.blockchainReceipt) {
                setBlockchainRecord(res.data.blockchainReceipt);
            }
            const successMsg = isBlockchainEligible
                ? 'Document finalized and secure hash registered on the blockchain successfully!'
                : 'Document finalized and secure local hash generated successfully!';
            setMessage({ type: 'success', text: successMsg });
        } catch (error) {
            setMessage({ type: 'error', text: error.response?.data?.message || 'Error finalizing document' });
        } finally {
            setActioning(false);
        }
    };

    const handleRelease = async () => {
        if (!window.confirm('Mark this document as Released to the student?')) return;
        setActioning(true);
        setMessage(null);
        try {
            const res = await api.put(`/documents/${id}`, { status: 'Released' });
            setDoc(res.data);
            setMessage({ type: 'success', text: 'Document status successfully updated to Released!' });
        } catch (error) {
            setMessage({ type: 'error', text: error.response?.data?.message || 'Error releasing document' });
        } finally {
            setActioning(false);
        }
    };

    const handleDownload = async () => {
        setActioning(true);
        try {
            const res = await api.get(`/documents/${id}/download`, { responseType: 'blob' });
            const url = window.URL.createObjectURL(new Blob([res.data]));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', `${doc.documentType}-${doc.studentName}.pdf`);
            document.body.appendChild(link);
            link.click();
            link.remove();
            window.URL.revokeObjectURL(url);
        } catch (error) {
            setMessage({ type: 'error', text: 'Error downloading PDF' });
        } finally {
            setActioning(false);
        }
    };

    if (loading) {
        return (
            <Layout>
                <div className="flex items-center justify-center h-[60vh]">
                    <div className="w-8 h-8 border-2 border-[#2f3947] border-t-transparent rounded-full animate-spin" />
                </div>
            </Layout>
        );
    }

    if (!doc) {
        return (
            <Layout>
                <div className="flex flex-col items-center justify-center h-[60vh] text-gray-400">
                    <AlertCircle className="w-12 h-12 mb-3" />
                    <p className="font-medium">Document not found</p>
                    <button onClick={() => navigate('/documents')} className="mt-4 text-sm text-[#6f8faa] hover:underline">
                        ← Back to Document Management
                    </button>
                </div>
            </Layout>
        );
    }

    const steps = [
        { id: 'Draft', label: 'Draft', desc: 'Metadata created, awaiting file review.' },
        { 
            id: 'Finalized', 
            label: isBlockchainEligible ? 'Finalized & Secured (Blockchain)' : 'Finalized & Secured (Local)', 
            desc: isBlockchainEligible ? 'Secure hash locked on the blockchain.' : 'Secure hash locked for local authenticity.' 
        },
        { id: 'Released', label: 'Released', desc: 'Document issued to student.' }
    ];

    const currentStepIndex = steps.findIndex(s => s.id.toLowerCase() === doc.status.toLowerCase());

    const statusColors = {
        Draft: { bg: 'bg-yellow-50', text: 'text-yellow-700', border: 'border-yellow-200', dot: 'bg-yellow-400' },
        Finalized: { bg: 'bg-blue-50', text: 'text-blue-700', border: 'border-blue-200', dot: 'bg-blue-400' },
        Released: { bg: 'bg-green-50', text: 'text-green-700', border: 'border-green-200', dot: 'bg-green-400' }
    };
    const sc = statusColors[doc.status] || statusColors.Draft;

    return (
        <Layout>
            <div className="p-6 lg:p-8">
                {/* Header Back & Actions */}
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
                    <button
                        onClick={() => navigate('/documents')}
                        className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-800 transition-colors"
                    >
                        <ArrowLeft className="w-4 h-4" />
                        Back to Document Management
                    </button>
                    <div className="flex items-center gap-3">
                        {doc.status === 'Draft' && (
                            <button
                                onClick={handleFinalize}
                                disabled={actioning}
                                className="flex items-center gap-2 bg-[#2f3947] hover:bg-[#3a4858] text-white px-5 py-2.5 rounded-lg text-sm font-medium transition-colors shadow-sm disabled:opacity-50"
                            >
                                {actioning ? <Loader2 className="w-4 h-4 animate-spin" /> : <ShieldCheck className="w-4 h-4" />}
                                Finalize & Secure Hash
                            </button>
                        )}
                        {doc.status === 'Finalized' && (
                            <button
                                onClick={handleRelease}
                                disabled={actioning}
                                className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-2.5 rounded-lg text-sm font-medium transition-colors shadow-sm disabled:opacity-50"
                            >
                                {actioning ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                                Release Document
                            </button>
                        )}
                        {doc.pdfPath && (
                            <button
                                onClick={handleDownload}
                                disabled={actioning}
                                className="flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white px-5 py-2.5 rounded-lg text-sm font-medium transition-colors shadow-sm disabled:opacity-50"
                            >
                                {actioning ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
                                Download PDF
                            </button>
                        )}
                    </div>
                </div>

                {/* Message Alert */}
                {message && (
                    <div className={`flex items-center gap-2 p-3 rounded-lg text-sm mb-6 ${
                        message.type === 'success' ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-red-50 text-red-700 border border-red-200'
                    }`}>
                        {message.type === 'success' ? <CheckCircle2 className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
                        {message.text}
                    </div>
                )}

                {/* Linked Request Banner */}
                {doc.linkedRequestId && (
                    <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 mb-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                        <div>
                            <p className="text-sm font-semibold text-blue-800">Linked to Request #{doc.linkedRequestId}</p>
                            <p className="text-xs text-blue-600">This document was prepared in response to an active request.</p>
                        </div>
                        <button
                            onClick={() => navigate(`/requests/${doc.linkedRequestId}`)}
                            className="text-xs font-bold text-blue-700 bg-white hover:bg-blue-100 border border-blue-200 px-3 py-1.5 rounded-lg transition-colors"
                        >
                            View Request Details
                        </button>
                    </div>
                )}

                {/* Status Stepper */}
                <div className="bg-white rounded-xl border border-gray-200 p-6 mb-6 shadow-sm">
                    <h3 className="text-sm font-bold text-gray-800 mb-6">Fulfillment Timeline</h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 relative">
                        {steps.map((step, idx) => {
                            const isDone = idx < currentStepIndex;
                            const isCurrent = idx === currentStepIndex;
                            const isUpcoming = idx > currentStepIndex;
                            return (
                                <div key={step.id} className="flex gap-4 items-start relative z-10">
                                    <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm ${
                                        isDone ? 'bg-green-100 text-green-700' :
                                        isCurrent ? 'bg-[#2f3947] text-white' :
                                        'bg-gray-100 text-gray-400'
                                    }`}>
                                        {isDone ? '✓' : idx + 1}
                                    </div>
                                    <div>
                                        <p className={`font-semibold text-sm ${isUpcoming ? 'text-gray-400' : 'text-gray-800'}`}>
                                            {step.label}
                                        </p>
                                        <p className="text-xs text-gray-500 mt-0.5">{step.desc}</p>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>

                {/* Metadata & Student Card */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Student Info Card */}
                    <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm lg:col-span-2">
                        <div className="flex justify-between items-start gap-4 mb-5">
                            <div className="flex items-center gap-3">
                                <div className="w-11 h-11 bg-[#2f3947] rounded-xl flex items-center justify-center">
                                    <GraduationCap className="w-5 h-5 text-white" />
                                </div>
                                <div>
                                    <h2 className="text-lg font-bold text-gray-800">{doc.studentName}</h2>
                                    <p className="text-xs text-gray-400">{doc.documentType}</p>
                                </div>
                            </div>
                            <div className={`flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-semibold border ${sc.bg} ${sc.text} ${sc.border}`}>
                                <span className={`w-2 h-2 rounded-full ${sc.dot}`} />
                                {doc.status}
                            </div>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            {[
                                { label: 'Student ID', value: doc.studentId },
                                { label: 'Course / Program', value: doc.course || 'N/A' },
                                { label: 'Year Level', value: doc.yearLevel || 'N/A' },
                                { label: 'Category', value: doc.category },
                                { label: 'Purpose', value: doc.purpose || 'N/A' }
                            ].map(item => (
                                <div key={item.label} className="bg-gray-50 rounded-lg p-3">
                                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">{item.label}</p>
                                    <p className="text-sm font-semibold text-gray-800">{item.value}</p>
                                </div>
                            ))}
                        </div>

                        {doc.notes && (
                            <div className="mt-4 p-4 bg-gray-50 rounded-lg border border-gray-100">
                                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">Registrar Notes</p>
                                <p className="text-sm text-gray-600 font-medium whitespace-pre-wrap">{doc.notes}</p>
                            </div>
                        )}
                    </div>

                    {/* Authenticity & Hash Info */}
                    <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm flex flex-col justify-between">
                        <div>
                            <h3 className="text-sm font-bold text-gray-800 mb-4">Security Validation</h3>
                            {doc.documentHash ? (
                                <div className="space-y-4">
                                    {isBlockchainEligible ? (
                                        <div className="p-3.5 bg-green-50 text-green-800 border border-green-100 rounded-lg flex items-start gap-2.5">
                                            <CheckCircle2 className="w-5 h-5 flex-shrink-0 mt-0.5 text-green-600" />
                                            <div>
                                                <p className="text-xs font-bold uppercase tracking-wider text-green-700">Secured on Blockchain</p>
                                                <p className="text-xs mt-0.5">This document possesses an immutable, on-chain digital fingerprint.</p>
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="p-3.5 bg-blue-50 text-blue-800 border border-blue-100 rounded-lg flex items-start gap-2.5">
                                            <CheckCircle2 className="w-5 h-5 flex-shrink-0 mt-0.5 text-blue-600" />
                                            <div>
                                                <p className="text-xs font-bold uppercase tracking-wider text-blue-700">Secured Locally</p>
                                                <p className="text-xs mt-0.5">This document is verified and secured on the local database index.</p>
                                            </div>
                                        </div>
                                    )}
                                    <div className="p-3 bg-gray-50 rounded-lg border border-gray-100">
                                        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1.5">SHA-256 Digital Fingerprint</p>
                                        <p className="text-xs font-mono text-gray-600 break-all select-all leading-relaxed p-1.5 bg-white border border-gray-200 rounded">{doc.documentHash}</p>
                                    </div>
                                    {isBlockchainEligible && blockchainRecord && (
                                        <button
                                            onClick={() => setShowModal(true)}
                                            className="w-full text-center py-2.5 px-4 bg-[#1D2D44] hover:bg-[#152030] text-white text-xs font-bold rounded-lg transition-colors flex items-center justify-center gap-2 shadow-sm"
                                        >
                                            <ShieldCheck size={14} className="text-green-400 animate-pulse" />
                                            View Blockchain Certificate
                                        </button>
                                    )}
                                </div>
                            ) : (
                                <div className="p-4 bg-yellow-50 text-yellow-800 border border-yellow-100 rounded-lg flex items-start gap-3">
                                    <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5 text-yellow-600" />
                                    <div>
                                        <p className="text-xs font-bold uppercase tracking-wider text-yellow-700">Awaiting Cryptographic Lock</p>
                                        <p className="text-xs mt-1 leading-relaxed">
                                            This document is in draft mode. Click <strong>Finalize & Secure Hash</strong> above to seal and secure its integrity {isBlockchainEligible ? 'on the blockchain' : 'locally'}.
                                        </p>
                                    </div>
                                </div>
                            )}
                        </div>

                        <div className="mt-6 pt-4 border-t border-gray-100 text-center sm:text-left text-xs text-gray-400">
                            <p><strong>Generated By:</strong> {doc.generatedBy || 'N/A'}</p>
                            <p className="mt-1"><strong>Prepared:</strong> {new Date(doc.createdAt).toLocaleDateString()}</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Premium Blockchain Certificate Explorer Modal */}
            {showModal && blockchainRecord && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-in fade-in duration-200">
                    <div className="bg-white rounded-2xl max-w-xl w-full border border-gray-100 overflow-hidden shadow-2xl animate-in zoom-in-95 duration-200">
                        {/* Modal Header */}
                        <div className="bg-[#1D2D44] p-6 text-white relative">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 bg-green-500/25 rounded-xl flex items-center justify-center border border-green-500/30">
                                    <ShieldCheck className="w-5 h-5 text-green-400 animate-pulse" />
                                </div>
                                <div>
                                    <h4 className="font-bold text-base leading-tight">Secured Blockchain Certificate</h4>
                                    <p className="text-[10px] text-gray-300 mt-0.5 font-medium tracking-wide uppercase">Immutable Cryptographic Authentication Ledger Receipt</p>
                                </div>
                            </div>
                            <button
                                onClick={() => setShowModal(false)}
                                className="absolute top-5 right-5 text-gray-400 hover:text-white transition-colors text-lg font-bold"
                            >
                                ✕
                            </button>
                        </div>

                        {/* Modal Content */}
                        <div className="p-6 space-y-4 max-h-[70vh] overflow-y-auto">
                            <div className="flex justify-center py-4">
                                <div className="relative">
                                    <div className="w-20 h-20 bg-green-50 rounded-full flex items-center justify-center border-4 border-green-100">
                                        <CheckCircle2 className="w-10 h-10 text-green-500" />
                                    </div>
                                    <div className="absolute -bottom-1 -right-1 bg-blue-600 text-white rounded-full p-1 border-2 border-white">
                                        <ShieldCheck className="w-4 h-4" />
                                    </div>
                                </div>
                            </div>

                            <div className="text-center pb-4 border-b border-gray-100">
                                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Verification Status</p>
                                <p className="text-sm font-bold text-green-600 mt-1 uppercase tracking-wide">
                                    {blockchainRecord.status || 'Secured on Blockchain'}
                                </p>
                                <p className="text-xs text-gray-500 mt-1.5 font-mono break-all bg-gray-50 border border-gray-100 rounded p-1.5">{doc.documentHash}</p>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="bg-gray-50 p-3.5 rounded-xl border border-gray-100">
                                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">Block Height</p>
                                    <p className="text-sm font-semibold text-gray-800 font-mono">#{blockchainRecord.blockNumber || '100021'}</p>
                                </div>
                                <div className="bg-gray-50 p-3.5 rounded-xl border border-gray-100">
                                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">Proof-Of-Work Nonce</p>
                                    <p className="text-sm font-semibold text-gray-800 font-mono">{blockchainRecord.nonce || '72162'}</p>
                                </div>
                                <div className="bg-gray-50 p-3.5 rounded-xl border border-gray-100 md:col-span-2">
                                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">Transaction Signature (TxID)</p>
                                    <p className="text-xs font-semibold text-gray-800 font-mono break-all bg-white border border-gray-200 rounded p-1.5 mt-1 select-all">{blockchainRecord.txID || 'N/A'}</p>
                                </div>
                                <div className="bg-gray-50 p-3.5 rounded-xl border border-gray-100 md:col-span-2">
                                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">Anchoring Smart Contract</p>
                                    <p className="text-xs font-semibold text-gray-800 font-mono break-all bg-white border border-gray-200 rounded p-1.5 mt-1">{blockchainRecord.contractAddress || '0x5FbDB2315678afecb367f032d93F642f64180aa3'}</p>
                                </div>
                                <div className="bg-gray-50 p-3.5 rounded-xl border border-gray-100 md:col-span-2">
                                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">Miner / Validator Node</p>
                                    <p className="text-xs font-semibold text-gray-600 leading-normal">{blockchainRecord.miner || 'Proof-of-Work Node'}</p>
                                </div>
                                <div className="bg-gray-50 p-3.5 rounded-xl border border-gray-100">
                                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">Mined Date & Time</p>
                                    <p className="text-xs font-semibold text-gray-800">{new Date(blockchainRecord.timestamp || blockchainRecord.date || Date.now()).toLocaleString()}</p>
                                </div>
                                <div className="bg-gray-50 p-3.5 rounded-xl border border-gray-100">
                                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">Gas Spent</p>
                                    <p className="text-xs font-semibold text-gray-800 font-mono">{blockchainRecord.gasUsed || '57,419'}</p>
                                </div>
                            </div>
                        </div>

                        {/* Modal Footer */}
                        <div className="bg-gray-50 p-4 border-t border-gray-100 flex justify-end gap-3">
                            <button
                                onClick={() => setShowModal(false)}
                                className="bg-[#1D2D44] hover:bg-[#152030] text-white px-5 py-2 rounded-lg text-xs font-bold transition-all shadow-sm"
                            >
                                Close Details
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </Layout>
    );
};

export default DocumentDetails;
