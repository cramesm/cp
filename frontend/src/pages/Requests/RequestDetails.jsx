import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Layout from '../../components/Layout/Layout';
import api from '../../api';

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

    const openModal = (modalName) => setActiveModal(modalName);
    const closeModal = () => { setActiveModal(null); setConfirmed(false); };

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

    const { name, status, dateRequested, documentHash } = requestData;

    return (
        <Layout>
            <div className="p-5 bg-white">
                <div className="flex justify-between items-center mb-6">
                    <h1 className="text-[24px] font-bold text-black font-mono tracking-[0.5px]">Request ID: {id}</h1>
                    <div className="flex gap-3">
                         <button 
                            className="bg-[#2c3e50] text-white px-5 py-2 rounded-lg text-sm font-bold hover:bg-[#1a252f] disabled:opacity-50"
                            onClick={handleGenerateHash}
                            disabled={actionLoading || documentHash}
                        >
                            {documentHash ? 'Hash Recorded' : 'Generate Hash'}
                        </button>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-1.5">
                    <div className="bg-white border border-[#dcdcdc] rounded-[10px] py-5 px-[25px] mb-5">
                        <h3 className="text-[16px] font-semibold text-[#222] mb-5">Requester Details</h3>
                        <div className="grid grid-cols-[140px_1fr] mb-3 items-center"><span className="text-[#666] text-[14px]">Name:</span><span className="text-[#222] text-[14px] font-normal">{name}</span></div>
                        <div className="grid grid-cols-[140px_1fr] mb-3 items-center"><span className="text-[#666] text-[14px]">Date Requested:</span><span className="text-[#222] text-[14px] font-normal">{new Date(dateRequested).toLocaleDateString()}</span></div>
                    </div>

                    <div className="bg-white border border-[#dcdcdc] rounded-[10px] py-5 px-[25px] mb-5">
                        <h3 className="text-[16px] font-semibold text-[#222] mb-5">Document Status</h3>
                        <div className="grid grid-cols-[140px_1fr] mb-3 items-center"><span className="text-[#666] text-[14px]">Current Status:</span>
                            <span className={`py-1.5 px-[15px] rounded-[20px] text-[12px] font-bold inline-block text-center w-[120px] uppercase
                                ${status.toLowerCase() === 'pending' ? 'bg-[#fcf8a0] text-[#948b04]' : 
                                  status.toLowerCase() === 'in process' ? 'bg-[#d1ecf1] text-[#0c5460]' :
                                  status.toLowerCase() === 'approved' ? 'bg-[#d4edda] text-[#155724]' :
                                  status.toLowerCase() === 'released' ? 'bg-[#cce5ff] text-[#004085]' :
                                  status.toLowerCase() === 'rejected' ? 'bg-[#fadbd8] text-[#c0392b]' : ''
                                }`}
                            >
                                {status}
                            </span>
                        </div>
                        {documentHash && (
                            <div className="mt-4 p-3 bg-gray-50 rounded border border-dashed border-gray-300">
                                <span className="text-[11px] text-gray-500 block uppercase font-bold mb-1">Secure Document Hash (SHA-256)</span>
                                <code className="text-[12px] break-all text-[#2c3e50]">{documentHash}</code>
                            </div>
                        )}
                    </div>
                </div>

                <div className="bg-white border border-[#dcdcdc] rounded-[10px] py-5 px-[25px] mb-5">
                    <h3 className="text-[16px] font-semibold text-[#222] mb-5">Verification Summary</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-y-4">
                        <div className="mb-[15px]"><div className="text-[13px] text-[#555] font-normal inline-block w-[140px]">Hash Authenticity:</div><div className={`text-[14px] font-bold inline-block ${documentHash ? 'text-green-600' : 'text-orange-500'}`}>{documentHash ? 'GENUINE' : 'PENDING'}</div></div>
                        <div className="mb-[15px]"><div className="text-[13px] text-[#555] font-normal inline-block w-[140px]">Blockchain Sec:</div><div className="text-[14px] text-[#222] font-medium inline-block">NOT RECORDED</div></div>
                    </div>
                </div>

                <div className="flex justify-end gap-[15px] mt-[30px]">
                    <button 
                        className="bg-[#dcdcdc] text-[#333] border-none py-3 px-[25px] rounded-[25px] font-semibold text-[14px] cursor-pointer transition-colors duration-200 hover:bg-[#c0c0c0]" 
                        onClick={() => openModal('reject')}
                        disabled={status === 'Rejected' || actionLoading}
                    >
                        Reject Request
                    </button>
                    {status === 'Pending' && (
                        <button 
                            className="bg-[#2c3e50] text-white border-none py-3 px-[25px] rounded-[25px] font-semibold text-[14px] cursor-pointer transition-colors duration-200 hover:bg-[#1a252f]" 
                            onClick={() => openModal('upload')}
                            disabled={actionLoading}
                        >
                            Start Processing
                        </button>
                    )}
                    {status === 'In Process' && (
                        <button 
                            className="bg-green-600 text-white border-none py-3 px-[25px] rounded-[25px] font-semibold text-[14px] cursor-pointer transition-colors duration-200 hover:bg-green-700" 
                            onClick={() => handleStatusUpdate('Approved')}
                            disabled={actionLoading}
                        >
                            Approve Documents
                        </button>
                    )}
                    {status === 'Approved' && (
                        <button 
                            className="bg-blue-600 text-white border-none py-3 px-[25px] rounded-[25px] font-semibold text-[14px] cursor-pointer transition-colors duration-200 hover:bg-blue-700" 
                            onClick={() => handleStatusUpdate('Released')}
                            disabled={actionLoading}
                        >
                            Release Documents
                        </button>
                    )}
                </div>

                {activeModal === 'reject' && (
                    <div className="fixed top-0 left-0 w-full h-full bg-black/50 z-[1000] flex justify-center items-center">
                        <div className="bg-white rounded-[15px] p-[30px] shadow-[0_10px_30px_rgba(0,0,0,0.2)] text-left w-[500px]">
                            <h3 className="text-[18px] font-bold mb-5 text-black">Reject Request: {id}</h3>
                            <div className="mb-5">
                                <label className="block text-[13px] text-[#555] mb-2 font-medium">Reason for Rejection:</label>
                                <select 
                                    className="w-full py-2.5 px-[15px] border border-[#ccc] rounded-lg box-border outline-none"
                                    value={rejectionReason}
                                    onChange={(e) => setRejectionReason(e.target.value)}
                                >
                                    <option value="" disabled>Select Reason</option>
                                    <option value="incomplete">Incomplete Documents</option>
                                    <option value="invalid">Invalid Information</option>
                                </select>
                            </div>
                            <div className="flex justify-end gap-[15px] mt-5">
                                <button className="bg-[#dcdcdc] text-[#333] border-none py-2.5 px-[25px] rounded-[20px] font-semibold text-[13px] cursor-pointer transition-colors hover:bg-[#c0c0c0]" onClick={closeModal}>Cancel</button>
                                <button 
                                    className="bg-red-600 text-white border-none py-2.5 px-[30px] rounded-[20px] font-semibold cursor-pointer transition-colors hover:bg-red-700" 
                                    onClick={() => handleStatusUpdate('Rejected')}
                                    disabled={!rejectionReason || actionLoading}
                                >
                                    Confirm Rejection
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {activeModal === 'upload' && (
                    <div className="fixed top-0 left-0 w-full h-full bg-black/50 z-[1000] flex justify-center items-center">
                        <div className="bg-white rounded-[15px] p-[30px] shadow-[0_10px_30px_rgba(0,0,0,0.2)] text-left w-[480px]">
                            <h3 className="text-[18px] font-bold mb-5 text-black">Approve & Upload TOR Files</h3>
                            <input type="file" id="fileInput" className="hidden" accept=".pdf" multiple onChange={handleFileUpload} />
                            <div className="border-2 border-dashed border-[#ccc] bg-[#f9f9f9] rounded-[10px] py-[30px] px-5 text-center mb-[15px] cursor-pointer transition-colors hover:border-[#2c3e50]" onClick={() => document.getElementById('fileInput').click()}>
                                <i className="fa-solid fa-cloud-arrow-up text-[30px] text-[#2c3e50] mb-2.5"></i>
                                <p className="text-[13px] text-[#333] mb-[5px]"><strong>Drag & drop your PDF files here or click to browse.</strong></p>
                            </div>
                            {uploadedFiles.length > 0 && (
                                <div className="max-h-[150px] overflow-y-auto mb-[15px] border border-[#eee] rounded-lg p-[5px] bg-[#fafafa]">
                                    {uploadedFiles.map((file, i) => <div key={i} className="flex justify-between items-center p-2.5 border border-[#e0e0e0] rounded-md mb-[5px]"><div className="text-[13px] max-w-[250px] overflow-hidden text-ellipsis whitespace-nowrap">{file.name}</div></div>)}
                                </div>
                            )}
                            <div className="flex items-start gap-2.5 my-[15px] p-2.5 bg-[#f8f9fa] border border-[#e9ecef] rounded-md">
                                <input type="checkbox" id="upload-confirm" checked={confirmed} onChange={(e) => setConfirmed(e.target.checked)} className="mt-1" />
                                <label htmlFor="upload-confirm" className="text-[13px] text-[#555]">I confirm that these documents are ready for processing.</label>
                            </div>
                            <div className="flex justify-end gap-[15px] mt-5">
                                <button className="bg-[#dcdcdc] text-[#333] border-none py-2.5 px-[25px] rounded-[20px] font-semibold text-[13px] cursor-pointer hover:bg-[#c0c0c0]" onClick={closeModal}>Cancel</button>
                                <button 
                                    className="bg-[#2c3e50] text-white border-none py-2.5 px-[25px] rounded-[20px] font-semibold text-[13px] cursor-pointer disabled:bg-[#bdc3c7] disabled:cursor-not-allowed hover:bg-[#1a252f]" 
                                    disabled={!confirmed || actionLoading} 
                                    onClick={() => handleStatusUpdate('In Process')}
                                >
                                    Start Processing
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </Layout>
    );
};

export default RequestDetails;
