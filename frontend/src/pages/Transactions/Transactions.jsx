import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import Layout from '../../components/Layout';
import api from '../../api';

const Transactions = () => {
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);

  // Filter States
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('All Document');
  const [filterStatus, setFilterStatus] = useState('All Status');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [entriesPerPage, setEntriesPerPage] = useState(10);

  const navigate = useNavigate();

  useEffect(() => {
    const fetchTransactions = async () => {
      try {
        const res = await api.get('/transactions');
        setTransactions(res.data || []);
      } catch (error) {
        console.error("Error fetching transactions:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchTransactions();
  }, []);

  const filteredTransactions = useMemo(() => {
    return transactions.filter((tx) => {
      const matchesSearch =
        tx.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        tx.transactionId?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        tx.requestId?.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesStatus = filterStatus === 'All Status' || tx.status === filterStatus;
      const matchesType = filterType === 'All Document' || tx.documentType === filterType;

      const txDate = new Date(tx.date);
      const start = startDate ? new Date(startDate) : null;
      const end = endDate ? new Date(endDate) : null;
      const matchesDate = (!start || txDate >= start) && (!end || txDate <= end);

      return matchesSearch && matchesStatus && matchesType && matchesDate;
    });
  }, [transactions, searchTerm, filterStatus, filterType, startDate, endDate]);

  const documentTypes = ['All Document', ...new Set(transactions.map((t) => t.documentType))];
  const statuses = ['All Status', 'Processing', 'Approved', 'Released', 'Rejected'];

  return (
    <Layout>
      <div className="p-8 bg-white min-h-screen font-sans text-[#333]">
        <div className="max-w-[1300px] mx-auto border border-gray-200 rounded-lg shadow-sm">
          
          {/* Top Controls Section */}
          <div className="p-6 space-y-6">
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-2 text-[14px] text-gray-500">
                Show
                <select
                  value={entriesPerPage}
                  onChange={(e) => setEntriesPerPage(e.target.value)}
                  className="border border-gray-300 rounded px-2 py-1 focus:outline-none bg-white"
                >
                  <option>10</option>
                  <option>25</option>
                </select>
                entries
              </div>

              <div className="flex w-full max-w-[400px]">
                <input
                  type="text"
                  placeholder="Search by ID, Name, or Hash..."
                  className="flex-1 border border-gray-300 rounded-l-md px-4 py-2 text-[14px] focus:outline-none"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
                <button className="bg-[#1D2D44] text-white px-8 py-2 rounded-r-md font-bold text-[14px] transition-colors hover:bg-slate-800">
                  Search
                </button>
              </div>
            </div>

            {/* Filter Grid */}
            <div className="grid grid-cols-4 gap-6">
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
              <div className="flex flex-col gap-2">
                <label className="text-[14px] font-bold text-gray-700">Start Date:</label>
                <input
                  type="date"
                  className="border border-gray-300 rounded px-3 py-2 text-[14px] text-gray-400 outline-none w-full"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                />
              </div>
              <div className="flex flex-col gap-2">
                <label className="text-[14px] font-bold text-gray-700">End Date:</label>
                <input
                  type="date"
                  className="border border-gray-300 rounded px-3 py-2 text-[14px] text-gray-400 outline-none w-full"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                />
              </div>
            </div>
          </div>

          {/* Table Header Row */}
          <div className="grid grid-cols-8 bg-white border-y border-gray-200 py-4 px-6">
            <span className="font-bold text-[13px]">Transaction ID</span>
            <span className="font-bold text-[13px]">Request ID</span>
            <span className="font-bold text-[13px]">Name</span>
            <span className="font-bold text-[13px]">Document Type</span>
            <span className="font-bold text-[13px]">Date</span>
            <span className="font-bold text-[13px]">Payment Mode</span>
            <span className="font-bold text-[13px]">Status</span>
            <span className="font-bold text-[13px] text-right">Action</span>
          </div>

          {/* Table Content */}
          <div className="min-h-[300px] flex flex-col">
            {loading ? (
              <div className="flex-1 flex items-center justify-center text-gray-400 italic">
                Loading transactions...
              </div>
            ) : filteredTransactions.length > 0 ? (
              filteredTransactions.map((tx, idx) => (
                <div key={idx} className={`grid grid-cols-8 px-6 py-4 border-b border-gray-100 items-center hover:bg-gray-50 transition-colors ${idx % 2 !== 0 ? 'bg-[#F9FAFF]' : 'bg-white'}`}>
                  <span className="text-[13px] font-medium">{tx.transactionId}</span>
                  <span className="text-[13px]">{tx.requestId}</span>
                  <span className="text-[13px] font-semibold">{tx.name}</span>
                  <span className="text-[13px]">{tx.documentType}</span>
                  <span className="text-[13px]">{tx.date}</span>
                  <span className="text-[13px]">{tx.paymentMode}</span>
                  <div>
                    <span className={`px-3 py-1 rounded text-[10px] font-bold uppercase ${getStatusColor(tx.status)}`}>
                        {tx.status}
                    </span>
                  </div>
                  <div className="text-right">
                    <button 
                      onClick={() => navigate(`/transactions/${tx.transactionId}`)}
                      className="bg-[#2f3947] text-white px-4 py-1.5 rounded text-[11px] font-bold hover:bg-black transition-all"
                    >
                      View Transaction
                    </button>
                  </div>
                </div>
              ))
            ) : (
              <div className="flex-1 flex items-center justify-center text-[#99AAB5] italic text-[18px] py-20">
                No transactions found matching your filters.
              </div>
            )}
          </div>

          {/* --- PAGINATION --- */}
            <div className="bg-white p-6 border-x border-b border-gray-200 rounded-b-lg flex justify-center gap-2">
                <button className="text-gray-400 text-xs px-2">Previous</button>
                <button className="w-8 h-8 bg-[#2f3947] text-white rounded text-xs">1</button>
                <button className="w-8 h-8 bg-gray-100 text-gray-600 rounded text-xs hover:bg-gray-200">2</button>
                <button className="w-8 h-8 bg-gray-100 text-gray-600 rounded text-xs hover:bg-gray-200">3</button>
                <button className="text-gray-400 text-xs px-2">Next</button>
            </div>
        </div>
      </div>
    </Layout>
  );
};

// Helper for Status Badge colors
function getStatusColor(status) {
    switch (status?.toLowerCase()) {
        case 'processing': return 'bg-[#E1FFEB] text-[#28A745]';
        case 'approved': return 'bg-[#D1E9FF] text-[#2E90FA]';
        case 'released': return 'bg-[#FFEED1] text-[#E4A11B]';
        case 'rejected': return 'bg-[#FFD1D1] text-[#F04438]';
        default: return 'bg-gray-100 text-gray-600';
    }
}

function FilterDropdown({ label, value, onChange, options }) {
  return (
    <div className="flex flex-col gap-2">
      <label className="text-[14px] font-bold text-gray-700">{label}</label>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="border border-gray-300 rounded px-3 py-2 text-[14px] text-gray-400 bg-white cursor-pointer outline-none focus:border-gray-400"
      >
        {options.map((opt) => (
          <option key={opt} value={opt} className="text-gray-700">
            {opt}
          </option>
        ))}
      </select>
    </div>
  );
}

export default Transactions;
