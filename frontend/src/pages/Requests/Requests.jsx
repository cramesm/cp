import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import Layout from '../../components/Layout';
import api from '../../api';

const Requests = () => {
    const [requests, setRequests] = useState([]);
    const [loading, setLoading] = useState(true);
    
    // Filter States
    const [searchTerm, setSearchTerm] = useState('');
    const [filterStatus, setFilterStatus] = useState('All Status');
    const [filterType, setFilterType] = useState('All Document');
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');
    const [entriesPerPage, setEntriesPerPage] = useState(10);
    const [currentPage, setCurrentPage] = useState(1);

    const navigate = useNavigate();

    useEffect(() => {
        const fetchRequests = async () => {
            try {
                const res = await api.get('/requests');
                setRequests(res.data || []);
            } catch (error) {
                console.error("Error fetching requests:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchRequests();
    }, []);

    // Helper for Status Badge Styling
    const getStatusStyle = (status) => {
        switch (status?.toLowerCase()) {
            case 'processing': return 'bg-[#E1FFEB] text-[#28A745]';
            case 'pending': return 'bg-[#FFFDE1] text-[#D2C300]';
            default: return 'bg-gray-100 text-gray-600';
        }
    };

    // Filter Logic
    const filteredRequests = useMemo(() => {
        return requests.filter((req) => {
            const matchesSearch = req.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                                req.requestId?.toLowerCase().includes(searchTerm.toLowerCase());
            const matchesStatus = filterStatus === 'All Status' || req.status === filterStatus;
            const matchesType = filterType === 'All Document' || req.documentType === filterType;

            // Date Logic
            const reqDate = new Date(req.dateRequested);
            const start = startDate ? new Date(startDate) : null;
            const end = endDate ? new Date(endDate) : null;
            const matchesDate = (!start || reqDate >= start) && (!end || reqDate <= end);

            return matchesSearch && matchesStatus && matchesType && matchesDate;
        });
    }, [requests, searchTerm, filterStatus, filterType, startDate, endDate]);

    // Pagination Logic
    const totalPages = Math.ceil(filteredRequests.length / entriesPerPage);
    const paginatedRequests = filteredRequests.slice(
        (currentPage - 1) * entriesPerPage,
        currentPage * entriesPerPage
    );

    // Reset to page 1 if filters change
    useEffect(() => {
        setCurrentPage(1);
    }, [searchTerm, filterStatus, filterType, startDate, endDate, entriesPerPage]);

    // Dynamic Dropdown Options
    const documentTypes = ['All Document', ...new Set(requests.map(r => r.documentType))];
    const statuses = ['All Status', 'Processing', 'Pending', 'Approved', 'Rejected'];

    return (
        <Layout>
            <div className="p-8 bg-[#F8FAFC] min-h-screen font-sans">
                
                {/* --- FILTER SECTION (Matches Image) --- */}
                <div className="bg-white p-6 rounded-t-lg border-x border-t border-gray-200">
                    <div className="flex justify-between items-center mb-6">
                        <div className="flex items-center gap-2 text-sm text-gray-500">
                            Show 
                            <select 
                                value={entriesPerPage}
                                onChange={(e) => setEntriesPerPage(Number(e.target.value))}
                                className="border border-gray-300 rounded px-1 py-1 focus:outline-none"
                            >
                                <option>10</option>
                                <option>25</option>
                                <option>50</option>
                            </select> 
                            entries
                        </div>
                        <form onSubmit={(e) => { e.preventDefault(); document.activeElement?.blur(); }} className="flex gap-0">
                            <input 
                                type="text" 
                                placeholder="Search by name or action..." 
                                className="border border-gray-300 rounded-l px-4 py-2 w-80 text-sm focus:outline-none focus:ring-1 focus:ring-slate-400"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                            <button type="submit" className="bg-[#20354D] text-white px-8 py-2 rounded-r font-bold text-sm hover:bg-slate-800 transition-colors">
                                Search
                            </button>
                        </form>
                    </div>

                    <div className="grid grid-cols-4 gap-6 items-end">
                        <FilterDropdown 
                            label="Document Type:" 
                            value={filterType} 
                            onChange={setFilterType} 
                            options={documentTypes} 
                        />
                        <FilterDropdown 
                            label="Status:" 
                            value={filterStatus} 
                            onChange={setFilterStatus} 
                            options={statuses} 
                        />
                        <div className="flex flex-col gap-1.5">
                            <label className="text-sm font-bold text-gray-700">Start Date:</label>
                            <input 
                                type="date" 
                                className="border border-gray-300 rounded px-3 py-2 text-sm text-gray-500 outline-none"
                                value={startDate}
                                onChange={(e) => setStartDate(e.target.value)}
                            />
                        </div>
                        <div className="flex flex-col gap-1.5">
                            <label className="text-sm font-bold text-gray-700">End Date:</label>
                            <input 
                                type="date" 
                                className="border border-gray-300 rounded px-3 py-2 text-sm text-gray-500 outline-none"
                                value={endDate}
                                onChange={(e) => setEndDate(e.target.value)}
                            />
                        </div>
                    </div>
                </div>

                {/* --- TABLE SECTION --- */}
                <div className="bg-white shadow-sm border border-gray-200 overflow-hidden">
                    <table className="w-full text-left">
                        <thead>
                            <tr className="text-[15px] font-bold text-black border-b border-gray-100">
                                <th className="px-8 py-5">Request ID</th>
                                <th className="px-8 py-5">Name</th>
                                <th className="px-8 py-5">Document Type</th>
                                <th className="px-8 py-5">Date</th>
                                <th className="px-8 py-5">Status</th>
                                <th className="px-8 py-5 text-right"></th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50">
                            {loading ? (
                                <tr><td colSpan="6" className="py-20 text-center text-gray-400">Loading requests...</td></tr>
                            ) : paginatedRequests.length > 0 ? (
                                paginatedRequests.map((req, idx) => {
                                    const reqDate = new Date(req.dateRequested);
                                    const formattedDate = reqDate.toLocaleDateString('en-US', {
                                        year: 'numeric',
                                        month: '2-digit',
                                        day: '2-digit'
                                    });
                                    return (
                                        <tr key={req._id || idx} className="hover:bg-gray-50/50 transition-colors">
                                            <td className="px-8 py-5 text-[13px] text-gray-700">{req.requestId}</td>
                                            <td className="px-8 py-5 text-[13px] text-gray-700">{req.name}</td>
                                            <td className="px-8 py-5 text-[13px] text-gray-700">{req.documentType}</td>
                                            <td className="px-8 py-5 text-[13px] text-gray-700">{formattedDate}</td>
                                            <td className="px-8 py-5">
                                                <span className={`px-4 py-1 rounded text-[10px] font-bold uppercase ${getStatusStyle(req.status)}`}>
                                                    {req.status}
                                                </span>
                                            </td>
                                            <td className="px-8 py-5 text-right">
                                                <button
                                                    onClick={() => navigate(`/requests/${req.requestId}`)}
                                                    className="bg-[#2f3947] text-white px-5 py-2 rounded text-[12px] font-bold hover:bg-black transition-all"
                                                >
                                                    View Request
                                                </button>
                                            </td>
                                        </tr>
                                    );
                                })
                            ) : (
                                <tr><td colSpan="6" className="py-20 text-center text-gray-400 italic">No requests found matching your filters.</td></tr>
                            )}
                        </tbody>
                    </table>
                </div>

                {/* --- PAGINATION --- */}
                <div className="bg-white p-6 border-x border-b border-gray-200 rounded-b-lg flex justify-center gap-2">
                    <button 
                        disabled={currentPage === 1}
                        onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                        className={`text-xs px-2 ${currentPage === 1 ? 'text-gray-300 cursor-not-allowed' : 'text-gray-500 hover:text-black hover:underline cursor-pointer'}`}
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
                                    className={`w-8 h-8 rounded text-xs transition-colors ${
                                        currentPage === pageNumber 
                                            ? 'bg-[#2f3947] text-white font-bold' 
                                            : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                                    }`}
                                >
                                    {pageNumber}
                                </button>
                            );
                        } else if (pageNumber === currentPage - 2 || pageNumber === currentPage + 2) {
                            return <span key={pageNumber} className="text-gray-400 mt-2 text-xs">...</span>;
                        }
                        return null;
                    })}

                    <button 
                        disabled={currentPage === totalPages || totalPages === 0}
                        onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                        className={`text-xs px-2 ${currentPage === totalPages || totalPages === 0 ? 'text-gray-300 cursor-not-allowed' : 'text-gray-500 hover:text-black hover:underline cursor-pointer'}`}
                    >
                        Next
                    </button>
                </div>
            </div>
        </Layout>
    );
};

// Reusable Filter Dropdown
function FilterDropdown({ label, value, onChange, options }) {
    return (
        <div className="flex flex-col gap-1.5">
            <label className="text-sm font-bold text-gray-700">{label}</label>
            <select 
                value={value} 
                onChange={(e) => onChange(e.target.value)}
                className="border border-gray-300 rounded px-3 py-2 text-sm text-gray-500 bg-white cursor-pointer outline-none focus:border-gray-400"
            >
                {options.map(opt => <option key={opt} value={opt}>{opt}</option>)}
            </select>
        </div>
    );
}

export default Requests;
