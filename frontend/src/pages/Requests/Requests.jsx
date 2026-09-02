import { useState, useEffect, useMemo } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { SlidersHorizontal, ArrowDownAZ, ArrowUpZA, Search } from 'lucide-react';
import Layout from '../../components/Layout';
import FilterDrawer from '../../components/FilterDrawer';
import ActiveFilterChips from '../../components/ActiveFilterChips';
import api from '../../api';
import TableSkeleton from '../../components/TableSkeleton';

const Requests = () => {
    const [requests, setRequests] = useState([]);
    const [loading, setLoading] = useState(true);
    
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
                const userRole = localStorage.getItem('userRole') || '';
                const isSuperAdmin = userRole.toLowerCase() === 'super admin';

                let finalRequests = [];
                if (isSuperAdmin) {
                    const [reqRes, stuRes, alumRes] = await Promise.all([
                        api.get('/requests'),
                        api.get('/v1/students').catch(() => ({ data: { data: [] } })),
                        api.get('/v1/alumni').catch(() => ({ data: { data: [] } }))
                    ]);
                    const users = [...(stuRes.data?.data || []), ...(alumRes.data?.data || [])];
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
    }, []);

    // Filter Logic
    const filteredRequests = useMemo(() => {
        return requests.filter((req) => {
            const matchesSearch = req.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                                req.requestId?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                                (req.documentType && req.documentType.toLowerCase().includes(searchTerm.toLowerCase()));
            const matchesStatus = filterStatus === 'All Status' || req.status === filterStatus;
            const matchesType = filterType === 'All Document' || req.documentType === filterType;

            const matchesRole = filterUserRole === 'All' || (req.userRole || '').toLowerCase() === filterUserRole.toLowerCase();
            const matchesProgram = filterProgram === 'All' || req.programLevel === filterProgram;
            const matchesUserStatus = filterUserStatus === 'All' || req.userStatus === filterUserStatus;

            // Date Logic
            const reqDate = new Date(req.dateRequested);
            const start = startDate ? new Date(startDate) : null;
            const end = endDate ? new Date(endDate) : null;
            if (end) end.setHours(23, 59, 59, 999);
            const matchesDate = (!start || reqDate >= start) && (!end || reqDate <= end);

            return matchesSearch && matchesStatus && matchesType && matchesDate && matchesRole && matchesProgram && matchesUserStatus;
        }).sort((a, b) => {
            let valA = a[sortConfig.key];
            let valB = b[sortConfig.key];
            
            if (sortConfig.key === 'dateRequested') {
                valA = new Date(valA).getTime();
                valB = new Date(valB).getTime();
            } else if (sortConfig.key === 'name') {
                valA = valA ? valA.toLowerCase() : '';
                valB = valB ? valB.toLowerCase() : '';
            }

            if (valA < valB) return sortConfig.direction === 'asc' ? -1 : 1;
            if (valA > valB) return sortConfig.direction === 'asc' ? 1 : -1;
            return 0;
        });
    }, [requests, searchTerm, filterStatus, filterType, filterUserRole, filterProgram, filterUserStatus, startDate, endDate, sortConfig]);

    // Pagination Logic
    const totalPages = Math.ceil(filteredRequests.length / entriesPerPage);
    const paginatedRequests = filteredRequests.slice(
        (currentPage - 1) * entriesPerPage,
        currentPage * entriesPerPage
    );

    // Reset to page 1 if filters change
    useEffect(() => {
        setCurrentPage(1);
    }, [searchTerm, filterStatus, filterType, filterUserRole, filterProgram, filterUserStatus, startDate, endDate, entriesPerPage, sortConfig]);

    // Dynamic Dropdown Options
    const documentTypes = ['All Document', ...new Set(requests.map(r => r.documentType))];
    const statuses = ['All Status', 'Pending', 'In Process', 'Released', 'Rejected'];

    const renderStatusBadge = (status) => {
        const s = (status || 'Pending').toLowerCase();
        if (s === 'released' || s === 'approved') {
            return (
                <span className="inline-flex items-center gap-1.5 py-0.5 px-3 rounded-full font-extrabold text-[10.5px] uppercase tracking-wider bg-emerald-50 text-emerald-700 border border-emerald-200/80">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                    <span>Released</span>
                </span>
            );
        } else if (s === 'in process') {
            return (
                <span className="inline-flex items-center gap-1.5 py-0.5 px-3 rounded-full font-extrabold text-[10.5px] uppercase tracking-wider bg-purple-50 text-purple-700 border border-purple-200/80">
                    <span className="w-1.5 h-1.5 rounded-full bg-purple-500"></span>
                    <span>In Process</span>
                </span>
            );
        } else if (s === 'rejected') {
            return (
                <span className="inline-flex items-center gap-1.5 py-0.5 px-3 rounded-full font-extrabold text-[10.5px] uppercase tracking-wider bg-red-50 text-red-700 border border-red-200/80">
                    <span className="w-1.5 h-1.5 rounded-full bg-red-500"></span>
                    <span>Rejected</span>
                </span>
            );
        } else {
            return (
                <span className="inline-flex items-center gap-1.5 py-0.5 px-3 rounded-full font-extrabold text-[10.5px] uppercase tracking-wider bg-amber-50 text-amber-700 border border-amber-200/80">
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-500"></span>
                    <span>Pending</span>
                </span>
            );
        }
    };

    return (
        <Layout>
            <div className="py-2 px-2 sm:px-4 font-sans space-y-4 relative">
                
                {/* --- MAIN CARD CONTAINER --- */}
                <div className="rounded-[22px] bg-white shadow-[0_8px_24px_rgba(0,0,0,0.03),0_2px_6px_rgba(0,0,0,0.02)] border border-slate-100/90 overflow-hidden">
                    
                    {/* Header & Filter Section */}
                    <div className="p-4 sm:p-5 border-b border-slate-100 bg-slate-50/40 flex flex-col gap-3.5">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                            <div className="flex items-center gap-2 text-xs text-slate-500 font-bold">
                                <span>Show</span>
                                <select 
                                    aria-label="Entries per page"
                                    value={entriesPerPage}
                                    onChange={(e) => setEntriesPerPage(Number(e.target.value))}
                                    className="border border-slate-200 rounded-lg px-2 py-1 bg-white font-bold text-slate-700 focus:outline-none focus:border-blue-500 cursor-pointer shadow-2xs"
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
                                    <TableSkeleton columns={6} rows={entriesPerPage || 10} />
                                ) : paginatedRequests.length > 0 ? (
                                    paginatedRequests.map((req, idx) => (
                                        <tr key={req._id || idx} className="hover:bg-slate-50/80 transition-colors">
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
                                                <button
                                                    onClick={() => navigate(`/requests/${req.requestId}`)}
                                                    className="bg-[#2c3543] hover:bg-[#1f2631] text-white py-1 px-4 rounded-full text-[11.5px] font-bold border-t border-white/20 border-b-2 border-black/50 shadow-[0_2px_5px_rgba(0,0,0,0.2)] hover:-translate-y-0.5 hover:shadow-[0_4px_8px_rgba(0,0,0,0.25)] active:translate-y-0.5 active:border-b-0 transition-all cursor-pointer"
                                                >
                                                    View Details
                                                </button>
                                            </td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td colSpan="6" className="py-16 text-center text-slate-400 italic">
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

                {/* Filter Drawer */}
                <FilterDrawer 
                    isOpen={isFilterDrawerOpen} 
                    onClose={() => setIsFilterDrawerOpen(false)}
                    onClearAll={() => {
                        setFilterUserRole('All');
                        setFilterProgram('All');
                        setFilterUserStatus('All');
                        setFilterType('All Document');
                        setFilterStatus('All Status');
                        setStartDate('');
                        setEndDate('');
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
                                    <option value="name">Name</option>
                                    <option value="status">Status</option>
                                    <option value="documentType">Document Type</option>
                                </select>
                            </div>
                            <div className="flex flex-col gap-1.5">
                                <label className="text-xs font-bold text-slate-700">Order:</label>
                                <button 
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
                        
                        <FilterDropdown label="Document Type:" value={filterType} onChange={setFilterType} options={documentTypes} />
                        <FilterDropdown label="Status:" value={filterStatus} onChange={setFilterStatus} options={statuses} />
                        <FilterDropdown label="User Type:" value={filterUserRole} onChange={setFilterUserRole} options={['All', 'Student', 'Alumni']} />
                        <FilterDropdown label="Program Level:" value={filterProgram} onChange={setFilterProgram} options={['All', 'Bachelors', 'Masters', 'Doctorate']} />
                        <FilterDropdown label="Account Status:" value={filterUserStatus} onChange={setFilterUserStatus} options={['All', 'Active', 'Inactive']} />
                        
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
