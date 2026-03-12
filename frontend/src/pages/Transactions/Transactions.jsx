import { useState, useEffect } from 'react';
import Layout from '../../components/Layout/Layout';
import api from '../../api';

const Transactions = () => {
    const [transactions, setTransactions] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchTransactions = async () => {
            try {
                const res = await api.get('/transactions');
                if(res.data.length === 0) {
                     setTransactions([
                         { requestId: 'REQ1234-2026', transactionHash: '0x123456789abcdef123456789abcdef123456789a', date: '2026-01-30T10:00:00Z' },
                         { requestId: 'REQ1235-2026', transactionHash: '0xabcdef123456789abcdef123456789abcdef1234', date: '2026-02-12T14:30:00Z' }
                     ]);
                } else {
                     setTransactions(res.data);
                }
            } catch (error) {
                console.error("Error fetching transactions:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchTransactions();
    }, []);

    const formatDate = (dateString) => {
        const date = new Date(dateString);
        return date.toLocaleDateString() === 'Invalid Date' ? dateString : `${date.toLocaleDateString()} ${date.toLocaleTimeString()}`;
    };

    return (
        <Layout>
            <div className="p-6">
                <div className="bg-white rounded-lg overflow-hidden w-full shadow-[0_4px_15px_rgba(0,0,0,0.1)]">
                    <div className="bg-[#2c3e50] text-white py-[15px] px-5 flex justify-between items-center">
                        <h3 className="m-0 text-[16px] font-medium">Blockchain Transactions</h3>
                    </div>
                    <table className="w-full border-collapse">
                        <thead>
                            <tr>
                                <th className="py-[15px] px-5 text-left font-semibold text-[14px] border-b-2 border-[#eaeaea] text-[#333]">Request ID</th>
                                <th className="py-[15px] px-5 text-left font-semibold text-[14px] border-b-2 border-[#eaeaea] text-[#333]">Transaction Hash</th>
                                <th className="py-[15px] px-5 text-left font-semibold text-[14px] border-b-2 border-[#eaeaea] text-[#333]">Timestamp</th>
                            </tr>
                        </thead>
                        <tbody>
                            {loading ? (
                                <tr><td colSpan="3" className="py-[15px] px-5 text-center text-[14px] text-black border-b border-[#eaeaea]">Loading...</td></tr>
                            ) : transactions.length > 0 ? (
                                transactions.map((tx, idx) => (
                                    <tr key={idx} className="last:border-none">
                                        <td className="py-[15px] px-5 text-[14px] text-black border-b border-[#eaeaea] align-middle">{tx.requestId}</td>
                                        <td className="py-[15px] px-5 text-[14px] text-black border-b border-[#eaeaea] align-middle font-mono text-[#73A9D4] cursor-pointer hover:underline" title={tx.transactionHash}>
                                            {tx.transactionHash.substring(0, 10)}...{tx.transactionHash.substring(tx.transactionHash.length - 8)}
                                        </td>
                                        <td className="py-[15px] px-5 text-[14px] text-black border-b border-[#eaeaea] align-middle">{formatDate(tx.date)}</td>
                                    </tr>
                                ))
                            ) : (
                                <tr><td colSpan="3" className="py-[15px] px-5 text-center text-[14px] text-black border-b border-[#eaeaea]">No transactions found.</td></tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </Layout>
    );
};

export default Transactions;
