import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Info, Plus } from 'lucide-react';
import Layout from '../../components/Layout';
import api from '../../api';
import { CheckCircle2, Circle, Clock, FileText, Send, ShieldCheck, ChevronRight, AlertCircle, FileSearch, Trash2, Printer, ExternalLink } from 'lucide-react';

const RequestDetails = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [requestData, setRequestData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [activeModal, setActiveModal] = useState(null);
    const [uploadedFiles, setUploadedFiles] = useState([]);
    const [confirmed, setConfirmed] = useState(false);
    const [rejectionReason, setRejectionReason] = useState('');
    const [actionLoading, setActionLoading] = useState(false);
    const [processingStep, setProcessingStep] = useState(1); // 1: Verify, 2: Upload, 3: Confirm

    const handlePrint = () => {
        window.print();
    };

    const fetchData = async () => {
        try {
            const res = await api.get('/requests');
            // Backend currently doesn't have GET /requests/:id, so we find in list
            const found = res.data.find(r => r.requestId === id);
            if (found) {
                setRequestData(found);
            } else {
                // Fallback for demo if not in DB yet
                setRequestData({
                    requestId: id,
                    name: 'Guest User',
                    status: 'Pending',
                    dateRequested: new Date().toISOString()
                });
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

    const openModal = (modalName) => {
        setActiveModal(modalName);
        if (modalName === 'upload') setProcessingStep(1);
    };
    const closeModal = () => { setActiveModal(null); setConfirmed(false); setProcessingStep(1); };

    const handleFileUpload = (e) => {
        const files = Array.from(e.target.files);
        setUploadedFiles(files);
    };

    const handleStatusUpdate = async (newStatus) => {
        setActionLoading(true);
        try {
            await api.put(`/requests/${id}`, { status: newStatus });
            fetchData();
            closeModal();
        } catch (err) {
            alert(err.response?.data?.message || 'Update failed');
        } finally {
            setActionLoading(false);
        }
    };

    const handleGenerateHash = async () => {
        setActionLoading(true);
        try {
            await api.post(`/requests/${id}/generate-hash`);
            fetchData();
            alert('Document Hash generated successfully!');
        } catch (err) {
            alert(err.response?.data?.message || 'Hash generation failed');
        } finally {
            setActionLoading(false);
        }
    };

    if (loading) {
        return <Layout><div className="p-5">Loading Request Details...</div></Layout>;
    }

    if (!requestData) {
        return <Layout><div className="p-5 text-red-500">Request not found.</div></Layout>;
    }

    const { name, status, dateRequested, documentHash, document_type, purpose } = requestData;

    const steps = [
        { id: 'Pending', label: 'Request Received', icon: Clock, desc: 'Student submitted the request' },
        { id: 'In Process', label: 'Processing', icon: FileSearch, desc: 'Registrar is verifying documents' },
        { id: 'Approved', label: 'Approved', icon: ShieldCheck, desc: 'Document verified & hashed' },
        { id: 'Released', label: 'Released', icon: Send, desc: 'Final document released' }
    ];

    const currentStepIndex = steps.findIndex(s => s.id.toLowerCase() === status.toLowerCase());
    const isRejected = status.toLowerCase() === 'rejected';

    return (
        <Layout>
            <div className="p-8 bg-[#f8fafc] min-h-screen">
                {/* Header & Main Actions */}
                <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 mb-8 bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
                    <div>
                        <div className="flex items-center gap-3 mb-1">
                            <h1 className="text-2xl font-bold text-slate-800 tracking-tight">Request #{id}</h1>
                            {isRejected && <span className="bg-red-50 text-red-600 text-[10px] font-bold uppercase px-3 py-1 rounded-full border border-red-100 flex items-center gap-1"><AlertCircle size={12}/> Rejected</span>}
                        </div>
                        <p className="text-slate-500 text-sm flex items-center gap-2">
                            <FileText size={14} className="text-slate-400" /> 
                            {document_type || 'Transcript of Records'} 
                            <span className="text-slate-300">|</span> 
                            Requested on {new Date(dateRequested).toLocaleDateString()}
                        </p>
                    </div>
                    
                    <div className="flex items-center gap-3 no-print">
                        <button 
                            className="flex items-center gap-2 px-4 py-2 text-slate-600 hover:bg-slate-50 rounded-xl transition-all text-sm font-medium border border-slate-200"
                            onClick={handlePrint}
                        >
                            <Printer size={16} /> Print
                        </button>
                    </div>
                </div>

                {/* --- NEW: Step-by-Step Stepper --- */}
                {!isRejected && (
                    <div className="bg-white p-8 rounded-2xl shadow-sm border border-slate-100 mb-8">
                        <div className="relative flex justify-between items-start max-w-4xl mx-auto">
                            {/* Connecting Lines */}
                            <div className="absolute top-5 left-0 w-full h-[2px] bg-slate-100 -z-0"></div>
                            <div 
                                className="absolute top-5 left-0 h-[2px] bg-blue-600 transition-all duration-700 -z-0" 
                                style={{ width: `${(Math.max(0, currentStepIndex) / (steps.length - 1)) * 100}%` }}
                            ></div>

                            {steps.map((step, index) => {
                                const Icon = step.icon;
                                const isCompleted = index < currentStepIndex;
                                const isActive = index === currentStepIndex;
                                
                                return (
                                    <div key={step.id} className="relative z-10 flex flex-col items-center group">
                                        <div className={`w-10 h-10 rounded-full flex items-center justify-center transition-all duration-500 ${
                                            isCompleted ? 'bg-blue-600 text-white' : 
                                            isActive ? 'bg-white border-4 border-blue-600 text-blue-600 scale-110 shadow-lg' : 
                                            'bg-slate-100 text-slate-400 border-4 border-white'
                                        }`}>
                                            {isCompleted ? <CheckCircle2 size={20} /> : <Icon size={20} />}
                                        </div>
                                        <div className="mt-4 text-center">
                                            <p className={`text-xs font-bold uppercase tracking-wider ${isActive ? 'text-blue-600' : 'text-slate-500'}`}>{step.label}</p>
                                            <p className="text-[10px] text-slate-400 mt-1 max-w-[100px] hidden md:block leading-tight">{step.desc}</p>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                )}

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
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
                                        <div>
                                            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-1">Purpose of Request</label>
                                            <p className="text-slate-700">{purpose || 'General Requirement'}</p>
                                        </div>
                                    </div>
                                    <div className="space-y-6">
                                        <div>
                                            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-1">Document Requested</label>
                                            <p className="text-slate-800 font-semibold">{document_type || 'Transcript of Records'}</p>
                                        </div>
                                        <div>
                                            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-1">Quantity</label>
                                            <p className="text-slate-700">1 Copy</p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </section>

                        {/* Verification Summary */}
                        <section className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
                            <div className="p-6 border-b border-slate-50 bg-slate-50/50">
                                <h3 className="text-sm font-bold text-slate-700 uppercase tracking-widest flex items-center gap-2">
                                    <ShieldCheck size={16} className="text-green-500" /> Blockchain & Security
                                </h3>
                            </div>
                            <div className="p-8">
                                {documentHash ? (
                                    <div className="space-y-6">
                                        <div className="p-6 bg-slate-50 rounded-2xl border border-slate-100">
                                            <div className="flex justify-between items-center mb-4">
                                                <span className="text-[10px] font-black text-slate-400 uppercase tracking-[2px]">SHA-256 Digital Hash</span>
                                                <span className="bg-green-100 text-green-700 text-[9px] font-bold px-2 py-0.5 rounded uppercase tracking-tighter">Verified</span>
                                            </div>
                                            <code className="text-sm text-slate-600 break-all font-mono leading-relaxed block">{documentHash}</code>
                                        </div>
                                        <div className="flex items-center gap-4 text-xs">
                                            <div className="flex-1 p-4 bg-blue-50 rounded-xl border border-blue-100">
                                                <p className="text-blue-400 font-bold uppercase text-[9px] mb-1">Authenticity</p>
                                                <p className="text-blue-800 font-bold">Document Genuine</p>
                                            </div>
                                            <div className="flex-1 p-4 bg-purple-50 rounded-xl border border-purple-100">
                                                <p className="text-purple-400 font-bold uppercase text-[9px] mb-1">Security</p>
                                                <p className="text-purple-800 font-bold">Hashed Locally</p>
                                            </div>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="py-10 text-center border-2 border-dashed border-slate-100 rounded-3xl">
                                        <AlertCircle size={40} className="text-slate-200 mx-auto mb-4" />
                                        <p className="text-slate-400 font-medium italic">Document has not been hashed yet</p>
                                    </div>
                                )}
                            </div>
                        </section>
                    </div>

                    {/* Sidebar Actions */}
                    <div className="space-y-8">
                        <section className="bg-white p-8 rounded-2xl shadow-sm border border-slate-100">
                            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-6">Action Required</h3>
                            
                            {isRejected ? (
                                <div className="p-4 bg-red-50 rounded-xl border border-red-100">
                                    <p className="text-red-700 font-bold text-sm mb-1">Request Rejected</p>
                                    <p className="text-red-600 text-xs italic">"{rejectionReason || 'No reason provided'}"</p>
                                </div>
                            ) : (
                                <div className="space-y-4">
                                    {status === 'Pending' && (
                                        <button 
                                            className="w-full bg-[#2c3e50] text-white py-4 rounded-xl font-bold text-sm hover:bg-[#1a252f] transition-all flex items-center justify-center gap-3 shadow-lg shadow-slate-100" 
                                            onClick={() => openModal('upload')}
                                            disabled={actionLoading}
                                        >
                                            <FileSearch size={18} /> Start Processing
                                        </button>
                                    )}
                                    {status === 'In Process' && (
                                        <button 
                                            className="w-full bg-green-600 text-white py-4 rounded-xl font-bold text-sm hover:bg-green-700 transition-all flex items-center justify-center gap-3 shadow-lg shadow-green-100" 
                                            onClick={() => openModal('approve')}
                                            disabled={actionLoading}
                                        >
                                            <CheckCircle2 size={18} /> Complete Review
                                        </button>
                                    )}
                                    {status === 'Approved' && (
                                        <button 
                                            className="w-full bg-blue-600 text-white py-4 rounded-xl font-bold text-sm hover:bg-blue-700 transition-all flex items-center justify-center gap-3 shadow-lg shadow-blue-100" 
                                            onClick={() => openModal('release')}
                                            disabled={actionLoading}
                                        >
                                            <Send size={18} /> Finalize & Release
                                        </button>
                                    )}
                                    {status === 'Released' && (
                                        <div className="space-y-6">
                                            <div className="p-6 bg-green-50 rounded-2xl border border-green-100 flex flex-col items-center gap-4 text-center">
                                                <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-100">
                                                    <img 
                                                        src={`https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(`${window.location.origin}/verify?hash=${documentHash}`)}`} 
                                                        alt="Verification QR Code"
                                                        className="w-32 h-32"
                                                    />
                                                </div>
                                                <div>
                                                    <p className="text-green-800 font-bold text-sm mb-1 flex items-center justify-center gap-2">
                                                        <CheckCircle2 size={18} /> Verification Ready
                                                    </p>
                                                    <p className="text-green-600 text-[10px] uppercase font-bold tracking-widest leading-tight">
                                                        Scan to verify original document<br/>on the public portal
                                                    </p>
                                                </div>
                                            </div>
                                            
                                            <div className="flex gap-2 no-print">
                                                <button 
                                                    className="flex-1 py-3 px-4 bg-slate-800 text-white rounded-xl text-xs font-bold hover:bg-slate-900 transition-all flex items-center justify-center gap-2"
                                                    onClick={() => window.open(`${window.location.origin}/verify?hash=${documentHash}`, '_blank')}
                                                >
                                                    <ExternalLink size={14} /> Open Portal
                                                </button>
                                                <button 
                                                    className="flex-1 py-3 px-4 border border-slate-200 text-slate-600 rounded-xl text-xs font-bold hover:bg-slate-50 transition-all flex items-center justify-center gap-2"
                                                    onClick={handlePrint}
                                                >
                                                    <Printer size={14} /> Print Slip
                                                </button>
                                            </div>
                                        </div>
                                    )}
                                    
                                    <div className="pt-4 mt-4 border-t border-slate-50">
                                        <button 
                                            className="w-full py-3 text-slate-400 hover:text-red-500 transition-colors text-xs font-bold uppercase tracking-widest flex items-center justify-center gap-2" 
                                            onClick={() => openModal('reject')}
                                            disabled={status === 'Rejected' || status === 'Released' || actionLoading}
                                        >
                                            <Trash2 size={14} /> Reject Request
                                        </button>
                                    </div>
                                </div>
                            )}
                        </section>

                        <section className="bg-[#2c3e50] text-white p-8 rounded-2xl shadow-xl shadow-slate-200">
                            <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[3px] mb-6">Next Step</h3>
                            <div className="flex gap-4 items-start">
                                <div className="bg-white/10 p-3 rounded-lg text-white">
                                    <ChevronRight size={20} />
                                </div>
                                <div>
                                    <p className="font-bold mb-1">
                                        {status === 'Pending' ? 'Begin Verification' :
                                         status === 'In Process' ? 'Confirm Document' :
                                         status === 'Approved' ? 'Final Release' :
                                         'Process Completed'}
                                    </p>
                                    <p className="text-xs text-slate-400 leading-relaxed">
                                        {status === 'Pending' ? 'Verify the students identity and requirements before processing.' :
                                         status === 'In Process' ? 'Ensure all files are correctly uploaded and hash is generated.' :
                                         status === 'Approved' ? 'Make the document available for external verification.' :
                                         'All steps are finalized. Document is secured.'}
                                    </p>
                                </div>
                            </div>
                        </section>
                    </div>
                </div>

                {/* --- Modals (Kept with subtle styling updates) --- */}
                {activeModal === 'reject' && (
                    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[2000] flex justify-center items-center p-6 animate-in fade-in duration-300">
                        <div className="bg-white rounded-3xl p-10 shadow-2xl w-full max-w-md animate-in zoom-in-95 duration-300">
                            <div className="bg-red-50 w-16 h-16 rounded-full flex items-center justify-center text-red-600 mb-6">
                                <AlertCircle size={32} />
                            </div>
                            <h3 className="text-xl font-bold mb-2 text-slate-800">Reject Request</h3>
                            <p className="text-slate-500 text-sm mb-8">Please provide a reason for rejecting this document request.</p>
                            
                            <div className="mb-8">
                                <label className="block text-[10px] font-black text-slate-400 mb-3 uppercase tracking-widest">Reason for Rejection</label>
                                <select 
                                    className="w-full py-4 px-5 bg-slate-50 border border-slate-200 rounded-2xl outline-none focus:border-red-500 transition-all font-medium text-slate-700"
                                    value={rejectionReason}
                                    onChange={(e) => setRejectionReason(e.target.value)}
                                >
                                    <option value="" disabled>Select Reason</option>
                                    <option value="incomplete">Incomplete Documents</option>
                                    <option value="invalid">Invalid Information</option>
                                    <option value="mismatch">Data Mismatch</option>
                                </select>
                            </div>

                            <div className="flex gap-3">
                                <button className="flex-1 py-4 text-slate-400 font-bold text-sm hover:bg-slate-50 rounded-2xl transition-all" onClick={closeModal}>Cancel</button>
                                <button 
                                    className="flex-[2] bg-red-600 text-white py-4 rounded-2xl font-bold text-sm hover:bg-red-700 transition-all shadow-lg shadow-red-100" 
                                    onClick={() => handleStatusUpdate('Rejected')}
                                    disabled={!rejectionReason || actionLoading}
                                >
                                    Reject Forever
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {activeModal === 'upload' && (
                    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[2000] flex justify-center items-center p-6 animate-in fade-in duration-300">
                        <div className="bg-white rounded-3xl p-10 shadow-2xl w-full max-w-xl animate-in zoom-in-95 duration-300">
                            
                            {/* Modal Internal Stepper */}
                            <div className="flex items-center justify-between mb-10 px-4">
                                {[1, 2, 3].map((s) => (
                                    <React.Fragment key={s}>
                                        <div className={`flex flex-col items-center gap-2 relative`}>
                                            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-[10px] font-black transition-all ${
                                                processingStep >= s ? 'bg-blue-600 text-white shadow-lg shadow-blue-100' : 'bg-slate-100 text-slate-400'
                                            }`}>
                                                {processingStep > s ? <CheckCircle2 size={16} /> : s}
                                            </div>
                                            <span className={`text-[9px] font-bold uppercase tracking-widest ${processingStep >= s ? 'text-blue-600' : 'text-slate-300'}`}>
                                                {s === 1 ? 'Verify' : s === 2 ? 'Upload' : 'Confirm'}
                                            </span>
                                        </div>
                                        {s < 3 && <div className={`flex-1 h-px mx-4 ${processingStep > s ? 'bg-blue-600' : 'bg-slate-100'}`}></div>}
                                    </React.Fragment>
                                ))}
                            </div>

                            {/* Step 1: Verify Information */}
                            {processingStep === 1 && (
                                <div className="animate-in slide-in-from-right-4 duration-300">
                                    <h3 className="text-2xl font-bold mb-2 text-slate-800">Step 1: Verify Information</h3>
                                    <p className="text-slate-500 text-sm mb-8">Confirm student details before uploading transcripts.</p>
                                    
                                    <div className="space-y-4 bg-slate-50 p-6 rounded-2xl border border-slate-100 mb-8">
                                        <div className="flex justify-between border-b border-slate-200 pb-3">
                                            <span className="text-xs text-slate-400 font-bold uppercase">Student Name</span>
                                            <span className="text-sm text-slate-700 font-bold">{name}</span>
                                        </div>
                                        <div className="flex justify-between border-b border-slate-200 pb-3">
                                            <span className="text-xs text-slate-400 font-bold uppercase">Document</span>
                                            <span className="text-sm text-slate-700 font-bold">{document_type || 'Transcript of Records'}</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="text-xs text-slate-400 font-bold uppercase">Purpose</span>
                                            <span className="text-sm text-slate-700 font-bold">{purpose || 'General Requirement'}</span>
                                        </div>
                                    </div>

                                    <div className="flex gap-3">
                                        <button className="flex-1 py-4 text-slate-400 font-bold text-sm hover:bg-slate-50 rounded-2xl transition-all" onClick={closeModal}>Cancel</button>
                                        <button 
                                            className="flex-[2] bg-blue-600 text-white py-4 rounded-2xl font-bold text-sm hover:bg-blue-700 transition-all shadow-lg shadow-blue-100" 
                                            onClick={() => setProcessingStep(2)}
                                        >
                                            Looks Good, Continue <ChevronRight size={16} className="inline ml-1" />
                                        </button>
                                    </div>
                                </div>
                            )}

                            {/* Step 2: Upload Documents */}
                            {processingStep === 2 && (
                                <div className="animate-in slide-in-from-right-4 duration-300">
                                    <h3 className="text-2xl font-bold mb-2 text-slate-800">Step 2: Upload Files</h3>
                                    <p className="text-slate-500 text-sm mb-8">Attach the official digital copy of the student's records.</p>
                                    
                                    <input type="file" id="fileInput" className="hidden" accept=".pdf" multiple onChange={handleFileUpload} />
                                    <div 
                                        className="border-2 border-dashed border-slate-200 bg-slate-50 rounded-3xl py-12 px-8 text-center mb-8 cursor-pointer hover:border-blue-500 hover:bg-blue-50/30 transition-all group" 
                                        onClick={() => document.getElementById('fileInput').click()}
                                    >
                                        <div className="w-16 h-16 bg-white rounded-2xl shadow-sm flex items-center justify-center text-slate-400 group-hover:text-blue-600 group-hover:scale-110 transition-all mx-auto mb-4">
                                            <Plus size={32} />
                                        </div>
                                        <p className="text-sm text-slate-700 font-bold mb-1">Click to browse files</p>
                                        <p className="text-xs text-slate-400">PDF documents only</p>
                                    </div>

                                    {uploadedFiles.length > 0 && (
                                        <div className="space-y-2 mb-8 max-h-[150px] overflow-y-auto pr-2 custom-scrollbar border border-slate-100 p-4 rounded-2xl">
                                            {uploadedFiles.map((file, i) => (
                                                <div key={i} className="flex items-center gap-3">
                                                    <FileText className="text-blue-500" size={14} />
                                                    <p className="text-[11px] font-bold text-slate-700 truncate flex-1">{file.name}</p>
                                                    <CheckCircle2 className="text-green-500" size={12} />
                                                </div>
                                            ))}
                                        </div>
                                    )}

                                    <div className="flex gap-3">
                                        <button className="flex-1 py-4 text-slate-400 font-bold text-sm hover:bg-slate-50 rounded-2xl transition-all" onClick={() => setProcessingStep(1)}>Back</button>
                                        <button 
                                            className="flex-[2] bg-blue-600 text-white py-4 rounded-2xl font-bold text-sm hover:bg-blue-700 transition-all shadow-lg shadow-blue-100 disabled:opacity-50 disabled:bg-slate-200" 
                                            onClick={() => setProcessingStep(3)}
                                            disabled={uploadedFiles.length === 0}
                                        >
                                            Next Step <ChevronRight size={16} className="inline ml-1" />
                                        </button>
                                    </div>
                                </div>
                            )}

                            {/* Step 3: Final Confirmation */}
                            {processingStep === 3 && (
                                <div className="animate-in slide-in-from-right-4 duration-300">
                                    <div className="bg-blue-50 w-20 h-20 rounded-full flex items-center justify-center text-blue-600 mb-6 mx-auto">
                                        <ShieldCheck size={40} />
                                    </div>
                                    <h3 className="text-2xl font-bold mb-2 text-slate-800 text-center">Step 3: Finalize</h3>
                                    <p className="text-slate-500 text-sm mb-8 text-center">Ready to begin processing. This will record the activity and move the request to "In Process" status.</p>
                                    
                                    <div className="flex items-start gap-4 mb-8 p-6 bg-blue-50 rounded-2xl border border-blue-100">
                                        <input 
                                            type="checkbox" 
                                            id="upload-confirm" 
                                            checked={confirmed} 
                                            onChange={(e) => setConfirmed(e.target.checked)} 
                                            className="mt-1 w-5 h-5 rounded-lg border-slate-300 text-blue-600 focus:ring-blue-500" 
                                        />
                                        <label htmlFor="upload-confirm" className="text-xs text-blue-800 font-medium leading-relaxed">
                                            I confirm that I have verified all documents and am ready to proceed with hashing and official recording.
                                        </label>
                                    </div>

                                    <div className="flex gap-3">
                                        <button className="flex-1 py-4 text-slate-400 font-bold text-sm hover:bg-slate-50 rounded-2xl transition-all" onClick={() => setProcessingStep(2)}>Back</button>
                                        <button 
                                            className="flex-[2] bg-[#2c3e50] text-white py-4 rounded-2xl font-bold text-sm hover:bg-[#1a252f] transition-all shadow-lg shadow-slate-200 disabled:opacity-50" 
                                            disabled={!confirmed || actionLoading} 
                                            onClick={() => handleStatusUpdate('In Process')}
                                        >
                                            {actionLoading ? 'Processing...' : 'Confirm & Start Processing'}
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                )}
                {/* --- NEW: Approve Documents Wizard --- */}
                {activeModal === 'approve' && (
                    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[2000] flex justify-center items-center p-6 animate-in fade-in duration-300">
                        <div className="bg-white rounded-3xl p-10 shadow-2xl w-full max-w-md animate-in zoom-in-95 duration-300 text-center">
                            <div className="bg-green-50 w-20 h-20 rounded-full flex items-center justify-center text-green-600 mb-6 mx-auto">
                                <CheckCircle2 size={40} />
                            </div>
                            <h3 className="text-2xl font-bold mb-2 text-slate-800">Complete Review</h3>
                            <p className="text-slate-500 text-sm mb-8">Confirm that all documents have been reviewed and are ready for the final hashing process.</p>
                            
                            <div className="flex gap-3">
                                <button className="flex-1 py-4 text-slate-400 font-bold text-sm hover:bg-slate-50 rounded-2xl transition-all" onClick={closeModal}>Cancel</button>
                                <button 
                                    className="flex-[2] bg-green-600 text-white py-4 rounded-2xl font-bold text-sm hover:bg-green-700 transition-all shadow-lg shadow-green-100" 
                                    onClick={() => handleStatusUpdate('Approved')}
                                    disabled={actionLoading}
                                >
                                    {actionLoading ? 'Approving...' : 'Approve Documents'}
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {/* --- NEW: Release & Hash Wizard (The Final Step) --- */}
                {activeModal === 'release' && (
                    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[2000] flex justify-center items-center p-6 animate-in fade-in duration-300">
                        <div className="bg-white rounded-3xl p-10 shadow-2xl w-full max-w-lg animate-in zoom-in-95 duration-300">
                            
                            {/* Final Step Internal Stepper */}
                            <div className="flex items-center justify-between mb-10 px-4">
                                {[1, 2].map((s) => (
                                    <React.Fragment key={s}>
                                        <div className={`flex flex-col items-center gap-2 relative`}>
                                            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-[10px] font-black transition-all ${
                                                processingStep >= s ? 'bg-blue-600 text-white shadow-lg shadow-blue-100' : 'bg-slate-100 text-slate-400'
                                            }`}>
                                                {processingStep > s ? <CheckCircle2 size={16} /> : s}
                                            </div>
                                            <span className={`text-[9px] font-bold uppercase tracking-widest ${processingStep >= s ? 'text-blue-600' : 'text-slate-300'}`}>
                                                {s === 1 ? 'Generate Hash' : 'Release'}
                                            </span>
                                        </div>
                                        {s < 2 && <div className={`flex-1 h-px mx-4 ${processingStep > s ? 'bg-blue-600' : 'bg-slate-100'}`}></div>}
                                    </React.Fragment>
                                ))}
                            </div>

                            {/* Release Step 1: Generate Hash */}
                            {processingStep === 1 && (
                                <div className="animate-in slide-in-from-right-4 duration-300 text-center">
                                    <div className="bg-blue-50 w-20 h-20 rounded-full flex items-center justify-center text-blue-600 mb-6 mx-auto">
                                        <ShieldCheck size={40} />
                                    </div>
                                    <h3 className="text-2xl font-bold mb-2 text-slate-800">Generate Reference Hash</h3>
                                    <p className="text-slate-500 text-sm mb-8">Click below to generate the unique SHA-256 fingerprint for this document. This hash will be the official reference for verification.</p>
                                    
                                    <div className="flex gap-3">
                                        <button className="flex-1 py-4 text-slate-400 font-bold text-sm hover:bg-slate-50 rounded-2xl transition-all" onClick={closeModal}>Cancel</button>
                                        <button 
                                            className="flex-[2] bg-blue-600 text-white py-4 rounded-2xl font-bold text-sm hover:bg-blue-700 transition-all shadow-lg shadow-blue-100" 
                                            onClick={async () => {
                                                await handleGenerateHash();
                                                setProcessingStep(2);
                                            }}
                                            disabled={actionLoading}
                                        >
                                            {actionLoading ? 'Generating...' : 'Generate Reference Hash'}
                                        </button>
                                    </div>
                                </div>
                            )}

                            {/* Release Step 2: Release to Student */}
                            {processingStep === 2 && (
                                <div className="animate-in slide-in-from-right-4 duration-300 text-center">
                                    <div className="bg-green-50 w-20 h-20 rounded-full flex items-center justify-center text-green-600 mb-6 mx-auto">
                                        <Send size={40} />
                                    </div>
                                    <h3 className="text-2xl font-bold mb-2 text-slate-800">Final Release</h3>
                                    <p className="text-slate-500 text-sm mb-8">The hash has been successfully recorded. You are now ready to release the document to the student.</p>
                                    
                                    <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 mb-8 flex items-center gap-3 text-left">
                                        <div className="w-12 h-12 bg-white rounded-lg flex items-center justify-center text-slate-300">
                                            <i className="fa-solid fa-qrcode text-2xl"></i>
                                        </div>
                                        <div>
                                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Verification ID</p>
                                            <p className="text-xs font-mono font-bold text-slate-700">{documentHash?.substring(0, 20)}...</p>
                                        </div>
                                    </div>

                                    <div className="flex gap-3">
                                        <button className="flex-1 py-4 text-slate-400 font-bold text-sm hover:bg-slate-50 rounded-2xl transition-all" onClick={closeModal}>Close</button>
                                        <button 
                                            className="flex-[2] bg-[#2c3e50] text-white py-4 rounded-2xl font-bold text-sm hover:bg-[#1a252f] transition-all shadow-lg shadow-slate-200" 
                                            onClick={() => handleStatusUpdate('Released')}
                                            disabled={actionLoading}
                                        >
                                            {actionLoading ? 'Releasing...' : 'Release Document Now'}
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                )}
            </div>
        </Layout>
    );
};

export default RequestDetails;
