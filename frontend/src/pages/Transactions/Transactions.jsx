import { useState, useEffect, useMemo } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import Layout from '../../components/Layout';
import ConfirmModal from '../../components/ConfirmModal';
import FeedbackModal from '../../components/FeedbackModal';
import FilterDrawer from '../../components/FilterDrawer';
import ActiveFilterChips from '../../components/ActiveFilterChips';
import api from '../../api';
import TableSkeleton from '../../components/TableSkeleton';
import { useModals } from '../../hooks/useModals';
import { X, ZoomIn, CheckCircle, Image as ImageIcon, Send, AlertCircle, RefreshCw, Receipt, Eye, XCircle, Undo2, SlidersHorizontal, ArrowDownAZ, ArrowUpZA, Trash2 } from 'lucide-react';

const API_BASE = (import.meta.env.VITE_API_URL ? import.meta.env.VITE_API_URL.replace('/api', '') : '') || 'http://127.0.0.1:5000';

const Transactions = () => {
  const [searchParams] = useSearchParams();
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState(searchParams.get('tab') || 'payments'); // 'payments' | 'refunds'

  // Super Admin Check & Selection States
  const userRole = (localStorage.getItem('userRole') || '').toLowerCase();
  const isSuperAdmin = userRole === 'super admin';
  const [selectedTxIds, setSelectedTxIds] = useState([]);
  const [selectedRefundIds, setSelectedRefundIds] = useState([]);
  const { confirmConfig, feedbackConfig, showConfirm, showFeedback, closeConfirm, closeFeedback } = useModals();

  // Refund states
  const [refunds, setRefunds] = useState([]);
  const [refundsLoading, setRefundsLoading] = useState(false);
  const [selectedRefund, setSelectedRefund] = useState(null);
  const [refundRemarks, setRefundRemarks] = useState('');
  const [refundActionLoading, setRefundActionLoading] = useState(false);
  const [refundConfirmModal, setRefundConfirmModal] = useState({ isOpen: false, refundId: null, status: null });

  // Filter States
  const [searchTerm, setSearchTerm] = useState('');
  const [filterPaymentMode, setFilterPaymentMode] = useState('All Modes');
  const [filterStatus, setFilterStatus] = useState(searchParams.get('status') || 'All Status');
  const [filterUserRole, setFilterUserRole] = useState('All');
  const [filterProgram, setFilterProgram] = useState('All');
  const [filterUserStatus, setFilterUserStatus] = useState('All');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState(new Date().toLocaleDateString('en-CA'));
  const [entriesPerPage, setEntriesPerPage] = useState(10);
  const [currentPage, setCurrentPage] = useState(1);
  const [isFilterDrawerOpen, setIsFilterDrawerOpen] = useState(false);
  const [sortConfig, setSortConfig] = useState({ key: 'date', direction: 'desc' });

  // Modal & Toast States
  const [selectedTx, setSelectedTx] = useState(null);
  const [adminNote, setAdminNote] = useState('');
  const [error, setError] = useState('');
  const [toast, setToast] = useState({ show: false, message: '', type: 'info' });
  const [zoomedImage, setZoomedImage] = useState(false);

  const navigate = useNavigate();

  const fetchTransactions = async () => {
    try {
      const res = await api.get('/transactions');
      setTransactions(res.data || []);
      if (res.data && res.data.length > 0) {
        setStartDate(prev => {
          if (!prev) {
            const oldest = new Date(Math.min(...res.data.map(t => new Date(t.date))));
            return oldest.toLocaleDateString('en-CA');
          }
          return prev;
        });
      }
    } catch (err) {
      console.error('Error fetching transactions:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchRefunds = async () => {
    try {
      setRefundsLoading(true);
      const res = await api.get('/refunds');
      setRefunds(res.data?.refunds || []);
    } catch (err) {
      console.error('Error fetching refunds:', err);
    } finally {
      setRefundsLoading(false);
    }
  };

  const [userMap, setUserMap] = useState({});

  useEffect(() => {
    const fetchUsers = async () => {
      const role = localStorage.getItem('userRole') || '';
      if (role.toLowerCase() !== 'super admin') return;

      try {
        const [stuRes, alumRes] = await Promise.all([
          api.get('/v1/students').catch(() => ({ data: { data: [] } })),
          api.get('/v1/alumni').catch(() => ({ data: { data: [] } }))
        ]);
        const users = [...(stuRes.data?.data || []), ...(alumRes.data?.data || [])];
        const map = {};
        users.forEach(u => { if (u.email) map[u.email] = u; });
        setUserMap(map);
      } catch (err) { console.error('Error fetching users:', err); }
    };
    fetchUsers();
    fetchTransactions();
    fetchRefunds();
  }, []);

  // Update active tab and filter status if URL changes
  useEffect(() => {
    const tab = searchParams.get('tab');
    if (tab) setActiveTab(tab);
    const status = searchParams.get('status');
    if (status) setFilterStatus(status);
  }, [searchParams]);

  // --- Deletion Handlers for Transactions ---
  const handleDeleteSingleTx = (tx) => {
    const id = tx.transactionId || tx._id;
    showConfirm({
      title: 'Delete Payment Transaction',
      message: `Are you sure you want to permanently delete transaction "${tx.transactionId}" (${tx.payerName || tx.name || 'User'})? This action cannot be undone.`,
      type: 'danger',
      confirmText: 'Delete Payment',
      onConfirm: async () => {
        try {
          await api.delete(`/transactions/${id}`);
          setTransactions(prev => prev.filter(t => t.transactionId !== tx.transactionId && t._id !== tx._id));
          setSelectedTxIds(prev => prev.filter(x => x !== tx.transactionId && x !== tx._id));
          showFeedback({
            title: 'Payment Deleted',
            message: `Transaction ${tx.transactionId} has been permanently deleted.`,
            type: 'success'
          });
        } catch (err) {
          console.error('Error deleting transaction:', err);
          showFeedback({
            title: 'Deletion Failed',
            message: err.response?.data?.message || 'Failed to delete transaction.',
            type: 'error'
          });
        }
      }
    });
  };

  const handleBulkDeleteTx = () => {
    if (selectedTxIds.length === 0) return;
    const count = selectedTxIds.length;
    showConfirm({
      title: 'Bulk Delete Payments',
      message: `Are you sure you want to permanently delete ${count} selected payment transaction(s)? This action cannot be undone.`,
      type: 'danger',
      confirmText: `Delete ${count} Payments`,
      onConfirm: async () => {
        try {
          const res = await api.post('/transactions/bulk-delete', { transactionIds: selectedTxIds });
          setTransactions(prev => prev.filter(t => !selectedTxIds.includes(t.transactionId) && !selectedTxIds.includes(t._id)));
          setSelectedTxIds([]);
          showFeedback({
            title: 'Bulk Deletion Completed',
            message: res.data?.message || `Successfully deleted ${count} transaction(s).`,
            type: 'success'
          });
        } catch (err) {
          console.error('Error bulk deleting transactions:', err);
          showFeedback({
            title: 'Bulk Deletion Failed',
            message: err.response?.data?.message || 'Failed to delete selected transactions.',
            type: 'error'
          });
        }
      }
    });
  };

  // --- Deletion Handlers for Refunds ---
  const handleDeleteSingleRefund = (refund) => {
    const id = refund.refundId || refund._id;
    showConfirm({
      title: 'Delete Refund Record',
      message: `Are you sure you want to permanently delete refund record "${refund.refundId || refund._id}"? This action cannot be undone.`,
      type: 'danger',
      confirmText: 'Delete Refund',
      onConfirm: async () => {
        try {
          await api.delete(`/refunds/${id}`);
          setRefunds(prev => prev.filter(r => r.refundId !== refund.refundId && r._id !== refund._id));
          setSelectedRefundIds(prev => prev.filter(x => x !== refund.refundId && x !== refund._id));
          showFeedback({
            title: 'Refund Record Deleted',
            message: `Refund ${refund.refundId || refund._id} has been permanently deleted.`,
            type: 'success'
          });
        } catch (err) {
          console.error('Error deleting refund:', err);
          showFeedback({
            title: 'Deletion Failed',
            message: err.response?.data?.message || 'Failed to delete refund record.',
            type: 'error'
          });
        }
      }
    });
  };

  const handleBulkDeleteRefunds = () => {
    if (selectedRefundIds.length === 0) return;
    const count = selectedRefundIds.length;
    showConfirm({
      title: 'Bulk Delete Refunds',
      message: `Are you sure you want to permanently delete ${count} selected refund record(s)? This action cannot be undone.`,
      type: 'danger',
      confirmText: `Delete ${count} Refunds`,
      onConfirm: async () => {
        try {
          const res = await api.post('/refunds/bulk-delete', { refundIds: selectedRefundIds });
          setRefunds(prev => prev.filter(r => !selectedRefundIds.includes(r.refundId) && !selectedRefundIds.includes(r._id)));
          setSelectedRefundIds([]);
          showFeedback({
            title: 'Bulk Deletion Completed',
            message: res.data?.message || `Successfully deleted ${count} refund record(s).`,
            type: 'success'
          });
        } catch (err) {
          console.error('Error bulk deleting refunds:', err);
          showFeedback({
            title: 'Bulk Deletion Failed',
            message: err.response?.data?.message || 'Failed to delete selected refund records.',
            type: 'error'
          });
        }
      }
    });
  };

  const triggerToast = (message, type = 'info') => {
    setToast({ show: true, message, type });
    setTimeout(() => {
      setToast({ show: false, message: '', type: 'info' });
    }, 4000);
  };

  const handleVerify = async (status) => {
    if (!selectedTx) return;
    try {
      const response = await api.put(`/transactions/${selectedTx.transactionId}/verify`, {
        status,
        adminRemarks: adminNote
      });

      if (response.data.success) {
        setTransactions(prev => prev.map(tx =>
          tx.transactionId === selectedTx.transactionId
            ? { ...tx, status, adminRemarks: adminNote }
            : tx
        ));
        setSelectedTx(null);
        setAdminNote('');
        triggerToast(`Payment marked as ${status}`, 'success');
      }
    } catch (err) {
      console.error('Verification error:', err);
      setError(err.response?.data?.message || 'Failed to update transaction status.');
    }
  };

  // Open confirmation modal for refund processing
  const handleProcessRefund = (refundId, status) => {
    setRefundConfirmModal({ isOpen: true, refundId, status });
  };

  // Execute refund action after confirmation
  const executeProcessRefund = async () => {
    const { refundId, status } = refundConfirmModal;
    if (!refundId || !status) return;

    try {
      setRefundActionLoading(true);
      const res = await api.put(`/transactions/refunds/${refundId}/process`, {
        status,
        adminRemarks: refundRemarks
      });

      if (res.data.success) {
        setRefunds(prev => prev.map(r =>
          (r.refundId === refundId || r._id === refundId)
            ? { ...r, status, processedBy: 'admin', processedAt: new Date() }
            : r
        ));

        // Update corresponding transaction status
        if (status === 'Approved') {
          const targetRefund = refunds.find(r => r.refundId === refundId || r._id === refundId);
          if (targetRefund) {
            setTransactions(prev => prev.map(t =>
              t.transactionId === targetRefund.transactionId
                ? { ...t, status: 'Refunded' }
                : t
            ));
          }
        }

        setSelectedRefund(null);
        setRefundRemarks('');
        setRefundConfirmModal({ isOpen: false, refundId: null, status: null });
        triggerToast(`Refund request ${status.toLowerCase()} successfully!`, 'success');
      }
    } catch (err) {
      console.error('Process refund error:', err);
      triggerToast(err.response?.data?.message || 'Failed to process refund', 'error');
    } finally {
      setRefundActionLoading(false);
    }
  };

  // Filter & Sort Logic
  const filteredTransactions = useMemo(() => {
    return transactions.filter(tx => {
      const name = (tx.payerName || tx.name || '').toLowerCase();
      const id = (tx.transactionId || '').toLowerCase();
      const ref = (tx.referenceNumber || '').toLowerCase();
      const payer = (tx.payerEmail || '').toLowerCase();
      const search = searchTerm.toLowerCase();

      const matchesSearch = name.includes(search) || id.includes(search) || ref.includes(search) || payer.includes(search);
      const matchesMode = filterPaymentMode === 'All Modes' || tx.paymentMode === filterPaymentMode;
      const matchesStatus = filterStatus === 'All Status' || tx.status === filterStatus;

      const user = userMap[tx.payerEmail] || {};
      const matchesRole = filterUserRole === 'All' || (user.role || 'student').toLowerCase() === filterUserRole.toLowerCase();
      const matchesProgram = filterProgram === 'All' || (user.programLevel || 'Bachelors').toLowerCase() === filterProgram.toLowerCase();
      const matchesUserStatus = filterUserStatus === 'All' || (user.status || 'Active').toLowerCase() === filterUserStatus.toLowerCase();

      let matchesDate = true;
      if (tx.date) {
        const txDate = new Date(tx.date).toLocaleDateString('en-CA');
        if (startDate && txDate < startDate) matchesDate = false;
        if (endDate && txDate > endDate) matchesDate = false;
      }

      return matchesSearch && matchesMode && matchesStatus && matchesRole && matchesProgram && matchesUserStatus && matchesDate;
    }).sort((a, b) => {
      let valA = a[sortConfig.key];
      let valB = b[sortConfig.key];

      if (sortConfig.key === 'date') {
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
  }, [transactions, searchTerm, filterPaymentMode, filterStatus, filterUserRole, filterProgram, filterUserStatus, startDate, endDate, userMap, sortConfig]);

  const totalPages = Math.ceil(filteredTransactions.length / entriesPerPage);
  const paginatedTransactions = filteredTransactions.slice(
    (currentPage - 1) * entriesPerPage,
    currentPage * entriesPerPage
  );

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, filterPaymentMode, filterStatus, filterUserRole, filterProgram, filterUserStatus, startDate, endDate, entriesPerPage]);

  const paymentModes = ['All Modes', 'GCash', 'Maya', 'GoThyme'];
  const statuses = ['All Status', 'Pending Verification', 'Completed', 'Needs Update', 'Rejected', 'Refunded'];

  const isCurrentTxPageAllSelected = paginatedTransactions.length > 0 && paginatedTransactions.every(t => selectedTxIds.includes(t.transactionId || t._id));
  const isCurrentRefundPageAllSelected = refunds.length > 0 && refunds.every(r => selectedRefundIds.includes(r.refundId || r._id));

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

        {/* Global Toast Notification */}
        {toast.show && (
          <div className="fixed top-5 left-1/2 -translate-x-1/2 z-[10001] flex items-center gap-3 px-6 py-3 rounded-2xl shadow-2xl bg-[#2c3543] text-white animate-fade-in border border-slate-700/50">
            <CheckCircle size={18} className="text-emerald-400" />
            <p className="font-bold text-xs tracking-wide">{toast.message}</p>
          </div>
        )}

        {/* 3D Segmented Tab Switcher */}
        <div className="flex items-center justify-between gap-3">
          <div className="inline-flex bg-slate-200/70 p-1 rounded-full border border-slate-200 shadow-inner">
            <button
              onClick={() => setActiveTab('payments')}
              className={`px-5 py-1.5 rounded-full text-xs font-extrabold transition-all cursor-pointer ${
                activeTab === 'payments'
                  ? 'bg-[#2c3543] text-white shadow-[0_2px_6px_rgba(0,0,0,0.25)] border-t border-white/20 scale-[1.02]'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-white/50'
              }`}
            >
              All Payments
            </button>
            <button
              onClick={() => setActiveTab('refunds')}
              className={`px-5 py-1.5 rounded-full text-xs font-extrabold transition-all cursor-pointer ${
                activeTab === 'refunds'
                  ? 'bg-[#2c3543] text-white shadow-[0_2px_6px_rgba(0,0,0,0.25)] border-t border-white/20 scale-[1.02]'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-white/50'
              }`}
            >
              Refund Requests
            </button>
          </div>
        </div>

        {/* ====== PAYMENTS TAB ====== */}
        {activeTab === 'payments' && (
          <div className="rounded-[22px] bg-white shadow-[0_8px_24px_rgba(0,0,0,0.03),0_2px_6px_rgba(0,0,0,0.02)] border border-slate-100/90 overflow-hidden">
            
            {/* Top Toolbar Section */}
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
                    <input
                      type="text"
                      className="w-56 sm:w-64 rounded-full border border-slate-200 bg-white py-1.5 pl-4 pr-3.5 text-[12px] font-medium outline-none focus:border-blue-500 shadow-2xs"
                      placeholder="Search by ID, Name, or Payer..."
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
              {isSuperAdmin && selectedTxIds.length > 0 && (
                <div className="flex items-center justify-between bg-blue-50/90 border border-blue-200 px-4 py-2.5 rounded-2xl animate-fade-in text-xs font-bold text-blue-900 shadow-xs">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="bg-blue-600 text-white w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-black">
                      {selectedTxIds.length}
                    </span>
                    <span>{selectedTxIds.length} payment{selectedTxIds.length > 1 ? 's' : ''} selected</span>
                    <button 
                      type="button" 
                      onClick={() => setSelectedTxIds(filteredTransactions.map(t => t.transactionId || t._id))}
                      className="text-blue-700 hover:text-blue-900 underline font-extrabold cursor-pointer ml-1"
                    >
                      Select all {filteredTransactions.length}
                    </button>
                    <button 
                      type="button" 
                      onClick={() => setSelectedTxIds([])}
                      className="text-slate-500 hover:text-slate-700 underline font-medium cursor-pointer ml-1"
                    >
                      Deselect all
                    </button>
                  </div>
                  <button
                    type="button"
                    onClick={handleBulkDeleteTx}
                    className="flex items-center gap-1.5 bg-red-600 hover:bg-red-700 text-white px-3.5 py-1.5 rounded-full font-bold shadow-xs hover:-translate-y-0.5 active:translate-y-0.5 transition-all cursor-pointer"
                  >
                    <Trash2 size={13} />
                    <span>Delete Selected ({selectedTxIds.length})</span>
                  </button>
                </div>
              )}

              <ActiveFilterChips 
                  filters={[
                      { label: 'Role', value: filterUserRole, key: 'filterUserRole' },
                      { label: 'Program', value: filterProgram, key: 'filterProgram' },
                      { label: 'User Status', value: filterUserStatus, key: 'filterUserStatus' },
                      { label: 'Payment Mode', value: filterPaymentMode, key: 'filterPaymentMode' },
                      { label: 'Status', value: filterStatus, key: 'filterStatus' },
                      { label: 'From', value: startDate, key: 'startDate' },
                      { label: 'To', value: endDate, key: 'endDate' },
                  ]}
                  onRemove={(key) => {
                      if (key === 'filterUserRole') setFilterUserRole('All');
                      if (key === 'filterProgram') setFilterProgram('All');
                      if (key === 'filterUserStatus') setFilterUserStatus('All');
                      if (key === 'filterPaymentMode') setFilterPaymentMode('All Modes');
                      if (key === 'filterStatus') setFilterStatus('All Status');
                      if (key === 'startDate') setStartDate('');
                      if (key === 'endDate') setEndDate('');
                  }}
              />
            </div>

            {/* Filter Drawer */}
            <FilterDrawer 
                isOpen={isFilterDrawerOpen} 
                onClose={() => setIsFilterDrawerOpen(false)}
                onClearAll={() => {
                  setFilterPaymentMode('All Modes');
                  setFilterStatus('All Status');
                  setFilterUserRole('All');
                  setFilterProgram('All');
                  setFilterUserStatus('All');
                  setStartDate('');
                  setEndDate(new Date().toLocaleDateString('en-CA'));
                  setSortConfig({ key: 'date', direction: 'desc' });
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
                                <option value="date">Payment Date</option>
                                <option value="transactionId">Transaction ID</option>
                                <option value="payerName">Payer Name</option>
                                <option value="amount">Amount</option>
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
                    
                    <div className="flex flex-col gap-1.5">
                      <label className="text-xs font-bold text-slate-700">Payment Mode:</label>
                      <select
                        aria-label="Filter by payment mode"
                        value={filterPaymentMode}
                        onChange={(e) => setFilterPaymentMode(e.target.value)}
                        className="border border-slate-200 rounded-xl px-3 py-2 text-xs bg-white outline-none focus:border-blue-500 text-slate-800"
                      >
                        {paymentModes.map(mode => <option key={mode} value={mode}>{mode}</option>)}
                      </select>
                    </div>

                    <div className="flex flex-col gap-1.5">
                      <label className="text-xs font-bold text-slate-700">Status:</label>
                      <select
                        aria-label="Filter by status"
                        value={filterStatus}
                        onChange={(e) => setFilterStatus(e.target.value)}
                        className="border border-slate-200 rounded-xl px-3 py-2 text-xs bg-white outline-none focus:border-blue-500 text-slate-800"
                      >
                        {statuses.map(s => <option key={s} value={s}>{s}</option>)}
                      </select>
                    </div>

                    <div className="flex flex-col gap-1.5">
                      <label className="text-xs font-bold text-slate-700">User Role:</label>
                      <select
                        aria-label="Filter by user role"
                        value={filterUserRole}
                        onChange={(e) => setFilterUserRole(e.target.value)}
                        className="border border-slate-200 rounded-xl px-3 py-2 text-xs bg-white outline-none focus:border-blue-500 text-slate-800"
                      >
                        <option value="All">All Users</option>
                        <option value="Student">Student</option>
                        <option value="Alumni">Alumni</option>
                      </select>
                    </div>

                    <div className="flex flex-col gap-1.5">
                      <label className="text-xs font-bold text-slate-700">Program Level:</label>
                      <select
                        aria-label="Filter by program level"
                        value={filterProgram}
                        onChange={(e) => setFilterProgram(e.target.value)}
                        className="border border-slate-200 rounded-xl px-3 py-2 text-xs bg-white outline-none focus:border-blue-500 text-slate-800"
                      >
                        <option value="All">All Programs</option>
                        <option value="Bachelors">Bachelors</option>
                        <option value="Masters">Masters</option>
                        <option value="Doctorate">Doctorate</option>
                      </select>
                    </div>

                    <div className="flex flex-col gap-1.5">
                      <label className="text-xs font-bold text-slate-700">User Status:</label>
                      <select
                        aria-label="Filter by user status"
                        value={filterUserStatus}
                        onChange={(e) => setFilterUserStatus(e.target.value)}
                        className="border border-slate-200 rounded-xl px-3 py-2 text-xs bg-white outline-none focus:border-blue-500 text-slate-800"
                      >
                        <option value="All">All Statuses</option>
                        <option value="Active">Active</option>
                        <option value="Inactive">Inactive</option>
                      </select>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-3 mt-1">
                        <div className="flex flex-col gap-1.5">
                            <label className="text-xs font-bold text-slate-700">Start Date:</label>
                            <input 
                                aria-label="Start date"
                                type="date" 
                                className="border border-slate-200 rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-blue-500 bg-white"
                                value={startDate}
                                onChange={(e) => setStartDate(e.target.value)}
                            />
                        </div>
                        <div className="flex flex-col gap-1.5">
                            <label className="text-xs font-bold text-slate-700">End Date:</label>
                            <input 
                                aria-label="End date"
                                type="date" 
                                className="border border-slate-200 rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-blue-500 bg-white"
                                value={endDate}
                                onChange={(e) => setEndDate(e.target.value)}
                            />
                        </div>
                    </div>
                </div>
            </FilterDrawer>

            {/* Table */}
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse table-auto">
                <thead>
                  <tr className="bg-slate-50/70 text-[11.5px] font-extrabold uppercase tracking-wider text-slate-500 border-b border-slate-100">
                    {isSuperAdmin && (
                      <th className="py-3.5 px-4 w-10 text-center">
                        <input 
                          type="checkbox"
                          aria-label="Select all payments on this page"
                          className="w-4 h-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500 cursor-pointer accent-blue-600"
                          checked={isCurrentTxPageAllSelected}
                          onChange={(e) => {
                            const pageIds = paginatedTransactions.map(tx => tx.transactionId || tx._id);
                            if (e.target.checked) {
                              setSelectedTxIds(prev => [...new Set([...prev, ...pageIds])]);
                            } else {
                              setSelectedTxIds(prev => prev.filter(id => !pageIds.includes(id)));
                            }
                          }}
                        />
                      </th>
                    )}
                    <th className="py-3.5 px-5">Payment ID</th>
                    <th className="py-3.5 px-5">Request ID</th>
                    <th className="py-3.5 px-5">Payer Name</th>
                    <th className="py-3.5 px-5">Type</th>
                    <th className="py-3.5 px-5">Amount</th>
                    <th className="py-3.5 px-5">Mode</th>
                    <th className="py-3.5 px-5">Date</th>
                    <th className="py-3.5 px-5 text-center">Status</th>
                    <th className="py-3.5 px-5 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-[12.5px]">
                  {loading ? (
                    <TableSkeleton columns={isSuperAdmin ? 10 : 9} rows={entriesPerPage || 10} />
                  ) : paginatedTransactions.length > 0 ? (
                    paginatedTransactions.map((tx, idx) => {
                      const txId = tx.transactionId || tx._id;
                      const isSelected = selectedTxIds.includes(txId);
                      const txDate = new Date(tx.date);
                      const formattedDate = txDate.toLocaleDateString('en-US', {
                        year: 'numeric', month: '2-digit', day: '2-digit'
                      });
                      return (
                        <tr key={tx._id || idx} className={`hover:bg-slate-50/80 transition-colors ${isSelected ? 'bg-blue-50/40' : ''}`}>
                          {isSuperAdmin && (
                            <td className="py-3.5 px-4 text-center align-middle" onClick={(e) => e.stopPropagation()}>
                              <input 
                                type="checkbox"
                                aria-label={`Select transaction ${tx.transactionId}`}
                                className="w-4 h-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500 cursor-pointer accent-blue-600"
                                checked={isSelected}
                                onChange={() => {
                                  setSelectedTxIds(prev => prev.includes(txId) ? prev.filter(x => x !== txId) : [...prev, txId]);
                                }}
                              />
                            </td>
                          )}
                          <td className="py-3.5 px-5 align-middle">
                            <span className="bg-slate-100 px-2 py-0.5 rounded-md text-slate-700 font-mono text-[11.5px] font-bold">
                              {tx.transactionId}
                            </span>
                          </td>
                          <td className="py-3.5 px-5 align-middle">
                            <span className="bg-slate-100 px-2 py-0.5 rounded-md text-slate-700 font-mono text-[11.5px]">
                              {tx.requestId}
                            </span>
                          </td>
                          <td className="py-3.5 px-5 align-middle text-[13px] font-bold text-slate-900">
                            {tx.payerName || tx.name}
                          </td>
                          <td className="py-3.5 px-5 align-middle text-[12.5px] text-slate-700 font-medium">
                            <span className="inline-flex items-center gap-1.5">
                              <i className="fa-solid fa-file-lines text-blue-500 text-xs"></i>
                              <span>{tx.documentType}</span>
                            </span>
                          </td>
                          <td className="py-3.5 px-5 align-middle text-slate-900 font-bold">
                            ₱{tx.amount || '0.00'}
                          </td>
                          <td className="py-3.5 px-5 align-middle">
                            <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${getPaymentModeStyle(tx.paymentMode)}`}>
                              {tx.paymentMode}
                            </span>
                          </td>
                          <td className="py-3.5 px-5 align-middle text-[12px] text-slate-500 font-medium">
                            {formattedDate}
                          </td>
                          <td className="py-3.5 px-5 align-middle text-center">
                            {tx.status === 'Completed' ? (
                              <span className="inline-flex items-center gap-1.5 py-0.5 px-3 rounded-full font-extrabold text-[10.5px] uppercase tracking-wider bg-emerald-50 text-emerald-700 border border-emerald-200/80">
                                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                                <span>Completed</span>
                              </span>
                            ) : tx.status === 'Pending Verification' ? (
                              <span className="inline-flex items-center gap-1.5 py-0.5 px-3 rounded-full font-extrabold text-[10.5px] uppercase tracking-wider bg-amber-50 text-amber-700 border border-amber-200/80">
                                <span className="w-1.5 h-1.5 rounded-full bg-amber-500"></span>
                                <span>Pending Verification</span>
                              </span>
                            ) : tx.status === 'Needs Update' ? (
                              <span className="inline-flex items-center gap-1.5 py-0.5 px-3 rounded-full font-extrabold text-[10.5px] uppercase tracking-wider bg-orange-50 text-orange-700 border border-orange-200/80">
                                <span className="w-1.5 h-1.5 rounded-full bg-orange-500"></span>
                                <span>Needs Update</span>
                              </span>
                            ) : tx.status === 'Refunded' ? (
                              <span className="inline-flex items-center gap-1.5 py-0.5 px-3 rounded-full font-extrabold text-[10.5px] uppercase tracking-wider bg-purple-50 text-purple-700 border border-purple-200/80">
                                <span className="w-1.5 h-1.5 rounded-full bg-purple-500"></span>
                                <span>Refunded</span>
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1.5 py-0.5 px-3 rounded-full font-extrabold text-[10.5px] uppercase tracking-wider bg-red-50 text-red-700 border border-red-200/80">
                                <span className="w-1.5 h-1.5 rounded-full bg-red-500"></span>
                                <span>{tx.status}</span>
                              </span>
                            )}
                          </td>
                          <td className="py-3.5 px-5 align-middle text-right">
                            <div className="flex items-center justify-end gap-1.5">
                              {tx.status === 'Pending Verification' ? (
                                <button
                                  onClick={() => { setSelectedTx(tx); setAdminNote(''); setError(''); }}
                                  className="bg-[#2c3543] hover:bg-[#1f2631] text-white py-1 px-3.5 rounded-full text-[11.5px] font-bold border-t border-white/20 border-b-2 border-black/50 shadow-[0_2px_5px_rgba(0,0,0,0.2)] hover:-translate-y-0.5 hover:shadow-[0_4px_8px_rgba(0,0,0,0.25)] active:translate-y-0.5 active:border-b-0 transition-all flex items-center gap-1.5 cursor-pointer"
                                >
                                  <Receipt size={12} />
                                  <span>Verify Receipt</span>
                                </button>
                              ) : (
                                <button
                                  onClick={() => navigate(`/transactions/${tx.transactionId}`)}
                                  className="bg-[#2c3543] hover:bg-[#1f2631] text-white py-1 px-3.5 rounded-full text-[11.5px] font-bold border-t border-white/20 border-b-2 border-black/50 shadow-[0_2px_5px_rgba(0,0,0,0.2)] hover:-translate-y-0.5 hover:shadow-[0_4px_8px_rgba(0,0,0,0.25)] active:translate-y-0.5 active:border-b-0 transition-all flex items-center gap-1.5 cursor-pointer"
                                >
                                  <Eye size={12} />
                                  <span>View Details</span>
                                </button>
                              )}
                              {isSuperAdmin && (
                                <button
                                  onClick={() => handleDeleteSingleTx(tx)}
                                  className="w-7 h-7 rounded-full bg-red-50 hover:bg-red-600 hover:text-white text-red-600 flex items-center justify-center transition-all shadow-2xs border border-red-200/60 hover:-translate-y-0.5 active:translate-y-0.5 cursor-pointer"
                                  title="Delete Payment"
                                  aria-label={`Delete payment ${tx.transactionId}`}
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
                      <td colSpan={isSuperAdmin ? 10 : 9} className="py-16 text-center text-slate-400 italic">
                        No payments found matching your filters.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
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
                        className={`w-7 h-7 rounded-lg text-xs transition-colors font-bold ${currentPage === pageNumber
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

        {/* ====== REFUND REQUESTS TAB ====== */}
        {activeTab === 'refunds' && (
          <div className="rounded-[22px] bg-white shadow-[0_8px_24px_rgba(0,0,0,0.03),0_2px_6px_rgba(0,0,0,0.02)] border border-slate-100/90 overflow-hidden">
            {/* Super Admin Bulk Action Toolbar for Refunds */}
            {isSuperAdmin && selectedRefundIds.length > 0 && (
              <div className="p-4 border-b border-slate-100 bg-slate-50/40">
                <div className="flex items-center justify-between bg-blue-50/90 border border-blue-200 px-4 py-2.5 rounded-2xl animate-fade-in text-xs font-bold text-blue-900 shadow-xs">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="bg-blue-600 text-white w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-black">
                      {selectedRefundIds.length}
                    </span>
                    <span>{selectedRefundIds.length} refund{selectedRefundIds.length > 1 ? 's' : ''} selected</span>
                    <button 
                      type="button" 
                      onClick={() => setSelectedRefundIds(refunds.map(r => r.refundId || r._id))}
                      className="text-blue-700 hover:text-blue-900 underline font-extrabold cursor-pointer ml-1"
                    >
                      Select all {refunds.length}
                    </button>
                    <button 
                      type="button" 
                      onClick={() => setSelectedRefundIds([])}
                      className="text-slate-500 hover:text-slate-700 underline font-medium cursor-pointer ml-1"
                    >
                      Deselect all
                    </button>
                  </div>
                  <button
                    type="button"
                    onClick={handleBulkDeleteRefunds}
                    className="flex items-center gap-1.5 bg-red-600 hover:bg-red-700 text-white px-3.5 py-1.5 rounded-full font-bold shadow-xs hover:-translate-y-0.5 active:translate-y-0.5 transition-all cursor-pointer"
                  >
                    <Trash2 size={13} />
                    <span>Delete Selected ({selectedRefundIds.length})</span>
                  </button>
                </div>
              </div>
            )}

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse table-auto">
                <thead>
                  <tr className="bg-slate-50/70 text-[11.5px] font-extrabold uppercase tracking-wider text-slate-500 border-b border-slate-100">
                    {isSuperAdmin && (
                      <th className="py-3.5 px-4 w-10 text-center">
                        <input 
                          type="checkbox"
                          aria-label="Select all refunds on this page"
                          className="w-4 h-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500 cursor-pointer accent-blue-600"
                          checked={isCurrentRefundPageAllSelected}
                          onChange={(e) => {
                            const refundIds = refunds.map(r => r.refundId || r._id);
                            if (e.target.checked) {
                              setSelectedRefundIds(prev => [...new Set([...prev, ...refundIds])]);
                            } else {
                              setSelectedRefundIds(prev => prev.filter(id => !refundIds.includes(id)));
                            }
                          }}
                        />
                      </th>
                    )}
                    <th className="py-3.5 px-5">Refund ID</th>
                    <th className="py-3.5 px-5">Transaction ID</th>
                    <th className="py-3.5 px-5">Name</th>
                    <th className="py-3.5 px-5">Amount</th>
                    <th className="py-3.5 px-5">Reason</th>
                    <th className="py-3.5 px-5">Date Submitted</th>
                    <th className="py-3.5 px-5 text-center">Status</th>
                    <th className="py-3.5 px-5 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-[12.5px]">
                  {refundsLoading ? (
                    <TableSkeleton columns={isSuperAdmin ? 9 : 8} rows={10} />
                  ) : refunds.length > 0 ? (
                    refunds.map((refund, idx) => {
                      const refundId = refund.refundId || refund._id;
                      const isSelected = selectedRefundIds.includes(refundId);
                      const refundDate = new Date(refund.createdAt);
                      const formattedDate = refundDate.toLocaleDateString('en-US', {
                        year: 'numeric', month: '2-digit', day: '2-digit'
                      });
                      
                      const relatedTx = transactions.find(t => t.transactionId === refund.transactionId || t._id === refund.transactionId);
                      const displayName = refund.accountName || refund.studentName || relatedTx?.payerName || relatedTx?.name || 'Unknown';

                      return (
                        <tr key={refund._id || idx} className={`hover:bg-slate-50/80 transition-colors ${isSelected ? 'bg-blue-50/40' : ''}`}>
                          {isSuperAdmin && (
                            <td className="py-3.5 px-4 text-center align-middle" onClick={(e) => e.stopPropagation()}>
                              <input 
                                type="checkbox"
                                aria-label={`Select refund ${refund.refundId || refund._id}`}
                                className="w-4 h-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500 cursor-pointer accent-blue-600"
                                checked={isSelected}
                                onChange={() => {
                                  setSelectedRefundIds(prev => prev.includes(refundId) ? prev.filter(x => x !== refundId) : [...prev, refundId]);
                                }}
                              />
                            </td>
                          )}
                          <td className="py-3.5 px-5 align-middle">
                            <span className="bg-slate-100 px-2 py-0.5 rounded-md text-slate-700 font-mono text-[11.5px] font-bold">
                              {refund.refundId || refund._id}
                            </span>
                          </td>
                          <td className="py-3.5 px-5 align-middle">
                            <span className="bg-slate-100 px-2 py-0.5 rounded-md text-slate-700 font-mono text-[11.5px]">
                              {refund.transactionId}
                            </span>
                          </td>
                          <td className="py-3.5 px-5 align-middle text-[13px] font-bold text-slate-900">{displayName}</td>
                          <td className="py-3.5 px-5 align-middle text-slate-900 font-bold">₱{refund.amount || '0.00'}</td>
                          <td className="py-3.5 px-5 align-middle text-slate-600">{refund.reason === 'Other' ? refund.otherReason : refund.reason}</td>
                          <td className="py-3.5 px-5 align-middle text-[12px] text-slate-500 font-medium">{formattedDate}</td>
                          <td className="py-3.5 px-5 align-middle text-center">
                            {refund.status?.toLowerCase() === 'approved' ? (
                              <span className="inline-flex items-center gap-1.5 py-0.5 px-3 rounded-full font-extrabold text-[10.5px] uppercase tracking-wider bg-emerald-50 text-emerald-700 border border-emerald-200/80">
                                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                                <span>Approved</span>
                              </span>
                            ) : refund.status?.toLowerCase() === 'pending' ? (
                              <span className="inline-flex items-center gap-1.5 py-0.5 px-3 rounded-full font-extrabold text-[10.5px] uppercase tracking-wider bg-amber-50 text-amber-700 border border-amber-200/80">
                                <span className="w-1.5 h-1.5 rounded-full bg-amber-500"></span>
                                <span>Pending</span>
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1.5 py-0.5 px-3 rounded-full font-extrabold text-[10.5px] uppercase tracking-wider bg-red-50 text-red-700 border border-red-200/80">
                                <span className="w-1.5 h-1.5 rounded-full bg-red-500"></span>
                                <span>{refund.status}</span>
                              </span>
                            )}
                          </td>
                          <td className="py-3.5 px-5 align-middle text-right">
                            <div className="flex items-center justify-end gap-1.5">
                              {refund.status?.toLowerCase() === 'pending' ? (
                                <button
                                  onClick={() => { setSelectedRefund(refund); setRefundRemarks(''); }}
                                  className="bg-[#2c3543] hover:bg-[#1f2631] text-white py-1 px-3.5 rounded-full text-[11.5px] font-bold border-t border-white/20 border-b-2 border-black/50 shadow-[0_2px_5px_rgba(0,0,0,0.2)] hover:-translate-y-0.5 hover:shadow-[0_4px_8px_rgba(0,0,0,0.25)] active:translate-y-0.5 active:border-b-0 transition-all flex items-center gap-1.5 cursor-pointer"
                                >
                                  <Eye size={12} />
                                  <span>Review</span>
                                </button>
                              ) : (
                                <span className="text-xs text-slate-400 italic">
                                  {refund.status === 'Approved' ? 'Approved' : 'Rejected'}
                                  {refund.processedBy && ` by ${refund.processedBy.split('@')[0]}`}
                                </span>
                              )}
                              {isSuperAdmin && (
                                <button
                                  onClick={() => handleDeleteSingleRefund(refund)}
                                  className="w-7 h-7 rounded-full bg-red-50 hover:bg-red-600 hover:text-white text-red-600 flex items-center justify-center transition-all shadow-2xs border border-red-200/60 hover:-translate-y-0.5 active:translate-y-0.5 cursor-pointer"
                                  title="Delete Refund"
                                  aria-label={`Delete refund ${refund.refundId || refund._id}`}
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
                      <td colSpan={isSuperAdmin ? 9 : 8} className="py-16 text-center text-slate-400 italic">
                        No refund requests found.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ====== RECEIPT VERIFICATION MODAL ====== */}
        {selectedTx && (
          <div className="fixed inset-0 z-[1000] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
            <div className="bg-white w-full max-w-4xl rounded-2xl shadow-2xl overflow-hidden">

              {/* Modal Header */}
              <div className="bg-[#1D2D44] p-6 text-white flex justify-between items-center">
                <div>
                  <h3 className="text-xl font-bold">Verify Payment Receipt</h3>
                  <p className="text-xs opacity-70 mt-1 uppercase tracking-widest font-semibold">
                    {selectedTx.transactionId} • {selectedTx.payerName || selectedTx.name} • via {selectedTx.paymentMode}
                  </p>
                </div>
                <button
                  onClick={() => setSelectedTx(null)}
                  className="text-white/60 hover:text-white transition-colors"
                >
                  <X size={24} />
                </button>
              </div>

              {/* Modal Body */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-6">

                {/* Left Column: Receipt Preview */}
                <div className="flex flex-col items-center justify-center bg-gray-50 border border-gray-100 rounded-xl p-4 min-h-[300px]">
                  {(selectedTx.imageUrl || selectedTx.receiptImage) ? (
                    <div className="relative group cursor-pointer" onClick={() => setZoomedImage(true)}>
                      <img
                        src={(selectedTx.imageUrl || selectedTx.receiptImage).startsWith('http') ? (selectedTx.imageUrl || selectedTx.receiptImage) : `${API_BASE}${selectedTx.receiptImage}`}
                        alt="Payment Receipt"
                        className="max-h-[350px] object-contain rounded-lg shadow-md transition-transform group-hover:scale-[1.02]"
                      />
                      <div className="absolute inset-0 bg-black/30 rounded-lg opacity-0 group-hover:opacity-100 flex items-center justify-center text-white font-bold text-xs gap-1.5 transition-opacity">
                        <ZoomIn size={16} /> Click to Enlarge
                      </div>
                    </div>
                  ) : (
                    <div className="text-center text-gray-400">
                      <ImageIcon size={48} className="mx-auto mb-2 opacity-40" />
                      <p className="text-xs font-semibold">No receipt image attached</p>
                    </div>
                  )}
                </div>

                {/* Right Column: Transaction Details & Decision */}
                <div className="flex flex-col justify-between">
                  <div className="space-y-4 text-xs">
                    <div className="grid grid-cols-2 gap-4 bg-gray-50 p-4 rounded-xl">
                      <div>
                        <span className="text-gray-400 font-bold block mb-1">AMOUNT DUE</span>
                        <span className="text-base font-black text-[#1D2D44]">₱{selectedTx.amount || '0.00'}</span>
                      </div>
                      <div>
                        <span className="text-gray-400 font-bold block mb-1">REFERENCE NUMBER</span>
                        <span className="font-mono text-gray-700 break-all font-semibold">{selectedTx.referenceNumber || 'N/A'}</span>
                      </div>
                      <div>
                        <span className="text-gray-400 font-bold block mb-1">DOCUMENT TYPE</span>
                        <span className="font-semibold text-gray-700">{selectedTx.documentType}</span>
                      </div>
                      <div>
                        <span className="text-gray-400 font-bold block mb-1">PAYMENT MODE</span>
                        <span className="font-semibold text-gray-700">{selectedTx.paymentMode}</span>
                      </div>
                    </div>

                    <div>
                      <label className="text-[11px] font-bold text-gray-500 uppercase tracking-wider block mb-1.5">
                        Admin Remarks / Note
                      </label>
                      <textarea
                        className="w-full h-24 p-3 border border-gray-200 rounded-xl text-xs outline-none focus:border-[#1D2D44] resize-none"
                        placeholder="Add remarks (optional for approval, required for rejection or update request)..."
                        value={adminNote}
                        onChange={(e) => setAdminNote(e.target.value)}
                      />
                    </div>

                    {error && (
                      <div className="p-3 bg-red-50 text-red-600 rounded-xl text-xs flex items-center gap-2">
                        <AlertCircle size={14} /> {error}
                      </div>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="flex gap-2 pt-4 border-t border-gray-100">
                    <button
                      onClick={() => handleVerify('Rejected')}
                      className="flex-1 py-2.5 rounded-xl border border-red-500 text-red-500 font-bold text-xs uppercase hover:bg-red-50 transition-all flex items-center justify-center gap-1"
                    >
                      <X size={14} /> Reject
                    </button>
                    <button
                      onClick={() => handleVerify('Needs Update')}
                      className="flex-1 py-2.5 rounded-xl border border-orange-500 text-orange-500 font-bold text-xs uppercase hover:bg-orange-50 transition-all flex items-center justify-center gap-1"
                    >
                      <RefreshCw size={14} /> Request Update
                    </button>
                    <button
                      onClick={() => handleVerify('Completed')}
                      className="flex-1 py-2.5 rounded-xl bg-green-600 text-white font-bold text-xs uppercase hover:bg-green-700 shadow-md flex items-center justify-center gap-1"
                    >
                      <CheckCircle size={14} /> Approve
                    </button>
                  </div>
                </div>

              </div>
            </div>
          </div>
        )}

        {/* ====== REFUND REVIEW MODAL ====== */}
        {selectedRefund && (
          <div className="fixed inset-0 z-[1000] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
            <div className="bg-white w-full max-w-lg rounded-2xl shadow-2xl overflow-hidden animate-scale-up">
              
              {/* Header */}
              <div className="bg-[#1D2D44] p-5 text-white flex justify-between items-center">
                <div>
                  <h3 className="text-lg font-bold">Review Refund Request</h3>
                  <p className="text-xs opacity-70 mt-0.5 uppercase tracking-widest font-semibold">
                    {selectedRefund.refundId || selectedRefund._id} • {selectedRefund.accountName || selectedRefund.studentName || 'Student'}
                  </p>
                </div>
                <button
                  onClick={() => setSelectedRefund(null)}
                  className="text-white/60 hover:text-white transition-colors"
                >
                  <X size={20} />
                </button>
              </div>

              {/* Body */}
              <div className="p-6 space-y-4 text-xs">
                <div className="grid grid-cols-2 gap-3 bg-gray-50 p-4 rounded-xl">
                  <div>
                    <span className="text-gray-400 font-bold block mb-0.5">REFUND AMOUNT</span>
                    <span className="text-base font-black text-[#1D2D44]">₱{selectedRefund.amount || '0.00'}</span>
                  </div>
                  <div>
                    <span className="text-gray-400 font-bold block mb-0.5">PAYMENT METHOD</span>
                    <span className="font-semibold text-gray-700">{selectedRefund.paymentMethod || selectedRefund.paymentMode || 'Original Method'}</span>
                  </div>
                  <div>
                    <span className="text-gray-400 font-bold block mb-0.5">ACCOUNT NAME</span>
                    <span className="font-semibold text-gray-700">{selectedRefund.accountName || selectedRefund.studentName || 'N/A'}</span>
                  </div>
                  <div>
                    <span className="text-gray-400 font-bold block mb-0.5">ACCOUNT NUMBER</span>
                    <span className="font-mono text-gray-700 font-semibold">{selectedRefund.accountNumber || 'N/A'}</span>
                  </div>
                </div>

                <div>
                  <span className="text-gray-400 font-bold block mb-1">REASON FOR REFUND</span>
                  <div className="p-3 bg-amber-50/60 border border-amber-200/60 rounded-xl text-amber-900 font-medium leading-relaxed">
                    {selectedRefund.reason === 'Other' ? (selectedRefund.otherReason || 'Other reason') : selectedRefund.reason}
                  </div>
                </div>

                <div>
                  <label className="text-[11px] font-bold text-gray-500 uppercase tracking-wider block mb-1.5">
                    Admin Remarks
                  </label>
                  <textarea
                    className="w-full h-24 p-4 border border-gray-200 rounded-xl text-sm outline-none focus:border-[#1D2D44] resize-none mb-4"
                    placeholder="Add remarks (optional for approval, recommended for rejection)..."
                    value={refundRemarks}
                    onChange={(e) => setRefundRemarks(e.target.value)}
                  />

                  <div className="flex gap-3">
                    {selectedRefund.status === 'Pending' ? (
                      <>
                        <button
                          onClick={() => handleProcessRefund(selectedRefund.refundId || selectedRefund._id, 'Rejected')}
                          disabled={refundActionLoading}
                          className="flex-1 py-3 rounded-xl border-2 border-red-500 text-red-500 font-bold text-sm uppercase hover:bg-red-50 transition-all flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer"
                        >
                          <XCircle size={16} /> Reject Refund
                        </button>
                        <button
                          onClick={() => handleProcessRefund(selectedRefund.refundId || selectedRefund._id, 'Approved')}
                          disabled={refundActionLoading}
                          className="flex-1 py-3 rounded-xl bg-green-600 text-white font-bold text-sm uppercase hover:bg-green-700 shadow-md flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer"
                        >
                          <CheckCircle size={16} /> Approve Refund
                        </button>
                      </>
                    ) : (
                      <button
                        onClick={() => handleProcessRefund(selectedRefund.refundId || selectedRefund._id, 'Pending')}
                        disabled={refundActionLoading}
                        className="flex-1 py-3 rounded-xl border-2 border-orange-500 text-orange-600 font-bold text-sm uppercase hover:bg-orange-50 transition-all flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer"
                      >
                        <Undo2 size={16} /> Revert to Pending
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ====== ZOOMED IMAGE OVERLAY ====== */}
        {zoomedImage && (selectedTx?.imageUrl || selectedTx?.receiptImage) && (
          <div className="fixed inset-0 bg-black/90 z-[10000] flex items-center justify-center p-4 backdrop-blur-sm animate-fade-in" onClick={() => setZoomedImage(false)}>
            <button className="absolute top-6 right-6 text-white/70 hover:text-white transition-colors">
              <X size={32} />
            </button>
            <img 
              src={(selectedTx.imageUrl || selectedTx.receiptImage).startsWith('http') ? (selectedTx.imageUrl || selectedTx.receiptImage) : `${API_BASE}${selectedTx.receiptImage}`} 
              alt="Receipt Zoomed" 
              className="max-w-[90vw] max-h-[90vh] object-contain rounded animate-scale-up shadow-2xl"
            />
          </div>
        )}

        <ConfirmModal
          isOpen={refundConfirmModal.isOpen}
          onClose={() => !refundActionLoading && setRefundConfirmModal({ isOpen: false, refundId: null, status: null })}
          onConfirm={executeProcessRefund}
          title={`Confirm ${refundConfirmModal.status}`}
          message={`Are you sure you want to ${refundConfirmModal.status === 'Pending' ? 'revert this refund to pending' : refundConfirmModal.status === 'Approved' ? 'approve this refund' : 'reject this refund'}?`}
          confirmText={refundConfirmModal.status === 'Pending' ? 'Revert to Pending' : `Yes, ${refundConfirmModal.status}`}
          cancelText="Cancel"
          type={refundConfirmModal.status === 'Rejected' ? 'danger' : refundConfirmModal.status === 'Approved' ? 'success' : 'warning'}
          isLoading={refundActionLoading}
        />

      </div>
    </Layout>
  );
};

// Helper: Payment Mode Badge Styles
function getPaymentModeStyle(mode) {
  switch (mode) {
    case 'GCash': return 'bg-[#E0F0FF] text-[#0070E0]';
    case 'Maya': return 'bg-[#E8F5E8] text-[#2E7D32]';
    case 'GoThyme': return 'bg-[#FFF3E0] text-[#E65100]';
    default: return 'bg-gray-100 text-gray-600';
  }
}

export default Transactions;
