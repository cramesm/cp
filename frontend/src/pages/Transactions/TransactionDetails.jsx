import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import Layout from '../../components/Layout/Layout';
import api from '../../api';

const TransactionDetails = () => {
    const { id } = useParams();
    const [txData, setTxData] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        // Mock API Fetch translating dynamic transaction
        setTimeout(() => {
            setTxData({
                transactionId: id || '1243573a97',
                requester: {
                    requestId: 'REQ1234-2026',
                    name: 'Juan Dela Cruz',
                    studentId: '2023-102347',
                    program: 'BS Information Technology'
                },
                blockchain: {
                    hash: '0x683a34fa04',
                    blockNumber: '1234578',
                    timestamp: 'January 11, 2026 - 10:30am',
                    status: 'Verified'
                },
                document: {
                    name: 'TOR_JuanDelaCruz.pdf',
                    size: '1.6 MB',
                    hash: '1234....0a38f'
                },
                timeline: [
                    { status: 'Submitted', date: 'January 10, 2026 - 10:30am', color: 'bg-[#bdc3c7]' },
                    { status: 'Pending', date: 'January 10, 2026 - 10:30am', color: 'bg-[#f1c40f]' },
                    { status: 'Processing', date: 'January 10, 2026 - 10:30am', color: 'bg-[#2ecc71]' },
                    { status: 'Approved', date: 'January 10, 2026 - 10:30am', color: 'bg-[#3498db]' },
                    { status: 'Submit to Blockchain', date: 'January 10, 2026 - 10:30am', color: 'bg-[#bdc3c7]' },
                    { status: 'QR Generation', date: 'January 10, 2026 - 10:30am', color: 'bg-[#bdc3c7]' },
                    { status: 'Released', date: 'January 10, 2026 - 10:30am', color: 'bg-[#e67e22]' }
                ]
            });
            setLoading(false);
        }, 400);
    }, [id]);

    if (loading) return <Layout><div className="p-5">Loading Transaction Timeline...</div></Layout>;

    const { requester, blockchain, document, timeline } = txData;

    return (
        <Layout>
            <div className="p-5">
                <h2 className="font-mono text-[24px] font-semibold mb-[30px] tracking-[1px] text-black">Transaction ID: {txData.transactionId}</h2>

                <div className="grid grid-cols-1 lg:grid-cols-[1fr_380px] gap-[25px]">
                    
                    <div className="flex flex-col gap-5">
                        <div className="bg-white rounded-[10px] p-[25px] shadow-[0_2px_10px_rgba(0,0,0,0.05)] border border-[#e0e0e0]">
                            <h4 className="text-[15px] font-semibold mb-5 text-[#333] pb-2.5 border-b border-[#eee]">Requester Information</h4>
                            <div className="flex flex-col gap-[15px]">
                                <div className="flex justify-between items-center text-[14px]"><span className="text-[#666] font-medium">Request ID:</span><span className="text-[#333] font-semibold">{requester.requestId}</span></div>
                                <div className="flex justify-between items-center text-[14px]"><span className="text-[#666] font-medium">Name:</span><span className="text-[#333] font-semibold">{requester.name}</span></div>
                                <div className="flex justify-between items-center text-[14px]"><span className="text-[#666] font-medium">Student ID:</span><span className="text-[#333] font-semibold">{requester.studentId}</span></div>
                                <div className="flex justify-between items-center text-[14px]"><span className="text-[#666] font-medium">Program:</span><span className="text-[#333] font-semibold">{requester.program}</span></div>
                            </div>
                        </div>

                        <div className="bg-white rounded-[10px] p-[25px] shadow-[0_2px_10px_rgba(0,0,0,0.05)] border border-[#e0e0e0]">
                            <h4 className="text-[15px] font-semibold mb-5 text-[#333] pb-2.5 border-b border-[#eee]">Blockchain Details</h4>
                            <div className="flex flex-col gap-[15px]">
                                <div className="flex justify-between items-center text-[14px]"><span className="text-[#666] font-medium">Transaction Hash:</span><span className="text-[#333] font-semibold font-mono text-[13px] bg-[#f8f9fa] py-0.5 px-1.5 rounded">{blockchain.hash}</span></div>
                                <div className="flex justify-between items-center text-[14px]"><span className="text-[#666] font-medium">Block Number:</span><span className="text-[#333] font-semibold">{blockchain.blockNumber}</span></div>
                                <div className="flex justify-between items-center text-[14px]"><span className="text-[#666] font-medium">Timestamp:</span><span className="text-[#333] font-semibold">{blockchain.timestamp}</span></div>
                                <div className="flex justify-between items-center text-[14px]"><span className="text-[#666] font-medium">Verification Status:</span><span className="text-[#27ae60] font-semibold flex items-center gap-1.5"><i className="fa-solid fa-circle-check"></i> {blockchain.status}</span></div>
                            </div>
                        </div>

                        <div className="bg-white rounded-[10px] p-[25px] shadow-[0_2px_10px_rgba(0,0,0,0.05)] border border-[#e0e0e0]">
                            <h4 className="text-[15px] font-semibold mb-5 text-[#333] pb-2.5 border-b border-[#eee]">Document Information</h4>
                            <div className="border border-[#eee] bg-[#fafafa] rounded-lg p-[15px] flex items-center gap-[15px] mb-2.5">
                                <i className="fa-solid fa-file-pdf text-[28px] text-[#e74c3c]"></i>
                                <div>
                                    <div className="font-semibold text-[14px] text-[#333]">{document.name}</div>
                                    <div className="text-[12px] text-[#888]">({document.size})</div>
                                </div>
                            </div>
                            <div className="text-[12px] text-[#666] mt-1.5 flex justify-between">
                                <span className="font-medium">File Hash:</span>
                                <span className="text-[#333] font-semibold font-mono bg-[#f8f9fa] py-0.5 px-1.5 rounded">{document.hash} <i className="fa-regular fa-copy cursor-pointer text-[#999] ml-1"></i></span>
                            </div>
                        </div>
                    </div>

                    <div className="flex flex-col">
                        <div className="bg-white rounded-[10px] p-[25px] shadow-[0_2px_10px_rgba(0,0,0,0.05)] border border-[#e0e0e0] h-full">
                            <h4 className="text-[15px] font-semibold mb-5 text-[#333] pb-2.5 border-b border-[#eee]">Status Timeline</h4>
                            
                            <div className="relative py-2.5 pl-2.5 pr-0">
                                <div className="absolute left-[19px] top-[25px] bottom-10 w-0.5 bg-[#e0e0e0] z-0"></div>
                                {timeline.map((item, idx) => (
                                    <div className="relative flex gap-5 mb-[35px] z-10" key={idx}>
                                        <div className={`w-5 h-5 rounded-full border-4 border-white shadow-[0_0_0_1px_#eee] shrink-0 ${item.color}`}></div>
                                        <div className="flex flex-col justify-center">
                                            <div className="text-[14px] font-semibold text-[#333]">{item.status}</div>
                                            <div className="text-[11px] text-[#888] mt-[3px]">{item.date}</div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>

                </div>
            </div>
        </Layout>
    );
};

export default TransactionDetails;
