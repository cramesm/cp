import { useState, useEffect, useMemo } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { SlidersHorizontal, ArrowDownAZ, ArrowUpZA, Search, Trash2, Eye, CheckSquare, Square } from 'lucide-react';
import Layout from '../../components/Layout';
import FilterDrawer from '../../components/FilterDrawer';
import ActiveFilterChips from '../../components/ActiveFilterChips';
import api from '../../api';
import TableSkeleton from '../../components/TableSkeleton';
import ConfirmModal from '../../components/ConfirmModal';
import FeedbackModal from '../../components/FeedbackModal';
import { useModals } from '../../hooks/useModals';

const Requests = () => {
    const [requests, setRequests] = useState([]);
    const [loading, setLoading] = useState(true);
    
    // Super Admin Selection State
    const [selectedIds, setSelectedIds] = useState([]);
    const { confirmConfig, feedbackConfig, showConfirm, showFeedback, closeConfirm, closeFeedback } = useModals();

    const userRole = localStorage.getItem('userRole') || '';
    const isSuperAdmin = userRole.toLowerCase() === 'super admin';

    // Filter States
    const [searchTerm, setSearchTerm] = useState('');
    const location = useLocation();
    const queryParams = new URLSearchParams(location.search);
    const initialStatus = queryParams.get('status') || 'All Status';

    const [filterStatus, setFilterStatus] = useState(initialStatus);
    const [filterType, setFilterType] = useState('All Document');
    const [filterUserRole, setFilterUserRole] = useState('All');
    const [filterProgram, setFilterProgram] = useState('All');
    const [filterUserStatus, setFilterUserStatus] = useState('All');
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState(new Date().toLocaleDateString('en-CA'));
    const [entriesPerPage, setEntriesPerPage] = useState(10);
    const [currentPage, setCurrentPage] = useState(1);
    const [isFilterDrawerOpen, setIsFilterDrawerOpen] = useState(false);
    const [sortConfig, setSortConfig] = useState({ key: 'dateRequested', direction: 'desc' });

    const navigate = useNavigate();

    // Update filter if URL changes
    useEffect(() => {
        const params = new URLSearchParams(location.search);
        const status = params.get('status');
        if (status) {
            setFilterStatus(status);
        }
    }, [location.search]);

    useEffect(() => {
        const fetchRequests = async () => {
            try {
                let finalRequests = [];
                if (isSuperAdmin) {
                    const [reqRes, stuRes, alumRes] = await Promise.all([
                        api.get('/requests'),
                        api.get('/v1/students').catch(() => ({ data: { data: [] } })),
                        api.get('/v1/alumni').catch(() => ({ data: { data: [] } }))
                    ]);
                    const users = [...(stuRes.data?.data || []), ...(alumRes.data?.data || [])];
                    const userMap = {};
                    users.forEach(u => {
                        if (u.email) userMap[u.email] = u;
                    });
                    finalRequests = (reqRes.data || []).map(req => {
                        const user = userMap[req.email] || {};
                        return {
                            ...req,
                            userRole: req.userRole || user.role || 'student',
                            programLevel: req.programLevel || user.programLevel || 'Bachelors',
                            userStatus: req.userStatus || user.status || 'Active'
                        };
                    });
                } else {
                    const reqRes = await api.get('/requests');
                    finalRequests = reqRes.data || [];
                }

                setRequests(finalRequests);
                if (finalRequests.length > 0) {
                    setStartDate(prev => {
                        if (!prev) {
                            const oldest = new Date(Math.min(...finalRequests.map(req => new Date(req.dateRequested))));
                            return oldest.toLocaleDateString('en-CA');
                        }
                        return prev;
                    });
                }
            } catch (error) {
                console.error("Error fetching requests:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchRequests();
    }, [isSuperAdmin]);

    // Deletion Handlers
    const handleDeleteSingle = (reqItem) => {
        const reqId = reqItem.requestId || reqItem._id;
        showConfirm({
            title: 'Delete Document Request',
            message: `Are you sure you want to permanently delete request "${reqItem.requestId}" for ${reqItem.name || 'User'}? This action cannot be undone.`,
            type: 'danger',
            confirmText: 'Delete Request',
            onConfirm: async () => {
                try {
                    await api.delete(`/requests/${reqId}`);
                    setRequests(prev => prev.filter(r => r.requestId !== reqItem.requestId && r._id !== reqItem._id));
                    setSelectedIds(prev => prev.filter(id => id !== reqItem.requestId && id !== reqItem._id));
                    showFeedback({
                        title: 'Request Deleted',
                        message: `Document request ${reqItem.requestId} has been permanently deleted.`,
                        type: 'success'
                    });
                } catch (err) {
                    console.error('Error deleting request:', err);
                    showFeedback({
                        title: 'Deletion Failed',
                        message: err.response?.data?.message || 'Failed to delete the request. Please try again.',
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
            title: 'Bulk Delete Requests',
            message: `Are you sure you want to permanently delete ${count} selected document request(s)? This action cannot be undone.`,
            type: 'danger',
            confirmText: `Delete ${count} Requests`,
            onConfirm: async () => {
                try {
                    const res = await api.post('/requests/bulk-delete', { requestIds: selectedIds });
                    setRequests(prev => prev.filter(r => !selectedIds.includes(r.requestId) && !selectedIds.includes(r._id)));
                    setSelectedIds([]);
                    showFeedback({
                        title: 'Bulk Deletion Completed',
                        message: res.data?.message || `Successfully deleted ${count} request(s).`,
                        type: 'success'
                    });
                } catch (err) {
                    console.error('Error bulk deleting requests:', err);
                    showFeedback({
                        title: 'Bulk Deletion Failed',
                        message: err.response?.data?.message || 'Failed to delete selected requests. Please try again.',
                        type: 'error'
                    });
                }
            }
        });
    };

    // Filter Logic
    const filteredRequests = useMemo(() => {
        return requests.filter((req) => {
            const matchesSearch = (
                (req.name && req.name.toLowerCase().includes(searchTerm.toLowerCase())) ||
                (req.requestId && req.requestId.toLowerCase().includes(searchTerm.toLowerCase())) ||
                (req.documentType && req.documentType.toLowerCase().includes(searchTerm.toLowerCase())) ||
                (req.email && req.email.toLowerCase().includes(searchTerm.toLowerCase())) ||
                (req.studentId && req.studentId.toLowerCase().includes(searchTerm.toLowerCase()))
            );

            const matchesStatus = filterStatus === 'All Status' || req.status === filterStatus;
            const matchesType = filterType === 'All Document' || req.documentType === filterType;
            
            const matchesUserRole = filterUserRole === 'All' || (req.userRole || 'student').toLowerCase() === filterUserRole.toLowerCase();
            const matchesProgram = filterProgram === 'All' || (req.programLevel || 'Bachelors').toLowerCase() === filterProgram.toLowerCase();
            const matchesUserStatus = filterUserStatus === 'All' || (req.userStatus || 'Active').toLowerCase() === filterUserStatus.toLowerCase();

            let matchesDate = true;
            if (req.dateRequested) {
                const reqDate = new Date(req.dateRequested).toLocaleDateString('en-CA');
                if (startDate && reqDate < startDate) matchesDate = false;
                if (endDate && reqDate > endDate) matchesDate = false;
            }

            return matchesSearch && matchesStatus && matchesType && matchesDate && matchesUserRole && matchesProgram && matchesUserStatus;
        }).sort((a, b) => {
            let valA = a[sortConfig.key];
            let valB = b[sortConfig.key];

            if (sortConfig.key === 'dateRequested') {
                valA = new Date(valA || Date.now()).getTime();
                valB = new Date(valB || Date.now()).getTime();
            } else if (typeof valA === 'string') {
                valA = valA.toLowerCase();
                valB = (valB || '').toLowerCase();
            }

            if (valA < valB) return sortConfig.direction === 'asc' ? -1 : 1;
            if (valA > valB) return sortConfig.direction === 'asc' ? 1 : -1;
            return 0;
        });
    }, [requests, searchTerm, filterStatus, filterType, filterUserRole, filterProgram, filterUserStatus, startDate, endDate, sortConfig]);

    const totalPages = Math.ceil(filteredRequests.length / entriesPerPage);
    const paginatedRequests = filteredRequests.slice(
        (currentPage - 1) * entriesPerPage,
        currentPage * entriesPerPage
    );

    useEffect(() => {
        setCurrentPage(1);
    }, [searchTerm, filterStatus, filterType, filterUserRole, filterProgram, filterUserStatus, startDate, endDate, entriesPerPage]);

    // Status Badge Component
    const renderStatusBadge = (status) => {
        let styles = "bg-slate-100 text-slate-600 border-slate-200/80";
        let dotColor = "bg-slate-400";
        let label = status;

        if (status === 'Released' || status === 'Approved') {
            styles = "bg-emerald-50 text-emerald-700 border-emerald-200/80";
            dotColor = "bg-emerald-500";
            label = "Released";
        } else if (status === 'Pending') {
            styles = "bg-amber-50 text-amber-700 border-amber-200/80";
            dotColor = "bg-amber-500";
        } else if (status === 'In Process') {
            styles = "bg-blue-50 text-blue-700 border-blue-200/80";
            dotColor = "bg-blue-500";
        } else if (status === 'Rejected') {
            styles = "bg-red-50 text-red-700 border-red-200/80";
            dotColor = "bg-red-500";
        }

        return (
            <span className={`inline-flex items-center gap-1.5 py-0.5 px-3 rounded-full font-extrabold text-[10.5px] uppercase tracking-wider border ${styles}`}>
                <span className={`w-1.5 h-1.5 rounded-full ${dotColor}`}></span>
                <span>{label}</span>
            </span>
        );
    };

    const isCurrentPageAllSelected = paginatedRequests.length > 0 && paginatedRequests.every(r => selectedIds.includes(r.requestId || r._id));

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
                
                {/* --- MAIN CARD --- */}
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

                            {/* Search & Action Controls */}
                            <div className="flex items-center gap-2.5 flex-wrap">
                                <div className="relative">
                                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={13} />
                                    <input 
                                        type="text" 
                                        placeholder="Search by name, ID, doc..." 
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
                            </div>
                        </div>

                        {/* Super Admin Bulk Action Toolbar */}
                        {isSuperAdmin && selectedIds.length > 0 && (
                            <div className="flex items-center justify-between bg-blue-50/90 border border-blue-200 px-4 py-2.5 rounded-2xl animate-fade-in text-xs font-bold text-blue-900 shadow-xs">
                                <div className="flex items-center gap-2 flex-wrap">
                                    <span className="bg-blue-600 text-white w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-black">
                                        {selectedIds.length}
                                    </span>
                                    <span>{selectedIds.length} request{selectedIds.length > 1 ? 's' : ''} selected</span>
                                    <button 
                                        type="button" 
                                        onClick={() => setSelectedIds(filteredRequests.map(r => r.requestId || r._id))}
                                        className="text-blue-700 hover:text-blue-900 underline font-extrabold cursor-pointer ml-1"
                                    >
                                        Select all {filteredRequests.length}
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
                                { label: 'Role', value: filterUserRole, key: 'filterUserRole' },
                                { label: 'Program', value: filterProgram, key: 'filterProgram' },
                                { label: 'User Status', value: filterUserStatus, key: 'filterUserStatus' },
                                { label: 'Doc Type', value: filterType, key: 'filterType' },
                                { label: 'Status', value: filterStatus, key: 'filterStatus' },
                                { label: 'From', value: startDate, key: 'startDate' },
                                { label: 'To', value: endDate, key: 'endDate' },
                            ]}
                            onRemove={(key) => {
                                if (key === 'filterUserRole') setFilterUserRole('All');
                                if (key === 'filterProgram') setFilterProgram('All');
                                if (key === 'filterUserStatus') setFilterUserStatus('All');
                                if (key === 'filterType') setFilterType('All Document');
                                if (key === 'filterStatus') setFilterStatus('All Status');
                                if (key === 'startDate') setStartDate('');
                                if (key === 'endDate') setEndDate('');
                            }}
                        />
                    </div>

                    {/* --- TABLE SECTION --- */}
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
                                                    const currentPageIds = paginatedRequests.map(r => r.requestId || r._id);
                                                    if (e.target.checked) {
                                                        setSelectedIds(prev => [...new Set([...prev, ...currentPageIds])]);
                                                    } else {
                                                        setSelectedIds(prev => prev.filter(id => !currentPageIds.includes(id)));
                                                    }
                                                }}
                                            />
                                        </th>
                                    )}
                                    <th className="py-3.5 px-5">Request ID</th>
                                    <th className="py-3.5 px-5">Student Name</th>
                                    <th className="py-3.5 px-5">Document Type</th>
                                    <th className="py-3.5 px-5">Date Requested</th>
                                    <th className="py-3.5 px-5 text-center">Status</th>
                                    <th className="py-3.5 px-5 text-right">Action</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 text-[12.5px]">
                                {loading ? (
                                    <TableSkeleton columns={isSuperAdmin ? 7 : 6} rows={entriesPerPage || 10} />
                                ) : paginatedRequests.length > 0 ? (
                                    paginatedRequests.map((req, idx) => {
                                        const reqId = req.requestId || req._id;
                                        const isSelected = selectedIds.includes(reqId);
                                        return (
                                            <tr key={req._id || idx} className={`hover:bg-slate-50/80 transition-colors ${isSelected ? 'bg-blue-50/40' : ''}`}>
                                                {isSuperAdmin && (
                                                    <td className="py-3.5 px-4 text-center align-middle" onClick={(e) => e.stopPropagation()}>
                                                        <input 
                                                            type="checkbox"
                                                            aria-label={`Select request ${req.requestId}`}
                                                            className="w-4 h-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500 cursor-pointer accent-blue-600"
                                                            checked={isSelected}
                                                            onChange={() => {
                                                                setSelectedIds(prev => prev.includes(reqId) ? prev.filter(x => x !== reqId) : [...prev, reqId]);
                                                            }}
                                                        />
                                                    </td>
                                                )}
                                                <td className="py-3.5 px-5 align-middle">
                                                    <span className="bg-slate-100 px-2 py-0.5 rounded-md text-slate-700 font-mono text-[11.5px] font-bold">
                                                        {req.requestId}
                                                    </span>
                                                </td>
                                                <td className="py-3.5 px-5 align-middle text-[13px] text-slate-900 font-bold">
                                                    {req.name}
                                                </td>
                                                <td className="py-3.5 px-5 align-middle text-[12.5px] text-slate-700 font-medium">
                                                    <span className="inline-flex items-center gap-1.5">
                                                        <i className="fa-solid fa-file-lines text-blue-500 text-xs"></i>
                                                        <span>{req.documentType || 'Diploma (2nd Copy)'}</span>
                                                    </span>
                                                </td>
                                                <td className="py-3.5 px-5 align-middle text-[12px] text-slate-500 font-medium">
                                                    {req.dateRequested ? (
                                                        new Date(req.dateRequested).toLocaleDateString('en-US', {
                                                            year: 'numeric',
                                                            month: '2-digit',
                                                            day: '2-digit'
                                                        })
                                                    ) : '2026-08-21'}
                                                </td>
                                                <td className="py-3.5 px-5 align-middle text-center">
                                                    {renderStatusBadge(req.status)}
                                                </td>
                                                <td className="py-3.5 px-5 align-middle text-right">
                                                    <div className="flex items-center justify-end gap-1.5">
                                                        <button
                                                            onClick={() => navigate(`/requests/${req.requestId}`)}
                                                            className="bg-[#2c3543] hover:bg-[#1f2631] text-white py-1 px-3.5 rounded-full text-[11.5px] font-bold border-t border-white/20 border-b-2 border-black/50 shadow-[0_2px_5px_rgba(0,0,0,0.2)] hover:-translate-y-0.5 hover:shadow-[0_4px_8px_rgba(0,0,0,0.25)] active:translate-y-0.5 active:border-b-0 transition-all flex items-center gap-1.5 cursor-pointer"
                                                        >
                                                            <Eye size={12} />
                                                            <span>View Details</span>
                                                        </button>
                                                        {isSuperAdmin && (
                                                            <button
                                                                onClick={() => handleDeleteSingle(req)}
                                                                className="w-7 h-7 rounded-full bg-red-50 hover:bg-red-600 hover:text-white text-red-600 flex items-center justify-center transition-all shadow-2xs border border-red-200/60 hover:-translate-y-0.5 active:translate-y-0.5 cursor-pointer"
                                                                title="Delete Request"
                                                                aria-label={`Delete request ${req.requestId}`}
                                                            >
                                                                <Trash2 size={12} />
                                                            </button>
                                                        )}
                                                    </div>
                                                </td>
                                            </tr>
                                        );
                                    })
                                ) : (
                                    <tr>
                                        <td colSpan={isSuperAdmin ? 7 : 6} className="py-16 text-center text-slate-400 italic">
                                            No document requests found matching your filters.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>

                    {/* --- PAGINATION FOOTER --- */}
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

                {/* --- FILTER DRAWER --- */}
                <FilterDrawer 
                    isOpen={isFilterDrawerOpen} 
                    onClose={() => setIsFilterDrawerOpen(false)}
                    onClearAll={() => {
                        setFilterStatus('All Status');
                        setFilterType('All Document');
                        setFilterUserRole('All');
                        setFilterProgram('All');
                        setFilterUserStatus('All');
                        setStartDate('');
                        setEndDate(new Date().toLocaleDateString('en-CA'));
                        setSortConfig({ key: 'dateRequested', direction: 'desc' });
                    }}
                >
                    <div className="flex flex-col gap-4">
                        <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Sorting</h3>
                        <div className="grid grid-cols-2 gap-3">
                            <div className="flex flex-col gap-1.5">
                                <label htmlFor="sortBy" className="text-xs font-bold text-slate-700">Sort By:</label>
                                <select 
                                    id="sortBy"
                                    className="border border-slate-200 rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-blue-500 bg-white"
                                    value={sortConfig.key}
                                    onChange={(e) => setSortConfig({ ...sortConfig, key: e.target.value })}
                                >
                                    <option value="dateRequested">Date Requested</option>
                                    <option value="name">Student Name</option>
                                    <option value="requestId">Request ID</option>
                                    <option value="documentType">Document Type</option>
                                    <option value="status">Status</option>
                                </select>
                            </div>
                            <div className="flex flex-col gap-1.5">
                                <label className="text-xs font-bold text-slate-700">Order:</label>
                                <button 
                                    type="button"
                                    onClick={() => setSortConfig({ ...sortConfig, direction: sortConfig.direction === 'asc' ? 'desc' : 'asc' })}
                                    className="border border-slate-200 rounded-xl px-3 py-2 text-xs bg-white flex items-center justify-between hover:bg-slate-50 transition-colors"
                                >
                                    <span>{sortConfig.direction === 'asc' ? 'Ascending' : 'Descending'}</span>
                                    {sortConfig.direction === 'asc' ? <ArrowUpZA size={14} className="text-slate-500"/> : <ArrowDownAZ size={14} className="text-slate-500"/>}
                                </button>
                            </div>
                        </div>

                        <div className="border-t border-slate-100 my-1"></div>

                        <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Filtering</h3>
                        
                        <FilterDropdown 
                            label="Document Type:" 
                            value={filterType} 
                            onChange={setFilterType} 
                            options={[
                                'All Document',
                                'Transcript of Records (TOR)',
                                'Diploma (2nd Copy)',
                                'Certificate of Graduation',
                                'Certificate of Grades',
                                'Honorable Dismissal',
                                'Course Description'
                            ]} 
                        />

                        <FilterDropdown 
                            label="Request Status:" 
                            value={filterStatus} 
                            onChange={setFilterStatus} 
                            options={['All Status', 'Pending', 'In Process', 'Released', 'Rejected']} 
                        />

                        <div className="grid grid-cols-2 gap-3">
                            <FilterDropdown 
                                label="User Role:" 
                                value={filterUserRole} 
                                onChange={setFilterUserRole} 
                                options={['All', 'Student', 'Alumni']} 
                            />
                            <FilterDropdown 
                                label="Program Level:" 
                                value={filterProgram} 
                                onChange={setFilterProgram} 
                                options={['All', 'Bachelors', 'Masters', 'Doctorate']} 
                            />
                        </div>

                        <FilterDropdown 
                            label="User Status:" 
                            value={filterUserStatus} 
                            onChange={setFilterUserStatus} 
                            options={['All', 'Active', 'Inactive', 'Stopped']} 
                        />

                        <div className="grid grid-cols-2 gap-3 mt-1">
                            <div className="flex flex-col gap-1.5">
                                <label htmlFor="startDate" className="text-xs font-bold text-slate-700">Start Date:</label>
                                <input 
                                    id="startDate"
                                    type="date" 
                                    className="border border-slate-200 rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-blue-500 bg-white"
                                    value={startDate}
                                    onChange={(e) => setStartDate(e.target.value)}
                                />
                            </div>
                            <div className="flex flex-col gap-1.5">
                                <label htmlFor="endDate" className="text-xs font-bold text-slate-700">End Date:</label>
                                <input 
                                    id="endDate"
                                    type="date" 
                                    className="border border-slate-200 rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-blue-500 bg-white"
                                    value={endDate}
                                    onChange={(e) => setEndDate(e.target.value)}
                                />
                            </div>
                        </div>
                    </div>
                </FilterDrawer>
            </div>
        </Layout>
    );
};

// Reusable Filter Dropdown
function FilterDropdown({ label, value, onChange, options }) {
    return (
        <div className="flex flex-col gap-1.5">
            <label className="text-xs font-bold text-slate-700">{label}</label>
            <select 
                value={value} 
                onChange={(e) => onChange(e.target.value)}
                className="border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 font-medium bg-white cursor-pointer outline-none focus:border-blue-500 shadow-2xs"
            >
                {options.map(opt => <option key={opt} value={opt}>{opt}</option>)}
            </select>
        </div>
    );
}

export default Requests;
