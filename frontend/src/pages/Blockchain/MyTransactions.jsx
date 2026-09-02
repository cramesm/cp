import { useEffect, useState, useMemo } from "react";
import Layout from "../../components/Layout";
import { useNavigate } from "react-router-dom";
import API from "../../components/config/axiosConfig";
import FilterDrawer from "../../components/FilterDrawer";
import ActiveFilterChips from "../../components/ActiveFilterChips";
import TableSkeleton from "../../components/TableSkeleton";
import ConfirmModal from "../../components/ConfirmModal";
import FeedbackModal from "../../components/FeedbackModal";
import { useModals } from "../../hooks/useModals";
import { Copy, CheckCircle, AlertCircle, RefreshCw, Search, SlidersHorizontal, ArrowDownAZ, ArrowUpZA, Check, ArrowLeft, Trash2 } from "lucide-react";

function MyTransactions() {
    const [transactions, setTransactions] = useState([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [toast, setToast] = useState({ show: false, message: "", type: "info" });
    const [copiedHash, setCopiedHash] = useState(null);
    const navigate = useNavigate();

    // Super Admin Selection State
    const userRole = (localStorage.getItem('userRole') || '').toLowerCase();
    const isSuperAdmin = userRole === 'super admin';
    const [selectedIds, setSelectedIds] = useState([]);
    const { confirmConfig, feedbackConfig, showConfirm, showFeedback, closeConfirm, closeFeedback } = useModals();

    // Filter & Sort States
    const [searchTerm, setSearchTerm] = useState("");
    const [filterStatus, setFilterStatus] = useState("All Status");
    const [filterMonth, setFilterMonth] = useState("");
    const [entriesPerPage, setEntriesPerPage] = useState(10);
    const [currentPage, setCurrentPage] = useState(1);
    const [isFilterDrawerOpen, setIsFilterDrawerOpen] = useState(false);
    const [sortConfig, setSortConfig] = useState({ key: "createdAt", direction: "desc" });

    const triggerToast = (message, type = "info") => {
        setToast({ show: true, message, type });
        setTimeout(() => setToast({ show: false, message: "", type: "info" }), 4000);
    };

    const fetchTransactions = async (isRefresh = false) => {
        try {
            if (isRefresh) setRefreshing(true);
            else setLoading(true);

            const response = await API.get("blockchain/transactions/my-transactions");
            setTransactions(response.data || []);

            if (isRefresh) triggerToast("Transactions refreshed successfully", "success");
        } catch (error) {
            triggerToast(
                error.response?.data?.message || "Failed to load transactions",
                "error"
            );
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    useEffect(() => {
        fetchTransactions();
    }, []);

    // Deletion Handlers
    const handleDeleteSingle = (tx) => {
        const id = tx.referenceNumber || tx._id;
        showConfirm({
            title: 'Delete Blockchain Transaction',
            message: `Are you sure you want to permanently delete blockchain transaction "${tx.referenceNumber}" for ${tx.nameOfStudent || 'User'}? This action cannot be undone.`,
            type: 'danger',
            confirmText: 'Delete Transaction',
            onConfirm: async () => {
                try {
                    await API.delete(`blockchain/transactions/${id}`);
                    setTransactions(prev => prev.filter(t => t.referenceNumber !== tx.referenceNumber && t._id !== tx._id));
                    setSelectedIds(prev => prev.filter(x => x !== tx.referenceNumber && x !== tx._id));
                    showFeedback({
                        title: 'Transaction Deleted',
                        message: `Blockchain transaction ${tx.referenceNumber} has been permanently deleted.`,
                        type: 'success'
                    });
                } catch (err) {
                    console.error('Error deleting blockchain transaction:', err);
                    showFeedback({
                        title: 'Deletion Failed',
                        message: err.response?.data?.message || 'Failed to delete transaction record.',
                        type: 'error'
                    });
                }
            }
        });
    };

    const handleBulkDelete = () => {
        if (selectedIds.length === 0) return;
        const count = selectedIds.length;
        showConfirm({
            title: 'Bulk Delete Blockchain Transactions',
            message: `Are you sure you want to permanently delete ${count} selected blockchain transaction(s)? This action cannot be undone.`,
            type: 'danger',
            confirmText: `Delete ${count} Transactions`,
            onConfirm: async () => {
                try {
                    const res = await API.post('blockchain/transactions/bulk-delete', { transactionIds: selectedIds });
                    setTransactions(prev => prev.filter(t => !selectedIds.includes(t.referenceNumber) && !selectedIds.includes(t._id)));
                    setSelectedIds([]);
                    showFeedback({
                        title: 'Bulk Deletion Completed',
                        message: res.data?.message || `Successfully deleted ${count} blockchain transaction(s).`,
                        type: 'success'
                    });
                } catch (err) {
                    console.error('Error bulk deleting blockchain transactions:', err);
                    showFeedback({
                        title: 'Bulk Deletion Failed',
                        message: err.response?.data?.message || 'Failed to delete selected blockchain records.',
                        type: 'error'
                    });
                }
            }
        });
    };

    const copyToClipboard = (hash) => {
        if (!hash) return;
        navigator.clipboard.writeText(hash);
        setCopiedHash(hash);
        triggerToast("TX Hash copied to clipboard!", "success");
        setTimeout(() => setCopiedHash(null), 2000);
    };

    const filteredTransactions = useMemo(() => {
        return transactions.filter((tx) => {
            const matchesSearch =
                (tx.referenceNumber && tx.referenceNumber.toLowerCase().includes(searchTerm.toLowerCase())) ||
                (tx.nameOfStudent && tx.nameOfStudent.toLowerCase().includes(searchTerm.toLowerCase())) ||
                (tx.studentIDNumber && tx.studentIDNumber.toLowerCase().includes(searchTerm.toLowerCase())) ||
                (tx.typeOfDocument && tx.typeOfDocument.toLowerCase().includes(searchTerm.toLowerCase()));

            const matchesStatus =
                filterStatus === "All Status" || tx.blockchainStatus === filterStatus;

            let matchesMonth = true;
            if (filterMonth) {
                const txDate = new Date(tx.createdAt);
                const txYearMonth = `${txDate.getFullYear()}-${String(txDate.getMonth() + 1).padStart(2, "0")}`;
                matchesMonth = txYearMonth === filterMonth;
            }

            return matchesSearch && matchesStatus && matchesMonth;
        }).sort((a, b) => {
            let valA = a[sortConfig.key];
            let valB = b[sortConfig.key];
            
            if (sortConfig.key === "createdAt") {
                valA = new Date(valA).getTime();
                valB = new Date(valB).getTime();
            } else if (typeof valA === "string") {
                valA = valA.toLowerCase();
                valB = (valB || "").toLowerCase();
            }

            if (valA < valB) return sortConfig.direction === "asc" ? -1 : 1;
            if (valA > valB) return sortConfig.direction === "asc" ? 1 : -1;
            return 0;
        });
    }, [transactions, searchTerm, filterStatus, filterMonth, sortConfig]);

    const totalPages = Math.ceil(filteredTransactions.length / entriesPerPage);
    const paginatedTransactions = filteredTransactions.slice(
        (currentPage - 1) * entriesPerPage,
        currentPage * entriesPerPage
    );

    useEffect(() => {
        setCurrentPage(1);
    }, [searchTerm, filterStatus, filterMonth, entriesPerPage]);

    const renderStatusBadge = (status) => {
        switch (status) {
            case "Recorded":
                return (
                    <span className="inline-flex items-center gap-1.5 py-0.5 px-3 rounded-full font-extrabold text-[10.5px] uppercase tracking-wider bg-emerald-50 text-emerald-700 border border-emerald-200/80">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                        <span>Recorded</span>
                    </span>
                );
            case "Pending":
                return (
                    <span className="inline-flex items-center gap-1.5 py-0.5 px-3 rounded-full font-extrabold text-[10.5px] uppercase tracking-wider bg-amber-50 text-amber-700 border border-amber-200/80">
                        <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse"></span>
                        <span>Pending</span>
                    </span>
                );
            case "Failed":
                return (
                    <span className="inline-flex items-center gap-1.5 py-0.5 px-3 rounded-full font-extrabold text-[10.5px] uppercase tracking-wider bg-red-50 text-red-700 border border-red-200/80">
                        <span className="w-1.5 h-1.5 rounded-full bg-red-500"></span>
                        <span>Failed</span>
                    </span>
                );
            default:
                return (
                    <span className="inline-flex items-center gap-1.5 py-0.5 px-3 rounded-full font-extrabold text-[10.5px] uppercase tracking-wider bg-slate-100 text-slate-600 border border-slate-200/80">
                        <span className="w-1.5 h-1.5 rounded-full bg-slate-400"></span>
                        <span>{status || "Unknown"}</span>
                    </span>
                );
        }
    };

    const isCurrentPageAllSelected = paginatedTransactions.length > 0 && paginatedTransactions.every(tx => selectedIds.includes(tx.referenceNumber || tx._id));

    return (
        <Layout>
            {confirmConfig && (
                <ConfirmModal 
                    {...confirmConfig} 
                    isOpen={!!confirmConfig} 
                    onClose={closeConfirm} 
                />
            )}
            {feedbackConfig && (
                <FeedbackModal 
                    {...feedbackConfig} 
                    isOpen={!!feedbackConfig} 
                    onClose={closeFeedback} 
                />
            )}

            <div className="py-2 px-2 sm:px-4 font-sans space-y-4 relative">
                
                {/* Toast Notification */}
                {toast.show && (
                    <div className="fixed top-5 left-1/2 -translate-x-1/2 z-[10001] flex items-center gap-3 px-6 py-3 rounded-2xl shadow-2xl bg-[#2c3543] text-white animate-fade-in border border-slate-700/50">
                        {toast.type === "success" && <CheckCircle size={18} className="text-emerald-400" />}
                        {toast.type === "error" && <AlertCircle size={18} className="text-red-400" />}
                        {toast.type === "info" && <CheckCircle size={18} className="text-blue-400" />}
                        <p className="font-bold text-xs tracking-wide">{toast.message}</p>
                    </div>
                )}

                {/* Back to Hub Header */}
                <div className="flex items-center justify-between">
                    <button
                        onClick={() => navigate('/blockchain')}
                        className="bg-white hover:bg-slate-50 text-slate-700 px-3.5 py-1.5 rounded-full font-bold text-[11.5px] border border-slate-200 shadow-2xs hover:-translate-y-0.5 active:translate-y-0.5 transition-all flex items-center gap-1.5 cursor-pointer"
                    >
                        <ArrowLeft size={13} />
                        <span>Blockchain Hub</span>
                    </button>
                </div>

                {/* Main Card */}
                <div className="rounded-[22px] bg-white shadow-[0_8px_24px_rgba(0,0,0,0.03),0_2px_6px_rgba(0,0,0,0.02)] border border-slate-100/90 overflow-hidden">
                    
                    {/* Header Controls */}
                    <div className="p-4 sm:p-5 border-b border-slate-100 bg-slate-50/40 flex flex-col gap-3.5">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                            <div className="flex items-center gap-2 text-xs text-slate-500 font-bold">
                                <span>Show</span>
                                <select
                                    aria-label="Entries per page"
                                    className="border border-slate-200 rounded-lg px-2 py-1 bg-white font-bold text-slate-700 focus:outline-none focus:border-blue-500 cursor-pointer shadow-2xs"
                                    value={entriesPerPage}
                                    onChange={(e) => setEntriesPerPage(Number(e.target.value))}
                                >
                                    <option value={10}>10</option>
                                    <option value={25}>25</option>
                                    <option value={50}>50</option>
                                </select>
                                <span>entries</span>
                            </div>

                            <div className="flex items-center gap-2.5 flex-wrap">
                                <div className="relative">
                                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={13} />
                                    <input
                                        type="text"
                                        placeholder="Search by ID, name, doc..."
                                        className="w-56 sm:w-64 rounded-full border border-slate-200 bg-white py-1.5 pl-8 pr-3.5 text-[12px] font-medium outline-none focus:border-blue-500 shadow-2xs"
                                        value={searchTerm}
                                        onChange={(e) => setSearchTerm(e.target.value)}
                                    />
                                </div>
                                <button
                                    type="button"
                                    onClick={() => setIsFilterDrawerOpen(true)}
                                    className="bg-white hover:bg-slate-50 text-slate-700 px-3.5 py-1.5 rounded-full font-bold text-[11.5px] border border-slate-200 shadow-2xs hover:-translate-y-0.5 active:translate-y-0.5 transition-all flex items-center gap-1.5 cursor-pointer"
                                >
                                    <SlidersHorizontal size={13} />
                                    <span>Filters & Sort</span>
                                </button>

                                <button
                                    onClick={() => fetchTransactions(true)}
                                    disabled={refreshing}
                                    title="Refresh transactions"
                                    className="bg-[#2c3543] hover:bg-[#1f2631] text-white py-1.5 px-3.5 rounded-full text-[11.5px] font-bold border-t border-white/20 border-b-2 border-black/50 shadow-[0_2px_5px_rgba(0,0,0,0.2)] hover:-translate-y-0.5 hover:shadow-[0_4px_8px_rgba(0,0,0,0.25)] active:translate-y-0.5 active:border-b-0 transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-60"
                                >
                                    <RefreshCw size={12} className={refreshing ? "animate-spin" : ""} />
                                    <span>{refreshing ? "Refreshing..." : "Refresh"}</span>
                                </button>
                            </div>
                        </div>

                        {/* Super Admin Bulk Action Toolbar */}
                        {isSuperAdmin && selectedIds.length > 0 && (
                            <div className="flex items-center justify-between bg-blue-50/90 border border-blue-200 px-4 py-2.5 rounded-2xl animate-fade-in text-xs font-bold text-blue-900 shadow-xs">
                                <div className="flex items-center gap-2 flex-wrap">
                                    <span className="bg-blue-600 text-white w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-black">
                                        {selectedIds.length}
                                    </span>
                                    <span>{selectedIds.length} blockchain transaction{selectedIds.length > 1 ? 's' : ''} selected</span>
                                    <button 
                                        type="button" 
                                        onClick={() => setSelectedIds(filteredTransactions.map(t => t.referenceNumber || t._id))}
                                        className="text-blue-700 hover:text-blue-900 underline font-extrabold cursor-pointer ml-1"
                                    >
                                        Select all {filteredTransactions.length}
                                    </button>
                                    <button 
                                        type="button" 
                                        onClick={() => setSelectedIds([])}
                                        className="text-slate-500 hover:text-slate-700 underline font-medium cursor-pointer ml-1"
                                    >
                                        Deselect all
                                    </button>
                                </div>
                                <button
                                    type="button"
                                    onClick={handleBulkDelete}
                                    className="flex items-center gap-1.5 bg-red-600 hover:bg-red-700 text-white px-3.5 py-1.5 rounded-full font-bold shadow-xs hover:-translate-y-0.5 active:translate-y-0.5 transition-all cursor-pointer"
                                >
                                    <Trash2 size={13} />
                                    <span>Delete Selected ({selectedIds.length})</span>
                                </button>
                            </div>
                        )}

                        <ActiveFilterChips 
                            filters={[
                                { label: 'Status', value: filterStatus, key: 'filterStatus' },
                                { label: 'Month', value: filterMonth, key: 'filterMonth' },
                            ]}
                            onRemove={(key) => {
                                if (key === 'filterStatus') setFilterStatus('All Status');
                                if (key === 'filterMonth') setFilterMonth('');
                            }}
                        />
                    </div>

                    {/* Table View */}
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse table-auto">
                            <thead>
                                <tr className="bg-slate-50/70 text-[11.5px] font-extrabold uppercase tracking-wider text-slate-500 border-b border-slate-100">
                                    {isSuperAdmin && (
                                        <th className="py-3.5 px-4 w-10 text-center">
                                            <input 
                                                type="checkbox"
                                                aria-label="Select all on this page"
                                                className="w-4 h-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500 cursor-pointer accent-blue-600"
                                                checked={isCurrentPageAllSelected}
                                                onChange={(e) => {
                                                    const pageIds = paginatedTransactions.map(tx => tx.referenceNumber || tx._id);
                                                    if (e.target.checked) {
                                                        setSelectedIds(prev => [...new Set([...prev, ...pageIds])]);
                                                    } else {
                                                        setSelectedIds(prev => prev.filter(id => !pageIds.includes(id)));
                                                    }
                                                }}
                                            />
                                        </th>
                                    )}
                                    <th className="py-3.5 px-5">Reference Number</th>
                                    <th className="py-3.5 px-5">Owner Name</th>
                                    <th className="py-3.5 px-5">ID Number</th>
                                    <th className="py-3.5 px-5">Document Type</th>
                                    <th className="py-3.5 px-5">Year / Course</th>
                                    <th className="py-3.5 px-5 text-center">Status</th>
                                    <th className="py-3.5 px-5 text-center">TX Hash</th>
                                    <th className="py-3.5 px-5 text-right">Created</th>
                                    {isSuperAdmin && <th className="py-3.5 px-5 text-right">Action</th>}
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 text-[12.5px]">
                                {loading ? (
                                    <TableSkeleton columns={isSuperAdmin ? 10 : 8} rows={entriesPerPage || 10} />
                                ) : paginatedTransactions.length > 0 ? (
                                    paginatedTransactions.map((tx) => {
                                        const txId = tx.referenceNumber || tx._id;
                                        const isSelected = selectedIds.includes(txId);
                                        return (
                                            <tr key={tx._id} className={`hover:bg-slate-50/80 transition-colors ${isSelected ? 'bg-blue-50/40' : ''}`}>
                                                {isSuperAdmin && (
                                                    <td className="py-3.5 px-4 text-center align-middle" onClick={(e) => e.stopPropagation()}>
                                                        <input 
                                                            type="checkbox"
                                                            aria-label={`Select transaction ${tx.referenceNumber}`}
                                                            className="w-4 h-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500 cursor-pointer accent-blue-600"
                                                            checked={isSelected}
                                                            onChange={() => {
                                                                setSelectedIds(prev => prev.includes(txId) ? prev.filter(x => x !== txId) : [...prev, txId]);
                                                            }}
                                                        />
                                                    </td>
                                                )}
                                                <td className="py-3.5 px-5 align-middle">
                                                    <span className="bg-slate-100 px-2 py-0.5 rounded-md text-slate-700 font-mono text-[11.5px] font-bold">
                                                        {tx.referenceNumber}
                                                    </span>
                                                </td>
                                                <td className="py-3.5 px-5 align-middle">
                                                    <div className="flex items-baseline gap-1.5">
                                                        <span className="text-[13px] font-bold text-slate-900">{tx.nameOfStudent}</span>
                                                        <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">({tx.ownerType || 'Student'})</span>
                                                    </div>
                                                </td>
                                                <td className="py-3.5 px-5 align-middle text-[12px] text-slate-600 font-mono">
                                                    {tx.studentIDNumber}
                                                </td>
                                                <td className="py-3.5 px-5 align-middle text-[12.5px] text-slate-700 font-medium">
                                                    <span className="inline-flex items-center gap-1.5">
                                                        <i className="fa-solid fa-file-lines text-blue-500 text-xs"></i>
                                                        <span>{tx.typeOfDocument}</span>
                                                    </span>
                                                </td>
                                                <td className="py-3.5 px-5 align-middle text-slate-700 text-xs font-medium">
                                                    {(tx.ownerType === 'Alumni') 
                                                        ? tx.yearGraduated 
                                                        : (tx.course || tx.yearLevel) 
                                                            ? `${tx.course || ''} ${tx.yearLevel || ''}`.trim()
                                                            : tx.yearGraduated}
                                                </td>
                                                <td className="py-3.5 px-5 align-middle text-center">
                                                    {renderStatusBadge(tx.blockchainStatus)}
                                                </td>
                                                <td className="py-3.5 px-5 align-middle text-center">
                                                    {tx.blockchainTxHash ? (
                                                        <button
                                                            onClick={() => copyToClipboard(tx.blockchainTxHash)}
                                                            className="font-mono text-[11px] bg-white border border-slate-200/80 px-2.5 py-0.5 rounded-full text-slate-600 hover:border-blue-400 hover:text-blue-600 transition-colors inline-flex items-center gap-1.5 cursor-pointer"
                                                            title="Click to copy full hash"
                                                        >
                                                            <span>{tx.blockchainTxHash.substring(0, 10)}...</span>
                                                            {copiedHash === tx.blockchainTxHash ? <Check size={11} className="text-emerald-600" /> : <Copy size={11} className="text-slate-400" />}
                                                        </button>
                                                    ) : (
                                                        <span className="text-slate-400 text-xs">—</span>
                                                    )}
                                                </td>
                                                <td className="py-3.5 px-5 align-middle text-right text-[12px] text-slate-500 font-medium">
                                                    {new Date(tx.createdAt).toLocaleDateString('en-US', {
                                                        year: 'numeric',
                                                        month: '2-digit',
                                                        day: '2-digit'
                                                    })}
                                                </td>
                                                {isSuperAdmin && (
                                                    <td className="py-3.5 px-5 align-middle text-right">
                                                        <button
                                                            onClick={() => handleDeleteSingle(tx)}
                                                            className="w-7 h-7 rounded-full bg-red-50 hover:bg-red-600 hover:text-white text-red-600 flex items-center justify-center transition-all shadow-2xs border border-red-200/60 hover:-translate-y-0.5 active:translate-y-0.5 cursor-pointer ml-auto"
                                                            title="Delete Transaction"
                                                            aria-label={`Delete transaction ${tx.referenceNumber}`}
                                                        >
                                                            <Trash2 size={12} />
                                                        </button>
                                                    </td>
                                                )}
                                            </tr>
                                        );
                                    })
                                ) : (
                                    <tr>
                                        <td colSpan={isSuperAdmin ? 10 : 8} className="py-16 text-center text-slate-400 italic">
                                            No blockchain transactions found matching your filters.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>

                    {/* Pagination Footer */}
                    <div className="p-4 border-t border-slate-100 flex justify-center bg-slate-50/30">
                        <div className="flex items-center gap-1.5">
                            <button
                                disabled={currentPage === 1}
                                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                                className={`text-xs px-2.5 py-1 rounded-md ${currentPage === 1 ? 'text-slate-300 cursor-not-allowed' : 'text-slate-600 hover:bg-slate-200 cursor-pointer font-bold'}`}
                            >
                                Previous
                            </button>

                            {Array.from({ length: totalPages }).map((_, idx) => {
                                const pageNumber = idx + 1;
                                if (pageNumber === 1 || pageNumber === totalPages || (pageNumber >= currentPage - 1 && pageNumber <= currentPage + 1)) {
                                    return (
                                        <button
                                            key={pageNumber}
                                            onClick={() => setCurrentPage(pageNumber)}
                                            className={`w-7 h-7 rounded-lg text-xs transition-colors font-bold ${
                                                currentPage === pageNumber
                                                    ? 'bg-[#2c3543] text-white shadow-2xs'
                                                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                                            }`}
                                        >
                                            {pageNumber}
                                        </button>
                                    );
                                } else if (pageNumber === currentPage - 2 || pageNumber === currentPage + 2) {
                                    return <span key={pageNumber} className="text-slate-400 text-xs px-1">...</span>;
                                }
                                return null;
                            })}

                            <button
                                disabled={currentPage === totalPages || totalPages === 0}
                                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                                className={`text-xs px-2.5 py-1 rounded-md ${currentPage === totalPages || totalPages === 0 ? 'text-slate-300 cursor-not-allowed' : 'text-slate-600 hover:bg-slate-200 cursor-pointer font-bold'}`}
                            >
                                Next
                            </button>
                        </div>
                    </div>
                </div>

                {/* Filter Drawer */}
                <FilterDrawer
                    isOpen={isFilterDrawerOpen}
                    onClose={() => setIsFilterDrawerOpen(false)}
                    onClearAll={() => {
                        setFilterStatus("All Status");
                        setFilterMonth("");
                        setSortConfig({ key: "createdAt", direction: "desc" });
                    }}
                >
                    <div className="flex flex-col gap-4">
                        <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Sorting</h3>
                        <div className="grid grid-cols-2 gap-3">
                            <div className="flex flex-col gap-1.5">
                                <label className="text-xs font-bold text-slate-700">Sort By:</label>
                                <select
                                    aria-label="Sort by"
                                    className="border border-slate-200 rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-blue-500 bg-white"
                                    value={sortConfig.key}
                                    onChange={(e) => setSortConfig({ ...sortConfig, key: e.target.value })}
                                >
                                    <option value="createdAt">Timestamp</option>
                                    <option value="nameOfStudent">Owner Name</option>
                                    <option value="studentIDNumber">ID Number</option>
                                    <option value="typeOfDocument">Document Type</option>
                                    <option value="blockchainStatus">Status</option>
                                </select>
                            </div>
                            <div className="flex flex-col gap-1.5">
                                <label className="text-xs font-bold text-slate-700">Order:</label>
                                <button
                                    type="button"
                                    onClick={() => setSortConfig({ ...sortConfig, direction: sortConfig.direction === "asc" ? "desc" : "asc" })}
                                    className="border border-slate-200 rounded-xl px-3 py-2 text-xs bg-white flex items-center justify-between hover:bg-slate-50 transition-colors"
                                >
                                    <span>{sortConfig.direction === "asc" ? "Ascending" : "Descending"}</span>
                                    {sortConfig.direction === "asc" ? <ArrowUpZA size={14} className="text-slate-500"/> : <ArrowDownAZ size={14} className="text-slate-500"/>}
                                </button>
                            </div>
                        </div>

                        <div className="border-t border-slate-100 my-1"></div>

                        <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Filtering</h3>
                        
                        <div className="flex flex-col gap-1.5">
                            <label className="text-xs font-bold text-slate-700">Status:</label>
                            <select
                                aria-label="Filter by status"
                                value={filterStatus}
                                onChange={(e) => setFilterStatus(e.target.value)}
                                className="border border-slate-200 rounded-xl px-3 py-2 text-xs bg-white outline-none focus:border-blue-500 text-slate-800"
                            >
                                <option value="All Status">All Status</option>
                                <option value="Recorded">Recorded</option>
                                <option value="Pending">Pending</option>
                                <option value="Failed">Failed</option>
                            </select>
                        </div>

                        <div className="flex flex-col gap-1.5">
                            <label className="text-xs font-bold text-slate-700">Month:</label>
                            <input
                                aria-label="Filter by month"
                                type="month"
                                value={filterMonth}
                                onChange={(e) => setFilterMonth(e.target.value)}
                                className="border border-slate-200 rounded-xl px-3 py-2 text-xs bg-white outline-none focus:border-blue-500 text-slate-800"
                            />
                        </div>
                    </div>
                </FilterDrawer>
            </div>
        </Layout>
    );
}

export default MyTransactions;