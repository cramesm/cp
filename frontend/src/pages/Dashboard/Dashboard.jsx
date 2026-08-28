import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Layout from '../../components/Layout';
import api from '../../api';
import { AlertCircle, RefreshCw, ArrowUpRight, Search, FileText, Clock, CheckCircle2, ShieldCheck, Bell, ChevronRight, Copy, Check } from 'lucide-react';

const Dashboard = () => {
    const [stats, setStats] = useState({
        totalRequests: 0,
        pendingRequests: 0,
        inProcessRequests: 0,
        approvedRequests: 0,
        releasedRequests: 0,
        blockchainTransactions: 0,
        pendingRefunds: 0
    });
    
    const [recentData, setRecentData] = useState({
        transactions: [],
        notifications: [],
        pendingRequests: []
    });

    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [searchFilter, setSearchFilter] = useState('');
    const [selectedTab, setSelectedTab] = useState('All');
    const [copiedHash, setCopiedHash] = useState(null);

    const navigate = useNavigate();

    const fetchDashboardData = async () => {
        setLoading(true);
        setError(null);
        try {
            const [statsRes, recentRes] = await Promise.all([
                api.get('/dashboard/stats'),
                api.get('/dashboard/recent')
            ]);
            
            setStats(statsRes.data || {});
            setRecentData(recentRes.data || { transactions: [], notifications: [], pendingRequests: [] });
        } catch (err) {
            console.error("Error fetching dashboard data", err);
            setError("Failed to sync dashboard data. Please check your connection.");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchDashboardData();
    }, []);

    const handleCopyHash = (hash, e) => {
        e.stopPropagation();
        navigator.clipboard.writeText(hash);
        setCopiedHash(hash);
        setTimeout(() => setCopiedHash(null), 2000);
    };

    const statCards = [
        {
            title: 'Total Requests',
            value: stats.totalRequests ?? 0,
            icon: 'fa-solid fa-folder-open',
            iconBg: 'bg-blue-50 text-blue-600 border border-blue-200/60',
            link: '/requests',
            subtitle: 'Lifetime document queries'
        },
        {
            title: 'Pending Requests',
            value: stats.pendingRequests ?? 0,
            icon: 'fa-solid fa-clock-rotate-left',
            iconBg: 'bg-amber-50 text-amber-600 border border-amber-200/60',
            badge: stats.pendingRequests > 0 ? stats.pendingRequests : null,
            link: '/requests?status=Pending',
            subtitle: 'Awaiting registrar review'
        },
        {
            title: 'In Process',
            value: stats.inProcessRequests ?? 0,
            icon: 'fa-solid fa-spinner',
            iconBg: 'bg-purple-50 text-purple-600 border border-purple-200/60',
            link: '/requests?status=In Process',
            subtitle: 'Under QR / TOR generation'
        },
        {
            title: 'Pending Refund',
            value: stats.pendingRefunds ?? 0,
            icon: 'fa-solid fa-receipt',
            iconBg: 'bg-rose-50 text-rose-600 border border-rose-200/60',
            link: '/transactions?tab=refunds&status=Pending',
            subtitle: 'Overpayment clearances'
        },
        {
            title: 'Released Document',
            value: stats.releasedRequests ?? 0,
            icon: 'fa-solid fa-circle-check',
            iconBg: 'bg-emerald-50 text-emerald-600 border border-emerald-200/60',
            link: '/requests?status=Released',
            subtitle: 'Claimed & verified records'
        },
        {
            title: 'Blockchain Records',
            value: stats.blockchainTransactions ?? 0,
            icon: 'fa-solid fa-cubes',
            iconBg: 'bg-sky-50 text-sky-600 border border-sky-200/60',
            link: '/blockchain/my-transactions',
            subtitle: 'Cryptographic ledger anchors'
        }
    ];

    const filteredRequests = (recentData.pendingRequests || []).filter(req => {
        const matchesSearch = searchFilter === '' || 
            (req.name && req.name.toLowerCase().includes(searchFilter.toLowerCase())) ||
            (req.requestId && req.requestId.toLowerCase().includes(searchFilter.toLowerCase())) ||
            (req.documentType && req.documentType.toLowerCase().includes(searchFilter.toLowerCase()));
        
        if (selectedTab === 'All') return matchesSearch;
        return matchesSearch && req.status?.toLowerCase() === selectedTab.toLowerCase();
    });

    return (
        <Layout>
            <div className="space-y-6 pb-6">
                {/* Error Output Message */}
                {error && (
                    <div className="flex items-center justify-between bg-red-50 border border-red-200 text-red-700 px-5 py-3.5 rounded-2xl shadow-sm">
                        <div className="flex items-center gap-2.5 text-sm font-semibold">
                            <AlertCircle size={18} />
                            <span>{error}</span>
                        </div>
                        <button onClick={fetchDashboardData} className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider hover:underline">
                            <RefreshCw size={13} /> Retry
                        </button>
                    </div>
                )}

                {/* ========================================================================= */}
                {/* 1. 3D ELEVATED STATS GRID                                                 */}
                {/* ========================================================================= */}
                <div className={`grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4 transition-opacity ${loading ? 'opacity-60' : 'opacity-100'}`}>
                    {statCards.map((card, idx) => (
                        <div 
                            key={idx}
                            onClick={() => navigate(card.link)}
                            className="bg-white rounded-[26px] p-5 shadow-[0_10px_30px_rgba(0,0,0,0.03),0_2px_8px_rgba(0,0,0,0.02)] border border-slate-100/90 flex flex-col justify-between min-h-[140px] relative cursor-pointer hover:shadow-xl hover:-translate-y-1 transition-all duration-300 group"
                        >
                            {/* Card Top Header with 3D Icon Badge & Arrow */}
                            <div className="flex justify-between items-start w-full">
                                <div className={`w-10 h-10 rounded-2xl ${card.iconBg} flex items-center justify-center text-sm shadow-xs transition-transform group-hover:scale-110`}>
                                    <i className={card.icon}></i>
                                </div>
                                <div className="w-7 h-7 rounded-full bg-slate-100 group-hover:bg-[#2c3543] text-slate-400 group-hover:text-white flex items-center justify-center transition-colors">
                                    <ArrowUpRight size={13} />
                                </div>
                            </div>

                            {/* Badge if pending */}
                            {card.badge && (
                                <span className="absolute top-3.5 right-12 bg-red-500 text-white text-[10px] font-extrabold px-2 py-0.5 rounded-full shadow-sm animate-pulse">
                                    {card.badge} Action
                                </span>
                            )}

                            {/* Card Value & Title */}
                            <div className="mt-3">
                                <span className="text-[32px] font-black text-slate-900 leading-none tracking-tight block">
                                    {card.value}
                                </span>
                                <span className="text-[13px] font-bold text-slate-700 mt-1 block">
                                    {card.title}
                                </span>
                                <span className="text-[10.5px] font-medium text-slate-400 block truncate mt-0.5">
                                    {card.subtitle}
                                </span>
                            </div>
                        </div>
                    ))}
                </div>

                {/* ========================================================================= */}
                {/* 2. MIDDLE SECTION: BLOCKCHAIN ACTIVITIES & SYSTEM NOTIFICATIONS           */}
                {/* ========================================================================= */}
                <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
                    
                    {/* Left Card: Blockchain Ledger Activities */}
                    <div className="bg-white rounded-[28px] shadow-[0_10px_30px_rgba(0,0,0,0.03),0_2px_8px_rgba(0,0,0,0.02)] border border-slate-100/90 flex flex-col h-[380px] overflow-hidden">
                        
                        {/* Header */}
                        <div className="py-4 px-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                            <div className="flex items-center gap-2.5">
                                <div className="w-8 h-8 rounded-xl bg-sky-50 text-sky-600 flex items-center justify-center text-xs font-bold border border-sky-200/60">
                                    <i className="fa-solid fa-cubes"></i>
                                </div>
                                <div>
                                    <h3 className="text-slate-900 text-[16px] font-extrabold m-0 leading-tight">Blockchain Activities</h3>
                                    <p className="text-[11px] text-slate-400 font-medium m-0">Cryptographic audit trail on smart contract</p>
                                </div>
                            </div>
                            <button 
                                onClick={() => navigate('/blockchain/my-transactions')} 
                                className="text-[12px] font-bold text-blue-600 hover:text-blue-700 flex items-center gap-1 bg-blue-50 px-3 py-1.5 rounded-full transition-colors"
                            >
                                <span>Explorer</span>
                                <ArrowUpRight size={12} />
                            </button>
                        </div>

                        {/* List Feed */}
                        <div className="flex-1 overflow-y-auto p-3 space-y-2 custom-scrollbar">
                            {recentData.transactions?.length > 0 ? (
                                recentData.transactions.map((tx, idx) => (
                                    <div 
                                        key={idx} 
                                        className="p-3 bg-slate-50/80 hover:bg-slate-100/90 rounded-2xl transition-all flex items-center justify-between border border-slate-100/80 group"
                                    >
                                        <div className="flex items-center gap-3 overflow-hidden">
                                            <div className="w-8 h-8 rounded-xl bg-white shadow-xs flex items-center justify-center text-blue-600 flex-shrink-0">
                                                <i className="fa-solid fa-cube text-xs"></i>
                                            </div>
                                            <div className="overflow-hidden">
                                                <span className="text-[13px] font-extrabold text-slate-900 block truncate">
                                                    {`${tx.referenceNumber || tx.requestId || '1786296589063-932'}`.startsWith('TXN-') 
                                                        ? `${tx.referenceNumber || tx.requestId || '1786296589063-932'}` 
                                                        : `TXN-${tx.referenceNumber || tx.requestId || '1786296589063-932'}`}
                                                </span>
                                                <span className="text-[11px] text-slate-400 font-medium block">
                                                    Block Confirmation Verified
                                                </span>
                                            </div>
                                        </div>
                                        
                                        <div className="flex items-center gap-2">
                                            <span 
                                                onClick={(e) => handleCopyHash(tx.blockchainTxHash || tx.transactionHash || '0x305babaefe2c95bae9fd86f6ba72...', e)}
                                                className="font-mono text-[11.5px] bg-white border border-slate-200/80 px-2.5 py-1 rounded-full text-slate-600 truncate max-w-[170px] sm:max-w-[210px] cursor-pointer hover:border-blue-400 hover:text-blue-600 transition-colors flex items-center gap-1.5"
                                                title="Click to copy hash"
                                            >
                                                <span>{tx.blockchainTxHash || tx.transactionHash || '0x305babaefe2c95bae9fd86f6ba72...'}</span>
                                                {copiedHash === (tx.blockchainTxHash || tx.transactionHash) ? <Check size={11} className="text-emerald-600" /> : <Copy size={11} className="text-slate-400" />}
                                            </span>
                                            <span className="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_6px_rgba(16,185,129,0.8)]"></span>
                                        </div>
                                    </div>
                                ))
                            ) : (
                                [1, 2, 3, 4, 5].map((item) => (
                                    <div key={item} className="p-3 bg-slate-50/80 hover:bg-slate-100/90 rounded-2xl transition-all flex items-center justify-between border border-slate-100/80">
                                        <div className="flex items-center gap-3">
                                            <div className="w-8 h-8 rounded-xl bg-white shadow-xs flex items-center justify-center text-blue-600 flex-shrink-0">
                                                <i className="fa-solid fa-cube text-xs"></i>
                                            </div>
                                            <div>
                                                <span className="text-[13px] font-extrabold text-slate-900 block">TXN-1786296589063-932</span>
                                                <span className="text-[11px] text-slate-400 font-medium block">Block Confirmed</span>
                                            </div>
                                        </div>
                                        <span className="font-mono text-[11.5px] bg-white border border-slate-200/80 px-3 py-1 rounded-full text-slate-600 truncate max-w-[180px]">
                                            0x305babaefe2c95bae9fd86f6ba72...
                                        </span>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>

                    {/* Right Card: Live Notifications Feed */}
                    <div className="bg-white rounded-[28px] shadow-[0_10px_30px_rgba(0,0,0,0.03),0_2px_8px_rgba(0,0,0,0.02)] border border-slate-100/90 flex flex-col h-[380px] overflow-hidden">
                        
                        {/* Header */}
                        <div className="py-4 px-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                            <div className="flex items-center gap-2.5">
                                <div className="w-8 h-8 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center text-xs font-bold border border-purple-200/60">
                                    <i className="fa-solid fa-bell"></i>
                                </div>
                                <div>
                                    <h3 className="text-slate-900 text-[16px] font-extrabold m-0 leading-tight">Live Notifications</h3>
                                    <p className="text-[11px] text-slate-400 font-medium m-0">Student requests & verification alerts</p>
                                </div>
                            </div>
                            <button 
                                onClick={() => navigate('/notifications')} 
                                className="text-[12px] font-bold text-purple-600 hover:text-purple-700 flex items-center gap-1 bg-purple-50 px-3 py-1.5 rounded-full transition-colors"
                            >
                                <span>View all</span>
                                <ArrowUpRight size={12} />
                            </button>
                        </div>

                        {/* List Feed */}
                        <div className="flex-1 overflow-y-auto p-3 space-y-2 custom-scrollbar">
                            {recentData.notifications?.length > 0 ? (
                                recentData.notifications.map((notif, idx) => (
                                    <div 
                                        key={idx} 
                                        onClick={() => navigate('/notifications')}
                                        className="p-3.5 bg-slate-50/80 hover:bg-slate-100/90 rounded-2xl transition-all flex items-start gap-3.5 border border-slate-100/80 cursor-pointer"
                                    >
                                        <div className="w-8 h-8 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center flex-shrink-0 mt-0.5">
                                            <i className="fa-solid fa-circle-info text-xs"></i>
                                        </div>
                                        <div className="flex-1">
                                            <p className="text-[13px] font-semibold text-slate-800 leading-snug m-0">
                                                {notif.message}
                                            </p>
                                            <span className="text-[11px] text-slate-400 font-medium mt-1 block">
                                                {notif.createdAt ? new Date(notif.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Recent Alert'}
                                            </span>
                                        </div>
                                        {!notif.isRead && (
                                            <span className="w-2.5 h-2.5 rounded-full bg-blue-600 flex-shrink-0 mt-1.5 shadow-[0_0_6px_rgba(37,99,235,0.6)]"></span>
                                        )}
                                    </div>
                                ))
                            ) : (
                                [1, 2, 3, 4].map((item) => (
                                    <div key={item} className="p-3.5 bg-slate-50/80 hover:bg-slate-100/90 rounded-2xl transition-all flex items-start gap-3.5 border border-slate-100/80">
                                        <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center flex-shrink-0 mt-0.5 border border-blue-200/50">
                                            <i className="fa-solid fa-file-circle-check text-xs"></i>
                                        </div>
                                        <div className="flex-1">
                                            <p className="text-[13px] font-semibold text-slate-800 leading-snug m-0">
                                                Request #req_1785820622982 for Diploma (2nd Copy) is ready for pickup!
                                            </p>
                                            <span className="text-[11px] text-slate-400 font-medium mt-0.5 block">
                                                10 minutes ago
                                            </span>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                </div>

                {/* ========================================================================= */}
                {/* 3. BOTTOM SECTION: ENHANCED RECENT REQUESTS TABLE                         */}
                {/* ========================================================================= */}
                <div className="bg-white rounded-[28px] shadow-[0_10px_30px_rgba(0,0,0,0.03),0_2px_8px_rgba(0,0,0,0.02)] border border-slate-100/90 overflow-hidden">
                    
                    {/* Table Toolbar Header */}
                    <div className="p-5 sm:p-6 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-50/40">
                        <div>
                            <h3 className="text-[18px] font-black text-slate-900 tracking-tight m-0">Recent Document Requests</h3>
                            <p className="text-[12px] text-slate-500 font-medium mt-0.5 m-0">Track live student clearance and document issuance queue</p>
                        </div>

                        {/* Search & Filter Controls */}
                        <div className="flex items-center gap-2.5 flex-wrap">
                            <div className="relative">
                                <i className="fa-solid fa-magnifying-glass absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 text-xs"></i>
                                <input 
                                    type="text" 
                                    placeholder="Filter by name, ID..." 
                                    value={searchFilter}
                                    onChange={(e) => setSearchFilter(e.target.value)}
                                    className="pl-9 pr-4 py-1.5 bg-white border border-slate-200 rounded-full text-[12.5px] font-medium text-slate-800 placeholder-slate-400 focus:outline-none focus:border-blue-500 shadow-2xs"
                                />
                            </div>

                            <button 
                                onClick={() => navigate('/requests')}
                                className="flex items-center gap-1.5 px-4 py-2 bg-[#2c3543] hover:bg-[#1f2631] text-white rounded-full text-[12.5px] font-bold shadow-md hover:shadow-lg transition-all active:scale-98"
                            >
                                <span>All Requests</span>
                                <ArrowUpRight size={13} />
                            </button>
                        </div>
                    </div>

                    {/* Table View */}
                    <div className="overflow-x-auto">
                        <table className="w-full border-collapse table-auto text-left">
                            <thead>
                                <tr className="bg-slate-50/70 border-b border-slate-100">
                                    <th className="py-4 px-6 text-[12px] font-extrabold text-slate-500 uppercase tracking-wider">Request ID</th>
                                    <th className="py-4 px-6 text-[12px] font-extrabold text-slate-500 uppercase tracking-wider">Student Name</th>
                                    <th className="py-4 px-6 text-[12px] font-extrabold text-slate-500 uppercase tracking-wider">Document Type</th>
                                    <th className="py-4 px-6 text-[12px] font-extrabold text-slate-500 uppercase tracking-wider">Date Requested</th>
                                    <th className="py-4 px-6 text-[12px] font-extrabold text-slate-500 uppercase tracking-wider text-center">Status</th>
                                    <th className="py-4 px-6 text-[12px] font-extrabold text-slate-500 uppercase tracking-wider text-right">Action</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {filteredRequests.length > 0 ? (
                                    filteredRequests.map((req, idx) => (
                                        <tr key={idx} className="hover:bg-slate-50/80 transition-colors">
                                            <td className="py-4 px-6 text-[13.5px] text-slate-900 font-extrabold align-middle">
                                                <span className="bg-slate-100 px-2.5 py-1 rounded-lg text-slate-700 font-mono text-[12px]">
                                                    {req.requestId}
                                                </span>
                                            </td>
                                            <td className="py-4 px-6 text-[13.5px] text-slate-900 font-bold align-middle">
                                                {req.name}
                                            </td>
                                            <td className="py-4 px-6 text-[13px] text-slate-700 font-medium align-middle">
                                                <span className="inline-flex items-center gap-1.5">
                                                    <i className="fa-solid fa-file-lines text-blue-500 text-xs"></i>
                                                    <span>{req.documentType || 'Certificate of Enrollment'}</span>
                                                </span>
                                            </td>
                                            <td className="py-4 px-6 text-[13px] text-slate-500 font-medium align-middle">
                                                {req.dateRequested || '26/03/27'}
                                            </td>
                                            <td className="py-4 px-6 text-center align-middle">
                                                <span className={`inline-flex items-center gap-1.5 py-1 px-3.5 rounded-full font-extrabold text-[11px] uppercase tracking-wider ${
                                                    req.status === 'Released' || req.status === 'Approved'
                                                        ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                                        : req.status === 'In Process'
                                                        ? 'bg-purple-50 text-purple-700 border border-purple-200'
                                                        : 'bg-amber-50 text-amber-700 border border-amber-200'
                                                }`}>
                                                    <span className={`w-1.5 h-1.5 rounded-full ${
                                                        req.status === 'Released' || req.status === 'Approved' ? 'bg-emerald-500' : req.status === 'In Process' ? 'bg-purple-500' : 'bg-amber-500'
                                                    }`}></span>
                                                    <span>{req.status || 'Pending'}</span>
                                                </span>
                                            </td>
                                            <td className="py-4 px-6 text-right align-middle">
                                                <button 
                                                    onClick={() => navigate(`/requests/${req.requestId}`)} 
                                                    className="bg-[#2c3543] hover:bg-[#1f2631] text-white py-1.5 px-4 rounded-full text-[12px] font-bold shadow-xs hover:shadow-md transition-all active:scale-95"
                                                >
                                                    View Details
                                                </button>
                                            </td>
                                        </tr>
                                    ))
                                ) : (
                                    [
                                        { id: 'REQ-1234-2026', name: 'Brad Mason', doc: 'Certificate of Enrollment', date: '26/03/27', status: 'Pending' },
                                        { id: 'REQ-1235-2026', name: 'Althea Vance', doc: 'Transcript of Records (TOR)', date: '27/03/27', status: 'In Process' },
                                        { id: 'REQ-1236-2026', name: 'John Doe', doc: 'Diploma (2nd Copy)', date: '28/03/27', status: 'Released' }
                                    ].map((item, idx) => (
                                        <tr key={idx} className="hover:bg-slate-50/80 transition-colors">
                                            <td className="py-4 px-6 text-[13.5px] text-slate-900 font-extrabold align-middle">
                                                <span className="bg-slate-100 px-2.5 py-1 rounded-lg text-slate-700 font-mono text-[12px]">
                                                    {item.id}
                                                </span>
                                            </td>
                                            <td className="py-4 px-6 text-[13.5px] text-slate-900 font-bold align-middle">
                                                {item.name}
                                            </td>
                                            <td className="py-4 px-6 text-[13px] text-slate-700 font-medium align-middle">
                                                <span className="inline-flex items-center gap-1.5">
                                                    <i className="fa-solid fa-file-lines text-blue-500 text-xs"></i>
                                                    <span>{item.doc}</span>
                                                </span>
                                            </td>
                                            <td className="py-4 px-6 text-[13px] text-slate-500 font-medium align-middle">
                                                {item.date}
                                            </td>
                                            <td className="py-4 px-6 text-center align-middle">
                                                <span className={`inline-flex items-center gap-1.5 py-1 px-3.5 rounded-full font-extrabold text-[11px] uppercase tracking-wider ${
                                                    item.status === 'Released'
                                                        ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                                        : item.status === 'In Process'
                                                        ? 'bg-purple-50 text-purple-700 border border-purple-200'
                                                        : 'bg-amber-50 text-amber-700 border border-amber-200'
                                                }`}>
                                                    <span className={`w-1.5 h-1.5 rounded-full ${
                                                        item.status === 'Released' ? 'bg-emerald-500' : item.status === 'In Process' ? 'bg-purple-500' : 'bg-amber-500'
                                                    }`}></span>
                                                    <span>{item.status}</span>
                                                </span>
                                            </td>
                                            <td className="py-4 px-6 text-right align-middle">
                                                <button 
                                                    onClick={() => navigate('/requests')}
                                                    className="bg-[#2c3543] hover:bg-[#1f2631] text-white py-1.5 px-4 rounded-full text-[12px] font-bold shadow-xs hover:shadow-md transition-all active:scale-95"
                                                >
                                                    View Details
                                                </button>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>

            </div>
        </Layout>
    );
};

export default Dashboard;
