import { useState, useMemo, useEffect } from 'react';
import Layout from '../../components/Layout';
import api from '../../api';
import TableSkeleton from '../../components/TableSkeleton';
import FilterDrawer from '../../components/FilterDrawer';
import ActiveFilterChips from '../../components/ActiveFilterChips';
import { Search, SlidersHorizontal, ArrowDownAZ, ArrowUpZA } from 'lucide-react';

export default function ActivityLogs() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Filter States
  const [searchTerm, setSearchTerm] = useState('');
  const [filterUser, setFilterUser] = useState('All Users');
  const [filterAction, setFilterAction] = useState('All Actions');
  const [filterType, setFilterType] = useState('All Document');
  const [filterStatus, setFilterStatus] = useState('All Status');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [entriesPerPage, setEntriesPerPage] = useState(10);
  const [currentPage, setCurrentPage] = useState(1);
  const [isFilterDrawerOpen, setIsFilterDrawerOpen] = useState(false);
  const [sortConfig, setSortConfig] = useState({ key: 'timestamp', direction: 'desc' });

  // Fetch activity logs from API
  useEffect(() => {
    const fetchLogs = async () => {
      try {
        const res = await api.get('/activity-logs');
        setLogs(res.data || []);
      } catch (error) {
        console.error('Error fetching activity logs:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchLogs();
  }, []);

  const renderStatusBadge = (status) => {
    const s = (status || '').toLowerCase();
    if (s === 'successful' || s === 'completed') {
      return (
        <span className="inline-flex items-center gap-1.5 py-0.5 px-3 rounded-full font-extrabold text-[10.5px] uppercase tracking-wider bg-emerald-50 text-emerald-700 border border-emerald-200/80">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
          <span>Successful</span>
        </span>
      );
    } else if (s === 'process' || s === 'pending') {
      return (
        <span className="inline-flex items-center gap-1.5 py-0.5 px-3 rounded-full font-extrabold text-[10.5px] uppercase tracking-wider bg-amber-50 text-amber-700 border border-amber-200/80">
          <span className="w-1.5 h-1.5 rounded-full bg-amber-500"></span>
          <span>Process</span>
        </span>
      );
    } else if (s === 'canceled') {
      return (
        <span className="inline-flex items-center gap-1.5 py-0.5 px-3 rounded-full font-extrabold text-[10.5px] uppercase tracking-wider bg-slate-100 text-slate-600 border border-slate-200/80">
          <span className="w-1.5 h-1.5 rounded-full bg-slate-400"></span>
          <span>Canceled</span>
        </span>
      );
    } else {
      return (
        <span className="inline-flex items-center gap-1.5 py-0.5 px-3 rounded-full font-extrabold text-[10.5px] uppercase tracking-wider bg-red-50 text-red-700 border border-red-200/80">
          <span className="w-1.5 h-1.5 rounded-full bg-red-500"></span>
          <span>{status || 'Failed'}</span>
        </span>
      );
    }
  };

  const filteredLogs = useMemo(() => {
    return logs.filter((log) => {
      const matchesSearch = log.userName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                            log.action?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                            log.type?.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesUser = filterUser === 'All Users' || log.userName === filterUser;
      const matchesAction = filterAction === 'All Actions' || log.action === filterAction;
      const matchesType = filterType === 'All Document' || log.type === filterType;
      const matchesStatus = filterStatus === 'All Status' || log.status === filterStatus;

      const logDate = new Date(log.timestamp);
      
      let matchesDate = true;
      if (startDate) {
        const [year, month, day] = startDate.split('-');
        const start = new Date(year, month - 1, day, 0, 0, 0, 0);
        matchesDate = matchesDate && (logDate >= start);
      }
      if (endDate) {
        const [year, month, day] = endDate.split('-');
        const end = new Date(year, month - 1, day, 23, 59, 59, 999);
        matchesDate = matchesDate && (logDate <= end);
      }

      return matchesSearch && matchesUser && matchesAction && matchesType && matchesStatus && matchesDate;
    }).sort((a, b) => {
      let valA = a[sortConfig.key];
      let valB = b[sortConfig.key];
      
      if (sortConfig.key === 'timestamp') {
        valA = new Date(valA).getTime();
        valB = new Date(valB).getTime();
      } else if (typeof valA === 'string') {
        valA = valA.toLowerCase();
        valB = (valB || '').toLowerCase();
      }

      if (valA < valB) return sortConfig.direction === 'asc' ? -1 : 1;
      if (valA > valB) return sortConfig.direction === 'asc' ? 1 : -1;
      return 0;
    });
  }, [logs, searchTerm, filterUser, filterAction, filterType, filterStatus, startDate, endDate, sortConfig]);

  const totalPages = Math.ceil(filteredLogs.length / entriesPerPage);
  const paginatedLogs = filteredLogs.slice(
      (currentPage - 1) * entriesPerPage,
      currentPage * entriesPerPage
  );

  useEffect(() => {
      setCurrentPage(1);
  }, [searchTerm, filterUser, filterAction, filterType, filterStatus, startDate, endDate, entriesPerPage, sortConfig]);

  const users = ['All Users', ...new Set(logs.map(l => l.userName).filter(Boolean))];
  const actions = ['All Actions', ...new Set(logs.map(l => l.action).filter(Boolean))];
  const types = ['All Document', ...new Set(logs.map(l => l.type).filter(Boolean))];
  const statuses = ['All Status', 'Successful', 'Process', 'Failed', 'Canceled'];

  return (
    <Layout>
      <div className="py-2 px-2 sm:px-4 font-sans space-y-4 relative">
        
        {/* Main Card */}
        <div className="rounded-[22px] bg-white shadow-[0_8px_24px_rgba(0,0,0,0.03),0_2px_6px_rgba(0,0,0,0.02)] border border-slate-100/90 overflow-hidden">
          
          {/* Top Toolbar */}
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
                    placeholder="Search logs, actions, user..." 
                    aria-label="Search logs"
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
                    { label: 'User', value: filterUser, key: 'filterUser' },
                    { label: 'Action', value: filterAction, key: 'filterAction' },
                    { label: 'Doc Type', value: filterType, key: 'filterType' },
                    { label: 'Status', value: filterStatus, key: 'filterStatus' },
                    { label: 'From', value: startDate, key: 'startDate' },
                    { label: 'To', value: endDate, key: 'endDate' },
                ]}
                onRemove={(key) => {
                    if (key === 'filterUser') setFilterUser('All Users');
                    if (key === 'filterAction') setFilterAction('All Actions');
                    if (key === 'filterType') setFilterType('All Document');
                    if (key === 'filterStatus') setFilterStatus('All Status');
                    if (key === 'startDate') setStartDate('');
                    if (key === 'endDate') setEndDate('');
                }}
            />
          </div>

          {/* Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse table-auto">
              <thead>
                <tr className="bg-slate-50/70 text-[11.5px] font-extrabold uppercase tracking-wider text-slate-500 border-b border-slate-100">
                  <th className="py-3.5 px-5">Timestamp</th>
                  <th className="py-3.5 px-5">Date</th>
                  <th className="py-3.5 px-5">User Name</th>
                  <th className="py-3.5 px-5">Action</th>
                  <th className="py-3.5 px-5">Document Type</th>
                  <th className="py-3.5 px-5 text-center">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-[12.5px]">
                {loading ? (
                  <TableSkeleton columns={6} rows={entriesPerPage || 10} />
                ) : paginatedLogs.length > 0 ? (
                  paginatedLogs.map((log, index) => {
                    const logDate = new Date(log.timestamp);
                    const timeStr = logDate.toLocaleTimeString('en-US', { hour12: false });
                    const dateStr = logDate.toLocaleDateString('en-US', {
                      year: 'numeric',
                      month: '2-digit',
                      day: '2-digit'
                    });
                    return (
                      <tr key={log._id || index} className="hover:bg-slate-50/80 transition-colors">
                        <td className="py-3.5 px-5 align-middle font-mono text-[11.5px] text-slate-500">{timeStr}</td>
                        <td className="py-3.5 px-5 align-middle text-[12px] text-slate-500 font-medium">{dateStr}</td>
                        <td className="py-3.5 px-5 align-middle text-[13px] font-bold text-slate-900">{log.userName}</td>
                        <td className="py-3.5 px-5 align-middle text-[12.5px] font-semibold text-slate-700">{log.action}</td>
                        <td className="py-3.5 px-5 align-middle text-[12.5px] text-slate-700 font-medium">
                          {log.type ? (
                            <span className="inline-flex items-center gap-1.5">
                              <i className="fa-solid fa-file-lines text-blue-500 text-xs"></i>
                              <span>{log.type}</span>
                            </span>
                          ) : (
                            <span className="text-slate-400">—</span>
                          )}
                        </td>
                        <td className="py-3.5 px-5 align-middle text-center">
                          {renderStatusBadge(log.status)}
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan="6" className="py-16 text-center text-slate-400 italic">
                      No activity logs found matching your filters.
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
            setFilterUser('All Users');
            setFilterAction('All Actions');
            setFilterType('All Document');
            setFilterStatus('All Status');
            setStartDate('');
            setEndDate('');
            setSortConfig({ key: 'timestamp', direction: 'desc' });
          }}
        >
          <div className="flex flex-col gap-4">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Sorting</h3>
            <div className="grid grid-cols-2 gap-3">
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold text-slate-700">Sort By:</label>
                <select 
                  className="border border-slate-200 rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-blue-500 bg-white"
                  value={sortConfig.key}
                  onChange={(e) => setSortConfig({ ...sortConfig, key: e.target.value })}
                >
                  <option value="timestamp">Timestamp</option>
                  <option value="userName">User Name</option>
                  <option value="action">Action</option>
                  <option value="status">Status</option>
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
            
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-bold text-slate-700">User:</label>
              <select
                value={filterUser}
                onChange={(e) => setFilterUser(e.target.value)}
                className="border border-slate-200 rounded-xl px-3 py-2 text-xs bg-white outline-none focus:border-blue-500 text-slate-800"
              >
                {users.map((u) => <option key={u} value={u}>{u}</option>)}
              </select>
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-bold text-slate-700">Action:</label>
              <select
                value={filterAction}
                onChange={(e) => setFilterAction(e.target.value)}
                className="border border-slate-200 rounded-xl px-3 py-2 text-xs bg-white outline-none focus:border-blue-500 text-slate-800"
              >
                {actions.map((a) => <option key={a} value={a}>{a}</option>)}
              </select>
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-bold text-slate-700">Document Type:</label>
              <select
                value={filterType}
                onChange={(e) => setFilterType(e.target.value)}
                className="border border-slate-200 rounded-xl px-3 py-2 text-xs bg-white outline-none focus:border-blue-500 text-slate-800"
              >
                {types.map((t) => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-bold text-slate-700">Status:</label>
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="border border-slate-200 rounded-xl px-3 py-2 text-xs bg-white outline-none focus:border-blue-500 text-slate-800"
              >
                {statuses.map((s) => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>

            <div className="grid grid-cols-2 gap-3 mt-1">
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold text-slate-700">Start Date:</label>
                <input 
                  type="date" 
                  className="border border-slate-200 rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-blue-500 bg-white text-slate-800"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold text-slate-700">End Date:</label>
                <input 
                  type="date" 
                  className="border border-slate-200 rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-blue-500 bg-white text-slate-800"
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
}