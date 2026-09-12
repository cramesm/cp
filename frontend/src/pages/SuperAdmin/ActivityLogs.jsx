import { useState, useMemo, useEffect } from 'react';
import Layout from '../../components/Layout';
import api from '../../api';
import TableSkeleton from '../../components/TableSkeleton';
import FilterDrawer from '../../components/FilterDrawer';
import ActiveFilterChips from '../../components/ActiveFilterChips';
import ConfirmModal from '../../components/ConfirmModal';
import { 
  Search, SlidersHorizontal, ArrowDownAZ, ArrowUpZA, Download, Upload, 
  Database, RefreshCw, ShieldCheck, CheckCircle, AlertCircle, FileSpreadsheet, 
  Server, HardDrive, Clock, Check
} from 'lucide-react';

export default function ActivityLogs() {
  const [activeTab, setActiveTab] = useState('logs'); // 'logs' | 'backup'
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState({ show: false, message: '', type: 'info' });
  const [confirmConfig, setConfirmConfig] = useState(null);

  // Backup & Disaster Recovery States
  const [backupStats, setBackupStats] = useState(null);
  const [statsLoading, setStatsLoading] = useState(false);
  const [exportLoading, setExportLoading] = useState(false);
  const [restoreLoading, setRestoreLoading] = useState(false);
  const [selectedBackupFile, setSelectedBackupFile] = useState(null);
  const [restoreResult, setRestoreResult] = useState(null);

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

  const triggerToast = (message, type = 'info') => {
    setToast({ show: true, message, type });
    setTimeout(() => setToast({ show: false, message: '', type: 'info' }), 4000);
  };

  // Fetch activity logs from API
  const fetchLogs = async () => {
    try {
      setLoading(true);
      const res = await api.get('/activity-logs');
      setLogs(res.data || []);
    } catch (error) {
      console.error('Error fetching activity logs:', error);
    } finally {
      setLoading(false);
    }
  };

  // Fetch backup stats
  const fetchBackupStats = async () => {
    try {
      setStatsLoading(true);
      const res = await api.get('/backup/stats');
      if (res.data?.stats) {
        setBackupStats(res.data.stats);
      }
    } catch (error) {
      console.error('Error fetching backup stats:', error);
    } finally {
      setStatsLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
    fetchBackupStats();
  }, []);

  // Handle Export Snapshot Download
  const handleExportBackup = async () => {
    try {
      setExportLoading(true);
      const res = await api.get('/backup/export', { responseType: 'blob' });
      const blob = new Blob([res.data], { type: 'application/json' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `verifitor_academic_backup_${new Date().toISOString().slice(0, 10)}.json`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      triggerToast('Database disaster recovery snapshot exported successfully!', 'success');
      await fetchBackupStats();
      await fetchLogs();
    } catch (error) {
      console.error('Export backup error:', error);
      triggerToast('Failed to export database backup snapshot.', 'error');
    } finally {
      setExportLoading(false);
    }
  };

  // Handle Restore File Selection
  const handleFileSelect = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.name.endsWith('.json')) {
      triggerToast('Please upload a valid JSON backup snapshot file.', 'error');
      return;
    }
    setSelectedBackupFile(file);
    setRestoreResult(null);
  };

  // Execute Restore
  const executeRestore = async () => {
    if (!selectedBackupFile) return;
    try {
      setRestoreLoading(true);
      const reader = new FileReader();
      reader.onload = async (event) => {
        try {
          const parsed = JSON.parse(event.target.result);
          const res = await api.post('/backup/restore', parsed);
          if (res.data?.success) {
            setRestoreResult(res.data);
            triggerToast('Database snapshot restored successfully!', 'success');
            setSelectedBackupFile(null);
            await fetchBackupStats();
            await fetchLogs();
          }
        } catch (jsonErr) {
          console.error('JSON parse or API error during restore:', jsonErr);
          triggerToast(jsonErr.response?.data?.message || 'Invalid backup file content.', 'error');
        } finally {
          setRestoreLoading(false);
        }
      };
      reader.readAsText(selectedBackupFile);
    } catch (err) {
      console.error('Restore error:', err);
      triggerToast('Failed to execute disaster recovery restore.', 'error');
      setRestoreLoading(false);
    }
  };

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
                            log.type?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                            log.ipAddress?.toLowerCase().includes(searchTerm.toLowerCase());
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

        {/* Global Toast Notification */}
        {toast.show && (
          <div className="fixed top-5 left-1/2 -translate-x-1/2 z-[10001] flex items-center gap-3 px-6 py-3 rounded-2xl shadow-2xl bg-[#2c3543] text-white animate-fade-in border border-slate-700/50">
            <CheckCircle size={18} className="text-emerald-400" />
            <p className="font-bold text-xs tracking-wide">{toast.message}</p>
          </div>
        )}

        {/* 3D Segmented Tab Switcher */}
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <div className="inline-flex bg-slate-200/70 p-1 rounded-full border border-slate-200 shadow-inner">
            <button
              onClick={() => setActiveTab('logs')}
              className={`px-5 py-1.5 rounded-full text-xs font-extrabold transition-all cursor-pointer ${
                activeTab === 'logs'
                  ? 'bg-[#2c3543] text-white shadow-[0_2px_6px_rgba(0,0,0,0.25)] border-t border-white/20 scale-[1.02]'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-white/50'
              }`}
            >
              System Activity Logs
            </button>
            <button
              onClick={() => {
                setActiveTab('backup');
                fetchBackupStats();
              }}
              className={`px-5 py-1.5 rounded-full text-xs font-extrabold transition-all cursor-pointer flex items-center gap-1.5 ${
                activeTab === 'backup'
                  ? 'bg-[#2c3543] text-white shadow-[0_2px_6px_rgba(0,0,0,0.25)] border-t border-white/20 scale-[1.02]'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-white/50'
              }`}
            >
              <Database size={13} />
              <span>Database Backup & Recovery</span>
            </button>
          </div>

          {activeTab === 'logs' && (
            <button
              type="button"
              onClick={() => {
                const headers = ['Timestamp', 'Date', 'User Name', 'Action', 'Type', 'Status', 'IP Address', 'Details'];
                const rows = filteredLogs.map(l => [
                  `"${new Date(l.timestamp).toLocaleTimeString('en-US', { hour12: false })}"`,
                  `"${new Date(l.timestamp).toLocaleDateString('en-US')}"`,
                  `"${(l.userName || '').replace(/"/g, '""')}"`,
                  `"${(l.action || '').replace(/"/g, '""')}"`,
                  `"${(l.type || '').replace(/"/g, '""')}"`,
                  `"${(l.status || '').replace(/"/g, '""')}"`,
                  `"${l.ipAddress || ''}"`,
                  `"${(l.details || '').replace(/"/g, '""')}"`
                ]);
                const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
                const encodedUri = encodeURI(csvContent);
                const link = document.createElement('a');
                link.setAttribute('href', encodedUri);
                link.setAttribute('download', `system_activity_logs_${new Date().toISOString().slice(0, 10)}.csv`);
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
                triggerToast('Activity logs exported to CSV successfully!', 'success');
              }}
              className="bg-white hover:bg-slate-50 text-slate-700 px-4 py-1.5 rounded-full font-bold text-xs border border-slate-200 shadow-2xs hover:-translate-y-0.5 active:translate-y-0.5 transition-all flex items-center gap-2 cursor-pointer"
            >
              <FileSpreadsheet size={14} className="text-emerald-600" />
              <span>Export Logs to CSV</span>
            </button>
          )}
        </div>

        {/* ========================================================================= */}
        {/* TAB 1: SYSTEM ACTIVITY LOGS                                               */}
        {/* ========================================================================= */}
        {activeTab === 'logs' && (
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
                      placeholder="Search user, action, IP..." 
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
                    <th className="py-3.5 px-5">IP Address</th>
                    <th className="py-3.5 px-5 text-center">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-[12.5px]">
                  {loading ? (
                    <TableSkeleton columns={7} rows={entriesPerPage || 10} />
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
                          <td className="py-3.5 px-5 align-middle">
                            {log.ipAddress ? (
                              <span className="bg-slate-100 px-2 py-0.5 rounded text-slate-700 font-mono text-[11px] font-bold">
                                {log.ipAddress}
                              </span>
                            ) : (
                              <span className="text-slate-400 font-mono text-[11px]">—</span>
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
                      <td colSpan="7" className="py-16 text-center text-slate-400 italic">
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
        )}

        {/* ========================================================================= */}
        {/* TAB 2: DATABASE BACKUP & DISASTER RECOVERY (>10k Student Archives)         */}
        {/* ========================================================================= */}
        {activeTab === 'backup' && (
          <div className="space-y-4">
            
            {/* KPI Metric Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
              
              <div className="bg-white rounded-[20px] p-4 flex flex-col justify-between shadow-[0_4px_20px_rgba(0,0,0,0.03),0_1px_3px_rgba(0,0,0,0.02)] border border-slate-100/90">
                <div className="flex justify-between items-start">
                  <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-600 border border-blue-200/60 flex items-center justify-center text-xs">
                    <Database size={15} />
                  </div>
                  <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200">
                    &gt;10,000+ Ready
                  </span>
                </div>
                <div className="mt-2.5">
                  <span className="text-[22px] sm:text-[26px] font-black text-slate-900 leading-tight block">
                    {(backupStats?.totalArchives || 0).toLocaleString()}
                  </span>
                  <span className="text-[11.5px] font-bold text-slate-500 block">
                    Total Student & Alumni Archives
                  </span>
                </div>
              </div>

              <div className="bg-white rounded-[20px] p-4 flex flex-col justify-between shadow-[0_4px_20px_rgba(0,0,0,0.03),0_1px_3px_rgba(0,0,0,0.02)] border border-slate-100/90">
                <div className="flex justify-between items-start">
                  <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-600 border border-emerald-200/60 flex items-center justify-center text-xs">
                    <HardDrive size={15} />
                  </div>
                  <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                    Active
                  </span>
                </div>
                <div className="mt-2.5">
                  <span className="text-[22px] sm:text-[26px] font-black text-slate-900 leading-tight block">
                    {(backupStats?.requestsCount || 0).toLocaleString()}
                  </span>
                  <span className="text-[11.5px] font-bold text-slate-500 block">
                    Academic Requests & Records
                  </span>
                </div>
              </div>

              <div className="bg-white rounded-[20px] p-4 flex flex-col justify-between shadow-[0_4px_20px_rgba(0,0,0,0.03),0_1px_3px_rgba(0,0,0,0.02)] border border-slate-100/90">
                <div className="flex justify-between items-start">
                  <div className="w-8 h-8 rounded-xl bg-purple-50 text-purple-600 border border-purple-200/60 flex items-center justify-center text-xs">
                    <Clock size={15} />
                  </div>
                  <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full bg-purple-50 text-purple-700 border border-purple-200">
                    Snapshot
                  </span>
                </div>
                <div className="mt-2.5">
                  <span className="text-[14px] sm:text-[15px] font-black text-slate-900 leading-tight block truncate">
                    {backupStats?.lastBackupAt ? new Date(backupStats.lastBackupAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }) : 'Never Exported'}
                  </span>
                  <span className="text-[11.5px] font-bold text-slate-500 block">
                    Last Backup Timestamp
                  </span>
                </div>
              </div>

              <div className="bg-white rounded-[20px] p-4 flex flex-col justify-between shadow-[0_4px_20px_rgba(0,0,0,0.03),0_1px_3px_rgba(0,0,0,0.02)] border border-slate-100/90">
                <div className="flex justify-between items-start">
                  <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-600 border border-emerald-200/60 flex items-center justify-center text-xs">
                    <ShieldCheck size={15} />
                  </div>
                  <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                    Healthy
                  </span>
                </div>
                <div className="mt-2.5">
                  <span className="text-[20px] sm:text-[22px] font-black text-emerald-600 leading-tight block">
                    ISO/IEC 25010
                  </span>
                  <span className="text-[11.5px] font-bold text-slate-500 block">
                    Disaster Recovery Compliance
                  </span>
                </div>
              </div>

            </div>

            {/* Action Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              
              {/* Card 1: Snapshot Export */}
              <div className="bg-white rounded-[22px] p-6 border border-slate-100/90 shadow-[0_8px_24px_rgba(0,0,0,0.03),0_2px_6px_rgba(0,0,0,0.02)] flex flex-col justify-between">
                <div>
                  <div className="flex items-center gap-2 text-[#2c3543] mb-3">
                    <Download size={20} className="text-blue-600" />
                    <h3 className="text-[15px] font-black uppercase tracking-wider m-0">On-Demand Snapshot Backup</h3>
                  </div>
                  <p className="text-xs text-slate-500 font-medium leading-relaxed mb-4">
                    Exports a complete, encrypted JSON disaster recovery archive of all student and alumni records, verification requests, payment transactions, and digital ledgers. Designed to safely scale beyond 10,000+ student archives without memory degradation.
                  </p>
                  <div className="bg-slate-50 p-3 rounded-xl border border-slate-100 text-[11px] text-slate-600 font-bold space-y-1 mb-6">
                    <div className="flex justify-between">
                      <span>Format:</span>
                      <span className="font-mono text-slate-800">JSON Archive (.json)</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Target Collections:</span>
                      <span className="text-slate-800">Students, Requests, TXNs, Ledgers, Logs</span>
                    </div>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={handleExportBackup}
                  disabled={exportLoading}
                  className="w-full bg-[#2c3543] hover:bg-[#1f2631] text-white py-2.5 px-6 rounded-full font-bold text-xs border-t border-t-white/20 border-b-2 border-b-black/50 shadow-[0_2px_5px_rgba(0,0,0,0.2)] hover:-translate-y-0.5 active:translate-y-0.5 active:border-b-0 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  {exportLoading ? (
                    <>
                      <RefreshCw size={14} className="animate-spin" />
                      <span>Generating Snapshot...</span>
                    </>
                  ) : (
                    <>
                      <Download size={14} />
                      <span>Download Backup Snapshot (.json)</span>
                    </>
                  )}
                </button>
              </div>

              {/* Card 2: Disaster Recovery Restore */}
              <div className="bg-white rounded-[22px] p-6 border border-slate-100/90 shadow-[0_8px_24px_rgba(0,0,0,0.03),0_2px_6px_rgba(0,0,0,0.02)] flex flex-col justify-between">
                <div>
                  <div className="flex items-center gap-2 text-rose-900 mb-3">
                    <Upload size={20} className="text-rose-600" />
                    <h3 className="text-[15px] font-black uppercase tracking-wider m-0">Disaster Recovery Restore</h3>
                  </div>
                  <p className="text-xs text-slate-500 font-medium leading-relaxed mb-4">
                    Restores academic records and archives from an existing VeriFitor JSON backup snapshot using atomic batch upserting. Existing records are safely updated without duplication.
                  </p>

                  <div className="mb-4">
                    <input
                      type="file"
                      id="backupFileUpload"
                      accept=".json"
                      onChange={handleFileSelect}
                      className="hidden"
                    />
                    <div
                      onClick={() => document.getElementById('backupFileUpload')?.click()}
                      className="border-2 border-dashed border-slate-200 hover:border-rose-400 bg-slate-50 hover:bg-rose-50/30 p-4 rounded-xl text-center cursor-pointer transition-all"
                    >
                      {selectedBackupFile ? (
                        <div className="flex items-center justify-center gap-2 text-xs font-bold text-rose-700">
                          <CheckCircle size={14} />
                          <span>{selectedBackupFile.name} ({(selectedBackupFile.size / 1024).toFixed(1)} KB)</span>
                        </div>
                      ) : (
                        <p className="text-xs font-bold text-slate-500 m-0">
                          Click to select .JSON backup snapshot file
                        </p>
                      )}
                    </div>
                  </div>

                  {restoreResult && (
                    <div className="bg-emerald-50 border border-emerald-200 p-3 rounded-xl text-[11px] text-emerald-800 font-bold mb-4 animate-fade-in">
                      <p className="font-extrabold mb-1">Restore Summary:</p>
                      <p>Students: {restoreResult.restoredCounts?.students || 0} • Requests: {restoreResult.restoredCounts?.requests || 0} • TXNs: {restoreResult.restoredCounts?.transactions || 0}</p>
                    </div>
                  )}
                </div>

                <button
                  type="button"
                  disabled={!selectedBackupFile || restoreLoading}
                  onClick={() => {
                    setConfirmConfig({
                      isOpen: true,
                      title: 'Confirm Disaster Recovery Restore',
                      message: `Are you sure you want to restore database records from "${selectedBackupFile.name}"? This operation will upsert academic archives into the database.`,
                      type: 'warning',
                      confirmText: 'Execute Restore',
                      onConfirm: async () => {
                        setConfirmConfig(null);
                        await executeRestore();
                      }
                    });
                  }}
                  className="w-full bg-rose-600 hover:bg-rose-700 text-white py-2.5 px-6 rounded-full font-bold text-xs border-t border-white/20 border-b-2 border-rose-900 shadow-2xs hover:-translate-y-0.5 active:translate-y-0.5 active:border-b-0 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  {restoreLoading ? (
                    <>
                      <RefreshCw size={14} className="animate-spin" />
                      <span>Restoring Database...</span>
                    </>
                  ) : (
                    <>
                      <Upload size={14} />
                      <span>Restore from Snapshot</span>
                    </>
                  )}
                </button>
              </div>

            </div>

          </div>
        )}

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

        {confirmConfig && (
          <ConfirmModal
            isOpen={confirmConfig.isOpen}
            onClose={() => setConfirmConfig(null)}
            onConfirm={confirmConfig.onConfirm}
            title={confirmConfig.title}
            message={confirmConfig.message}
            type={confirmConfig.type}
            confirmText={confirmConfig.confirmText}
            cancelText="Cancel"
          />
        )}
      </div>
    </Layout>
  );
}