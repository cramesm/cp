import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Layout from '../../components/Layout/Layout';
import api from '../../api';

const Requests = () => {
    const [requests, setRequests] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [filterStatus, setFilterStatus] = useState('all');
    const navigate = useNavigate();

    useEffect(() => {
        const fetchRequests = async () => {
            try {
                const res = await api.get('/requests');
                if(res.data.length === 0) {
                   setRequests([
                       { requestId: 'REQ1234-2026', name: 'Alyssa Jane Cruz', status: 'Pending', dateRequested: 'January 30, 2026' },
                       { requestId: 'REQ1235-2026', name: 'John Doe', status: 'Approved', dateRequested: 'February 12, 2026' }
                   ]);
                } else {
                   setRequests(res.data);
                }
            } catch (error) {
                console.error("Error fetching requests:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchRequests();
    }, []);

    const getStatusClass = (status) => {
        if (!status) return 'bg-[#fcf8a0] text-[#948b04]'; // pending default
        switch (status.toLowerCase().replace(' ', '-')) {
            case 'pending': return 'bg-[#fcf8a0] text-[#948b04]';
            case 'in-process': return 'bg-[#d1ecf1] text-[#0c5460]';
            case 'approved': return 'bg-[#d4edda] text-[#155724]';
            case 'released': return 'bg-[#cce5ff] text-[#004085]';
            default: return 'bg-[#fcf8a0] text-[#948b04]';
        }
    };

    const handleViewRequest = (id) => {
        navigate(`/requests/${id}`);
    };

    const filteredRequests = requests.filter(req => {
        const matchesSearch = req.requestId.toLowerCase().includes(searchTerm.toLowerCase()) || 
                              req.name.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesFilter = filterStatus === 'all' || req.status.toLowerCase() === filterStatus;
        return matchesSearch && matchesFilter;
    });

    return (
        <Layout>
            <div className="p-6">
                <div className="flex justify-between items-center mb-[25px] flex-wrap gap-[15px]">
                    <div className="flex items-center gap-2.5 w-[400px] max-w-full">
                        <input 
                            type="text" 
                            id="searchInput" 
                            placeholder="Search by ID or Name" 
                            className="flex-1 h-10 px-[15px] border border-[#ddd] rounded-md bg-[#fafafa] text-[14px] outline-none placeholder:text-[#888] focus:border-[#2c3e50]"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                        <button className="bg-[#2c3e50] text-white border-none h-[42px] px-[25px] rounded-md font-semibold cursor-pointer transition-colors hover:bg-[#1a252f]">Search</button>
                    </div>

                    <div className="flex items-center gap-3">
                        <i className="fa-solid fa-filter text-[#333]"></i>
                        <select 
                            className="py-2 px-[15px] w-[120px] border border-[#ddd] rounded-md bg-white text-[14px] cursor-pointer outline-none focus:border-[#2c3e50]" 
                            id="filterSelect"
                            value={filterStatus}
                            onChange={(e) => setFilterStatus(e.target.value)}
                        >
                            <option value="all">All</option>
                            <option value="pending">Pending</option>
                            <option value="processing">Processing</option>
                            <option value="approved">Approved</option>
                        </select>
                    </div>
                </div>

                <div className="bg-white rounded-lg overflow-hidden w-full shadow-[0_4px_15px_rgba(0,0,0,0.1)]">
                    <div className="bg-[#2c3e50] text-white py-[15px] px-5 flex justify-between items-center">
                        <h3 className="m-0 text-[16px] font-medium">All Document Requests</h3>
                        <button className="bg-[#2c3e50] text-white border border-[#ffffff33] py-1.5 px-3 rounded-md text-[13px] cursor-pointer font-medium transition-colors hover:bg-[#1a252f]">Export CSV</button>
                    </div>
                    
                    <table className="w-full border-collapse table-fixed">
                        <thead>
                            <tr>
                                <th className="py-[15px] px-5 text-left font-semibold text-[14px] border-b-2 border-[#eaeaea] text-[#333]">Request ID</th>
                                <th className="py-[15px] px-5 text-left font-semibold text-[14px] border-b-2 border-[#eaeaea] text-[#333]">Name</th>
                                <th className="py-[15px] px-5 text-left font-semibold text-[14px] border-b-2 border-[#eaeaea] text-[#333]">Status</th>
                                <th className="py-[15px] px-5 text-left font-semibold text-[14px] border-b-2 border-[#eaeaea] text-[#333]">Date Requested</th>
                                <th className="py-[15px] px-5 text-left font-semibold text-[14px] border-b-2 border-[#eaeaea] text-[#333]">Action</th>
                            </tr>
                        </thead>
                        <tbody>
                            {loading ? (
                                <tr><td colSpan="5" className="py-[15px] px-5 text-center text-[14px] text-black border-b border-[#eaeaea]">Loading...</td></tr>
                            ) : filteredRequests.length > 0 ? (
                                filteredRequests.map((req, idx) => (
                                    <tr key={idx} className="last:border-none">
                                        <td className="py-[15px] px-5 text-[14px] text-black border-b border-[#eaeaea] align-middle">{req.requestId}</td>
                                        <td className="py-[15px] px-5 text-[14px] text-black border-b border-[#eaeaea] align-middle">{req.name}</td>
                                        <td className="py-[15px] px-5 text-[14px] text-black border-b border-[#eaeaea] align-middle"><span className={`py-1.5 px-5 rounded-full font-bold text-[12px] inline-block text-center min-w-[80px] ${getStatusClass(req.status)}`}>{req.status.toUpperCase()}</span></td>
                                        <td className="py-[15px] px-5 text-[14px] text-black border-b border-[#eaeaea] align-middle">{new Date(req.dateRequested).toLocaleDateString() === 'Invalid Date' ? req.dateRequested : new Date(req.dateRequested).toLocaleDateString()}</td>
                                        <td className="py-[15px] px-5 text-[14px] text-black border-b border-[#eaeaea] align-middle"><button className="bg-[#2c3e50] text-white border-none py-2 px-[18px] rounded-[10px] text-[13px] cursor-pointer font-medium transition-colors hover:bg-[#1a252f]" onClick={() => handleViewRequest(req.requestId)}>View Request</button></td>
                                    </tr>
                                ))
                            ) : (
                                <tr><td colSpan="5" className="py-[15px] px-5 text-center text-[14px] text-black border-b border-[#eaeaea]">No requests match the current filters.</td></tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </Layout>
    );
};

export default Requests;
