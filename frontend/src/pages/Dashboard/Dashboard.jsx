import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Layout from '../../components/Layout';
import api from '../../api';
import { 
    AlertCircle, 
    RefreshCw, 
    ArrowUpRight, 
    FileText, 
    Check, 
    CreditCard, 
    Receipt, 
    Activity, 
    Copy
} from 'lucide-react';

const Dashboard = () => {
    const [stats, setStats] = useState({
        totalRequests: 0,
        pendingRequests: 0,
        inProcessRequests: 0,
        rejectedRequests: 0,
        releasedRequests: 0,
        blockchainTransactions: 0,
        totalRevenue: 0,
        totalRefunded: 0,
        pendingPayments: 0,
        completedPayments: 0,
        rejectedPayments: 0,
        pendingRefunds: 0,
        totalRefunds: 0,
        totalStudents: 0,
        totalAlumni: 0,
        totalUsers: 0,
        activeStaff: 0,
        inactiveStaff: 0,
        registrarStaffCount: 0,
        accountingStaffCount: 0,
        itStaffCount: 0,
        todayRevenue: 0,
        todayCompletedPaymentsCount: 0,
        todayReleasedRequestsCount: 0,
        paymentChannels: { gcash: 0, landbank: 0, other: 0 }
    });
    
    const [recentData, setRecentData] = useState({
        transactions: [],
        notifications: [],
        pendingRequests: [],
        priorityPendingRequests: [],
        recentPayments: [],
        priorityPendingPayments: [],
        recentRefunds: [],
        recentLogs: []
    });

    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [searchFilter, setSearchFilter] = useState('');
    const [requestStatusFilter, setRequestStatusFilter] = useState('All');
    const [paymentStatusFilter, setPaymentStatusFilter] = useState('All');
    const [superAdminTab, setSuperAdminTab] = useState('requests'); // 'requests' | 'payments' | 'logs'
    const [copiedHash, setCopiedHash] = useState(null);

    const navigate = useNavigate();

    // User & Role Identification
    const userRole = (localStorage.getItem('userRole') || '').toLowerCase();
    const adminUser = JSON.parse(localStorage.getItem('adminUser') || '{}');
    const userName = adminUser.name || `${adminUser.firstName || ''} ${adminUser.lastName || ''}`.trim() || 'Staff';

    const isSuperAdmin = userRole === 'super admin';
    const isITAdmin = userRole === 'it administrator' || userRole === 'it admin';
    const isRegistrarAdmin = userRole === 'registrar admin';
    const isRegistrarStaff = userRole === 'registrar staff' || (userRole.includes('registrar') && !userRole.includes('admin')) || userRole === 'registrar';
    const isAccountingAdmin = userRole === 'accounting admin';
    const isAccountingStaff = userRole === 'accounting staff' || (userRole.includes('accounting') && !userRole.includes('admin'));
    const isAccounting = isAccountingAdmin || isAccountingStaff;
    const isRegistrar = isRegistrarAdmin || isRegistrarStaff;

    const fetchDashboardData = async () => {
        setLoading(true);
        setError(null);
        try {
            const [statsRes, recentRes] = await Promise.all([
                api.get('/dashboard/stats'),
                api.get('/dashboard/recent')
            ]);
            
            setStats(statsRes.data || {});
            setRecentData(recentRes.data || { 
                transactions: [], 
                notifications: [], 
                pendingRequests: [],
                priorityPendingRequests: [],
                recentPayments: [],
                priorityPendingPayments: [],
                recentRefunds: [],
                recentLogs: []
            });
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

    const formatShortId = (id, prefix = 'TXN') => {
        if (!id) return `#${prefix}-001`;
        const str = String(id);
        if (str.length <= 10) return str.startsWith('#') ? str : `#${str}`;
        const lastPart = str.split('-').pop() || str.slice(-4);
        return `#${prefix}-${lastPart.length > 6 ? lastPart.slice(-4) : lastPart}`;
    };

    // --- Role-Specific Stat Cards Configuration (Tailored for each of the 6 roles) ---
    let statCards = [];

    if (isAccountingAdmin) {
        // 1. Accounting Admin (Executive Finance Oversight)
        statCards = [
            {
                title: 'Total Collections',
                value: `₱${Number(stats.totalRevenue || 0).toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
                icon: 'fa-solid fa-coins',
                iconBg: 'bg-emerald-50 text-emerald-600 border border-emerald-200/60',
                link: '/transactions',
                subtitle: 'Verified & received payments'
            },
            {
                title: 'Pending Verification',
                value: stats.pendingPayments ?? 0,
                icon: 'fa-solid fa-clock-rotate-left',
                iconBg: 'bg-amber-50 text-amber-600 border border-amber-200/60',
                badge: stats.pendingPayments > 0 ? stats.pendingPayments : null,
                link: '/transactions',
                subtitle: 'Receipts awaiting audit'
            },
            {
                title: 'Approved Payments',
                value: stats.completedPayments ?? 0,
                icon: 'fa-solid fa-circle-check',
                iconBg: 'bg-blue-50 text-blue-600 border border-blue-200/60',
                link: '/transactions',
                subtitle: 'Cleared transactions'
            },
            {
                title: 'Pending Refunds',
                value: stats.pendingRefunds ?? 0,
                icon: 'fa-solid fa-receipt',
                iconBg: 'bg-purple-50 text-purple-600 border border-purple-200/60',
                badge: stats.pendingRefunds > 0 ? stats.pendingRefunds : null,
                link: '/transactions?tab=refunds',
                subtitle: 'Overpayment claims'
            },
            {
                title: 'Settled Refunds',
                value: `₱${Number(stats.totalRefunded || 0).toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
                icon: 'fa-solid fa-hand-holding-dollar',
                iconBg: 'bg-indigo-50 text-indigo-600 border border-indigo-200/60',
                link: '/transactions?tab=refunds',
                subtitle: 'Total refunds issued'
            },
            {
                title: 'Accounting Staff',
                value: stats.accountingStaffCount ?? 0,
                icon: 'fa-solid fa-users-gear',
                iconBg: 'bg-teal-50 text-teal-600 border border-teal-200/60',
                link: '/manage-registrar',
                subtitle: 'Active finance personnel'
            }
        ];
    } else if (isAccountingStaff) {
        // 2. Accounting Staff (Daily Payment Audits Desk)
        statCards = [
            {
                title: 'Receipts to Verify',
                value: stats.pendingPayments ?? 0,
                icon: 'fa-solid fa-clock-rotate-left',
                iconBg: 'bg-amber-50 text-amber-600 border border-amber-200/60',
                badge: stats.pendingPayments > 0 ? stats.pendingPayments : null,
                link: '/transactions',
                subtitle: 'Awaiting your audit'
            },
            {
                title: 'Cleared Payments',
                value: stats.completedPayments ?? 0,
                icon: 'fa-solid fa-circle-check',
                iconBg: 'bg-emerald-50 text-emerald-600 border border-emerald-200/60',
                link: '/transactions',
                subtitle: 'Approved transactions'
            },
            {
                title: 'Rejected Receipts',
                value: stats.rejectedPayments ?? 0,
                icon: 'fa-solid fa-circle-xmark',
                iconBg: 'bg-rose-50 text-rose-600 border border-rose-200/60',
                link: '/transactions',
                subtitle: 'Flagged invalid / incomplete'
            },
            {
                title: "Today's Revenue",
                value: `₱${Number(stats.todayRevenue || 0).toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
                icon: 'fa-solid fa-coins',
                iconBg: 'bg-blue-50 text-blue-600 border border-blue-200/60',
                link: '/transactions',
                subtitle: 'Verified today'
            },
            {
                title: 'Pending Refunds',
                value: stats.pendingRefunds ?? 0,
                icon: 'fa-solid fa-receipt',
                iconBg: 'bg-purple-50 text-purple-600 border border-purple-200/60',
                link: '/transactions?tab=refunds',
                subtitle: 'Claims to inspect'
            },
            {
                title: 'Cleared Today',
                value: stats.todayCompletedPaymentsCount ?? 0,
                icon: 'fa-solid fa-calendar-check',
                iconBg: 'bg-indigo-50 text-indigo-600 border border-indigo-200/60',
                link: '/transactions',
                subtitle: 'Payments approved today'
            }
        ];
    } else if (isITAdmin) {
        // 3. IT Administrator (Security, Identity & Logs)
        statCards = [
            {
                title: 'Active Students',
                value: stats.totalStudents ?? 0,
                icon: 'fa-solid fa-user-graduate',
                iconBg: 'bg-blue-50 text-blue-600 border border-blue-200/60',
                link: '/manage-users',
                subtitle: 'Undergraduate student accounts'
            },
            {
                title: 'Alumni Accounts',
                value: stats.totalAlumni ?? 0,
                icon: 'fa-solid fa-award',
                iconBg: 'bg-purple-50 text-purple-600 border border-purple-200/60',
                link: '/manage-users',
                subtitle: 'Graduated student accounts'
            },
            {
                title: 'Active Staff',
                value: stats.activeStaff ?? 0,
                icon: 'fa-solid fa-user-check',
                iconBg: 'bg-emerald-50 text-emerald-600 border border-emerald-200/60',
                link: '/manage-registrar',
                subtitle: 'Registrar, Accounting & IT staff'
            },
            {
                title: 'Inactive Accounts',
                value: stats.inactiveStaff ?? 0,
                icon: 'fa-solid fa-user-slash',
                iconBg: 'bg-amber-50 text-amber-600 border border-amber-200/60',
                badge: stats.inactiveStaff > 0 ? stats.inactiveStaff : null,
                link: '/manage-registrar',
                subtitle: 'Deactivated / Pending activation'
            },
            {
                title: 'Secured Records',
                value: stats.blockchainTransactions ?? 0,
                icon: 'fa-solid fa-shield-halved',
                iconBg: 'bg-sky-50 text-sky-600 border border-sky-200/60',
                link: '/blockchain',
                subtitle: 'Hyperledger Besu blocks'
            },
            {
                title: 'Audit Logs',
                value: recentData.recentLogs?.length || 0,
                icon: 'fa-solid fa-clipboard-list',
                iconBg: 'bg-slate-100 text-slate-700 border border-slate-200/60',
                link: '/activity-logs',
                subtitle: 'Recent system transactions'
            }
        ];
    } else if (isRegistrarAdmin) {
        // 4. Registrar Admin (Office Head & Workflow Management)
        statCards = [
            {
                title: 'Total Requests',
                value: stats.totalRequests ?? 0,
                icon: 'fa-solid fa-folder-open',
                iconBg: 'bg-blue-50 text-blue-600 border border-blue-200/60',
                link: '/requests',
                subtitle: 'Lifetime document submissions'
            },
            {
                title: 'Pending Review',
                value: stats.pendingRequests ?? 0,
                icon: 'fa-solid fa-clock-rotate-left',
                iconBg: 'bg-amber-50 text-amber-600 border border-amber-200/60',
                badge: stats.pendingRequests > 0 ? stats.pendingRequests : null,
                link: '/requests?status=Pending',
                subtitle: 'Awaiting initial evaluation'
            },
            {
                title: 'In Process',
                value: stats.inProcessRequests ?? 0,
                icon: 'fa-solid fa-spinner',
                iconBg: 'bg-purple-50 text-purple-600 border border-purple-200/60',
                link: '/requests?status=In Process',
                subtitle: 'Under TOR / PDF preparation'
            },
            {
                title: 'Ready for Release',
                value: stats.releasedRequests ?? 0,
                icon: 'fa-solid fa-circle-check',
                iconBg: 'bg-emerald-50 text-emerald-600 border border-emerald-200/60',
                link: '/requests?status=Released',
                subtitle: 'Prepared / Available for pickup'
            },
            {
                title: 'Secured on Chain',
                value: stats.blockchainTransactions ?? 0,
                icon: 'fa-solid fa-shield-halved',
                iconBg: 'bg-sky-50 text-sky-600 border border-sky-200/60',
                link: '/blockchain/my-transactions',
                subtitle: 'Anchored on blockchain ledger'
            },
            {
                title: 'Registrar Staff',
                value: stats.registrarStaffCount ?? 0,
                icon: 'fa-solid fa-users-gear',
                iconBg: 'bg-indigo-50 text-indigo-600 border border-indigo-200/60',
                link: '/manage-registrar',
                subtitle: 'Academic personnel active'
            }
        ];
    } else if (isRegistrarStaff) {
        // 5. Registrar Staff (Operations Processing Desk)
        statCards = [
            {
                title: 'Pending Requests',
                value: stats.pendingRequests ?? 0,
                icon: 'fa-solid fa-clock-rotate-left',
                iconBg: 'bg-amber-50 text-amber-600 border border-amber-200/60',
                badge: stats.pendingRequests > 0 ? stats.pendingRequests : null,
                link: '/requests?status=Pending',
                subtitle: 'Awaiting initial review'
            },
            {
                title: 'In Process',
                value: stats.inProcessRequests ?? 0,
                icon: 'fa-solid fa-spinner',
                iconBg: 'bg-purple-50 text-purple-600 border border-purple-200/60',
                link: '/requests?status=In Process',
                subtitle: 'Under preparation'
            },
            {
                title: 'Ready for Release',
                value: stats.releasedRequests ?? 0,
                icon: 'fa-solid fa-circle-check',
                iconBg: 'bg-emerald-50 text-emerald-600 border border-emerald-200/60',
                link: '/requests?status=Released',
                subtitle: 'Available for student pickup'
            },
            {
                title: 'Released Today',
                value: stats.todayReleasedRequestsCount ?? 0,
                icon: 'fa-solid fa-calendar-check',
                iconBg: 'bg-teal-50 text-teal-600 border border-teal-200/60',
                link: '/requests?status=Released',
                subtitle: 'Completed output today'
            },
            {
                title: 'Secured on Chain',
                value: stats.blockchainTransactions ?? 0,
                icon: 'fa-solid fa-shield-halved',
                iconBg: 'bg-sky-50 text-sky-600 border border-sky-200/60',
                link: '/blockchain/my-transactions',
                subtitle: 'Blockchain records anchored'
            },
            {
                title: 'Lifetime Fulfilled',
                value: stats.releasedRequests ?? 0,
                icon: 'fa-solid fa-award',
                iconBg: 'bg-indigo-50 text-indigo-600 border border-indigo-200/60',
                link: '/requests',
                subtitle: 'Total completed requests'
            }
        ];
    } else {
        // 6. Super Admin (Master Executive Governance View)
        statCards = [
            {
                title: 'Total Requests',
                value: stats.totalRequests ?? 0,
                icon: 'fa-solid fa-folder-open',
                iconBg: 'bg-blue-50 text-blue-600 border border-blue-200/60',
                link: '/requests',
                subtitle: 'All document submissions'
            },
            {
                title: 'Pending Requests',
                value: stats.pendingRequests ?? 0,
                icon: 'fa-solid fa-clock-rotate-left',
                iconBg: 'bg-amber-50 text-amber-600 border border-amber-200/60',
                badge: stats.pendingRequests > 0 ? stats.pendingRequests : null,
                link: '/requests?status=Pending',
                subtitle: 'Requires registrar review'
            },
            {
                title: 'Total Revenue',
                value: `₱${Number(stats.totalRevenue || 0).toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
                icon: 'fa-solid fa-coins',
                iconBg: 'bg-emerald-50 text-emerald-600 border border-emerald-200/60',
                link: '/transactions',
                subtitle: 'Lifetime verified payments'
            },
            {
                title: 'Pending Clearance',
                value: (stats.pendingPayments || 0) + (stats.pendingRefunds || 0),
                icon: 'fa-solid fa-receipt',
                iconBg: 'bg-rose-50 text-rose-600 border border-rose-200/60',
                badge: ((stats.pendingPayments || 0) + (stats.pendingRefunds || 0)) > 0 ? ((stats.pendingPayments || 0) + (stats.pendingRefunds || 0)) : null,
                link: '/transactions',
                subtitle: 'Payments & refunds awaiting audit'
            },
            {
                title: 'Secured on Chain',
                value: stats.blockchainTransactions ?? 0,
                icon: 'fa-solid fa-shield-halved',
                iconBg: 'bg-sky-50 text-sky-600 border border-sky-200/60',
                link: '/blockchain/my-transactions',
                subtitle: 'Hyperledger Besu ledger'
            },
            {
                title: 'System Users',
                value: (stats.totalUsers || 0) + (stats.activeStaff || 0),
                icon: 'fa-solid fa-users',
                iconBg: 'bg-purple-50 text-purple-600 border border-purple-200/60',
                link: '/manage-users',
                subtitle: 'Students, alumni & staff'
            }
        ];
    }

    // Role-based department badge and title
    const getRoleBanner = () => {
        if (isAccountingAdmin) {
            return {
                title: 'Accounting Department • Administrator Portal',
                subtitle: 'Financial control, payment proof verification, and refund settlement oversight.',
                badge: 'Accounting Admin',
                badgeBg: 'bg-emerald-100 text-emerald-800 border-emerald-300'
            };
        }
        if (isAccountingStaff) {
            return {
                title: 'Accounting Operations Desk',
                subtitle: 'Audit uploaded payment receipts, verify transactions against reference numbers, and maintain financial records.',
                badge: 'Accounting Staff',
                badgeBg: 'bg-teal-100 text-teal-800 border-teal-300'
            };
        }
        if (isRegistrarAdmin) {
            return {
                title: "Registrar's Office • Head Administrator",
                subtitle: 'Oversee academic document workflows, staff assignments, release pipelines, and blockchain ledger issuance.',
                badge: 'Registrar Admin',
                badgeBg: 'bg-blue-100 text-blue-800 border-blue-300'
            };
        }
        if (isRegistrarStaff) {
            return {
                title: 'Registrar Processing Desk',
                subtitle: 'Review incoming requests, verify academic standing, prepare transcripts and certifications, and release documents.',
                badge: 'Registrar Staff',
                badgeBg: 'bg-sky-100 text-sky-800 border-sky-300'
            };
        }
        if (isITAdmin) {
            return {
                title: 'IT Administration & Security Hub',
                subtitle: 'Manage user accounts, assign roles and departments, enforce security policies, and monitor system logs.',
                badge: 'IT Administrator',
                badgeBg: 'bg-indigo-100 text-indigo-800 border-indigo-300'
            };
        }
        return {
            title: 'Super Administrator • Master Governance Dashboard',
            subtitle: 'System-wide executive analytics, cross-department oversight, and cryptographic ledger security.',
            badge: 'Super Admin',
            badgeBg: 'bg-amber-100 text-amber-800 border-amber-300'
        };
    };

    const bannerInfo = getRoleBanner();

    // Filtered requests for the registrar / super admin view
    const filteredRequests = (recentData.pendingRequests || []).filter(req => {
        const matchesStatus = requestStatusFilter === 'All' || (req.status || 'Pending').toLowerCase() === requestStatusFilter.toLowerCase();
        const matchesSearch = searchFilter === '' || 
            (req.name && req.name.toLowerCase().includes(searchFilter.toLowerCase())) ||
            (req.requestId && req.requestId.toLowerCase().includes(searchFilter.toLowerCase())) ||
            (req.documentType && req.documentType.toLowerCase().includes(searchFilter.toLowerCase()));
        return matchesStatus && matchesSearch;
    });

    // Filtered payments for accounting view
    const filteredPayments = (recentData.recentPayments || []).filter(pmt => {
        const matchesStatus = paymentStatusFilter === 'All' || (pmt.status || 'Pending Verification').toLowerCase() === paymentStatusFilter.toLowerCase();
        const matchesSearch = searchFilter === '' || 
            (pmt.payerName && pmt.payerName.toLowerCase().includes(searchFilter.toLowerCase())) ||
            (pmt.transactionId && pmt.transactionId.toLowerCase().includes(searchFilter.toLowerCase())) ||
            (pmt.paymentMode && pmt.paymentMode.toLowerCase().includes(searchFilter.toLowerCase()));
        return matchesStatus && matchesSearch;
    });

    // Filtered logs for IT admin view
    const filteredLogs = (recentData.recentLogs || []).filter(log => {
        return searchFilter === '' || 
            (log.userName && log.userName.toLowerCase().includes(searchFilter.toLowerCase())) ||
            (log.action && log.action.toLowerCase().includes(searchFilter.toLowerCase())) ||
            (log.details && log.details.toLowerCase().includes(searchFilter.toLowerCase()));
    });

    // Payment channel percentages for Accounting Staff
    const totalPaymentsCount = Math.max(1, (stats.completedPayments || 0) + (stats.pendingPayments || 0) + (stats.rejectedPayments || 0));
    const gcashPct = Math.min(100, Math.round(((stats.paymentChannels?.gcash || 0) / totalPaymentsCount) * 100));
    const landbankPct = Math.min(100, Math.round(((stats.paymentChannels?.landbank || 0) / totalPaymentsCount) * 100));
    const otherPct = Math.min(100, Math.round(((stats.paymentChannels?.other || 0) / totalPaymentsCount) * 100));

    return (
        <Layout>
            <div className="space-y-4 pb-6 font-sans">
                
                {/* Error Banner */}
                {error && (
                    <div className="flex items-center justify-between bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-2xl shadow-sm">
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
                {/* ROLE-SPECIFIC HERO HEADER BANNER                                          */}
                {/* ========================================================================= */}
                <div className="bg-gradient-to-r from-[#111827] via-[#1f2937] to-[#111827] text-white rounded-3xl p-5 sm:p-6 shadow-xl relative overflow-hidden border border-gray-800">
                    <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                        <div>
                            <div className="flex items-center gap-2.5 mb-1.5 flex-wrap">
                                <span className={`px-3 py-0.5 rounded-full text-[11px] font-extrabold uppercase tracking-wider border ${bannerInfo.badgeBg}`}>
                                    {bannerInfo.badge}
                                </span>
                                <span className="text-gray-400 text-xs font-medium">
                                    Welcome back, <strong>{userName}</strong>
                                </span>
                            </div>
                            <h1 className="text-xl sm:text-2xl font-black tracking-tight text-white m-0">
                                {bannerInfo.title}
                            </h1>
                            <p className="text-gray-300 text-xs sm:text-[13px] mt-1 m-0 max-w-2xl leading-relaxed">
                                {bannerInfo.subtitle}
                            </p>
                        </div>

                        <div className="flex items-center gap-2.5 shrink-0">
                            <button
                                onClick={fetchDashboardData}
                                disabled={loading}
                                className="bg-white/10 hover:bg-white/20 text-white px-4 py-2 rounded-full text-xs font-bold flex items-center gap-2 transition-all backdrop-blur-sm border border-white/10 cursor-pointer"
                                title="Refresh Dashboard Data"
                            >
                                <RefreshCw size={13} className={loading ? "animate-spin" : ""} />
                                <span>Sync Data</span>
                            </button>
                        </div>
                    </div>

                    {/* Subtle Background Glow Accent */}
                    <div className="absolute right-0 top-0 w-80 h-80 bg-blue-500/10 rounded-full blur-3xl pointer-events-none"></div>
                </div>

                {/* ========================================================================= */}
                {/* 1. TOP STAT CARDS (Role Specific)                                         */}
                {/* ========================================================================= */}
                <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-3 sm:gap-4">
                    {statCards.map((card, index) => (
                        <div
                            key={index}
                            onClick={() => navigate(card.link)}
                            className="bg-white rounded-[20px] p-4 flex flex-col justify-between shadow-[0_4px_20px_rgba(0,0,0,0.03),0_1px_3px_rgba(0,0,0,0.02)] border border-slate-100/90 hover:border-slate-300 hover:shadow-[0_8px_25px_rgba(0,0,0,0.06)] hover:-translate-y-0.5 transition-all duration-200 cursor-pointer relative group overflow-hidden min-h-[110px]"
                        >
                            <div className="flex justify-between items-start w-full">
                                <div className={`w-8 h-8 rounded-xl ${card.iconBg} flex items-center justify-center text-xs shadow-2xs transition-transform group-hover:scale-105`}>
                                    <i className={card.icon}></i>
                                </div>
                                <div className="w-6 h-6 rounded-full bg-slate-100 group-hover:bg-[#111827] text-slate-400 group-hover:text-white flex items-center justify-center transition-colors">
                                    <ArrowUpRight size={12} />
                                </div>
                            </div>

                            {card.badge && (
                                <span className="absolute top-3 right-10 bg-red-500 text-white text-[9.5px] font-extrabold px-2 py-0.5 rounded-full shadow-xs animate-pulse">
                                    {card.badge} Action
                                </span>
                            )}

                            <div className="mt-2">
                                <span className="text-[26px] font-black text-slate-900 leading-none tracking-tight block">
                                    {card.value}
                                </span>
                                <span className="text-[12px] font-bold text-slate-700 mt-1 block truncate">
                                    {card.title}
                                </span>
                                <span className="text-[10px] text-slate-400 block truncate">
                                    {card.subtitle}
                                </span>
                            </div>
                        </div>
                    ))}
                </div>

                {/* ========================================================================= */}
                {/* 2. MIDDLE SECTION: TAILORED DUAL PANELS BY ROLE                           */}
                {/* ========================================================================= */}
                {isAccountingAdmin ? (
                    /* 1. ACCOUNTING ADMIN: Payment Streams & Refund Claims Oversight */
                    <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
                        {/* Left Card: Recent Payment Submissions */}
                        <div className="bg-white rounded-[22px] shadow-[0_8px_24px_rgba(0,0,0,0.03)] border border-slate-100/90 flex flex-col h-[340px] overflow-hidden">
                            <div className="py-3.5 px-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                                <div className="flex items-center gap-2.5">
                                    <div className="w-7 h-7 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center text-xs font-bold border border-emerald-200/60">
                                        <i className="fa-solid fa-money-bill-wave"></i>
                                    </div>
                                    <h3 className="text-slate-900 text-[15px] font-extrabold m-0">Recent Payment Submissions</h3>
                                </div>
                                <button 
                                    onClick={() => navigate('/transactions')} 
                                    className="text-[11.5px] font-bold text-emerald-700 hover:text-emerald-800 flex items-center gap-1 bg-emerald-50 px-3 py-1.5 rounded-full transition-colors cursor-pointer"
                                >
                                    <span>All Payments</span>
                                    <ArrowUpRight size={12} />
                                </button>
                            </div>

                            <div className="flex-1 overflow-y-auto p-2.5 space-y-1.5 custom-scrollbar">
                                {recentData.recentPayments?.length > 0 ? (
                                    recentData.recentPayments.map((pmt, idx) => (
                                        <div 
                                            key={idx}
                                            onClick={() => navigate(`/transactions/${pmt.transactionId}`)}
                                            className="p-2.5 bg-slate-50/80 hover:bg-slate-100/90 rounded-xl transition-all flex items-center justify-between border border-slate-100/80 cursor-pointer"
                                        >
                                            <div className="flex items-center gap-2.5 overflow-hidden">
                                                <div className="w-7 h-7 rounded-lg bg-white shadow-2xs flex items-center justify-center text-emerald-600 shrink-0">
                                                    <CreditCard size={14} />
                                                </div>
                                                <div className="overflow-hidden">
                                                    <span className="text-[12.5px] font-bold text-slate-900 block truncate">
                                                        {pmt.payerName || pmt.name || 'Student'}
                                                    </span>
                                                    <span className="text-[10.5px] text-slate-500 font-medium">
                                                        {pmt.paymentMode || 'Payment'} • Ref #{formatShortId(pmt.transactionId)}
                                                    </span>
                                                </div>
                                            </div>
                                            <div className="text-right shrink-0">
                                                <span className="text-[13px] font-black text-slate-900 block">
                                                    ₱{Number(pmt.amount || 0).toLocaleString('en-PH', { minimumFractionDigits: 2 })}
                                                </span>
                                                <span className={`inline-block text-[9.5px] font-extrabold uppercase px-2 py-0.5 rounded-full ${
                                                    pmt.status === 'Completed' ? 'bg-emerald-50 text-emerald-700' :
                                                    pmt.status === 'Rejected' ? 'bg-rose-50 text-rose-700' :
                                                    'bg-amber-50 text-amber-700'
                                                }`}>
                                                    {pmt.status || 'Pending'}
                                                </span>
                                            </div>
                                        </div>
                                    ))
                                ) : (
                                    <div className="p-6 text-center text-slate-400 text-xs">No recent payment submissions.</div>
                                )}
                            </div>
                        </div>

                        {/* Right Card: Refund Clearance Queue */}
                        <div className="bg-white rounded-[22px] shadow-[0_8px_24px_rgba(0,0,0,0.03)] border border-slate-100/90 flex flex-col h-[340px] overflow-hidden">
                            <div className="py-3.5 px-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                                <div className="flex items-center gap-2.5">
                                    <div className="w-7 h-7 rounded-lg bg-purple-50 text-purple-600 flex items-center justify-center text-xs font-bold border border-purple-200/60">
                                        <i className="fa-solid fa-receipt"></i>
                                    </div>
                                    <h3 className="text-slate-900 text-[15px] font-extrabold m-0">Refund Requests Queue</h3>
                                </div>
                                <button 
                                    onClick={() => navigate('/transactions?tab=refunds')} 
                                    className="text-[11.5px] font-bold text-purple-700 hover:text-purple-800 flex items-center gap-1 bg-purple-50 px-3 py-1.5 rounded-full transition-colors cursor-pointer"
                                >
                                    <span>Manage Refunds</span>
                                    <ArrowUpRight size={12} />
                                </button>
                            </div>

                            <div className="flex-1 overflow-y-auto p-2.5 space-y-1.5 custom-scrollbar">
                                {recentData.recentRefunds?.length > 0 ? (
                                    recentData.recentRefunds.map((rf, idx) => (
                                        <div 
                                            key={idx}
                                            className="p-2.5 bg-slate-50/80 hover:bg-slate-100/90 rounded-xl transition-all flex items-center justify-between border border-slate-100/80"
                                        >
                                            <div className="flex items-center gap-2.5 overflow-hidden">
                                                <div className="w-7 h-7 rounded-lg bg-white shadow-2xs flex items-center justify-center text-purple-600 shrink-0">
                                                    <Receipt size={14} />
                                                </div>
                                                <div className="overflow-hidden">
                                                    <span className="text-[12.5px] font-bold text-slate-900 block truncate">
                                                        {rf.studentName || rf.studentEmail || 'Claimant'}
                                                    </span>
                                                    <span className="text-[10.5px] text-slate-500 font-medium">
                                                        Reason: {rf.reason || 'Overpayment / Cancellation'}
                                                    </span>
                                                </div>
                                            </div>
                                            <div className="text-right shrink-0">
                                                <span className="text-[13px] font-black text-slate-900 block">
                                                    ₱{Number(rf.amount || 0).toLocaleString('en-PH', { minimumFractionDigits: 2 })}
                                                </span>
                                                <span className={`inline-block text-[9.5px] font-extrabold uppercase px-2 py-0.5 rounded-full ${
                                                    rf.status === 'Approved' ? 'bg-emerald-50 text-emerald-700' :
                                                    rf.status === 'Rejected' ? 'bg-rose-50 text-rose-700' :
                                                    'bg-amber-50 text-amber-700'
                                                }`}>
                                                    {rf.status || 'Pending'}
                                                </span>
                                            </div>
                                        </div>
                                    ))
                                ) : (
                                    <div className="p-6 text-center text-slate-400 text-xs">No pending refund requests.</div>
                                )}
                            </div>
                        </div>
                    </div>
                ) : isAccountingStaff ? (
                    /* 2. ACCOUNTING STAFF: Priority Verification Desk & Payment Channels */
                    <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
                        {/* Left Card: Priority Audit Queue */}
                        <div className="bg-white rounded-[22px] shadow-[0_8px_24px_rgba(0,0,0,0.03)] border border-slate-100/90 flex flex-col h-[340px] overflow-hidden">
                            <div className="py-3.5 px-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                                <div className="flex items-center gap-2.5">
                                    <div className="w-7 h-7 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center text-xs font-bold border border-amber-200/60">
                                        <i className="fa-solid fa-clock"></i>
                                    </div>
                                    <div>
                                        <h3 className="text-slate-900 text-[15px] font-extrabold m-0">Priority Audit Queue</h3>
                                    </div>
                                </div>
                                <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-800">
                                    {recentData.priorityPendingPayments?.length || 0} urgent
                                </span>
                            </div>

                            <div className="flex-1 overflow-y-auto p-2.5 space-y-1.5 custom-scrollbar">
                                {recentData.priorityPendingPayments?.length > 0 ? (
                                    recentData.priorityPendingPayments.map((pmt, idx) => (
                                        <div 
                                            key={idx}
                                            onClick={() => navigate(`/transactions/${pmt.transactionId}`)}
                                            className="p-2.5 bg-slate-50/80 hover:bg-slate-100/90 rounded-xl transition-all flex items-center justify-between border border-slate-100/80 cursor-pointer"
                                        >
                                            <div className="flex items-center gap-2.5 overflow-hidden">
                                                <div className="w-7 h-7 rounded-lg bg-white shadow-2xs flex items-center justify-center text-amber-600 shrink-0">
                                                    <CreditCard size={14} />
                                                </div>
                                                <div className="overflow-hidden">
                                                    <span className="text-[12.5px] font-bold text-slate-900 block truncate">
                                                        {pmt.payerName || pmt.name || 'Student'}
                                                    </span>
                                                    <span className="text-[10.5px] text-slate-500 font-medium">
                                                        {pmt.paymentMode || 'Payment'} • Ref #{formatShortId(pmt.transactionId)}
                                                    </span>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <span className="text-[13px] font-black text-slate-900">
                                                    ₱{Number(pmt.amount || 0).toLocaleString('en-PH', { minimumFractionDigits: 2 })}
                                                </span>
                                                <button 
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        navigate(`/transactions/${pmt.transactionId}`);
                                                    }}
                                                    className="bg-[#111827] hover:bg-[#1f2937] text-white py-1 px-3 rounded-full text-[11px] font-bold cursor-pointer"
                                                >
                                                    Audit
                                                </button>
                                            </div>
                                        </div>
                                    ))
                                ) : (
                                    <div className="p-6 text-center text-slate-400 text-xs">No pending receipts in urgent audit queue.</div>
                                )}
                            </div>
                        </div>

                        {/* Right Card: Payment Channels Distribution */}
                        <div className="bg-white rounded-[22px] shadow-[0_8px_24px_rgba(0,0,0,0.03)] border border-slate-100/90 p-5 flex flex-col justify-between h-[340px]">
                            <div>
                                <div className="flex items-center justify-between mb-1">
                                    <h3 className="text-slate-900 text-[15px] font-extrabold m-0">Payment Channels</h3>
                                    <span className="text-[11px] text-slate-500 font-medium">Channel Distribution</span>
                                </div>
                                <p className="text-xs text-slate-500 leading-relaxed mb-4">
                                    Payment proofs received across accepted electronic & bank channels.
                                </p>

                                <div className="space-y-3">
                                    {/* GCash */}
                                    <div className="bg-slate-50 rounded-xl p-3 border border-slate-200/60">
                                        <div className="flex justify-between items-center mb-1.5 text-xs font-bold">
                                            <span className="flex items-center gap-2 text-slate-800">
                                                <span className="w-2.5 h-2.5 rounded-full bg-blue-500"></span>
                                                GCash
                                            </span>
                                            <span className="text-slate-900">{stats.paymentChannels?.gcash || 0} receipts ({gcashPct}%)</span>
                                        </div>
                                        <div className="w-full bg-slate-200 rounded-full h-1.5 overflow-hidden">
                                            <div className="bg-blue-600 h-1.5 rounded-full" style={{ width: `${gcashPct}%` }}></div>
                                        </div>
                                    </div>

                                    {/* Landbank */}
                                    <div className="bg-slate-50 rounded-xl p-3 border border-slate-200/60">
                                        <div className="flex justify-between items-center mb-1.5 text-xs font-bold">
                                            <span className="flex items-center gap-2 text-slate-800">
                                                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span>
                                                Landbank
                                            </span>
                                            <span className="text-slate-900">{stats.paymentChannels?.landbank || 0} receipts ({landbankPct}%)</span>
                                        </div>
                                        <div className="w-full bg-slate-200 rounded-full h-1.5 overflow-hidden">
                                            <div className="bg-emerald-600 h-1.5 rounded-full" style={{ width: `${landbankPct}%` }}></div>
                                        </div>
                                    </div>

                                    {/* Bank / Other */}
                                    <div className="bg-slate-50 rounded-xl p-3 border border-slate-200/60">
                                        <div className="flex justify-between items-center mb-1.5 text-xs font-bold">
                                            <span className="flex items-center gap-2 text-slate-800">
                                                <span className="w-2.5 h-2.5 rounded-full bg-purple-500"></span>
                                                Bank Transfer / Other
                                            </span>
                                            <span className="text-slate-900">{stats.paymentChannels?.other || 0} receipts ({otherPct}%)</span>
                                        </div>
                                        <div className="w-full bg-slate-200 rounded-full h-1.5 overflow-hidden">
                                            <div className="bg-purple-600 h-1.5 rounded-full" style={{ width: `${otherPct}%` }}></div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-400">
                                <span>Always verify reference numbers before clearing</span>
                                <button onClick={() => navigate('/transactions')} className="text-blue-600 font-bold hover:underline cursor-pointer">
                                    Auditing desk &rarr;
                                </button>
                            </div>
                        </div>
                    </div>
                ) : isITAdmin ? (
                    /* 3. IT ADMINISTRATOR: System Audit Trail & Account Management Shortcuts */
                    <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
                        {/* Left Card: Audit Trail Logs */}
                        <div className="bg-white rounded-[22px] shadow-[0_8px_24px_rgba(0,0,0,0.03)] border border-slate-100/90 flex flex-col h-[340px] overflow-hidden">
                            <div className="py-3.5 px-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                                <div className="flex items-center gap-2.5">
                                    <div className="w-7 h-7 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center text-xs font-bold border border-indigo-200/60">
                                        <i className="fa-solid fa-clipboard-list"></i>
                                    </div>
                                    <h3 className="text-slate-900 text-[15px] font-extrabold m-0">Recent Audit Trail</h3>
                                </div>
                                <button 
                                    onClick={() => navigate('/activity-logs')} 
                                    className="text-[11.5px] font-bold text-indigo-700 hover:text-indigo-800 flex items-center gap-1 bg-indigo-50 px-3 py-1.5 rounded-full transition-colors cursor-pointer"
                                >
                                    <span>All Logs</span>
                                    <ArrowUpRight size={12} />
                                </button>
                            </div>

                            <div className="flex-1 overflow-y-auto p-2.5 space-y-1.5 custom-scrollbar">
                                {recentData.recentLogs?.length > 0 ? (
                                    recentData.recentLogs.map((log, idx) => (
                                        <div key={idx} className="p-2.5 bg-slate-50/80 rounded-xl flex items-center justify-between border border-slate-100">
                                            <div className="flex items-center gap-2.5 overflow-hidden">
                                                <div className="w-7 h-7 rounded-lg bg-white shadow-2xs flex items-center justify-center text-indigo-600 shrink-0">
                                                    <Activity size={14} />
                                                </div>
                                                <div className="overflow-hidden">
                                                    <span className="text-[12.5px] font-bold text-slate-900 block truncate">
                                                        {log.action}
                                                    </span>
                                                    <span className="text-[10.5px] text-slate-500 font-medium">
                                                        {log.userName || log.userEmail} • IP: {log.ipAddress || '127.0.0.1'}
                                                    </span>
                                                </div>
                                            </div>
                                            <span className="text-[10px] text-slate-400 font-medium shrink-0">
                                                {log.createdAt ? new Date(log.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Recent'}
                                            </span>
                                        </div>
                                    ))
                                ) : (
                                    <div className="p-6 text-center text-slate-400 text-xs">No recent log entries.</div>
                                )}
                            </div>
                        </div>

                        {/* Right Card: Quick Administrative Actions */}
                        <div className="bg-white rounded-[22px] shadow-[0_8px_24px_rgba(0,0,0,0.03)] border border-slate-100/90 p-5 flex flex-col justify-between h-[340px]">
                            <div>
                                <h3 className="text-slate-900 text-[15px] font-extrabold m-0 mb-1">Identity & Account Administration</h3>
                                <p className="text-xs text-slate-500 leading-relaxed mb-4">
                                    Quick administrative shortcuts to provision accounts, toggle activation, and enforce security policies.
                                </p>

                                <div className="space-y-2.5">

                                    <div 
                                        onClick={() => navigate('/manage-users')}
                                        className="p-3 bg-slate-50 hover:bg-slate-100 rounded-xl border border-slate-200/80 flex items-center justify-between cursor-pointer transition-all"
                                    >
                                        <div className="flex items-center gap-3">
                                            <div className="w-8 h-8 rounded-lg bg-purple-100 text-purple-700 flex items-center justify-center text-sm font-bold">
                                                <i className="fa-solid fa-users"></i>
                                            </div>
                                            <div>
                                                <span className="text-xs font-bold text-slate-900 block">Student & Alumni Management</span>
                                                <span className="text-[10.5px] text-slate-500">Activate, deactivate, or audit student accounts</span>
                                            </div>
                                        </div>
                                        <ArrowUpRight size={14} className="text-slate-400" />
                                    </div>

                                    <div 
                                        onClick={() => navigate('/activity-logs')}
                                        className="p-3 bg-slate-50 hover:bg-slate-100 rounded-xl border border-slate-200/80 flex items-center justify-between cursor-pointer transition-all"
                                    >
                                        <div className="flex items-center gap-3">
                                            <div className="w-8 h-8 rounded-lg bg-amber-100 text-amber-700 flex items-center justify-center text-sm font-bold">
                                                <i className="fa-solid fa-shield-halved"></i>
                                            </div>
                                            <div>
                                                <span className="text-xs font-bold text-slate-900 block">Security Auditing</span>
                                                <span className="text-[10.5px] text-slate-500">Review login attempts & sensitive operations</span>
                                            </div>
                                        </div>
                                        <ArrowUpRight size={14} className="text-slate-400" />
                                    </div>
                                </div>
                            </div>

                            <p className="text-[11px] text-slate-400 m-0 text-center">
                                All actions are logged and recorded for compliance.
                            </p>
                        </div>
                    </div>
                ) : isRegistrarAdmin ? (
                    /* 4. REGISTRAR ADMIN: Secured Digital Records & Team Management */
                    <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
                        {/* Left Card: Secured Digital Records */}
                        <div className="bg-white rounded-[22px] shadow-[0_8px_24px_rgba(0,0,0,0.03)] border border-slate-100/90 flex flex-col h-[340px] overflow-hidden">
                            <div className="py-3.5 px-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                                <div className="flex items-center gap-2.5">
                                    <div className="w-7 h-7 rounded-lg bg-sky-50 text-sky-600 flex items-center justify-center text-xs font-bold border border-sky-200/60">
                                        <i className="fa-solid fa-shield-halved"></i>
                                    </div>
                                    <h3 className="text-slate-900 text-[15px] font-extrabold m-0">Secured Records Activity</h3>
                                </div>
                                <button 
                                    onClick={() => navigate('/blockchain/my-transactions')} 
                                    className="text-[11.5px] font-bold text-sky-600 hover:text-sky-700 flex items-center gap-1 bg-sky-50 px-3 py-1.5 rounded-full transition-colors cursor-pointer"
                                >
                                    <span>View all</span>
                                    <ArrowUpRight size={12} />
                                </button>
                            </div>

                            <div className="flex-1 overflow-y-auto p-2.5 space-y-1.5 custom-scrollbar">
                                {recentData.transactions?.length > 0 ? (
                                    recentData.transactions.map((tx, idx) => {
                                        const rawId = tx.referenceNumber || tx.requestId || 'TXN-001';
                                        const shortId = formatShortId(rawId, 'TXN');
                                        const rawHash = tx.blockchainTxHash || tx.transactionHash || '0x305babaefe2c...';
                                        const shortHash = rawHash.length > 18 ? `${rawHash.slice(0, 8)}...${rawHash.slice(-6)}` : rawHash;

                                        return (
                                            <div 
                                                key={idx} 
                                                className="p-2.5 bg-slate-50/80 hover:bg-slate-100/90 rounded-xl transition-all flex items-center justify-between border border-slate-100/80 group"
                                            >
                                                <div className="flex items-center gap-2.5 overflow-hidden">
                                                    <div className="w-7 h-7 rounded-lg bg-white shadow-2xs flex items-center justify-center text-sky-600 shrink-0">
                                                        <i className="fa-solid fa-file-shield text-[11px]"></i>
                                                    </div>
                                                    <div className="overflow-hidden">
                                                        <span className="text-[12.5px] font-black text-slate-900 block truncate" title={rawId}>
                                                            {shortId}
                                                        </span>
                                                    </div>
                                                </div>
                                                
                                                <div className="flex items-center gap-2">
                                                    <span 
                                                        onClick={(e) => handleCopyHash(rawHash, e)}
                                                        className="font-mono text-[11px] bg-white border border-slate-200/80 px-2.5 py-0.5 rounded-full text-slate-600 cursor-pointer hover:border-blue-400 hover:text-blue-600 transition-colors flex items-center gap-1.5 shadow-2xs"
                                                        title={`Click to copy: ${rawHash}`}
                                                    >
                                                        <span>{shortHash}</span>
                                                        {copiedHash === rawHash ? <Check size={11} className="text-emerald-600" /> : <Copy size={11} className="text-slate-400" />}
                                                    </span>
                                                    <span className="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_5px_rgba(16,185,129,0.8)]"></span>
                                                </div>
                                            </div>
                                        );
                                    })
                                ) : (
                                    <div className="p-6 text-center text-slate-400 text-xs">No recent blockchain transactions.</div>
                                )}
                            </div>
                        </div>

                        {/* Right Card: Registrar Operations & Staff Overview */}
                        <div className="bg-white rounded-[22px] shadow-[0_8px_24px_rgba(0,0,0,0.03)] border border-slate-100/90 p-5 flex flex-col justify-between h-[340px]">
                            <div>
                                <div className="flex items-center justify-between mb-1">
                                    <h3 className="text-slate-900 text-[15px] font-extrabold m-0">Registrar Department Operations</h3>
                                    <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-blue-100 text-blue-800">
                                        {stats.registrarStaffCount || 0} Staff Active
                                    </span>
                                </div>
                                <p className="text-xs text-slate-500 leading-relaxed mb-4">
                                    Manage your registrar staff members, oversee processing queues, and track document release throughput.
                                </p>

                                <div className="space-y-2.5">
                                    <div 
                                        onClick={() => navigate('/manage-registrar')}
                                        className="p-3 bg-slate-50 hover:bg-slate-100 rounded-xl border border-slate-200/80 flex items-center justify-between cursor-pointer transition-all"
                                    >
                                        <div className="flex items-center gap-3">
                                            <div className="w-8 h-8 rounded-lg bg-blue-100 text-blue-700 flex items-center justify-center text-sm font-bold">
                                                <i className="fa-solid fa-users-gear"></i>
                                            </div>
                                            <div>
                                                <span className="text-xs font-bold text-slate-900 block">Manage Registrar Staff</span>
                                                <span className="text-[10.5px] text-slate-500">View team members, account status, and workload</span>
                                            </div>
                                        </div>
                                        <ArrowUpRight size={14} className="text-slate-400" />
                                    </div>

                                    <div 
                                        onClick={() => navigate('/requests?status=Pending')}
                                        className="p-3 bg-slate-50 hover:bg-slate-100 rounded-xl border border-slate-200/80 flex items-center justify-between cursor-pointer transition-all"
                                    >
                                        <div className="flex items-center gap-3">
                                            <div className="w-8 h-8 rounded-lg bg-amber-100 text-amber-700 flex items-center justify-center text-sm font-bold">
                                                <i className="fa-solid fa-inbox"></i>
                                            </div>
                                            <div>
                                                <span className="text-xs font-bold text-slate-900 block">Unprocessed Document Requests</span>
                                                <span className="text-[10.5px] text-slate-500">{stats.pendingRequests || 0} requests awaiting initial review</span>
                                            </div>
                                        </div>
                                        <ArrowUpRight size={14} className="text-slate-400" />
                                    </div>

                                    <div 
                                        onClick={() => navigate('/blockchain/my-transactions')}
                                        className="p-3 bg-slate-50 hover:bg-slate-100 rounded-xl border border-slate-200/80 flex items-center justify-between cursor-pointer transition-all"
                                    >
                                        <div className="flex items-center gap-3">
                                            <div className="w-8 h-8 rounded-lg bg-sky-100 text-sky-700 flex items-center justify-center text-sm font-bold">
                                                <i className="fa-solid fa-shield-halved"></i>
                                            </div>
                                            <div>
                                                <span className="text-xs font-bold text-slate-900 block">Blockchain Ledger Anchors</span>
                                                <span className="text-[10.5px] text-slate-500">{stats.blockchainTransactions || 0} credentials issued & secured</span>
                                            </div>
                                        </div>
                                        <ArrowUpRight size={14} className="text-slate-400" />
                                    </div>
                                </div>
                            </div>
                            <p className="text-[11px] text-slate-400 m-0 text-center">
                                Registrar Head Administration & Oversight Console
                            </p>
                        </div>
                    </div>
                ) : isRegistrarStaff ? (
                    /* 5. REGISTRAR STAFF: Priority Processing Desk & System Alerts */
                    <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
                        {/* Left Card: Priority Processing Desk */}
                        <div className="bg-white rounded-[22px] shadow-[0_8px_24px_rgba(0,0,0,0.03)] border border-slate-100/90 flex flex-col h-[340px] overflow-hidden">
                            <div className="py-3.5 px-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                                <div className="flex items-center gap-2.5">
                                    <div className="w-7 h-7 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center text-xs font-bold border border-amber-200/60">
                                        <i className="fa-solid fa-bolt"></i>
                                    </div>
                                    <h3 className="text-slate-900 text-[15px] font-extrabold m-0">Priority Processing Desk</h3>
                                </div>
                                <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-800">
                                    {recentData.priorityPendingRequests?.length || 0} awaiting
                                </span>
                            </div>

                            <div className="flex-1 overflow-y-auto p-2.5 space-y-1.5 custom-scrollbar">
                                {recentData.priorityPendingRequests?.length > 0 ? (
                                    recentData.priorityPendingRequests.map((req, idx) => (
                                        <div 
                                            key={idx}
                                            onClick={() => navigate(`/requests/${req.requestId}`)}
                                            className="p-2.5 bg-slate-50/80 hover:bg-slate-100/90 rounded-xl transition-all flex items-center justify-between border border-slate-100/80 cursor-pointer"
                                        >
                                            <div className="flex items-center gap-2.5 overflow-hidden">
                                                <div className="w-7 h-7 rounded-lg bg-white shadow-2xs flex items-center justify-center text-blue-600 shrink-0">
                                                    <FileText size={14} />
                                                </div>
                                                <div className="overflow-hidden">
                                                    <span className="text-[12.5px] font-bold text-slate-900 block truncate">
                                                        {req.name}
                                                    </span>
                                                    <span className="text-[10.5px] text-slate-500 font-medium">
                                                        {req.documentType} • #{req.requestId}
                                                    </span>
                                                </div>
                                            </div>
                                            <button 
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    navigate(`/requests/${req.requestId}`);
                                                }}
                                                className="bg-[#111827] hover:bg-[#1f2937] text-white py-1 px-3 rounded-full text-[11px] font-bold shrink-0 cursor-pointer"
                                            >
                                                Process
                                            </button>
                                        </div>
                                    ))
                                ) : (
                                    <div className="p-6 text-center text-slate-400 text-xs">No pending requests waiting in priority queue.</div>
                                )}
                            </div>
                        </div>

                        {/* Right Card: Live Notifications & Operational Alerts */}
                        <div className="bg-white rounded-[22px] shadow-[0_8px_24px_rgba(0,0,0,0.03)] border border-slate-100/90 flex flex-col h-[340px] overflow-hidden">
                            <div className="py-3.5 px-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                                <div className="flex items-center gap-2.5">
                                    <div className="w-7 h-7 rounded-lg bg-purple-50 text-purple-600 flex items-center justify-center text-xs font-bold border border-purple-200/60">
                                        <i className="fa-solid fa-bell"></i>
                                    </div>
                                    <h3 className="text-slate-900 text-[15px] font-extrabold m-0">Desk Alerts & Updates</h3>
                                </div>
                                <button 
                                    onClick={() => navigate('/notifications')} 
                                    className="text-[11.5px] font-bold text-purple-600 hover:text-purple-700 flex items-center gap-1 bg-purple-50 px-3 py-1.5 rounded-full transition-colors cursor-pointer"
                                >
                                    <span>All Alerts</span>
                                    <ArrowUpRight size={12} />
                                </button>
                            </div>

                            <div className="flex-1 overflow-y-auto p-2.5 space-y-1.5 custom-scrollbar">
                                {recentData.notifications?.length > 0 ? (
                                    recentData.notifications.map((notif, idx) => (
                                        <div 
                                            key={idx} 
                                            onClick={() => navigate('/notifications')}
                                            className="p-3 bg-slate-50/80 hover:bg-slate-100/90 rounded-xl transition-all flex items-start gap-3 border border-slate-100/80 cursor-pointer"
                                        >
                                            <div className="w-7 h-7 rounded-lg bg-blue-100 text-blue-700 flex items-center justify-center shrink-0 mt-0.5">
                                                <i className="fa-solid fa-circle-info text-xs"></i>
                                            </div>
                                            <div className="flex-1">
                                                <p className="text-[12.5px] font-semibold text-slate-800 leading-snug m-0">
                                                    {notif.message}
                                                </p>
                                                <span className="text-[10.5px] text-slate-400 font-medium mt-0.5 block">
                                                    {notif.createdAt ? new Date(notif.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Recent Alert'}
                                                </span>
                                            </div>
                                            {!notif.isRead && (
                                                <span className="w-2 h-2 rounded-full bg-blue-600 shrink-0 mt-1.5 shadow-[0_0_5px_rgba(37,99,235,0.6)]"></span>
                                            )}
                                        </div>
                                    ))
                                ) : (
                                    <div className="p-6 text-center text-slate-400 text-xs">No active alerts.</div>
                                )}
                            </div>
                        </div>
                    </div>
                ) : (
                    /* 6. SUPER ADMIN: Master Executive Overview Panels */
                    <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
                        {/* Left Card: Secured Digital Ledger Activity */}
                        <div className="bg-white rounded-[22px] shadow-[0_8px_24px_rgba(0,0,0,0.03)] border border-slate-100/90 flex flex-col h-[340px] overflow-hidden">
                            <div className="py-3.5 px-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                                <div className="flex items-center gap-2.5">
                                    <div className="w-7 h-7 rounded-lg bg-sky-50 text-sky-600 flex items-center justify-center text-xs font-bold border border-sky-200/60">
                                        <i className="fa-solid fa-shield-halved"></i>
                                    </div>
                                    <h3 className="text-slate-900 text-[15px] font-extrabold m-0">Secured Records Activity</h3>
                                </div>
                                <button 
                                    onClick={() => navigate('/blockchain/my-transactions')} 
                                    className="text-[11.5px] font-bold text-sky-600 hover:text-sky-700 flex items-center gap-1 bg-sky-50 px-3 py-1.5 rounded-full transition-colors cursor-pointer"
                                >
                                    <span>View all</span>
                                    <ArrowUpRight size={12} />
                                </button>
                            </div>

                            <div className="flex-1 overflow-y-auto p-2.5 space-y-1.5 custom-scrollbar">
                                {recentData.transactions?.length > 0 ? (
                                    recentData.transactions.map((tx, idx) => {
                                        const rawId = tx.referenceNumber || tx.requestId || 'TXN-001';
                                        const shortId = formatShortId(rawId, 'TXN');
                                        const rawHash = tx.blockchainTxHash || tx.transactionHash || '0x305babaefe2c...';
                                        const shortHash = rawHash.length > 18 ? `${rawHash.slice(0, 8)}...${rawHash.slice(-6)}` : rawHash;

                                        return (
                                            <div 
                                                key={idx} 
                                                className="p-2.5 bg-slate-50/80 hover:bg-slate-100/90 rounded-xl transition-all flex items-center justify-between border border-slate-100/80 group"
                                            >
                                                <div className="flex items-center gap-2.5 overflow-hidden">
                                                    <div className="w-7 h-7 rounded-lg bg-white shadow-2xs flex items-center justify-center text-sky-600 shrink-0">
                                                        <i className="fa-solid fa-file-shield text-[11px]"></i>
                                                    </div>
                                                    <div className="overflow-hidden">
                                                        <span className="text-[12.5px] font-black text-slate-900 block truncate" title={rawId}>
                                                            {shortId}
                                                        </span>
                                                    </div>
                                                </div>
                                                
                                                <div className="flex items-center gap-2">
                                                    <span 
                                                        onClick={(e) => handleCopyHash(rawHash, e)}
                                                        className="font-mono text-[11px] bg-white border border-slate-200/80 px-2.5 py-0.5 rounded-full text-slate-600 cursor-pointer hover:border-blue-400 hover:text-blue-600 transition-colors flex items-center gap-1.5 shadow-2xs"
                                                        title={`Click to copy: ${rawHash}`}
                                                    >
                                                        <span>{shortHash}</span>
                                                        {copiedHash === rawHash ? <Check size={11} className="text-emerald-600" /> : <Copy size={11} className="text-slate-400" />}
                                                    </span>
                                                    <span className="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_5px_rgba(16,185,129,0.8)]"></span>
                                                </div>
                                            </div>
                                        );
                                    })
                                ) : (
                                    <div className="p-6 text-center text-slate-400 text-xs">No recent blockchain transactions.</div>
                                )}
                            </div>
                        </div>

                        {/* Right Card: Live Notifications & Operational Alerts */}
                        <div className="bg-white rounded-[22px] shadow-[0_8px_24px_rgba(0,0,0,0.03)] border border-slate-100/90 flex flex-col h-[340px] overflow-hidden">
                            <div className="py-3.5 px-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                                <div className="flex items-center gap-2.5">
                                    <div className="w-7 h-7 rounded-lg bg-purple-50 text-purple-600 flex items-center justify-center text-xs font-bold border border-purple-200/60">
                                        <i className="fa-solid fa-bell"></i>
                                    </div>
                                    <h3 className="text-slate-900 text-[15px] font-extrabold m-0">System Alerts & Notifications</h3>
                                </div>
                                <button 
                                    onClick={() => navigate('/notifications')} 
                                    className="text-[11.5px] font-bold text-purple-600 hover:text-purple-700 flex items-center gap-1 bg-purple-50 px-3 py-1.5 rounded-full transition-colors cursor-pointer"
                                >
                                    <span>All Alerts</span>
                                    <ArrowUpRight size={12} />
                                </button>
                            </div>

                            <div className="flex-1 overflow-y-auto p-2.5 space-y-1.5 custom-scrollbar">
                                {recentData.notifications?.length > 0 ? (
                                    recentData.notifications.map((notif, idx) => (
                                        <div 
                                            key={idx} 
                                            onClick={() => navigate('/notifications')}
                                            className="p-3 bg-slate-50/80 hover:bg-slate-100/90 rounded-xl transition-all flex items-start gap-3 border border-slate-100/80 cursor-pointer"
                                        >
                                            <div className="w-7 h-7 rounded-lg bg-blue-100 text-blue-700 flex items-center justify-center shrink-0 mt-0.5">
                                                <i className="fa-solid fa-circle-info text-xs"></i>
                                            </div>
                                            <div className="flex-1">
                                                <p className="text-[12.5px] font-semibold text-slate-800 leading-snug m-0">
                                                    {notif.message}
                                                </p>
                                                <span className="text-[10.5px] text-slate-400 font-medium mt-0.5 block">
                                                    {notif.createdAt ? new Date(notif.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Recent Alert'}
                                                </span>
                                            </div>
                                            {!notif.isRead && (
                                                <span className="w-2 h-2 rounded-full bg-blue-600 shrink-0 mt-1.5 shadow-[0_0_5px_rgba(37,99,235,0.6)]"></span>
                                            )}
                                        </div>
                                    ))
                                ) : (
                                    <div className="p-6 text-center text-slate-400 text-xs">No active notifications.</div>
                                )}
                            </div>
                        </div>
                    </div>
                )}

                {/* ========================================================================= */}
                {/* 3. BOTTOM SECTION: ROLE-SPECIFIC OPERATIONAL QUEUE                        */}
                {/* ========================================================================= */}
                <div className="bg-white rounded-[22px] shadow-[0_8px_24px_rgba(0,0,0,0.03)] border border-slate-100/90 overflow-hidden">
                    
                    {/* Header Toolbar */}
                    <div className="p-4 sm:p-5 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-50/40">
                        <div className="flex items-center gap-3 flex-wrap">
                            <h3 className="text-[16px] font-black text-slate-900 tracking-tight m-0">
                                {isAccounting 
                                    ? 'Payment Receipts Awaiting Verification' 
                                    : isITAdmin 
                                    ? 'Recent Security & System Activity Logs' 
                                    : isSuperAdmin
                                    ? 'Master Operations Center'
                                    : 'Recent Academic Document Requests'
                                }
                            </h3>

                            {/* Super Admin Quick Switcher Tabs */}
                            {isSuperAdmin && (
                                <div className="flex items-center gap-1 bg-slate-200/70 p-1 rounded-full text-xs font-bold">
                                    <button
                                        onClick={() => setSuperAdminTab('requests')}
                                        className={`px-3 py-1 rounded-full transition-all cursor-pointer ${superAdminTab === 'requests' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'}`}
                                    >
                                        Requests
                                    </button>
                                    <button
                                        onClick={() => setSuperAdminTab('payments')}
                                        className={`px-3 py-1 rounded-full transition-all cursor-pointer ${superAdminTab === 'payments' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'}`}
                                    >
                                        Payments
                                    </button>
                                    <button
                                        onClick={() => setSuperAdminTab('logs')}
                                        className={`px-3 py-1 rounded-full transition-all cursor-pointer ${superAdminTab === 'logs' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'}`}
                                    >
                                        Logs
                                    </button>
                                </div>
                            )}

                            {/* Registrar Status Filter Pills */}
                            {(isRegistrar || (isSuperAdmin && superAdminTab === 'requests')) && (
                                <div className="hidden sm:flex items-center gap-1 bg-slate-100 p-0.5 rounded-full text-[11px] font-bold">
                                    {['All', 'Pending', 'In Process', 'Ready for Release'].map(status => (
                                        <button
                                            key={status}
                                            onClick={() => setRequestStatusFilter(status)}
                                            className={`px-2.5 py-1 rounded-full transition-all cursor-pointer ${
                                                requestStatusFilter === status 
                                                    ? 'bg-white text-blue-700 shadow-xs' 
                                                    : 'text-slate-500 hover:text-slate-800'
                                            }`}
                                        >
                                            {status}
                                        </button>
                                    ))}
                                </div>
                            )}

                            {/* Accounting Status Filter Pills */}
                            {(isAccounting || (isSuperAdmin && superAdminTab === 'payments')) && (
                                <div className="hidden sm:flex items-center gap-1 bg-slate-100 p-0.5 rounded-full text-[11px] font-bold">
                                    {['All', 'Pending Verification', 'Completed', 'Rejected'].map(status => (
                                        <button
                                            key={status}
                                            onClick={() => setPaymentStatusFilter(status)}
                                            className={`px-2.5 py-1 rounded-full transition-all cursor-pointer ${
                                                paymentStatusFilter === status 
                                                    ? 'bg-white text-emerald-700 shadow-xs' 
                                                    : 'text-slate-500 hover:text-slate-800'
                                            }`}
                                        >
                                            {status}
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>

                        {/* Search & Action Button */}
                        <div className="flex items-center gap-2 flex-wrap">
                            <div className="relative">
                                <i className="fa-solid fa-magnifying-glass absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-[11px]"></i>
                                <input 
                                    type="text" 
                                    placeholder="Filter entries..." 
                                    value={searchFilter}
                                    onChange={(e) => setSearchFilter(e.target.value)}
                                    className="pl-8 pr-3.5 py-1.5 bg-white border border-slate-200 rounded-full text-[12px] font-medium text-slate-800 placeholder-slate-400 focus:outline-none focus:border-blue-500 shadow-2xs"
                                />
                            </div>

                            <button 
                                onClick={() => navigate(
                                    isAccounting ? '/transactions' :
                                    isITAdmin ? '/activity-logs' :
                                    '/requests'
                                )}
                                className="flex items-center gap-1.5 px-3.5 py-1.5 bg-[#111827] hover:bg-[#1f2937] text-white rounded-full text-[12px] font-bold shadow-sm transition-all cursor-pointer"
                            >
                                <span>View Full Table</span>
                                <ArrowUpRight size={12} />
                            </button>
                        </div>
                    </div>

                    {/* Table View Rendering */}
                    <div className="overflow-x-auto">
                        {/* 1. ACCOUNTING TABLE: Payments Verification Desk */}
                        {(isAccounting || (isSuperAdmin && superAdminTab === 'payments')) ? (
                            <table className="w-full border-collapse table-auto text-left">
                                <thead>
                                    <tr className="bg-slate-50/70 border-b border-slate-100">
                                        <th className="py-3 px-5 text-[11.5px] font-extrabold text-slate-500 uppercase tracking-wider">Transaction ID</th>
                                        <th className="py-3 px-5 text-[11.5px] font-extrabold text-slate-500 uppercase tracking-wider">Payer Name</th>
                                        <th className="py-3 px-5 text-[11.5px] font-extrabold text-slate-500 uppercase tracking-wider">Payment Mode</th>
                                        <th className="py-3 px-5 text-[11.5px] font-extrabold text-slate-500 uppercase tracking-wider">Amount</th>
                                        <th className="py-3 px-5 text-[11.5px] font-extrabold text-slate-500 uppercase tracking-wider text-center">Status</th>
                                        <th className="py-3 px-5 text-[11.5px] font-extrabold text-slate-500 uppercase tracking-wider text-right">Accounting Action</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100 text-[12.5px]">
                                    {filteredPayments.length > 0 ? (
                                        filteredPayments.map((pmt, idx) => (
                                            <tr key={idx} className="hover:bg-slate-50/80 transition-colors">
                                                <td className="py-3 px-5 font-mono font-bold text-slate-700">
                                                    <span className="bg-slate-100 px-2 py-0.5 rounded text-[11.5px]">
                                                        {pmt.transactionId}
                                                    </span>
                                                </td>
                                                <td className="py-3 px-5 font-bold text-slate-900">
                                                    {pmt.payerName || pmt.name}
                                                </td>
                                                <td className="py-3 px-5 text-slate-600 font-medium">
                                                    <span className="inline-flex items-center gap-1.5">
                                                        <i className="fa-solid fa-wallet text-emerald-500 text-xs"></i>
                                                        <span>{pmt.paymentMode || 'GCash'}</span>
                                                    </span>
                                                </td>
                                                <td className="py-3 px-5 font-black text-slate-900">
                                                    ₱{Number(pmt.amount || 0).toLocaleString('en-PH', { minimumFractionDigits: 2 })}
                                                </td>
                                                <td className="py-3 px-5 text-center">
                                                    <span className={`inline-flex items-center gap-1.5 py-0.5 px-3 rounded-full font-extrabold text-[10.5px] uppercase tracking-wider ${
                                                        pmt.status === 'Completed' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' :
                                                        pmt.status === 'Rejected' ? 'bg-rose-50 text-rose-700 border border-rose-200' :
                                                        'bg-amber-50 text-amber-700 border border-amber-200'
                                                    }`}>
                                                        {pmt.status || 'Pending Verification'}
                                                    </span>
                                                </td>
                                                <td className="py-3 px-5 text-right">
                                                    <button 
                                                        onClick={() => navigate(`/transactions/${pmt.transactionId}`)} 
                                                        className="bg-[#111827] hover:bg-[#1f2937] text-white py-1 px-3.5 rounded-full text-[11.5px] font-bold shadow-xs transition-all cursor-pointer"
                                                    >
                                                        Review & Verify
                                                    </button>
                                                </td>
                                            </tr>
                                        ))
                                    ) : (
                                        <tr>
                                            <td colSpan={6} className="py-6 text-center text-slate-400">
                                                No payments found matching criteria.
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        ) : (isITAdmin || (isSuperAdmin && superAdminTab === 'logs')) ? (
                            /* 2. IT ADMIN TABLE: System Audit Trail */
                            <table className="w-full border-collapse table-auto text-left">
                                <thead>
                                    <tr className="bg-slate-50/70 border-b border-slate-100">
                                        <th className="py-3 px-5 text-[11.5px] font-extrabold text-slate-500 uppercase tracking-wider">Timestamp</th>
                                        <th className="py-3 px-5 text-[11.5px] font-extrabold text-slate-500 uppercase tracking-wider">User</th>
                                        <th className="py-3 px-5 text-[11.5px] font-extrabold text-slate-500 uppercase tracking-wider">Action Performed</th>
                                        <th className="py-3 px-5 text-[11.5px] font-extrabold text-slate-500 uppercase tracking-wider">Details</th>
                                        <th className="py-3 px-5 text-[11.5px] font-extrabold text-slate-500 uppercase tracking-wider text-center">Status</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100 text-[12px]">
                                    {filteredLogs.length > 0 ? (
                                        filteredLogs.map((log, idx) => (
                                            <tr key={idx} className="hover:bg-slate-50/80 transition-colors">
                                                <td className="py-3 px-5 text-slate-500 font-mono">
                                                    {log.createdAt ? new Date(log.createdAt).toLocaleString() : 'Recent'}
                                                </td>
                                                <td className="py-3 px-5 font-bold text-slate-900">
                                                    {log.userName || log.userEmail || 'System'}
                                                </td>
                                                <td className="py-3 px-5 font-bold text-indigo-700">
                                                    {log.action}
                                                </td>
                                                <td className="py-3 px-5 text-slate-600 max-w-md truncate" title={log.details}>
                                                    {log.details || '—'}
                                                </td>
                                                <td className="py-3 px-5 text-center">
                                                    <span className="inline-block px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 text-[10px] font-extrabold uppercase border border-emerald-200">
                                                        {log.status || 'Successful'}
                                                    </span>
                                                </td>
                                            </tr>
                                        ))
                                    ) : (
                                        <tr>
                                            <td colSpan={5} className="py-6 text-center text-slate-400">
                                                No activity logs found.
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        ) : (
                            /* 3. REGISTRAR TABLE: Document Requests Processing Queue */
                            <table className="w-full border-collapse table-auto text-left">
                                <thead>
                                    <tr className="bg-slate-50/70 border-b border-slate-100">
                                        <th className="py-3 px-5 text-[11.5px] font-extrabold text-slate-500 uppercase tracking-wider">Request ID</th>
                                        <th className="py-3 px-5 text-[11.5px] font-extrabold text-slate-500 uppercase tracking-wider">Student Name</th>
                                        <th className="py-3 px-5 text-[11.5px] font-extrabold text-slate-500 uppercase tracking-wider">Document Type</th>
                                        <th className="py-3 px-5 text-[11.5px] font-extrabold text-slate-500 uppercase tracking-wider">Date Requested</th>
                                        <th className="py-3 px-5 text-[11.5px] font-extrabold text-slate-500 uppercase tracking-wider text-center">Status</th>
                                        <th className="py-3 px-5 text-[11.5px] font-extrabold text-slate-500 uppercase tracking-wider text-right">Action</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100 text-[12.5px]">
                                    {filteredRequests.length > 0 ? (
                                        filteredRequests.map((req, idx) => (
                                            <tr key={idx} className="hover:bg-slate-50/80 transition-colors">
                                                <td className="py-3 px-5 text-slate-900 font-extrabold">
                                                    <span className="bg-slate-100 px-2 py-0.5 rounded-md text-slate-700 font-mono text-[11.5px]">
                                                        {req.requestId}
                                                    </span>
                                                </td>
                                                <td className="py-3 px-5 text-slate-900 font-bold">
                                                    {req.name}
                                                </td>
                                                <td className="py-3 px-5 text-slate-700 font-medium">
                                                    <span className="inline-flex items-center gap-1.5">
                                                        <i className="fa-solid fa-file-lines text-blue-500 text-xs"></i>
                                                        <span>{req.documentType || 'Certificate'}</span>
                                                    </span>
                                                </td>
                                                <td className="py-3 px-5 text-slate-500 font-medium">
                                                    {req.dateRequested ? new Date(req.dateRequested).toLocaleDateString() : 'Recent'}
                                                </td>
                                                <td className="py-3 px-5 text-center">
                                                    <span className={`inline-flex items-center gap-1.5 py-0.5 px-3 rounded-full font-extrabold text-[10.5px] uppercase tracking-wider ${
                                                        req.status === 'Released' || req.status === 'Approved'
                                                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                                            : req.status === 'In Process'
                                                            ? 'bg-purple-50 text-purple-700 border border-purple-200'
                                                            : 'bg-amber-50 text-amber-700 border border-amber-200'
                                                    }`}>
                                                        <span>{req.status || 'Pending'}</span>
                                                    </span>
                                                </td>
                                                <td className="py-3 px-5 text-right">
                                                    <button 
                                                        onClick={() => navigate(`/requests/${req.requestId}`)} 
                                                        className="bg-[#111827] hover:bg-[#1f2937] text-white py-1 px-3.5 rounded-full text-[11.5px] font-bold shadow-xs transition-all cursor-pointer"
                                                    >
                                                        Process Request
                                                    </button>
                                                </td>
                                            </tr>
                                        ))
                                    ) : (
                                        <tr>
                                            <td colSpan={6} className="py-6 text-center text-slate-400">
                                                No document requests found matching criteria.
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        )}
                    </div>
                </div>

            </div>
        </Layout>
    );
};

export default Dashboard;
