import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Layout from '../../components/Layout';
import api from '../../api';

const RequestDetails = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [requestData, setRequestData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [activeModal, setActiveModal] = useState(null);
    const [uploadedFiles, setUploadedFiles] = useState([]);
    const [confirmed, setConfirmed] = useState(false);

    useEffect(() => {
        // Mock data fetch simulating /requests/:id
        const fetchData = async () => {
             // Simulating API lag
             setTimeout(() => {
                 setRequestData({
                     requestId: id || 'REQ1234-2026',
                     requester: {
                        name: 'Juan Dela Cruz',
                        studentId: '2023-102347',
                        program: 'BS Information Technology'
                     },
                     document: {
                         type: 'Transcript of Record',
                         status: 'Pending',
                         processedDate: '---'
                     },
                     payment: {
                         method: 'Gcash',
                         status: 'Paid',
                         amount: '₱150.00',
                         reference: '1234578839',
                         date: 'January 15, 2026'
                     },
                     validation: {
                         hashStatus: '---',
                         blockchainStatus: '---'
                     }
                 });
                 setLoading(false);
             }, 500);
        };
        fetchData();
    }, [id]);

    const openModal = (modalName) => setActiveModal(modalName);
    const closeModal = () => { setActiveModal(null); setConfirmed(false); };

    const handleFileUpload = (e) => {
        const files = Array.from(e.target.files);
        setUploadedFiles(files);
    };

    if (loading) {
        return <Layout><div className="p-5">Loading Request Details...</div></Layout>;
    }

    const { requester, document, payment, validation } = requestData;

    return (
        <Layout>
            <div className="p-5 bg-white">
                <h1 className="text-[24px] font-bold mb-[25px] text-black font-mono tracking-[0.5px]">Request ID: {requestData.requestId}</h1>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-1.5">
                    <div className="bg-white border border-[#dcdcdc] rounded-[10px] py-5 px-[25px] mb-5">
                        <h3 className="text-[16px] font-semibold text-[#222] mb-5">Requester Details</h3>
                        <div className="grid grid-cols-[140px_1fr] mb-3 items-center"><span className="text-[#666] text-[14px]">Request ID:</span><span className="text-[#222] text-[14px] font-normal">{requestData.requestId}</span></div>
                        <div className="grid grid-cols-[140px_1fr] mb-3 items-center"><span className="text-[#666] text-[14px]">Name:</span><span className="text-[#222] text-[14px] font-normal">{requester.name}</span></div>
                        <div className="grid grid-cols-[140px_1fr] mb-3 items-center"><span className="text-[#666] text-[14px]">Student ID:</span><span className="text-[#222] text-[14px] font-normal">{requester.studentId}</span></div>
                        <div className="grid grid-cols-[140px_1fr] mb-3 items-center"><span className="text-[#666] text-[14px]">Program:</span><span className="text-[#222] text-[14px] font-normal">{requester.program}</span></div>
                    </div>

                    <div className="bg-white border border-[#dcdcdc] rounded-[10px] py-5 px-[25px] mb-5">
                        <h3 className="text-[16px] font-semibold text-[#222] mb-5">Document Details</h3>
                        <div className="grid grid-cols-[140px_1fr] mb-3 items-center"><span className="text-[#666] text-[14px]">Document Type:</span><span className="text-[#222] text-[14px] font-normal">{document.type}</span></div>
                        <div className="grid grid-cols-[140px_1fr] mb-3 items-center"><span className="text-[#666] text-[14px]">Status:</span>
                            <span className={`py-1.5 px-[15px] rounded-[20px] text-[12px] font-bold inline-block text-center w-[120px] uppercase
                                ${document.status.toLowerCase() === 'pending' ? 'bg-[#fcf8a0] text-[#948b04] !w-[100px]' : 
                                  document.status.toLowerCase() === 'processing' ? 'bg-[#98fb98] text-[#006400]' :
                                  document.status.toLowerCase() === 'approved' ? 'bg-[#aed6f1] text-[#1b4f72]' :
                                  document.status.toLowerCase() === 'released' ? 'bg-[#fad7a0] text-[#e67e22]' :
                                  document.status.toLowerCase() === 'rejected' ? 'bg-[#fadbd8] text-[#c0392b]' : ''
                                }`}
                            >
                                {document.status}
                            </span>
                        </div>
                        <div className="grid grid-cols-[140px_1fr] mb-3 items-center"><span className="text-[#666] text-[14px]">Processed Date:</span><span className="text-[#222] text-[14px] font-normal">{document.processedDate}</span></div>
                    </div>
                </div>

                <div className="bg-white border border-[#dcdcdc] rounded-[10px] py-5 px-[25px] mb-5">
                    <h3 className="text-[16px] font-semibold text-[#222] mb-5">Payment Details</h3>
                    <div className="flex justify-between flex-wrap gap-5">
                        <div className="flex flex-col gap-1"><div className="text-[13px] text-[#555] font-normal">Payment Method</div><div className="text-[14px] text-[#222] font-medium">{payment.method}</div></div>
                        <div className="flex flex-col gap-1"><div className="text-[13px] text-[#555] font-normal">Status</div><div className={`text-[14px] font-bold flex items-center gap-1.5 ${payment.status === 'Paid' ? 'text-[#27ae60]' : 'text-[#e74c3c]'}`}><i className="fa-solid fa-circle-check"></i> {payment.status}</div></div>
                        <div className="flex flex-col gap-1"><div className="text-[13px] text-[#555] font-normal">Amount Paid</div><div className="text-[14px] text-[#222] font-medium">{payment.amount}</div></div>
                        <div className="flex flex-col gap-1"><div className="text-[13px] text-[#555] font-normal">Reference No.</div><div className="text-[14px] text-[#222] font-medium">{payment.reference}</div></div>
                        <div className="flex flex-col gap-1"><div className="text-[13px] text-[#555] font-normal">Date Paid</div><div className="text-[14px] text-[#222] font-medium">{payment.date}</div></div>
                    </div>
                </div>

                <div className="bg-white border border-[#dcdcdc] rounded-[10px] py-5 px-[25px] mb-5">
                    <h3 className="text-[16px] font-semibold text-[#222] mb-5">Validation</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-y-4">
                        <div className="mb-[15px]"><div className="text-[13px] text-[#555] font-normal inline-block w-[140px]">Hash Status:</div><div className="text-[14px] text-[#222] font-medium inline-block">{validation.hashStatus}</div></div>
                        <div className="mb-[15px]"><div className="text-[13px] text-[#555] font-normal inline-block w-[140px]">Blockchain Status:</div><div className="text-[14px] text-[#222] font-medium inline-block">{validation.blockchainStatus}</div></div>
                    </div>
                </div>

                <div className="flex justify-end gap-[15px] mt-[30px]">
                    <button className="bg-[#dcdcdc] text-[#333] border-none py-3 px-[25px] rounded-[25px] font-semibold text-[14px] cursor-pointer transition-colors duration-200 hover:bg-[#c0c0c0]" onClick={() => openModal('reject')}>Reject Request</button>
                    {document.status === 'Pending' && <button className="bg-[#2c3e50] text-white border-none py-3 px-[25px] rounded-[25px] font-semibold text-[14px] cursor-pointer transition-colors duration-200 hover:bg-[#1a252f]" onClick={() => openModal('upload')}>Approve Request</button>}
                </div>

                {activeModal === 'reject' && (
                    <div className="fixed top-0 left-0 w-full h-full bg-black/50 z-[1000] flex justify-center items-center">
                        <div className="bg-white rounded-[15px] p-[30px] shadow-[0_10px_30px_rgba(0,0,0,0.2)] text-left w-[500px]">
                            <h3 className="text-[18px] font-bold mb-5 color-[#000]">Reject Request: {requestData.requestId}</h3>
                            <div className="mb-5">
                                <label className="block text-[13px] text-[#555] mb-2 font-medium">Reason for Rejection:</label>
                                <select className="w-full py-2.5 px-[15px] border border-[#ccc] rounded-lg box-border outline-none">
                                    <option value="" disabled selected>Reason</option>
                                    <option value="incomplete">Incomplete Documents</option>
                                    <option value="invalid">Invalid Information</option>
                                </select>
                            </div>
                            <div className="flex justify-end gap-[15px] mt-5">
                                <button className="bg-[#dcdcdc] text-[#333] border-none py-2.5 px-[25px] rounded-[20px] font-semibold text-[13px] cursor-pointer transition-colors hover:bg-[#c0c0c0]" onClick={closeModal}>Cancel</button>
                                <button className="bg-[#343a40] text-white border-none py-2.5 px-[30px] rounded-[20px] font-semibold cursor-pointer transition-colors hover:bg-[#1d2124]" onClick={() => { /* Handle reject API */ closeModal(); }}>Confirm</button>
                            </div>
                        </div>
                    </div>
                )}

                {activeModal === 'upload' && (
                    <div className="fixed top-0 left-0 w-full h-full bg-black/50 z-[1000] flex justify-center items-center">
                        <div className="bg-white rounded-[15px] p-[30px] shadow-[0_10px_30px_rgba(0,0,0,0.2)] text-left w-[480px]">
                            <h3 className="text-[18px] font-bold mb-5 color-[#000]">Upload TOR Files</h3>
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
                                <label htmlFor="upload-confirm" className="text-[13px] text-[#555]">I confirm that the selected files are correct.</label>
                            </div>
                            <div className="flex justify-end gap-[15px] mt-5">
                                <button className="bg-[#dcdcdc] text-[#333] border-none py-2.5 px-[25px] rounded-[20px] font-semibold text-[13px] cursor-pointer hover:bg-[#c0c0c0]" onClick={closeModal}>Cancel</button>
                                <button className="bg-[#2c3e50] text-white border-none py-2.5 px-[25px] rounded-[20px] font-semibold text-[13px] cursor-pointer disabled:bg-[#bdc3c7] disabled:cursor-not-allowed hover:bg-[#1a252f]" disabled={!confirmed} onClick={() => { /* Handle approve API */ closeModal(); }}>Confirm</button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </Layout>
    );
};

export default RequestDetails;
