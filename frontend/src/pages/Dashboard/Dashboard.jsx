import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Layout from '../../components/Layout';
import api from '../../api';
import { AlertCircle, RefreshCw, Search, ShieldCheck, ChevronRight, FileText, ArrowUpRight, CheckCircle2, Clock, Sparkles } from 'lucide-react';

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
    const [searchHash, setSearchHash] = useState('');
    const [activeFilter, setActiveFilter] = useState('All');

    const navigate = useNavigate();
    const userRole = localStorage.getItem('userRole') || 'super admin';
    const adminUser = JSON.parse(localStorage.getItem('adminUser') || '{}');

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

    const handleQuickVerify = (e) => {
        e.preventDefault();
        if (searchHash.trim()) {
            navigate(`/verify/results?hash=${encodeURIComponent(searchHash.trim())}`);
        }
    };

    const days = [
        { day: 'Mon', date: '24' },
        { day: 'Tue', date: '25' },
        { day: 'Wed', date: '26' },
        { day: 'Thu', date: '27' },
        { day: 'Fri', date: '28', active: true },
        { day: 'Sat', date: '29' },
        { day: 'Sun', date: '30' },
        { day: 'Mon', date: '31' }
    ];

    // Pipeline processors matching the inspiration layout
    const pipelineItems = [
        {
            name: 'Transcript of Records (TOR)',
            role: 'Registrar Staff Queue',
            avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=80',
            badge: { text: 'DOC-TOR-042 • In Process', type: 'purple', colStart: 2, colSpan: 2 }
        },
        {
            name: 'Diploma Certificates',
            role: 'QR Stamping & Audit',
            avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&auto=format&fit=crop&q=80',
            badge: { text: 'DIP-2026-08 • Stamped', type: 'emerald', colStart: 6, colSpan: 2 }
        },
        {
            name: 'Enrollment & Good Moral',
            role: 'Document Verification',
            avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=100&auto=format&fit=crop&q=80',
            badge: { text: 'REQ-9012 • Ready for Release', type: 'blue', colStart: 4, colSpan: 2 }
        },
        {
            name: 'Blockchain Hash Ledger',
            role: 'Smart Contract Sync',
            avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&auto=format&fit=crop&q=80',
            badge: { text: 'TX-104530 • Confirmed On-Chain', type: 'emerald', colStart: 1, colSpan: 2 }
        },
        {
            name: 'Student Refund Processing',
            role: 'Financial Verification',
            avatar: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=100&auto=format&fit=crop&q=80',
            badge: { text: 'REF-0089 • Approved', type: 'purple', colStart: 7, colSpan: 2 }
        }
    ];

    return (
        <Layout>
            <div className="space-y-6 pb-8">
                
                {/* Error Banner */}
                {error && (
                    <div className="flex items-center justify-between bg-red-50 border border-red-200 text-red-700 px-5 py-3.5 rounded-3xl shadow-sm">
                        <div className="flex items-center gap-2 text-sm font-medium">
                            <AlertCircle size={18} />
                            <span>{error}</span>
                        </div>
                        <button onClick={fetchDashboardData} className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider hover:underline">
                            <RefreshCw size={13} /> Retry
                        </button>
                    </div>
                )}

                {/* ========================================================================= */}
                {/* 1. TOP HERO WIDGET: DOCUMENT & BLOCKCHAIN VERIFICATION PIPELINE           */}
                {/* ========================================================================= */}
                <div className="bg-white rounded-[32px] p-6 sm:p-7 shadow-[0_10px_35px_rgba(0,0,0,0.03),0_2px_8px_rgba(0,0,0,0.02)] border border-white/80">
                    
                    {/* Hero Header */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
                        <div>
                            <h2 className="text-[22px] sm:text-[24px] font-extrabold text-gray-900 tracking-tight flex items-center gap-2.5">
                                <span>Verification Pipeline & Schedule</span>
                                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-600 border border-emerald-200/60">
                                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 mr-1.5 animate-pulse"></span> Live
                                </span>
                            </h2>
                            <p className="text-gray-500 text-[13px] font-normal mt-0.5">
                                Real-time document lifecycle queue, QR stamping, and blockchain anchoring.
                            </p>
                        </div>

                        {/* Top Controls & Metrics */}
                        <div className="flex items-center flex-wrap gap-2.5">
                            {/* Date Pill */}
                            <div className="flex items-center gap-2 px-3.5 py-1.5 bg-gray-100/80 rounded-full text-[12px] font-semibold text-gray-700 border border-gray-200/60">
                                <i className="fa-regular fa-calendar text-[12px] text-gray-500"></i>
                                <span>August 28, 2026</span>
                            </div>

                            {/* Filter Pill Selector */}
                            <div className="flex items-center bg-gray-100/80 p-1 rounded-full border border-gray-200/60">
                                {['All', 'TOR', 'Diploma'].map(f => (
                                    <button
                                        key={f}
                                        onClick={() => setActiveFilter(f)}
                                        className={`px-3 py-1 rounded-full text-[11.5px] font-bold transition-all ${
                                            activeFilter === f ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-900'
                                        }`}
                                    >
                                        {f}
                                    </button>
                                ))}
                            </div>

                            {/* View All Pill Link */}
                            <button 
                                onClick={() => navigate('/requests')}
                                className="flex items-center gap-1.5 px-3.5 py-1.5 bg-[#111827] hover:bg-[#213448] text-white rounded-full text-[12px] font-bold shadow-sm transition-all"
                            >
                                <span>View all</span>
                                <ArrowUpRight size={13} />
                            </button>
                        </div>
                    </div>

                    {/* Stats Summary Pills Bar */}
                    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 mb-6">
                        <div 
                            onClick={() => navigate('/requests')}
                            className="bg-gray-50/80 hover:bg-gray-100/80 p-3.5 rounded-2xl border border-gray-100 cursor-pointer transition-all text-center"
                        >
                            <span className="text-[11px] font-bold text-gray-500 uppercase tracking-wider block">Total Requests</span>
                            <span className="text-[22px] font-extrabold text-gray-900 mt-0.5 block">{stats.totalRequests ?? 0}</span>
                        </div>

                        <div 
                            onClick={() => navigate('/requests?status=Pending')}
                            className="bg-amber-50/60 hover:bg-amber-50 p-3.5 rounded-2xl border border-amber-200/50 cursor-pointer transition-all text-center relative"
                        >
                            <span className="text-[11px] font-bold text-amber-700 uppercase tracking-wider block">Pending</span>
                            <span className="text-[22px] font-extrabold text-amber-900 mt-0.5 block">{stats.pendingRequests ?? 0}</span>
                        </div>

                        <div 
                            onClick={() => navigate('/requests?status=In Process')}
                            className="bg-purple-50/60 hover:bg-purple-50 p-3.5 rounded-2xl border border-purple-200/50 cursor-pointer transition-all text-center"
                        >
                            <span className="text-[11px] font-bold text-purple-700 uppercase tracking-wider block">In Process</span>
                            <span className="text-[22px] font-extrabold text-purple-900 mt-0.5 block">{stats.inProcessRequests ?? 0}</span>
                        </div>

                        <div 
                            onClick={() => navigate('/requests?status=Released')}
                            className="bg-emerald-50/60 hover:bg-emerald-50 p-3.5 rounded-2xl border border-emerald-200/50 cursor-pointer transition-all text-center"
                        >
                            <span className="text-[11px] font-bold text-emerald-700 uppercase tracking-wider block">Released</span>
                            <span className="text-[22px] font-extrabold text-emerald-900 mt-0.5 block">{stats.releasedRequests ?? 0}</span>
                        </div>

                        <div 
                            onClick={() => navigate('/transactions?tab=refunds')}
                            className="bg-rose-50/60 hover:bg-rose-50 p-3.5 rounded-2xl border border-rose-200/50 cursor-pointer transition-all text-center"
                        >
                            <span className="text-[11px] font-bold text-rose-700 uppercase tracking-wider block">Refunds</span>
                            <span className="text-[22px] font-extrabold text-rose-900 mt-0.5 block">{stats.pendingRefunds ?? 0}</span>
                        </div>

                        <div 
                            onClick={() => navigate('/blockchain/my-transactions')}
                            className="bg-blue-50/60 hover:bg-blue-50 p-3.5 rounded-2xl border border-blue-200/50 cursor-pointer transition-all text-center"
                        >
                            <span className="text-[11px] font-bold text-blue-700 uppercase tracking-wider block">On-Chain Txs</span>
                            <span className="text-[22px] font-extrabold text-blue-900 mt-0.5 block">{stats.blockchainTransactions ?? 0}</span>
                        </div>
                    </div>

                    {/* Interactive Pipeline Matrix (Inspired by Mockup Calendar View) */}
                    <div className="overflow-x-auto">
                        <div className="min-w-[840px]">
                            {/* Days Timeline Header */}
                            <div className="grid grid-cols-12 gap-2 pb-3 border-b border-gray-100 text-center items-center">
                                <div className="col-span-4 text-left pl-3 text-[12px] font-bold text-gray-400 uppercase tracking-wider">
                                    Queue / Module
                                </div>
                                <div className="col-span-8 grid grid-cols-8 gap-1.5 text-[12px] font-bold text-gray-500">
                                    {days.map((d, i) => (
                                        <div key={i} className={`py-1.5 px-2 rounded-2xl flex flex-col items-center justify-center transition-colors ${
                                            d.active ? 'bg-blue-600 text-white shadow-md shadow-blue-500/20' : 'hover:bg-gray-100'
                                        }`}>
                                            <span className="text-[10px] font-medium uppercase">{d.day}</span>
                                            <span className="text-[13px] font-extrabold">{d.date}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Matrix Rows */}
                            <div className="divide-y divide-gray-100/80">
                                {pipelineItems.map((item, idx) => (
                                    <div key={idx} className="grid grid-cols-12 gap-2 py-3.5 items-center hover:bg-gray-50/50 rounded-2xl transition-colors">
                                        {/* Left: Item Label */}
                                        <div className="col-span-4 flex items-center gap-3 pl-2">
                                            <img src={item.avatar} alt={item.name} className="w-9 h-9 rounded-full object-cover shadow-sm flex-shrink-0" />
                                            <div className="overflow-hidden">
                                                <p className="text-[13.5px] font-bold text-gray-900 leading-tight truncate">{item.name}</p>
                                                <p className="text-[11px] text-gray-400 font-medium leading-tight truncate">{item.role}</p>
                                            </div>
                                        </div>

                                        {/* Right: Grid Cells with Status Pills */}
                                        <div className="col-span-8 grid grid-cols-8 gap-1.5 items-center relative h-10">
                                            {/* Vertical Active Guide Line */}
                                            <div className="absolute left-[56.25%] top-0 bottom-0 w-0.5 border-r border-dashed border-blue-400 z-0 opacity-40"></div>

                                            {/* Status Badge */}
                                            <div 
                                                style={{ 
                                                    gridColumnStart: item.badge.colStart, 
                                                    gridColumnEnd: `span ${item.badge.colSpan}` 
                                                }}
                                                className={`z-10 px-3.5 py-1.5 rounded-full text-[11px] font-bold flex items-center justify-center shadow-sm truncate cursor-pointer hover:opacity-90 transition-opacity ${
                                                    item.badge.type === 'purple'
                                                        ? 'bg-gradient-to-r from-purple-500 to-indigo-600 text-white shadow-purple-500/20'
                                                        : item.badge.type === 'emerald'
                                                        ? 'bg-emerald-500 text-white shadow-emerald-500/20'
                                                        : item.badge.type === 'blue'
                                                        ? 'bg-gradient-to-r from-sky-400 to-blue-600 text-white shadow-blue-500/20'
                                                        : 'bg-amber-400 text-gray-950 shadow-amber-400/20'
                                                }`}
                                                onClick={() => navigate('/requests')}
                                            >
                                                {item.badge.text}
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>

                </div>

                {/* ========================================================================= */}
                {/* 2. BOTTOM 3-COLUMN MULTI-WIDGET GRID (MATCHING INSPIRATION DESIGN)        */}
                {/* ========================================================================= */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    
                    {/* --------------------------------------------------------------------- */}
                    {/* WIDGET A (LEFT): PRIORITY QUEUE & RECENT HIGHLIGHTS                   */}
                    {/* --------------------------------------------------------------------- */}
                    <div className="bg-white rounded-[32px] p-6 shadow-[0_10px_35px_rgba(0,0,0,0.03),0_2px_8px_rgba(0,0,0,0.02)] border border-white/80 flex flex-col justify-between">
                        <div>
                            <div className="flex items-center justify-between mb-4">
                                <h3 className="text-[17px] font-extrabold text-gray-900 tracking-tight">Priority Queue</h3>
                                <button onClick={() => navigate('/requests')} className="text-[12px] font-bold text-gray-400 hover:text-gray-800 flex items-center gap-1">
                                    <span>View all</span>
                                    <ArrowUpRight size={13} />
                                </button>
                            </div>

                            {/* Vibrant Yellow/Amber Highlight Card (Inspired by Reference) */}
                            <div className="bg-gradient-to-br from-amber-300 via-amber-400 to-yellow-400 rounded-3xl p-5 text-gray-900 shadow-md shadow-amber-400/20 mb-4 relative overflow-hidden">
                                <div className="flex items-center justify-between mb-2.5">
                                    <span className="text-[11px] font-extrabold uppercase tracking-wider bg-black/10 px-2.5 py-0.5 rounded-full">
                                        Urgent Request
                                    </span>
                                    <span className="text-[11px] font-bold bg-white/60 px-2.5 py-0.5 rounded-full flex items-center gap-1">
                                        <Clock size={11} /> 10:30 AM
                                    </span>
                                </div>
                                <h4 className="font-extrabold text-[16px] leading-snug mb-1">
                                    Official Transcript of Records
                                </h4>
                                <p className="text-[12px] text-gray-800 font-medium leading-relaxed mb-4">
                                    Juan Dela Cruz (BSIT) requested accelerated graduation clearance verification.
                                </p>
                                
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center -space-x-2">
                                        <img src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=80" alt="Avatar" className="w-7 h-7 rounded-full border-2 border-white object-cover" />
                                        <img src="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&auto=format&fit=crop&q=80" alt="Avatar" className="w-7 h-7 rounded-full border-2 border-white object-cover" />
                                        <span className="w-7 h-7 rounded-full bg-white text-[10px] font-bold flex items-center justify-center text-gray-800 border-2 border-white">+2</span>
                                    </div>
                                    <button 
                                        onClick={() => navigate('/requests')}
                                        className="bg-[#111827] hover:bg-black text-white text-[11.5px] font-bold px-3.5 py-1.5 rounded-full shadow-sm transition-all"
                                    >
                                        Process Now
                                    </button>
                                </div>
                            </div>

                            {/* Secondary Items */}
                            <div className="space-y-3">
                                <div className="p-3.5 rounded-2xl bg-gray-50 hover:bg-gray-100/80 transition-colors flex items-center justify-between">
                                    <div className="overflow-hidden">
                                        <p className="text-[13px] font-bold text-gray-900 truncate">Smart Contract Block Audit</p>
                                        <p className="text-[11px] text-gray-500 truncate">Automatic cryptographic block sync #104530</p>
                                    </div>
                                    <span className="text-[11px] font-bold text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200">
                                        Synced
                                    </span>
                                </div>

                                <div className="p-3.5 rounded-2xl bg-gray-50 hover:bg-gray-100/80 transition-colors flex items-center justify-between">
                                    <div className="overflow-hidden">
                                        <p className="text-[13px] font-bold text-gray-900 truncate">Diploma Re-issue Approval</p>
                                        <p className="text-[11px] text-gray-500 truncate">Maria Santos • Ready for QR stamping</p>
                                    </div>
                                    <span className="text-[11px] font-bold text-purple-600 bg-purple-50 px-2.5 py-1 rounded-full border border-purple-200">
                                        Review
                                    </span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* --------------------------------------------------------------------- */}
                    {/* WIDGET B (MIDDLE): 2x2 PROCESSORS & REGISTRAR STAFF GRID             */}
                    {/* --------------------------------------------------------------------- */}
                    <div className="bg-white rounded-[32px] p-6 shadow-[0_10px_35px_rgba(0,0,0,0.03),0_2px_8px_rgba(0,0,0,0.02)] border border-white/80 flex flex-col justify-between">
                        <div>
                            <div className="flex items-center justify-between mb-4">
                                <h3 className="text-[17px] font-extrabold text-gray-900 tracking-tight">
                                    {userRole === 'super admin' ? 'Registrar Processors' : 'Document Channels'}
                                </h3>
                                <button onClick={() => navigate(userRole === 'super admin' ? '/manage-registrar' : '/requests')} className="text-[12px] font-bold text-gray-400 hover:text-gray-800 flex items-center gap-1">
                                    <span>View all</span>
                                    <ArrowUpRight size={13} />
                                </button>
                            </div>

                            {/* 2x2 Staff / Processing Cards Grid */}
                            <div className="grid grid-cols-2 gap-3.5">
                                
                                {/* Card 1 */}
                                <div className="bg-gray-50/90 rounded-2xl p-4 text-center border border-gray-100/80 hover:border-gray-200 transition-all flex flex-col items-center">
                                    <img src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=80" alt="Staff" className="w-12 h-12 rounded-full object-cover mb-2 shadow-sm" />
                                    <h4 className="text-[13px] font-bold text-gray-900 leading-tight">Maria Santos</h4>
                                    <p className="text-[10.5px] text-gray-500 font-medium mb-3">Senior Registrar</p>
                                    <button 
                                        onClick={() => navigate('/requests')}
                                        className="w-full py-1.5 bg-white hover:bg-gray-100 text-gray-800 rounded-full text-[11px] font-bold border border-gray-200 shadow-2xs transition-all"
                                    >
                                        View Queue
                                    </button>
                                </div>

                                {/* Card 2 */}
                                <div className="bg-gray-50/90 rounded-2xl p-4 text-center border border-gray-100/80 hover:border-gray-200 transition-all flex flex-col items-center">
                                    <img src="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&auto=format&fit=crop&q=80" alt="Staff" className="w-12 h-12 rounded-full object-cover mb-2 shadow-sm" />
                                    <h4 className="text-[13px] font-bold text-gray-900 leading-tight">Lucas Morgan</h4>
                                    <p className="text-[10.5px] text-gray-500 font-medium mb-3">Records Officer</p>
                                    <button 
                                        onClick={() => navigate('/requests')}
                                        className="w-full py-1.5 bg-white hover:bg-gray-100 text-gray-800 rounded-full text-[11px] font-bold border border-gray-200 shadow-2xs transition-all"
                                    >
                                        View Queue
                                    </button>
                                </div>

                                {/* Card 3 */}
                                <div className="bg-gray-50/90 rounded-2xl p-4 text-center border border-gray-100/80 hover:border-gray-200 transition-all flex flex-col items-center">
                                    <img src="https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=100&auto=format&fit=crop&q=80" alt="Staff" className="w-12 h-12 rounded-full object-cover mb-2 shadow-sm" />
                                    <h4 className="text-[13px] font-bold text-gray-900 leading-tight">Mason Reed</h4>
                                    <p className="text-[10.5px] text-gray-500 font-medium mb-3">Blockchain Admin</p>
                                    <button 
                                        onClick={() => navigate('/blockchain')}
                                        className="w-full py-1.5 bg-white hover:bg-gray-100 text-gray-800 rounded-full text-[11px] font-bold border border-gray-200 shadow-2xs transition-all"
                                    >
                                        Node Status
                                    </button>
                                </div>

                                {/* Card 4 */}
                                <div className="bg-gray-50/90 rounded-2xl p-4 text-center border border-gray-100/80 hover:border-gray-200 transition-all flex flex-col items-center">
                                    <img src="https://images.unsplash.com/photo-1517841905240-472988babdf9?w=100&auto=format&fit=crop&q=80" alt="Staff" className="w-12 h-12 rounded-full object-cover mb-2 shadow-sm" />
                                    <h4 className="text-[13px] font-bold text-gray-900 leading-tight">Justin Crown</h4>
                                    <p className="text-[10.5px] text-gray-500 font-medium mb-3">Document Verifier</p>
                                    <button 
                                        onClick={() => navigate('/requests')}
                                        className="w-full py-1.5 bg-white hover:bg-gray-100 text-gray-800 rounded-full text-[11px] font-bold border border-gray-200 shadow-2xs transition-all"
                                    >
                                        View Queue
                                    </button>
                                </div>

                            </div>
                        </div>
                    </div>

                    {/* --------------------------------------------------------------------- */}
                    {/* WIDGET C (RIGHT): VERIFITOR AI & QUICK VERIFICATION HUB               */}
                    {/* --------------------------------------------------------------------- */}
                    <div className="bg-white rounded-[32px] p-6 shadow-[0_10px_35px_rgba(0,0,0,0.03),0_2px_8px_rgba(0,0,0,0.02)] border border-white/80 flex flex-col justify-between text-center relative overflow-hidden">
                        
                        <div>
                            {/* Glassmorphic 3D Orb Graphic */}
                            <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-gradient-to-tr from-blue-500 via-indigo-400 to-sky-300 shadow-xl shadow-blue-500/20 flex items-center justify-center relative animate-pulse">
                                <div className="w-10 h-10 rounded-full bg-white/40 backdrop-blur-md flex items-center justify-center">
                                    <ShieldCheck className="text-white w-6 h-6" />
                                </div>
                            </div>

                            {/* Greeting Header */}
                            <h3 className="text-[19px] font-extrabold text-gray-900 tracking-tight leading-snug">
                                Welcome, {adminUser.name ? adminUser.name.split(' ')[0] : 'Administrator'}!
                            </h3>
                            <p className="text-[13px] text-gray-500 font-normal mt-1 mb-5">
                                What can I help with today?
                            </p>

                            {/* Quick Action Pill Chips */}
                            <div className="flex flex-wrap items-center justify-center gap-2 mb-6">
                                <button 
                                    onClick={() => navigate('/verify')}
                                    className="px-3.5 py-1.5 bg-gray-100/90 hover:bg-gray-200/90 text-gray-800 rounded-full text-[11.5px] font-bold transition-all"
                                >
                                    + Verify Hash
                                </button>
                                
                                {userRole === 'super admin' ? (
                                    <button 
                                        onClick={() => navigate('/manage-registrar/add')}
                                        className="px-3.5 py-1.5 bg-gray-100/90 hover:bg-gray-200/90 text-gray-800 rounded-full text-[11.5px] font-bold transition-all"
                                    >
                                        + Add Registrar
                                    </button>
                                ) : (
                                    <button 
                                        onClick={() => navigate('/requests')}
                                        className="px-3.5 py-1.5 bg-gray-100/90 hover:bg-gray-200/90 text-gray-800 rounded-full text-[11.5px] font-bold transition-all"
                                    >
                                        + New Request
                                    </button>
                                )}

                                <button 
                                    onClick={() => navigate('/blockchain')}
                                    className="px-3.5 py-1.5 bg-gray-100/90 hover:bg-gray-200/90 text-gray-800 rounded-full text-[11.5px] font-bold transition-all"
                                >
                                    Audit Contract
                                </button>
                            </div>
                        </div>

                        {/* Quick Hash Search Bar Input */}
                        <form onSubmit={handleQuickVerify} className="relative mt-2">
                            <input 
                                type="text" 
                                placeholder="Paste Document Hash or Request ID..." 
                                value={searchHash}
                                onChange={(e) => setSearchHash(e.target.value)}
                                className="w-full pl-5 pr-24 py-3 bg-gray-50 hover:bg-gray-100/70 border border-gray-200/80 rounded-full text-[13px] text-gray-800 placeholder-gray-400 focus:outline-none focus:border-blue-500 focus:bg-white transition-all shadow-inner"
                            />
                            <button 
                                type="submit"
                                className="absolute right-1.5 top-1/2 -translate-y-1/2 px-4 py-1.5 bg-[#111827] hover:bg-[#213448] text-white text-[11.5px] font-bold rounded-full shadow-sm transition-all"
                            >
                                Verify
                            </button>
                        </form>
                    </div>

                </div>

            </div>
        </Layout>
    );
};

export default Dashboard;
