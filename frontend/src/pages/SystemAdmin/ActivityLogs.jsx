import { useState, useMemo } from 'react';
import AdminLayout from '../../components/AdminLayout';

const logData = [
  { timestamp: '13:30:04', date: '2027-03-26', name: 'Matt Dickerson', action: 'Document Uploaded', type: 'Certificate of Good Moral', status: 'Successful' },
  { timestamp: '13:30:04', date: '2027-03-26', name: 'Wiktoria', action: 'Blockchain Submission', type: 'Transcript of Records', status: 'Successful' },
  { timestamp: '13:30:04', date: '2027-03-26', name: 'Trixie Byrd', action: 'Hash Generation', type: 'Transcript of Records', status: 'Process' },
  { timestamp: '13:30:04', date: '2027-03-26', name: 'Brad Mason', action: 'Blockchain Submission', type: 'Diploma', status: 'Process' },
  { timestamp: '13:30:04', date: '2027-03-26', name: 'Sanderson', action: 'Document Uploaded', type: 'Certificate of Enrollment', status: 'Failed' },
  { timestamp: '13:30:04', date: '2027-03-26', name: 'Jun Redfern', action: 'Hash Generation', type: 'Diploma', status: 'Successful' },
  { timestamp: '13:30:04', date: '2027-03-26', name: 'Miriam Kidd', action: 'Blockchain Submission', type: 'Transcript of Records', status: 'Successful' },
  { timestamp: '13:30:04', date: '2027-03-26', name: 'Dominic', action: 'User Created', type: '------', status: 'Successful' },
  { timestamp: '13:30:04', date: '2027-03-26', name: 'Shanice', action: 'Document Uploaded', type: 'Transcript of Records', status: 'Canceled' },
  { timestamp: '13:30:04', date: '2027-03-26', name: 'Poppy-Rose', action: 'User Created', type: '------', status: 'Process' },
];

