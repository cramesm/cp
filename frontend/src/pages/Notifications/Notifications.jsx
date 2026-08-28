import { useState, useEffect, useMemo } from 'react';
import Layout from '../../components/Layout';
import api from '../../api';
import { AlertCircle, Info, X, Search, SlidersHorizontal, ArrowDownAZ, ArrowUpZA, CheckCircle2, RefreshCw, CheckCheck } from 'lucide-react';
import FilterDrawer from '../../components/FilterDrawer';
import ActiveFilterChips from '../../components/ActiveFilterChips';
import TableSkeleton from '../../components/TableSkeleton';

const Notifications = () => {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [entriesPerPage, setEntriesPerPage] = useState(10);
  const [currentPage, setCurrentPage] = useState(1);
  const [toast, setToast] = useState({ show: false, message: '', type: 'info' });

  // Filter States
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('All Status');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [isFilterDrawerOpen, setIsFilterDrawerOpen] = useState(false);
  const [sortConfig, setSortConfig] = useState({ key: 'date', direction: 'desc' });

  useEffect(() => {
    fetchNotifications();
  }, []);

  const fetchNotifications = async () => {
    setLoading(true);
    try {
      const res = await api.get('/notifications');
      setNotifications(res.data || []);
    } catch (error) {
      triggerToast("Failed to load notifications from server.", "error");
    } finally {
      setLoading(false);
    }
  };

  const triggerToast = (message, type = 'info') => {
    setToast({ show: true, message, type });
    setTimeout(() => setToast({ show: false, message: '', type: 'info' }), 4000);
  };

  const handleMarkAllRead = async () => {
    try {
      await api.put('/notifications/mark-all-read'); 
      setNotifications(notifications.map(n => ({ ...n, isRead: true })));
      triggerToast("All notifications marked as read!", "info");
    } catch (error) {
      triggerToast("Could not update notifications on server.", "error");
    }
  };

  const filteredNotifications = useMemo(() => {
    const sanitizedSearch = searchTerm.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    return notifications.filter((n) => {
      const matchesSearch = n.message?.toLowerCase().includes(sanitizedSearch.toLowerCase());
      const matchesStatus = filterStatus === 'All Status' ? true : (filterStatus === 'Unread' ? !n.isRead : n.isRead);
      
      const notifDate = new Date(n.date || n.createdAt);
      const start = startDate ? new Date(startDate) : null;
      const end = endDate ? new Date(endDate) : null;
      if (end) end.setHours(23, 59, 59, 999);
      const matchesDate = (!start || notifDate >= start) && (!end || notifDate <= end);

      return matchesSearch && matchesStatus && matchesDate;
    }).sort((a, b) => {
        let valA = a[sortConfig.key];
        let valB = b[sortConfig.key];
        
        if (sortConfig.key === 'date') {
            valA = new Date(a.date || a.createdAt).getTime();
            valB = new Date(b.date || b.createdAt).getTime();
        } else if (sortConfig.key === 'status') {
            valA = a.isRead ? 1 : 0;
            valB = b.isRead ? 1 : 0;
        }

        if (valA < valB) return sortConfig.direction === 'asc' ? -1 : 1;
        if (valA > valB) return sortConfig.direction === 'asc' ? 1 : -1;
        return 0;
    });
  }, [notifications, searchTerm, filterStatus, startDate, endDate, sortConfig]);

  const totalPages = Math.ceil(filteredNotifications.length / entriesPerPage);
  const paginatedNotifications = filteredNotifications.slice(
    (currentPage - 1) * entriesPerPage,
    currentPage * entriesPerPage
  );

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, filterStatus, startDate, endDate, entriesPerPage, sortConfig]);

  const renderStatusBadge = (isRead) => {
    if (isRead) {
      return (
        <span className="inline-flex items-center gap-1.5 py-0.5 px-3 rounded-full font-extrabold text-[10.5px] uppercase tracking-wider bg-slate-100 text-slate-600 border border-slate-200/80">
          <span className="w-1.5 h-1.5 rounded-full bg-slate-400"></span>
          <span>Read</span>
        </span>
      );
    } else {
      return (
        <span className="inline-flex items-center gap-1.5 py-0.5 px-3 rounded-full font-extrabold text-[10.5px] uppercase tracking-wider bg-blue-50 text-blue-700 border border-blue-200/80 shadow-xs">
          <span className="w-1.5 h-1.5 rounded-full bg-blue-600 shadow-[0_0_6px_rgba(37,99,235,0.7)] animate-pulse"></span>
          <span>Unread</span>
        </span>
      );
    }
  };

  return (
    <Layout>
      <div className="py-2 px-2 sm:px-4 font-sans space-y-4 relative">
        
        {/* Toast Notification */}
        {toast.show && (
            <div className={`fixed top-5 left-1/2 -translate-x-1/2 z-[9999] flex items-center gap-3 px-6 py-3 rounded-2xl shadow-2xl transition-all border border-slate-700/50 ${
                toast.type === 'error' ? 'bg-red-600 text-white' : 'bg-[#2c3543] text-white'
            }`}>
                {toast.type === 'error' ? <AlertCircle size={18} /> : <CheckCircle2 size={18} className="text-emerald-400" />}
                <p className="font-bold text-xs tracking-wide">{toast.message}</p>
                <button onClick={() => setToast({ ...toast, show: false })} className="ml-2 hover:bg-white/20 rounded-full p-0.5">
                    <X size={13} />
                </button>
            </div>
        )}

        {/* Main Card Container */}
        <div className="rounded-[22px] bg-white shadow-[0_8px_24px_rgba(0,0,0,0.03),0_2px_6px_rgba(0,0,0,0.02)] border border-slate-100/90 overflow-hidden">
          
          {/* Top Toolbar */}
          <div className="p-4 sm:p-5 border-b border-slate-100 bg-slate-50/40 flex flex-col gap-3.5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              
              {/* Show Entries & Search */}
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

              {/* Controls */}
              <div className="flex items-center gap-2.5 flex-wrap">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={13} />
                  <input 
                    aria-label="Search notifications"
                    type="text" 
                    placeholder="Search notifications..." 
                    className="w-56 sm:w-64 rounded-full border border-slate-200 bg-white py-1.5 pl-8 pr-3.5 text-[12px] font-medium outline-none focus:border-blue-500 shadow-2xs"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
                
                <button 
                  onClick={() => setIsFilterDrawerOpen(true)}
                  className="bg-white hover:bg-slate-50 text-slate-700 px-3.5 py-1.5 rounded-full font-bold text-[11.5px] border border-slate-200 shadow-2xs hover:-translate-y-0.5 active:translate-y-0.5 transition-all flex items-center gap-1.5 cursor-pointer"
                >
                  <SlidersHorizontal size={13} />
                  <span>Filters & Sort</span>
                </button>

                <button 
                  onClick={handleMarkAllRead} 
                  className="bg-[#2c3543] hover:bg-[#1f2631] text-white py-1.5 px-3.5 rounded-full text-[11.5px] font-bold border-t border-white/20 border-b-2 border-black/50 shadow-[0_2px_5px_rgba(0,0,0,0.2)] hover:-translate-y-0.5 hover:shadow-[0_4px_8px_rgba(0,0,0,0.25)] active:translate-y-0.5 active:border-b-0 transition-all flex items-center gap-1.5 cursor-pointer whitespace-nowrap"
                >
                  <CheckCheck size={13} />
                  <span>Mark all read</span>
                </button>

                <button 
                  onClick={fetchNotifications} 
                  title="Refresh notifications"
                  className="bg-white hover:bg-slate-50 text-slate-700 p-2 rounded-full border border-slate-200 shadow-2xs hover:-translate-y-0.5 active:translate-y-0.5 transition-all flex items-center justify-center cursor-pointer"
                >
                  <RefreshCw size={13} />
                </button>
              </div>
            </div>

            <ActiveFilterChips 
              filters={[
                { label: 'Status', value: filterStatus, key: 'filterStatus' },
                { label: 'From', value: startDate, key: 'startDate' },
                { label: 'To', value: endDate, key: 'endDate' },
              ]}
              onRemove={(key) => {
                if (key === 'filterStatus') setFilterStatus('All Status');
                if (key === 'startDate') setStartDate('');
                if (key === 'endDate') setEndDate('');
              }}
            />
          </div>

          {/* Table: NOTIFICATION, DATE & TIME, STATUS */}
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse table-auto">
              <thead>
                <tr className="bg-slate-50/70 text-[11.5px] font-extrabold uppercase tracking-wider text-slate-500 border-b border-slate-100">
                  <th className="py-3.5 px-5">Notification</th>
                  <th className="py-3.5 px-5">Date & Time</th>
                  <th className="py-3.5 px-5 text-center">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-[12.5px]">
                {loading ? (
                  <TableSkeleton columns={3} rows={entriesPerPage || 10} />
                ) : paginatedNotifications.length > 0 ? (
                  paginatedNotifications.map((n, idx) => {
                    const notifDate = n.date || (n.createdAt ? new Date(n.createdAt).toLocaleString('en-US', {
                      year: 'numeric',
                      month: '2-digit',
                      day: '2-digit',
                      hour: '2-digit',
                      minute: '2-digit',
                      second: '2-digit',
                      hour12: true
                    }) : 'Recent');

                    return (
                      <tr key={n._id || idx} className="hover:bg-slate-50/80 transition-colors">
                        <td className="py-3.5 px-5 align-middle">
                          <div className="flex items-center gap-3">
                            <div className={`w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 text-xs ${
                              n.isRead 
                                ? 'bg-slate-100 text-slate-500' 
                                : 'bg-blue-100 text-blue-700 shadow-2xs'
                            }`}>
                              <i className="fa-solid fa-bell text-[11px]"></i>
                            </div>
                            <span className={`text-[13px] leading-snug ${
                              n.isRead 
                                ? 'text-slate-700 font-medium' 
                                : 'text-slate-900 font-bold'
                            }`}>
                              {n.message}
                            </span>
                          </div>
                        </td>
                        <td className="py-3.5 px-5 align-middle text-[12px] text-slate-500 font-medium font-mono whitespace-nowrap">
                          {notifDate}
                        </td>
                        <td className="py-3.5 px-5 align-middle text-center whitespace-nowrap">
                          {renderStatusBadge(n.isRead)}
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan="3" className="py-16 text-center text-slate-400 italic">
                      No notifications found matching your filters.
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
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                disabled={currentPage === 1}
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
                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages || totalPages === 0}
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
            setFilterStatus('All Status');
            setStartDate('');
            setEndDate('');
            setSortConfig({ key: 'date', direction: 'desc' });
          }}
        >
          <div className="flex flex-col gap-4">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Sorting</h3>
            <div className="grid grid-cols-2 gap-3">
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold text-slate-700">Sort By:</label>
                <select 
                  aria-label="Sort By"
                  className="border border-slate-200 rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-blue-500 bg-white"
                  value={sortConfig.key}
                  onChange={(e) => setSortConfig({ ...sortConfig, key: e.target.value })}
                >
                  <option value="date">Date</option>
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
              <label className="text-xs font-bold text-slate-700">Status:</label>
              <select 
                aria-label="Status Filter"
                value={filterStatus} 
                onChange={(e) => setFilterStatus(e.target.value)} 
                className="border border-slate-200 rounded-xl px-3 py-2 text-xs bg-white outline-none focus:border-blue-500 text-slate-800"
              >
                <option value="All Status">All Status</option>
                <option value="Unread">Unread</option>
                <option value="Read">Read</option>
              </select>
            </div>

            <div className="grid grid-cols-2 gap-3 mt-1">
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold text-slate-700">Start Date:</label>
                <input 
                  aria-label="Start Date"
                  type="date" 
                  className="border border-slate-200 rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-blue-500 bg-white text-slate-800"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold text-slate-700">End Date:</label>
                <input 
                  aria-label="End Date"
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
};

export default Notifications;
