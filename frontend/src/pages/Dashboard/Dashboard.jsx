import { useState, useEffect } from 'react';
import Layout from '../../components/Layout';
import api from '../../api';
import { AlertCircle, RefreshCw } from 'lucide-react'; // Essential for error feedback

const Dashboard = () => {
    const [stats, setStats] = useState({
        totalRequests: 0,
        pendingRequests: 0,
        inProcessRequests: 0,
        approvedRequests: 0,
        releasedRequests: 0,
        blockchainTransactions: 0
    });
    
    const [recentData, setRecentData] = useState({
        transactions: [],
        notifications: [],
        pendingRequests: []
    });

    // --- NEW: Status States for Validation & Error Handling ---
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const fetchDashboardData = async () => {
        setLoading(true);
        setError(null);
        try {
            const [statsRes, recentRes] = await Promise.all([
                api.get('/dashboard/stats'),
                api.get('/dashboard/recent')
            ]);
            
            // Validation: Ensure data integrity even if API returns null/undefined
            setStats(statsRes.data || {});
            setRecentData(recentRes.data || { transactions: [], notifications: [], pendingRequests: [] });
        } catch (err) {
            console.error("Error fetching dashboard data", err);
            // Output Error Message Requirement
            setError("Failed to sync dashboard data. Please check your connection.");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchDashboardData();
    }, []);

    return (
        <Layout>
            <div className="p-6">
                {/* --- NEW: Error Output Message --- */}
                {error && (
                    <div className="mb-6 flex items-center justify-between bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
                        <div className="flex items-center gap-2 text-sm font-medium">
                            <AlertCircle size={18} />
                            {error}
                        </div>
                        <button onClick={fetchDashboardData} className="flex items-center gap-1 text-xs font-bold uppercase hover:underline">
                            <RefreshCw size={14} /> Retry
                        </button>
                    </div>
                )}

                {/* Stats Grid - Opacity indicates loading validation */}
                <div className={`grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-5 transition-opacity ${loading ? 'opacity-50' : 'opacity-100'}`}>
                    <div className="flex items-center gap-[15px] bg-white rounded-[15px] p-[18px] shadow-[0_6px_15px_rgba(0,0,0,0.08)]">
                        <i className="fa-solid fa-file-lines text-[26px]"></i>
                        <div>
                            <h4 className="text-[14px] text-[#666] mb-[10px] font-normal">Total Requests</h4>
                            <p className="text-[28px] font-bold text-[#2F3640] m-0">{stats.totalRequests || 0}</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-[15px] bg-white rounded-[15px] p-[18px] shadow-[0_6px_15px_rgba(0,0,0,0.08)]">
                        <i className="fa-solid fa-clock-rotate-left text-[26px]"></i>
                        <div>
                            <h4 className="text-[14px] text-[#666] mb-[10px] font-normal">Pending Requests</h4>
                            <p className="text-[28px] font-bold text-[#2F3640] m-0">{stats.pendingRequests || 0}</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-[15px] bg-white rounded-[15px] p-[18px] shadow-[0_6px_15px_rgba(0,0,0,0.08)]">
                        <i className="fa-solid fa-arrows-rotate text-[26px]"></i>
                        <div>
                            <h4 className="text-[14px] text-[#666] mb-[10px] font-normal">In Process Requests</h4>
                            <p className="text-[28px] font-bold text-[#2F3640] m-0">{stats.inProcessRequests || 0}</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-[15px] bg-white rounded-[15px] p-[18px] shadow-[0_6px_15px_rgba(0,0,0,0.08)]">
                        <i className="fa-solid fa-circle-check text-[26px]"></i>
                        <div>
                            <h4 className="text-[14px] text-[#666] mb-[10px] font-normal">Approved Requests</h4>
                            <p className="text-[28px] font-bold text-[#2F3640] m-0">{stats.approvedRequests || 0}</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-[15px] bg-white rounded-[15px] p-[18px] shadow-[0_6px_15px_rgba(0,0,0,0.08)]">
                        <i className="fa-solid fa-file-circle-check text-[26px]"></i>
                        <div>
                            <h4 className="text-[14px] text-[#666] mb-[10px] font-normal">Released Documents</h4>
                            <p className="text-[28px] font-bold text-[#2F3640] m-0">{stats.releasedRequests || 0}</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-[15px] bg-white rounded-[15px] p-[18px] shadow-[0_6px_15px_rgba(0,0,0,0.08)]">
                        <i className="fa-solid fa-link text-[26px]"></i>
                        <div>
                            <h4 className="text-[14px] text-[#666] mb-[10px] font-normal">Blockchain Submission</h4>
                            <p className="text-[28px] font-bold text-[#2F3640] m-0">{stats.blockchainTransactions || 0}</p>
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-1 xl:grid-cols-[2fr_1.2fr] gap-[25px] mt-[25px]">
                    <div className="bg-white rounded-lg overflow-hidden w-full shadow-[0_4px_15px_rgba(0,0,0,0.1)]">
                        <h3 className="bg-[#2c3e50] text-white m-0 py-[15px] px-5 text-[16px] font-medium text-left">Blockchain Activity Panel</h3>
                        <p className="px-5 pt-[15px] pb-2.5 m-0 text-[14px] text-black font-medium">Total Records: {stats.blockchainTransactions || 0}</p>
                        <table className="w-full border-collapse mb-2.5 table-fixed">
                            <thead>
                                <tr>
                                    <th colSpan="2" className="text-left py-2.5 px-5 text-[14px] font-normal text-black border-y border-[#eaeaea] bg-white">Latest Transactions:</th>
                                </tr>
                            </thead>
                            <tbody>
                                {recentData.transactions?.length > 0 ? (
                                    recentData.transactions.map((tx, idx) => (
                                        <tr key={idx} className="last:border-none">
                                            <td className="py-3 px-5 text-[14px] text-black border-b border-[#eaeaea] align-middle">{tx.requestId}</td>
                                            <td className="py-3 px-5 text-[14px] text-black border-b border-[#eaeaea] align-middle tracking-[0.5px] truncate">{tx.transactionHash}</td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr><td colSpan="2" className="py-10 text-center italic text-gray-400">No recent transactions</td></tr>
                                )}
                            </tbody>
                        </table>
                    </div>

                    <div className="bg-white rounded-lg overflow-hidden w-full shadow-[0_4px_15px_rgba(0,0,0,0.1)]">
                        <h3 className="bg-[#2c3e50] text-white m-0 py-[15px] px-5 text-[16px] font-medium text-left">Notifications</h3>
                        <ul className="list-none m-0 p-0">
                            {recentData.notifications?.length > 0 ? (
                                recentData.notifications.map((notif, idx) => (
                                    <li key={idx} className="py-[15px] px-5 text-[14px] text-black bg-white border-b border-[#eaeaea] last:border-none">{notif.message}</li>
                                ))
                            ) : (
                                <li className="py-10 text-center italic text-gray-400">No new notifications</li>
                            )}
                        </ul>
                    </div>
                </div>

                <div className="bg-white rounded-lg overflow-hidden w-full shadow-[0_4px_15px_rgba(0,0,0,0.1)] mt-[25px]">
                    <table className="w-full border-collapse table-fixed">
                        <thead>
                            <tr>
                                <th className="bg-[#2c3e50] text-white m-0 py-[18px] px-5 text-[15px] font-semibold text-left">Request ID</th>
                                <th className="bg-[#2c3e50] text-white m-0 py-[18px] px-5 text-[15px] font-semibold text-left">Name</th>
                                <th className="bg-[#2c3e50] text-white m-0 py-[18px] px-5 text-[15px] font-semibold text-left">Status</th>
                                <th className="bg-[#2c3e50] text-white m-0 py-[18px] px-5 text-[15px] font-semibold text-left">Date Requested</th>
                                <th className="bg-[#2c3e50] text-white m-0 py-[18px] px-5 text-[15px] font-semibold text-left"></th>
                            </tr>
                        </thead>
                        <tbody>
                            {recentData.pendingRequests?.length > 0 ? (
                                recentData.pendingRequests.map((req, idx) => (
                                    <tr key={idx} className="last:border-none">
                                        <td className="py-3 px-5 text-[14px] text-black border-b border-[#eaeaea] align-middle">{req.requestId}</td>
                                        <td className="py-3 px-5 text-[14px] text-black border-b border-[#eaeaea] align-middle">{req.name}</td>
                                        <td className="py-3 px-5 text-[14px] text-black border-b border-[#eaeaea] align-middle">
                                            <span className="bg-[#fcf8a0] text-[#948b04] py-1.5 px-5 rounded-full font-bold text-xs inline-block text-center min-w-[80px]">{req.status}</span>
                                        </td>
                                        <td className="py-3 px-5 text-[14px] text-black border-b border-[#eaeaea] align-middle">{req.dateRequested}</td>
                                        <td className="py-3 px-5 text-[14px] text-black border-b border-[#eaeaea] align-middle text-right">
                                            <button className="bg-[#2c3e50] text-white border-none py-2 px-[18px] rounded-[10px] text-[13px] font-medium hover:bg-[#1a252f]">View</button>
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr><td colSpan="5" className="py-10 text-center italic text-gray-400">No pending requests</td></tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </Layout>
    );
};

export default Dashboard;