export default function ActivityLogs() {
  // Filter States
  const [searchTerm, setSearchTerm] = useState('');
  const [filterUser, setFilterUser] = useState('All Users');
  const [filterAction, setFilterAction] = useState('All Actions');
  const [filterType, setFilterType] = useState('All Document');
  const [filterStatus, setFilterStatus] = useState('All Status');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  // Status Styling Logic
  const getStatusStyle = (status) => {
    switch (status) {
      case 'Successful': return 'bg-[#e7f6f2] text-[#5cb85c] border-[#d4edda]';
      case 'Process': return 'bg-[#fff4e6] text-[#f0ad4e] border-[#ffeeba]';
      case 'Failed': return 'bg-[#fde8e8] text-[#d9534f] border-[#f5c6cb]';
      case 'Canceled': return 'bg-[#f4f4f4] text-[#777777] border-[#dddddd]';
      default: return 'bg-gray-100 text-gray-600';
    }
  };

  // Main Filter Logic
  const filteredLogs = useMemo(() => {
    return logData.filter((log) => {
      const matchesSearch = log.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                            log.action.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesUser = filterUser === 'All Users' || log.name === filterUser;
      const matchesAction = filterAction === 'All Actions' || log.action === filterAction;
      const matchesType = filterType === 'All Document' || log.type === filterType;
      const matchesStatus = filterStatus === 'All Status' || log.status === filterStatus;
      
      // Date Filtering
      const logDate = new Date(log.date);
      const start = startDate ? new Date(startDate) : null;
      const end = endDate ? new Date(endDate) : null;
      const matchesDate = (!start || logDate >= start) && (!end || logDate <= end);

      return matchesSearch && matchesUser && matchesAction && matchesType && matchesStatus && matchesDate;
    });
  }, [searchTerm, filterUser, filterAction, filterType, filterStatus, startDate, endDate]);

  // Unique lists for dropdowns (Dynamic)
  const users = ['All Users', ...new Set(logData.map(l => l.name))];
  const actions = ['All Actions', ...new Set(logData.map(l => l.action))];
  const types = ['All Document', ...new Set(logData.map(l => l.type))];
  const statuses = ['All Status', 'Successful', 'Process', 'Failed', 'Canceled'];

  return (
    <AdminLayout>
      <div className="p-8">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          
          {/* Global Search */}
          <div className="flex justify-between items-center mb-6">
            <div className="flex items-center gap-2 text-xs text-gray-600">
              <span>Show</span>
              <select className="border bg-[#f1f3f5] rounded px-1 py-0.5 outline-none">
                <option>10</option>
              </select>
              <span>entries</span>
            </div>
            <div className="flex gap-2">
              <input 
                type="text" 
                placeholder="Search by name or action..." 
                className="border rounded px-3 py-1.5 text-sm w-64 outline-none focus:ring-1 focus:ring-[#20354d]"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
              <button className="bg-[#20354d] text-white px-6 py-1.5 rounded text-sm font-semibold hover:opacity-90">Search</button>
            </div>
          </div>

          {/* Filter Dropdowns Grid */}
          <div className="grid grid-cols-6 gap-4 mb-8">
            <FilterSelect label="User:" value={filterUser} onChange={setFilterUser} options={users} />
            <FilterSelect label="Action:" value={filterAction} onChange={setFilterAction} options={actions} />
            <FilterSelect label="Document Type:" value={filterType} onChange={setFilterType} options={types} />
            <FilterSelect label="Status:" value={filterStatus} onChange={setFilterStatus} options={statuses} />
            
            <div className="flex flex-col gap-1">
              <label className="text-xs font-bold text-gray-700">Start Date:</label>
              <input 
                type="date" 
                className="border rounded px-2 py-1 text-xs text-gray-500 bg-white outline-none" 
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
              />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-xs font-bold text-gray-700">End Date:</label>
              <input 
                type="date" 
                className="border rounded px-2 py-1 text-xs text-gray-500 bg-white outline-none" 
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
              />
            </div>
          </div>

          {/* Table */}
          <div className="overflow-x-auto min-h-[400px]">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b-2 border-gray-100 text-[#333] font-bold text-sm">
                  <th className="py-4 px-2">Timestamp</th>
                  <th className="py-4 px-2">Date</th>
                  <th className="py-4 px-2">Registrar Name</th>
                  <th className="py-4 px-2">Action</th>
                  <th className="py-4 px-2">Document Type</th>
                  <th className="py-4 px-2">Status</th>
                </tr>
              </thead>
              <tbody className="text-xs text-gray-700">
                {filteredLogs.map((log, index) => (
                  <tr key={index} className={index % 2 === 0 ? 'bg-[#fcfcff]' : 'bg-white border-b border-gray-50'}>
                    <td className="py-4 px-2 font-medium">{log.timestamp}</td>
                    <td className="py-4 px-2">{log.date}</td>
                    <td className="py-4 px-2">{log.name}</td>
                    <td className="py-4 px-2 font-medium text-gray-600">{log.action}</td>
                    <td className="py-4 px-2">{log.type}</td>
                    <td className="py-4 px-2">
                      <span className={`px-3 py-1 rounded-full text-[10px] font-bold border ${getStatusStyle(log.status)}`}>
                        {log.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {filteredLogs.length === 0 && (
                <div className="text-center py-20 text-gray-400 italic">No logs match your filters.</div>
            )}
          </div>

          {/* Pagination */}
          <div className="flex justify-center items-center mt-8 gap-2 text-xs">
            <button className="text-gray-400 hover:text-black">Previous</button>
            <button className="w-7 h-7 bg-[#2f3947] text-white rounded">1</button>
            <button className="text-gray-400 hover:text-black">Next</button>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}

// Reusable Filter Dropdown Component
function FilterSelect({ label, value, onChange, options }) {
  return (
    <div className="flex flex-col gap-1">
      <label className="text-xs font-bold text-gray-700">{label}</label>
      <select 
        className="border rounded px-2 py-1 text-xs text-gray-500 bg-white outline-none cursor-pointer hover:border-gray-400"
        value={value}
        onChange={(e) => onChange(e.target.value)}
      >
        {options.map(opt => <option key={opt} value={opt}>{opt}</option>)}
      </select>
    </div>
  );
}